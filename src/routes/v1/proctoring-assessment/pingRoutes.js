import express from "express";
import  {ping} from "../controllers/pingController.js";

const router = express.Router();

router.get("/",ping);

export default router;
