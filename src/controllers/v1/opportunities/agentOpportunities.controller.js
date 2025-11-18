import { PrismaClient} from '@prisma/client';
const prisma = new PrismaClient();



const agentOpportunities = async(req,res) => {

    try{
        res.json({message:"These are recommended agent opportunities"})
    }
    catch(error){
        res.json({error:"Cannot fetch opportunities"})
    }

}


export {agentOpportunities}