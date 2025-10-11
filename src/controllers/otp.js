import express from "express"
import validator from 'validator';
import { sendEmailOTP } from "../services/otpService.js"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const MAX_REQUESTS = 3;
const WINDOW_MINUTES = 10;
const requestOtp = async (req, res) => {

    try {
        //Extracting Email and Phone 
        const { email, phone } = req.body;

        //Error Response if both email and phone not present
        if (!email && !phone) {
            res.status(400).json({ error: "Email or Phone required" })
        }

        let user;
        //If Email present, Upsert the record
        if (email) {
            
            user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email }
            })
        }//If Phone Present, Update the record with Phone
         else {
            user = await prisma.user.update({
                where: { email },
                data: { phone }
            })
        }
        //Time Window in which OTP is valid
        const cutOff = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

        // count only OTPs for this type (EMAIL or PHONE)
        const recentCount = await prisma.oTP.count({
            where: {
                userId: user.id,
                type: email ? "EMAIL" : "PHONE",
                createdAt: { gte: cutOff },
            },
        });

        //Counting the number of OTPS
        if (recentCount > MAX_REQUESTS) {
            res.status(429).json({ message: `Max ${MAX_REQUESTS} OTPs Allowed.` })
        }

        //If Email send the otp and give response
        if(email){
          await sendEmailOTP(user);
          res.json({message:"OTP Sent To Email",user:user})
        }

        

    }
    catch (error) {
        res.status(500).json({ message: "Cannot send the otp", error })
    }


}

export { requestOtp };