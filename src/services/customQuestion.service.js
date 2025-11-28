import prisma from "../config/db.js";
import {
  generateAIResponse,
  checkQuestionSimilarity,
} from "../utils/groq.client.js";

// Ask a custom question (Tier 2)
export async function askCustomQuestion(conversationId, question) {
  try {
    // Get conversation history for context
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 10, // Last 10 messages for context
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Format conversation history for AI
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Generate AI response
    const answer = await generateAIResponse(question, conversationHistory);

    // Store in custom_questions table
    const customQuestion = await prisma.customQuestion.create({
      data: {
        conversationId,
        question,
        answer,
        similarCount: 1,
      },
    });

    // Check if this question should be flagged for FAQ
    await checkAndFlagForFAQ(question);

    return {
      customQuestion,
      answer,
    };
  } catch (error) {
    throw error;
  }
}

// Record feedback on custom question
export async function recordCustomFeedback(customQuestionId, isHelpful) {
  try {
    const updated = await prisma.customQuestion.update({
      where: { id: customQuestionId },
      data: {
        isHelpful,
      },
    });

    return updated;
  } catch (error) {
    throw new Error(`Failed to record feedback: ${error.message}`);
  }
}

// Check if question should be flagged for FAQ (asked 10+ times)
async function checkAndFlagForFAQ(newQuestion) {
  try {
    // Get all custom questions from last 30 days
    const recentQuestions = await prisma.customQuestion.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        question: true,
      },
    });

    if (recentQuestions.length < 10) {
      return; // Not enough data yet
    }

    // Check similarity with existing questions
    const existingQuestions = recentQuestions.map((q) => q.question);
    const similarQuestion = await checkQuestionSimilarity(
      newQuestion,
      existingQuestions
    );

    if (similarQuestion) {
      // Increment similar count for all matching questions
      await prisma.customQuestion.updateMany({
        where: {
          question: similarQuestion,
        },
        data: {
          similarCount: {
            increment: 1,
          },
        },
      });

      // Flag if count reaches 10
      const questionRecord = await prisma.customQuestion.findFirst({
        where: { question: similarQuestion },
        orderBy: { similarCount: "desc" },
      });

      if (questionRecord && questionRecord.similarCount >= 10) {
        await prisma.customQuestion.update({
          where: { id: questionRecord.id },
          data: {
            flaggedForFaq: true,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error checking FAQ flag:", error);
    // Don't throw - this is a background task
  }
}

// Get frequently asked custom questions (for admin review)
export async function getFrequentlyAskedQuestions(limit = 20) {
  try {
    const questions = await prisma.customQuestion.findMany({
      where: {
        flaggedForFaq: true,
      },
      orderBy: {
        similarCount: "desc",
      },
      take: limit,
      select: {
        id: true,
        question: true,
        answer: true,
        similarCount: true,
        createdAt: true,
      },
    });

    return questions;
  } catch (error) {
    throw new Error(`Failed to fetch frequent questions: ${error.message}`);
  }
}
