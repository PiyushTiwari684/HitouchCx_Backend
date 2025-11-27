import express from 'express';
import coreRouter from './v1/core/index.js';
import proctoringRouter from './v1/proctoring-assessment/index.js';

const router = express.Router();

// Core Business Routes (Agent, Client, Opportunity, Project, etc.)
// Mounted at: /api/v1/*
router.use('/api/v1', coreRouter);

// Proctoring & Assessment Routes
// Mounted at: /api/v1/proctoring/*
router.use('/api/v1/proctoring', proctoringRouter);

export default router;
