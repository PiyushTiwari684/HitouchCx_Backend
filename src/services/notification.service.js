/**
 * Notification Service
 *
 * This service handles admin notifications via Discord and Twilio SMS
 * when critical events occur (e.g., email sending failures).
 */

import twilio from 'twilio'
import fetch from 'node-fetch'

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

/**
 * Send Discord webhook notification
 * @param {Object} params - Notification parameters
 * @param {string} params.title - Alert title
 * @param {string} params.message - Alert message
 * @param {Object} params.userData - User data (name, email, agentId)
 * @param {string} params.errorDetails - Error details
 * @param {string} [params.color] - Embed color (hex without #)
 * @returns {Promise<Object>} - Send result
 */
export async function sendDiscordAlert({ title, message, userData, errorDetails, color = 'FF0000' }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not configured, skipping Discord notification')
    return { success: false, error: 'Discord webhook URL not configured' }
  }

  try {
    const embed = {
      title: `🚨 ${title}`,
      description: message,
      color: parseInt(color, 16), // Convert hex to decimal
      fields: [
        {
          name: '👤 User',
          value: userData.name || 'N/A',
          inline: true,
        },
        {
          name: '📧 Email',
          value: userData.email || 'N/A',
          inline: true,
        },
        {
          name: '🆔 Agent ID',
          value: userData.agentId || 'N/A',
          inline: true,
        },
        {
          name: '❌ Error Details',
          value: `\`\`\`${errorDetails}\`\`\``,
          inline: false,
        },
        {
          name: '⏰ Timestamp',
          value: new Date().toISOString(),
          inline: false,
        },
      ],
      footer: {
        text: 'Reboo8 Agreement System',
      },
      timestamp: new Date().toISOString(),
    }

    const payload = {
      username: 'Reboo8 Alerts',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3588/3588592.png', // Alert icon
      embeds: [embed],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`)
    }

    console.log('✅ Discord notification sent successfully')
    return { success: true, timestamp: new Date() }
  } catch (error) {
    console.error('❌ Error sending Discord notification:', error)
    return { success: false, error: error.message, timestamp: new Date() }
  }
}

/**
 * Send SMS notification via Twilio
 * @param {Object} params - SMS parameters
 * @param {string} params.message - SMS message (max 160 chars recommended)
 * @param {string} [params.toPhone] - Recipient phone number (defaults to env var)
 * @returns {Promise<Object>} - Send result
 */
export async function sendTwilioSMS({ message, toPhone }) {
  const adminPhone = toPhone || process.env.ADMIN_PHONE_NUMBER
  const fromPhone = process.env.TWILIO_PHONE_NUMBER

  if (!adminPhone) {
    console.warn('⚠️ ADMIN_PHONE_NUMBER not configured, skipping SMS notification')
    return { success: false, error: 'Admin phone number not configured' }
  }

  if (!fromPhone) {
    console.warn('⚠️ TWILIO_PHONE_NUMBER not configured, skipping SMS notification')
    return { success: false, error: 'Twilio phone number not configured' }
  }

  try {
    const smsResult = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: adminPhone,
    })

    console.log(`✅ SMS sent successfully to ${adminPhone}`)
    return {
      success: true,
      messageSid: smsResult.sid,
      status: smsResult.status,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('❌ Error sending SMS via Twilio:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
    }
  }
}

/**
 * Send comprehensive admin alert (Discord + SMS)
 * @param {Object} params - Alert parameters
 * @param {string} params.userName - User's full name
 * @param {string} params.userEmail - User's email
 * @param {string} params.agentId - Agent ID
 * @param {string} params.errorMessage - Error message
 * @param {number} params.retryCount - Number of failed attempts
 * @returns {Promise<Object>} - Combined results
 */
export async function sendAgreementEmailFailureAlert({
  userName,
  userEmail,
  agentId,
  errorMessage,
  retryCount,
}) {
  console.log('🚨 Sending admin alerts for agreement email failure...')

  const discordTitle = 'Agreement Email Failed After Multiple Retries'
  const discordMessage = `Failed to send agreement email to **${userName}** after **${retryCount} attempts**. Manual intervention required.`

  const smsMessage = `REBOO8 ALERT: Agreement email failed for ${userName} (${userEmail}). Check Discord for details.`

  // Send both notifications in parallel
  const [discordResult, smsResult] = await Promise.all([
    sendDiscordAlert({
      title: discordTitle,
      message: discordMessage,
      userData: { name: userName, email: userEmail, agentId },
      errorDetails: errorMessage,
      color: 'FF0000', // Red for critical alerts
    }),
    sendTwilioSMS({
      message: smsMessage.substring(0, 160), // Ensure within SMS limits
    }),
  ])

  return {
    discord: discordResult,
    sms: smsResult,
    timestamp: new Date(),
  }
}

/**
 * Send success notification (optional, for monitoring)
 * @param {Object} params - Success parameters
 * @param {string} params.userName - User's full name
 * @param {string} params.userEmail - User's email
 * @param {number} params.retryCount - Number of attempts before success
 * @returns {Promise<Object>} - Send result
 */
export async function sendAgreementEmailSuccessAlert({ userName, userEmail, retryCount }) {
  if (retryCount <= 1) {
    // Only notify if it took more than 1 attempt
    return { success: false, reason: 'Not needed for first attempt success' }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    return { success: false, error: 'Discord webhook URL not configured' }
  }

  try {
    const embed = {
      title: '✅ Agreement Email Sent (After Retry)',
      description: `Successfully sent agreement email to **${userName}** on attempt **${retryCount}**.`,
      color: parseInt('00FF00', 16), // Green
      fields: [
        {
          name: '👤 User',
          value: userName,
          inline: true,
        },
        {
          name: '📧 Email',
          value: userEmail,
          inline: true,
        },
        {
          name: '🔄 Attempts',
          value: retryCount.toString(),
          inline: true,
        },
      ],
      footer: {
        text: 'Reboo8 Agreement System',
      },
      timestamp: new Date().toISOString(),
    }

    const payload = {
      username: 'Reboo8 Alerts',
      embeds: [embed],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log('✅ Success notification sent to Discord')
    return { success: true, timestamp: new Date() }
  } catch (error) {
    console.error('❌ Error sending success notification:', error)
    return { success: false, error: error.message }
  }
}
