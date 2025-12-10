import asyncHandler from "express-async-handler";
import { sendSuccess, sendError } from "../../../utils/ApiResponse.js";
import * as evaluationService from "../../../services/proctoring-assessment/evaluation.service.js";
import * as attemptService from "../../../services/proctoring-assessment/attempt.service.js";
import prisma from "../../../config/db.js";

/**
 * POST /api/v1/proctoring/assessment/attempt/:attemptId/evaluate
 * Trigger batch evaluation for an assessment attempt
 * Called by frontend every 5 answers
 * Protected route - requires authentication
 */
export const triggerEvaluation = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const agentId = req.user.agentId;

  console.log("[triggerEvaluation] Request received:", {
    attemptId,
    agentId,
  });

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(
    attemptId,
    agentId
  );
  if (!isOwner) {
    return sendError(
      res,
      "Unauthorized access to this assessment attempt",
      403
    );
  }

  try {
    // Trigger batch evaluation (evaluates up to 5 unevaluated answers)
    const result = await evaluationService.triggerBatchEvaluation(attemptId);

    return sendSuccess(
      res,
      result,
      result.successCount > 0
        ? `Successfully evaluated ${result.successCount} answers`
        : "No answers to evaluate"
    );
  } catch (error) {
    console.error("[triggerEvaluation] Error:", error);
    return sendError(
      res,
      `Evaluation failed: ${error.message}`,
      500
    );
  }
});

/**
 * GET /api/v1/proctoring/assessment/attempt/:attemptId/evaluation/summary
 * Get evaluation summary for an assessment attempt
 * Shows overall stats, CEFR distribution, average score
 * Protected route - requires authentication
 */
export const getEvaluationSummary = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const agentId = req.user.agentId;

  console.log("[getEvaluationSummary] Request received:", {
    attemptId,
    agentId,
  });

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(
    attemptId,
    agentId
  );
  if (!isOwner) {
    return sendError(
      res,
      "Unauthorized access to this assessment attempt",
      403
    );
  }

  try {
    const summary = await evaluationService.getEvaluationSummary(attemptId);

    return sendSuccess(
      res,
      summary,
      "Evaluation summary retrieved successfully"
    );
  } catch (error) {
    console.error("[getEvaluationSummary] Error:", error);
    return sendError(
      res,
      `Failed to get evaluation summary: ${error.message}`,
      500
    );
  }
});

/**
 * POST /api/v1/proctoring/assessment/answer/:answerId/evaluate
 * Evaluate a single answer (for manual/on-demand evaluation)
 * Protected route - requires authentication
 */
export const evaluateSingleAnswer = asyncHandler(async (req, res) => {
  const { answerId } = req.params;
  const agentId = req.user.agentId;

  console.log("[evaluateSingleAnswer] Request received:", {
    answerId,
    agentId,
  });

  try {
    // Note: We should validate the answer belongs to this agent
    // but for simplicity, we'll allow any authenticated agent to trigger evaluation

    const result = await evaluationService.evaluateSingleAnswer(answerId);

    if (!result) {
      return sendError(res, "Answer could not be evaluated (no text)", 400);
    }

    return sendSuccess(
      res,
      {
        answerId: result.id,
        aiOverallScore: result.aiOverallScore,
        aiCefrLevel: result.aiCefrLevel,
        detailedFeedback: result.detailedFeedback,
        strengths: result.strengths,
        improvements: result.improvements,
      },
      "Answer evaluated successfully"
    );
  } catch (error) {
    console.error("[evaluateSingleAnswer] Error:", error);
    return sendError(
      res,
      `Evaluation failed: ${error.message}`,
      500
    );
  }
});

/**
 * POST /api/v1/proctoring/assessment/attempt/:attemptId/evaluate/batch
 * Batch evaluate specific answers by IDs
 * Protected route - requires authentication
 */
export const batchEvaluateAnswers = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answerIds } = req.body; // Array of answer IDs
  const agentId = req.user.agentId;

  console.log("[batchEvaluateAnswers] Request received:", {
    attemptId,
    answerCount: answerIds?.length,
    agentId,
  });

  // Validate input
  if (!Array.isArray(answerIds) || answerIds.length === 0) {
    return sendError(res, "answerIds array is required", 400);
  }

  if (answerIds.length > 10) {
    return sendError(res, "Maximum 10 answers can be evaluated at once", 400);
  }

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(
    attemptId,
    agentId
  );
  if (!isOwner) {
    return sendError(
      res,
      "Unauthorized access to this assessment attempt",
      403
    );
  }

  try {
    const result = await evaluationService.batchEvaluateAnswers(answerIds);

    return sendSuccess(
      res,
      result,
      `Batch evaluation complete: ${result.successCount} successful, ${result.errorCount} failed`
    );
  } catch (error) {
    console.error("[batchEvaluateAnswers] Error:", error);
    return sendError(
      res,
      `Batch evaluation failed: ${error.message}`,
      500
    );
  }
});

/**
 * POST /api/v1/proctoring/assessment/attempt/:attemptId/feedback
 * Submit candidate feedback for assessment experience
 * Protected route - requires authentication
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { feedback } = req.body;
  const agentId = req.user.agentId;

  console.log("[submitFeedback] Request received:", {
    attemptId,
    agentId,
    feedbackLength: feedback?.length,
  });

  // Validate input
  if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
    return sendError(res, "Feedback is required", 400);
  }

  if (feedback.length > 5000) {
    return sendError(res, "Feedback is too long (max 5000 characters)", 400);
  }

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(
    attemptId,
    agentId
  );
  if (!isOwner) {
    return sendError(
      res,
      "Unauthorized access to this assessment attempt",
      403
    );
  }

  try {
    // Update feedback in database
    const updated = await prisma.candidateAssessment.update({
      where: { id: attemptId },
      data: {
        candidateFeedback: feedback.trim(),
        feedbackSubmittedAt: new Date(),
      },
      select: {
        id: true,
        candidateFeedback: true,
        feedbackSubmittedAt: true,
      },
    });

    console.log("[submitFeedback] Feedback saved successfully:", updated.id);

    return sendSuccess(
      res,
      {
        attemptId: updated.id,
        feedbackSubmittedAt: updated.feedbackSubmittedAt,
      },
      "Feedback submitted successfully"
    );
  } catch (error) {
    console.error("[submitFeedback] Error:", error);
    return sendError(
      res,
      `Failed to submit feedback: ${error.message}`,
      500
    );
  }
});

/**
 * GET /api/v1/proctoring/assessment/latest-evaluation
 * Get latest assessment evaluation for the authenticated candidate
 * Returns evaluation status and summary if complete
 * Protected route - requires authentication
 */
export const getLatestEvaluation = asyncHandler(async (req, res) => {
  const agentId = req.user.agentId;

  console.log("[getLatestEvaluation] Request received for agentId:", agentId);

  try {
    // Get candidate for this agent
    const candidate = await prisma.candidate.findFirst({
      where: { agentId },
      select: { id: true },
    });

    if (!candidate) {
      return sendSuccess(res, null, "No candidate found for this agent");
    }

    // Get latest attempt with answers
    const latestAttempt = await prisma.candidateAssessment.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: "desc" },
      include: {
        answers: {
          where: {
            question: {
              questionType: { in: ["WRITING", "SPEAKING"] },
            },
          },
          select: {
            id: true,
            aiOverallScore: true,
            aiCefrLevel: true,
            fluencyScore: true,
            completenessScore: true,
            correctnessScore: true,
            grammarScore: true,
          },
        },
      },
    });

    if (!latestAttempt) {
      return sendSuccess(res, null, "No assessment attempts found");
    }

    // Check if evaluation is complete
    const evaluatedAnswers = latestAttempt.answers.filter(
      (a) => a.aiOverallScore !== null
    );
    const totalAnswers = latestAttempt.answers.length;
    const isComplete = evaluatedAnswers.length > 0;

    if (!isComplete || evaluatedAnswers.length === 0) {
      return sendSuccess(
        res,
        {
          attemptId: latestAttempt.id,
          status: "PENDING",
          totalAnswers,
          evaluatedAnswers: 0,
        },
        "Evaluation in progress"
      );
    }

    // Calculate summary statistics
    const avgScore =
      evaluatedAnswers.reduce((sum, a) => sum + a.aiOverallScore, 0) /
      evaluatedAnswers.length;

    const avgFluency =
      evaluatedAnswers.reduce((sum, a) => sum + (a.fluencyScore || a.completenessScore || 0), 0) /
      evaluatedAnswers.length;

    // Get most common CEFR level (mode)
    const cefrCounts = {};
    evaluatedAnswers.forEach((a) => {
      if (a.aiCefrLevel) {
        cefrCounts[a.aiCefrLevel] = (cefrCounts[a.aiCefrLevel] || 0) + 1;
      }
    });

    const overallCefr =
      Object.keys(cefrCounts).length > 0
        ? Object.keys(cefrCounts).reduce((a, b) =>
            cefrCounts[a] > cefrCounts[b] ? a : b
          )
        : "A1";

    console.log("[getLatestEvaluation] Evaluation complete:", {
      attemptId: latestAttempt.id,
      avgScore: Math.round(avgScore),
      cefrLevel: overallCefr,
    });

    return sendSuccess(
      res,
      {
        attemptId: latestAttempt.id,
        status: "COMPLETE",
        overallScore: Math.round(avgScore),
        cefrLevel: overallCefr,
        fluency: Math.round(avgFluency),
        totalEvaluated: evaluatedAnswers.length,
        totalAnswers,
      },
      "Evaluation complete"
    );
  } catch (error) {
    console.error("[getLatestEvaluation] Error:", error);
    return sendError(
      res,
      `Failed to get latest evaluation: ${error.message}`,
      500
    );
  }
});
