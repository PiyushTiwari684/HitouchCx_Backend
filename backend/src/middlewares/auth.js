import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import { JWT_CONFIG } from "../config/constants.js";

export const authenticateCandidate = (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Access token required", 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET);

    // Add candidate info to request object
    req.candidate = {
      id: decoded.candidateId,
      email: decoded.email,
    };

    next(); // Continue to controller
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token expired", 401);
    } else if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token", 401);
    } else {
      return sendError(res, "Authentication failed", 401);
    }
  }
};
