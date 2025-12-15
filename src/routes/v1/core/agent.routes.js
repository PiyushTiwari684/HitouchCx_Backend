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
import {getProgress} from "../../../controllers/v1/agent/onboardProgress.controller.js"
import { getAgentById } from "../../../controllers/v1/agent/getAgent.controller.js";
import { uploadProfilePhoto, uploadResume } from "../../../config/upload.config.js";
import { extractResume } from "../../../controllers/v1/resume/resume.controller.js";
import { updateAgentProfile,updateAgentPassword,requestEmailPhoneChange,updateEmailPhoneChange,updateAgentInfo } from "../../../controllers/v1/agent/profile.controller.js";
import { getAgentProfile, updateAgentProfile as updateProfileAfterKYC } from "../../../controllers/v1/agent/update-profile.controller.js";


const router = express.Router();

//~~~~~~Agent Information

//Agent Registration Process Progress/Steps

router.get("/onboardProgress",authMiddleware,getProgress)

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

//Update Professional/Addition Info of agent
router.patch("/profile/extra-info",authMiddleware,updateAgentInfo)

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

//KYC-Related Profile Routes

/**
 * @route   GET /api/v1/agent/profile-for-kyc
 * @desc    Get agent profile for KYC retry/update
 * @access  Protected (requires JWT)
 */
router.get("/profile-for-kyc", authMiddleware, getAgentProfile);

/**
 * @route   PUT /api/v1/agent/profile-for-kyc
 * @desc    Update agent profile after KYC rejection
 * @access  Protected (requires JWT)
 * @note    Only allowed if kycStatus is REJECTED or PENDING
 */
router.put("/profile-for-kyc", authMiddleware, updateProfileAfterKYC);

export default router;
