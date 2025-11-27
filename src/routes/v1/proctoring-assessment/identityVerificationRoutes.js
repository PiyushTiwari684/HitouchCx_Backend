import express from "express";
import {
  uploadFaceCapture,
  uploadAudioRecording,
  getReferenceDescriptor,
  logFaceComparison,
} from "../../../controllers/v1/proctoring-assessment/identityVerification.controller.js";
import { uploadFaceImage, uploadAudio } from "../../../config/upload.config.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/v1/identity-verification/:attemptId/face-capture
// Upload face image for identity verification
router.post(
  "/:attemptId/face-capture",
  authMiddleware, // Requires valid JWT token
  uploadFaceImage.single("faceImage"), // Multer middleware (accepts single file named "faceImage")
  uploadFaceCapture, // Controller function
);

// POST /api/v1/identity-verification/:attemptId/audio-recording
// Upload audio recording for voice verification
router.post(
  "/:attemptId/audio-recording",
  authMiddleware, // Requires valid JWT token
  uploadAudio.single("audioFile"), // Multer middleware (accepts single file named "audioFile")
  uploadAudioRecording, // Controller function
);

// GET /api/v1/identity-verification/:attemptId/descriptor
// Retrieve stored face descriptor for live comparison during assessment
router.get(
  "/:attemptId/descriptor",
  authMiddleware, // Requires valid JWT token
  getReferenceDescriptor, // Controller function
);

// POST /api/v1/identity-verification/:attemptId/comparison-log
// Log face comparison results during assessment
router.post(
  "/:attemptId/comparison-log",
  // authMiddleware, // Requires valid JWT token
  logFaceComparison, // Controller function
);

export default router;
