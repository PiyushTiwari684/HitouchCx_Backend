import express from "express";
import { createSystemCheck } from "../controllers/systemCheckController.js";
import { authenticateCandidate } from "../middlewares/auth.js";

const router = express.Router();

// POST endpoint to create a system check record

router.post("/", authenticateCandidate, createSystemCheck);

export default router;
