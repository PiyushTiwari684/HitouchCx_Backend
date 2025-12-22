import express from 'express';
import { manualEmailRetry } from '../../jobs/emailRetry.job.js';

const router = express.Router();

/**
 * POST /api/v1/cron/email-retry
 * Manually trigger email retry job (for external cron services like UptimeRobot)
 * Requires Authorization header with CRON_SECRET
 */
router.post('/email-retry', async (req, res) => {
  try {
    // Verify secret token
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      console.warn('⚠️ Unauthorized cron attempt from IP:', req.ip);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or missing authorization token'
      });
    }

    console.log('✅ Cron job triggered externally');

    // Execute email retry job
    await manualEmailRetry();

    return res.status(200).json({
      success: true,
      message: 'Email retry job executed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job execution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute cron job',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/cron/health
 * Health check endpoint for cron monitoring
 * No authentication required (used by monitoring services)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cron endpoints are healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
