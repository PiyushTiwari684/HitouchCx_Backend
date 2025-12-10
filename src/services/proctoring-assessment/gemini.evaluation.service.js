import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Evaluate an answer using Gemini AI
 * @param {Object} params - Evaluation parameters
 * @param {string} params.questionText - The question text
 * @param {string} params.answerText - The candidate's answer
 * @param {string} params.questionType - Type: "WRITING" or "SPEAKING"
 * @param {string} params.expectedAnswer - Expected/correct answer (optional)
 * @returns {Promise<Object>} Evaluation results with scores and feedback
 */
export async function evaluateAnswer({
  questionText,
  answerText,
  questionType,
  expectedAnswer = null,
}) {
  try {
    console.log(`Starting Gemini evaluation for ${questionType} question...`);

    // Get the Gemini model (using Flash for speed and cost-effectiveness)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build the evaluation prompt based on question type
    const prompt = buildEvaluationPrompt({
      questionText,
      answerText,
      questionType,
      expectedAnswer,
    });

    // Generate evaluation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluationText = response.text();

    // Parse the AI response into structured data
    const evaluation = parseEvaluationResponse(evaluationText, questionType);

    console.log("Gemini evaluation complete!");

    return evaluation;
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    throw new Error(`Gemini evaluation failed: ${error.message}`);
  }
}

/**
 * Build the evaluation prompt for Gemini AI
 */
function buildEvaluationPrompt({
  questionText,
  answerText,
  questionType,
  expectedAnswer,
}) {
  const basePrompt = `You are an expert language assessment evaluator. Evaluate the following answer according to CEFR standards.

QUESTION:
${questionText}

${expectedAnswer ? `EXPECTED ANSWER:\n${expectedAnswer}\n\n` : ""}CANDIDATE'S ANSWER:
${answerText}

QUESTION TYPE: ${questionType}

Evaluate the answer on the following criteria (score each 0-100):

1. CORRECTNESS: How accurate and relevant is the answer to the question?
   - Is the content factually correct?
   - Does it address the question directly?
   - Is the information relevant?

2. THINKING LEVEL: What depth of critical thinking is demonstrated?
   - Does it show analysis and reasoning?
   - Are ideas well-developed?
   - Is there evidence of understanding concepts?

`;

  // Add type-specific criteria
  if (questionType === "SPEAKING") {
    return (
      basePrompt +
      `3. FLUENCY: How natural, smooth, and clear is the speech? (Evaluate based on transcribed text)
   - Is the language flow natural?
   - Are sentences well-structured?
   - Is communication clear and coherent?

IMPORTANT: Return your evaluation in this EXACT JSON format (no extra text):
{
  "correctnessScore": <number 0-100>,
  "thinkingLevelScore": <number 0-100>,
  "fluencyScore": <number 0-100>,
  "detailedFeedback": "<2-3 sentence paragraph explaining the evaluation>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "reasoning": "<explanation of why these scores were given>"
}`
    );
  } else {
    // WRITING
    return (
      basePrompt +
      `3. COMPLETENESS: How thorough and complete is the answer?
   - Does it cover all aspects of the question?
   - Is the response adequately detailed?
   - Are examples or explanations provided?

IMPORTANT: Return your evaluation in this EXACT JSON format (no extra text):
{
  "correctnessScore": <number 0-100>,
  "thinkingLevelScore": <number 0-100>,
  "completenessScore": <number 0-100>,
  "detailedFeedback": "<2-3 sentence paragraph explaining the evaluation>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "reasoning": "<explanation of why these scores were given>"
}`
    );
  }
}

/**
 * Parse Gemini's response into structured evaluation object
 */
function parseEvaluationResponse(responseText, questionType) {
  try {
    // Remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate and structure the response
    return {
      correctnessScore: validateScore(parsed.correctnessScore),
      thinkingLevelScore: validateScore(parsed.thinkingLevelScore),
      fluencyScore:
        questionType === "SPEAKING"
          ? validateScore(parsed.fluencyScore)
          : null,
      completenessScore:
        questionType === "WRITING"
          ? validateScore(parsed.completenessScore)
          : null,
      detailedFeedback: parsed.detailedFeedback || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    console.error("Response text:", responseText);

    // Return default structure if parsing fails
    return {
      correctnessScore: 50,
      thinkingLevelScore: 50,
      fluencyScore: questionType === "SPEAKING" ? 50 : null,
      completenessScore: questionType === "WRITING" ? 50 : null,
      detailedFeedback: "Evaluation completed but response format was invalid.",
      strengths: [],
      improvements: [],
      reasoning: "Unable to parse detailed evaluation.",
    };
  }
}

/**
 * Validate and clamp scores to 0-100 range
 */
function validateScore(score) {
  const num = parseFloat(score);
  if (isNaN(num)) return 50; // Default to middle score if invalid
  return Math.max(0, Math.min(100, num)); // Clamp between 0-100
}

/**
 * Check if Gemini AI is properly configured
 */
export function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}
