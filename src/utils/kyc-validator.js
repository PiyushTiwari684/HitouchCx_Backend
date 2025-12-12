/**
 * KYC Validation Utility
 *
 * Comprehensive validation for KYC verification:
 * - Name matching across Profile, Aadhaar, and PAN (fuzzy, 80% threshold)
 * - DOB matching across all three (exact)
 * - Address matching between Profile and Aadhaar (PIN exact, others fuzzy)
 *
 * @module utils/kyc-validator
 */

/**
 * Calculate Levenshtein distance between two strings
 * (Number of edits needed to transform one string to another)
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 * @private
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0 to 1)
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0 = no match, 1 = perfect match)
 * @private
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0; // Perfect match

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1.0 - (distance / maxLen);
}

/**
 * Normalize name for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove extra spaces
 * - Remove special characters except spaces
 *
 * @param {string} name - Name to normalize
 * @returns {string} Normalized name
 * @private
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/[^a-z\s]/g, '');      // Remove special characters except spaces
}

/**
 * Normalize date to YYYY-MM-DD format
 *
 * Handles formats:
 * - YYYY-MM-DD (already normalized)
 * - DD-MM-YYYY
 * - DD/MM/YYYY
 * - ISO format with time
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string|null} Normalized date in YYYY-MM-DD format, or null if invalid
 */
export function normalizeDate(dateInput) {
  if (!dateInput) return null;

  // If it's a Date object
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }

  const dateStr = String(dateInput).trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // DD-MM-YYYY or DD/MM/YYYY format
  const ddmmyyyy = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  // Try parsing with Date object
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

/**
 * Extract PIN code from address string
 *
 * @param {string} address - Address string
 * @returns {string|null} 6-digit PIN code or null
 * @private
 */
function extractPINCode(address) {
  if (!address) return null;

  // Match 6-digit number (Indian PIN code)
  const match = address.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/**
 * Extract city/district from address string
 * Looks for common patterns before PIN code
 *
 * @param {string} address - Address string
 * @returns {string} Extracted city/district
 * @private
 */
function extractCity(address) {
  if (!address) return '';

  // Remove PIN code first
  const withoutPIN = address.replace(/\b\d{6}\b/g, '').trim();

  // Split by common delimiters
  const parts = withoutPIN.split(/[,\n]/);

  // Return last non-empty part (usually city/state)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim();
    if (part.length > 0) return part;
  }

  return '';
}

/**
 * Validate name across Profile, Aadhaar, and PAN
 * All three must match with fuzzy matching (80% similarity threshold)
 *
 * @param {string} profileName - Full name from profile (firstName + middleName + lastName)
 * @param {string} aadhaarName - Name from Aadhaar
 * @param {string} panName - Name from PAN
 * @returns {Object} Validation result
 */
export function validateName(profileName, aadhaarName, panName) {
  const normalized = {
    profile: normalizeName(profileName),
    aadhaar: normalizeName(aadhaarName),
    pan: normalizeName(panName)
  };

  // Calculate pairwise similarities
  const similarity = {
    profileVsAadhaar: calculateSimilarity(normalized.profile, normalized.aadhaar),
    profileVsPan: calculateSimilarity(normalized.profile, normalized.pan),
    aadhaarVsPan: calculateSimilarity(normalized.aadhaar, normalized.pan)
  };

  // Threshold for fuzzy matching (80%)
  const threshold = 0.80;

  // All three must match
  const allMatch = (
    similarity.profileVsAadhaar >= threshold &&
    similarity.profileVsPan >= threshold &&
    similarity.aadhaarVsPan >= threshold
  );

  const result = {
    valid: allMatch,
    similarity,
    threshold,
    normalized,
    original: {
      profile: profileName,
      aadhaar: aadhaarName,
      pan: panName
    }
  };

  // Add detailed mismatch information
  if (!allMatch) {
    result.mismatch = [];

    if (similarity.profileVsAadhaar < threshold) {
      result.mismatch.push({
        type: 'profile_aadhaar',
        message: `Profile name "${profileName}" does not match Aadhaar name "${aadhaarName}"`,
        similarity: similarity.profileVsAadhaar
      });
    }

    if (similarity.profileVsPan < threshold) {
      result.mismatch.push({
        type: 'profile_pan',
        message: `Profile name "${profileName}" does not match PAN name "${panName}"`,
        similarity: similarity.profileVsPan
      });
    }

    if (similarity.aadhaarVsPan < threshold) {
      result.mismatch.push({
        type: 'aadhaar_pan',
        message: `Aadhaar name "${aadhaarName}" does not match PAN name "${panName}"`,
        similarity: similarity.aadhaarVsPan
      });
    }
  }

  return result;
}

/**
 * Validate DOB across Profile, Aadhaar, and PAN
 * All three must match exactly
 *
 * @param {string|Date} profileDOB - DOB from profile
 * @param {string|Date} aadhaarDOB - DOB from Aadhaar
 * @param {string|Date} panDOB - DOB from PAN
 * @returns {Object} Validation result
 */
export function validateDOB(profileDOB, aadhaarDOB, panDOB) {
  // Normalize all dates
  const normalized = {
    profile: normalizeDate(profileDOB),
    aadhaar: normalizeDate(aadhaarDOB),
    pan: normalizeDate(panDOB)
  };

  // Check for invalid dates
  if (!normalized.profile || !normalized.aadhaar || !normalized.pan) {
    return {
      valid: false,
      error: 'One or more dates are invalid',
      normalized,
      original: { profile: profileDOB, aadhaar: aadhaarDOB, pan: panDOB }
    };
  }

  // All three must match exactly
  const allMatch = (
    normalized.profile === normalized.aadhaar &&
    normalized.aadhaar === normalized.pan
  );

  // Critical: Aadhaar and PAN must match (these are government docs)
  const aadhaarPanMatch = (normalized.aadhaar === normalized.pan);

  const result = {
    valid: allMatch,
    normalized,
    original: {
      profile: profileDOB,
      aadhaar: aadhaarDOB,
      pan: panDOB
    },
    aadhaarPanMatch // Critical check
  };

  // Add detailed mismatch information
  if (!allMatch) {
    result.mismatch = [];

    if (normalized.profile !== normalized.aadhaar) {
      result.mismatch.push({
        type: 'profile_aadhaar',
        message: `Profile DOB "${normalized.profile}" does not match Aadhaar DOB "${normalized.aadhaar}"`
      });
    }

    if (normalized.profile !== normalized.pan) {
      result.mismatch.push({
        type: 'profile_pan',
        message: `Profile DOB "${normalized.profile}" does not match PAN DOB "${normalized.pan}"`
      });
    }

    if (!aadhaarPanMatch) {
      result.mismatch.push({
        type: 'aadhaar_pan',
        message: `Aadhaar DOB "${normalized.aadhaar}" does not match PAN DOB "${normalized.pan}" - Critical mismatch in government documents`,
        critical: true
      });
    }
  }

  return result;
}

/**
 * Validate address between Profile and Aadhaar
 * - PIN code must match exactly
 * - District/City must match with fuzzy matching (80%)
 *
 * @param {string} profileAddress - Full address string from profile
 * @param {Object} aadhaarAddress - Address object from Aadhaar
 * @returns {Object} Validation result
 */
export function validateAddress(profileAddress, aadhaarAddress) {
  if (!profileAddress || !aadhaarAddress) {
    const result = {
      valid: false,
      error: 'Missing address data',
      profileAddress,
      aadhaarAddress,
      mismatch: []
    };

    if (!profileAddress) {
      result.mismatch.push({
        type: 'missing_profile_address',
        message: 'Profile address is missing. Please update your profile with your complete address including PIN code.'
      });
    }

    if (!aadhaarAddress) {
      result.mismatch.push({
        type: 'missing_aadhaar_address',
        message: 'Aadhaar address data is missing or could not be extracted.'
      });
    }

    return result;
  }

  // Extract PIN codes
  const profilePIN = extractPINCode(profileAddress);
  const aadhaarPIN = aadhaarAddress.pin || aadhaarAddress.pc;

  // PIN code must match exactly
  const pinMatch = (profilePIN === aadhaarPIN);

  // Extract and compare city/district
  const profileCity = extractCity(profileAddress);
  const aadhaarCity = aadhaarAddress.district || aadhaarAddress.dist || aadhaarAddress.vtc || '';

  const cityMatch = calculateSimilarity(profileCity, aadhaarCity) >= 0.80;

  const result = {
    valid: pinMatch && cityMatch,
    pinMatch,
    cityMatch,
    details: {
      profilePIN,
      aadhaarPIN,
      profileCity,
      aadhaarCity,
      profileAddress,
      aadhaarFullAddress: formatAadhaarAddress(aadhaarAddress)
    }
  };

  // Add mismatch information
  if (!pinMatch || !cityMatch) {
    result.mismatch = [];

    if (!pinMatch) {
      result.mismatch.push({
        type: 'pin_code',
        message: `Profile PIN code "${profilePIN}" does not match Aadhaar PIN code "${aadhaarPIN}"`
      });
    }

    if (!cityMatch) {
      result.mismatch.push({
        type: 'city_district',
        message: `Profile city/district "${profileCity}" does not match Aadhaar "${aadhaarCity}"`
      });
    }
  }

  return result;
}

/**
 * Format Aadhaar address object to readable string
 *
 * @param {Object} address - Aadhaar address object
 * @returns {string} Formatted address
 * @private
 */
function formatAadhaarAddress(address) {
  const parts = [
    address.house,
    address.street,
    address.locality,
    address.vtc,
    address.district || address.dist,
    address.state,
    address.pin || address.pc
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Main KYC Validation Function
 * Validates Name, DOB, and Address across all documents
 *
 * @param {Object} profileData - Profile registration data
 * @param {string} profileData.name - Full name (firstName + middleName + lastName)
 * @param {string|Date} profileData.dob - Date of birth
 * @param {string} profileData.address - Full address string
 * @param {Object} aadhaarData - Extracted Aadhaar data
 * @param {string} aadhaarData.name - Name from Aadhaar
 * @param {string} aadhaarData.dob - DOB from Aadhaar
 * @param {Object} aadhaarData.address - Address object from Aadhaar
 * @param {boolean} aadhaarData.signatureVerified - XML signature status
 * @param {Object} panData - Extracted PAN data
 * @param {string} panData.name - Name from PAN
 * @param {string} panData.dob - DOB from PAN
 * @param {boolean} panData.signatureVerified - XML signature status
 * @returns {Object} Complete validation result
 */
export function validateKYC(profileData, aadhaarData, panData) {
  console.log('[KYC Validator] Starting validation...');
  console.log('[KYC Validator] Profile:', { name: profileData.name, dob: profileData.dob });
  console.log('[KYC Validator] Aadhaar:', { name: aadhaarData?.name, dob: aadhaarData?.dob });
  console.log('[KYC Validator] PAN:', { name: panData?.name, dob: panData?.dob });

  // Validate required data
  if (!profileData || !aadhaarData || !panData) {
    return {
      valid: false,
      error: 'Missing required data for validation',
      validations: null
    };
  }

  // Perform individual validations
  const nameValidation = validateName(
    profileData.name,
    aadhaarData.name,
    panData.name
  );

  const dobValidation = validateDOB(
    profileData.dob,
    aadhaarData.dob,
    panData.dob
  );

  const addressValidation = validateAddress(
    profileData.address,
    aadhaarData.address
  );

  // Check signature verification
  const signatureValidation = {
    valid: aadhaarData.signatureVerified && panData.signatureVerified,
    aadhaarVerified: aadhaarData.signatureVerified,
    panVerified: panData.signatureVerified
  };

  if (!signatureValidation.valid) {
    signatureValidation.mismatch = [];
    if (!aadhaarData.signatureVerified) {
      signatureValidation.mismatch.push({
        type: 'aadhaar_signature',
        message: 'Aadhaar XML signature verification failed'
      });
    }
    if (!panData.signatureVerified) {
      signatureValidation.mismatch.push({
        type: 'pan_signature',
        message: 'PAN XML signature verification failed'
      });
    }
  }

  // Overall validation result
  const allValid = (
    nameValidation.valid &&
    dobValidation.valid &&
    addressValidation.valid &&
    signatureValidation.valid
  );

  const result = {
    valid: allValid,
    validations: {
      name: nameValidation,
      dob: dobValidation,
      address: addressValidation,
      signature: signatureValidation
    }
  };

  // Collect all error messages
  if (!allValid) {
    result.errors = [];

    if (!nameValidation.valid && nameValidation.mismatch) {
      result.errors.push(...nameValidation.mismatch.map(m => m.message));
    }

    if (!dobValidation.valid && dobValidation.mismatch) {
      result.errors.push(...dobValidation.mismatch.map(m => m.message));
    }

    if (!addressValidation.valid && addressValidation.mismatch) {
      result.errors.push(...addressValidation.mismatch.map(m => m.message));
    }

    if (!signatureValidation.valid && signatureValidation.mismatch) {
      result.errors.push(...signatureValidation.mismatch.map(m => m.message));
    }
  }

  console.log('[KYC Validator] Validation complete:', { valid: allValid, errorCount: result.errors?.length || 0 });

  return result;
}
