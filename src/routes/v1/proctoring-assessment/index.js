import express from "express";

const router = express.Router();

// Test endpoints
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working correctly",
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    },
  });
});

router.get("/test-error", (req, res, next) => {
  const error = new Error("This is a test error");
  error.statusCode = 400;
  next(error);
});

router.get("/test-async-error", async (req, res) => {
  throw new Error("This is a test async error");
});

// Import route modules
import systemCheckRoutes from "./systemCheckRoutes.js";
import authRoutes from "./authRoutes.js";
import pingRoutes from "./pingRoutes.js";
import VerificationRoutes from "./identityVerificationRoutes.js"
import instructionRoutes from "./instructionRoutes.js";
import assessmentRoutes from "./assessmentRoutes.js";



// Mount routes
router.use("/system-checks", systemCheckRoutes);
router.use("/auth", authRoutes);
router.use("/ping", pingRoutes);
router.use("/instructions", instructionRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/identity-verification", VerificationRoutes);


// Future routes will be mounted here:

export default router;
