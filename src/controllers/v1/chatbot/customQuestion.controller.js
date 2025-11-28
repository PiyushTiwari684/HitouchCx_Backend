import * as customQuestionService from "../../../services/customQuestion.service.js";

// POST /api/ai/ask
export async function askQuestion(req, res, next) {
  try {
    const { conversationId, question } = req.body;

    // Validation
    if (!conversationId || !question) {
      return res.status(400).json({
        status: "error",
        message: "conversationId and question are required",
      });
    }

    const result = await customQuestionService.askCustomQuestion(
      conversationId,
      question
    );

    res.status(200).json({
      status: "success",
      data: {
        customQuestionId: result.customQuestion.id,
        question: result.customQuestion.question,
        answer: result.answer,
      },
    });
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }
    next(error);
  }
}

// POST /api/ai/feedback
export async function recordFeedback(req, res, next) {
  try {
    const { customQuestionId, isHelpful } = req.body;

    // Validation
    if (!customQuestionId || typeof isHelpful !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "customQuestionId and isHelpful (boolean) are required",
      });
    }

    await customQuestionService.recordCustomFeedback(
      customQuestionId,
      isHelpful
    );

    res.status(200).json({
      status: "success",
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/ai/frequent-questions
export async function getFrequentQuestions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const questions = await customQuestionService.getFrequentlyAskedQuestions(
      limit
    );

    res.status(200).json({
      status: "success",
      data: {
        questions,
        count: questions.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
