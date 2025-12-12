import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import authMiddleware from "../../../middlewares/authMiddleware.js"
import {signUp,logIn,requestForgotPassword,verifyForgotPasswordOtp,resetPasswordWithToken,logout,refresh} from "../../../controllers/v1/auth/auth.controller.js"
import passport from '../../../config/passport.js';


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

// Initiate Google OAuth
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
  (req, res) => {
    try {
      // Generate JWT token (same as your regular login)
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
      );
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

export default router;
