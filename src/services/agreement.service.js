/**
 * Agreement Service
 *
 * This service handles the complete business logic for agreement management:
 * - Fetching personalized agreement previews
 * - Processing agreement acceptance
 * - Generating and uploading PDFs
 * - Managing email delivery and retries
 */

import prisma from "../config/db.js";
import cloudinary from "../config/cloudinary.config.js";
import { NDA_TEMPLATE, MSA_TEMPLATE } from "../config/agreementTemplates.js";
import {
  replaceAgreementPlaceholders,
  prepareUserData,
  validatePlaceholderReplacement,
} from "../utils/agreementHelpers.js";
import { generateAgreementPDF } from "./pdf.service.js";
import { sendAgreementEmail } from "./email.service.js";
import { sendAgreementEmailFailureAlert } from "./notification.service.js";
import { Readable } from "stream";

/**
 * Get personalized agreement preview for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Personalized agreements
 */
export async function getAgreementPreview(userId) {
  try {
    // Fetch user and agent data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.agent) {
      throw new Error("Agent profile not found");
    }

    // Prepare user data for placeholder replacement
    const userData = prepareUserData(user.agent, user);

    // Replace placeholders in templates
    const personalizedNDA = replaceAgreementPlaceholders(NDA_TEMPLATE, userData);
    const personalizedMSA = replaceAgreementPlaceholders(MSA_TEMPLATE, userData);

    // Validate that all placeholders were replaced
    const ndaValidation = validatePlaceholderReplacement(personalizedNDA);
    const msaValidation = validatePlaceholderReplacement(personalizedMSA);

    if (!ndaValidation.isValid || !msaValidation.isValid) {
      console.warn("⚠️ Some placeholders were not replaced:", {
        nda: ndaValidation.remainingPlaceholders,
        msa: msaValidation.remainingPlaceholders,
      });
    }

    return {
      success: true,
      data: {
        nda: {
          content: personalizedNDA,
          version: "1.0",
        },
        msa: {
          content: personalizedMSA,
          version: "1.0",
        },
        userData: {
          name: userData.fullName,
          email: userData.email,
          phone: userData.phone,
        },
      },
    };
  } catch (error) {
    console.error("Error getting agreement preview:", error);
    throw error;
  }
}

/**
 * Check if user has already signed agreements
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if already signed
 */
export async function hasUserSignedAgreements(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agreementSigned: true },
  });

  return user?.agreementSigned || false;
}

/**
 * Upload PDF buffer to Cloudinary
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - File name
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Object>} - Upload result with URL and public ID
 */
async function uploadPDFToCloudinary(pdfBuffer, fileName, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folder,
        public_id: fileName,
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      },
    );

    // Convert buffer to stream and pipe to Cloudinary
    // Use Readable.from() with an array containing the buffer to avoid byte-by-byte iteration
    const readableStream = Readable.from([pdfBuffer]);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Process agreement acceptance (main function)
 * @param {Object} params - Acceptance parameters
 * @param {string} params.userId - User ID
 * @param {string} params.ipAddress - User's IP address
 * @param {string} params.userAgent - Browser user agent
 * @param {string} [params.sessionId] - Session ID (optional)
 * @returns {Promise<Object>} - Processing result
 */
export async function processAgreementAcceptance({ userId, ipAddress, userAgent, sessionId }) {
  let ndaAgreement = null;
  let msaAgreement = null;

  try {
    console.log(`📝 Processing agreement acceptance for user: ${userId}`);

    // Step 1: Check if already signed
    const alreadySigned = await hasUserSignedAgreements(userId);
    if (alreadySigned) {
      throw new Error("Agreements already signed");
    }

    // Step 2: Fetch user and agent data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user || !user.agent) {
      throw new Error("User or agent profile not found");
    }

    const agentId = user.agent.id;

    // Step 3: Prepare personalized agreement text
    const userData = prepareUserData(user.agent, user);
    const personalizedNDA = replaceAgreementPlaceholders(NDA_TEMPLATE, userData);
    const personalizedMSA = replaceAgreementPlaceholders(MSA_TEMPLATE, userData);

    // Step 4: Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create NDA Agreement record
      ndaAgreement = await tx.agreement.create({
        data: {
          agentId,
          documentType: "NDA",
          documentVersion: "1.0",
          agreementText: personalizedNDA,
          ipAddress,
          userAgent,
          sessionId,
          signedAt: new Date(),
          emailStatus: "PENDING",
        },
      });

      console.log(`✅ NDA agreement record created: ${ndaAgreement.id}`);

      // Create MSA Agreement record
      msaAgreement = await tx.agreement.create({
        data: {
          agentId,
          documentType: "MSA",
          documentVersion: "1.0",
          agreementText: personalizedMSA,
          ipAddress,
          userAgent,
          sessionId,
          signedAt: new Date(),
          emailStatus: "PENDING",
        },
      });

      console.log(`✅ MSA agreement record created: ${msaAgreement.id}`);

      // Step 5: Generate PDFs
      console.log("📄 Generating PDFs...");
      const [ndaPdfBuffer, msaPdfBuffer] = await Promise.all([
        generateAgreementPDF(personalizedNDA, "NDA"),
        generateAgreementPDF(personalizedMSA, "MSA"),
      ]);

      console.log("✅ PDFs generated successfully");

      // Step 6: Upload PDFs to Cloudinary
      console.log("☁️ Uploading PDFs to Cloudinary...");
      const timestamp = Date.now();
      const userNameSlug = userData.fullName.replace(/\s+/g, "_");

      const [ndaUploadResult, msaUploadResult] = await Promise.all([
        uploadPDFToCloudinary(ndaPdfBuffer, `NDA_${userNameSlug}_${timestamp}`, "agreements/nda"),
        uploadPDFToCloudinary(msaPdfBuffer, `MSA_${userNameSlug}_${timestamp}`, "agreements/msa"),
      ]);

      console.log("✅ PDFs uploaded to Cloudinary");

      // Step 7: Update Agreement records with PDF URLs
      await tx.agreement.update({
        where: { id: ndaAgreement.id },
        data: {
          pdfUrl: ndaUploadResult.url,
          pdfPublicId: ndaUploadResult.publicId,
        },
      });

      await tx.agreement.update({
        where: { id: msaAgreement.id },
        data: {
          pdfUrl: msaUploadResult.url,
          pdfPublicId: msaUploadResult.publicId,
        },
      });

      console.log("✅ Agreement records updated with PDF URLs");

      // Step 8: Update User agreementSigned flag
      await tx.user.update({
        where: { id: userId },
        data: { agreementSigned: true },
      });

      console.log("✅ User agreementSigned flag updated");

      return {
        ndaAgreement,
        msaAgreement,
        ndaPdfUrl: ndaUploadResult.url,
        msaPdfUrl: msaUploadResult.url,
        userData,
      };
    });

    console.log("✅ Transaction committed successfully");

    // Step 9: Send email in background (non-blocking)
    // This runs after the transaction commits, so user can proceed to dashboard
    setImmediate(async () => {
      await sendAgreementEmailBackground({
        agreementIds: {
          nda: result.ndaAgreement.id,
          msa: result.msaAgreement.id,
        },
        emailParams: {
          toEmail: user.email,
          userName: result.userData.fullName,
          ndaPdfUrl: result.ndaPdfUrl,
          msaPdfUrl: result.msaPdfUrl,
          acceptanceDate: result.userData.acceptanceDate.toLocaleDateString("en-GB"),
        },
      });
    });

    return {
      success: true,
      message: "Agreements accepted successfully",
      agreementIds: {
        nda: result.ndaAgreement.id,
        msa: result.msaAgreement.id,
      },
    };
  } catch (error) {
    console.error("❌ Error processing agreement acceptance:", error);

    // If transaction failed and records were created, they'll be rolled back automatically
    throw error;
  }
}

/**
 * Send agreement email in background with retry logic
 * @param {Object} params - Email parameters
 * @param {Object} params.agreementIds - Agreement IDs
 * @param {Object} params.emailParams - Email parameters
 * @returns {Promise<void>}
 */
async function sendAgreementEmailBackground({ agreementIds, emailParams }) {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [5000, 300000, 900000]; // 5s, 5min, 15min

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📧 Email send attempt ${attempt}/${MAX_RETRIES}`);

      // Send email
      const emailResult = await sendAgreementEmail(emailParams);

      if (emailResult.success) {
        // Update both agreement records
        await Promise.all([
          prisma.agreement.update({
            where: { id: agreementIds.nda },
            data: {
              emailStatus: "SENT",
              emailSentAt: new Date(),
              emailRetryCount: attempt,
            },
          }),
          prisma.agreement.update({
            where: { id: agreementIds.msa },
            data: {
              emailStatus: "SENT",
              emailSentAt: new Date(),
              emailRetryCount: attempt,
            },
          }),
        ]);

        console.log(`✅ Email sent successfully on attempt ${attempt}`);
        return;
      }

      // Email failed
      if (attempt < MAX_RETRIES) {
        // Update retry count and wait before next attempt
        await Promise.all([
          prisma.agreement.update({
            where: { id: agreementIds.nda },
            data: {
              emailRetryCount: attempt,
              lastRetryAt: new Date(),
            },
          }),
          prisma.agreement.update({
            where: { id: agreementIds.msa },
            data: {
              emailRetryCount: attempt,
              lastRetryAt: new Date(),
            },
          }),
        ]);

        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`⏳ Waiting ${delay / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error);

      if (attempt === MAX_RETRIES) {
        // Final failure - mark as FAILED and notify admin
        await Promise.all([
          prisma.agreement.update({
            where: { id: agreementIds.nda },
            data: {
              emailStatus: "FAILED",
              emailRetryCount: MAX_RETRIES,
              lastRetryAt: new Date(),
            },
          }),
          prisma.agreement.update({
            where: { id: agreementIds.msa },
            data: {
              emailStatus: "FAILED",
              emailRetryCount: MAX_RETRIES,
              lastRetryAt: new Date(),
            },
          }),
        ]);

        // Fetch agent ID for notification
        const agreement = await prisma.agreement.findUnique({
          where: { id: agreementIds.nda },
          select: { agentId: true },
        });

        // Send admin notification
        await sendAgreementEmailFailureAlert({
          userName: emailParams.userName,
          userEmail: emailParams.toEmail,
          agentId: agreement.agentId,
          errorMessage: error.message,
          retryCount: MAX_RETRIES,
        });

        console.log("🚨 Admin notified of email failure");
      }
    }
  }
}

/**
 * Get pending email agreements (for cron job)
 * @returns {Promise<Array>} - Pending agreements
 */
export async function getPendingEmailAgreements() {
  return await prisma.agreement.findMany({
    where: {
      emailStatus: "PENDING",
      emailRetryCount: {
        lt: 3, // Less than 3 retries
      },
    },
    include: {
      agent: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
