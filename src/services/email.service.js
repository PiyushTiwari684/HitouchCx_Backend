/**
 * Email Service for Agreement Documents
 *
 * This service handles sending emails with agreement PDFs attached.
 * Uses SendGrid for reliable email delivery.
 */

import sgMail from "@sendgrid/mail";
import fetch from "node-fetch";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Download file from URL as buffer
 * @param {string} url - URL to download from
 * @returns {Promise<Buffer>} - File content as buffer
 */
async function downloadFileAsBuffer(url) {
  try {
    console.log(`📥 Downloading file from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: HTTP ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✅ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error(`❌ Error downloading file from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Send agreement email with NDA and MSA PDFs attached
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.userName - User's full name
 * @param {string} params.ndaPdfBase64 - NDA PDF as base64 string
 * @param {string} params.msaPdfBase64 - MSA PDF as base64 string
 * @param {string} params.acceptanceDate - Formatted acceptance date
 * @returns {Promise<Object>} - Send result
 */
export async function sendAgreementEmail({
  toEmail,
  userName,
  ndaPdfBase64,
  msaPdfBase64,
  acceptanceDate,
}) {
  try {
    console.log(`📧 Preparing to send agreement email to ${toEmail}`);

    // Validate base64 strings
    if (
      !ndaPdfBase64 ||
      !msaPdfBase64 ||
      typeof ndaPdfBase64 !== "string" ||
      typeof msaPdfBase64 !== "string"
    ) {
      console.error(
        `❌ Invalid PDF data - NDA: ${typeof ndaPdfBase64}, MSA: ${typeof msaPdfBase64}`,
      );
      throw new Error("PDF data must be valid base64 strings");
    }

    console.log(
      `✅ Base64 strings received - NDA: ${ndaPdfBase64.length} chars, MSA: ${msaPdfBase64.length} chars`,
    );

    // Log first 200 chars to see what we're receiving
    console.log(`🔍 NDA first 200 chars: ${ndaPdfBase64.substring(0, 200)}`);
    console.log(`🔍 MSA first 200 chars: ${msaPdfBase64.substring(0, 200)}`);

    // Check data type
    console.log(
      `🔍 NDA type: ${typeof ndaPdfBase64}, constructor: ${ndaPdfBase64.constructor.name}`,
    );
    console.log(
      `🔍 MSA type: ${typeof msaPdfBase64}, constructor: ${msaPdfBase64.constructor.name}`,
    );

    // Validate base64 format (should only contain A-Z, a-z, 0-9, +, /, =)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(ndaPdfBase64) || !base64Regex.test(msaPdfBase64)) {
      console.error("❌ Invalid base64 format detected");
      // Find first invalid character
      const ndaMatch = ndaPdfBase64.match(/[^A-Za-z0-9+/=]/);
      const msaMatch = msaPdfBase64.match(/[^A-Za-z0-9+/=]/);
      if (ndaMatch)
        console.error(
          `❌ NDA invalid char at position ${ndaPdfBase64.indexOf(ndaMatch[0])}: "${ndaMatch[0]}" (code: ${ndaMatch[0].charCodeAt(0)})`,
        );
      if (msaMatch)
        console.error(
          `❌ MSA invalid char at position ${msaPdfBase64.indexOf(msaMatch[0])}: "${msaMatch[0]}" (code: ${msaMatch[0].charCodeAt(0)})`,
        );
      throw new Error("Invalid base64 format in PDF data");
    }

    console.log("✅ Base64 validation passed");

    // Log first 100 chars to verify format
    console.log(`🔍 NDA base64 sample: ${ndaPdfBase64.substring(0, 100)}...`);
    console.log(`🔍 MSA base64 sample: ${msaPdfBase64.substring(0, 100)}...`);

    // Create email message
    const msg = {
      to: toEmail,
      from: {
        email: "noreply@hitouchcx.com",
        name: "Reboo8",
      },
      subject: "Your Signed Agreements - Reboo8 NDA & MSA",
      html: generateEmailHTML(userName, acceptanceDate),
      text: generateEmailText(userName, acceptanceDate),
      attachments: [
        {
          content: ndaPdfBase64,
          filename: `Reboo8_NDA_${userName.replace(/\s+/g, "_")}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
        {
          content: msaPdfBase64,
          filename: `Reboo8_MSA_${userName.replace(/\s+/g, "_")}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    // Send email via SendGrid
    console.log("📨 Sending email via SendGrid...");
    const [response] = await sgMail.send(msg);

    console.log(`✅ Email sent successfully to ${toEmail}`);
    return {
      success: true,
      statusCode: response.statusCode,
      messageId: response.headers["x-message-id"],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("❌ Error sending agreement email:", error);

    // Log detailed SendGrid error
    if (error.response?.body?.errors) {
      console.error("SendGrid Error Details:", JSON.stringify(error.response.body.errors, null, 2));
    }

    // Extract useful error information
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `SendGrid Error: ${error.response.body?.errors?.[0]?.message || error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    };
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
  `;
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
  `;
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
    console.log(`📧 Email send attempt ${attempt}/${maxRetries}`);

    const result = await sendAgreementEmail(emailParams);

    if (result.success) {
      return result;
    }

    if (attempt < maxRetries) {
      const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`,
    timestamp: new Date(),
  };
}
