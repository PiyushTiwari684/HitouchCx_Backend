/**
 * Document Processor Service
 *
 * Processes downloaded documents from DigiLocker:
 * - Saves files to filesystem
 * - Extracts structured data
 * - Creates database records
 * - Validates documents
 *
 * @module services/kyc/document-processor
 */

import prisma from '../../config/db.js';
import { extractPhotoFromXml } from '../../utils/kyc-helpers.js';
import { saveDocumentSet } from '../../utils/file-storage.js';

/**
 * Process a single document from Perfios response
 *
 * Takes raw document data from Perfios API and:
 * 1. Determines document type (Aadhaar or PAN)
 * 2. Saves files to filesystem
 * 3. Extracts structured data
 * 4. Returns processed document object
 *
 * @param {Object} document - Raw document from Perfios API
 * @param {string} document.documentUri - Document URI
 * @param {Object} document.parsedFile - Parsed document data
 * @param {Object} document.rawFiles - Raw file data (PDF, XML)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Processed document object
 * @returns {string} returns.documentType - "AADHAR" or "PAN"
 * @returns {string} returns.documentUri - Original URI
 * @returns {Object} returns.extractedData - Structured data from document
 * @returns {Object} returns.savedFiles - File paths
 * @returns {Object} returns.parsedData - Full parsed data (for database JSON field)
 * @returns {boolean} returns.signatureVerified - XML signature status
 *
 * @private
 */
const processDocument = async (document, userId) => {
  try {
    const { documentUri, parsedFile, rawFiles } = document;

    // Determine document type from URI
    const documentType = documentUri.includes('ADHAR')
      ? 'AADHAR'
      : documentUri.includes('PANCR')
      ? 'PAN'
      : 'UNKNOWN';

    if (documentType === 'UNKNOWN') {
      throw new Error(`Unknown document type for URI: ${documentUri}`);
    }

    // Extract photo from Aadhaar XML (if available)
    let photoBase64 = null;
    if (documentType === 'AADHAR' && rawFiles.xml && rawFiles.xml.content) {
      photoBase64 = extractPhotoFromXml(rawFiles.xml.content);
    }

    // Save files to filesystem
    const savedFiles = await saveDocumentSet(
      rawFiles,
      userId,
      documentType.toLowerCase(),
      photoBase64
    );

    // Extract structured data based on document type
    let extractedData = {};

    if (documentType === 'AADHAR' && parsedFile?.data) {
      extractedData = {
        name: parsedFile.data.issuedTo?.name || null,
        dob: parsedFile.data.issuedTo?.dob || null,
        gender: parsedFile.data.issuedTo?.gender || null,
        address: parsedFile.data.issuedTo?.address || null,
        uid: parsedFile.data.issuedTo?.uid || null, // Masked Aadhaar
      };
    } else if (documentType === 'PAN' && parsedFile?.data) {
      extractedData = {
        name: parsedFile.data.issuedTo?.name || null,
        panNumber: parsedFile.data.number || null,
        dob: parsedFile.data.issuedTo?.dob || null,
        gender: parsedFile.data.issuedTo?.gender || null,
        status: parsedFile.data.status || null, // A = Active, I = Inactive
        verifiedOn: parsedFile.data.additionalData?.verifiedOn || null,
      };
    }

    return {
      documentType,
      documentUri,
      extractedData,
      savedFiles,
      parsedData: parsedFile, // Full parsed data for database
      signatureVerified: rawFiles.xml?.signatureVerified || parsedFile?.xmlSignatureVerified || false,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

/**
 * Save processed document to database
 *
 * Creates a KYCDocument record with all document information.
 *
 * @param {Object} processedDoc - Processed document object
 * @param {string} agentId - Agent ID (from Agent table)
 * @returns {Promise<Object>} Created KYCDocument record
 *
 * @private
 */
const saveDocumentToDatabase = async (processedDoc, agentId) => {
  try {
    const { documentType, extractedData, savedFiles, parsedData, signatureVerified } =
      processedDoc;

    // Determine document number and holder name
    const documentNumber =
      documentType === 'AADHAR'
        ? extractedData.uid
        : extractedData.panNumber;

    const holderName = extractedData.name;

    // Create KYCDocument record
    const kycDocument = await prisma.kYCDocument.create({
      data: {
        agentId,
        documentType,
        documentNumber: documentNumber || 'UNKNOWN',
        holderName: holderName || null,

        // File paths
        documentUrl: savedFiles.pdfPath || null,
        photoUrl: savedFiles.photoPath || null,

        // DigiLocker data
        parsedData: parsedData || {},
        signatureVerified,

        // Verification status (will be updated after name validation)
        verificationStatus: 'PENDING',
        verifiedBy: 'DigiLocker',
      },
    });

    console.log(`Document saved to database: ${documentType}`, {
      id: kycDocument.id,
      documentNumber: documentNumber?.substring(0, 10) + '...',
    });

    return kycDocument;
  } catch (error) {
    console.error('Error saving document to database:', error);
    throw error;
  }
};

/**
 * Process and save all documents
 *
 * Main function to process downloaded documents from Perfios.
 * Handles both Aadhaar and PAN documents.
 *
 * @param {Array<Object>} documents - Array of documents from Perfios API
 * @param {string} userId - User ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Processing result
 * @returns {Object} returns.aadhaar - Processed Aadhaar document (if found)
 * @returns {Object} returns.pan - Processed PAN document (if found)
 * @returns {Array<Object>} returns.savedDocuments - Database records
 *
 * @example
 * const result = await processAndSaveDocuments(
 *   perfiosResponse.result,
 *   "user123",
 *   "agent456"
 * );
 * // {
 * //   aadhaar: { extractedData: {...}, savedFiles: {...} },
 * //   pan: { extractedData: {...}, savedFiles: {...} },
 * //   savedDocuments: [KYCDocument, KYCDocument]
 * // }
 */
export const processAndSaveDocuments = async (documents, userId, agentId) => {
  try {
    console.log('Processing documents...', {
      count: documents.length,
      userId: userId.substring(0, 10) + '...',
    });

    const processedDocuments = {
      aadhaar: null,
      pan: null,
      savedDocuments: [],
    };

    // Process each document
    for (const doc of documents) {
      const processed = await processDocument(doc, userId);

      // Save to database
      const savedDoc = await saveDocumentToDatabase(processed, agentId);
      processedDocuments.savedDocuments.push(savedDoc);

      // Store in appropriate field
      if (processed.documentType === 'AADHAR') {
        processedDocuments.aadhaar = processed;
      } else if (processed.documentType === 'PAN') {
        processedDocuments.pan = processed;
      }
    }

    console.log('Documents processed successfully', {
      aadhaar: !!processedDocuments.aadhaar,
      pan: !!processedDocuments.pan,
      totalSaved: processedDocuments.savedDocuments.length,
    });

    return processedDocuments;
  } catch (error) {
    console.error('Error processing and saving documents:', error);
    throw error;
  }
};

/**
 * Extract document names for validation
 *
 * Extracts names from processed documents for name matching validation.
 *
 * @param {Object} processedDocuments - Result from processAndSaveDocuments
 * @returns {Object} Names object
 * @returns {string} [returns.aadhaarName] - Name from Aadhaar
 * @returns {string} [returns.panName] - Name from PAN
 *
 * @example
 * const names = extractDocumentNames(processedDocs);
 * // { aadhaarName: "Rajesh Kumar", panName: "RAJESH KUMAR" }
 */
export const extractDocumentNames = (processedDocuments) => {
  return {
    aadhaarName: processedDocuments.aadhaar?.extractedData?.name || null,
    panName: processedDocuments.pan?.extractedData?.name || null,
  };
};

/**
 * Update KYC document verification status
 *
 * Updates the verification status of KYC documents after validation.
 *
 * @param {Array<string>} documentIds - Array of KYCDocument IDs
 * @param {string} status - New status (APPROVED, REJECTED, etc.)
 * @returns {Promise<void>}
 */
export const updateDocumentVerificationStatus = async (documentIds, status) => {
  try {
    await prisma.kYCDocument.updateMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      data: {
        verificationStatus: status,
        verifiedAt: new Date(),
      },
    });

    console.log(`Updated ${documentIds.length} documents to status: ${status}`);
  } catch (error) {
    console.error('Error updating document verification status:', error);
    throw error;
  }
};
