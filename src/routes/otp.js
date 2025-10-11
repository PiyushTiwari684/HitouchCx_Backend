import express from 'express';
import { requestOtp } from '../controllers/otp.js';
const router = express.Router();

//Send OTP to email
router.post("/request-otp",requestOtp)


export default router;