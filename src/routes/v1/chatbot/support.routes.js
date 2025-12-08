import express from "express";
import * as supportTicketController from "../../../controllers/v1/chatbot/supportTicket.controller.js";

const router = express.Router();

// POST /api/support/auto-create - Auto-create ticket from conversation (MVP 2-tier)
router.post("/auto-create", supportTicketController.createAutoTicket);

// POST /api/support/create - Create a support ticket (manual - for backwards compatibility)
router.post("/create", supportTicketController.createTicket);

// GET /api/support/tickets - Get all tickets (with optional filters)
router.get("/tickets", supportTicketController.getTickets);

// GET /api/support/ticket/:ticketId - Get single ticket
router.get("/ticket/:ticketId", supportTicketController.getTicket);

// PUT /api/support/assign - Assign ticket to support member
router.put("/assign", supportTicketController.assignTicket);

// PUT /api/support/status - Update ticket status
router.put("/status", supportTicketController.updateStatus);

// PUT /api/support/priority - Update ticket priority
router.put("/priority", supportTicketController.updatePriority);

// PUT /api/support/resolve - Resolve ticket with notes
router.put("/resolve", supportTicketController.resolveTicket);

// GET /api/support/stats - Get ticket statistics
router.get("/stats", supportTicketController.getStats);

export default router;
