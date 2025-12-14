import prisma from "../../config/db.js";
import { evaluateAnswer as groqEvaluate } from "./groq.evaluation.service.js";
// Using FREE LanguageTool instead of rate-limited Hugging Face!
import { checkGrammar } from "./languagetool.grammar.service.js";
// Using FREE Groq Whisper instead of paid AssemblyAI!
import { transcribeAudio } from "../groq.transcription.service.js";

/**
 * Evaluation weights for different question types
 */
const EVALUATION_WEIGHTS = {
  SPEAKING: {
    correctness: 0.3, // 30%
    grammar: 0.1, // 10%
    fluency: 0.5, // 50%
    thinking: 0.1, // 10%
  },
  WRITING: {
    correctness: 0.4, // 40%
    grammar: 0.3, // 30%
    thinking: 0.2, // 20%
    completeness: 0.1, // 10%
  },
};

/**
 * CEFR level mapping based on overall score
 */
const CEFR_MAPPING = [
  { min: 90, max: 100, level: "C2" }, // Mastery
  { min: 80, max: 89, level: "C1" }, // Advanced
  { min: 70, max: 79, level: "B2" }, // Upper Intermediate
  { min: 60, max: 69, level: "B1" }, // Intermediate
  { min: 50, max: 59, level: "A2" }, // Elementary
  { min: 0, max: 49, level: "A1" }, // Beginner
];

/**
 * Evaluate a single answer using AI
 * @param {string} answerId - The answer ID to evaluate
 * @returns {Promise<Object>} Evaluation results
 */
export async function evaluateSingleAnswer(answerId) {
  try {
    console.log(`\n========================================`);
    console.log(`=== Starting evaluation for answer ${answerId} ===`);
    console.log(`========================================`);

    // 1. Fetch the answer with related data
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        candidate: true,
      },
    });

    if (!answer) {
      console.error(`❌ Answer ${answerId} not found in database`);
      throw new Error(`Answer ${answerId} not found`);
    }

    // 2. Determine question type
    const questionType = answer.question.questionType;
    console.log(`📝 Question type: ${questionType}`);
    console.log(`📄 Question text: ${answer.question.questionText.substring(0, 100)}...`);
    console.log(`💬 Current answerText: "${answer.answerText}"`);
    console.log(`🎵 Audio file path: ${answer.audioFilePath || "NONE"}`);

    // 3. Get answer text (transcribe if speaking)
    let answerText = answer.answerText;

    if (questionType === "SPEAKING") {
      console.log(`\n🎤 SPEAKING question detected`);
      console.log(`   - Has answerText: ${!!answerText}`);
      console.log(`   - answerText length: ${answerText?.length || 0}`);
      console.log(`   - answerText trimmed length: ${answerText?.trim().length || 0}`);
      console.log(`   - Has audioFilePath: ${!!answer.audioFilePath}`);

      // For speaking questions, transcribe audio if text is missing or empty
      if ((!answerText || answerText.trim().length === 0) && answer.audioFilePath) {
        console.log(`\n🔊 Starting audio transcription...`);
        console.log(`   📁 Audio file path: ${answer.audioFilePath}`);

        try {
          const transcription = await transcribeAudio(answer.audioFilePath);
          answerText = transcription.text;

          console.log(`\n✅ TRANSCRIPTION SUCCESSFUL!`);
          console.log(`   📝 Transcribed text length: ${answerText.length} characters`);
          console.log(`   📝 Transcribed text preview: "${answerText.substring(0, 200)}..."`);
          console.log(`   ⏱️  Duration: ${transcription.duration || "N/A"} seconds`);
          console.log(`   🔤 Language: ${transcription.language || "N/A"}`);

          // Update answer with transcription
          await prisma.answer.update({
            where: { id: answerId },
            data: { answerText },
          });

          console.log(`   💾 Transcription saved to database`);
        } catch (error) {
          console.error(`\n❌ TRANSCRIPTION FAILED!`);
          console.error(`   Error type: ${error.constructor.name}`);
          console.error(`   Error message: ${error.message}`);
          console.error(`   Stack trace:`, error.stack);
          throw new Error(`Failed to transcribe audio: ${error.message}`);
        }
      } else {
        console.log(`\n⏭️  Skipping transcription:`);
        if (answerText && answerText.trim().length > 0) {
          console.log(`   ✓ Already has transcribed text`);
        } else if (!answer.audioFilePath) {
          console.log(`   ⚠️  No audio file path available`);
        }
      }
    }

    if (!answerText || answerText.trim().length === 0) {
      console.log(`\n⚠️  EVALUATION SKIPPED - No answer text available`);
      console.log(`   - answerText: "${answerText}"`);
      console.log(`   - Question type: ${questionType}`);
      console.log(`========================================\n`);
      return null;
    }

    console.log(`\n✅ Answer text ready for evaluation`);
    console.log(`   Length: ${answerText.length} characters`);
    console.log(`   Preview: "${answerText.substring(0, 150)}..."`);

    // 4. Run AI evaluations in parallel
    console.log(`\n🤖 Running AI evaluations...`);
    const [groqResult, grammarResult] = await Promise.all([
      groqEvaluate({
        questionText: answer.question.questionText,
        answerText,
        questionType,
        expectedAnswer: answer.question.correctAnswer || null,
      }),
      checkGrammar(answerText),
    ]);

    console.log("AI evaluations complete!");
    console.log("Groq scores:", {
      correctness: groqResult.correctnessScore,
      thinking: groqResult.thinkingLevelScore,
      fluency: groqResult.fluencyScore,
      completeness: groqResult.completenessScore,
    });
    console.log("Grammar score:", grammarResult.grammarScore);

    // 5. Calculate weighted overall score
    const overallScore = calculateOverallScore({
      questionType,
      correctnessScore: groqResult.correctnessScore,
      grammarScore: grammarResult.grammarScore,
      fluencyScore: groqResult.fluencyScore,
      thinkingLevelScore: groqResult.thinkingLevelScore,
      completenessScore: groqResult.completenessScore,
    });

    console.log("Overall weighted score:", overallScore);

    // 6. Map to CEFR level
    const cefrLevel = mapScoreToCEFR(overallScore);
    console.log("CEFR level:", cefrLevel);

    // 7. Update answer with evaluation results
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        // Individual scores
        correctnessScore: groqResult.correctnessScore,
        grammarScore: grammarResult.grammarScore,
        fluencyScore: groqResult.fluencyScore,
        thinkingLevelScore: groqResult.thinkingLevelScore,
        completenessScore: groqResult.completenessScore,

        // Overall results
        aiOverallScore: overallScore,
        aiCefrLevel: cefrLevel,

        // Feedback
        detailedFeedback: groqResult.detailedFeedback,
        strengths: groqResult.strengths,
        improvements: groqResult.improvements,
        evaluationReasoning: groqResult.reasoning,

        // Grammar errors
        grammarErrors: grammarResult.grammarErrors,

        // Metadata
        evaluatedAt: new Date(),
        evaluatedBy: "Groq-Llama-3.3-70B + LanguageTool + Groq-Whisper",
        evaluationVersion: "3.0.0-free",
      },
    });

    console.log(`=== Evaluation complete for answer ${answerId} ===\n`);

    return updatedAnswer;
  } catch (error) {
    console.error(`Error evaluating answer ${answerId}:`, error);
    throw error;
  }
}

/**
 * Batch evaluate multiple answers
 * @param {string[]} answerIds - Array of answer IDs to evaluate
 * @returns {Promise<Object[]>} Array of evaluation results
 */
export async function batchEvaluateAnswers(answerIds) {
  console.log(`\n=== Starting batch evaluation for ${answerIds.length} answers ===`);

  const results = [];
  const errors = [];

  // Evaluate answers one by one (to avoid rate limits)
  for (const answerId of answerIds) {
    try {
      const result = await evaluateSingleAnswer(answerId);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    } catch (error) {
      console.error(`Failed to evaluate answer ${answerId}:`, error.message);
      errors.push({
        answerId,
        error: error.message,
      });
    }
  }

  console.log(`=== Batch evaluation complete ===`);
  console.log(`Successful: ${results.length}, Failed: ${errors.length}\n`);

  return {
    success: results,
    failed: errors,
    totalProcessed: answerIds.length,
    successCount: results.length,
    errorCount: errors.length,
  };
}

/**
 * Trigger evaluation for a candidate's recent answers
 * Called every 5 answers during assessment
 * @param {string} attemptId - The assessment attempt ID
 * @returns {Promise<Object>} Evaluation summary
 */
export async function triggerBatchEvaluation(attemptId) {
  try {
    console.log(`\n=== Triggered batch evaluation for attempt ${attemptId} ===`);

    // Get unevaluated answers for this attempt (WRITING and SPEAKING only)
    const unevaluatedAnswers = await prisma.answer.findMany({
      where: {
        attemptId,
        aiOverallScore: null, // Not yet evaluated
        question: {
          questionType: {
            in: ["WRITING", "SPEAKING"],
          },
        },
      },
      select: {
        id: true,
      },
      take: 5, // Evaluate up to 5 answers at a time
      orderBy: {
        createdAt: "asc", // Oldest first
      },
    });

    if (unevaluatedAnswers.length === 0) {
      console.log("No unevaluated answers found");
      return {
        message: "No answers to evaluate",
        evaluated: 0,
      };
    }

    const answerIds = unevaluatedAnswers.map((a) => a.id);
    console.log(`Found ${answerIds.length} unevaluated answers`);

    // Run batch evaluation
    const results = await batchEvaluateAnswers(answerIds);

    return {
      message: `Evaluated ${results.successCount} answers`,
      ...results,
    };
  } catch (error) {
    console.error("Error in triggerBatchEvaluation:", error);
    throw error;
  }
}

/**
 * Calculate weighted overall score based on question type
 */
function calculateOverallScore({
  questionType,
  correctnessScore,
  grammarScore,
  fluencyScore,
  thinkingLevelScore,
  completenessScore,
}) {
  const weights = EVALUATION_WEIGHTS[questionType];

  if (!weights) {
    throw new Error(`Unknown question type: ${questionType}`);
  }

  let score = 0;

  if (questionType === "SPEAKING") {
    score =
      correctnessScore * weights.correctness +
      grammarScore * weights.grammar +
      fluencyScore * weights.fluency +
      thinkingLevelScore * weights.thinking;
  } else if (questionType === "WRITING") {
    score =
      correctnessScore * weights.correctness +
      grammarScore * weights.grammar +
      thinkingLevelScore * weights.thinking +
      completenessScore * weights.completeness;
  }

  // Round to 2 decimal places
  return Math.round(score * 100) / 100;
}

/**
 * Map overall score (0-100) to CEFR level (A1-C2)
 */
function mapScoreToCEFR(score) {
  for (const range of CEFR_MAPPING) {
    if (score >= range.min && score <= range.max) {
      return range.level;
    }
  }
  return "A1"; // Default to beginner if score is invalid
}

/**
 * Get evaluation summary for an attempt
 * @param {string} attemptId - The assessment attempt ID
 * @returns {Promise<Object>} Evaluation summary with stats and detailed answers
 */
export async function getEvaluationSummary(attemptId) {
  const evaluatedAnswers = await prisma.answer.findMany({
    where: {
      attemptId,
      aiOverallScore: { not: null }, // Only evaluated answers
    },
    select: {
      id: true,
      answerText: true,
      aiOverallScore: true,
      aiCefrLevel: true,
      correctnessScore: true,
      grammarScore: true,
      fluencyScore: true,
      completenessScore: true,
      thinkingLevelScore: true,
      detailedFeedback: true,
      strengths: true,
      improvements: true,
      evaluationReasoning: true,
      evaluatedAt: true,
      question: {
        select: {
          questionType: true,
          questionText: true,
          cefrLevel: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (evaluatedAnswers.length === 0) {
    return {
      attemptId,
      totalEvaluated: 0,
      averageScore: 0,
      cefrDistribution: {},
      answers: [],
      message: "No evaluated answers yet",
    };
  }

  // Calculate average score
  const totalScore = evaluatedAnswers.reduce((sum, a) => sum + a.aiOverallScore, 0);
  const averageScore = totalScore / evaluatedAnswers.length;

  // CEFR distribution
  const cefrDistribution = evaluatedAnswers.reduce((acc, answer) => {
    const level = answer.aiCefrLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Overall CEFR level (based on average)
  const overallCefr = mapScoreToCEFR(averageScore);

  return {
    attemptId,
    totalEvaluated: evaluatedAnswers.length,
    averageScore: Math.round(averageScore * 100) / 100,
    overallCefrLevel: overallCefr,
    cefrDistribution,
    answers: evaluatedAnswers, // Now includes detailed evaluation data
  };
}
