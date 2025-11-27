import express from "express";
const router = express.Router();
import authMiddleware, { requireRole } from "../../../middlewares/authMiddleware.js";
import { createPlatformReview } from "../../../controllers/v1/platform/review.controller.js";

router.post("/agent-rates", authMiddleware, createPlatformReview);

export default router;
