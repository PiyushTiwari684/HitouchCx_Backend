import express from 'express';
import { PrismaClient } from '@prisma/client';
import {addOpportunity} from "../../controllers/v1/opportunities/addOpportunity.controller.js"
import {gigApplication} from "../../controllers/v1/opportunities/application.controller.js"

const router = express.Router();

//Adding an opportunity
router.post("/add-opportunity",addOpportunity)


//When agent applies for an opportunity
router.post("/apply-opportunity",gigApplication)

//When agent's application is accepted and he passes the assesment


export default router;