import bcrypt from 'bcrypt';
import prisma from '../../../config/db.js';
import { sendEmailFromTwilio } from "../../../services/otp.service.js"
import { sendPhoneOTP, verifyPhoneOTP } from "../../../services/otp.service.js"


// Request OTPs for changing email/phone
const requestEmailPhoneChange = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { email, phone } = req.body || {};
    if (email == null && phone == null) {
      return res.status(400).json({ message: 'Provide email or phone' });
    }

    const normalizedEmail = email == null ? null : String(email).trim().toLowerCase();
    const normalizedPhone = phone == null ? null : String(phone).trim();

    // Uniqueness pre-checks (avoid generating OTP for already taken values)
    if (normalizedEmail) {
      const emailInUse = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, status: true } });
      if (emailInUse && emailInUse.status == "ACTIVE") return res.status(409).json({ message: 'Email already in use' });
    }
    if (normalizedPhone) {
      const phoneInUse = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } });
      if (phoneInUse) return res.status(409).json({ message: 'Phone already in use' });
    }

    const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const result = { email: null, phone: null };

    // Email OTP
    if (normalizedEmail) {
      const emailCode = genOtp();
      const emailOtp = await prisma.oTP.create({
        data: {
          code: emailCode,
          type: 'EMAIL',
          target: normalizedEmail,
          userId,
          expiresAt,
        },
      });
      result.email = { target: normalizedEmail, otpId: emailOtp.id };

      sendEmailFromTwilio(emailCode, normalizedEmail, 10)

    }

    // Phone OTP
    if (normalizedPhone) {
      const otpStatus = await sendPhoneOTP(phone)
      if (!otpStatus.sent) {
        return res.json({ message: "Failed to send otp to phone"})
      } 
    }

    return res.status(200).json({
      message: 'OTP(s) generated. Please verify.',
    });


  } catch (err) {
    console.error('requestEmailPhoneChange error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTPs and update contact details
const updateEmailPhoneChange = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { email, emailOtpCode, phone, phoneOtpCode } = req.body || {};
    if (!email && !phone) {
      return res.status(400).json({ message: 'Provide email or phone to verify' });
    }

    const now = new Date();
    const updates = {};

    // Verify Email
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      const emailInUse = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (emailInUse) return res.status(409).json({ message: 'Email already in use' });
      if (!emailOtpCode) return res.status(400).json({ message: 'emailOtpCode is required' });

      const emailOtp = await prisma.oTP.findFirst({
        where: { userId, type: 'EMAIL', target: normalizedEmail, consumed: false },
        orderBy: { createdAt: 'desc' },
      });
      if (!emailOtp) return res.status(400).json({ message: 'No pending email OTP found' });
      if (emailOtp.code !== String(emailOtpCode)) return res.status(400).json({ message: 'Invalid email OTP' });
      if (emailOtp.expiresAt <= now) return res.status(400).json({ message: 'Email OTP expired' });

      updates.email = normalizedEmail;
    }

    // Verify Phone
    if (phone) {
      const normalizedPhone = String(phone).trim();

      const phoneInUse = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } });
      if (phoneInUse) return res.status(409).json({ message: 'Phone already in use' });
      if (!phoneOtpCode) return res.status(400).json({ message: 'phoneOtpCode is required' });

      const otpStatus = verifyPhoneOTP(normalizedPhone,phoneOtpCode)

      if(otpStatus.success){
        return res.json({error:"Verified!!"})
      }

      updates.phone = normalizedPhone;
    }

    if (!updates.email && !updates.phone) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    // Apply updates atomically and consume OTPs
    await prisma.$transaction(async (tx) => {
      if (updates.email) {
        await tx.oTP.updateMany({
          where: { userId, type: 'EMAIL', target: updates.email, consumed: false },
          data: { consumed: true },
        });
      }


      await tx.user.update({
        where: { id: userId },
        data: {
          ...(updates.email ? { email: updates.email, emailVerified: true } : {}),
          ...(updates.phone ? { phone: updates.phone, phoneVerified: true } : {}),
        },
      });
    });

    return res.status(200).json({ message: 'Contact details updated', data: updates });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Duplicate value for a unique field.' });
    }
    console.error('confirmEmailPhoneChange error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

//Pending Phone change

//Updating basic profile info of an agent
const updateAgentProfile = async (req, res) => {
  try {

    const userId = req.user?.id;

    //--Error when user is not logged in but trying to edit profile
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      email,
      phone,
      firstName,
      middleName,
      lastName,
      dob,
      profilePhotoUrl,
      address,
    } = req.body;

    // Fetch user with agent
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agent: true },
    });

    //--If user logged in but Database lost its information
    if (!user || !user.agent) {
      return res.status(404).json({ message: 'Agent profile not found' });
    }

    //~~~~~~~~USER update final To be discussed again and once the email is bought

    const userUpdate = {};
    if (email !== undefined) userUpdate.email = email;
    if (phone !== undefined) userUpdate.phone = phone;

    const agentUpdate = {};
    if (firstName !== undefined) {
      const v = firstName == null ? null : String(firstName).trim();
      if (v && v.length > 0) {
        agentUpdate.firstName = v;
      }
    }
    if (middleName !== undefined) {
      const v = middleName == null ? null : String(middleName).trim();
      if (v && v.length > 0) {
        agentUpdate.middleName = v;
      }
    }
    if (lastName !== undefined) {
      const v = lastName == null ? null : String(lastName).trim();
      if (v && v.length > 0) {
        agentUpdate.lastName = v;
      }
    }
    if (profilePhotoUrl !== undefined && profilePhotoUrl !== null) agentUpdate.profilePhotoUrl = profilePhotoUrl;

    if (address !== undefined) {
      const normalized = address == null ? null : String(address).trim();
      if (normalized && normalized.length > 0) {
        agentUpdate.address = normalized;
      }
    }
    console.log("came here 1")
    if (dob !== undefined && dob !== null) {
      const parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({ message: 'Invalid dob format. Use ISO date string.' });
      }
      agentUpdate.dob = parsedDob;
    }
    console.log("came here 2")

    // If nothing to update, return current data
    const willUpdateUser = Object.keys(userUpdate).length > 0;
    const willUpdateAgent = Object.keys(agentUpdate).length > 0;
    if (!willUpdateUser && !willUpdateAgent) {
      return res.status(200).json({
        message: 'No changes',
        data: {
          user: { id: user.id, email: user.email, phone: user.phone },
          agent: {
            id: user.agent.id,
            firstName: user.agent.firstName,
            middleName: user.agent.middleName,
            lastName: user.agent.lastName,
            dob: user.agent.dob,
            profilePhotoUrl: user.agent.profilePhotoUrl,
            address: user.agent.address,
          },
        },
      });
    }

    // Interactive transaction
    const { updatedUser, updatedAgent } = await prisma.$transaction(async (tx) => {
      let updatedUserLocal = user;
      let updatedAgentLocal = user.agent;

      if (willUpdateUser) {
        updatedUserLocal = await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      if (willUpdateAgent) {
        updatedAgentLocal = await tx.agent.update({
          where: { id: user.agent.id },
          data: agentUpdate,
        });
      }

      return { updatedUser: updatedUserLocal, updatedAgent: updatedAgentLocal };
    });

    return res.status(200).json({
      message: 'Profile updated',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
        agent: {
          id: updatedAgent.id,
          firstName: updatedAgent.firstName,
          middleName: updatedAgent.middleName,
          lastName: updatedAgent.lastName,
          dob: updatedAgent.dob,
          profilePhotoUrl: updatedAgent.profilePhotoUrl,
          address: updatedAgent.address,
        },
      },
    });
  } catch (err) {
    //--If user fails to update due to network/server issues
    // Handle unique constraint errors (email/phone)
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Duplicate value for a unique field.' });
    }
    console.error('UpdateAgentProfile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//Updating Agent's Password
const updateAgentPassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    //-- If user is not logged in and tries to update password
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    //If user never set password or didnt sign up
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.passwordHash) {
      return res.status(400).json({ message: 'Password not set. Use reset flow.' });
    }

    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    const saltRounds = 10;
    const newHash = await bcrypt.hash(String(newPassword), saltRounds);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
      select: { id: true },
    });

    return res.status(200).json({ message: 'Password updated successfully', data: { id: updated.id } });
  }//catch error when user cant update password due to server error
  catch (err) {
    console.error('UpdateAgentPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export { updateAgentProfile, updateAgentPassword, requestEmailPhoneChange, updateEmailPhoneChange }
