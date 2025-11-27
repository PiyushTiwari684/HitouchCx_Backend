import express from "express";
import {
  generateAssessment,
  getAssessmentForAttempt,
  startAssessment,
  getAttemptDetails,
  logViolation,
} from "../../../controllers/v1/proctoring-assessment/assessment.controller.js";
import { authenticateCandidate } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", authenticateCandidate, startAssessment);
router.post("/generate", authenticateCandidate, generateAssessment);
router.get("/attempt/:attemptId", authenticateCandidate, getAttemptDetails);
router.get("/:assessmentId/attempt/:attemptId", authenticateCandidate, getAssessmentForAttempt);
router.post("/:assessmentId/attempt/:attemptId/violations", authenticateCandidate, logViolation);

export default router;
