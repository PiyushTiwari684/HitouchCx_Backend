import express from "express";
import * as customQuestionController from "../../../controllers/v1/chatbot/customQuestion.controller.js";

const router = express.Router();

// POST /api/ai/ask - Ask a custom question (Tier 2)
router.post("/ask", customQuestionController.askQuestion);

// POST /api/ai/feedback - Record feedback on AI answer
router.post("/feedback", customQuestionController.recordFeedback);

// GET /api/ai/frequent-questions - Get frequently asked questions
router.get(
  "/frequent-questions",
  customQuestionController.getFrequentQuestions
);

export default router;
