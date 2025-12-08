class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, errorCode = "", metadata = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      errorCode: this.errorCode || undefined,
      metadata: Object.keys(this.metadata).length > 0 ? this.metadata : undefined,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
    };
  }

  static badRequest(message, metadata = {}) {
    return new ApiError(400, message, true, "BAD_REQUEST", metadata);
  }

  static unauthorized(message = "Unauthorized access") {
    return new ApiError(401, message, true, "UNAUTHORIZED");
  }

  static forbidden(message = "Access forbidden") {
    return new ApiError(403, message, true, "FORBIDDEN");
  }

  static notFound(resource = "Resource", identifier = "") {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;
    return new ApiError(404, message, true, "NOT_FOUND", { resource, identifier });
  }

  static conflict(message = "Resource already exists", metadata = {}) {
    return new ApiError(409, message, true, "CONFLICT", metadata);
  }

  static validationError(message = "Validation failed", errors = []) {
    return new ApiError(422, message, true, "VALIDATION_ERROR", { errors });
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message, false, "INTERNAL_ERROR");
  }
}

export default ApiError;
