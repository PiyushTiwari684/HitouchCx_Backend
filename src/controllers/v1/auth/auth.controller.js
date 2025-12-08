import prisma from "../../../config/db.js";
import { generateToken, verifyToken } from "../../../utils/token.js";
import validator from "validator";
import bcrypt from "bcrypt";
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
      return res.status(400).json({ error: "Enter All required fields." });
    }
     
    //Validation all the credentials
    function validateCreds(email, phone, password) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "Invalid email address." });
      }

      if (!validator.isMobilePhone(phone)) {
        return res.status(400).json({ error: "Invalid phone number." });
      }

      if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ error: "Password is not strong enough" });
      }
    }
    validateCreds(email, phone, password);
  
    //Creating Hash Password and updating fields
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const user = await prisma.user.update({
      where: { email, emailVerified: true, phoneVerified: true },
      data: { passwordHash: hashedPassword, status: "ACTIVE", createdAt: now },
    });

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
    console.log(user.status);
    if (user && user.status == "ACTIVE") {
      const token = generateToken({ id: user.id, role: user.role, status: user.status });
      return res.json({ message: "User added successfully and is 'Active'", token: token });
    } else {
      return res.json({ error: "Prisma failed to return the user info" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error Occured while Sign Up", error: err.message });
  }
};

//Log In Controller
const logIn = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: "Enter all fields" });
    }

    //Checking User Credentials function
    async function authenticate(user) {
      if (user) {
        const valid = await bcrypt.compare(password, user.passwordHash);

        if (valid && user.status == "ACTIVE") {
          // Generate JWT token
          const token = generateToken({ id: user.id, role: user.role, status: user.status });

          // Fetch Agent data (for KYC status)
          const agent = await prisma.agent.findUnique({
            where: { userId: user.id }
          });

          // Fetch Candidate data (linked to Agent)
          let assessment = null;
          if (agent) {
            const candidate = await prisma.candidate.findFirst({
              where: { agentId: agent.id }
            });

            // Fetch latest CandidateAssessment (for assessment status)
            if (candidate) {
              assessment = await prisma.candidateAssessment.findFirst({
                where: { candidateId: candidate.id },
                orderBy: { createdAt: 'desc' } // Get most recent assessment
              });
            }
          }

          // Calculate next step using our helper function
          const nextStep = calculateNextStep(user, agent, assessment);

          // Get assessment status summary
          const assessmentStatus = getAssessmentStatusSummary(assessment);

          // Build registration status object
          const registrationStatus = {
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            profileCompleted: user.profileCompleted,
            kycStatus: agent?.kycStatus || 'PENDING',
            assessmentStatus: assessmentStatus,
            agreementSigned: user.agreementSigned,
            nextStep: nextStep
          };

          // Return token + user object with registration status
          return res.json({
            message: "User Authenticated",
            token: token,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              role: user.role,
              status: user.status,
              registrationStatus: registrationStatus
            }
          });
        } else {
          return res.json({ error: "Error in Token/Status" });
        }
      }
    }

    if (email && validator.isEmail(email)) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      await authenticate(user);
    } else if (phone && validator.isMobilePhone(phone)) {
      const user = await prisma.user.findUnique({
        where: { phone },
      });
      await authenticate(user);
    }
  } catch (error) {
    res.status(500).json({ error: "User failed to login.", error });
  }
};

export { signUp, logIn };
