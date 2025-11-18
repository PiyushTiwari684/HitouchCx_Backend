class ApiError extends Error {

  constructor(statusCode, message = "Something went wrong") {
    super(message);
    this.status = "error";
    this.statusCode = statusCode;

    // Captures stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
