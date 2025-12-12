import * as digilockerService from "../../../services/kyc/digilocker.service.js";
import perfiosConfig from "../../../config/perfios.config.js";
import {
  extractAadhaarData,
  extractPANData,
  extractCombinedAgentData,
} from "../../../utils/kyc-data-extractor.js";

export const generateDigiLockerLink = async (req, res) => {
  try {
    // Get user ID from JWT (set by authMiddleware)
    const userId = req.user.id;

    // Get consent from request body
    const { consent } = req.body;

    // Validate consent
    if (!consent || consent !== "Y") {
      return res.status(400).json({
        success: false,
        message: 'User consent is required. Please set consent to "Y"',
      });
    }

    // Get IP address and user agent for audit logging
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");

    // Call service to generate link
    const result = await digilockerService.generateLink(userId, consent, ipAddress, userAgent);

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        link: result.link,
        sessionId: result.sessionId,
        requestId: result.requestId,
        expiresAt: result.expiresAt,
      },
      message: "DigiLocker link generated successfully. Please visit the link to authenticate.",
    });
  } catch (error) {
    console.error("Error in generateDigiLockerLink controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate DigiLocker link",
      error: error.message,
    });
  }
};

export const digilockerCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check if user denied permission
    if (error) {
      console.log("DigiLocker authorization denied", { error, state });

      // Redirect to KYC status page (extract protocol and host only)
      const urlObj = new URL(perfiosConfig.frontend.successUrl);
      const frontendBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
      return res.redirect(
        `${frontendBaseUrl}/kyc-status?error=user_cancelled&message=You denied permission to access your documents`,
      );
    }

    // Validate state parameter
    if (!state) {
      console.error("Missing state parameter in callback");

      const urlObj = new URL(perfiosConfig.frontend.successUrl);
      const frontendBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
      return res.redirect(
        `${frontendBaseUrl}/kyc-status?error=invalid_request&message=Missing state parameter`,
      );
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");

    console.log("Processing DigiLocker callback", {
      state: state.substring(0, 20) + "...",
      hasCode: !!code,
    });

    // Process callback (this does all the heavy lifting)
    const result = await digilockerService.processCallback(state, code, ipAddress, userAgent);

    console.log("Callback processed successfully", {
      userId: result.userId.substring(0, 10) + "...",
      kycStatus: result.kycStatus,
    });

    // Redirect to appropriate frontend URL
    return res.redirect(result.redirectUrl);
  } catch (error) {
    console.error("Error in digilockerCallback controller:", error);

    // Redirect to KYC status page (will show error based on session status)
    // Extract protocol and host only from success URL
    const urlObj = new URL(perfiosConfig.frontend.successUrl);
    const frontendBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const errorMessage = encodeURIComponent(error.message);
    return res.redirect(
      `${frontendBaseUrl}/kyc-status?error=processing_failed&message=${errorMessage}`,
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
    console.error("Error in getKYCStatus controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get KYC status",
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
    const aadhaarDoc = status.documents.find((doc) => doc.documentType === "AADHAR");
    const panDoc = status.documents.find((doc) => doc.documentType === "PAN");

    // Extract complete data using utility functions
    const aadhaarData = extractAadhaarData(aadhaarDoc);
    const panData = extractPANData(panDoc);
    const combinedData = extractCombinedAgentData(aadhaarData, panData);

    // Format response with all required fields
    const response = {
      success: true,
      data: {
        // Combined data for convenience
        combined: combinedData,

        // Complete Aadhaar data
        aadhaar: aadhaarData
          ? {
              // Basic Information
              name: aadhaarData.name,
              uid: aadhaarData.uid,
              dob: aadhaarData.dob,
              gender: aadhaarData.gender,

              // Address (complete object)
              address: aadhaarData.address,
              fullAddress: aadhaarData.fullAddress,

              // Photo
              photo: aadhaarData.photo, // Base64 string
              photoFormat: aadhaarData.photoFormat,
              photoUrl: aadhaarData.photoUrl, // File path/URL

              // Verification
              signatureVerified: aadhaarData.signatureVerified,
              xmlSignatureVerified: aadhaarData.xmlSignatureVerified,
              verificationStatus: aadhaarData.verificationStatus,
              verifiedAt: aadhaarData.verifiedAt,
              verifiedBy: aadhaarData.verifiedBy,

              // Document URL (PDF)
              documentUrl: aadhaarData.documentUrl,
            }
          : null,

        // Complete PAN data
        pan: panData
          ? {
              // Basic Information
              name: panData.name,
              panNumber: panData.panNumber,
              dob: panData.dob,
              gender: panData.gender,

              // PAN Status
              status: panData.status,
              statusDescription: panData.statusDescription,

              // Verification
              signatureVerified: panData.signatureVerified,
              xmlSignatureVerified: panData.xmlSignatureVerified,
              verificationStatus: panData.verificationStatus,
              verifiedAt: panData.verifiedAt,
              verifiedBy: panData.verifiedBy,
              verifiedOn: panData.verifiedOn,

              // Document URL (PDF)
              documentUrl: panData.documentUrl,

              // Issuer
              issuedBy: panData.issuedBy,
            }
          : null,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getDocuments controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get KYC documents",
      error: error.message,
    });
  }
};

export const retryKYCVerification = async (req, res) => {
  try {
    // This is essentially the same as generating a new link
    // The service layer handles smart retry logic
    return await generateDigiLockerLink(req, res);
  } catch (error) {
    console.error("Error in retryKYCVerification controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retry KYC verification",
      error: error.message,
    });
  }
};

/**
 * Get detailed KYC validation status
 * Returns validation results with specific error messages for frontend modal
 */
export const getKYCValidationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get KYC status with latest session
    const status = await digilockerService.getKYCStatus(userId);

    if (!status.latestSession) {
      return res.status(404).json({
        success: false,
        message: "No KYC session found",
      });
    }

    const session = status.latestSession;
    const validationResult = session.validationResult || {};

    // Debug logging
    console.log(
      "[getKYCValidationStatus] Session validationResult:",
      JSON.stringify(validationResult, null, 2),
    );

    // Format response for frontend modal
    const response = {
      success: true,
      data: {
        kycStatus: status.kycStatus,
        sessionStatus: session.status,
        valid: validationResult.valid || false,

        // Individual validation results
        validations: {
          name: {
            valid: validationResult.validations?.name?.valid || false,
            similarity: validationResult.validations?.name?.similarity,
            mismatch: validationResult.validations?.name?.mismatch || [],
          },
          dob: {
            valid: validationResult.validations?.dob?.valid || false,
            normalized: validationResult.validations?.dob?.normalized,
            mismatch: validationResult.validations?.dob?.mismatch || [],
          },
          address: {
            valid: validationResult.validations?.address?.valid || false,
            details: validationResult.validations?.address?.details,
            mismatch: validationResult.validations?.address?.mismatch || [],
          },
          signature: {
            valid: validationResult.validations?.signature?.valid || false,
            aadhaarVerified: validationResult.validations?.signature?.aadhaarVerified || false,
            panVerified: validationResult.validations?.signature?.panVerified || false,
            mismatch: validationResult.validations?.signature?.mismatch || [],
          },
        },

        // All error messages for display
        errors: validationResult.errors || [],

        // Document verification status
        documents: {
          aadhaar: {
            found: status.documents.some((doc) => doc.documentType === "AADHAR"),
            verified:
              status.documents.find((doc) => doc.documentType === "AADHAR")?.signatureVerified ||
              false,
          },
          pan: {
            found: status.documents.some((doc) => doc.documentType === "PAN"),
            verified:
              status.documents.find((doc) => doc.documentType === "PAN")?.signatureVerified ||
              false,
          },
        },

        // Session metadata
        sessionId: session.id,
        completedAt: session.completedAt,
        expiresAt: session.expiresAt,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getKYCValidationStatus controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get KYC validation status",
      error: error.message,
    });
  }
};
