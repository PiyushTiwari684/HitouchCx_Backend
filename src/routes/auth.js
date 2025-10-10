import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/token.js';
import { sendEmailOTP } from '../services/otpService.js';
import validator from 'validator';

const prisma = new PrismaClient();
const router = express.Router();

//To Review with Frontend Team
router.post('/signup', async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    //Check Existing Email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: "User's email already exists" });

    //Check Existing Phone Number
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) return res.status(400).json({ messasge: "User's Phone Number already exists" })

    //Check Email Format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    //Check phone format
    if (!validator.isMobilePhone(phone, 'any')) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    //Hash Password
    const hashed = await bcrypt.hash(password, 10);

    //Create a user
    const user = await prisma.user.create({ data: { email, phone, passwordHash: hashed } });

    // Send OTP (store otp & expiry in DB using sendEmailOTP function )
    await sendEmailOTP(user);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: "Error Occured while Sign Up", error: err.message });
  }
});

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
