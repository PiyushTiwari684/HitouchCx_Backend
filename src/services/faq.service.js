import prisma from "../config/db.js";

// Get all FAQ categories
export async function getCategories() {
  try {
    const categories = await prisma.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        emoji: true,
        order: true,
      },
    });
    return categories;
  } catch (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
}

// Get questions by category
export async function getQuestionsByCategory(categoryId) {
  try {
    const category = await prisma.faqCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const questions = await prisma.faqQuestion.findMany({
      where: {
        categoryId: categoryId,
        isActive: true,
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
        order: true,
      },
    });

    return questions;
  } catch (error) {
    throw error;
  }
}

// Get single question
export async function getQuestionById(questionId) {
  try {
    const question = await prisma.faqQuestion.findUnique({
      where: { id: questionId },
      include: {
        category: {
          select: { name: true, emoji: true },
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    await prisma.faqQuestion.update({
      where: { id: questionId },
      data: { viewCount: { increment: 1 } },
    });

    return question;
  } catch (error) {
    throw error;
  }
}

// Record feedback
export async function recordFeedback(questionId, isHelpful) {
  try {
    const fieldToIncrement = isHelpful ? "helpfulYes" : "helpfulNo";

    const updated = await prisma.faqQuestion.update({
      where: { id: questionId },
      data: {
        [fieldToIncrement]: { increment: 1 },
      },
    });

    return updated;
  } catch (error) {
    throw new Error(`Failed to record feedback: ${error.message}`);
  }
}
