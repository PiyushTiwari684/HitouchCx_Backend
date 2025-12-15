/**
 * Agreement Helper Utilities
 *
 * This file contains utility functions for processing agreement templates,
 * replacing placeholders with actual user data, and formatting dates/timestamps.
 */

/**
 * Format date in DD/MM/YYYY format
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string (e.g., "15/12/2025")
 */
export function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format timestamp in human-readable format with IST timezone
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted timestamp (e.g., "December 15, 2025 at 2:30 PM IST")
 */
export function formatTimestamp(date) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }

  const formatter = new Intl.DateTimeFormat('en-US', options)
  const formattedDate = formatter.format(date)

  return `${formattedDate} IST`
}

/**
 * Replace placeholders in agreement template with actual user data
 * @param {string} template - Agreement template HTML string with placeholders
 * @param {Object} userData - User data object containing replacement values
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} [userData.phone] - User's phone number (optional)
 * @param {Date} [userData.acceptanceDate] - Date of acceptance (defaults to now)
 * @returns {string} - Template with placeholders replaced
 */
export function replaceAgreementPlaceholders(template, userData) {
  const acceptanceDate = userData.acceptanceDate || new Date()

  // Prepare replacement values
  const replacements = {
    '{{USER_NAME}}': userData.fullName || 'N/A',
    '{{USER_EMAIL}}': userData.email || 'N/A',
    '{{USER_PHONE}}': userData.phone || 'N/A',
    '{{EFFECTIVE_DATE}}': formatDateDDMMYYYY(acceptanceDate),
    '{{ACCEPTANCE_DATE}}': formatDateDDMMYYYY(acceptanceDate),
    '{{TIMESTAMP}}': formatTimestamp(acceptanceDate),
  }

  // Replace all placeholders in template
  let processedTemplate = template

  Object.entries(replacements).forEach(([placeholder, value]) => {
    // Use global regex to replace all occurrences
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    processedTemplate = processedTemplate.replace(regex, value)
  })

  return processedTemplate
}

/**
 * Validate that all required placeholders have been replaced
 * @param {string} text - Processed agreement text
 * @returns {Object} - Validation result
 * @returns {boolean} result.isValid - Whether all placeholders were replaced
 * @returns {string[]} result.remainingPlaceholders - Array of unreplaced placeholders
 */
export function validatePlaceholderReplacement(text) {
  // Find any remaining {{PLACEHOLDER}} patterns
  const placeholderRegex = /{{([A-Z_]+)}}/g
  const matches = text.match(placeholderRegex) || []

  return {
    isValid: matches.length === 0,
    remainingPlaceholders: matches,
  }
}

/**
 * Get user's full name from Agent data
 * @param {Object} agent - Agent object from database
 * @param {string} agent.firstName - First name
 * @param {string} [agent.middleName] - Middle name (optional)
 * @param {string} [agent.lastName] - Last name (optional)
 * @returns {string} - Full name
 */
export function getFullName(agent) {
  const parts = [agent.firstName, agent.middleName, agent.lastName].filter(Boolean)
  return parts.join(' ')
}

/**
 * Prepare user data object from database records
 * @param {Object} agent - Agent object from database
 * @param {Object} user - User object from database
 * @param {Date} [acceptanceDate] - Custom acceptance date (defaults to now)
 * @returns {Object} - Prepared user data for template replacement
 */
export function prepareUserData(agent, user, acceptanceDate = null) {
  return {
    fullName: getFullName(agent),
    email: user.email,
    phone: user.phone || 'N/A',
    acceptanceDate: acceptanceDate || new Date(),
  }
}

/**
 * Extract plain text from HTML (for database storage if needed)
 * This is a simple implementation - for production, consider using a library like 'html-to-text'
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
export function htmlToPlainText(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
