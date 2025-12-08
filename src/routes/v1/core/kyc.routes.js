/**
 * KYC Routes
 *
 * API routes for KYC (Know Your Customer) verification via DigiLocker.
 * All routes under /api/v1/kyc
 *
 * @module routes/v1/core/kyc
 */

import express from 'express';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import * as digilockerController from '../../../controllers/v1/kyc/digilocker.controller.js';

const router = express.Router();

/**
 * DigiLocker KYC Routes
 * All routes under /api/v1/kyc/digilocker
 */

/**
 * @route   POST /api/v1/kyc/digilocker/generate-link
 * @desc    Generate DigiLocker OAuth authentication link
 * @access  Protected (requires JWT)
 * @body    { consent: "Y" }
 */
router.post(
  '/digilocker/generate-link',
  authMiddleware,
  digilockerController.generateDigiLockerLink
);

/**
 * @route   GET /api/v1/kyc/digilocker/callback
 * @desc    DigiLocker OAuth callback handler
 * @access  Public (called by DigiLocker)
 * @query   { code: string, state: string }
 * @note    This route is called by DigiLocker after user authentication
 */
router.get(
  '/digilocker/callback',
  digilockerController.digilockerCallback
);

/**
 * General KYC Routes
 * All routes under /api/v1/kyc
 */

/**
 * @route   GET /api/v1/kyc/status
 * @desc    Get current KYC verification status
 * @access  Protected (requires JWT)
 * @returns { kycStatus, kycCompleted, latestSession, documents }
 */
router.get(
  '/status',
  authMiddleware,
  digilockerController.getKYCStatus
);

/**
 * @route   GET /api/v1/kyc/documents
 * @desc    Get detailed KYC document information
 * @access  Protected (requires JWT)
 * @returns { aadhaar, pan }
 */
router.get(
  '/documents',
  authMiddleware,
  digilockerController.getDocuments
);

/**
 * @route   POST /api/v1/kyc/retry
 * @desc    Retry KYC verification (generates new link)
 * @access  Protected (requires JWT)
 * @body    { consent: "Y" }
 */
router.post(
  '/retry',
  authMiddleware,
  digilockerController.retryKYCVerification
);

export default router;
