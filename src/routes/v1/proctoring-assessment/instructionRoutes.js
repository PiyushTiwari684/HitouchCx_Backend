import express from "express";
import { validateDevice } from "../controllers/instructionController.js";

const router = express.Router();

router.post("/validate-device", validateDevice);

export default router;
