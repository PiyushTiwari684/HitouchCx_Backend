import express from 'express';
import { requestOtp,verifyOtp } from '../controllers/otp.js';
const router = express.Router();

//Send OTP to email
router.post("/request-otp",requestOtp)
router.post("/verify-otp",verifyOtp)

export default router;