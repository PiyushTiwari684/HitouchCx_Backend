import "dotenv/config"
import twilio from 'twilio';
import crypto from "crypto"
import nodemailer from "nodemailer"
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
import prisma from '../config/db.js'; 


//OTP Service for Email

async function sendEmailFromTwilio(otpCode,email,minutes) {

  const msg = {
    to: email, // Change to your recipient
    from: 'noreply@hitouchcx.com', // Change to your verified sender
    subject: 'Your OTP for reboo8!',
    text: `OTP `,
    html: `<p>Here's your otp: ${otpCode} and its valid for ${minutes} minutes</p>`,
  }

  try {
    const [response] = await sgMail.send(msg)
    console.log('Email sent to ',name)
    return { success: true, statusCode: response.statusCode }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message }
  }
}

async function sendEmailOTP(user,WINDOW_MINUTES) {
    try {
        // Generate a 6-digit random OTP (between 100000–999999)
        const otpCode = crypto.randomInt(100000, 999999).toString();

        // Set OTP expiry time to 15 minutes from now
        const expiresAt = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

        // Update the user record in the database with the new OTP and its expiry
        await prisma.oTP.create({
            data: {
                code: otpCode,
                type: "EMAIL",
                target: user.email,
                userId: user.id,
                expiresAt,
                consumed: false,
            }
        });


        sendEmailFromTwilio(otpCode,user.email,WINDOW_MINUTES)

    }
    catch (error) {
        console.log("Error Occured while sending OTP", error)
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
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications
      .create({ 
        to: phoneNumber,  // Format: +919876543210
        channel: 'sms'    // or 'call' or 'whatsapp'
      });

    console.log('OTP sent successfully:', verification.status);
    return {
      sent: true,
      verified: verification.status,
      to: verification.to
    };
} catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verify OTP received on Phone
async function verifyPhoneOTP(phoneNumber, code) {
  try {
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks
      .create({ 
        to: phoneNumber,
        code: code  // The 6-digit code user entered
      });

    console.log('Verification status:', verificationCheck.status);
    
    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
}






export { sendEmailOTP,sendPhoneOTP,verifyPhoneOTP,sendEmailFromTwilio }
