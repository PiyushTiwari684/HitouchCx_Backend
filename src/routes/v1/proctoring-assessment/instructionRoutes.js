import express from "express";
import { validateDevice } from "../../../controllers/v1/proctoring-assessment/instruction.controller.js";

const router = express.Router();

router.post("/validate-device", validateDevice);

export default router;
