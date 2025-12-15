/**
 * Agreement Controller
 *
 * Handles HTTP requests for agreement management:
 * - GET /api/v1/agreement/preview - Get personalized agreement preview
 * - POST /api/v1/agreement/accept - Accept and sign agreements
 */

import {
  getAgreementPreview,
  processAgreementAcceptance,
  hasUserSignedAgreements,
} from '../../../services/agreement.service.js'

/**
 * GET /api/v1/agreement/preview
 * Get personalized agreement preview for authenticated user
 */
export async function getPreview(req, res) {
  try {
    const userId = req.user.id // Set by authMiddleware

    console.log(`📄 Fetching agreement preview for user: ${userId}`)

    // Check if already signed
    const alreadySigned = await hasUserSignedAgreements(userId)
    if (alreadySigned) {
      return res.status(400).json({
        success: false,
        error: 'Agreements already signed',
        message: 'You have already accepted the agreements',
      })
    }

    // Get personalized preview
    const result = await getAgreementPreview(userId)

    return res.status(200).json({
      success: true,
      message: 'Agreement preview fetched successfully',
      data: result.data,
    })
  } catch (error) {
    console.error('Error in getPreview controller:', error)

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      })
    }

    if (error.message === 'Agent profile not found') {
      return res.status(400).json({
        success: false,
        error: 'Profile incomplete',
        message: 'Please complete your agent profile before viewing agreements',
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch agreement preview',
    })
  }
}

/**
 * POST /api/v1/agreement/accept
 * Accept and sign agreements
 */
export async function acceptAgreements(req, res) {
  try {
    const userId = req.user.id // Set by authMiddleware

    // Capture IP address
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      null

    // Capture User-Agent
    const userAgent = req.headers['user-agent'] || null

    // Capture session ID if available (optional)
    const sessionId = req.session?.id || req.headers['x-session-id'] || null

    console.log(`📝 Processing agreement acceptance for user: ${userId}`)
    console.log(`📍 IP Address: ${ipAddress}`)
    console.log(`🖥️ User Agent: ${userAgent}`)

    // Process agreement acceptance
    const result = await processAgreementAcceptance({
      userId,
      ipAddress,
      userAgent,
      sessionId,
    })

    return res.status(200).json({
      success: true,
      message: 'Agreements accepted successfully. Email will be sent shortly.',
      data: {
        agreementIds: result.agreementIds,
      },
    })
  } catch (error) {
    console.error('Error in acceptAgreements controller:', error)

    if (error.message === 'Agreements already signed') {
      return res.status(400).json({
        success: false,
        error: 'Already signed',
        message: 'You have already accepted the agreements',
      })
    }

    if (error.message === 'User or agent profile not found') {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'User or agent profile not found. Please complete your profile first.',
      })
    }

    // For PDF generation or upload failures
    if (error.message.includes('PDF generation failed')) {
      return res.status(500).json({
        success: false,
        error: 'PDF generation error',
        message: 'Failed to generate agreement documents. Please try again.',
      })
    }

    if (error.message.includes('Cloudinary') || error.message.includes('upload')) {
      return res.status(500).json({
        success: false,
        error: 'Upload error',
        message: 'Failed to upload agreement documents. Please try again.',
      })
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process agreement acceptance. Please try again.',
    })
  }
}

/**
 * GET /api/v1/agreement/status
 * Check agreement status for authenticated user
 */
export async function getStatus(req, res) {
  try {
    const userId = req.user.id

    const alreadySigned = await hasUserSignedAgreements(userId)

    return res.status(200).json({
      success: true,
      data: {
        agreementSigned: alreadySigned,
      },
    })
  } catch (error) {
    console.error('Error in getStatus controller:', error)

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check agreement status',
    })
  }
}
