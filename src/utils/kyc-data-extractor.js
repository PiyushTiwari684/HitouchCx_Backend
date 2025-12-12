/**
 * KYC Data Extractor Utility
 *
 * Extracts structured data from DigiLocker Aadhaar and PAN documents.
 * Provides clean, formatted data for frontend consumption.
 *
 * @module utils/kyc-data-extractor
 */

/**
 * Extract complete data from Aadhaar document
 *
 * @param {Object} aadhaarDoc - KYCDocument from database (documentType: 'AADHAR')
 * @returns {Object} Extracted Aadhaar data
 */
export function extractAadhaarData(aadhaarDoc) {
  if (!aadhaarDoc) return null;
  console.log("[KYC Data Extractor] Aadhaar Document:", aadhaarDoc);
  const parsedData = aadhaarDoc.parsedData?.data || {};
  console.log("[KYC Data Extractor] Parsed Data:", parsedData);
  const issuedTo = parsedData.issuedTo || {};
  const address = issuedTo.address || {};
  const additionalData = parsedData.additionalData || {};

  return {
    // Basic Information
    name: issuedTo.name || aadhaarDoc.holderName || null,
    uid: issuedTo.uid || aadhaarDoc.documentNumber || null, // Masked Aadhaar number
    dob: issuedTo.dob || null, // Format: YYYY-MM-DD or DD-MM-YYYY
    gender: issuedTo.gender || null, // MALE, FEMALE, OTHER

    // Address Details (full object)
    address: {
      careOf: address.co || address.careOf || null, // S/O, D/O, W/O, C/O
      house: address.house || null, // House number
      street: address.street || null, // Street name
      landmark: address.landmark || null,
      locality: address.locality || null, // Sector, Area
      vtc: address.vtc || null, // Village/Town/City or Ward No
      district: address.district || address.dist || null,
      state: address.state || null,
      pin: address.pin || address.pc || null, // PIN code
      country: address.country || 'India',
      type: address.type || 'permanent',
    },

    // Formatted address string
    fullAddress: formatAddress(address),

    // Photo (Base64 JPEG)
    photo: issuedTo.photo?.content || null,
    photoFormat: issuedTo.photo?.format || 'JPEG',
    photoUrl: aadhaarDoc.photoUrl || null, // Saved file path/URL

    // Verification
    signatureVerified: aadhaarDoc.signatureVerified || false,
    xmlSignatureVerified: aadhaarDoc.parsedData?.xmlSignatureVerified || false,
    verificationStatus: aadhaarDoc.verificationStatus || 'PENDING',
    verifiedAt: aadhaarDoc.verifiedAt || null,
    verifiedBy: aadhaarDoc.verifiedBy || 'DigiLocker',

    // PDF Document
    documentUrl: aadhaarDoc.documentUrl || null, // PDF file path/URL
    pdfBase64: null, // Not stored in DB to save space

    // Metadata
    timestamp: additionalData.ts || null,
    ttl: additionalData.ttl || null,
    documentUri: aadhaarDoc.parsedData?.documentUri || null,
  };
}

/**
 * Extract complete data from PAN document
 *
 * @param {Object} panDoc - KYCDocument from database (documentType: 'PAN')
 * @returns {Object} Extracted PAN data
 */
export function extractPANData(panDoc) {
  if (!panDoc) return null;

  const parsedData = panDoc.parsedData?.data || {};
  const issuedTo = parsedData.issuedTo || {};
  const issuedBy = parsedData.issuedBy || {};
  const additionalData = parsedData.additionalData || {};

  return {
    // Basic Information
    name: issuedTo.name || panDoc.holderName || null,
    panNumber: parsedData.number || panDoc.documentNumber || null,
    dob: issuedTo.dob || null, // Format: YYYY-MM-DD or DD-MM-YYYY
    gender: issuedTo.gender || null, // MALE, FEMALE, OTHER

    // PAN Status
    status: parsedData.status || null, // A = Active, I = Inactive, D = Deactivated
    statusDescription: getPANStatusDescription(parsedData.status),

    // Issuer Information
    issuedBy: {
      name: issuedBy.name || 'Income Tax Department',
      type: issuedBy.type || 'CG', // CG = Central Government
      country: issuedBy.address?.country || 'IN',
    },

    // Verification
    signatureVerified: panDoc.signatureVerified || false,
    xmlSignatureVerified: panDoc.parsedData?.xmlSignatureVerified || false,
    verificationStatus: panDoc.verificationStatus || 'PENDING',
    verifiedAt: panDoc.verifiedAt || null,
    verifiedBy: panDoc.verifiedBy || 'DigiLocker',
    verifiedOn: additionalData.verifiedOn || null, // When PAN was verified by IT Dept

    // PDF Document
    documentUrl: panDoc.documentUrl || null, // PDF file path/URL
    pdfBase64: null, // Not stored in DB to save space

    // Metadata
    language: parsedData.language || '99',
    documentType: parsedData.type || 'PANCR',
    documentUri: panDoc.parsedData?.documentUri || null,
  };
}

/**
 * Extract data from raw DigiLocker API response (for immediate processing)
 *
 * Use this when you have the raw Perfios/DigiLocker response before saving to DB
 *
 * @param {Array} documents - Array of documents from Perfios downloadDocuments API
 * @returns {Object} Extracted data from both Aadhaar and PAN
 */
export function extractFromRawResponse(documents) {
  if (!documents || !Array.isArray(documents)) {
    return { aadhaar: null, pan: null };
  }

  const aadhaarDoc = documents.find(doc =>
    doc.documentUri?.includes('ADHAR') || doc.parsedFile?.data?.issuedTo?.uid
  );

  const panDoc = documents.find(doc =>
    doc.documentUri?.includes('PANCR') || doc.parsedFile?.data?.type === 'PANCR'
  );

  return {
    aadhaar: aadhaarDoc ? extractFromRawAadhaar(aadhaarDoc) : null,
    pan: panDoc ? extractFromRawPAN(panDoc) : null,
  };
}

/**
 * Extract data from raw Aadhaar document (before DB save)
 *
 * @param {Object} document - Raw document from Perfios API
 * @returns {Object} Extracted Aadhaar data
 * @private
 */
function extractFromRawAadhaar(document) {
  const parsedFile = document.parsedFile || {};
  const data = parsedFile.data || {};
  const issuedTo = data.issuedTo || {};
  const address = issuedTo.address || {};
  const rawFiles = document.rawFiles || {};

  return {
    name: issuedTo.name || null,
    uid: issuedTo.uid || null,
    dob: issuedTo.dob || null,
    gender: issuedTo.gender || null,
    address: {
      careOf: address.co || address.careOf || null,
      house: address.house || null,
      street: address.street || null,
      landmark: address.landmark || null,
      locality: address.locality || null,
      vtc: address.vtc || null,
      district: address.district || address.dist || null,
      state: address.state || null,
      pin: address.pin || address.pc || null,
      country: address.country || 'India',
    },
    fullAddress: formatAddress(address),
    photo: issuedTo.photo?.content || null,
    photoFormat: issuedTo.photo?.format || 'JPEG',
    signatureVerified: rawFiles.xml?.signatureVerified || parsedFile.xmlSignatureVerified || false,
    pdfBase64: rawFiles.pdfB64?.content || null,
    xmlContent: rawFiles.xml?.content || null,
  };
}

/**
 * Extract data from raw PAN document (before DB save)
 *
 * @param {Object} document - Raw document from Perfios API
 * @returns {Object} Extracted PAN data
 * @private
 */
function extractFromRawPAN(document) {
  const parsedFile = document.parsedFile || {};
  const data = parsedFile.data || {};
  const issuedTo = data.issuedTo || {};
  const rawFiles = document.rawFiles || {};

  return {
    name: issuedTo.name || null,
    panNumber: data.number || null,
    dob: issuedTo.dob || null,
    gender: issuedTo.gender || null,
    status: data.status || null,
    statusDescription: getPANStatusDescription(data.status),
    signatureVerified: rawFiles.xml?.signatureVerified || parsedFile.xmlSignatureVerified || false,
    pdfBase64: rawFiles.pdfB64?.content || null,
    verifiedOn: data.additionalData?.verifiedOn || null,
  };
}

function formatAddress(address) {
  if (!address) return '';

  const parts = [
    address.house,
    address.street,
    address.landmark,
    address.locality,
    address.vtc,
    address.district,
    address.state,
    address.pin,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Get human-readable PAN status description
 *
 * @param {string} status - PAN status code (A, I, D, etc.)
 * @returns {string} Status description
 * @private
 */
function getPANStatusDescription(status) {
  const statusMap = {
    'A': 'Active',
    'I': 'Inactive',
    'D': 'Deactivated',
    'E': 'Existing',
    'N': 'Not Available',
  };

  return statusMap[status] || 'Unknown';
}

/**
 * Normalize date format to YYYY-MM-DD
 *
 * Handles various date formats from DigiLocker:
 * - DD-MM-YYYY
 * - YYYY-MM-DD
 * - DD/MM/YYYY
 *
 * @param {string} dateStr - Date string
 * @returns {string|null} Normalized date in YYYY-MM-DD format
 */
export function normalizeDateFormat(dateStr) {
  if (!dateStr) return null;

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // DD-MM-YYYY or DD/MM/YYYY format
  const match = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
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
 * Extract combined data for agent registration/update
 *
 * Combines Aadhaar and PAN data with preference for more complete data
 *
 * @param {Object} aadhaarData - Extracted Aadhaar data
 * @param {Object} panData - Extracted PAN data
 * @returns {Object} Combined data for agent registration
 */
export function extractCombinedAgentData(aadhaarData, panData) {
  // Prefer PAN name if available (more official)
  const name = panData?.name || aadhaarData?.name || null;

  // Prefer PAN DOB if available, fallback to Aadhaar
  const dob = normalizeDateFormat(panData?.dob || aadhaarData?.dob);

  // Prefer PAN gender, fallback to Aadhaar
  const gender = panData?.gender || aadhaarData?.gender || null;

  return {
    // Personal Information
    name: name,
    firstName: name ? name.split(' ')[0] : null,
    lastName: name ? name.split(' ').slice(1).join(' ') : null,
    dob: dob,
    gender: gender,

    // Address (only from Aadhaar)
    address: aadhaarData?.address || null,
    fullAddress: aadhaarData?.fullAddress || null,

    // Document Numbers
    aadhaarNumber: aadhaarData?.uid || null,
    panNumber: panData?.panNumber || null,

    // Photo (only from Aadhaar)
    photo: aadhaarData?.photo || null,
    photoUrl: aadhaarData?.photoUrl || null,

    // Verification Status
    aadhaarVerified: aadhaarData?.signatureVerified || false,
    panVerified: panData?.signatureVerified || false,
    bothVerified: (aadhaarData?.signatureVerified && panData?.signatureVerified) || false,
  };
}
