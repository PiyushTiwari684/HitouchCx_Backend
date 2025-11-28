import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Start a new conversation
export async function startConversation(sessionId, agentId) {
  try {
    // Check if there's an active conversation for this session
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        sessionId: sessionId,
        isClosed: false,
      },
    });

    // If active conversation exists, return it
    if (existingConversation) {
      // Update last activity
      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { lastActivityAt: new Date() },
      });

      return existingConversation;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        sessionId: sessionId || uuidv4(), // Generate if not provided
        agentId: agentId, // Required field - agent who started the conversation
        currentTier: 1, // Start at Tier 1 (FAQ)
        lastActivityAt: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to start conversation: ${error.message}`);
  }
}

// Get conversation by ID with all messages
export async function getConversationById(conversationId) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  } catch (error) {
    throw error;
  }
}

// Get conversation by session ID
export async function getConversationBySession(sessionId) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        sessionId: sessionId,
        isClosed: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return conversation; // Can be null if no active conversation
  } catch (error) {
    throw new Error(`Failed to fetch conversation: ${error.message}`);
  }
}

// Add a message to conversation
export async function addMessage(
  conversationId,
  role,
  content,
  tier,
  faqQuestionId = null
) {
  try {
    // Update conversation last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() },
    });

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role, // "user" or "assistant"
        content,
        tier,
        faqQuestionId,
      },
    });

    return message;
  } catch (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }
}

// Update conversation tier (escalation)
export async function updateTier(conversationId, newTier) {
  try {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        currentTier: newTier,
        lastActivityAt: new Date(),
      },
    });

    return updated;
  } catch (error) {
    throw new Error(`Failed to update tier: ${error.message}`);
  }
}

// Close conversation
export async function closeConversation(conversationId) {
  try {
    const closed = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isClosed: true,
        isResolved: true,
        closedAt: new Date(),
      },
    });

    return closed;
  } catch (error) {
    throw new Error(`Failed to close conversation: ${error.message}`);
  }
}

// Check and expire old conversations (session timeout)
export async function expireOldSessions(timeoutMinutes = 180) {
  try {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const expired = await prisma.conversation.updateMany({
      where: {
        isClosed: false,
        lastActivityAt: {
          lt: cutoffTime,
        },
      },
      data: {
        isClosed: true,
        closedAt: new Date(),
      },
    });

    return expired.count;
  } catch (error) {
    throw new Error(`Failed to expire sessions: ${error.message}`);
  }
}
