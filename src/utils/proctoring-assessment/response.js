// Standardized API response utility functions
// These functions ensure all API responses have consistent structure across the entire application

/**
 * SUCCESS RESPONSE - Used when API call succeeds
 * 
 * @param {Object} res - Express response object
 * @param {*} data - The data to send (can be object, array, string, etc.)
 * @param {String} message - Success message to display
 * @param {Number} statusCode - HTTP status code (default: 200 OK)
 * 
 * Response structure:
 * {
 *   success: true,
 *   message: "...",
 *   data: {...}
 * }
 * 
 * Without this: Different endpoints would return different structures
 * With this: All success responses look the same
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  // Return consistent JSON structure
  return res.status(statusCode).json({
    success: true,      // Always true for success responses
    message,            // Human-readable message
    data,               // Actual response data (null if no data to send)
  });
};

/**
 * ERROR RESPONSE - Used when API call fails
 * 
 * @param {Object} res - Express response object
 * @param {String} message - Error message to display
 * @param {Number} statusCode - HTTP status code (default: 500 Internal Error)
 * @param {Object} error - Error details object (optional, for debugging)
 * 
 * Response structure:
 * {
 *   success: false,
 *   message: "...",
 *   error: {...}  // Optional
 * }
 * 
 * Without this: Errors would be returned inconsistently across endpoints
 * With this: Frontend can handle all errors the same way
 */
export const sendError = (res, message = 'Internal server error', statusCode = 500, error = null) => {
  // Log error for debugging (won't be sent to client in production)
  // Without this: Errors would be invisible in logs
  if (error && process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }

  // Return consistent error structure
  return res.status(statusCode).json({
    success: false,     // Always false for error responses
    message,            // Human-readable error message
    // Only include error details in development (security: don't leak internals in production)
    // Without this check: Stack traces could leak to users in production
    ...(process.env.NODE_ENV === 'development' && error && { error }),
  });
};

/**
 * PAGINATED RESPONSE - Used when returning lists with pagination
 * 
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items for current page
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items across all pages
 * @param {String} message - Success message
 * 
 * Response structure:
 * {
 *   success: true,
 *   message: "...",
 *   data: [...],
 *   pagination: {
 *     currentPage: 1,
 *     totalPages: 10,
 *     totalItems: 100,
 *     itemsPerPage: 10,
 *     hasNextPage: true,
 *     hasPrevPage: false
 *   }
 * }
 * 
 * Without this: Frontend would have to calculate pagination info manually
 * With this: Frontend gets ready-to-use pagination data
 */
export const sendPaginated = (
  res,
  data,
  page,
  limit,
  total,
  message = 'Data fetched successfully'
) => {
  // Calculate total pages
  // Without this: Frontend would need to do Math.ceil(total / limit)
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,              // Which page user is on (e.g., 1)
      totalPages,                     // Total pages available (e.g., 10)
      totalItems: total,              // Total items across all pages (e.g., 100)
      itemsPerPage: limit,            // Items per page (e.g., 10)
      hasNextPage: page < totalPages, // Boolean: can go to next page?
      // Without hasNextPage: Frontend needs to check if (currentPage < totalPages)
      hasPrevPage: page > 1,          // Boolean: can go to previous page?
      // Without hasPrevPage: Frontend needs to check if (currentPage > 1)
    },
  });
};

/**
 * VALIDATION ERROR RESPONSE - Used when request data is invalid
 * 
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors from express-validator
 * 
 * Response structure:
 * {
 *   success: false,
 *   message: "Validation failed",
 *   errors: [
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Password too short" }
 *   ]
 * }
 * 
 * Without this: Validation errors would have different formats
 * With this: Frontend can display field-specific errors easily
 */
export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    // Array of validation errors with field names
    // Without this: Frontend wouldn't know which field has which error
    errors: Array.isArray(errors) ? errors : [errors],
  });
};

/**
 * NO CONTENT RESPONSE - Used when operation succeeds but no data to return
 * 
 * @param {Object} res - Express response object
 * 
 * HTTP 204 = Success, but no content to send
 * 
 * Use cases:
 * - DELETE operations (item deleted, nothing to return)
 * - UPDATE operations where you don't need to return updated data
 * - Logout operations
 * 
 * Without this: Would return empty object {} or null
 * With this: Proper HTTP status code, frontend knows operation succeeded
 */
export const sendNoContent = (res) => {
  // HTTP 204 doesn't allow response body
  // Without .end(): Response might hang
  return res.status(204).end();
};

/**
 * CREATED RESPONSE - Used when new resource is created
 * 
 * @param {Object} res - Express response object
 * @param {*} data - The created resource
 * @param {String} message - Success message
 * 
 * HTTP 201 = Resource created successfully
 * 
 * Use cases:
 * - User registration
 * - Creating assessment
 * - Creating question
 * 
 * Without this: Would use 200 (OK), but 201 is more semantically correct
 * With this: Frontend knows a new resource was created vs just fetched
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};