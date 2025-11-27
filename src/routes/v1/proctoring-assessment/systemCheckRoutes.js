import express from "express";
import { createSystemCheck } from "../../../controllers/v1/proctoring-assessment/systemCheck.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// POST endpoint to create a system check record

router.post("/", authMiddleware, createSystemCheck);

export default router;
