import express from "express";
import authMiddleware, { requireRole } from "../../../middlewares/authMiddleware.js";
import { registerAgent } from "../../../controllers/v1/agent/register.controller.js";
import {
  uploadAgentPhoto,
  deleteAgentPhoto,
} from "../../../controllers/v1/agent/photo.controller.js";
import {
  addBankDetails,
 getBankDetails
} from "../../../controllers/v1/agent/bankDetails.controller.js";
import { getAgentById } from "../../../controllers/v1/agent/getAgent.controller.js";
import { uploadProfilePhoto, uploadResume } from "../../../config/upload.config.js";
import { extractResume } from "../../../controllers/v1/resume/resume.controller.js";
import { updateAgentProfile,updateAgentPassword,requestEmailPhoneChange,updateEmailPhoneChange } from "../../../controllers/v1/agent/profile.controller.js";


const router = express.Router();

//~~~~~~Agent Information

//Add Agent info
router.post("/register", authMiddleware, registerAgent);


router.post("/bank-details", authMiddleware, addBankDetails);

router.get("/bank-details",authMiddleware,getBankDetails)

//~~~~~~Edit Agent Profile

//Update Agent Profile
router.put("/profile", authMiddleware,updateAgentProfile);

//Update Agent Password
router.patch("/profile/password", authMiddleware, updateAgentPassword);

//Request Email/Phone Changes
router.post("/profile/contact/edit-request", authMiddleware, requestEmailPhoneChange);

//Update Email/Phone Changes
router.patch("/profile/contact/apply-update", authMiddleware, updateEmailPhoneChange);

//Get Agent info
router.get("/agentInfo/:id", getAgentById);




//Agent Media Files

//Add Agent's Profile Photo
router.post(
  "/:agentId/upload-photo",
  uploadProfilePhoto.single("profilePhoto"), // Middleware
  uploadAgentPhoto,
);

//Delete Agent Profile Photo
router.delete("/:agentId/delete-photo", deleteAgentPhoto);

//Add Resume Auto Fill Route
router.post("/resume-upload", uploadResume.single("resume"), extractResume);

export default router;
