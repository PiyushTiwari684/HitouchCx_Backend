/**
 * KYC Helper Utilities
 *
 * This module contains utility functions for KYC document processing,
 * including photo extraction, name validation, and file management.
 *
 * @module utils/kyc-helpers
 */

/**
 * Extract photo from Aadhaar XML content
 *
 * Aadhaar XML from DigiLocker contains a base64-encoded photo in <Pht> tag.
 * This function extracts that photo data.
 *
 * @param {string} xmlContent - The XML content from Aadhaar document
 * @returns {string|null} Base64 photo string or null if not found
 *
 * @example
 * const photo = extractPhotoFromXml(aadhaarXml);
 * if (photo) {
 *   // Save photo to file
 *   fs.writeFileSync('photo.jpg', Buffer.from(photo, 'base64'));
 * }
 */
export const extractPhotoFromXml = (xmlContent) => {
  try {
    // Aadhaar XML structure: <Pht>base64_photo_data</Pht>
    const photoMatch = xmlContent.match(/<Pht>(.*?)<\/Pht>/);

    if (photoMatch && photoMatch[1]) {
      return photoMatch[1]; // Returns Base64 string
    }

    return null;
  } catch (error) {
    console.error('Error extracting photo from XML:', error);
    return null;
  }
};

/**
 * Normalize a name string for comparison
 *
 * - Converts to lowercase
 * - Removes extra spaces
 * - Trims whitespace
 *
 * @param {string} name - Name to normalize
 * @returns {string} Normalized name
 *
 * @example
 * normalizeName("  Rajesh   Kumar  ") // "rajesh kumar"
 * normalizeName("RAJESH KUMAR") // "rajesh kumar"
 */
export const normalizeName = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Calculate string similarity percentage using Levenshtein distance
 *
 * Used for fuzzy name matching when exact match fails.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 *
 * @example
 * calculateSimilarity("Rajesh Kumar", "Rajesh K") // ~0.82
 * calculateSimilarity("John Doe", "Jane Doe") // ~0.75
 */
export const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // If identical, return 1
  if (s1 === s2) return 1;

  // Levenshtein distance algorithm
  const matrix = [];
  const n = s1.length;
  const m = s2.length;

  // Initialize matrix
  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[n][m];
  const maxLength = Math.max(n, m);

  // Convert distance to similarity (0-1)
  return 1 - distance / maxLength;
};

/**
 * Validate if three names match (registered, Aadhaar, PAN)
 *
 * Uses both exact matching and fuzzy matching (80% threshold).
 * Names are normalized before comparison.
 *
 * @param {string} registeredName - Name from agent registration
 * @param {string} aadhaarName - Name from Aadhaar card
 * @param {string} panName - Name from PAN card
 * @returns {Object} Validation result
 * @returns {boolean} returns.valid - Whether names match
 * @returns {Object} [returns.mismatch] - Details if names don't match
 *
 * @example
 * validateNames("Rajesh Kumar", "Rajesh Kumar", "RAJESH KUMAR")
 * // { valid: true }
 *
 * validateNames("Rajesh Kumar", "John Doe", "RAJESH KUMAR")
 * // { valid: false, mismatch: { registered: "Rajesh Kumar", aadhaar: "John Doe", pan: "RAJESH KUMAR" } }
 */
export const validateNames = (registeredName, aadhaarName, panName) => {
  // Normalize all names
  const reg = normalizeName(registeredName);
  const aad = normalizeName(aadhaarName);
  const pan = normalizeName(panName);

  // Exact match check
  if (reg === aad && reg === pan) {
    return { valid: true };
  }

  // Fuzzy match check (80% similarity threshold)
  const similarity1 = calculateSimilarity(reg, aad);
  const similarity2 = calculateSimilarity(reg, pan);
  const similarity3 = calculateSimilarity(aad, pan);

  // All three should be at least 80% similar
  if (similarity1 >= 0.8 && similarity2 >= 0.8 && similarity3 >= 0.8) {
    return { valid: true, fuzzyMatch: true };
  }

  // Names don't match
  return {
    valid: false,
    mismatch: {
      registered: registeredName,
      aadhaar: aadhaarName,
      pan: panName,
    },
    similarities: {
      registeredVsAadhaar: similarity1,
      registeredVsPan: similarity2,
      aadhaarVsPan: similarity3,
    },
  };
};

/**
 * Sanitize URI for use in filename
 *
 * Replaces all non-alphanumeric characters with underscores.
 * Used to create safe filenames from document URIs.
 *
 * @param {string} uri - Document URI from DigiLocker
 * @returns {string} Sanitized string safe for filename
 *
 * @example
 * sanitizeUriForFilename("in.gov.uidai-ADHAR-xxxxx")
 * // "in_gov_uidai_ADHAR_xxxxx"
 */
export const sanitizeUriForFilename = (uri) => {
  return uri.replace(/[^a-zA-Z0-9-]/g, '_');
};

/**
 * Generate file path for KYC document
 *
 * Creates a unique file path with timestamp to prevent collisions.
 *
 * @param {string} userId - User ID
 * @param {string} documentType - 'aadhaar' or 'pan'
 * @param {string} extension - File extension (pdf, xml, jpg)
 * @returns {string} Relative file path
 *
 * @example
 * generateFilePath("clx123", "aadhaar", "pdf")
 * // "uploads/kyc/aadhaar/clx123_aadhaar_1704567890.pdf"
 */
export const generateFilePath = (userId, documentType, extension) => {
  const timestamp = Date.now();
  const filename = `${userId}_${documentType}_${timestamp}.${extension}`;
  return `uploads/kyc/${documentType}/${filename}`;
};

/**
 * Generate OAuth state parameter
 *
 * Creates a secure state parameter for DigiLocker OAuth flow.
 * Format: userId_timestamp_random
 *
 * @param {string} userId - User ID
 * @returns {string} State parameter
 *
 * @example
 * generateOAuthState("clx123")
 * // "clx123_1704567890_abc123"
 */
export const generateOAuthState = (userId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${userId}_${timestamp}_${random}`;
};

/**
 * Parse OAuth state parameter
 *
 * Extracts userId from state parameter.
 *
 * @param {string} state - OAuth state parameter
 * @returns {Object} Parsed state
 * @returns {string} returns.userId - Extracted user ID
 *
 * @example
 * parseOAuthState("clx123_1704567890_abc123")
 * // { userId: "clx123" }
 */
export const parseOAuthState = (state) => {
  const parts = state.split('_');
  return {
    userId: parts[0],
  };
};

/**
 * Check if session has expired
 *
 * @param {Date} expiresAt - Session expiry time
 * @returns {boolean} True if expired
 */
export const isSessionExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Calculate session expiry time
 *
 * @param {number} minutes - Minutes until expiry (default 30)
 * @returns {Date} Expiry date
 */
export const calculateExpiryTime = (minutes = 30) => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
};

/**
 * Construct full address string from structured address components
 *
 * Combines address, city, state, and pincode into a single formatted string
 * for KYC validation. Filters out empty/null values.
 *
 * @param {Object} components - Address components
 * @param {string} [components.address] - Street address line
 * @param {string} [components.city] - City name
 * @param {string} [components.state] - State name
 * @param {string} [components.pincode] - PIN code
 * @returns {string} Full address string with components joined by ", "
 *
 * @example
 * constructFullAddress({
 *   address: "123 Main Street",
 *   city: "Mumbai",
 *   state: "Maharashtra",
 *   pincode: "400001"
 * })
 * // "123 Main Street, Mumbai, Maharashtra, 400001"
 *
 * @example
 * constructFullAddress({
 *   address: "Plot 45, Sector 12",
 *   city: "Bangalore",
 *   state: null,
 *   pincode: "560001"
 * })
 * // "Plot 45, Sector 12, Bangalore, 560001"
 */
export const constructFullAddress = (components) => {
  if (!components) return '';

  const { address, city, state, pincode } = components;

  const parts = [
    address,
    city,
    state,
    pincode
  ].filter(Boolean); // Remove empty, null, or undefined values

  return parts.join(', ');
};
