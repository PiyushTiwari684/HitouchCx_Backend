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


dotenv.config();
const app = express();

//middlewares setup 

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(passport.initialize());


// Health Check point
app.get('/',(req,res)=>{
    res.status(200).send("reboo8 backend running with supabase postgresql");
});

// Mount auth routes
app.use('/api/v1/auth', authRouter);

// Mount OTP Routes
app.use("/api/v1/otp",otpRouter)

//Mount Agents Routes
app.use("/api/v1/agent",agentRouter)

//Mount Platform Specific Routes
app.use("/api/v1/platform",platformRouter)

//Mount Client Specific Routes
app.use("/api/v1/client",clientRouter)

//Mount Client's Project Routes
app.use("/api/v1/project",projectRouter)

//Mount Opportuntiy Specific Routes
app.use("/api/v1/opportunity",opportunityRouter)


//Protected Route
app.use("/user",userRoute)

export default app;
