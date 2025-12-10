import prisma from '../../../config/db.js'; 
import { generateAccessToken, generateRefreshTokenValue, hashRefreshToken } from "../../../utils/token.js"
import validator from 'validator';
import bcrypt from 'bcrypt';
import {
  calculateNextStep,
  getAssessmentStatusSummary
} from "../../../utils/assessmentHelpers.js";


//Sign Up Controller
const signUp = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

        //Checking Email,Phone & Password 
        if (!email || !phone || !password) {
            return res.status(400).json({ error: "Enter All required fields." })
        }

        //Validation all the credentials
       
        if (!validator.isEmail(email)) {
                return res.status(400).json({ error: "Invalid email address." })
            }

        if (!validator.isMobilePhone(phone)) {
                return res.status(400).json({ error: "Invalid phone number." })
            }

        if (!validator.isStrongPassword(password)) {
                return res.status(400).json({ error: "Password is not strong enough" })
            }
        

        //Creating Hash Password and updating fields
        const hashedPassword = await bcrypt.hash(password,10);
        const now = new Date();
        const user = await prisma.user.update({
            where:{email,emailVerified:true,phoneVerified:true},
            data:{passwordHash:hashedPassword,status:"ACTIVE",createdAt:now}
        })

          // Create Agent profile automatically for the new user
    if (user && user.status === "ACTIVE") {
      const existingAgent = await prisma.agent.findUnique({
        where: { userId: user.id },
      });
        
       if (!existingAgent) {
        await prisma.agent.create({
          data: {
            userId: user.id,
            firstName: user.firstName || "User",
            lastName: user.lastName || "",
            dob: new Date("2000-01-01"), // Default DOB, can be updated later
          },
        });
      }
    }
        //Sending Response if User Updated
        console.log(user.status)
        if(user && user.status=="ACTIVE"){
            const token = generateAccessToken({id:user.id,role:user.role,status:user.status}); 
            const refreshPlain = generateRefreshTokenValue()
            const refreshHash = hashRefreshToken(refreshPlain)
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

          await prisma.refreshToken.create({
            data: { userId: user.id, tokenHash: refreshHash, expiresAt }
          })
           return res.json({message:"User added successfully and is 'Active'",token:token,refreshToken:refreshPlain,email,phone})
        }else{
            return res.json({error:"Prisma failed to return the user info"})
        }

    }
    catch (err) {
        res.status(500).json({ error: "Error Occured while Sign Up", error: err.message });
    }
}

// Log In Controller
const logIn = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: "Enter all fields" })
    }
    

    async function authenticate(user) {
      if (user) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (valid && user.status == "ACTIVE") {
          // Short-lived access token
          const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status })
          // Long-lived refresh token (opaque), store hash
          const refreshPlain = generateRefreshTokenValue()
          const refreshHash = hashRefreshToken(refreshPlain)
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

          await prisma.refreshToken.create({
            data: { userId: user.id, tokenHash: refreshHash, expiresAt }
          })


          return res.json({
            message: "User Authenticated",
            accessToken,
            refreshToken: refreshPlain,
            userEmail:user.email,
            userPhone:user.phone
          })
        } else {
          return res.status(401).json({ error: "Invalid credentials or user not active" })
        }
      } else {
        return res.status(404).json({ error: "User not found" })
      }
    }

    if (email && validator.isEmail(email)) {
      const user = await prisma.user.findUnique({ where: { email } })
      await authenticate(user);
      return;
    } else if ((phone && validator.isMobilePhone(phone))) {
      const user = await prisma.user.findUnique({ where: { phone } })
      await authenticate(user);
      return;
    } else {
      return res.status(400).json({ error: "Invalid email or phone" })
    }
  } catch (error) {
    res.status(500).json({ error: "User failed to login.", details: error.message })
  }
}


//  async function authenticateIncludingAssess(user) {
//     }

//To refresh the token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })

    const tokenHash = hashRefreshToken(refreshToken)
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } }
    })
    if (!record) return res.status(401).json({ error: 'Invalid or expired refresh token' })

    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user || user.status !== 'ACTIVE') return res.status(401).json({ error: 'User not active' })

    // Rotate refresh token
    const newPlain = generateRefreshTokenValue()
    const newHash = hashRefreshToken(newPlain)
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: record.id },
        data: { revoked: true, revokedAt: new Date(), replacedByToken: newHash }
      }),
      prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: newHash, expiresAt: newExpiresAt }
      })
    ])

    const accessToken = generateAccessToken({ id: user.id, role: user.role, status: user.status })
    return res.json({ accessToken, refreshToken: newPlain })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
}

// Logout: revoke the provided refresh token
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })

    const tokenHash = hashRefreshToken(refreshToken)
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true, revokedAt: new Date() }
    })
    return res.json({ message: 'Logged out' })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to logout' })
  }
}

export { signUp, logIn, refresh, logout }