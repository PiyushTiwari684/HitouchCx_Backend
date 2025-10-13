import "dotenv/config"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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

        // Send the OTP to the user's email using Nodemailer
        await transporter.sendMail({
            from: process.env.SMTP_USER, // business email used as sender
            to: user.email, // recipient email
            subject: 'Your verification code for HiTouch CX',
            text: `Your OTP is ${otpCode}. It expires in 10 minutes.`
        });
    }
    catch (error) {
        console.log("Error Occured while sending OTP", error)
    }
}

export { sendEmailOTP }
