import express from 'express';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import * as digilockerController from '../../../controllers/v1/kyc/digilocker.controller.js';

const router = express.Router();

router.post(
  '/digilocker/generate-link',
  authMiddleware,
  digilockerController.generateDigiLockerLink
);


router.get(
  '/digilocker/callback',
  digilockerController.digilockerCallback
);

router.get(
  '/status',
  authMiddleware,
  digilockerController.getKYCStatus
);


router.get(
  '/documents',
  authMiddleware,
  digilockerController.getDocuments
);

router.get(
  '/validation-status',
  authMiddleware,
  digilockerController.getKYCValidationStatus
);

/**
 * @route   POST /api/v1/kyc/retry
 * 
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
