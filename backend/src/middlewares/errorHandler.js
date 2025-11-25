// Global error handler middleware
// This catches ALL errors in the application and formats them consistently
// Without this: Every endpoint would need its own try-catch and error handling

import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * 
 * Express automatically sends errors here when:
 * 1. You call next(error) in any route
 * 2. An async error occurs in any route (with express-async-errors)
 * 3. Any middleware throws an error
 * 
 * This middleware MUST have 4 parameters (err, req, res, next)
 * Without 4 parameters: Express won't recognize it as error handler
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  
  // Log error details for debugging
  // Without this: Errors would be invisible in logs
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous', // If authenticated
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // HANDLE SPECIFIC ERROR TYPES
  // Without these checks: All errors would return generic 500 messages
  
  // 1. Prisma errors (database errors)
  if (err.name === 'PrismaClientKnownRequestError') {
    // P2002 = Unique constraint violation (duplicate email, etc.)
    // Without this: Would show cryptic "Unique constraint failed on the fields: (`email`)"
    if (err.code === 'P2002') {
      statusCode = 409; // 409 Conflict
      const field = err.meta?.target?.[0] || 'field';
      message = `${field} already exists`;
      // User-friendly: "Email already exists" instead of database error
    }
    
    // P2025 = Record not found
    // Without this: Would show "An operation failed because it depends on one or more records that were required but not found"
    else if (err.code === 'P2025') {
      statusCode = 404; // 404 Not Found
      message = 'Resource not found';
      // User-friendly: "Resource not found" instead of database error
    }
    
    // Other Prisma errors
    // Without this: Database errors would leak internal structure
    else {
      statusCode = 400; // 400 Bad Request
      message = 'Database operation failed';
    }
  }

  // 2. JWT errors (authentication errors)
  // Without this: Would show "jwt malformed" or "jwt expired" (not user-friendly)
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // 401 Unauthorized
    message = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401; // 401 Unauthorized
    message = 'Authentication token expired';
  }

  // 3. Validation errors (from express-validator)
  // Without this: Validation errors wouldn't be caught properly
  else if (err.name === 'ValidationError') {
    statusCode = 400; // 400 Bad Request
    message = err.message || 'Validation failed';
  }

  // 4. Multer errors (file upload errors)
  // Without this: File upload errors would show technical messages
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
      // User-friendly instead of "File too large: limit exceeded"
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload failed';
    }
  }

  // 5. Mongoose cast errors (if you add MongoDB later)
  // Without this: Would show "Cast to ObjectId failed for value..."
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // 6. Syntax errors in JSON
  // Without this: Would show "Unexpected token } in JSON at position 45"
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format in request body';
  }

  // SECURITY: Don't leak error details in production
  // Without this: Stack traces and internal errors exposed to users
  const errorResponse = {
    message,
    ...(process.env.NODE_ENV === 'development' && {
      // Only in development: include full error details for debugging
      error: err.message,
      stack: err.stack,
      // In production: these fields won't be sent (security)
    }),
  };

  // Send formatted error response using our utility function
  // Without this: Would send inconsistent error formats
  return sendError(res, message, statusCode, errorResponse);
};

/**
 * 404 NOT FOUND HANDLER
 * 
 * This catches requests to routes that don't exist
 * Must be placed AFTER all other routes in app.js
 * 
 * Example: GET /api/nonexistent-route
 * Without this: Would return HTML error page or hang
 * With this: Returns consistent JSON error
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  // Pass error to global error handler
  // Without next(error): Would just log, not send response
  next(error);
};

/**
 * ASYNC ERROR WRAPPER
 * 
 * Wraps async route handlers to catch errors automatically
 * Without this: Need to add try-catch to every async endpoint
 * 
 * Usage:
 * app.get('/api/data', asyncHandler(async (req, res) => {
 *   const data = await prisma.data.findMany();
 *   res.json(data);
 * }));
 * 
 * If prisma.data.findMany() fails, error automatically caught
 */
export const asyncHandler = (fn) => (req, res, next) => {
  // Execute async function and catch any errors
  // Without .catch(next): Unhandled promise rejection, app crashes
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export the main error handler
export default errorHandler;