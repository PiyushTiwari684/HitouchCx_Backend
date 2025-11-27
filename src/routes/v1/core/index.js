import express from 'express';
import authRouter from './auth.routes.js';
import otpRouter from './otp.routes.js';
import userRoute from './profile.routes.js';
import agentRouter from './agent.routes.js';
import platformRouter from './platform.routes.js';
import clientRouter from './client.routes.js';
import opportunityRouter from './opportunity.routes.js';
import projectRouter from './project.routes.js';

const router = express.Router();

// Authentication Routes
// Final path: /api/v1/auth/*
router.use('/auth', authRouter);

// OTP Routes
// Final path: /api/v1/otp/*
router.use('/otp', otpRouter);

// Agent Routes
// Final path: /api/v1/agent/*
router.use('/agent', agentRouter);

// Platform Routes
// Final path: /api/v1/platform/*
router.use('/platform', platformRouter);

// Client Routes
// Final path: /api/v1/client/*
router.use('/client', clientRouter);

// Project Routes
// Final path: /api/v1/project/*
router.use('/project', projectRouter);

// Opportunity Routes
// Final path: /api/v1/opportunity/*
router.use('/opportunity', opportunityRouter);

// Protected User Routes
// Final path: /api/v1/user/*
router.use('/user', userRoute);


export default router;
