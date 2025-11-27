import express from "express";
import {
  generateAssessment,
  getAssessmentForAttempt,
  startAssessment,
  getAttemptDetails,
  logViolation,
} from "../../../controllers/v1/proctoring-assessment/assessment.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", authMiddleware, startAssessment);
router.post("/generate", authMiddleware, generateAssessment);
router.get("/attempt/:attemptId", authMiddleware, getAttemptDetails);
router.get("/:assessmentId/attempt/:attemptId", authMiddleware, getAssessmentForAttempt);
router.post("/:assessmentId/attempt/:attemptId/violations", authMiddleware, logViolation);

export default router;
