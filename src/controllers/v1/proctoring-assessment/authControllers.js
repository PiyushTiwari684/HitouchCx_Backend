import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { JWT_CONFIG } from "../config/constants.js";

/**
 * Simple login for testing - generates JWT token
 * In production, this would verify email/password
 */
export const login = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, "Email is required", 400);
  }

  // Find candidate by email
  const candidate = await prisma.candidate.findUnique({
    where: { email },
  });

  if (!candidate) {
    return sendError(res, "Candidate not found", 404);
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      candidateId: candidate.id,
      email: candidate.email,
    },
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
  );
  console.log(token);

  return sendSuccess(
    res,
    {
      candidate: {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
      },
      token,
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    },
    "Login successful"
  );
});

/**
 * Register a test candidate (for testing only)
 */
export const register = asyncHandler(async (req, res) => {
  const { email, firstName, lastName, phone } = req.body;

  if (!email || !firstName) {
    return sendError(res, "Email and firstName are required", 400);
  }

  // Check if candidate already exists
  const existing = await prisma.candidate.findUnique({
    where: { email },
  });

  if (existing) {
    return sendError(res, "Candidate already exists", 409);
  }

  // Create new candidate
  const candidate = await prisma.candidate.create({
    data: {
      email,
      firstName,
      lastName: lastName || "",
      phone: phone || null,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      candidateId: candidate.id,
      email: candidate.email,
    },
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
  );

  return sendSuccess(
    res,
    {
      candidate: {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
      },
      token,
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    },
    "Registration successful",
    201
  );
});
