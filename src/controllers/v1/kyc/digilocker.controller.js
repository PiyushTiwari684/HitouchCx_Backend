/**
 * DigiLocker Controller
 *
 * HTTP request handlers for DigiLocker KYC endpoints.
 * These controllers handle requests, call services, and format responses.
 *
 * @module controllers/v1/kyc/digilocker
 */

import * as digilockerService from '../../../services/kyc/digilocker.service.js';
import perfiosConfig from '../../../config/perfios.config.js';

/**
 * Generate DigiLocker Link
 *
 * POST /api/v1/kyc/digilocker/generate-link
 *
 * Generates a DigiLocker OAuth authentication link for the user.
 * User must be authenticated (JWT required).
 *
 * @route POST /api/v1/kyc/digilocker/generate-link
 * @access Protected (requires JWT)
 * @body {string} consent - User consent ("Y")
 *
 * @example
 * Request:
 * POST /api/v1/kyc/digilocker/generate-link
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { consent: "Y" }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     link: "https://digilocker.gov.in/oauth2/...",
 *     sessionId: "clx123",
 *     requestId: "uuid",
 *     expiresAt: "2024-01-01T12:30:00Z"
 *   },
 *   message: "DigiLocker link generated successfully"
 * }
 */
export const generateDigiLockerLink = async (req, res) => {
  try {
    // Get user ID from JWT (set by authMiddleware)
    const userId = req.user.id;

    // Get consent from request body
    const { consent } = req.body;

    // Validate consent
    if (!consent || consent !== 'Y') {
      return res.status(400).json({
        success: false,
        message: 'User consent is required. Please set consent to "Y"',
      });
    }

    // Get IP address and user agent for audit logging
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Call service to generate link
    const result = await digilockerService.generateLink(
      userId,
      consent,
      ipAddress,
      userAgent
    );

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        link: result.link,
        sessionId: result.sessionId,
        requestId: result.requestId,
        expiresAt: result.expiresAt,
      },
      message: 'DigiLocker link generated successfully. Please visit the link to authenticate.',
    });
  } catch (error) {
    console.error('Error in generateDigiLockerLink controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate DigiLocker link',
      error: error.message,
    });
  }
};

/**
 * DigiLocker Callback Handler
 *
 * GET /api/v1/kyc/digilocker/callback
 *
 * Handles the OAuth callback from DigiLocker after user authentication.
 * This is called by DigiLocker, not directly by the frontend.
 * Processes the callback, downloads documents, and redirects to frontend.
 *
 * @route GET /api/v1/kyc/digilocker/callback
 * @access Public (called by DigiLocker)
 * @query {string} code - Authorization code from DigiLocker
 * @query {string} state - OAuth state parameter (contains userId)
 * @query {string} [error] - Error code if user denied permission
 *
 * @example
 * DigiLocker redirects to:
 * GET /api/v1/kyc/digilocker/callback?code=ABC123&state=user123_1704...
 *
 * Or if user denied:
 * GET /api/v1/kyc/digilocker/callback?error=access_denied&state=user123_1704...
 */
export const digilockerCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check if user denied permission
    if (error) {
      console.log('DigiLocker authorization denied', { error, state });

      // Redirect to frontend error page
      return res.redirect(
        `${perfiosConfig.frontend.errorUrl}?error=user_cancelled&message=You denied permission to access your documents`
      );
    }

    // Validate state parameter
    if (!state) {
      console.error('Missing state parameter in callback');

      return res.redirect(
        `${perfiosConfig.frontend.errorUrl}?error=invalid_request&message=Missing state parameter`
      );
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    console.log('Processing DigiLocker callback', {
      state: state.substring(0, 20) + '...',
      hasCode: !!code,
    });

    // Process callback (this does all the heavy lifting)
    const result = await digilockerService.processCallback(
      state,
      code,
      ipAddress,
      userAgent
    );

    console.log('Callback processed successfully', {
      userId: result.userId.substring(0, 10) + '...',
      kycStatus: result.kycStatus,
    });

    // Redirect to appropriate frontend URL
    return res.redirect(result.redirectUrl);
  } catch (error) {
    console.error('Error in digilockerCallback controller:', error);

    // Redirect to frontend error page with error details
    const errorMessage = encodeURIComponent(error.message);
    return res.redirect(
      `${perfiosConfig.frontend.errorUrl}?error=processing_failed&message=${errorMessage}`
    );
  }
};

/**
 * Get KYC Status
 *
 * GET /api/v1/kyc/status
 *
 * Returns the current KYC verification status for the authenticated user.
 * Used by frontend to poll for completion after callback.
 *
 * @route GET /api/v1/kyc/status
 * @access Protected (requires JWT)
 *
 * @example
 * Request:
 * GET /api/v1/kyc/status
 * Headers: { Authorization: "Bearer <token>" }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     kycStatus: "APPROVED",
 *     kycCompleted: true,
 *     latestSession: {
 *       status: "COMPLETED",
 *       createdAt: "2024-01-01T10:00:00Z",
 *       completedAt: "2024-01-01T10:05:00Z"
 *     },
 *     documents: [
 *       { documentType: "AADHAR", verificationStatus: "APPROVED", ... },
 *       { documentType: "PAN", verificationStatus: "APPROVED", ... }
 *     ]
 *   }
 * }
 */
export const getKYCStatus = async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.id;

    // Get KYC status from service
    const status = await digilockerService.getKYCStatus(userId);

    return res.status(200).json({
      success: true,
      data: {
        kycStatus: status.kycStatus,
        kycCompleted: status.kycCompleted,
        latestSession: status.latestSession
          ? {
              status: status.latestSession.status,
              createdAt: status.latestSession.createdAt,
              completedAt: status.latestSession.completedAt,
              expiresAt: status.latestSession.expiresAt,
              errorMessage: status.latestSession.errorMessage,
            }
          : null,
        documents: status.documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          holderName: doc.holderName,
          verificationStatus: doc.verificationStatus,
          verifiedAt: doc.verifiedAt,
          signatureVerified: doc.signatureVerified,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getKYCStatus controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message,
    });
  }
};

/**
 * Get KYC Documents
 *
 * GET /api/v1/kyc/documents
 *
 * Returns detailed document data for the authenticated user.
 * Includes extracted information from Aadhaar and PAN.
 *
 * @route GET /api/v1/kyc/documents
 * @access Protected (requires JWT)
 *
 * @example
 * Request:
 * GET /api/v1/kyc/documents
 * Headers: { Authorization: "Bearer <token>" }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     aadhaar: {
 *       name: "Rajesh Kumar",
 *       number: "XXXX-XXXX-1234",
 *       dob: "1990-01-01",
 *       gender: "M",
 *       address: { ... },
 *       photoUrl: "/uploads/kyc/aadhaar/...",
 *       verifiedAt: "2024-01-01T10:00:00Z"
 *     },
 *     pan: {
 *       name: "RAJESH KUMAR",
 *       number: "ABCDE1234F",
 *       dob: "01/01/1990",
 *       status: "A",
 *       verifiedAt: "2024-01-01T10:00:00Z"
 *     }
 *   }
 * }
 */
export const getDocuments = async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.id;

    // Get KYC status (includes documents)
    const status = await digilockerService.getKYCStatus(userId);

    // Extract document data
    const aadhaarDoc = status.documents.find((doc) => doc.documentType === 'AADHAR');
    const panDoc = status.documents.find((doc) => doc.documentType === 'PAN');

    // Format response
    const response = {
      success: true,
      data: {},
    };

    // Add Aadhaar data if available
    if (aadhaarDoc && aadhaarDoc.parsedData) {
      const aadhaarData = aadhaarDoc.parsedData.data?.issuedTo || {};
      response.data.aadhaar = {
        name: aadhaarData.name || aadhaarDoc.holderName,
        number: aadhaarDoc.documentNumber,
        dob: aadhaarData.dob,
        gender: aadhaarData.gender,
        address: aadhaarData.address,
        photoUrl: aadhaarDoc.photoUrl,
        verifiedAt: aadhaarDoc.verifiedAt,
        signatureVerified: aadhaarDoc.signatureVerified,
      };
    }

    // Add PAN data if available
    if (panDoc && panDoc.parsedData) {
      const panData = panDoc.parsedData.data || {};
      response.data.pan = {
        name: panData.issuedTo?.name || panDoc.holderName,
        number: panDoc.documentNumber,
        dob: panData.issuedTo?.dob,
        gender: panData.issuedTo?.gender,
        status: panData.status,
        verifiedAt: panDoc.verifiedAt,
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getDocuments controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get KYC documents',
      error: error.message,
    });
  }
};

/**
 * Retry KYC Verification
 *
 * POST /api/v1/kyc/retry
 *
 * Generates a new DigiLocker link for users who want to retry verification.
 * Uses smart retry logic (reuses session if created within last 5 minutes).
 *
 * @route POST /api/v1/kyc/retry
 * @access Protected (requires JWT)
 * @body {string} consent - User consent ("Y")
 *
 * @example
 * Request:
 * POST /api/v1/kyc/retry
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { consent: "Y" }
 *
 * Response: Same as generateDigiLockerLink
 */
export const retryKYCVerification = async (req, res) => {
  try {
    // This is essentially the same as generating a new link
    // The service layer handles smart retry logic
    return await generateDigiLockerLink(req, res);
  } catch (error) {
    console.error('Error in retryKYCVerification controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retry KYC verification',
      error: error.message,
    });
  }
};
