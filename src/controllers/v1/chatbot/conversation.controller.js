import * as conversationService from "../../../services/conversation.service.js";

// POST /api/chat/start
export async function startConversation(req, res, next) {
  try {
    const { sessionId, agentId } = req.body;

    // Validation
    if (!agentId) {
      return res.status(400).json({
        status: "error",
        message: "agentId is required",
      });
    }

    const conversation = await conversationService.startConversation(sessionId, agentId);

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/chat/conversation/:conversationId
export async function getConversation(req, res, next) {
  try {
    const { conversationId } = req.params;

    const conversation = await conversationService.getConversationById(
      conversationId
    );

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }
    next(error);
  }
}

// GET /api/chat/session/:sessionId
export async function getConversationBySession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const conversation = await conversationService.getConversationBySession(
      sessionId
    );

    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "No active conversation found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/chat/message
export async function sendMessage(req, res, next) {
  try {
    const { conversationId, role, content, tier, faqQuestionId } = req.body;

    // Validation
    if (!conversationId || !role || !content || !tier) {
      return res.status(400).json({
        status: "error",
        message: "conversationId, role, content, and tier are required",
      });
    }

    const message = await conversationService.addMessage(
      conversationId,
      role,
      content,
      tier,
      faqQuestionId
    );

    res.status(201).json({
      status: "success",
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/chat/escalate
export async function escalateTier(req, res, next) {
  try {
    const { conversationId, newTier } = req.body;

    // Validation
    if (!conversationId || !newTier) {
      return res.status(400).json({
        status: "error",
        message: "conversationId and newTier are required",
      });
    }

    if (newTier < 1 || newTier > 3) {
      return res.status(400).json({
        status: "error",
        message: "newTier must be 1, 2, or 3",
      });
    }

    const updated = await conversationService.updateTier(
      conversationId,
      newTier
    );

    res.status(200).json({
      status: "success",
      data: {
        conversation: updated,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/chat/close
export async function closeConversation(req, res, next) {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        status: "error",
        message: "conversationId is required",
      });
    }

    const closed = await conversationService.closeConversation(conversationId);

    res.status(200).json({
      status: "success",
      message: "Conversation closed successfully",
      data: {
        conversation: closed,
      },
    });
  } catch (error) {
    next(error);
  }
}
