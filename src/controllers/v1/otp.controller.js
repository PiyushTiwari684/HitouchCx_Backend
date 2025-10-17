import { sendEmailOTP, sendPhoneOTP, verifyPhoneOTP } from "../../services/otp.service.js"
import { PrismaClient } from '@prisma/client';
import validator from 'validator';

const prisma = new PrismaClient();
const MAX_REQUESTS = 100000;
const WINDOW_MINUTES = 10;

// Sending OTP to Phone/Email captured 
const requestOtp = async (req, res) => {

    try {
        //Extracting Email and Phone 
        const { email, phone } = req.body;

        //Error Response if both email and phone not present and in incorrect format
        if ( (!email || !validator.isEmail(email)) && (!phone || !validator.isMobilePhone(phone))) {
            res.status(400).json({ error: "Incorrect Email or Phone format" })
        }

        let user;
        //If Email present, Upsert the record
        if (email && !phone) {

            user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email }
            })
        }//If Phone Present(along with Email), Update the record with Phone
        else if (email && phone) {

            const otpStatus = await sendPhoneOTP(phone)
            if (otpStatus.sent) {
                const user = await prisma.user.update({
                    where: { email },
                    data: { phone }
                })

                res.json({ message: "OTP Sent..", otpStatus: otpStatus, userUpdated: user.email })

            } else {
                res.json({ error: "Failed to send otp to phone" })
            }

        }else{
            return res.status(400).json({error:"Provide both email and phone"})
        }
        // count only OTPs for this type (EMAIL or PHONE)
        const recentCount = await prisma.oTP.count({
            where: {
                target: email,
                type: email ? "EMAIL" : "PHONE",
            },
        });
        console.log(recentCount)
        //Counting the number of OTPS
        if (recentCount >= MAX_REQUESTS) {
            return res.status(429).json({ message: `Max ${MAX_REQUESTS} OTPs Allowed.` })
        }

        //If Email send the otp and give response
        if (email) {
            await sendEmailOTP(user, WINDOW_MINUTES);
            res.json({ message: "OTP Sent To Email", user: user })
        }



    }
    catch (error) {
        res.status(500).json({ message: "Cannot send the otp", error })
    }


}

//Verifying OTP
const verifyOtp = async (req, res) => {
    try {
        //Extracting Email/Phone and user OTP from Request Body
        const { email, phone, userOtp } = req.body;

        //If both Email and Phone not provided
        if ((!email || !validator.isEmail(email)) && (!phone || !validator.isMobilePhone(phone))) {
            res.status(400).json({ message: "Email/Phone required" })
        }

        //If Email is being provided
        if (email) {

            //Latest Email OTP from OTP table
            const otp = await prisma.oTP.findFirst({
                where: { target: email },
                orderBy: { createdAt: 'desc' }
            })

            //Current Time

            const presentTime = new Date(Date.now());

            //If Latest Email OTP is same as User OTP
            if (otp.code == userOtp && presentTime < otp.expiresAt) {

                //Update "consumed" to true of latest Email OTP
                await prisma.oTP.update({
                    where: { id: otp.id },
                    data: { consumed: true }
                })

                // Update "emailVerified" to true of user sending OTP
                await prisma.user.update({
                    where: { id: otp.userId },
                    data: { emailVerified: true }
                })

                res.json({ message: "OTP Verified Successfully" })
            } else {
                res.status(401).json({ error: "cannot verify" })
            }
        } else {

            //Status of Verification
            const status = await verifyPhoneOTP(phone, userOtp)

            //Find User with phone 
            if (status.success) {
                const user = await prisma.user.update({
                    where: { phone },
                    data: { phoneVerified: true }
                })

                res.json({ message: "Verified..", status: status })

            } else {
                res.status(401).json({ message: "Not able to verify." })
            }

        }
    }
    catch (error) {
        res.json({ message: "Failed to verify Phone/Email OTP", error })
    }
}

export { requestOtp, verifyOtp };