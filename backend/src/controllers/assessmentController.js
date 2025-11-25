import prisma from "../config/db.js";
import { sendSuccess, sendError } from "../utils/response.js";
import asyncHandler from "express-async-handler";
import assessmentConfig from "../config/assessmentConfig.js";

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
        }
      });

      let allQuestions = [];
      for (const rule of sectionConf.rules) {
        const questions = await prisma.question.findMany({
          where: {
            questionType: sectionConf.type,
            cefrLevel: { in: rule.cefrLevels },
            assessmentType: assessmentType,
            isActive: true
          },
          take: rule.count
        });

        if (questions.length < rule.count) {
          warnings.push(
            `Not enough questions for section "${sectionConf.name}" and CEFR [${rule.cefrLevels}]: found ${questions.length}, required ${rule.count}`
          );
        }

        // Batch insert mapping - only if questions exist
        if (questions.length > 0) {
          await prisma.$transaction(
            questions.map(q =>
              prisma.questionSection.create({
                data: { sectionId: section.id, questionId: q.id }
              })
            )
          );
        }
        allQuestions.push(...questions.map(q => ({
          id: q.id,
          questionType: q.questionType,
          cefrLevel: q.cefrLevel,
          questionText: q.questionText,
        })));
      }
      sectionsWithQuestions.push({
        id: section.id,
        name: section.name,
        orderIndex: section.orderIndex,
        questions: allQuestions
      });
    }

    // Update assessment status to ACTIVE when content is ready
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "ACTIVE" }
    });

    console.log(`[Background] Assessment content generation completed for ${assessmentId}`);
    if (warnings.length > 0) {
      console.warn(`[Background] Warnings:`, warnings);
    }
  } catch (error) {
    console.error(`[Background] Error generating assessment content:`, error);
    // Update assessment status to indicate failure
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "DRAFT" }
    }).catch(err => console.error('[Background] Failed to update assessment status:', err));
  }
}

/**
 * POST /api/v1/assessments/generate
 * Creates assessment and attempt record immediately, generates content in background
 * Protected route - requires authentication
 */
export const generateAssessment = asyncHandler(async (req, res) => {
  const { assessmentType = "LANGUAGE" } = req.body;
  const candidateId = req.candidate.id; // From JWT token via authenticateCandidate middleware

  // Validate candidate
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return sendError(res, "Candidate not found", 404);

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
    }
  });

  // 2. Create CandidateAssessment record immediately
  const attempt = await prisma.candidateAssessment.create({
    data: {
      candidateId,
      assessmentId: assessment.id,
      attemptNumber: 1,
      sessionStatus: "NOT_STARTED",
      verificationStatus: "NOT_STARTED",
    }
  });

  // 3. Respond immediately with attemptId (non-blocking)
  sendSuccess(
    res,
    {
      assessmentId: assessment.id,
      attemptId: attempt.id,
    },
    "Assessment generation started"
  );

  // 4. Generate sections and questions in background (fire-and-forget)
  generateAssessmentContent(assessment.id, assessmentType)
    .catch(error => {
      console.error('[Background] Unhandled error in assessment generation:', error);
    });
});

/**
 * POST /api/v1/assessments/start
 * Creates a CandidateAssessment attempt (if allow attempts remain)
 * Protected route - requires authentication
 */
export const startAssessment = asyncHandler(async (req, res) => {
  const { assessmentId } = req.body;
  const candidateId = req.candidate.id; // From JWT token

  if (!assessmentId) return sendError(res, "assessmentId is required", 400);

  // 1. CHECK IF ASSESSMENT EXISTS
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) return sendError(res, "Assessment not found", 404);

  // 2. CHECK MAX ATTEMPTS NOT EXCEEDED
  const existingAttempts = await prisma.candidateAssessment.findMany({
    where: { candidateId, assessmentId },
  });

  if (existingAttempts.length >= assessment.maxAttempts) {
    return sendError(
      res,
      `Maximum attempts (${assessment.maxAttempts}) exceeded for this assessment`,
      400
    );
  }

  // 3. CREATE NEW CANDIDATE ASSESSMENT
  const attempt = await prisma.candidateAssessment.create({
    data: {
      candidateId,
      assessmentId,
      attemptNumber: existingAttempts.length + 1,
      sessionStatus: "NOT_STARTED",
      verificationStatus: "NOT_STARTED",
      startedAt: new Date(),
    },
  });

  // 4. RESPOND
  return sendSuccess(
    res,
    {
      attemptId: attempt.id,
      assessmentId: attempt.assessmentId,
      candidateId: attempt.candidateId,
      attemptNumber: attempt.attemptNumber,
      sessionStatus: attempt.sessionStatus,
    },
    "Assessment started successfully",
    201
  );
});

/**
 * GET /api/v1/assessments/:assessmentId/attempt/:attemptId
 * Fetch full assessment with sections and questions for a specific attempt
 * Protected route - requires authentication
 */
export const getAssessmentForAttempt = asyncHandler(async (req, res) => {
  const { assessmentId, attemptId } = req.params;
  const candidateId = req.candidate.id; // From JWT token

  if (!assessmentId || !attemptId) {
    return sendError(res, "assessmentId and attemptId are required", 400);
  }

  // 1. Verify candidate attempt exists and belongs to this candidate
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

  if (attempt.candidateId !== candidateId) {
    return sendError(res, "Unauthorized access to this assessment", 403);
  }

  if (attempt.assessmentId !== assessmentId) {
    return sendError(res, "Assessment ID mismatch", 400);
  }

  // 2. Transform data for frontend
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
    "Assessment fetched successfully"
  );
});

/**
 * GET /api/v1/assessments/attempt/:attemptId
 * Get candidate assessment attempt details (including assessmentId)
 * Protected route - requires authentication
 */
export const getAttemptDetails = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const candidateId = req.candidate.id; // From JWT token

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

  // Verify the attempt belongs to the authenticated candidate
  if (attempt.candidateId !== candidateId) {
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
        candidateId: req.candidate.id,
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
        criticalViolations:
          severity === "CRITICAL" ? { increment: 1 } : undefined,
      },
    });

    return sendSuccess(res, { violation }, "Violation logged successfully");
  } catch (error) {
    console.error("[logViolation] Error:", error);
    throw error;
  }
});
