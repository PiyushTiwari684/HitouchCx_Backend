import express from 'express';
import coreRouter from './v1/core/index.js';
import proctoringRouter from './v1/proctoring-assessment/index.js';
import chatbotRouter from './v1/chatbot/index.js';
import cronRouter from './v1/cron.routes.js';

const router = express.Router();

// Core Business Routes (Agent, Client, Opportunity, Project, etc.)
router.use('/', coreRouter);

// Proctoring & Assessment Routes
router.use('/proctoring', proctoringRouter);

// Chatbot Routes
router.use('/chatbot', chatbotRouter);

// Cron Job Routes (for external triggers)
router.use('/cron', cronRouter);

export default router;
