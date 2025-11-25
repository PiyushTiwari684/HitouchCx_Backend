import dotenv from "dotenv";
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import authRouter from './src/routes/v1/core/auth.routes.js' 
import otpRouter from "./src/routes/v1/core/otp.routes.js"
import userRoute from "./src/routes/v1/core/profile.routes.js"
import agentRouter from "./src/routes/v1/core/agent.routes.js"
import platformRouter from "./src/routes/v1/core/platform.routes.js"
import clientRouter from "./src/routes/v1/core/client.routes.js"
import opportunityRouter from "./src/routes/v1/core/opportunity.routes.js"
import projectRouter from "./src/routes/v1/core/project.routes.js"

import express from "express";
import passport from './src/config/passport.js'; 
const router = express.Router();


dotenv.config();
const app = express();

//middlewares setup 

router.use(express.json());
router.use(cors());
router.use(helmet());
router.use(morgan('dev'));
router.use(passport.initialize());


// Health Check point
router.get('/',(req,res)=>{
    res.status(200).send("reboo8 backend running with supabase postgresql");
});

// Mount auth routes
router.use('/api/v1/auth', authRouter);

// Mount OTP Routes
router.use("/api/v1/otp",otpRouter)

//Mount Agents Routes
router.use("/api/v1/agent",agentRouter)

//Mount Platform Specific Routes
router.use("/api/v1/platform",platformRouter)

//Mount Client Specific Routes
router.use("/api/v1/client",clientRouter)

//Mount Client's Project Routes
router.use("/api/v1/project",projectRouter)

//Mount Opportuntiy Specific Routes
router.use("/api/v1/opportunity",opportunityRouter)


//Protected Route
router.use("/user",userRoute)

export default router;
