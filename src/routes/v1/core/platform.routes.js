import express from "express";
const router = express.Router();
import authMiddleware, { requireRole } from "../../../middlewares/authMiddleware.js";
import { createPlatformReview } from "../../../controllers/v1/platform/review.controller.js";
import { getDashboardInfo } from "../../../controllers/v1/platform/dashboard.controller.js";



//Rate Platform

router.post("/agent-rates", authMiddleware, createPlatformReview);

//Dashboard Info

router.get("/dashboard-info/:agentId",getDashboardInfo)

export default router;
