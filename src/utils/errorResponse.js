/**
 * Centralized Error Response Handler
 * Prevents leaking sensitive error details in production
 */

import logger from '../config/logger.js';

/**
 * Send error response to client
 * @param {Response} res - Express response object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} userMessage - User-friendly message (optional)
 */
export const sendErrorResponse = (res, error, statusCode = 500, userMessage = null) => {
  // Log the full error internally for debugging
  logger.error({
    message: error.message,
    stack: error.stack,
    statusCode,
  });

  // Determine what message to send to client
  let clientMessage = userMessage || 'Internal server error';

  // In development, include error details
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message: clientMessage,
      error: error.message,
      stack: error.stack,
    });
  }

  // In production, send generic message only
  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
};

/**
 * Predefined error responses
 */
export const ErrorMessages = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to access this resource',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_INVALID: 'Invalid authentication token',

  // User Management
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  PHONE_ALREADY_VERIFIED: 'Phone number is already verified',

  // OTP
  OTP_INVALID: 'Invalid or expired OTP',
  OTP_EXPIRED: 'OTP has expired. Please request a new one',
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again',

  // Profile & KYC
  PROFILE_NOT_FOUND: 'Profile not found',
  KYC_UPLOAD_FAILED: 'Failed to upload KYC documents',
  KYC_VERIFICATION_FAILED: 'KYC verification failed',
  DOCUMENT_INVALID: 'Invalid or corrupted document',

  // File Upload
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed. Please try again',

  // Database
  DATABASE_ERROR: 'A database error occurred. Please try again',
  RECORD_NOT_FOUND: 'Requested record not found',
  DUPLICATE_ENTRY: 'This record already exists',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',
  MISSING_REQUIRED_FIELDS: 'Required fields are missing',
  INVALID_INPUT: 'Invalid input provided',

  // Third-party Services
  EMAIL_SERVICE_ERROR: 'Failed to send email. Please try again later',
  SMS_SERVICE_ERROR: 'Failed to send SMS. Please try again later',
  PAYMENT_FAILED: 'Payment processing failed',
  CLOUDINARY_ERROR: 'File storage service error',

  // General
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
};

/**
 * Example Usage:
 *
 * // In controllers:
 * import { sendErrorResponse, ErrorMessages } from '../utils/errorResponse.js';
 *
 * try {
 *   // ... your code
 * } catch (error) {
 *   return sendErrorResponse(res, error, 500, ErrorMessages.DATABASE_ERROR);
 * }
 */
