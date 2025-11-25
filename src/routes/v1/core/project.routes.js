import express from 'express';
import {addProject} from "../../../controllers/v1/projects/addProject.controller.js"

const router = express.Router();


router.post("/add-project",addProject)

export default router;