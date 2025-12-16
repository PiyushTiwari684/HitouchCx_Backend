import prisma from '../../../config/db.js';
import { generateAccessToken, generateRefreshTokenValue, hashRefreshToken } from "../../../utils/token.js"
import validator from 'validator';
import bcrypt from 'bcrypt';
import { sendEmailFromTwilio, sendPhoneOTP, verifyPhoneOTP } from "../../../services/otp.service.js"
import {
  calculateNextStep,
  getAssessmentStatusSummary
} from "../../../utils/assessmentHelpers.js";


//Sign Up Controller
const signUp = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    //Checking Email,Phone & Password 
    if (!email || !phone || !password) {
      return res.status(400).json({ error: "Enter All required fields." })
    }

    //Validation all the credentials

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." })
    }

    if (!validator.isMobilePhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number." })
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ error: "Password is not strong enough" })
    }

    // Find the user by unique email
    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord) {
      return res.status(404).json({ error: "User not found. Verify OTP first." });
    }
    if (!userRecord.emailVerified || !userRecord.phoneVerified) {
      return res.status(400).json({ error: "Verify email and phone OTP before sign up." });
    }



    //Creating Hash Password and updating fields
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const user = await prisma.user.update({
      where: { email, emailVerified: true, phoneVerified: true },
      data: { passwordHash: hashedPassword, status: "ACTIVE", createdAt: now }
    })


    //Sending Response if User Updated
    console.log(user.status)
    if (user && user.status == "ACTIVE") {
      const token = generateAccessToken({ id: user.id, role: user.role, status: user.status });
      const refreshPlain = generateRefreshTokenValue()
      const refreshHash = hashRefreshToken(refreshPlain)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      await prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: refreshHash, expiresAt }
      })
      return res.json({ message: "User added successfully and is 'Active'", token: token, refreshToken: refreshPlain, email, phone })
    } else {
      return res.json({ error: "Prisma failed to return the user info" })
    }

  }
  catch (err) {
    res.status(500).json({ error: "Error Occured while Sign Up", error: err.message });
  }
}

// Log In Controller
const logIn = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: "Enter all fields" })
    }


    async function authenticate(user) {
      if (user) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (valid && user.status == "ACTIVE") {
          // Short-lived access token
          const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status })
          // Long-lived refresh token (opaque), store hash
          const refreshPlain = generateRefreshTokenValue()
          const refreshHash = hashRefreshToken(refreshPlain)
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

          await prisma.refreshToken.create({
            data: { userId: user.id, tokenHash: refreshHash, expiresAt }
          })


          return res.json({
            message: "User Authenticated",
            accessToken,
            refreshToken: refreshPlain,
            userEmail: user.email,
            userPhone: user.phone
          })
        } else {
          return res.status(401).json({ error: "Invalid credentials or user not active" })
        }
      } else {
        return res.status(404).json({ error: "User not found" })
      }
    }

    if (email && validator.isEmail(email)) {
      const user = await prisma.user.findUnique({ where: { email } })
      await authenticate(user);
      return;
    } else if ((phone && validator.isMobilePhone(phone))) {
      const user = await prisma.user.findUnique({ where: { phone } })
      await authenticate(user);
      return;
    } else {
      return res.status(400).json({ error: "Invalid email or phone" })
    }
  } catch (error) {
    res.status(500).json({ error: "User failed to login.", details: error.message })
  }
}

//To refresh the token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })

    const tokenHash = hashRefreshToken(refreshToken)
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } }
    })
    if (!record) return res.status(401).json({ error: 'Invalid or expired refresh token' })

    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user || user.status !== 'ACTIVE') return res.status(401).json({ error: 'User not active' })

    // Rotate refresh token
    const newPlain = generateRefreshTokenValue()
    const newHash = hashRefreshToken(newPlain)
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: record.id },
        data: { revoked: true, revokedAt: new Date(), replacedByToken: newHash }
      }),
      prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: newHash, expiresAt: newExpiresAt }
      })
    ])

    const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status })
    return res.json({ accessToken, refreshToken: newPlain })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
}

// Logout: revoke the provided refresh token
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })

    const tokenHash = hashRefreshToken(refreshToken)
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true, revokedAt: new Date() }
    })
    return res.json({ message: 'Logged out' })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to logout' })
  }
}


//Forgot Password Logic

//Request OTP for forgotten password of user using email/phone

const requestForgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body || {};
    if (email == null && phone == null) {
      return res.status(400).json({ message: 'Provide email or phone' });
    }

    const normalizedEmail = email == null ? null : String(email).trim().toLowerCase();
    const normalizedPhone = phone == null ? null : String(phone).trim();

    const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Email flow
    if (normalizedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, status: true, email: true },
      });

      if (user && user.status === 'ACTIVE') {
        const code = genOtp();
        await prisma.oTP.create({
          data: {
            code,
            type: 'PASSWORD_RESET',
            target: normalizedEmail,
            userId: user.id,
            expiresAt,
          },
        });
        sendEmailFromTwilio(code, normalizedEmail, 10);
      } else {
        return res.status(400).json({ error: "User with this email does not exist" })
      }
    }

    // Phone flow
    if (normalizedPhone) {
      const user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true, status: true, phone: true },
      });

      if (user && user.status === 'ACTIVE') {
        const otpStatus = await sendPhoneOTP(normalizedPhone);
        if (!otpStatus?.sent) {
          return res.status(400).json({ error: "Failed to send otp to phone" })
        }
      } else {
        return res.status(400).json({ error: "User with with phone number does not exist" })
      }
    }

    // Generic response to avoid account enumeration
    return res.status(200).json({ message: 'If the account exists, an OTP has been sent.' });
  } catch (err) {
    console.error('requestForgotPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// Step 1: Verify OTP and issue a short-lived reset session token
const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, phone, code } = req.body || {};
    if ((email == null && phone == null) || !code) {
      return res.status(400).json({ error: "Provide email or phone, and OTP code" });
    }

    const normalizedEmail = email == null ? null : String(email).trim().toLowerCase();
    const normalizedPhone = phone == null ? null : String(phone).trim();
    const target = normalizedEmail ?? normalizedPhone;

    // Validate inputs
    if (normalizedEmail && !validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (normalizedPhone && !validator.isMobilePhone(normalizedPhone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // Find active user
    const user = await prisma.user.findFirst({
      where: normalizedEmail ? { email: normalizedEmail } : { phone: normalizedPhone },
      select: { id: true, status: true, role: true },
    });
    if (!user || user.status !== "ACTIVE") {
      return res.status(404).json({ error: "User not found or not active" });
    }

    if (normalizedEmail) {
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          userId: user.id,
          target,
          type: 'PASSWORD_RESET',
          code: String(code).trim(),
          consumed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Option A: consume OTP now and issue token
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { consumed: true },
      });
    }


    if (normalizedPhone) {
      const otpStatusPhone = await verifyPhoneOTP(normalizedPhone, code)
      if (!otpStatusPhone?.success) {
        return res.status(400).json({ error: "Can't verify OTP. Invalid/Expired OTP entered" })
      }
    }

    const resetSessionToken = generateAccessToken({
      id: user.id,
      role: user.role,
      status: user.status,
      scope: 'PASSWORD_RESET',
    });

    return res.status(200).json({
      message: "OTP verified. Proceed to set a new password.",
      resetSessionToken,
    });
  } catch (err) {
    console.error("verifyForgotPasswordOtp error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const resetPasswordWithToken = async (req, res) => {
  try {
    const { newPassword } = req.body || {};

    // Auth middleware must set req.user
    const session = req.user;
    if (!session) {
      return res.status(401).json({ error: "Invalid or missing reset session" });
    }
    if (session.scope !== 'PASSWORD_RESET') {
      return res.status(403).json({ error: "Invalid reset session scope" });
    }

    if (!newPassword || !validator.isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Provide a strong newPassword" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, status: true,passwordHash:true },
    });
    if (!user || user.status !== "ACTIVE") {
      return res.status(404).json({ error: "User not found or not active" });
    }

    const isSameAsPrevious =await bcrypt.compare(newPassword, user.passwordHash);

    if (isSameAsPrevious) {
    return res.status(400).json({ error: "Please enter a password you have not used before." });
    }
    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      }),
    ]);

    return res.status(200).json({ message: "Password updated. Please log in again." });
  } catch (err) {
    console.error("resetPasswordWithToken error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export { signUp, logIn, refresh, logout, requestForgotPassword, verifyForgotPasswordOtp, resetPasswordWithToken }