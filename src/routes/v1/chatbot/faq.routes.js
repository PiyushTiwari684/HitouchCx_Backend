import express from "express";
import * as faqController from "../../../controllers/v1/chatbot/faq.controller.js";

const router = express.Router();

// GET /api/faq/categories
router.get("/categories", faqController.getCategories);

// GET /api/faq/questions/:categoryId
router.get("/questions/:categoryId", faqController.getQuestionsByCategory);

// GET /api/faq/question/:questionId
router.get("/question/:questionId", faqController.getQuestionById);

// POST /api/faq/feedback
router.post("/feedback", faqController.recordFeedback);

export default router;
