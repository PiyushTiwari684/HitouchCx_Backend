import express from "express";
import authMiddleware, { requireRole } from "../../../middlewares/authMiddleware.js";
import { registerAgent } from "../../../controllers/v1/agent/register.controller.js";
import {
  uploadAgentPhoto,
  deleteAgentPhoto,
} from "../../../controllers/v1/agent/photo.controller.js";
import {
  addBankDetails,
  getBankDetails,
} from "../../../controllers/v1/agent/bankDetails.controller.js";
import { getAgentById } from "../../../controllers/v1/agent/getAgent.controller.js";
import upload from "../../../middlewares/imageUpload.js"; // ← Add this line!
import uploadResume from "../../../middlewares/multer.middleware.js";
import { extractResume } from "../../../controllers/v1/resume/resume.controller.js";

const router = express.Router();

//Agent Information

//Add Agent info
router.post("/register", authMiddleware, registerAgent);
//Add Bank Details
router.post("/bank-details", authMiddleware, addBankDetails);
//Get Bank Info
router.get("/bank-details", authMiddleware, getBankDetails);
//Get Agent info
router.get("/:agentId", getAgentById);

//Agent Media Files

//Add Agent's Profile Photo
router.post(
  "/:agentId/upload-photo",
  upload.single("profilePhoto"), // Middleware
  uploadAgentPhoto,
);

//Delete Agent Profile Photo
router.delete("/:agentId/delete-photo", deleteAgentPhoto);

//Add Resume Auto Fill Route
router.post("/resume-upload", uploadResume.single("resume"), extractResume);

export default router;
