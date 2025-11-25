function levenshteinDistance(str1, str2){
     console.log("String match called from levensh ");
    const l1 = str1.length;
    const l2 = str2.length;

    //create 2D array for DP

    const matrix = Array(l1 + 1)
        .fill(null)
        .map(()=>Array(l2+1).fill(null));

     // Initialize first column and row
  for (let i = 0; i <= l1; i++) matrix[i][0] = i;
  for (let j = 0; j <= l2; j++) matrix[0][j] = j;

  // Fill matrix using dynamic programming
  for (let i = 1; i <= l1; i++) {
    for (let j = 1; j <= l2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[l1][l2];
}

/**
 * Normalize string for comparison
 * - Convert to lowercase
 * - Remove extra spaces
 * - Remove punctuation
 * @param {string} str - Input string
 * @returns {string} - Normalized string
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate similarity percentage between two strings
 * @param {string} str1 - Original text (what was displayed)
 * @param {string} str2 - Transcribed text (what ASR heard)
 * @returns {number} - Similarity percentage (0-100)
 */
export function calculateSimilarity(str1, str2) {
  // Handle edge cases
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  // Normalize both strings
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // If strings are identical after normalization
  if (normalized1 === normalized2) return 100;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);

  // Calculate similarity percentage
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if two strings match based on threshold
 * @param {string} str1 - Original text
 * @param {string} str2 - Transcribed text
 * @param {number} threshold - Minimum similarity percentage (default: 80)
 * @returns {object} - { isMatch: boolean, score: number }
 */
export function checkMatch(str1, str2, threshold = 80) {
  const score = calculateSimilarity(str1, str2);
  const isMatch = score >= threshold;

  return {
    isMatch,
    score,
    threshold,
  };
}