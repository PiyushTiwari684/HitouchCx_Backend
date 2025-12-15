/**
 * Email Retry Job
 *
 * This cron job runs periodically to retry sending failed agreement emails.
 * It checks for PENDING emails and retries them based on retry count.
 *
 * Usage:
 * - Import this file in your server.js or a separate cron scheduler
 * - Call startEmailRetryJob() to begin the scheduled job
 * - Job runs every 5 minutes by default
 */

import cron from 'node-cron'
import { getPendingEmailAgreements } from '../services/agreement.service.js'
import { sendAgreementEmail } from '../services/email.service.js'
import { sendAgreementEmailFailureAlert } from '../services/notification.service.js'
import prisma from '../config/db.js'
import { formatDateDDMMYYYY } from '../utils/agreementHelpers.js'

const MAX_RETRIES = 3
const RETRY_INTERVALS = {
  1: 5 * 60 * 1000, // 5 minutes in milliseconds
  2: 15 * 60 * 1000, // 15 minutes in milliseconds
}

/**
 * Process pending agreement emails
 */
async function processPendingEmails() {
  try {
    console.log('🔄 [Email Retry Job] Starting email retry process...')

    const pendingAgreements = await getPendingEmailAgreements()

    if (pendingAgreements.length === 0) {
      console.log('✅ [Email Retry Job] No pending emails to process')
      return
    }

    console.log(`📧 [Email Retry Job] Found ${pendingAgreements.length} pending agreements`)

    // Group agreements by user (NDA + MSA should be sent together)
    const groupedByUser = {}

    pendingAgreements.forEach((agreement) => {
      const userEmail = agreement.agent.user.email
      if (!groupedByUser[userEmail]) {
        groupedByUser[userEmail] = {
          nda: null,
          msa: null,
          userData: {
            email: userEmail,
            agentId: agreement.agentId,
          },
        }
      }

      if (agreement.documentType === 'NDA') {
        groupedByUser[userEmail].nda = agreement
      } else if (agreement.documentType === 'MSA') {
        groupedByUser[userEmail].msa = agreement
      }
    })

    // Process each user's agreements
    for (const [userEmail, data] of Object.entries(groupedByUser)) {
      // Only proceed if both NDA and MSA are pending
      if (!data.nda || !data.msa) {
        console.log(`⚠️ [Email Retry Job] Incomplete agreements for ${userEmail}, skipping`)
        continue
      }

      const nda = data.nda
      const msa = data.msa

      // Check if enough time has passed since last retry
      const currentRetryCount = nda.emailRetryCount
      const timeSinceLastRetry = nda.lastRetryAt
        ? Date.now() - new Date(nda.lastRetryAt).getTime()
        : Infinity

      const requiredInterval = RETRY_INTERVALS[currentRetryCount] || 0

      if (timeSinceLastRetry < requiredInterval) {
        console.log(
          `⏳ [Email Retry Job] Not enough time passed for ${userEmail}, skipping (${Math.floor(timeSinceLastRetry / 1000)}s / ${requiredInterval / 1000}s)`
        )
        continue
      }

      // Attempt to send email
      console.log(
        `📤 [Email Retry Job] Attempting to send email to ${userEmail} (attempt ${currentRetryCount + 1}/${MAX_RETRIES})`
      )

      try {
        const userName = `${nda.agent.firstName} ${nda.agent.lastName || ''}`.trim()
        const acceptanceDate = formatDateDDMMYYYY(new Date(nda.signedAt))

        const emailResult = await sendAgreementEmail({
          toEmail: userEmail,
          userName,
          ndaPdfUrl: nda.pdfUrl,
          msaPdfUrl: msa.pdfUrl,
          acceptanceDate,
        })

        if (emailResult.success) {
          // Update both agreements as SENT
          await Promise.all([
            prisma.agreement.update({
              where: { id: nda.id },
              data: {
                emailStatus: 'SENT',
                emailSentAt: new Date(),
                emailRetryCount: currentRetryCount + 1,
              },
            }),
            prisma.agreement.update({
              where: { id: msa.id },
              data: {
                emailStatus: 'SENT',
                emailSentAt: new Date(),
                emailRetryCount: currentRetryCount + 1,
              },
            }),
          ])

          console.log(
            `✅ [Email Retry Job] Email sent successfully to ${userEmail} on attempt ${currentRetryCount + 1}`
          )
        } else {
          throw new Error(emailResult.error || 'Email sending failed')
        }
      } catch (error) {
        console.error(`❌ [Email Retry Job] Failed to send email to ${userEmail}:`, error.message)

        const newRetryCount = currentRetryCount + 1

        if (newRetryCount >= MAX_RETRIES) {
          // Mark as FAILED and notify admin
          await Promise.all([
            prisma.agreement.update({
              where: { id: nda.id },
              data: {
                emailStatus: 'FAILED',
                emailRetryCount: newRetryCount,
                lastRetryAt: new Date(),
              },
            }),
            prisma.agreement.update({
              where: { id: msa.id },
              data: {
                emailStatus: 'FAILED',
                emailRetryCount: newRetryCount,
                lastRetryAt: new Date(),
              },
            }),
          ])

          // Send admin notification
          const userName = `${nda.agent.firstName} ${nda.agent.lastName || ''}`.trim()
          await sendAgreementEmailFailureAlert({
            userName,
            userEmail,
            agentId: data.userData.agentId,
            errorMessage: error.message,
            retryCount: MAX_RETRIES,
          })

          console.log(`🚨 [Email Retry Job] Max retries reached for ${userEmail}, admin notified`)
        } else {
          // Update retry count
          await Promise.all([
            prisma.agreement.update({
              where: { id: nda.id },
              data: {
                emailRetryCount: newRetryCount,
                lastRetryAt: new Date(),
              },
            }),
            prisma.agreement.update({
              where: { id: msa.id },
              data: {
                emailRetryCount: newRetryCount,
                lastRetryAt: new Date(),
              },
            }),
          ])

          console.log(`🔄 [Email Retry Job] Retry count updated for ${userEmail}: ${newRetryCount}`)
        }
      }
    }

    console.log('✅ [Email Retry Job] Email retry process completed')
  } catch (error) {
    console.error('❌ [Email Retry Job] Error in email retry job:', error)
  }
}

/**
 * Start the email retry cron job
 * Runs every 5 minutes
 */
export function startEmailRetryJob() {
  // Cron pattern: */5 * * * * = Every 5 minutes
  const job = cron.schedule('*/5 * * * *', async () => {
    await processPendingEmails()
  })

  console.log('✅ [Email Retry Job] Email retry cron job started (runs every 5 minutes)')

  return job
}

/**
 * Manually trigger email retry (for testing or manual intervention)
 */
export async function manualEmailRetry() {
  console.log('🔧 [Email Retry Job] Manual email retry triggered')
  await processPendingEmails()
}
