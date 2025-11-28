import express from "express";
import * as conversationController from "../../../controllers/v1/chatbot/conversation.controller.js";

const router = express.Router();

// POST /api/chat/start - Start new conversation
router.post("/start", conversationController.startConversation);

// GET /api/chat/conversation/:conversationId - Get conversation by ID
router.get(
  "/conversation/:conversationId",
  conversationController.getConversation
);

// GET /api/chat/session/:sessionId - Get conversation by session ID
router.get(
  "/session/:sessionId",
  conversationController.getConversationBySession
);

// POST /api/chat/message - Send a message
router.post("/message", conversationController.sendMessage);

// PUT /api/chat/escalate - Escalate to next tier
router.put("/escalate", conversationController.escalateTier);

// POST /api/chat/close - Close conversation
router.post("/close", conversationController.closeConversation);

export default router;
