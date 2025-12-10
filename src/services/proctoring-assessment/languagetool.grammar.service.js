/**
 * LanguageTool Grammar Checking Service
 * 100% FREE, unlimited usage, better accuracy than AI!
 *
 * This replaces Hugging Face for grammar checking
 */

// Using public LanguageTool API (free with rate limits)
// For production: self-host LanguageTool for unlimited usage
const LANGUAGETOOL_API = "https://api.languagetool.org/v2/check";

/**
 * Check grammar using LanguageTool (FREE!)
 * @param {string} text - Text to check for grammar errors
 * @returns {Promise<Object>} Grammar analysis with score and errors
 */
export async function checkGrammar(text) {
  try {
    console.log("Starting LanguageTool grammar check (FREE)...");

    if (!text || text.trim().length === 0) {
      return {
        grammarScore: 0,
        grammarErrors: [],
        errorCount: 0,
      };
    }

    // Call LanguageTool API
    const response = await fetch(LANGUAGETOOL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: text,
        language: "en-US",
        enabledOnly: "false",
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse matches into our format
    const grammarErrors = data.matches.map((match) => ({
      type: match.rule.category.id.toLowerCase(),
      error: match.message,
      suggestion: match.replacements[0]?.value || "No suggestion",
      severity: match.rule.category.id === "TYPOS" ? "major" :
                match.rule.issueType === "misspelling" ? "major" : "moderate",
      context: match.context.text,
      offset: match.offset,
      length: match.length,
    }));

    const errorCount = grammarErrors.length;

    // Calculate grammar score based on errors
    const grammarScore = calculateGrammarScore(errorCount, text.length);

    console.log(
      `LanguageTool check complete! Score: ${grammarScore}, Errors: ${errorCount}`
    );

    return {
      grammarScore,
      grammarErrors,
      errorCount,
    };
  } catch (error) {
    console.error("LanguageTool grammar check error:", error);

    // Fallback to basic grammar check if API fails
    return performBasicGrammarCheck(text);
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
 * Used if LanguageTool API fails
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
 * Check if LanguageTool is available
 */
export function isLanguageToolConfigured() {
  return true; // Public API always available
}
