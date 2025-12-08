import * as supportTicketService from "../../../services/supportTicket.service.js";

// POST /api/support/auto-create (MVP 2-tier system)
export async function createAutoTicket(req, res, next) {
  try {
    const { conversationId } = req.body;

    // Validation
    if (!conversationId) {
      return res.status(400).json({
        status: "error",
        message: "conversationId is required",
      });
    }

    const ticket = await supportTicketService.createAutoTicket(conversationId);

    res.status(201).json({
      status: "success",
      message: "Support ticket created successfully. Our team will review your issue.",
      data: {
        ticket,
      },
    });
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }
    if (
      error.message === "Support ticket already exists for this conversation"
    ) {
      return res.status(409).json({
        status: "error",
        message: "Support ticket already exists for this conversation",
      });
    }
    next(error);
  }
}

// POST /api/support/create
export async function createTicket(req, res, next) {
  try {
    const { conversationId, issueDescription, category, priority } = req.body;

    // Validation
    if (!conversationId || !issueDescription || !category) {
      return res.status(400).json({
        status: "error",
        message: "conversationId, issueDescription, and category are required",
      });
    }

    const ticket = await supportTicketService.createSupportTicket(
      conversationId,
      issueDescription,
      category,
      priority
    );

    res.status(201).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }
    if (
      error.message === "Support ticket already exists for this conversation"
    ) {
      return res.status(409).json({
        status: "error",
        message: "Support ticket already exists for this conversation",
      });
    }
    next(error);
  }
}

// GET /api/support/tickets
export async function getTickets(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      assignedTo: req.query.assignedTo,
    };

    const tickets = await supportTicketService.getSupportTickets(filters);

    res.status(200).json({
      status: "success",
      data: {
        tickets,
        count: tickets.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/support/ticket/:ticketId
export async function getTicket(req, res, next) {
  try {
    const { ticketId } = req.params;

    const ticket = await supportTicketService.getTicketById(ticketId);

    res.status(200).json({
      status: "success",
      data: {
        ticket,
      },
    });
  } catch (error) {
    if (error.message === "Ticket not found") {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }
    next(error);
  }
}

// PUT /api/support/assign
export async function assignTicket(req, res, next) {
  try {
    const { ticketId, assignedTo } = req.body;

    // Validation
    if (!ticketId || !assignedTo) {
      return res.status(400).json({
        status: "error",
        message: "ticketId and assignedTo are required",
      });
    }

    const ticket = await supportTicketService.assignTicket(
      ticketId,
      assignedTo
    );

    res.status(200).json({
      status: "success",
      message: "Ticket assigned successfully",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/support/status
export async function updateStatus(req, res, next) {
  try {
    const { ticketId, status } = req.body;

    // Validation
    if (!ticketId || !status) {
      return res.status(400).json({
        status: "error",
        message: "ticketId and status are required",
      });
    }

    const ticket = await supportTicketService.updateTicketStatus(
      ticketId,
      status
    );

    res.status(200).json({
      status: "success",
      message: "Ticket status updated successfully",
      data: {
        ticket,
      },
    });
  } catch (error) {
    if (error.message.includes("Invalid status")) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
    next(error);
  }
}

// PUT /api/support/priority
export async function updatePriority(req, res, next) {
  try {
    const { ticketId, priority } = req.body;

    // Validation
    if (!ticketId || !priority) {
      return res.status(400).json({
        status: "error",
        message: "ticketId and priority are required",
      });
    }

    const ticket = await supportTicketService.updateTicketPriority(
      ticketId,
      priority
    );

    res.status(200).json({
      status: "success",
      message: "Ticket priority updated successfully",
      data: {
        ticket,
      },
    });
  } catch (error) {
    if (error.message.includes("Invalid priority")) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
    next(error);
  }
}

// PUT /api/support/resolve
export async function resolveTicket(req, res, next) {
  try {
    const { ticketId, resolutionNotes } = req.body;

    // Validation
    if (!ticketId || !resolutionNotes) {
      return res.status(400).json({
        status: "error",
        message: "ticketId and resolutionNotes are required",
      });
    }

    const ticket = await supportTicketService.addResolutionNotes(
      ticketId,
      resolutionNotes
    );

    res.status(200).json({
      status: "success",
      message: "Ticket resolved successfully",
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/support/stats
export async function getStats(req, res, next) {
  try {
    const stats = await supportTicketService.getTicketStats();

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
}
