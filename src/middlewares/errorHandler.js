import { sendError } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

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

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  // Pass error to global error handler
  // Without next(error): Would just log, not send response
  next(error);
};


export const asyncHandler = (fn) => (req, res, next) => {
  // Execute async function and catch any errors
  // Without .catch(next): Unhandled promise rejection, app crashes
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export the main error handler
export default errorHandler;