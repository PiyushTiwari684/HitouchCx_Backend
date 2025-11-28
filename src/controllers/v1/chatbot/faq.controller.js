import * as faqService from "../../../services/faq.service.js";

// GET /api/faq/categories
export async function getCategories(req, res, next) {
  try {
    const categories = await faqService.getCategories();

    res.status(200).json({
      status: "success",
      data: {
        categories,
        count: categories.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/faq/questions/:categoryId
export async function getQuestionsByCategory(req, res, next) {
  try {
    const { categoryId } = req.params;

    const questions = await faqService.getQuestionsByCategory(categoryId);

    res.status(200).json({
      status: "success",
      data: {
        questions,
        count: questions.length,
      },
    });
  } catch (error) {
    if (error.message === "Category not found") {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }
    next(error);
  }
}

// GET /api/faq/question/:questionId
export async function getQuestionById(req, res, next) {
  try {
    const { questionId } = req.params;

    const question = await faqService.getQuestionById(questionId);

    res.status(200).json({
      status: "success",
      data: {
        question,
      },
    });
  } catch (error) {
    if (error.message === "Question not found") {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }
    next(error);
  }
}

// POST /api/faq/feedback
export async function recordFeedback(req, res, next) {
  try {
    const { questionId, isHelpful } = req.body;

    // Validation
    if (!questionId || typeof isHelpful !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "questionId and isHelpful (boolean) are required",
      });
    }

    await faqService.recordFeedback(questionId, isHelpful);

    res.status(200).json({
      status: "success",
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    next(error);
  }
}
