import dotenv from "dotenv";
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import authRouter from './src/routes/auth.js' 
import otpRouter from "./src/routes/otp.js"
import userRoute from "./src/routes/profile.js"
import express from "express";

dotenv.config();
const app = express();

//middlewares setup 

app.use(express.json());
app.use(cors());
app.use(helmet());
// use a predefined format for morgan
app.use(morgan('dev'));


// Health Check point
app.get('/',(req,res)=>{
    res.status(200).send("Hitouch backend running with supabase postgresql");
});

// Mount auth routes
app.use('/auth', authRouter);

// Mount OTP Routes
app.use("/otp",otpRouter)

//Protected Route
app.use("/user",userRoute)

export default app;
