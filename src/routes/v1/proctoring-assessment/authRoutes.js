import express from "express";
import { login, register } from "../controllers/authControllers.js";

const router = express.Router();

// POST /api/v1/auth/register - Register test candidate
router.post("/register", register);

// POST /api/v1/auth/login - Login and get JWT token
router.post("/login", login);

export default router;
