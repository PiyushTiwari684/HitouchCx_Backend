import express from 'express';
import {addOpportunity} from "../../../controllers/v1/opportunities/addOpportunity.controller.js"
import {gigApplication} from "../../../controllers/v1/opportunities/application.controller.js"
import {agentOpportunities} from "../../../controllers/v1/opportunities/agentOpportunities.controller.js"


const router = express.Router();

//Adding an opportunity
router.post("/add-opportunity",addOpportunity)


//Getting opportunities based on agent's profile 
router.get("/agent-opportunities",agentOpportunities)

//When agent applies for an opportunity
router.post("/apply-opportunity",gigApplication)


export default router;