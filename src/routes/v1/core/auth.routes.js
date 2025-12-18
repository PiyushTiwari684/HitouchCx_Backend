import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import {verifyToken} from "../../../utils/token.js"
import authMiddleware from "../../../middlewares/authMiddleware.js"
import {signUp,logIn,requestForgotPassword,verifyForgotPasswordOtp,resetPasswordWithToken,logout,refresh} from "../../../controllers/v1/auth/auth.controller.js"
import passport from '../../../config/passport.js';
import {googleCallback} from "../../../controllers/v1/auth/oAuth.controller.js"

const router = express.Router();

//To Review with Frontend Team
router.post('/sign-up',signUp);

router.post('/log-in', logIn);

//Refresh Tokens
router.post("/refresh-token",refresh)

//Revoke the Refresh token
router.patch("/log-out",logout)

//Forgot Password
router.post("/password/request-change",requestForgotPassword)


router.post("/password/otp-verify",verifyForgotPasswordOtp)

router.patch("/password/new-password",authMiddleware,resetPasswordWithToken)

//OAuth Stuff

// It basically takes user to google's consent screen and request scope items : profile,email
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // We're using JWT, not sessions
  })
);

// Google callback route
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  googleCallback
);


//Testing - Token/JWT(Not for Prod)
 
router.post('/token/introspect', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'Missing token' });

  try {
    const decoded = verifyToken(token); // throws if invalid/expired
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = decoded.exp; // JWT exp in seconds
    const ttlSec = expSec - nowSec;
    const ttlInMins = ttlSec/60;

    return res.json({
      valid: true,
      expiresAt: new Date(expSec * 1000).toISOString(),
      timeToExpireMinutes: ttlInMins,
      payload: { id: decoded.id, role: decoded.role, status: decoded.status, scope: decoded.scope || null }
    });
  } catch (e) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

export default router;
