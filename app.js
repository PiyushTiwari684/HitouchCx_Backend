
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import express from "express";


const app = express();

//middlewares setup 

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan());


// Health Check point
app.get('/',(req,res)=>{
    res.status(200).send("Hitouch backend running with supabase postgresql");
});


export default app;
