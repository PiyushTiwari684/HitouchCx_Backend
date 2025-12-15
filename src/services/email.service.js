/**
 * Email Service for Agreement Documents
 *
 * This service handles sending emails with agreement PDFs attached.
 * Uses SendGrid for reliable email delivery.
 */

import sgMail from '@sendgrid/mail'
import fetch from 'node-fetch'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Download file from URL as buffer
 * @param {string} url - URL to download from
 * @returns {Promise<Buffer>} - File content as buffer
 */
async function downloadFileAsBuffer(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

/**
 * Send agreement email with NDA and MSA PDFs attached
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.userName - User's full name
 * @param {string} params.ndaPdfUrl - Cloudinary URL for NDA PDF
 * @param {string} params.msaPdfUrl - Cloudinary URL for MSA PDF
 * @param {string} params.acceptanceDate - Formatted acceptance date
 * @returns {Promise<Object>} - Send result
 */
export async function sendAgreementEmail({ toEmail, userName, ndaPdfUrl, msaPdfUrl, acceptanceDate }) {
  try {
    console.log(`📧 Preparing to send agreement email to ${toEmail}`)

    // Download PDFs from Cloudinary
    console.log('⬇️ Downloading PDFs from Cloudinary...')
    const [ndaPdfBuffer, msaPdfBuffer] = await Promise.all([
      downloadFileAsBuffer(ndaPdfUrl),
      downloadFileAsBuffer(msaPdfUrl),
    ])

    // Create email message
    const msg = {
      to: toEmail,
      from: {
        email: 'noreply@hitouchcx.com',
        name: 'Reboo8',
      },
      subject: 'Your Signed Agreements - Reboo8 NDA & MSA',
      html: generateEmailHTML(userName, acceptanceDate),
      text: generateEmailText(userName, acceptanceDate),
      attachments: [
        {
          content: ndaPdfBuffer.toString('base64'),
          filename: `Reboo8_NDA_${userName.replace(/\s+/g, '_')}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
        {
          content: msaPdfBuffer.toString('base64'),
          filename: `Reboo8_MSA_${userName.replace(/\s+/g, '_')}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    }

    // Send email via SendGrid
    console.log('📨 Sending email via SendGrid...')
    const [response] = await sgMail.send(msg)

    console.log(`✅ Email sent successfully to ${toEmail}`)
    return {
      success: true,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'],
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('❌ Error sending agreement email:', error)

    // Extract useful error information
    let errorMessage = error.message
    if (error.response) {
      errorMessage = `SendGrid Error: ${error.response.body?.errors?.[0]?.message || error.message}`
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    }
  }
}

/**
 * Generate HTML email body
 * @param {string} userName - User's full name
 * @param {string} acceptanceDate - Formatted acceptance date
 * @returns {string} - HTML email content
 */
function generateEmailHTML(userName, acceptanceDate) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #056FD4;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      color: #333;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #555;
      margin-bottom: 25px;
    }
    .info-box {
      background-color: #f8fafc;
      border-left: 4px solid #056FD4;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .attachments {
      margin: 25px 0;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background-color: #f8fafc;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .attachment-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    .attachment-name {
      font-weight: 500;
      color: #333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .cta-button {
      display: inline-block;
      background-color: #056FD4;
      color: #ffffff;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Reboo8</div>
      <h1 class="title">Welcome to Reboo8!</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>

      <p>Thank you for accepting our legal agreements. Your signed copies are attached to this email for your records.</p>

      <div class="info-box">
        <p><strong>📅 Date of Acceptance:</strong> ${acceptanceDate}</p>
        <p><strong>📄 Agreement Version:</strong> 1.0</p>
        <p><strong>📎 Documents Attached:</strong> 2 files</p>
      </div>

      <div class="attachments">
        <p><strong>Attached Documents:</strong></p>
        <div class="attachment-item">
          <span class="attachment-icon">📄</span>
          <span class="attachment-name">Non-Disclosure Agreement (NDA)</span>
        </div>
        <div class="attachment-item">
          <span class="attachment-icon">📄</span>
          <span class="attachment-name">Master Service Agreement (MSA)</span>
        </div>
      </div>

      <p>These documents are legally binding and should be kept in a safe place. You can download and print them at any time.</p>

      <p style="margin-top: 25px;">If you have any questions about these agreements, please don't hesitate to contact our support team.</p>
    </div>

    <div class="footer">
      <p><strong>Reboo8</strong></p>
      <p>support@reboo8.com | www.reboo8.com</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        This is an automated message. Please do not reply to this email.
      </p>
      <p style="margin-top: 10px; font-size: 12px; color: #999;">
        © 2025 Reboo8. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate plain text email body (fallback)
 * @param {string} userName - User's full name
 * @param {string} acceptanceDate - Formatted acceptance date
 * @returns {string} - Plain text email content
 */
function generateEmailText(userName, acceptanceDate) {
  return `
Hi ${userName},

Thank you for accepting our legal agreements. Your signed copies are attached to this email for your records.

Date of Acceptance: ${acceptanceDate}
Agreement Version: 1.0
Documents Attached: 2 files

Attached Documents:
- Non-Disclosure Agreement (NDA)
- Master Service Agreement (MSA)

These documents are legally binding and should be kept in a safe place. You can download and print them at any time.

If you have any questions about these agreements, please contact our support team at support@reboo8.com.

Best regards,
The Reboo8 Team

---
This is an automated message. Please do not reply to this email.
© 2025 Reboo8. All rights reserved.
  `
}

/**
 * Retry sending email with exponential backoff
 * @param {Object} emailParams - Email parameters
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} retryDelay - Initial delay in ms
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmailWithRetry(emailParams, maxRetries = 3, retryDelay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 Email send attempt ${attempt}/${maxRetries}`)

    const result = await sendAgreementEmail(emailParams)

    if (result.success) {
      return result
    }

    if (attempt < maxRetries) {
      const delay = retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`,
    timestamp: new Date(),
  }
}
