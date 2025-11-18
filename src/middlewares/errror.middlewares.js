import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(new ApiResponse(err.statusCode, null, err.message));
  }

  if (err.code && err.clientVersion) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Database error occurred"));
  }

  return res
    .status(500)
    .json(new ApiResponse(500, null, "Internal Server Error"));
};
