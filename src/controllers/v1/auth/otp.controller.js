import { sendEmailOTP, sendPhoneOTP, verifyPhoneOTP } from "../../../services/otp.service.js";
import prisma from "../../../config/db.js";
import validator from "validator";

const MAX_REQUESTS = 100000;
const WINDOW_MINUTES = 10;

// Sending OTP to Phone/Email captured
const requestOtp = async (req, res) => {
  try {
    //Extracting Email and Phone
    const { email, phone } = req.body;
    console.log("[requestOtp] Received request:", { email, phone });

    //Error Response if both email and phone not present and in incorrect format
    if ((!email || !validator.isEmail(email)) && (!phone || !validator.isMobilePhone(phone))) {
      console.log("[requestOtp] Validation failed");
      return res.status(400).json({ error: "Incorrect Email or Phone format" });
    }

    let user;
    //If Email present, Upsert the record
    if (email && !phone) {
      user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });

      // count only OTPs for this type (EMAIL)
      const recentCount = await prisma.oTP.count({
        where: {
          target: email,
          type: "EMAIL",
        },
      });

      //Counting the number of OTPS
      if (recentCount >= MAX_REQUESTS) {
        return res.status(429).json({ message: `Max ${MAX_REQUESTS} OTPs Allowed.` });
      }

      //Send email OTP and give response
      console.log("[requestOtp] Sending email OTP to:", user.email);
      await sendEmailOTP(user, WINDOW_MINUTES);
      console.log("[requestOtp] Email OTP sent successfully");
      return res.json({ message: "OTP Sent To Email", user: user });
    } //If Phone Present(along with Email), Update the record with Phone
    else if (email && phone) {
      console.log("[requestOtp] Sending phone OTP to:", phone);
      console.log("[requestOtp] Phone number length:", phone.length);
      console.log("[requestOtp] Phone starts with +:", phone.startsWith("+"));
      const otpStatus = await sendPhoneOTP(phone);
      if (otpStatus.sent) {
        const user = await prisma.user.update({
          where: { email },
          data: { phone },
        });

        return res.json({ message: "OTP Sent..", otpStatus: otpStatus, userUpdated: user.email });
      } else {
        return res.json({ error: "Failed to send otp to phone" });
      }
    } else {
      return res.status(400).json({ error: "Provide both email and phone" });
    }
  } catch (error) {
    console.error("[requestOtp] Error:", error);
    res.status(500).json({ message: "Cannot send the otp", error: error.message });
  }
};

//Verifying OTP
const verifyOtp = async (req, res) => {
  try {
    //Extracting Email/Phone and user OTP from Request Body
    const { email, phone, userOtp } = req.body;

    //If both Email and Phone not provided
    if ((!email || !validator.isEmail(email)) && (!phone || !validator.isMobilePhone(phone))) {
      res.status(400).json({ message: "Email/Phone required" });
    }

    //If Email is being provided
    if (email) {
      //Latest Email OTP from OTP table
      const otp = await prisma.oTP.findFirst({
        where: { target: email },
        orderBy: { createdAt: "desc" },
      });

      //Current Time

      const presentTime = new Date(Date.now());

      //If Latest Email OTP is same as User OTP
      if (otp.code == userOtp && presentTime < otp.expiresAt) {
        //Update "consumed" to true of latest Email OTP
        await prisma.oTP.update({
          where: { id: otp.id },
          data: { consumed: true },
        });

        // Update "emailVerified" to true of user sending OTP
        await prisma.user.update({
          where: { id: otp.userId },
          data: { emailVerified: true },
        });

        res.json({ message: "OTP Verified Successfully" });
      } else {
        res.status(401).json({ error: "cannot verify" });
      }
    } else {
      //Status of Verification
      const status = await verifyPhoneOTP(phone, userOtp);

      //Find User with phone
      if (status.success) {
        const user = await prisma.user.update({
          where: { phone },
          data: { phoneVerified: true },
        });

        res.json({ message: "Verified..", status: status });
      } else {
        res.status(401).json({ message: "Not able to verify." });
      }
    }
  } catch (error) {
    res.json({ message: "Failed to verify Phone/Email OTP", error });
  }
};

export { requestOtp, verifyOtp };
