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
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", authMiddleware, startAssessment);
router.post("/generate", authMiddleware, generateAssessment);
router.get("/attempt/:attemptId", authMiddleware, getAttemptDetails);
router.get("/:assessmentId/attempt/:attemptId", authMiddleware, getAssessmentForAttempt);
router.post("/:assessmentId/attempt/:attemptId/violations", authMiddleware, logViolation);

// Violation batch endpoints
router.get("/attempt/:attemptId/violations/summary", authMiddleware, getViolationSummary);
router.post("/:assessmentId/attempt/:attemptId/violations/batch", authMiddleware, logViolationBatch);

export default router;
