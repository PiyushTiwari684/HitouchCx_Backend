function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0; // Perfect match

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1.0 - distance / maxLen;
}

function normalizeName(name) {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^a-z\s]/g, ""); // Remove special characters except spaces
}

export function normalizeDate(dateInput) {
  if (!dateInput) return null;

  // If it's a Date object
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split("T")[0];
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
      return date.toISOString().split("T")[0];
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

function extractPINCode(address) {
  if (!address) return null;

  // Match 6-digit number (Indian PIN code)
  const match = address.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

function extractCity(address) {
  if (!address) return "";

  // Remove PIN code first
  const withoutPIN = address.replace(/\b\d{6}\b/g, "").trim();

  // Split by common delimiters
  const parts = withoutPIN.split(/[,\n]/);

  // Return last non-empty part (usually city/state)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim();
    if (part.length > 0) return part;
  }

  return "";
}

export function validateName(profileName, aadhaarName, panName) {
  const normalized = {
    profile: normalizeName(profileName),
    aadhaar: normalizeName(aadhaarName),
    pan: normalizeName(panName),
  };

  // Calculate pairwise similarities
  const similarity = {
    profileVsAadhaar: calculateSimilarity(normalized.profile, normalized.aadhaar),
    profileVsPan: calculateSimilarity(normalized.profile, normalized.pan),
    aadhaarVsPan: calculateSimilarity(normalized.aadhaar, normalized.pan),
  };

  // Threshold for fuzzy matching (80%)
  const threshold = 0.8;

  // All three must match
  const allMatch =
    similarity.profileVsAadhaar >= threshold &&
    similarity.profileVsPan >= threshold &&
    similarity.aadhaarVsPan >= threshold;

  const result = {
    valid: allMatch,
    similarity,
    threshold,
    normalized,
    original: {
      profile: profileName,
      aadhaar: aadhaarName,
      pan: panName,
    },
  };

  // Add detailed mismatch information
  if (!allMatch) {
    result.mismatch = [];

    if (similarity.profileVsAadhaar < threshold) {
      result.mismatch.push({
        type: "profile_aadhaar",
        message: `Profile name "${profileName}" does not match Aadhaar name "${aadhaarName}"`,
        similarity: similarity.profileVsAadhaar,
      });
    }

    if (similarity.profileVsPan < threshold) {
      result.mismatch.push({
        type: "profile_pan",
        message: `Profile name "${profileName}" does not match PAN name "${panName}"`,
        similarity: similarity.profileVsPan,
      });
    }

    if (similarity.aadhaarVsPan < threshold) {
      result.mismatch.push({
        type: "aadhaar_pan",
        message: `Aadhaar name "${aadhaarName}" does not match PAN name "${panName}"`,
        similarity: similarity.aadhaarVsPan,
      });
    }
  }

  return result;
}

export function validateDOB(profileDOB, aadhaarDOB, panDOB) {
  // Normalize all dates
  const normalized = {
    profile: normalizeDate(profileDOB),
    aadhaar: normalizeDate(aadhaarDOB),
    pan: normalizeDate(panDOB),
  };

  // Check for invalid dates
  if (!normalized.profile || !normalized.aadhaar || !normalized.pan) {
    return {
      valid: false,
      error: "One or more dates are invalid",
      normalized,
      original: { profile: profileDOB, aadhaar: aadhaarDOB, pan: panDOB },
    };
  }

  // All three must match exactly
  const allMatch =
    normalized.profile === normalized.aadhaar && normalized.aadhaar === normalized.pan;

  // Critical: Aadhaar and PAN must match (these are government docs)
  const aadhaarPanMatch = normalized.aadhaar === normalized.pan;

  const result = {
    valid: allMatch,
    normalized,
    original: {
      profile: profileDOB,
      aadhaar: aadhaarDOB,
      pan: panDOB,
    },
    aadhaarPanMatch, // Critical check
  };

  // Add detailed mismatch information
  if (!allMatch) {
    result.mismatch = [];

    if (normalized.profile !== normalized.aadhaar) {
      result.mismatch.push({
        type: "profile_aadhaar",
        message: `Profile DOB "${normalized.profile}" does not match Aadhaar DOB "${normalized.aadhaar}"`,
      });
    }

    if (normalized.profile !== normalized.pan) {
      result.mismatch.push({
        type: "profile_pan",
        message: `Profile DOB "${normalized.profile}" does not match PAN DOB "${normalized.pan}"`,
      });
    }

    if (!aadhaarPanMatch) {
      result.mismatch.push({
        type: "aadhaar_pan",
        message: `Aadhaar DOB "${normalized.aadhaar}" does not match PAN DOB "${normalized.pan}" - Critical mismatch in government documents`,
        critical: true,
      });
    }
  }

  return result;
}

export function validateAddress(profileAddress, aadhaarAddress, profilePincode = null) {
  console.log("\n[ADDRESS VALIDATION] Starting address validation...");
  // Reason: See the raw input data before any processing
  console.log("[ADDRESS VALIDATION] Raw profile address:", profileAddress);
  console.log("[ADDRESS VALIDATION] Profile pincode (if provided separately):", profilePincode);
  console.log(
    "[ADDRESS VALIDATION] Raw Aadhaar address object:",
    JSON.stringify(aadhaarAddress, null, 2),
  );

  if (!profileAddress || !aadhaarAddress) {
    console.log("[ADDRESS VALIDATION] ❌ Missing address data - validation failed");
    const result = {
      valid: false,
      error: "Missing address data",
      profileAddress,
      aadhaarAddress,
      mismatch: [],
    };

    if (!profileAddress) {
      result.mismatch.push({
        type: "missing_profile_address",
        message:
          "Profile address is missing. Please update your profile with your complete address including PIN code.",
      });
    }

    if (!aadhaarAddress) {
      result.mismatch.push({
        type: "missing_aadhaar_address",
        message: "Aadhaar address data is missing or could not be extracted.",
      });
    }

    return result;
  }

  // Normalize addresses for comparison
  const normalizeAddress = (addr) => {
    return addr
      .toLowerCase()
      .replace(/[,.\-:]/g, " ") // Replace punctuation with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  };

  // Extract PIN codes
  // If profilePincode is provided separately, use it; otherwise extract from address string
  const profilePIN = profilePincode || extractPINCode(profileAddress);
  const aadhaarPIN = aadhaarAddress.pin || aadhaarAddress.pc;

  console.log("\n[ADDRESS VALIDATION] PIN Code Extraction:");
  // Reason: Verify PIN extraction is working and see if they match
  console.log(`  Profile PIN: "${profilePIN}" (${profilePincode ? 'provided separately' : 'extracted from address'})`);
  console.log(`  Aadhaar PIN: "${aadhaarPIN}"`);

  // PIN code must match exactly
  const pinMatch = profilePIN === aadhaarPIN;
  console.log(`  PIN Match: ${pinMatch ? "✓" : "❌"} (${pinMatch})`);
  // Reason: Immediate feedback on whether the critical PIN match passed

  // Format full Aadhaar address for comparison
  const aadhaarFullAddress = formatAadhaarAddress(aadhaarAddress);

  console.log("\n[ADDRESS VALIDATION] Address Formatting:");
  // Reason: See the formatted Aadhaar address before normalization
  console.log(`  Formatted Aadhaar address: "${aadhaarFullAddress}"`);

  // Normalize both addresses
  const normalizedProfile = normalizeAddress(profileAddress);
  const normalizedAadhaar = normalizeAddress(aadhaarFullAddress);

  console.log("\n[ADDRESS VALIDATION] Normalized Addresses (for comparison):");
  // Reason: See how addresses look after removing punctuation and lowercasing
  console.log(`  Profile (normalized): "${normalizedProfile}"`);
  console.log(`  Aadhaar (normalized): "${normalizedAadhaar}"`);
  // Reason: Quick visual check if they look similar after normalization

  // Extract key address components
  const profileCity = extractCity(profileAddress);
  const aadhaarCity = aadhaarAddress.district || aadhaarAddress.dist || aadhaarAddress.vtc || "";

  console.log("\n[ADDRESS VALIDATION] City/District Extraction:");
  // Reason: Verify city extraction logic is working correctly
  console.log(`  Profile city: "${profileCity}"`);
  console.log(`  Aadhaar city/district: "${aadhaarCity}"`);

  // Check if key components exist in each other's addresses
  const aadhaarComponents = [
    aadhaarAddress.house,
    aadhaarAddress.street,
    aadhaarAddress.locality,
    aadhaarAddress.vtc,
    aadhaarAddress.district || aadhaarAddress.dist,
  ]
    .filter(Boolean)
    .map((c) => normalizeAddress(c));

  console.log("\n[ADDRESS VALIDATION] Aadhaar Address Components:");
  // Reason: See which components were extracted from Aadhaar for matching
  console.log(`  Total components: ${aadhaarComponents.length}`);
  console.log(`  Components list:`, aadhaarComponents);
  // Reason: Helps identify if components are being extracted correctly

  // Calculate component matches
  let componentMatchCount = 0;
  let totalComponents = aadhaarComponents.length;

  console.log("\n[ADDRESS VALIDATION] Component Matching:");
  // Reason: Track which specific components match and which don't
  const matchedComponentsList = [];
  const unmatchedComponentsList = [];

  aadhaarComponents.forEach((component) => {
    if (component && normalizedProfile.includes(component)) {
      componentMatchCount++;
      matchedComponentsList.push(component);
      console.log(`  ✓ Matched: "${component}"`);
      // Reason: Show which components were found in profile address
    } else {
      unmatchedComponentsList.push(component);
      console.log(`  ❌ Not found: "${component}"`);
      // Reason: Show which components are missing from profile address
    }
  });

  console.log(`  Matched ${componentMatchCount}/${totalComponents} components`);
  // Reason: Quick summary of component matching success rate

  // Calculate overall address similarity
  const addressSimilarity = calculateSimilarity(normalizedProfile, normalizedAadhaar);
  const componentMatchRatio = totalComponents > 0 ? componentMatchCount / totalComponents : 0;

  // City match with fuzzy matching
  const citySimilarity = calculateSimilarity(profileCity, aadhaarCity);
  const cityMatch = citySimilarity >= 0.8;

  console.log("\n[ADDRESS VALIDATION] Similarity Scores:");
  // Reason: See all calculated similarity scores and thresholds
  console.log(
    `  Overall address similarity: ${(addressSimilarity * 100).toFixed(1)}% (threshold: 70%)`,
  );
  console.log(
    `  Component match ratio: ${(componentMatchRatio * 100).toFixed(1)}% (threshold: 60%)`,
  );
  console.log(`  City similarity: ${(citySimilarity * 100).toFixed(1)}% (threshold: 80%)`);
  // Reason: Understand how close the addresses are to passing each criterion

  // Address is valid if:
  // 1. PIN matches AND
  // 2. Either city matches OR at least 60% of address components match OR overall similarity >= 70%
  const addressContentMatch = cityMatch || componentMatchRatio >= 0.6 || addressSimilarity >= 0.7;

  console.log("\n[ADDRESS VALIDATION] Content Match Evaluation:");
  // Reason: Show which criteria passed or failed
  console.log(`  City match (≥80%): ${cityMatch ? "✓" : "❌"}`);
  console.log(`  Component ratio (≥60%): ${componentMatchRatio >= 0.6 ? "✓" : "❌"}`);
  console.log(`  Overall similarity (≥70%): ${addressSimilarity >= 0.7 ? "✓" : "❌"}`);
  console.log(`  Address content match result: ${addressContentMatch ? "✓ PASS" : "❌ FAIL"}`);
  // Reason: Identify which validation path succeeded or why all failed

  const result = {
    valid: pinMatch && addressContentMatch,
    pinMatch,
    cityMatch,
    addressSimilarity,
    componentMatchRatio,
    details: {
      profilePIN,
      aadhaarPIN,
      profileCity,
      aadhaarCity,
      profileAddress,
      aadhaarFullAddress,
      matchedComponents: componentMatchCount,
      totalComponents,
    },
  };

  console.log("\n[ADDRESS VALIDATION] Final Result:");
  // Reason: Show the overall validation outcome and why
  console.log(`  Valid: ${result.valid ? "✓ PASS" : "❌ FAIL"}`);
  if (result.valid) {
    console.log(`  ✓ Both PIN match AND content match criteria satisfied`);
    // Reason: Confirm both required conditions were met
  } else {
    console.log(`  ❌ Validation failed:`);
    if (!pinMatch) console.log(`    - PIN codes don't match`);
    if (!addressContentMatch) console.log(`    - Address content doesn't match sufficiently`);
    // Reason: Clearly state which validation(s) failed
  }
  console.log("[ADDRESS VALIDATION] Validation complete\n");
  // Reason: Mark the end of address validation debugging

  // Add mismatch information
  if (!pinMatch || !addressContentMatch) {
    result.mismatch = [];

    if (!pinMatch) {
      result.mismatch.push({
        type: "pin_code",
        message: `Profile PIN code "${profilePIN}" does not match Aadhaar PIN code "${aadhaarPIN}"`,
      });
    }

    if (!addressContentMatch) {
      const reasons = [];
      if (!cityMatch) {
        reasons.push(
          `city/district mismatch (Profile: "${profileCity}", Aadhaar: "${aadhaarCity}")`,
        );
      }
      if (componentMatchRatio < 0.6) {
        reasons.push(
          `only ${Math.round(componentMatchRatio * 100)}% of address components matched`,
        );
      }
      if (addressSimilarity < 0.7) {
        reasons.push(`overall address similarity is ${Math.round(addressSimilarity * 100)}%`);
      }

      result.mismatch.push({
        type: "address_content",
        message: `Address details do not match sufficiently: ${reasons.join(", ")}`,
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
    address.pin || address.pc,
  ].filter(Boolean);

  return parts.join(", ");
}

// Main KYC validation function(For DOB, Name, Address, Signature)

export function validateKYC(profileData, aadhaarData, panData) {
  console.log("[KYC Validator] Starting validation...");
  console.log("[KYC Validator] Profile:", { name: profileData.name, dob: profileData.dob });
  console.log("[KYC Validator] Aadhaar:", { name: aadhaarData?.name, dob: aadhaarData?.dob });
  console.log("[KYC Validator] PAN:", { name: panData?.name, dob: panData?.dob });

  // Validate required data
  if (!profileData || !aadhaarData || !panData) {
    return {
      valid: false,
      error: "Missing required data for validation",
      validations: null,
    };
  }

  // Perform individual validations
  const nameValidation = validateName(profileData.name, aadhaarData.name, panData.name);

  const dobValidation = validateDOB(profileData.dob, aadhaarData.dob, panData.dob);

  const addressValidation = validateAddress(
    profileData.address,
    aadhaarData.address,
    profileData.pincode // Pass pincode separately if available
  );

  // Check signature verification
  const signatureValidation = {
    valid: aadhaarData.signatureVerified && panData.signatureVerified,
    aadhaarVerified: aadhaarData.signatureVerified,
    panVerified: panData.signatureVerified,
  };

  if (!signatureValidation.valid) {
    signatureValidation.mismatch = [];
    if (!aadhaarData.signatureVerified) {
      signatureValidation.mismatch.push({
        type: "aadhaar_signature",
        message: "Aadhaar XML signature verification failed",
      });
    }
    if (!panData.signatureVerified) {
      signatureValidation.mismatch.push({
        type: "pan_signature",
        message: "PAN XML signature verification failed",
      });
    }
  }

  // Overall validation result
  const allValid =
    nameValidation.valid &&
    dobValidation.valid &&
    addressValidation.valid &&
    signatureValidation.valid;

  const result = {
    valid: allValid,
    validations: {
      name: nameValidation,
      dob: dobValidation,
      address: addressValidation,
      signature: signatureValidation,
    },
  };

  // Collect all error messages
  if (!allValid) {
    result.errors = [];

    if (!nameValidation.valid && nameValidation.mismatch) {
      result.errors.push(...nameValidation.mismatch.map((m) => m.message));
    }

    if (!dobValidation.valid && dobValidation.mismatch) {
      result.errors.push(...dobValidation.mismatch.map((m) => m.message));
    }

    if (!addressValidation.valid && addressValidation.mismatch) {
      result.errors.push(...addressValidation.mismatch.map((m) => m.message));
    }

    if (!signatureValidation.valid && signatureValidation.mismatch) {
      result.errors.push(...signatureValidation.mismatch.map((m) => m.message));
    }
  }

  console.log("[KYC Validator] Validation complete:", {
    valid: allValid,
    errorCount: result.errors?.length || 0,
  });

  return result;
}
