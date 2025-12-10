import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Check grammar using Hugging Face models
 * @param {string} text - Text to check for grammar errors
 * @returns {Promise<Object>} Grammar analysis with score and errors
 */
export async function checkGrammar(text) {
  try {
    console.log("Starting Hugging Face grammar check...");

    if (!text || text.trim().length === 0) {
      return {
        grammarScore: 0,
        grammarErrors: [],
        errorCount: 0,
      };
    }

    // Use Llama model for grammar checking
    // We'll ask it to identify grammar errors in structured format
    const prompt = `You are a grammar checking assistant. Analyze the following text for grammar, spelling, and punctuation errors.

TEXT TO ANALYZE:
${text}

Return your analysis in this EXACT JSON format (no extra text):
{
  "errors": [
    {
      "type": "grammar|spelling|punctuation",
      "error": "<the error found>",
      "suggestion": "<how to fix it>",
      "severity": "minor|moderate|major"
    }
  ],
  "overallQuality": "<brief assessment>",
  "errorCount": <number of errors>
}

If there are no errors, return:
{
  "errors": [],
  "overallQuality": "Excellent grammar with no errors detected",
  "errorCount": 0
}`;

    const response = await hf.textGeneration({
      model: "meta-llama/Llama-3.2-3B-Instruct",
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent output
        top_p: 0.9,
      },
    });

    // Parse the response
    const grammarAnalysis = parseGrammarResponse(response.generated_text);

    // Calculate grammar score based on errors
    const grammarScore = calculateGrammarScore(
      grammarAnalysis.errorCount,
      text.length
    );

    console.log(
      `Grammar check complete! Score: ${grammarScore}, Errors: ${grammarAnalysis.errorCount}`
    );

    return {
      grammarScore,
      grammarErrors: grammarAnalysis.errors,
      errorCount: grammarAnalysis.errorCount,
    };
  } catch (error) {
    console.error("Hugging Face grammar check error:", error);

    // Fallback to basic grammar check if API fails
    return performBasicGrammarCheck(text);
  }
}

/**
 * Parse Hugging Face response into structured format
 */
function parseGrammarResponse(responseText) {
  try {
    // Extract JSON from response (model might include extra text)
    let jsonText = responseText.trim();

    // Try to find JSON in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const parsed = JSON.parse(jsonText);

    return {
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      errorCount: parsed.errorCount || parsed.errors?.length || 0,
      overallQuality: parsed.overallQuality || "",
    };
  } catch (error) {
    console.error("Failed to parse grammar response:", error);
    console.error("Response text:", responseText);

    // Return empty result if parsing fails
    return {
      errors: [],
      errorCount: 0,
      overallQuality: "Unable to analyze",
    };
  }
}

/**
 * Calculate grammar score (0-100) based on error count and text length
 */
function calculateGrammarScore(errorCount, textLength) {
  if (textLength === 0) return 0;
  if (errorCount === 0) return 100;

  // Calculate words (rough estimate: 5 characters per word)
  const estimatedWords = textLength / 5;

  // Calculate error rate (errors per 100 words)
  const errorRate = (errorCount / estimatedWords) * 100;

  // Score calculation:
  // 0-1 errors per 100 words = 95-100 (excellent)
  // 1-2 errors per 100 words = 85-95 (good)
  // 2-4 errors per 100 words = 70-85 (fair)
  // 4+ errors per 100 words = below 70 (needs improvement)

  let score;
  if (errorRate <= 1) {
    score = 100 - errorRate * 5;
  } else if (errorRate <= 2) {
    score = 95 - (errorRate - 1) * 10;
  } else if (errorRate <= 4) {
    score = 85 - (errorRate - 2) * 7.5;
  } else {
    score = Math.max(0, 70 - (errorRate - 4) * 5);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Fallback: Basic grammar check using simple rules
 * Used if Hugging Face API fails
 */
function performBasicGrammarCheck(text) {
  console.log("Using fallback basic grammar check...");

  const errors = [];
  let errorCount = 0;

  // Check for common issues
  // 1. Multiple spaces
  if (/  +/.test(text)) {
    errors.push({
      type: "formatting",
      error: "Multiple consecutive spaces found",
      suggestion: "Use single spaces between words",
      severity: "minor",
    });
    errorCount++;
  }

  // 2. Missing capitalization at sentence start
  const sentences = text.split(/[.!?]+/);
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      errors.push({
        type: "capitalization",
        error: `Sentence starts with lowercase: "${trimmed.substring(0, 20)}..."`,
        suggestion: "Start sentences with capital letters",
        severity: "moderate",
      });
      errorCount++;
    }
  });

  // 3. Missing punctuation at end
  if (text.trim().length > 0 && !/[.!?]$/.test(text.trim())) {
    errors.push({
      type: "punctuation",
      error: "Missing punctuation at end of text",
      suggestion: "End sentences with proper punctuation",
      severity: "minor",
    });
    errorCount++;
  }

  // Calculate score
  const grammarScore = calculateGrammarScore(errorCount, text.length);

  return {
    grammarScore,
    grammarErrors: errors,
    errorCount,
  };
}

/**
 * Check if Hugging Face is properly configured
 */
export function isHuggingFaceConfigured() {
  return !!process.env.HUGGINGFACE_API_KEY;
}
