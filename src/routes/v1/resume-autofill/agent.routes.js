import express from 'express';
import upload from "../middlewares/multer.middleware.js";
import { extractResume } from '../controller/resume.controller.js';

const router = express.Router();

router.post("/resume-upload", upload.single("resume"), extractResume);

export default router;

// http//localhost:5000/api/agent/resume-upload