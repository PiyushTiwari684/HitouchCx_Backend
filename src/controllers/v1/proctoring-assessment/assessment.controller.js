import prisma from "../../../config/db.js";
import { sendSuccess, sendError } from "../../../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import assessmentConfig from "../../../config/assessmentConfig.js";

/**
 * Background job to generate sections and questions for an assessment
 * Runs asynchronously without blocking the response
 */
async function generateAssessmentContent(assessmentId, assessmentType) {
  try {
    console.log(`[Background] Starting assessment content generation for ${assessmentId}`);

    const config = assessmentConfig[assessmentType];
    if (!config) {
      console.error(`[Background] Invalid assessmentType: ${assessmentType}`);
      return;
    }

    let sectionsWithQuestions = [];
    let warnings = [];

    // Create sections and map questions
    for (const sectionConf of config.sections) {
      const totalQuestions = sectionConf.rules.reduce((sum, r) => sum + r.count, 0);

      const section = await prisma.section.create({
        data: {
          assessmentId: assessmentId,
          name: sectionConf.name,
          description: `Section for ${sectionConf.name}`,
          orderIndex: sectionsWithQuestions.length + 1,
          durationMinutes: sectionConf.durationMinutes || 15,
          totalQuestions,
        },
      });

      let allQuestions = [];
      for (const rule of sectionConf.rules) {
        const questions = await prisma.question.findMany({
          where: {
            questionType: sectionConf.type,
            cefrLevel: { in: rule.cefrLevels },
            assessmentType: assessmentType,
            isActive: true,
          },
          take: rule.count,
        });

        if (questions.length < rule.count) {
          warnings.push(
            `Not enough questions for section "${sectionConf.name}" and CEFR [${rule.cefrLevels}]: found ${questions.length}, required ${rule.count}`,
          );
        }

        // Batch insert mapping - only if questions exist
        if (questions.length > 0) {
          await prisma.$transaction(
            questions.map((q) =>
              prisma.questionSection.create({
                data: { sectionId: section.id, questionId: q.id },
              }),
            ),
          );
        }
        allQuestions.push(
          ...questions.map((q) => ({
            id: q.id,
            questionType: q.questionType,
            cefrLevel: q.cefrLevel,
            questionText: q.questionText,
          })),
        );
      }
      sectionsWithQuestions.push({
        id: section.id,
        name: section.name,
        orderIndex: section.orderIndex,
        questions: allQuestions,
      });
    }

    // Update assessment status to ACTIVE when content is ready
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "ACTIVE" },
    });

    console.log(`[Background] Assessment content generation completed for ${assessmentId}`);
    if (warnings.length > 0) {
      console.warn(`[Background] Warnings:`, warnings);
    }
  } catch (error) {
    console.error(`[Background] Error generating assessment content:`, error);
    // Update assessment status to indicate failure
    await prisma.assessment
      .update({
        where: { id: assessmentId },
        data: { status: "DRAFT" },
      })
      .catch((err) => console.error("[Background] Failed to update assessment status:", err));
  }
}

/**
 * POST /api/v1/assessments/generate
 * Creates assessment and attempt record immediately, generates content in background
 * Protected route - requires authentication
 */
export const generateAssessment = asyncHandler(async (req, res) => {
  const { assessmentType = "LANGUAGE" } = req.body;
  let agentId = req.user.agentId; // From authMiddleware

  console.log("🔍 [generateAssessment] req.user:", req.user);
  console.log("🔍 [generateAssessment] agentId:", agentId);

  // If no agentId, create an Agent profile for this user
  if (!agentId) {
    console.log("⚠️ No agentId, looking up user:", req.user.id);
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { agent: true },
    });

    console.log("🔍 User lookup result:", user ? "Found" : "Not found");
    if (!user) return sendError(res, "User not found", 404);

    // Create agent if doesn't exist
    if (!user.agent) {
      const newAgent = await prisma.agent.create({
        data: {
          userId: user.id,
          firstName: user.firstName || "User",
          lastName: user.lastName || "",
          dob: new Date("2000-01-01"), // Default DOB, can be updated later
        },
      });
      agentId = newAgent.id;
    } else {
      agentId = user.agent.id;
    }
  }

  // Check if candidate exists (if agent has already started assessment before)
  let candidate = await prisma.candidate.findFirst({ where: { agentId } });

  // If no candidate yet, create one (Agent → Candidate transition)
  if (!candidate) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: { select: { email: true } } },
    });

    if (!agent) return sendError(res, "Agent profile not found", 404);

    candidate = await prisma.candidate.create({
      data: {
        agentId,
        email: agent.user.email,
        firstName: agent.firstName,
        lastName: agent.lastName || "",
      },
    });
  }

  const candidateId = candidate.id;

  const config = assessmentConfig[assessmentType];
  if (!config) return sendError(res, "Invalid assessmentType", 400);

  // 1. Create Assessment (minimal record)
  const assessment = await prisma.assessment.create({
    data: {
      title: `${assessmentType} Proficiency Test`,
      assessmentType,
      status: "DRAFT", // Will be updated to ACTIVE when content generation completes
      createdById: "admin-001",
      totalDuration: config.totalDuration || 45,
    },
  });

  // 2. Create CandidateAssessment record immediately
  const attempt = await prisma.candidateAssessment.create({
    data: {
      candidateId,
      assessmentId: assessment.id,
      attemptNumber: 1,
      sessionStatus: "NOT_STARTED",
      verificationStatus: "NOT_STARTED",
    },
  });

  // 3. Respond immediately with attemptId (non-blocking)
  sendSuccess(
    res,
    {
      assessmentId: assessment.id,
      attemptId: attempt.id,
    },
    "Assessment generation started",
  );

  // 4. Generate sections and questions in background (fire-and-forget)
  generateAssessmentContent(assessment.id, assessmentType).catch((error) => {
    console.error("[Background] Unhandled error in assessment generation:", error);
  });
});

/**
 * POST /api/v1/assessments/start
 * Creates a CandidateAssessment attempt (if allow attempts remain)
 * Protected route - requires authentication
 */
export const startAssessment = asyncHandler(async (req, res) => {
  const { assessmentId } = req.body;
  const agentId = req.user.agentId; // ✅ CHANGED: From req.user (authMiddleware), not req.candidate

  // VALIDATION: Check if assessmentId provided
  if (!assessmentId) return sendError(res, "assessmentId is required", 400);

  // This is where the Agent → Candidate transition happens
  // First time: Creates candidate. Retry: Uses existing candidate.

  let candidate = await prisma.candidate.findUnique({
    where: { agentId },
  });

  if (!candidate) {
    // 🆕 FIRST TIME - Create candidate from agent
    console.log(`[startAssessment] Creating candidate for agentId: ${agentId}`);

    // Get agent details with user info
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!agent) {
      return sendError(res, "Agent profile not found. Please complete registration first.", 404);
    }

    // Create candidate record (Agent → Candidate transition)
    candidate = await prisma.candidate.create({
      data: {
        agentId: agentId,
        email: agent.user.email,
        firstName: agent.user.firstName,
        lastName: agent.user.lastName,
      },
    });

    console.log(`✅ Candidate created: ${candidate.id} (from Agent: ${agentId})`);
  } else {
    // ♻️ RETRY - Candidate already exists
    console.log(`[startAssessment] Using existing candidate: ${candidate.id}`);
  }

  // Now we have candidateId for sure
  const candidateId = candidate.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    return sendError(res, "Assessment not found", 404);
  }

  // Get all previous attempts for this candidate + assessment
  const existingAttempts = await prisma.candidateAssessment.findMany({
    where: {
      candidateId: candidateId, // ✅ NOW DEFINED
      assessmentId: assessmentId,
    },
  });

  if (existingAttempts.length >= assessment.maxAttempts) {
    return sendError(
      res,
      `Maximum attempts (${assessment.maxAttempts}) exceeded for this assessment`,
      400,
    );
  }

  const attempt = await prisma.candidateAssessment.create({
    data: {
      candidateId: candidateId,
      assessmentId: assessmentId,
      attemptNumber: existingAttempts.length + 1,
      sessionStatus: "NOT_STARTED",
      verificationStatus: "NOT_STARTED",
      startedAt: new Date(),
    },
  });

  console.log(`✅ Assessment attempt created: ${attempt.id} (attempt #${attempt.attemptNumber})`);

  return sendSuccess(
    res,
    {
      candidateId: attempt.candidateId,
      attemptId: attempt.id,
      assessmentId: attempt.assessmentId,
      attemptNumber: attempt.attemptNumber,
      sessionStatus: attempt.sessionStatus,
      maxAttempts: assessment.maxAttempts,
      attemptsRemaining: assessment.maxAttempts - attempt.attemptNumber,
    },
    "Assessment started successfully",
    201,
  );
});

/**
 * GET /api/v1/assessments/:assessmentId/attempt/:attemptId
 * Fetch full assessment with sections and questions for a specific attempt
 * Protected route - requires authentication
 */
export const getAssessmentForAttempt = asyncHandler(async (req, res) => {
  const { assessmentId, attemptId } = req.params;

  if (!assessmentId || !attemptId) {
    return sendError(res, "assessmentId and attemptId are required", 400);
  }

  // 1. Verify candidate attempt exists and get candidateId
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: {
                include: {
                  question: true, // Include full question details
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return sendError(res, "Assessment attempt not found", 404);
  }

  const candidateId = attempt.candidateId;

  // 2. Verify this attempt belongs to the authenticated user's agent
  const agentId = req.user.agentId;
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { agentId: true },
  });

  if (!candidate || candidate.agentId !== agentId) {
    return sendError(res, "Unauthorized access to this assessment", 403);
  }

  if (attempt.assessmentId !== assessmentId) {
    return sendError(res, "Assessment ID mismatch", 400);
  }

  // 3. Transform data for frontend
  const sections = attempt.assessment.sections.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    orderIndex: section.orderIndex,
    durationMinutes: section.durationMinutes,
    totalQuestions: section.totalQuestions,
    questions: section.questions.map((qs) => ({
      id: qs.question.id,
      questionType: qs.question.questionType,
      cefrLevel: qs.question.cefrLevel,
      taskLevel: qs.question.taskLevel,
      questionText: qs.question.questionText,
      options: qs.question.options, // For MCQ
      mediaUrl: qs.question.mediaUrl, // If any
    })),
  }));

  // 3. Return assessment data
  return sendSuccess(
    res,
    {
      assessmentId: attempt.assessment.id,
      attemptId: attempt.id,
      title: attempt.assessment.title,
      description: attempt.assessment.description,
      totalDuration: attempt.assessment.totalDuration,
      attemptNumber: attempt.attemptNumber,
      sessionStatus: attempt.sessionStatus,
      sections,
    },
    "Assessment fetched successfully",
  );
});

/**
 * GET /api/v1/assessments/attempt/:attemptId
 * Get candidate assessment attempt details (including assessmentId)
 * Protected route - requires authentication
 */
export const getAttemptDetails = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  if (!attemptId) {
    return sendError(res, "attemptId is required", 400);
  }

  // Fetch the attempt
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      assessmentId: true,
      candidateId: true,
      attemptNumber: true,
      sessionStatus: true,
      verificationStatus: true,
    },
  });

  if (!attempt) {
    return sendError(res, "Assessment attempt not found", 404);
  }

  // Verify this attempt belongs to the authenticated user's agent
  const agentId = req.user.agentId;
  const candidate = await prisma.candidate.findUnique({
    where: { id: attempt.candidateId },
    select: { agentId: true },
  });

  if (!candidate || candidate.agentId !== agentId) {
    return sendError(res, "Unauthorized access to this assessment attempt", 403);
  }

  return sendSuccess(res, attempt, "Attempt details fetched successfully");
});

// log violation controller function

export const logViolation = asyncHandler(async (req, res) => {
  const { assessmentId, attemptId } = req.params;
  const { type, timestamp, details, severity, count } = req.body;

  console.log("[logViolation] Logging violation:", {
    attemptId,
    type,
    severity,
    count,
  });

  try {
    // Get candidateId from attemptId
    const attempt = await prisma.candidateAssessment.findUnique({
      where: { id: attemptId },
      select: { candidateId: true },
    });

    if (!attempt) {
      return sendError(res, "Assessment attempt not found", 404);
    }

    const candidateId = attempt.candidateId;

    // Get the proctoring session
    const session = await prisma.proctoringSession.findFirst({
      where: { attemptId },
      orderBy: { sessionStartedAt: "desc" },
    });

    if (!session) {
      return sendError(res, "Proctoring session not found", 404);
    }

    // Create violation log
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

    // Update session violation counts
    await prisma.proctoringSession.update({
      where: { id: session.id },
      data: {
        totalViolations: { increment: 1 },
        criticalViolations: severity === "CRITICAL" ? { increment: 1 } : undefined,
      },
    });

    return sendSuccess(res, { violation }, "Violation logged successfully");
  } catch (error) {
    console.error("[logViolation] Error:", error);
    throw error;
  }
});
