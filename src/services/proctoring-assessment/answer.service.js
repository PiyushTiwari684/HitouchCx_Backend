import prisma from "../../config/db.js";

/**
 * Answer Service
 * Handles all answer-related business logic for assessment attempts
 */

/**
 * Save or update an answer for a specific question in an attempt
 * @param {Object} data - Answer data
 * @returns {Object} Saved answer record
 */
export async function saveOrUpdateAnswer(data) {
  const {
    attemptId,
    questionId,
    sectionId,
    candidateId,
    answerText,
    audioFilePath,
    isSkipped = false,
  } = data;

  // Validate required fields
  if (!attemptId || !questionId || !sectionId || !candidateId) {
    throw new Error("Missing required fields: attemptId, questionId, sectionId, candidateId");
  }

  // Check if answer already exists for this question in this attempt
  const existingAnswer = await prisma.answer.findFirst({
    where: {
      attemptId,
      questionId,
    },
  });

  // Calculate word count if text answer provided
  let wordCount = null;
  if (answerText) {
    wordCount = calculateWordCount(answerText);
  }

  const answerData = {
    candidateId,
    attemptId,
    sectionId,
    questionId,
    answerText: answerText || null,
    audioFilePath: audioFilePath || null,
    wordCount,
    isSkipped,
    lastModifiedAt: new Date(),
    submittedAt: new Date(),
    revisionCount: existingAnswer ? existingAnswer.revisionCount + 1 : 0,
  };

  let answer;

  if (existingAnswer) {
    // UPDATE existing answer
    console.log(`[AnswerService] Updating answer for question ${questionId}`);
    answer = await prisma.answer.update({
      where: { id: existingAnswer.id },
      data: answerData,
    });
  } else {
    // CREATE new answer
    console.log(`[AnswerService] Creating new answer for question ${questionId}`);
    answer = await prisma.answer.create({
      data: answerData,
    });
  }

  console.log(`✅ [AnswerService] Answer saved: ${answer.id}`);
  return answer;
}

/**
 * Get a specific answer by question ID for an attempt
 * @param {string} attemptId - Attempt ID
 * @param {string} questionId - Question ID
 * @returns {Object|null} Answer record or null if not found
 */
export async function getAnswerByQuestion(attemptId, questionId) {
  const answer = await prisma.answer.findFirst({
    where: {
      attemptId,
      questionId,
    },
    include: {
      question: {
        select: {
          questionType: true,
          questionText: true,
          cefrLevel: true,
        },
      },
    },
  });

  return answer;
}

/**
 * Get all answers for a specific attempt
 * @param {string} attemptId - Attempt ID
 * @returns {Array} Array of answer records
 */
export async function getAllAnswersForAttempt(attemptId) {
  const answers = await prisma.answer.findMany({
    where: {
      attemptId,
    },
    include: {
      question: {
        select: {
          questionType: true,
          questionText: true,
          cefrLevel: true,
        },
      },
      section: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { section: { orderIndex: "asc" } },
      { createdAt: "asc" },
    ],
  });

  return answers;
}

/**
 * Get answer statistics for an attempt
 * @param {string} attemptId - Attempt ID
 * @returns {Object} Statistics object
 */
export async function getAnswerStatistics(attemptId) {
  console.log("[getAnswerStatistics] Fetching stats for attemptId:", attemptId);

  // Fetch attempt data to get timing information
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      startedAt: true,
      completedAt: true,
      submittedAt: true,
      totalTimeSpent: true,
    },
  });

  console.log("[getAnswerStatistics] Attempt data:", {
    startedAt: attempt?.startedAt,
    completedAt: attempt?.completedAt,
    submittedAt: attempt?.submittedAt,
    totalTimeSpent: attempt?.totalTimeSpent,
  });

  // Fetch all answers
  const answers = await prisma.answer.findMany({
    where: { attemptId },
  });

  // Calculate totalTimeSpent if not already set
  let totalTimeSpent = attempt?.totalTimeSpent || 0;

  if (!totalTimeSpent && attempt?.startedAt) {
    // Calculate from startedAt to completedAt or current time
    const endTime = attempt.completedAt || attempt.submittedAt || new Date();
    totalTimeSpent = Math.floor((endTime - attempt.startedAt) / 1000); // Convert to seconds
    console.log("[getAnswerStatistics] Calculated totalTimeSpent:", {
      startedAt: attempt.startedAt,
      endTime,
      totalTimeSpent,
    });
  }

  const stats = {
    totalQuestions: answers.length,
    answeredQuestions: answers.filter((a) => !a.isSkipped).length,
    skippedQuestions: answers.filter((a) => a.isSkipped).length,
    writingAnswers: answers.filter((a) => a.answerText && !a.audioFilePath).length,
    speakingAnswers: answers.filter((a) => a.audioFilePath).length,
    totalTimeSpent, // Time spent in seconds
    startedAt: attempt?.startedAt,
    completedAt: attempt?.completedAt,
    submittedAt: attempt?.submittedAt,
  };

  console.log("[getAnswerStatistics] Returning stats:", stats);
  return stats;
}

/**
 * Delete an answer (if candidate wants to clear their response)
 * @param {string} answerId - Answer ID
 * @returns {Object} Deleted answer
 */
export async function deleteAnswer(answerId) {
  const answer = await prisma.answer.delete({
    where: { id: answerId },
  });

  console.log(`✅ [AnswerService] Answer deleted: ${answerId}`);
  return answer;
}

/**
 * Helper: Calculate word count from text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function calculateWordCount(text) {
  if (!text || typeof text !== "string") return 0;

  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export async function validateAnswerOwnership(answerId, agentId) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      attempt: {
        include: {
          candidate: {
            select: {
              agentId: true,
            },
          },
        },
      },
    },
  });

  if (!answer || !answer.attempt || !answer.attempt.candidate) {
    return false;
  }

  return answer.attempt.candidate.agentId === agentId;
}
