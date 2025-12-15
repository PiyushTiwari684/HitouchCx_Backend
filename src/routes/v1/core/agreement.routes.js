/**
 * Agreement Routes
 *
 * Routes for agreement management
 */

import express from 'express'
import authMiddleware from '../../../middlewares/authMiddleware.js'
import { getPreview, acceptAgreements, getStatus } from '../../../controllers/v1/agreement/agreement.controller.js'

const router = express.Router()

/**
 * GET /api/v1/agreement/preview
 * Get personalized agreement preview
 * Requires: JWT authentication
 */
router.get('/preview', authMiddleware, getPreview)

/**
 * POST /api/v1/agreement/accept
 * Accept and sign agreements
 * Requires: JWT authentication
 */
router.post('/accept', authMiddleware, acceptAgreements)

/**
 * GET /api/v1/agreement/status
 * Check if user has signed agreements
 * Requires: JWT authentication
 */
router.get('/status', authMiddleware, getStatus)

export default router
