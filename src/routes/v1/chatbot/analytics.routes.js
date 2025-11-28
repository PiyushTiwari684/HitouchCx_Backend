import express from "express";
import * as analyticsController from "../../../controllers/v1/chatbot/analytics.controller.js";

const router = express.Router();

// GET /api/analytics - Get analytics for date range
router.get("/", analyticsController.getAnalytics);

// POST /api/analytics/generate - Manually generate analytics
router.post("/generate", analyticsController.generateAnalytics);

export default router;
