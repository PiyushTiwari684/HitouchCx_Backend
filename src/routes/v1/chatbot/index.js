import express from "express";
import faqRoutes from "./faq.routes.js";
import conversationRoutes from "./conversation.routes.js";
import airoutes from "./ai.routes.js";
import supportRoutes from "./support.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = express.Router();

// Mount routes
router.use("/faq", faqRoutes);
router.use("/chat", conversationRoutes);
router.use("/ai", airoutes);
router.use("/support",supportRoutes);
router.use("/analytics", analyticsRoutes);

// API health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
