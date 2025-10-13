import { sendEmailOTP } from "../services/otpService.js"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const MAX_REQUESTS = 3;
const WINDOW_MINUTES = 10;

// Sending OTP to Phone/Email captured 
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
        if(email){
          await sendEmailOTP(user,WINDOW_MINUTES);
          res.json({message:"OTP Sent To Email",user:user})
        }

        

    }
    catch (error) {
        res.status(500).json({ message: "Cannot send the otp", error })
    }


}

//Verifying OTP
const verifyOtp = async(req,res)=>{
    try{
        //Extracting Email/Phone and user OTP from Request Body
        const {email,phone,userOtp} = req.body;

        //If both Email and Phone not provided
        if(!email && !phone){
            res.status(400).json({message:"Email/Phone required"})
        }

        //If Email is being provided
        if(email){

            //Latest Email OTP from OTP table
            const otp = await prisma.oTP.findFirst({
                where:{target:email},
                orderBy:{createdAt:'desc'}
            })

            //Current Time

            const presentTime = new Date(Date.now());

            //If Latest Email OTP is same as User OTP
            if(otp.code==userOtp && presentTime<otp.expiresAt){

                //Update "consumed" to true of latest Email OTP
                await prisma.oTP.update({
                    where:{id:otp.id},
                    data:{consumed:true}
                })

                // Update "emailVerified" to true of user sending OTP
                await prisma.user.update({
                    where:{id:otp.userId},
                    data:{emailVerified:true}
                })

                res.json({message:"OTP Verified Successfully"})
            }else{
                res.json({error:"cannot verify"})
            }
        }
    }
    catch(error){
        res.json({message:"Failed to verify Phone/Email OTP",error})
    }
}

export { requestOtp,verifyOtp };