// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import agentRoutes from "./src/routes/agent.routes.js";
import { errorMiddleware } from "./src/middlewares/errror.middlewares.js";
import ApiResponse from "./src/utils/ApiResponse.js";

// Load environment variables
dotenv.config();

const app = express();

//Core middlewares
app.use(cors()); // Allow frontend access
app.use(express.json()); // Parse JSON requests
app.use(morgan("dev")); // Log requests in console

//Health Check route
app.get("/", (req, res) => {
  res.status(200).send("HiTouch backend running with Supabase PostgreSQL");
});

// Main Routes
app.use("/api/v1/agent", agentRoutes); //Agent resume + profile routes

//Catch-all route (for unknown endpoints)
app.use((req, res) => {
  res.status(404).json(new ApiResponse(404, null, "Route not found"));
});

//Centralized Error Handler
app.use(errorMiddleware);

export default app;

// http://localhost:3001/api/v1/agent/resume-upload
