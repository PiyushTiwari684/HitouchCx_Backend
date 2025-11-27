import express from 'express';
import coreRouter from './v1/core/index.js';
import proctoringRouter from './v1/proctoring-assessment/index.js';

const router = express.Router();

// Core Business Routes (Agent, Client, Opportunity, Project, etc.)

router.use('/', coreRouter);

// Proctoring & Assessment Routes

router.use('/proctoring', proctoringRouter);

export default router;
