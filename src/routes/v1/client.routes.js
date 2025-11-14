import express from 'express';
import { PrismaClient } from '@prisma/client';
import {addClient,getClientById} from "../../controllers/v1/client/client.controller.js"
const router = express.Router();


router.post("/add-client",addClient)

router.get("/:clientId/get-client",getClientById)

export default router;