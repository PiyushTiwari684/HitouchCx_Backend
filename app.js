import dotenv from "dotenv";
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import authRouter from './src/routes/v1/auth.routes.js' 
import otpRouter from "./src/routes/v1/otp.routes.js"
import userRoute from "./src/routes/v1/profile.routes.js"
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
    res.status(200).send("Hitouch backend running with supabase postgresql");
});

// Mount auth routes
app.use('/api/v1/auth', authRouter);

// Mount OTP Routes
app.use("/api/v1/otp",otpRouter)

//Protected Route
app.use("/user",userRoute)

export default app;
