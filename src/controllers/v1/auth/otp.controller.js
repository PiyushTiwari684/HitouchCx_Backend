import { sendEmailOTP, sendPhoneOTP, verifyPhoneOTP } from "../../../services/otp.service.js"
import prisma from '../../../config/db.js';
import validator from 'validator';

const MAX_REQUESTS = 100000;
const WINDOW_MINUTES = 10;

// Sending OTP to Phone/Email captured 
const requestOtp = async (req, res) => {

    try {
        //Extracting Email and Phone 
        const { email, phone } = req.body;

        //Error Response if both email and phone not present and in incorrect format
        if ((!email || !validator.isEmail(email)) && (!phone || !validator.isMobilePhone(phone))) {
            res.status(400).json({ error: "Incorrect Email or Phone format" })
        }

        // const emailStatus = await prisma.user.findUnique({
        //     where:{
        //         email:email
        //     }
        // })

        // if(emailStatus.status=="ACTIVE" ){
        //     return res.status(400).json({error:"Cannot send OTP. User already exists with same email"})
        // }

        //  const phoneStatus = await prisma.user.findUnique({
        //     where:{
        //         phone:phone
        //     }
        // })

        // if(phoneStatus.status=="ACTIVE"){
        //     return res.status(400).json({error:"Cannot send OTP. User already exists with same phone"})
        // }

        // Find existing user by whichever identifier is provided
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? { email } : undefined,
                ].filter(Boolean),
            },
        });

        if (existingUser && existingUser.status === 'ACTIVE') {
            return res.status(400).json({ error: 'Cannot send OTP. User already exists.' });
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

            //If Phone already exists, send error response

            const emailPhoneExists = await prisma.user.findUnique({
                where: { email }
            })

            const phoneExists = await prisma.user.findUnique({
                where:{phone}
            })

            if(phoneExists){
                return res.status(400).json({error:"Phone already exists. Provide new one"})
            }

            if (emailPhoneExists.phone==phone && emailPhoneExists.status=="ACTIVE") {
                return res.status(400).json({ error: "Phone already exists" })
            }

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

        } else {
            return res.status(400).json({ error: "Provide both email and phone" })
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
            return res.status(400).json({ message: "Email/Phone required" })
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
            } else if (presentTime > otp.expiresAt) {
                return res.status(401).json({ error: "OTP Expired" })

            }
            else {
                return res.status(401).json({ error: "OTP Mismatched" })
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

                return res.json({ message: "Verified..", status: status })

            } else {
                return res.status(401).json({ message: "Not able to verify." })
            }

        }
    }
    catch (error) {
        return res.json({ message: "Failed to verify Phone/Email OTP", error })
    }
}

export { requestOtp, verifyOtp };