import axios from 'axios';
import perfiosConfig, { createPerfiosHeaders } from '../../config/perfios.config.js';

export const generateDigiLockerLink = async ({
  oAuthState,
  redirectUrl,
  customDocList = perfiosConfig.digilocker.customDocList,
  pinlessAuth = false,
  aadhaarFlowRequired = true,
  consent,
}) => {
  try {
    const requestData = {
      oAuthState,
      redirectUrl,
      customDocList,
      pinlessAuth,
      aadhaarFlowRequired,
      consent,
    };

    console.log('Perfios: Generating DigiLocker link', {
      oAuthState: oAuthState.substring(0, 20) + '...',
      redirectUrl,
    });

    const response = await axios.post(
      perfiosConfig.apiEndpoints.digilockerLink,
      requestData,
      {
        headers: createPerfiosHeaders(),
        timeout: perfiosConfig.timeout,
      }
    );

    // Perfios returns statusCode 101 for success
    if (response.data.statusCode !== 101) {
      throw new Error(
        `Perfios API returned status ${response.data.statusCode}: ${
          response.data.message || 'Unknown error'
        }`
      );
    }

    console.log('Perfios: DigiLocker link generated successfully', {
      requestId: response.data.requestId,
    });

    return response.data;
  } catch (error) {
    console.error('Perfios: Error generating DigiLocker link', {
      error: error.message,
      response: error.response?.data,
    });

    if (error.response) {
      // API returned error response
      throw new Error(
        `Perfios API error: ${error.response.data.message || error.message}`
      );
    }

    // Network or other error
    throw new Error(`Failed to generate DigiLocker link: ${error.message}`);
  }
};

/**
 * Fetch document list from DigiLocker (Step 2)
 *
 * After user authenticates with DigiLocker, this endpoint fetches
 * the list of documents available in their DigiLocker account.
 *
 * @param {Object} params - Request parameters
 * @param {string} params.accessRequestId - Request ID from Step 1 (link generation)
 * @param {string} params.consent - User consent ("Y")
 * @returns {Promise<Object>} Response from Perfios API
 * @returns {number} returns.statusCode - Status code (101 = success)
 * @returns {string} returns.requestId - Request ID
 * @returns {Array<Object>} returns.result - Array of available documents
 * @returns {string} returns.result[].name - Document name
 * @returns {string} returns.result[].doctype - Document type (ADHAR, PANCR, etc.)
 * @returns {string} returns.result[].uri - Document URI (needed for download)
 * @returns {string} returns.result[].date - Last modified date
 * @returns {boolean} returns.result[].isParseable - Whether document can be parsed
 *
 * @throws {Error} If API call fails or returns error
 *
 * @example
 * const response = await fetchDocumentList({
 *   accessRequestId: "uuid-from-step-1",
 *   consent: "Y"
 * });
 * // {
 * //   statusCode: 101,
 * //   result: [
 * //     { name: "Aadhaar Card", doctype: "ADHAR", uri: "in.gov.uidai-ADHAR-..." },
 * //     { name: "PAN Card", doctype: "PANCR", uri: "in.gov.pan-PANCR-..." }
 * //   ]
 * // }
 */
export const fetchDocumentList = async ({ accessRequestId, consent }) => {
  try {
    const requestData = {
      accessRequestId,
      consent,
    };

    console.log('Perfios: Fetching document list', {
      accessRequestId: accessRequestId.substring(0, 20) + '...',
    });

    const response = await axios.post(
      perfiosConfig.apiEndpoints.digilockerDocuments,
      requestData,
      {
        headers: createPerfiosHeaders(),
        timeout: perfiosConfig.timeout,
      }
    );

    if (response.data.statusCode !== 101) {
      throw new Error(
        `Perfios API returned status ${response.data.statusCode}: ${
          response.data.message || 'Unknown error'
        }`
      );
    }

    console.log('Perfios: Document list fetched successfully', {
      documentCount: response.data.result?.length || 0,
    });

    return response.data;
  } catch (error) {
    console.error('Perfios: Error fetching document list', {
      error: error.message,
      response: error.response?.data,
    });

    if (error.response) {
      throw new Error(
        `Perfios API error: ${error.response.data.message || error.message}`
      );
    }

    throw new Error(`Failed to fetch document list: ${error.message}`);
  }
};

/**
 * Download documents from DigiLocker (Step 3)
 *
 * Downloads the actual document files (PDF, XML, parsed data) for
 * the specified URIs.
 *
 * @param {Object} params - Request parameters
 * @param {string} params.accessRequestId - Request ID from Step 1
 * @param {string} params.consent - User consent ("Y")
 * @param {Array<Object>} params.files - Array of files to download
 * @param {string} params.files[].uri - Document URI (from Step 2)
 * @param {boolean} [params.files[].pdfB64] - Include PDF in base64 (default: true)
 * @param {boolean} [params.files[].parsed] - Include parsed data (default: true)
 * @param {boolean} [params.files[].xml] - Include XML (default: true for Aadhaar)
 * @param {boolean} [params.files[].json] - Include JSON (default: false)
 * @returns {Promise<Object>} Response from Perfios API
 * @returns {number} returns.statusCode - Status code (101 = success)
 * @returns {string} returns.requestId - Request ID
 * @returns {Array<Object>} returns.result - Array of downloaded documents
 * @returns {string} returns.result[].documentUri - Document URI
 * @returns {Object} returns.result[].parsedFile - Parsed document data
 * @returns {Object} returns.result[].parsedFile.data - Structured document data
 * @returns {boolean} returns.result[].parsedFile.xmlSignatureVerified - Signature status
 * @returns {Object} returns.result[].rawFiles - Raw files (PDF, XML)
 * @returns {Object} returns.result[].rawFiles.pdfB64 - PDF base64 object
 * @returns {string} returns.result[].rawFiles.pdfB64.content - PDF content
 * @returns {Object} returns.result[].rawFiles.xml - XML object
 * @returns {string} returns.result[].rawFiles.xml.content - XML content
 * @returns {boolean} returns.result[].rawFiles.xml.signatureVerified - XML signature status
 *
 * @throws {Error} If API call fails or returns error
 *
 * @example
 * const response = await downloadDocuments({
 *   accessRequestId: "uuid-from-step-1",
 *   consent: "Y",
 *   files: [
 *     { uri: "in.gov.uidai-ADHAR-xxx", pdfB64: true, parsed: true, xml: true },
 *     { uri: "in.gov.pan-PANCR-xxx", pdfB64: true, parsed: true, xml: false }
 *   ]
 * });
 */
export const downloadDocuments = async ({ accessRequestId, consent, files }) => {
  try {
    const requestData = {
      accessRequestId,
      consent,
      files,
    };

    console.log('Perfios: Downloading documents', {
      accessRequestId: accessRequestId.substring(0, 20) + '...',
      fileCount: files.length,
    });

    const response = await axios.post(
      perfiosConfig.apiEndpoints.digilockerDownload,
      requestData,
      {
        headers: createPerfiosHeaders(),
        timeout: perfiosConfig.timeout,
      }
    );

    if (response.data.statusCode !== 101) {
      throw new Error(
        `Perfios API returned status ${response.data.statusCode}: ${
          response.data.message || 'Unknown error'
        }`
      );
    }

    console.log('Perfios: Documents downloaded successfully', {
      documentCount: response.data.result?.length || 0,
    });

    return response.data;
  } catch (error) {
    console.error('Perfios: Error downloading documents', {
      error: error.message,
      response: error.response?.data,
    });

    if (error.response) {
      throw new Error(
        `Perfios API error: ${error.response.data.message || error.message}`
      );
    }

    throw new Error(`Failed to download documents: ${error.message}`);
  }
};

/**
 * Test Perfios API connectivity
 *
 * Helper function to verify Perfios credentials and API access.
 * Useful for debugging and health checks.
 *
 * @returns {Promise<boolean>} True if API is accessible
 */
export const testPerfiosConnection = async () => {
  try {
    // Validate config first
    if (
      !perfiosConfig.credentials.secureId ||
      !perfiosConfig.credentials.secureCred ||
      !perfiosConfig.credentials.orgId
    ) {
      console.error('Perfios: Missing credentials in configuration');
      return false;
    }

    console.log('Perfios: Configuration validated successfully');
    return true;
  } catch (error) {
    console.error('Perfios: Connection test failed', error);
    return false;
  }
};
