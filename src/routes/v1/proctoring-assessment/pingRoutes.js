import express from "express";
import  {ping} from "../../../controllers/v1/proctoring-assessment/pingController.js";

const router = express.Router();

router.get("/",ping);

export default router;
