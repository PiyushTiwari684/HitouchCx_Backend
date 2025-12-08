import prisma from "../config/db.js";

// Create auto-ticket from conversation (MVP 2-tier system)
export async function createAutoTicket(conversationId) {
  try {
    // Check if conversation exists and get all messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        customQuestions: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get the most recent custom question
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if ticket already exists for this conversation
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { conversationId },
    });

    if (existingTicket) {
      throw new Error("Support ticket already exists for this conversation");
    }

    // Auto-generate issue description from conversation
    // Get the last user question (most likely the issue)
    const userMessages = conversation.messages.filter(msg => msg.role === "user");
    const lastUserQuestion = userMessages[userMessages.length - 1]?.content || "No question provided";

    // Get full conversation history for context
    const conversationHistory = conversation.messages
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const issueDescription = `Auto-generated ticket from AI conversation:

Last Question: ${lastUserQuestion}

Full Conversation:
${conversationHistory}

Reason: User was not satisfied with AI response.`;

    // Create support ticket (category defaults to "AI Unresolved" from schema)
    const ticket = await prisma.supportTicket.create({
      data: {
        conversationId,
        issueDescription,
        status: "open",
        priority: "normal",
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    // Mark conversation as closed (stays at Tier 2, doesn't escalate to Tier 3)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isClosed: true,
        closedAt: new Date(),
      },
    });

    return ticket;
  } catch (error) {
    throw error;
  }
}

// Create a support ticket (escalation to human)
export async function createSupportTicket(
  conversationId,
  issueDescription,
  category,
  priority = "normal"
) {
  try {
    // Check if conversation exists
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

    // Check if ticket already exists for this conversation
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { conversationId },
    });

    if (existingTicket) {
      throw new Error("Support ticket already exists for this conversation");
    }

    // Note: This function is for manual ticket creation (kept for backwards compatibility)
    // For MVP, we use createAutoTicket() instead which doesn't escalate to Tier 3

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        conversationId,
        issueDescription,
        category,
        priority,
        status: "open",
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    return ticket;
  } catch (error) {
    throw error;
  }
}

// Get all support tickets (with filters)
export async function getSupportTickets(filters = {}) {
  try {
    const { status, priority, category, assignedTo } = filters;

    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            sessionId: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" }, // High priority first
        { createdAt: "desc" }, // Newest first
      ],
    });

    return tickets;
  } catch (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }
}

// Get single ticket by ID
export async function getTicketById(ticketId) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    return ticket;
  } catch (error) {
    throw error;
  }
}

// Assign ticket to support team member
export async function assignTicket(ticketId, assignedTo) {
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo,
        status: "in_progress", // Auto-change status when assigned
      },
    });

    return ticket;
  } catch (error) {
    throw new Error(`Failed to assign ticket: ${error.message}`);
  }
}

// Update ticket status
export async function updateTicketStatus(ticketId, status) {
  try {
    const validStatuses = ["open", "in_progress", "resolved"];

    if (!validStatuses.includes(status)) {
      throw new Error(
        "Invalid status. Must be: open, in_progress, or resolved"
      );
    }

    const updateData = { status };

    // If resolving, set resolvedAt timestamp
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return ticket;
  } catch (error) {
    throw error;
  }
}

// Update ticket priority
export async function updateTicketPriority(ticketId, priority) {
  try {
    const validPriorities = ["low", "normal", "high"];

    if (!validPriorities.includes(priority)) {
      throw new Error("Invalid priority. Must be: low, normal, or high");
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { priority },
    });

    return ticket;
  } catch (error) {
    throw error;
  }
}

// Add resolution notes to ticket
export async function addResolutionNotes(ticketId, resolutionNotes) {
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        resolutionNotes,
        status: "resolved",
        resolvedAt: new Date(),
      },
    });

    // Also close the conversation
    await prisma.conversation.update({
      where: { id: ticket.conversationId },
      data: {
        isResolved: true,
        isClosed: true,
        closedAt: new Date(),
      },
    });

    return ticket;
  } catch (error) {
    throw new Error(`Failed to add resolution notes: ${error.message}`);
  }
}

// Get ticket statistics
export async function getTicketStats() {
  try {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "open" } }),
      prisma.supportTicket.count({ where: { status: "in_progress" } }),
      prisma.supportTicket.count({ where: { status: "resolved" } }),
    ]);

    // Average resolution time (for resolved tickets)
    const resolvedTickets = await prisma.supportTicket.findMany({
      where: {
        status: "resolved",
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = null;

    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const timeMs = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        return sum + timeMs;
      }, 0);

      avgResolutionTime = Math.round(
        totalTime / resolvedTickets.length / 1000 / 60
      ); // Minutes
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      avgResolutionTimeMinutes: avgResolutionTime,
    };
  } catch (error) {
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }
}
