import prisma from "../../config/db.js";

/**
 * Violation Service
 * Handles all proctoring violation logging and tracking
 */

/**
 * Get or create a proctoring session for an attempt
 * Helper function used by violation logging
 *
 * @param {string} candidateId - The candidate ID
 * @param {string} assessmentId - The assessment ID
 * @param {string} attemptId - The attempt ID
 * @returns {Promise<Object>} Proctoring session object
 */
export async function getOrCreateProctoringSession(candidateId, assessmentId, attemptId) {
  // Try to find existing session
  let session = await prisma.proctoringSession.findFirst({
    where: { attemptId },
    orderBy: { sessionStartedAt: "desc" },
    select: {
      id: true,
      totalViolations: true,
      lowViolations: true,
      mediumViolations: true,
      highViolations: true,
    },
  });

  // If session doesn't exist, create new one
  if (!session) {
    console.log("[ViolationService] Creating new proctoring session");
    session = await prisma.proctoringSession.create({
      data: {
        candidateId,
        assessmentId,
        attemptId,
        sessionStatus: "IN_PROGRESS",
        sessionStartedAt: new Date(),
        totalViolations: 0,
        lowViolations: 0,
        mediumViolations: 0,
        highViolations: 0,
      },
    });
  }

  return session;
}

/**
 * Log a single violation for an attempt
 *
 * @param {string} assessmentId - The assessment ID
 * @param {string} attemptId - The attempt ID
 * @param {Object} violationData - Violation details { type, timestamp, details, severity, count }
 * @param {string} userId - The user ID (for ownership validation)
 * @returns {Promise<Object>} Created violation log
 * @throws {Error} If attempt not found or unauthorized
 */
export async function logSingleViolation(assessmentId, attemptId, violationData, userId) {
  const { type, timestamp, details, severity, count } = violationData;

  console.log("[ViolationService] Logging violation:", {
    attemptId,
    type,
    severity,
    count,
  });

  // Step 1: Get candidateId from attemptId and verify ownership
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      candidateId: true,
      candidate: {
        select: {
          agentId: true,
          agent: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found");
  }

  // Step 2: Verify ownership
  if (attempt.candidate.agent.userId !== userId) {
    throw new Error("Unauthorized: This attempt belongs to another user");
  }

  const candidateId = attempt.candidateId;

  // Step 3: Get or create proctoring session
  const session = await getOrCreateProctoringSession(candidateId, assessmentId, attemptId);

  // Step 4: Create violation log
  const violation = await prisma.proctoringLog.create({
    data: {
      sessionId: session.id,
      candidateId: candidateId,
      eventType: "VIOLATION",
      violationType: type,
      severity: severity || "MEDIUM",
      isViolation: true,
      countsTowardLimit: severity === "CRITICAL" || severity === "HIGH",
      timestamp: new Date(timestamp),
      metadata: {
        ...details,
        violationNumber: count,
      },
    },
  });

  // Step 5: Update session violation counts
  await prisma.proctoringSession.update({
    where: { id: session.id },
    data: {
      totalViolations: { increment: 1 },
      criticalViolations: severity === "CRITICAL" ? { increment: 1 } : undefined,
    },
  });

  return { violation };
}

/**
 * Get violation summary for an attempt
 * Returns current violation counts from proctoring session
 *
 * @param {string} attemptId - The attempt ID
 * @param {string} userId - The user ID (for ownership validation)
 * @returns {Promise<Object>} Violation summary with counts
 * @throws {Error} If attempt not found or unauthorized
 */
export async function getViolationSummary(attemptId, userId) {
  console.log("[ViolationService] Getting violation summary:", { attemptId, userId });

  // Step 1: Get attempt and verify ownership
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      candidateId: true,
      candidate: {
        select: {
          agentId: true,
          agent: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found");
  }

  // Step 2: Verify ownership
  if (attempt.candidate.agent.userId !== userId) {
    throw new Error("Unauthorized: This attempt belongs to another user");
  }

  // Step 3: Get proctoring session with violation counts
  const session = await prisma.proctoringSession.findFirst({
    where: { attemptId },
    orderBy: { sessionStartedAt: "desc" },
    select: {
      id: true,
      totalViolations: true,
      lowViolations: true,
      mediumViolations: true,
      highViolations: true,
      isAutoSubmitted: true,
    },
  });

  // If no session yet, return zeros
  if (!session) {
    return {
      sessionId: null,
      totalViolations: 0,
      lowViolations: 0,
      mediumViolations: 0,
      highViolations: 0,
      isAutoSubmitted: false,
    };
  }

  console.log("[ViolationService] Found session:", session);

  return {
    sessionId: session.id,
    totalViolations: session.totalViolations,
    lowViolations: session.lowViolations,
    mediumViolations: session.mediumViolations,
    highViolations: session.highViolations,
    isAutoSubmitted: session.isAutoSubmitted,
  };
}

/**
 * Log multiple violations in batch with deduplication
 * Efficient batch processing for frontend violation queues
 *
 * @param {string} assessmentId - The assessment ID
 * @param {string} attemptId - The attempt ID
 * @param {Array} violations - Array of violation objects
 * @param {string} userId - The user ID (for ownership validation)
 * @returns {Promise<Object>} Batch result with counts and auto-submit flag
 * @throws {Error} If validation fails or unauthorized
 */
export async function logViolationBatch(assessmentId, attemptId, violations, userId) {
  console.log("[ViolationService] Batch request:", {
    attemptId,
    assessmentId,
    userId,
    count: violations?.length,
  });

  // ===== VALIDATION PHASE =====

  // Step 1: Validate violations array
  if (!violations || !Array.isArray(violations)) {
    throw new Error("Violations must be an array");
  }

  if (violations.length === 0) {
    throw new Error("Violations array cannot be empty");
  }

  // Step 2: Validate batch size limit (max 100)
  if (violations.length > 100) {
    throw new Error(
      `Batch size exceeds limit. Maximum 100 violations allowed, received ${violations.length}`
    );
  }

  // Step 3: Validate each violation has required fields
  for (let i = 0; i < violations.length; i++) {
    const v = violations[i];
    if (!v.type || !v.timestamp || !v.severity) {
      throw new Error(
        `Violation at index ${i} is missing required fields (type, timestamp, severity)`
      );
    }

    // Validate severity values
    const validSeverities = ["LOW", "MEDIUM", "HIGH"];
    if (!validSeverities.includes(v.severity)) {
      throw new Error(
        `Invalid severity "${v.severity}" at index ${i}. Must be LOW, MEDIUM, or HIGH`
      );
    }
  }

  // ===== LOOKUP PHASE (Do once, reuse for all) =====

  // Step 4: Get attempt and verify ownership
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      candidateId: true,
      assessmentId: true,
      candidate: {
        select: {
          agentId: true,
          agent: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found");
  }

  // Step 5: Verify ownership
  if (attempt.candidate.agent.userId !== userId) {
    throw new Error("Unauthorized: This attempt belongs to another user");
  }

  // Step 6: Verify assessmentId matches
  if (attempt.assessmentId !== assessmentId) {
    throw new Error("Assessment ID mismatch");
  }

  const candidateId = attempt.candidateId;

  // Step 7: Get or create proctoring session
  const session = await getOrCreateProctoringSession(candidateId, assessmentId, attemptId);

  // ===== DUPLICATE DETECTION PHASE =====

  // Step 8: Get recent violations from last 2 seconds for duplicate detection
  const twoSecondsAgo = new Date(Date.now() - 2000);
  const recentViolations = await prisma.proctoringLog.findMany({
    where: {
      sessionId: session.id,
      timestamp: { gte: twoSecondsAgo },
      isViolation: true,
    },
    select: {
      violationType: true,
      timestamp: true,
    },
  });

  // Step 9: Filter out duplicates
  const uniqueViolations = violations.filter((v) => {
    const vTime = new Date(v.timestamp).getTime();

    const isDuplicate = recentViolations.some((rv) => {
      const rvTime = new Date(rv.timestamp).getTime();
      const timeDiff = Math.abs(vTime - rvTime);

      // Same type within 1 second = duplicate
      return rv.violationType === v.type && timeDiff < 1000;
    });

    return !isDuplicate;
  });

  console.log("[ViolationService] Duplicate detection:", {
    original: violations.length,
    unique: uniqueViolations.length,
    filtered: violations.length - uniqueViolations.length,
  });

  // If all duplicates, return early
  if (uniqueViolations.length === 0) {
    return {
      logged: 0,
      duplicates: violations.length,
      sessionId: session.id,
      totalViolations: session.totalViolations,
      lowViolations: session.lowViolations,
      mediumViolations: session.mediumViolations,
      highViolations: session.highViolations,
      shouldAutoSubmit: false,
    };
  }

  // ===== TRANSACTION PHASE =====

  const result = await prisma.$transaction(async (tx) => {
    // Step 10: Prepare violation data
    const violationData = uniqueViolations.map((v) => ({
      sessionId: session.id,
      candidateId: candidateId,
      eventType: "VIOLATION",
      violationType: v.type,
      severity: v.severity,
      isViolation: true,
      countsTowardLimit: v.severity === "MEDIUM" || v.severity === "HIGH",
      timestamp: new Date(v.timestamp),
      metadata: v.details || {},
    }));

    // Step 11: Insert all violations
    const createResult = await tx.proctoringLog.createMany({
      data: violationData,
      skipDuplicates: true,
    });

    // Step 12: Calculate increments by severity
    const lowIncrement = uniqueViolations.filter((v) => v.severity === "LOW").length;
    const mediumIncrement = uniqueViolations.filter((v) => v.severity === "MEDIUM").length;
    const highIncrement = uniqueViolations.filter((v) => v.severity === "HIGH").length;

    // Step 13: Update session counts
    const updatedSession = await tx.proctoringSession.update({
      where: { id: session.id },
      data: {
        totalViolations: { increment: uniqueViolations.length },
        lowViolations: { increment: lowIncrement },
        mediumViolations: { increment: mediumIncrement },
        highViolations: { increment: highIncrement },
      },
    });

    // Step 14: Check if should auto-submit
    const shouldAutoSubmit =
      updatedSession.mediumViolations >= 10 || updatedSession.highViolations >= 5;

    return {
      logged: createResult.count,
      duplicates: violations.length - uniqueViolations.length,
      sessionId: session.id,
      totalViolations: updatedSession.totalViolations,
      lowViolations: updatedSession.lowViolations,
      mediumViolations: updatedSession.mediumViolations,
      highViolations: updatedSession.highViolations,
      shouldAutoSubmit,
    };
  });

  console.log("[ViolationService] Success:", result);

  return result;
}
