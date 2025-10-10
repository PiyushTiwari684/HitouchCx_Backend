import express from "express"
import authMiddleware, { requireRole } from "../middleware/auth.js"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get("/profile",authMiddleware, requireRole('AGENT'), async(req,res)=>{
    try{
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.json({message:"This is your profile",user})
    }
    catch(error){
        console.log("Error Occured",error)
    }
    

})



export default router;  
