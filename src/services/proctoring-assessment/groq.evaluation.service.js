import groq from "../../utils/groq.client.js";


export async function evaluateAnswer({
  questionText,
  answerText,
  questionType,
  expectedAnswer = null,
}) {
  try {
    console.log(`Starting Groq evaluation for ${questionType} question...`);

    // Build the evaluation prompt based on question type
    const prompt = buildEvaluationPrompt({
      questionText,
      answerText,
      questionType,
      expectedAnswer,
    });

    // Generate evaluation using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert language assessment evaluator specializing in CEFR standards. You provide detailed, structured evaluations in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Free, fast, and accurate
      temperature: 0.3, // Lower temperature for consistent evaluation
      max_tokens: 800,
      response_format: { type: "json_object" }, // Ensures JSON response
    });

    const evaluationText = completion.choices[0].message.content;

    // Parse the response into structured data
    const evaluation = parseEvaluationResponse(evaluationText, questionType);

    console.log("Groq evaluation complete!");

    return evaluation;
  } catch (error) {
    console.error("Groq evaluation error:", error);
    throw new Error(`Groq evaluation failed: ${error.message}`);
  }
}

/**
 * Build the evaluation prompt for Groq AI
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

Return your evaluation as a JSON object with this EXACT structure:
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

Return your evaluation as a JSON object with this EXACT structure:
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
 * Parse Groq's response into structured evaluation object
 */
function parseEvaluationResponse(responseText, questionType) {
  try {
    // Parse JSON (Groq returns clean JSON with response_format)
    const parsed = JSON.parse(responseText);

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
    console.error("Failed to parse Groq response:", error);
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
 * Check if Groq AI is properly configured
 */
export function isGroqConfigured() {
  return !!process.env.GROQ_API_KEY;
}
