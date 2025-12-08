import express from "express";
import {
  generateAssessment,
  getAssessmentForAttempt,
  startAssessment,
  getAttemptDetails,
  logViolation,
  getViolationSummary,
  logViolationBatch
} from "../../../controllers/v1/proctoring-assessment/assessment.controller.js";
import {
  saveAnswer,
  getAllAnswers,
  getAnswerByQuestion,
  deleteAnswer,
  getAnswerStatistics
} from "../../../controllers/v1/proctoring-assessment/answer.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";
import { uploadAudio } from "../../../config/upload.config.js";

const router = express.Router();

router.post("/start", authMiddleware, startAssessment);
router.post("/generate", authMiddleware, generateAssessment);
router.get("/attempt/:attemptId", authMiddleware, getAttemptDetails);
router.get("/:assessmentId/attempt/:attemptId", authMiddleware, getAssessmentForAttempt);
router.post("/:assessmentId/attempt/:attemptId/violations", authMiddleware, logViolation);

// Violation batch endpoints
router.get("/attempt/:attemptId/violations/summary", authMiddleware, getViolationSummary);
router.post("/:assessmentId/attempt/:attemptId/violations/batch", authMiddleware, logViolationBatch);

// Answer endpoints
// Save or update an answer (with optional audio file upload)
router.post("/attempt/:attemptId/answers", authMiddleware, uploadAudio.single("audioFile"), saveAnswer);

// Get all answers for an attempt
router.get("/attempt/:attemptId/answers", authMiddleware, getAllAnswers);

// Get answer statistics
router.get("/attempt/:attemptId/answers/statistics", authMiddleware, getAnswerStatistics);

// Get specific answer by question ID
router.get("/attempt/:attemptId/answers/question/:questionId", authMiddleware, getAnswerByQuestion);

// Delete an answer
router.delete("/attempt/:attemptId/answers/:answerId", authMiddleware, deleteAnswer);

export default router;
