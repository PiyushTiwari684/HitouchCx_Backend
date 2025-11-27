import prisma from "../config/db.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  checkImageBlur,
  getImageMetadata,
  resizeImage,
} from "../utils/imageProcessor.js";
import { processAudio, getAudioDuration } from "../utils/audioProcessor.js";
import {
  transcribeAudio,
  isAssemblyAIConfigured,
} from "../services/assemblyAiServices.js";
import { checkMatch } from "../utils/stringSimilarity.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { SessionStatus } from "@prisma/client";

// ============================================================
// FACE CAPTURE ENDPOINT
// ============================================================

export const uploadFaceCapture = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const candidateId = req.candidate.id; // Get from JWT token via authenticateCandidate middleware
  const { faceDescriptor } = req.body; // NEW: Face descriptor array from frontend

  // 1. Validate required fields
  if (!attemptId) {
    return sendError(res, "Attempt ID is required", 400);
  }

  // 2. Check if file was uploaded
  if (!req.file) {
    return sendError(res, "Face image is required", 400);
  }

  // 3. Validate face descriptor (optional but recommended)
  let parsedDescriptor = null;
  if (faceDescriptor) {
    try {
      parsedDescriptor = JSON.parse(faceDescriptor);

      // Validate descriptor format (should be array of 128 numbers)
      if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) {
        console.warn(
          "Invalid face descriptor format. Expected array of 128 numbers."
        );
        parsedDescriptor = null;
      }
    } catch (error) {
      console.warn("Failed to parse face descriptor:", error.message);
      parsedDescriptor = null;
    }
  }

  try {
    // 3. Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      // Delete uploaded file if candidate not found
      fs.unlinkSync(req.file.path);
      return sendError(res, "Candidate not found", 404);
    }

    // 4. Check if identity verification record exists
    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
    });

    // 5. Read uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);

    // 6. Check image quality (blur detection)
    const blurCheck = await checkImageBlur(imageBuffer);

    if (blurCheck.isBlurry) {
      // Delete blurry image
      fs.unlinkSync(req.file.path);
      return sendError(
        res,
        `Image is too blurry (sharpness: ${blurCheck.sharpness}). Please retake with better lighting.`,
        400
      );
    }

    // 7. Get image metadata
    const metadata = await getImageMetadata(imageBuffer);

    // 8. Resize image if too large (save storage)
    let finalImagePath = req.file.path;
    if (metadata.width > 1280 || metadata.height > 720) {
      const resizedBuffer = await resizeImage(imageBuffer);
      fs.writeFileSync(req.file.path, resizedBuffer);
      console.log(`Image resized from ${metadata.width}x${metadata.height}`);
    }

    // 9. Store relative path (not absolute)
    const relativePath = path.relative(process.cwd(), finalImagePath);

    // 10. Create or update identity verification record
    if (verification) {
      // Update existing record
      verification = await prisma.identityVerification.update({
        where: { attemptId },
        data: {
          faceImagePath: relativePath,
          faceDetectedInitial: true,
          faceQualityScore: blurCheck.sharpness / 1000, // Normalize to 0-1 scale
          faceEmbedding: parsedDescriptor, // NEW: Store face descriptor
          verificationStatus: "IN_PROGRESS",
        },
      });
    } else {
      // Create new record
      verification = await prisma.identityVerification.create({
        data: {
          candidateId,
          attemptId,
          faceImagePath: relativePath,
          faceDetectedInitial: true,
          faceQualityScore: blurCheck.sharpness / 1000,
          faceEmbedding: parsedDescriptor, // NEW: Store face descriptor
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
      "Face captured successfully"
    );
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// ============================================================
// GET REFERENCE FACE DESCRIPTOR ENDPOINT
// ============================================================

export const getReferenceDescriptor = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const candidateId = req.candidate.id;

  // 1. Validate required fields
  if (!attemptId) {
    return sendError(res, "Attempt ID is required", 400);
  }

  try {
    // 2. Get identity verification record
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
        404
      );
    }

    // 3. Verify ownership
    if (verification.candidateId !== candidateId) {
      return sendError(res, "Unauthorized access to verification data", 403);
    }

    // 4. Check if face descriptor exists
    if (!verification.faceEmbedding) {
      return sendError(
        res,
        "Face descriptor not found. Please retake face capture.",
        404
      );
    }

    return sendSuccess(
      res,
      {
        descriptor: verification.faceEmbedding,
        faceImagePath: verification.faceImagePath,
        qualityScore: verification.faceQualityScore,
      },
      "Reference descriptor retrieved successfully"
    );
  } catch (error) {
    throw error;
  }
});

// ============================================================
// LOG FACE COMPARISON RESULT ENDPOINT
// ============================================================

// export const logFaceComparison = asyncHandler(async (req, res) => {
//   const { attemptId } = req.params;
//   const candidateId = req.candidate.id;
//   const { matchScore, matched, faceDetected, faceCount, snapshotBase64 } =
//     req.body;

//   // 1. Validate required fields
//   if (!attemptId) {
//     return sendError(res, "Attempt ID is required", 400);
//   }

//   if (matchScore === undefined || matched === undefined) {
//     return sendError(res, "Match score and matched status are required", 400);
//   }

//   try {
//     // 2. Verify identity verification exists
//     const verification = await prisma.identityVerification.findUnique({
//       where: { attemptId },
//       select: { candidateId: true },
//     });

//     if (!verification) {
//       return sendError(res, "Identity verification not found", 404);
//     }

//     // 3. Verify ownership
//     if (verification.candidateId !== candidateId) {
//       return sendError(res, "Unauthorized access", 403);
//     }

//     // 4. Get proctoring session
//     const session = await prisma.proctoringSession.findFirst({
//       where: { attemptId },
//       orderBy: { sessionStartedAt: "desc" },
//     });

//     if (!session) {
//       return sendError(res, "Proctoring session not found", 404);
//     }

//     // 5. Create proctoring log entry
//     const logEntry = await prisma.proctoringLog.create({
//       data: {
//         sessionId: session.id,
//         timestamp: new Date(),
//         violationType: matched ? null : "FACE_MISMATCH",
//         severity: matched ? null : "CRITICAL",
//         faceDetected: faceDetected ?? true,
//         faceCount: faceCount ?? 1,
//         faceMatchScore: matchScore,
//         details: {
//           matched,
//           matchScore,
//           threshold: 0.6,
//         },
//       },
//     });

//     // 6. Optional: Save snapshot if mismatch
//     let snapshot = null;
//     if (!matched && snapshotBase64) {
//       try {
//         // Save snapshot to violation snapshots table
//         snapshot = await prisma.violationSnapshot.create({
//           data: {
//             sessionId: session.id,
//             violationType: "FACE_MISMATCH",
//             snapshotData: snapshotBase64, // Store as base64 in JSON field
//             timestamp: new Date(),
//           },
//         });
//       } catch (snapshotError) {
//         console.error("Failed to save snapshot:", snapshotError.message);
//         // Don't fail the request if snapshot save fails
//       }
//     }

//     return sendSuccess(
//       res,
//       {
//         logEntry,
//         snapshot: snapshot ? { id: snapshot.id } : null,
//       },
//       "Face comparison logged successfully"
//     );
//   } catch (error) {
//     throw error;
//   }
// });

// export const logFaceComparison = asyncHandler(async (req, res) => {
//   const { attemptId } = req.params;
//   const { matchScore, matched, faceDetected, faceCount, snapshotBase64 } =
//     req.body;

//   console.log("[logFaceComparison] Request received:", {
//     attemptId,
//     matchScore,
//     matched,
//     faceDetected,
//     faceCount,
//   });

//   // 1. Validate required fields
//   if (!attemptId) {
//     return sendError(res, "Attempt ID is required", 400);
//   }

//   if (matchScore === undefined || matched === undefined) {
//     return sendError(res, "Match score and matched status are required", 400);
//   }

//   try {
//     // 2. Get candidate ID safely (handle missing authentication)
//     const candidateId = req.candidate?.id;

//     if (!candidateId) {
//       console.warn(
//         "[logFaceComparison] No candidate ID - authentication middleware not active"
//       );
//       // Don't fail - just skip ownership check
//     }

//     // 3. Verify identity verification exists
//     const verification = await prisma.identityVerification.findUnique({
//       where: { attemptId },
//       select: { candidateId: true },
//     });

//     // if (!verification) {
//     //   console.warn(
//     //     "[logFaceComparison] Identity verification not found for attemptId:",
//     //     attemptId
//     //   );
//     //   return sendError(res, "Identity verification not found", 404);
//     // }
//        if (!verification) {
//          console.log(
//            "[logFaceComparison] No verification found, creating placeholder..."
//          );

//          // Get attempt to find candidateId
//          const attempt = await prisma.candidateAssessment.findUnique({
//            where: { id: attemptId },
//            select: { candidateId: true },
//          });

//          if (!attempt) {
//            return sendError(res, "Assessment attempt not found", 404);
//          }

//          // Create placeholder verification
//          try {
//            verification = await prisma.identityVerification.create({
//              data: {
//                candidateId: attempt.candidateId,
//                attemptId: attemptId,
//                verificationStatus: "NOT_STARTED",
//                faceDetectedInitial: false,
//                audioVerified: false,
//                audioAttemptCount: 0,
//              },
//            });

//            console.log(
//              "[logFaceComparison] Placeholder verification created:",
//              verification.id
//            );
//          } catch (createError) {
//            console.error(
//              "[logFaceComparison] Failed to create verification:",
//              createError.message
//            );
//            return sendError(res, "Failed to create verification record", 500);
//          }
//        }

//     // 4. Verify ownership (only if candidateId available)
//     if (candidateId && verification.candidateId !== candidateId) {
//       return sendError(res, "Unauthorized access", 403);
//     }

//     // 5. Get or create proctoring session
//     let session = await prisma.proctoringSession.findFirst({
//       where: { attemptId },
//       orderBy: { sessionStartedAt: "desc" },
//     });

//     // FIXED: Auto-create session if it doesn't exist
//     if (!session) {
//       console.log("[logFaceComparison] No session found, creating one...");

//       // Get attempt details
//       const attempt = await prisma.candidateAssessment.findUnique({
//         where: { id: attemptId },
//         select: {
//           candidateId: true,
//           assessmentId: true,
//         },
//       });

//       if (!attempt) {
//         return sendError(res, "Assessment attempt not found", 404);
//       }

//       // Create new proctoring session
//       try {
//         session = await prisma.proctoringSession.create({
//           data: {
//             candidateId: attempt.candidateId,
//             assessmentId: attempt.assessmentId,
//             attemptId: attemptId,
//             sessionToken: crypto.randomUUID(), // Generate unique token
//             sessionStartedAt: new Date(),
//             sessionStatus: SessionStatus.IN_PROGRESS,
//             totalViolations: 0,
//             graceViolations: 0,
//             criticalViolations: 0,
//             isAutoSubmitted: false,
//           },
//         });

//         console.log(
//           "[logFaceComparison] Session created successfully:",
//           session.id
//         );
//       } catch (createError) {
//         console.error(
//           "[logFaceComparison] Failed to create session:",
//           createError.message
//         );
//         return sendError(res, "Failed to create proctoring session", 500);
//       }
//     }

//     // 6. Create proctoring log entry (now session definitely exists)
//     const logEntry = await prisma.proctoringLog.create({
//       data: {
//         sessionId: session.id,
//         candidateId: verification.candidateId, // ✅ ADDED - Required field
//         eventType: "FACE_COMPARISON", // ✅ ADDED - Required field
//         eventDescription: matched
//           ? `Face verified (score: ${matchScore.toFixed(4)})`
//           : `Face mismatch detected (score: ${matchScore.toFixed(4)})`, // ✅ ADDED
//         timestamp: new Date(),
//         violationType: matched ? null : "FACE_MISMATCH",
//         severity: matched ? "INFO" : "CRITICAL", // ✅ FIXED - Can't be null
//         isViolation: !matched, // ✅ ADDED - Required field
//         countsTowardLimit: !matched, // ✅ ADDED - Required field
//         faceDetected: faceDetected ?? true,
//         faceCount: faceCount ?? 1,
//         faceMatchScore: matchScore,
//         metadata: {
//           // ✅ FIXED - Changed from 'details' to 'metadata'
//           matched,
//           matchScore,
//           threshold: 0.6,
//           timestamp: new Date().toISOString(),
//         },
//       },
//     });

//     console.log("[logFaceComparison] Log entry created:", logEntry.id);

//     // 7. Optional: Save snapshot if mismatch
//     let snapshot = null;
//     if (!matched && snapshotBase64) {
//       try {
//         snapshot = await prisma.violationSnapshot.create({
//           data: {
//             sessionId: session.id,
//             violationType: "FACE_MISMATCH",
//             snapshotData: snapshotBase64,
//             timestamp: new Date(),
//           },
//         });
//         console.log("[logFaceComparison] Snapshot saved:", snapshot.id);
//       } catch (snapshotError) {
//         console.error(
//           "[logFaceComparison] Failed to save snapshot:",
//           snapshotError.message
//         );
//         // Don't fail the request if snapshot save fails
//       }
//     }

//     return sendSuccess(
//       res,
//       {
//         logEntry: {
//           id: logEntry.id,
//           sessionId: logEntry.sessionId,
//           matched: matched,
//           matchScore: matchScore,
//         },
//         snapshot: snapshot ? { id: snapshot.id } : null,
//       },
//       "Face comparison logged successfully"
//     );
//   } catch (error) {
//     console.error("[logFaceComparison] Error:", error);
//     throw error; // asyncHandler will catch this
//   }
// });

export const logFaceComparison = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { matchScore, matched, faceDetected, faceCount, snapshotBase64 } =
    req.body;

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
    const candidateId = req.candidate?.id;

    if (!candidateId) {
      console.warn(
        "[logFaceComparison] No candidate ID - authentication middleware not active"
      );
    }

    // ✅ FIXED: Changed const to let
    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
      select: {
        id: true, // ✅ Added - needed for snapshot
        candidateId: true,
      },
    });

    if (!verification) {
      console.log(
        "[logFaceComparison] No verification found, creating placeholder..."
      );

      const attempt = await prisma.candidateAssessment.findUnique({
        where: { id: attemptId },
        select: { candidateId: true },
      });

      if (!attempt) {
        return sendError(res, "Assessment attempt not found", 404);
      }

      try {
        verification = await prisma.identityVerification.create({
          data: {
            candidateId: attempt.candidateId,
            attemptId: attemptId,
            verificationStatus: "NOT_STARTED",
            faceDetectedInitial: false,
            audioVerified: false,
            audioAttemptCount: 0,
          },
        });

        console.log(
          "[logFaceComparison] Placeholder verification created:",
          verification.id
        );
      } catch (createError) {
        console.error(
          "[logFaceComparison] Failed to create verification:",
          createError.message
        );
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

        console.log(
          "[logFaceComparison] Session created successfully:",
          session.id
        );
      } catch (createError) {
        console.error(
          "[logFaceComparison] Failed to create session:",
          createError.message
        );
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
        // ✅ FIXED: Added all required fields
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
        console.error(
          "[logFaceComparison] Failed to save snapshot:",
          snapshotError.message
        );
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
      "Face comparison logged successfully"
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
  const candidateId = req.candidate.id; // Get from JWT token via authenticateCandidate middleware
  const { originalText, transcription } = req.body;

  // 1. Validate required fields
  if (!attemptId || !originalText) {
    return sendError(res, "Attempt ID and original text are required", 400);
  }

  // 2. Check if file was uploaded
  if (!req.file) {
    return sendError(res, "Audio file is required", 400);
  }

  try {
    // 3. Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      fs.unlinkSync(req.file.path);
      return sendError(res, "Candidate not found", 404);
    }

    // 4. Get identity verification record
    let verification = await prisma.identityVerification.findUnique({
      where: { attemptId },
    });

    if (!verification) {
      fs.unlinkSync(req.file.path);
      return sendError(
        res,
        "Identity verification not found. Please complete face capture first.",
        404
      );
    }

    // 5. Check retry limit (max 3 attempts)
    if (verification.audioAttemptCount >= 3) {
      fs.unlinkSync(req.file.path);
      return sendError(
        res,
        "Maximum audio recording attempts (3) exceeded",
        400
      );
    }

    // 6. Process audio (compress if needed)
    const audioResult = await processAudio(req.file.path);
    const finalAudioPath = audioResult.filePath;

    // 7. Get audio duration
    const duration = await getAudioDuration(finalAudioPath);

    // 8. Get transcription
    let finalTranscription = transcription; // From frontend (Web Speech API)

    // If no transcription provided, use AssemblyAI as fallback
    if (!finalTranscription || finalTranscription.trim() === "") {
      console.log(
        "No transcription from frontend. Using AssemblyAI fallback..."
      );

      if (!isAssemblyAIConfigured()) {
        fs.unlinkSync(finalAudioPath);
        return sendError(res, "Transcription service not configured", 500);
      }

      const assemblyResult = await transcribeAudio(finalAudioPath);
      finalTranscription = assemblyResult.text;
    }

    // 9. Calculate match score
    const matchResult = checkMatch(originalText, finalTranscription, 80);

    // 10. Store relative path
    const relativePath = path.relative(process.cwd(), finalAudioPath);

    // 11. Update identity verification record
    const updatedVerification = await prisma.identityVerification.update({
      where: { attemptId },
      data: {
        audioRecordingPath: relativePath,
        audioTranscription: finalTranscription,
        audioOriginalText: originalText,
        audioMatchScore: matchResult.score,
        audioVerified: matchResult.isMatch,
        audioAttemptCount: verification.audioAttemptCount + 1,
      },
    });

    // 12. Prepare response
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

    // 13. Check if warning needed (2nd failed attempt)
    if (!matchResult.isMatch && updatedVerification.audioAttemptCount === 2) {
      response.warning =
        "This is your 2nd failed attempt. You have 1 more try remaining.";
    }

    return sendSuccess(res, response, "Audio recorded successfully");
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});
