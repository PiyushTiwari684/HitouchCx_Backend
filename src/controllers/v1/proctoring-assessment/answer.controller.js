import asyncHandler from "express-async-handler";
import { sendSuccess, sendError } from "../../../utils/ApiResponse.js";
import * as answerService from "../../../services/proctoring-assessment/answer.service.js";
import * as attemptService from "../../../services/proctoring-assessment/attempt.service.js";
import * as candidateService from "../../../services/proctoring-assessment/candidate.service.js";

/**
 * POST /api/v1/proctoring/assessment/attempt/:attemptId/answers
 * Save or update a single answer
 * Handles both text (WRITING) and audio (SPEAKING) answers
 * Protected route - requires authentication
 */
export const saveAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionId, sectionId, answerText, isSkipped, typingSpeed, timeSpentSeconds } = req.body;
  const agentId = req.user.agentId;

  console.log("[saveAnswer] Request received:", {
    attemptId,
    questionId,
    sectionId,
    hasAudioFile: !!req.file,
    typingSpeed,
    timeSpentSeconds,
    agentId,
  });

  // Validate required fields
  if (!questionId || !sectionId) {
    return sendError(res, "questionId and sectionId are required", 400);
  }

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(attemptId, agentId);
  if (!isOwner) {
    return sendError(res, "Unauthorized access to this assessment attempt", 403);
  }

  // Get candidate ID
  const candidate = await candidateService.getOrCreateCandidate(agentId);
  const candidateId = candidate.id;

  // Prepare answer data
  const answerData = {
    attemptId,
    questionId,
    sectionId,
    candidateId,
    answerText: answerText || null,
    audioFilePath: req.file ? req.file.path : null, // Multer adds file info to req.file
    isSkipped: isSkipped === "true" || isSkipped === true,
    typingSpeed: typingSpeed ? parseFloat(typingSpeed) : null,
    timeSpentSeconds: timeSpentSeconds ? parseInt(timeSpentSeconds) : null,
  };

  // DEBUG: Log file upload details
  if (req.file) {
    console.log("🔍 [DEBUG] Audio file details from multer:");
    console.log("   originalname:", req.file.originalname);
    console.log("   filename:", req.file.filename);
    console.log("   path:", req.file.path);
    console.log("   mimetype:", req.file.mimetype);
    console.log("   size:", req.file.size);
    console.log("   Storing in DB as:", answerData.audioFilePath);
  }

  // Validate that either text or audio is provided (unless skipped)
  if (!answerData.isSkipped && !answerData.answerText && !answerData.audioFilePath) {
    return sendError(res, "Either answerText or audio file must be provided", 400);
  }

  try {
    // Save or update answer
    const savedAnswer = await answerService.saveOrUpdateAnswer(answerData);

    // Return success response
    return sendSuccess(
      res,
      {
        answerId: savedAnswer.id,
        questionId: savedAnswer.questionId,
        isSkipped: savedAnswer.isSkipped,
        wordCount: savedAnswer.wordCount,
        typingSpeed: savedAnswer.typingSpeed,
        timeSpentSeconds: savedAnswer.timeSpentSeconds,
        audioFilePath: savedAnswer.audioFilePath,
        revisionCount: savedAnswer.revisionCount,
        submittedAt: savedAnswer.submittedAt,
      },
      savedAnswer.revisionCount > 0 ? "Answer updated successfully" : "Answer saved successfully",
    );
  } catch (error) {
    console.error("[saveAnswer] Error:", error);
    return sendError(res, error.message || "Failed to save answer", 500);
  }
});

/**
 * GET /api/v1/proctoring/assessment/attempt/:attemptId/answers
 * Get all answers for an attempt
 * Protected route - requires authentication
 */
export const getAllAnswers = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const agentId = req.user.agentId;

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(attemptId, agentId);
  if (!isOwner) {
    return sendError(res, "Unauthorized access to this assessment attempt", 403);
  }

  try {
    // Get all answers
    const answers = await answerService.getAllAnswersForAttempt(attemptId);

    // Get statistics
    const stats = await answerService.getAnswerStatistics(attemptId);

    return sendSuccess(
      res,
      {
        answers: answers.map((answer) => ({
          id: answer.id,
          questionId: answer.questionId,
          sectionId: answer.sectionId,
          questionType: answer.question.questionType,
          questionText: answer.question.questionText,
          sectionName: answer.section.name,
          answerText: answer.answerText,
          audioFilePath: answer.audioFilePath,
          wordCount: answer.wordCount,
          isSkipped: answer.isSkipped,
          revisionCount: answer.revisionCount,
          submittedAt: answer.submittedAt,
        })),
        statistics: stats,
      },
      "Answers retrieved successfully",
    );
  } catch (error) {
    console.error("[getAllAnswers] Error:", error);
    return sendError(res, error.message || "Failed to retrieve answers", 500);
  }
});

/**
 * GET /api/v1/proctoring/assessment/attempt/:attemptId/answers/:questionId
 * Get a specific answer by question ID
 * Protected route - requires authentication
 */
export const getAnswerByQuestion = asyncHandler(async (req, res) => {
  const { attemptId, questionId } = req.params;
  const agentId = req.user.agentId;

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(attemptId, agentId);
  if (!isOwner) {
    return sendError(res, "Unauthorized access to this assessment attempt", 403);
  }

  try {
    // Get answer
    const answer = await answerService.getAnswerByQuestion(attemptId, questionId);

    if (!answer) {
      return sendError(res, "Answer not found for this question", 404);
    }

    return sendSuccess(
      res,
      {
        id: answer.id,
        questionId: answer.questionId,
        sectionId: answer.sectionId,
        questionType: answer.question.questionType,
        answerText: answer.answerText,
        audioFilePath: answer.audioFilePath,
        wordCount: answer.wordCount,
        isSkipped: answer.isSkipped,
        revisionCount: answer.revisionCount,
        submittedAt: answer.submittedAt,
      },
      "Answer retrieved successfully",
    );
  } catch (error) {
    console.error("[getAnswerByQuestion] Error:", error);
    return sendError(res, error.message || "Failed to retrieve answer", 500);
  }
});

/**
 * DELETE /api/v1/proctoring/assessment/attempt/:attemptId/answers/:answerId
 * Delete a specific answer (allow user to clear their response)
 * Protected route - requires authentication
 */
export const deleteAnswer = asyncHandler(async (req, res) => {
  const { attemptId, answerId } = req.params;
  const agentId = req.user.agentId;

  // Validate answer ownership
  const isOwner = await answerService.validateAnswerOwnership(answerId, agentId);
  if (!isOwner) {
    return sendError(res, "Unauthorized access to this answer", 403);
  }

  try {
    // Delete answer
    await answerService.deleteAnswer(answerId);

    return sendSuccess(res, { answerId }, "Answer deleted successfully");
  } catch (error) {
    console.error("[deleteAnswer] Error:", error);
    return sendError(res, error.message || "Failed to delete answer", 500);
  }
});

/**
 * GET /api/v1/proctoring/assessment/attempt/:attemptId/answers/statistics
 * Get answer statistics for an attempt
 * Protected route - requires authentication
 */
export const getAnswerStatistics = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const agentId = req.user.agentId;

  // Validate attempt ownership
  const isOwner = await attemptService.validateAttemptOwnership(attemptId, agentId);
  if (!isOwner) {
    return sendError(res, "Unauthorized access to this assessment attempt", 403);
  }

  try {
    // Get statistics
    const stats = await answerService.getAnswerStatistics(attemptId);

    return sendSuccess(res, stats, "Statistics retrieved successfully");
  } catch (error) {
    console.error("[getAnswerStatistics] Error:", error);
    return sendError(res, error.message || "Failed to retrieve statistics", 500);
  }
});
