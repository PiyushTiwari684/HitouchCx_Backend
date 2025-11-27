import express from 'express';
import systemCheckRoutes from './systemCheckRoutes.js';
import identityVerificationRoutes from './identityVerificationRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import instructionRoutes from './instructionRoutes.js';
import pingRoutes from './pingRoutes.js';

const router = express.Router();

// Instructions & Device Validation
// Final path: /api/v1/proctoring/instructions/*
router.use('/instructions', instructionRoutes);

// System Check Routes (Permissions & Device Info)
// Final path: /api/v1/proctoring/system-check/*
router.use('/system-check', systemCheckRoutes);

// Identity Verification Routes (Face & Voice)
// Final path: /api/v1/proctoring/identity-verification/*
router.use('/identity-verification', identityVerificationRoutes);

// Assessment Routes (Questions & Answers)
// Final path: /api/v1/proctoring/assessment/*
router.use('/assessment', assessmentRoutes);

// Health Check / Ping Routes
// Final path: /api/v1/proctoring/ping
router.use('/ping', pingRoutes);


export default router;
