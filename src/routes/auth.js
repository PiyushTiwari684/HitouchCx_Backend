import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/token.js';
import {signUp} from "../controllers/auth.js"

const prisma = new PrismaClient();
const router = express.Router();

//To Review with Frontend Team
router.post('/sign-up',signUp);

//To Review with Frontend Team
router.post('/verify-otp', async (req, res) => {
  // Extract email and OTP from request body
  const { email, otp } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Check if OTP matches and is not expired
  const valid =
    user.otp === otp &&   // OTP matches stored value
    user.otpExpiresAt &&    // Expiration timestamp exists
    user.otpExpiresAt > new Date(); // OTP is still valid (not expired)

  if (!valid)
    return res.status(400).json({ message: 'Invalid or expired OTP' });

  // If OTP is valid, clear OTP fields and activate the user
  await prisma.user.update({
    where: { email },
    data: { otp: null, otpExpiresAt: null, status: 'ACTIVE' }
  });

  // Send confirmation response
  res.json({ message: 'Email verified successfully' });
});


router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    })

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare entered password with hashed one
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    // Ensure account is verified/active
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not verified yet" });
    }

    //  Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role,
      status: user.status
    });

    //Send Response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
