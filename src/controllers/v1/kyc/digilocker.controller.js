import * as digilockerService from '../../../services/kyc/digilocker.service.js';
import perfiosConfig from '../../../config/perfios.config.js';

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
