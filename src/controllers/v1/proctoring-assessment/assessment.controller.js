import prisma from "../../../config/db.js";
import { sendSuccess, sendError } from "../../../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import assessmentConfig from "../../../config/assessmentConfig.js";
import * as candidateService from "../../../services/proctoring-assessment/candidate.service.js";
import * as attemptService from "../../../services/proctoring-assessment/attempt.service.js";
import * as violationService from "../../../services/proctoring-assessment/violation.service.js";
import { generateAssessmentContent } from "../../../jobs/assessmentContentGenerator.js";

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
    try {
      agentId = await candidateService.getOrCreateAgent(req.user.id);
    } catch (error) {
      return sendError(res, error.message, 404);
    }
  }

  // Get or create candidate (Agent → Candidate transition)
  let candidate;
  try {
    candidate = await candidateService.getOrCreateCandidate(agentId);
  } catch (error) {
    return sendError(res, error.message, 404);
  }

  const candidateId = candidate.id;

  const config = assessmentConfig[assessmentType];
  if (!config) return sendError(res, "Invalid assessmentType", 400);

  console.log("🔍 [generateAssessment] Creating assessment with userId:", req.user.id);

  // 1. Create Assessment (minimal record)
  const assessment = await prisma.assessment.create({
    data: {
      title: `${assessmentType} Proficiency Test`,
      assessmentType,
      status: "DRAFT", // Will be updated to ACTIVE when content generation completes
      createdById: process.env.SYSTEM_ADMIN_ID, // System-generated assessment
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
  let candidate;
  try {
    candidate = await candidateService.getOrCreateCandidate(agentId);
  } catch (error) {
    return sendError(res, error.message, 404);
  }

  const candidateId = candidate.id;

  // Create attempt using service
  let attemptData;
  try {
    attemptData = await attemptService.createAttempt(candidateId, assessmentId);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return sendError(res, error.message, statusCode);
  }

  return sendSuccess(res, attemptData, "Assessment started successfully", 201);
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

  const agentId = req.user.agentId;

  // Get full assessment data using service
  let assessmentData;
  try {
    assessmentData = await attemptService.getAssessmentForAttempt(assessmentId, attemptId, agentId);
  } catch (error) {
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : 400;
    return sendError(res, error.message, statusCode);
  }

  return sendSuccess(res, assessmentData, "Assessment fetched successfully");
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

  const agentId = req.user.agentId;

  // Get attempt details using service
  let attempt;
  try {
    attempt = await attemptService.getAttemptDetails(attemptId, agentId);
  } catch (error) {
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : 400;
    return sendError(res, error.message, statusCode);
  }

  return sendSuccess(res, attempt, "Attempt details fetched successfully");
});

// log violation controller function

export const logViolation = asyncHandler(async (req, res) => {
  const { assessmentId, attemptId } = req.params;
  const violationData = req.body;
  const userId = req.user.id;

  try {
    const result = await violationService.logSingleViolation(
      assessmentId,
      attemptId,
      violationData,
      userId,
    );
    return sendSuccess(res, result, "Violation logged successfully");
  } catch (error) {
    console.error("[logViolation] Error:", error);
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : 400;
    return sendError(res, error.message, statusCode);
  }
});

// ============================================
// GET VIOLATION SUMMARY (For page load)
// ============================================
export const getViolationSummary = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id;

  try {
    const summary = await violationService.getViolationSummary(attemptId, userId);
    const message =
      summary.totalViolations === 0 ? "No violations yet" : "Violation summary retrieved";
    return sendSuccess(res, summary, message);
  } catch (error) {
    console.error("[getViolationSummary] Error:", error);
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : 400;
    return sendError(res, error.message, statusCode);
  }
});

// ============================================
// LOG VIOLATION BATCH (For refresh/submit)
// ============================================
export const logViolationBatch = asyncHandler(async (req, res) => {
  const { assessmentId, attemptId } = req.params;
  const { violations } = req.body;
  const userId = req.user.id;

  try {
    const result = await violationService.logViolationBatch(
      assessmentId,
      attemptId,
      violations,
      userId,
    );

    const message =
      result.logged === 0
        ? "All violations were duplicates"
        : `${result.logged} violations logged successfully`;

    return sendSuccess(res, result, message);
  } catch (error) {
    console.error("[logViolationBatch] Error:", error);
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
        ? 403
        : 400;
    return sendError(res, error.message, statusCode);
  }
});
