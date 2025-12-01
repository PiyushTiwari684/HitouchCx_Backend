import "dotenv/config";
import twilio from "twilio";
import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "../config/db.js";

//OTP Service for Email

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmailOTP(user, WINDOW_MINUTES) {
  try {
    console.log("[sendEmailOTP] Starting OTP generation for user:", user.email);
    // Generate a 6-digit random OTP (between 100000–999999)
    const otpCode = crypto.randomInt(100000, 999999).toString();
    console.log("[sendEmailOTP] OTP generated:", otpCode);

    // Set OTP expiry time to 15 minutes from now
    const expiresAt = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

    // Update the user record in the database with the new OTP and its expiry
    console.log("[sendEmailOTP] Saving OTP to database");
    await prisma.oTP.create({
      data: {
        code: otpCode,
        type: "EMAIL",
        target: user.email,
        userId: user.id,
        expiresAt,
        consumed: false,
      },
    });
    console.log("[sendEmailOTP] OTP saved to database");

    // Send the OTP to the user's email using Nodemailer
    console.log("[sendEmailOTP] Sending email to:", user.email);
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // business email used as sender
      to: user.email, // recipient email
      subject: "Your verification code for reboo8",
      text: `Your OTP is ${otpCode}. It expires in ${WINDOW_MINUTES} minutes.`,
    });
    console.log("[sendEmailOTP] Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[sendEmailOTP] Error occurred while sending OTP:", error);
    throw error;
  }
}

//OTP Service for Phone

//Twilio Creds
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

//Send OTP to Phone
async function sendPhoneOTP(phoneNumber) {
  try {
    console.log("[sendPhoneOTP] Received phone number:", phoneNumber);
    console.log("[sendPhoneOTP] Phone type:", typeof phoneNumber);
    console.log("[sendPhoneOTP] Phone length:", phoneNumber.length);
    console.log("[sendPhoneOTP] Calling Twilio with number:", phoneNumber);

    const verification = await client.verify.v2.services(verifySid).verifications.create({
      to: phoneNumber, // Format: +919876543210
      channel: "sms", // or 'call' or 'whatsapp'
    });

    console.log("OTP sent successfully:", verification.status);
    return {
      sent: true,
      verified: verification.status,
      to: verification.to,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Verify OTP received on Phone
async function verifyPhoneOTP(phoneNumber, code) {
  try {
    const verificationCheck = await client.verify.v2.services(verifySid).verificationChecks.create({
      to: phoneNumber,
      code: code, // The 6-digit code user entered
    });

    console.log("Verification status:", verificationCheck.status);

    return {
      success: verificationCheck.status === "approved",
      status: verificationCheck.status,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export { sendEmailOTP, sendPhoneOTP, verifyPhoneOTP };
