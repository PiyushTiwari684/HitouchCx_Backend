import prisma from "../../../config/db.js";
import asyncHandler from "express-async-handler";
import { sendSuccess, sendError } from "../../../utils/ApiResponse.js";
import { checkImageBlur, getImageMetadata, resizeImage } from "../../../utils/imageProcessor.js";
import { processAudio, getAudioDuration } from "../../../utils/audioProcessor.js";
import {
  transcribeAudio,
  isGroqTranscriptionConfigured,
} from "../../../services/groq.transcription.service.js";
import { checkMatch } from "../../../utils/stringSimilarity.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import { SessionStatus } from "@prisma/client";
import cloudinary from "../../../config/cloudinary.config.js";

/**
 * Download file from Cloudinary URL to temporary location
 */
async function downloadFromCloudinary(cloudinaryUrl) {
  try {
    console.log('📥 Downloading from Cloudinary:', cloudinaryUrl);

    const response = await axios.get(cloudinaryUrl, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);
    const tempFileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const tempPath = path.join('/tmp', tempFileName);

    fs.writeFileSync(tempPath, buffer);
    console.log('✅ File downloaded to temp:', tempPath);

    return { path: tempPath, buffer };
  } catch (error) {
    console.error('❌ Error downloading from Cloudinary:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

// ============================================================
// FACE CAPTURE ENDPOINT
// ============================================================

export const uploadFaceCapture = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { faceDescriptor } = req.body;

  // Validate required fields
  if (!attemptId) {
    return sendError(res, "Attempt ID is required", 400);
  }

  // Get candidateId from attemptId
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: { candidateId: true },
  });

  if (!attempt) {
    return sendError(res, "Assessment attempt not found", 404);
  }

  const candidateId = attempt.candidateId;

  // Check if file was uploaded
  if (!req.file) {
    return sendError(res, "Face image is required", 400);
  }

  // Validate face descriptor
  let parsedDescriptor = null;
  if (faceDescriptor) {
    try {
      parsedDescriptor = JSON.parse(faceDescriptor);
      if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) {
        console.warn("Invalid face descriptor format");
        parsedDescriptor = null;
      }
    } catch (error) {
      console.warn("Failed to parse face descriptor:", error.message);
      parsedDescriptor = null;
    }
  }

  try {
    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return sendError(res, "Candidate not found", 404);
    }

    // Check if identity verification record exists
    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
    });

    // req.file.path is now Cloudinary URL - download to process
    const cloudinaryUrl = req.file.path;
    const { buffer, path: tempPath } = await downloadFromCloudinary(cloudinaryUrl);

    // Check image quality (blur detection)
    const blurCheck = await checkImageBlur(buffer);

    if (blurCheck.isBlurry) {
      // Delete temp file
      fs.unlinkSync(tempPath);
      return sendError(
        res,
        `Image is too blurry (sharpness: ${blurCheck.sharpness}). Please retake with better lighting.`,
        400,
      );
    }

    // Get image metadata
    const metadata = await getImageMetadata(buffer);

    // Resize image if too large
    let finalCloudinaryUrl = cloudinaryUrl;
    if (metadata.width > 1280 || metadata.height > 720) {
      const resizedBuffer = await resizeImage(buffer);

      // Re-upload resized version to Cloudinary
      const base64Image = resizedBuffer.toString('base64');
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Image}`,
        {
          folder: 'hitouchcx/faces',
          public_id: `face-${attemptId}-${Date.now()}`,
        }
      );

      finalCloudinaryUrl = result.secure_url;
      console.log(`✅ Image resized and re-uploaded from ${metadata.width}x${metadata.height}`);
    }

    // Delete temp file
    fs.unlinkSync(tempPath);

    // Create or update identity verification record
    if (verification) {
      verification = await prisma.identityVerification.update({
        where: { attemptId },
        data: {
          faceImagePath: finalCloudinaryUrl,
          faceDetectedInitial: true,
          faceQualityScore: blurCheck.sharpness / 1000,
          faceEmbedding: parsedDescriptor,
          verificationStatus: "IN_PROGRESS",
        },
      });
    } else {
      verification = await prisma.identityVerification.create({
        data: {
          candidateId,
          attemptId,
          faceImagePath: finalCloudinaryUrl,
          faceDetectedInitial: true,
          faceQualityScore: blurCheck.sharpness / 1000,
          faceEmbedding: parsedDescriptor,
          verificationStatus: "IN_PROGRESS",
        },
      });
    }

    return sendSuccess(
      res,
      {
        verification,
        imageQuality: {
          sharpness: blurCheck.sharpness,
          isSharp: !blurCheck.isBlurry,
          dimensions: `${metadata.width}x${metadata.height}`,
        },
      },
      "Face captured successfully",
    );
  } catch (error) {
    console.error('❌ Error in uploadFaceCapture:', error);
    throw error;
  }
});

// ============================================================
// GET REFERENCE FACE DESCRIPTOR ENDPOINT
// ============================================================

export const getReferenceDescriptor = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  if (!attemptId) {
    return sendError(res, "Attempt ID is required", 400);
  }

  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: { candidateId: true },
  });

  if (!attempt) {
    return sendError(res, "Assessment attempt not found", 404);
  }

  const candidateId = attempt.candidateId;

  try {
    const verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
      select: {
        faceEmbedding: true,
        faceImagePath: true,
        faceQualityScore: true,
        candidateId: true,
      },
    });

    if (!verification) {
      return sendError(
        res,
        "Identity verification not found. Please complete face capture first.",
        404,
      );
    }

    if (verification.candidateId !== candidateId) {
      return sendError(res, "Unauthorized access to verification data", 403);
    }

    if (!verification.faceEmbedding) {
      return sendError(res, "Face descriptor not found. Please retake face capture.", 404);
    }

    return sendSuccess(
      res,
      {
        descriptor: verification.faceEmbedding,
        faceImagePath: verification.faceImagePath,
        qualityScore: verification.faceQualityScore,
      },
      "Reference descriptor retrieved successfully",
    );
  } catch (error) {
    throw error;
  }
});

export const logFaceComparison = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { matchScore, matched, faceDetected, faceCount, snapshotBase64 } = req.body;

  console.log("[logFaceComparison] Request received:", {
    attemptId,
    matchScore,
    matched,
    faceDetected,
    faceCount,
  });

  if (!attemptId) {
    return sendError(res, "Attempt ID is required", 400);
  }

  if (matchScore === undefined || matched === undefined) {
    return sendError(res, "Match score and matched status are required", 400);
  }

  try {
    const attempt = await prisma.candidateAssessment.findUnique({
      where: { id: attemptId },
      select: { candidateId: true },
    });

    if (!attempt) {
      return sendError(res, "Assessment attempt not found", 404);
    }

    const candidateId = attempt.candidateId;

    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
      select: {
        id: true,
        candidateId: true,
      },
    });

    if (!verification) {
      console.log("[logFaceComparison] No verification found, creating placeholder...");

      try {
        verification = await prisma.identityVerification.create({
          data: {
            candidateId: candidateId,
            attemptId: attemptId,
            verificationStatus: "NOT_STARTED",
            faceDetectedInitial: false,
            audioVerified: false,
            audioAttemptCount: 0,
          },
        });

        console.log("[logFaceComparison] Placeholder verification created:", verification.id);
      } catch (createError) {
        console.error("[logFaceComparison] Failed to create verification:", createError.message);
        return sendError(res, "Failed to create verification record", 500);
      }
    }

    if (candidateId && verification.candidateId !== candidateId) {
      return sendError(res, "Unauthorized access", 403);
    }

    let session = await prisma.proctoringSession.findFirst({
      where: { attemptId },
      orderBy: { sessionStartedAt: "desc" },
    });

    if (!session) {
      console.log("[logFaceComparison] No session found, creating one...");

      const attempt = await prisma.candidateAssessment.findUnique({
        where: { id: attemptId },
        select: {
          candidateId: true,
          assessmentId: true,
        },
      });

      if (!attempt) {
        return sendError(res, "Assessment attempt not found", 404);
      }

      try {
        session = await prisma.proctoringSession.create({
          data: {
            candidateId: attempt.candidateId,
            assessmentId: attempt.assessmentId,
            attemptId: attemptId,
            sessionToken: crypto.randomUUID(),
            sessionStartedAt: new Date(),
            sessionStatus: SessionStatus.IN_PROGRESS,
          },
        });

        console.log("[logFaceComparison] Session created successfully:", session.id);
      } catch (createError) {
        console.error("[logFaceComparison] Failed to create session:", createError.message);
        return sendError(res, "Failed to create proctoring session", 500);
      }
    }

    const logEntry = await prisma.proctoringLog.create({
      data: {
        sessionId: session.id,
        candidateId: verification.candidateId,
        eventType: "FACE_COMPARISON",
        eventDescription: matched
          ? `Face verified (score: ${matchScore.toFixed(4)})`
          : `Face mismatch detected (score: ${matchScore.toFixed(4)})`,
        timestamp: new Date(),
        violationType: matched ? null : "FACE_MISMATCH",
        severity: matched ? "INFO" : "CRITICAL",
        isViolation: !matched,
        countsTowardLimit: !matched,
        faceDetected: faceDetected ?? true,
        faceCount: faceCount ?? 1,
        faceMatchScore: matchScore,
        metadata: {
          matched,
          matchScore,
          threshold: 0.6,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log("[logFaceComparison] Log entry created:", logEntry.id);

    let snapshot = null;
    if (!matched && snapshotBase64) {
      try {
        snapshot = await prisma.violationSnapshot.create({
          data: {
            verificationId: verification.id,
            candidateId: verification.candidateId,
            sessionId: session.id,
            violationType: "FACE_MISMATCH",
            violationSeverity: "CRITICAL",
            snapshotBase64: snapshotBase64,
            faceDetected: faceDetected ?? false,
            faceCount: faceCount ?? 0,
            faceMatchScore: matchScore,
            capturedAt: new Date(),
          },
        });
        console.log("[logFaceComparison] Snapshot saved:", snapshot.id);
      } catch (snapshotError) {
        console.error("[logFaceComparison] Failed to save snapshot:", snapshotError.message);
      }
    }

    return sendSuccess(
      res,
      {
        logEntry: {
          id: logEntry.id,
          sessionId: logEntry.sessionId,
          matched: matched,
          matchScore: matchScore,
        },
        snapshot: snapshot ? { id: snapshot.id } : null,
      },
      "Face comparison logged successfully",
    );
  } catch (error) {
    console.error("[logFaceComparison] Error:", error);
    throw error;
  }
});

// ============================================================
// AUDIO RECORDING ENDPOINT
// ============================================================

export const uploadAudioRecording = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { originalText, transcription } = req.body;

  // Validate required fields
  if (!attemptId || !originalText) {
    return sendError(res, "Attempt ID and original text are required", 400);
  }

  // Check if file was uploaded
  if (!req.file) {
    return sendError(res, "Audio file is required", 400);
  }

  // Get candidateId from attemptId
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: { candidateId: true },
  });

  if (!attempt) {
    return sendError(res, "Assessment attempt not found", 404);
  }

  const candidateId = attempt.candidateId;

  let tempPath = null;

  try {
    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return sendError(res, "Candidate not found", 404);
    }

    // Get identity verification record
    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
    });

    if (!verification) {
      return sendError(
        res,
        "Identity verification not found. Please complete face capture first.",
        404,
      );
    }

    // Check retry limit (max 3 attempts)
    if (verification.audioAttemptCount >= 3) {
      return sendError(res, "Maximum audio recording attempts (3) exceeded", 400);
    }

    // req.file.path is Cloudinary URL - download for processing
    const cloudinaryUrl = req.file.path;
    const downloadResult = await downloadFromCloudinary(cloudinaryUrl);
    tempPath = downloadResult.path;

    // Process audio (compress if needed)
    const audioResult = await processAudio(tempPath);
    const finalAudioPath = audioResult.filePath;

    // Get audio duration
    const duration = await getAudioDuration(finalAudioPath);

    // Get transcription
    let finalTranscription = transcription;

    // If no transcription provided, use Groq Whisper as fallback
    if (!finalTranscription || finalTranscription.trim() === "") {
      console.log("No transcription from frontend. Using Groq Whisper fallback...");

      if (!isGroqTranscriptionConfigured()) {
        fs.unlinkSync(finalAudioPath);
        if (tempPath && tempPath !== finalAudioPath) fs.unlinkSync(tempPath);
        return sendError(
          res,
          "Groq transcription service not configured. Please set GROQ_API_KEY.",
          500,
        );
      }

      console.log("Starting Groq Whisper transcription...");
      const groqResult = await transcribeAudio(finalAudioPath);
      finalTranscription = groqResult.text;
      console.log("Groq transcription complete:", finalTranscription.substring(0, 100));
    }

    // Calculate match score (90% threshold)
    const matchResult = checkMatch(originalText, finalTranscription, 90);

    // Update identity verification record with Cloudinary URL
    const updatedVerification = await prisma.identityVerification.update({
      where: { attemptId },
      data: {
        audioRecordingPath: cloudinaryUrl, // Store Cloudinary URL
        audioTranscription: finalTranscription,
        audioOriginalText: originalText,
        audioMatchScore: matchResult.score,
        audioVerified: matchResult.isMatch,
        audioAttemptCount: verification.audioAttemptCount + 1,
      },
    });

    // Clean up temp files
    if (finalAudioPath && fs.existsSync(finalAudioPath)) {
      fs.unlinkSync(finalAudioPath);
    }
    if (tempPath && tempPath !== finalAudioPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    // Prepare response
    const response = {
      verification: updatedVerification,
      audioValidation: {
        transcription: finalTranscription,
        originalText: originalText,
        matchScore: matchResult.score,
        isMatch: matchResult.isMatch,
        threshold: matchResult.threshold,
        attemptsUsed: updatedVerification.audioAttemptCount,
        attemptsRemaining: 3 - updatedVerification.audioAttemptCount,
      },
      audioInfo: {
        duration,
        compressed: audioResult.compressed,
        fileSize: audioResult.size,
      },
    };

    // Check if warning needed
    if (!matchResult.isMatch && updatedVerification.audioAttemptCount === 2) {
      response.warning = "This is your 2nd failed attempt. You have 1 more try remaining.";
    }

    return sendSuccess(res, response, "Audio recorded successfully");
  } catch (error) {
    // Clean up temp files on error
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error('❌ Error in uploadAudioRecording:', error);
    throw error;
  }
});
