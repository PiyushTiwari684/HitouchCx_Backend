/**
 * DigiLocker Service
 *
 * Main orchestration service for KYC verification via DigiLocker.
 * Coordinates the entire flow from link generation to verification completion.
 *
 * Flow:
 * 1. Generate DigiLocker link → Create session
 * 2. User authenticates → Callback received
 * 3. Download documents → Process and save
 * 4. Validate names → Update KYC status
 * 5. Log everything → Return result
 *
 * @module services/kyc/digilocker
 */

import prisma from '../../config/db.js';
import perfiosConfig from '../../config/perfios.config.js';
import * as perfiosService from './perfios.service.js';
import * as documentProcessor from './document-processor.service.js';
import {
  generateOAuthState,
  parseOAuthState,
  calculateExpiryTime,
  isSessionExpired,
  validateNames,
} from '../../utils/kyc-helpers.js';

/**
 * Create audit log entry
 *
 * Logs KYC action to database for compliance and debugging.
 *
 * @param {string} userId - User ID
 * @param {string} action - Action name
 * @param {string} status - "SUCCESS" or "FAILED"
 * @param {Object} [metadata] - Additional data
 * @param {string} [ipAddress] - User's IP
 * @param {string} [userAgent] - User's browser
 * @returns {Promise<void>}
 * @private
 */
const createAuditLog = async (userId, action, status, metadata = {}, ipAddress = null, userAgent = null) => {
  try {
    await prisma.kYCAuditLog.create({
      data: {
        userId,
        action,
        status,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit log fails
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Generate DigiLocker Link (Step 1)
 *
 * Creates a DigiLocker authentication link and stores session in database.
 * This is the entry point for KYC verification.
 *
 * @param {string} userId - User ID
 * @param {string} consent - User consent ("Y")
 * @param {string} [ipAddress] - User's IP address
 * @param {string} [userAgent] - User's browser/device info
 * @returns {Promise<Object>} Link generation result
 * @returns {string} returns.link - DigiLocker OAuth URL
 * @returns {string} returns.sessionId - KYCSession ID
 * @returns {string} returns.requestId - Perfios request ID
 * @returns {Date} returns.expiresAt - Session expiry time
 *
 * @throws {Error} If consent not provided or API call fails
 *
 * @example
 * const result = await generateLink("user123", "Y", "192.168.1.1", "Mozilla...");
 * // {
 * //   link: "https://digilocker.gov.in/oauth2/...",
 * //   sessionId: "session123",
 * //   requestId: "request456",
 * //   expiresAt: "2024-01-01T12:30:00Z"
 * // }
 */
export const generateLink = async (userId, consent, ipAddress = null, userAgent = null) => {
  try {
    // Validate consent
    if (consent !== 'Y') {
      throw new Error('User consent is required');
    }

    // Check for existing active session (created within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingSession = await prisma.kYCSession.findFirst({
      where: {
        userId,
        status: 'PENDING',
        createdAt: {
          gte: fiveMinutesAgo,
        },
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If recent session exists, return existing link
    if (existingSession) {
      console.log('Reusing existing session', {
        sessionId: existingSession.id,
      });

      // Reconstruct link (Perfios doesn't store it, but we can regenerate)
      // For now, we'll create a new one anyway to be safe
    }

    // Generate OAuth state parameter
    const oAuthState = generateOAuthState(userId);

    // Calculate expiry time
    const expiresAt = calculateExpiryTime(perfiosConfig.digilocker.sessionExpiryMinutes);

    // Call Perfios API to generate link
    const response = await perfiosService.generateDigiLockerLink({
      oAuthState,
      redirectUrl: perfiosConfig.digilocker.redirectUrl,
      consent,
    });

    // Create session in database
    const session = await prisma.kYCSession.create({
      data: {
        userId,
        accessRequestId: response.requestId,
        oAuthState,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Log to audit trail
    await createAuditLog(
      userId,
      'LINK_GENERATED',
      'SUCCESS',
      {
        sessionId: session.id,
        requestId: response.requestId,
      },
      ipAddress,
      userAgent
    );

    console.log('DigiLocker link generated', {
      userId: userId.substring(0, 10) + '...',
      sessionId: session.id,
      expiresAt,
    });

    return {
      link: response.result.link,
      sessionId: session.id,
      requestId: response.requestId,
      expiresAt,
    };
  } catch (error) {
    // Log failure
    await createAuditLog(
      userId,
      'LINK_GENERATED',
      'FAILED',
      { error: error.message },
      ipAddress,
      userAgent
    );

    console.error('Error generating DigiLocker link:', error);
    throw error;
  }
};

/**
 * Process DigiLocker Callback (Steps 2 & 3)
 *
 * Handles the callback from DigiLocker after user authentication.
 * Downloads documents, processes them, validates names, and updates KYC status.
 *
 * @param {string} oAuthState - State parameter from callback URL
 * @param {string} code - Authorization code from DigiLocker (unused by Perfios)
 * @param {string} [ipAddress] - User's IP address
 * @param {string} [userAgent] - User's browser/device info
 * @returns {Promise<Object>} Processing result
 * @returns {string} returns.userId - User ID
 * @returns {string} returns.kycStatus - Final KYC status (APPROVED, PARTIAL, REJECTED)
 * @returns {Object} returns.documents - Processed documents
 * @returns {Object} [returns.nameValidation] - Name validation result
 * @returns {string} returns.redirectUrl - Frontend URL to redirect to
 *
 * @throws {Error} If session invalid, expired, or processing fails
 *
 * @example
 * const result = await processCallback("user123_1704...", "auth_code", "192.168.1.1");
 * // {
 * //   userId: "user123",
 * //   kycStatus: "APPROVED",
 * //   documents: { aadhaar: {...}, pan: {...} },
 * //   redirectUrl: "http://localhost:5173/assessment-instructions"
 * // }
 */
export const processCallback = async (oAuthState, code, ipAddress = null, userAgent = null) => {
  let userId = null;
  let session = null;

  try {
    // Parse state to get userId
    const parsed = parseOAuthState(oAuthState);
    userId = parsed.userId;

    // Log callback received
    await createAuditLog(
      userId,
      'CALLBACK_RECEIVED',
      'SUCCESS',
      { oAuthState: oAuthState.substring(0, 20) + '...' },
      ipAddress,
      userAgent
    );

    // Find session by oAuthState
    session = await prisma.kYCSession.findUnique({
      where: { oAuthState },
      include: {
        user: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Invalid session: State parameter not found');
    }

    // Check if session expired
    if (isSessionExpired(session.expiresAt)) {
      await prisma.kYCSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });

      throw new Error('Session expired. Please try again.');
    }

    // Check if session already processed
    if (session.status === 'COMPLETED') {
      throw new Error('Session already processed');
    }

    // Update session to PROCESSING
    await prisma.kYCSession.update({
      where: { id: session.id },
      data: { status: 'PROCESSING' },
    });

    // Get agent
    const agent = session.user.agent;
    if (!agent) {
      throw new Error('Agent profile not found');
    }

    // Step 2: Fetch document list from DigiLocker
    console.log('Fetching documents from DigiLocker...');
    const documentListResponse = await perfiosService.fetchDocumentList({
      accessRequestId: session.accessRequestId,
      consent: 'Y',
    });

    const documents = documentListResponse.result;

    // Find Aadhaar and PAN documents
    const aadhaarDoc = documents.find((doc) => doc.doctype === 'ADHAR');
    const panDoc = documents.find((doc) => doc.doctype === 'PANCR');

    if (!aadhaarDoc && !panDoc) {
      throw new Error(
        'No Aadhaar or PAN documents found in your DigiLocker. Please upload documents first.'
      );
    }

    // Log documents found
    await createAuditLog(
      userId,
      'DOCUMENTS_FETCHED',
      'SUCCESS',
      {
        aadhaarFound: !!aadhaarDoc,
        panFound: !!panDoc,
        totalDocuments: documents.length,
      },
      ipAddress,
      userAgent
    );

    // Step 3: Download documents
    console.log('Downloading documents...');
    const filesToDownload = [];

    if (aadhaarDoc) {
      filesToDownload.push({
        uri: aadhaarDoc.uri,
        pdfB64: true,
        parsed: true,
        xml: true, // Need XML for photo extraction
      });
    }

    if (panDoc) {
      filesToDownload.push({
        uri: panDoc.uri,
        pdfB64: true,
        parsed: true,
        xml: false, // PAN doesn't have XML
      });
    }

    const downloadResponse = await perfiosService.downloadDocuments({
      accessRequestId: session.accessRequestId,
      consent: 'Y',
      files: filesToDownload,
    });

    // Log download success
    await createAuditLog(
      userId,
      'DOCUMENTS_DOWNLOADED',
      'SUCCESS',
      { documentCount: downloadResponse.result.length },
      ipAddress,
      userAgent
    );

    // Process and save documents
    console.log('Processing and saving documents...');
    const processedDocuments = await documentProcessor.processAndSaveDocuments(
      downloadResponse.result,
      userId,
      agent.id
    );

    // Extract names for validation
    const documentNames = documentProcessor.extractDocumentNames(processedDocuments);
    const registeredName = `${agent.firstName} ${agent.lastName || ''}`.trim();

    // Determine KYC status based on documents found and name validation
    let kycStatus = 'PENDING';
    let nameValidationResult = null;

    if (processedDocuments.aadhaar && processedDocuments.pan) {
      // Both documents found - validate names
      nameValidationResult = validateNames(
        registeredName,
        documentNames.aadhaarName,
        documentNames.panName
      );

      if (nameValidationResult.valid) {
        kycStatus = 'APPROVED';

        // Log name validation success
        await createAuditLog(
          userId,
          'NAME_VALIDATION_SUCCESS',
          'SUCCESS',
          { fuzzyMatch: nameValidationResult.fuzzyMatch || false },
          ipAddress,
          userAgent
        );
      } else {
        kycStatus = 'REJECTED';

        // Log name validation failure
        await createAuditLog(
          userId,
          'NAME_VALIDATION_FAILED',
          'FAILED',
          {
            mismatch: nameValidationResult.mismatch,
            similarities: nameValidationResult.similarities,
          },
          ipAddress,
          userAgent
        );
      }
    } else if (processedDocuments.aadhaar && !processedDocuments.pan) {
      // Only Aadhaar found
      kycStatus = 'PARTIAL';

      await createAuditLog(
        userId,
        'PARTIAL_KYC',
        'SUCCESS',
        { reason: 'PAN document not found in DigiLocker' },
        ipAddress,
        userAgent
      );
    }

    // Update document verification status
    const documentIds = processedDocuments.savedDocuments.map((doc) => doc.id);
    await documentProcessor.updateDocumentVerificationStatus(documentIds, kycStatus);

    // Update Agent KYC status
    await prisma.agent.update({
      where: { id: agent.id },
      data: { kycStatus },
    });

    // Update User kycCompleted flag (only if APPROVED)
    if (kycStatus === 'APPROVED') {
      await prisma.user.update({
        where: { id: userId },
        data: { kycCompleted: true },
      });
    }

    // Update session to COMPLETED
    await prisma.kYCSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Log final KYC status
    await createAuditLog(
      userId,
      `KYC_${kycStatus}`,
      'SUCCESS',
      {
        aadhaarVerified: !!processedDocuments.aadhaar,
        panVerified: !!processedDocuments.pan,
      },
      ipAddress,
      userAgent
    );

    console.log('KYC processing completed', {
      userId: userId.substring(0, 10) + '...',
      kycStatus,
    });

    // Determine redirect URL
    let redirectUrl = perfiosConfig.frontend.successUrl;
    if (kycStatus === 'REJECTED') {
      redirectUrl = `${perfiosConfig.frontend.errorUrl}?error=name_mismatch`;
    } else if (kycStatus === 'PARTIAL') {
      redirectUrl = `${perfiosConfig.frontend.errorUrl}?error=pan_not_found&partial=true`;
    }

    return {
      userId,
      kycStatus,
      documents: processedDocuments,
      nameValidation: nameValidationResult,
      redirectUrl,
    };
  } catch (error) {
    console.error('Error processing callback:', error);

    // Update session to FAILED
    if (session) {
      await prisma.kYCSession.update({
        where: { id: session.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }

    // Log failure
    if (userId) {
      await createAuditLog(
        userId,
        'CALLBACK_PROCESSING',
        'FAILED',
        { error: error.message },
        ipAddress,
        userAgent
      );
    }

    throw error;
  }
};

/**
 * Get KYC status for user
 *
 * Retrieves current KYC status and latest session information.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} KYC status information
 * @returns {string} returns.kycStatus - Agent's KYC status
 * @returns {boolean} returns.kycCompleted - Whether KYC is completed
 * @returns {Object} [returns.latestSession] - Latest KYC session
 * @returns {Array<Object>} returns.documents - KYC documents
 *
 * @example
 * const status = await getKYCStatus("user123");
 * // {
 * //   kycStatus: "APPROVED",
 * //   kycCompleted: true,
 * //   latestSession: { status: "COMPLETED", ... },
 * //   documents: [...]
 * // }
 */
export const getKYCStatus = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: {
          include: {
            kycDocuments: true,
          },
        },
        kycSessions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user || !user.agent) {
      throw new Error('User or agent not found');
    }

    return {
      kycStatus: user.agent.kycStatus,
      kycCompleted: user.kycCompleted,
      latestSession: user.kycSessions[0] || null,
      documents: user.agent.kycDocuments,
    };
  } catch (error) {
    console.error('Error getting KYC status:', error);
    throw error;
  }
};
