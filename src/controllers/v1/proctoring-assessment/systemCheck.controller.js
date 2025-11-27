import prisma from "../config/db.js";
import { sendError, sendSuccess } from "../utils/response.js";
import logger from "../utils/logger.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// controller to create system check record

export const createSystemCheck = asyncHandler(async (req, res) => {
  const candidateId = req.candidate.id;
  // Extract the following data from the req.body
  const { attemptId, deviceInfo, permissions, deviceTests } = req.body;

  // Allowed CheckStatus values (kept in sync with Prisma enum)
  const ALLOWED_STATUSES = ["PENDING", "PASSED", "FAILED", "RETRY"];

  // Helper to normalize permission/status fields
  const normalizeStatus = (val) => {
    if (!val) return "PENDING";
    const s = String(val).toUpperCase();
    return ALLOWED_STATUSES.includes(s) ? s : "PENDING";
  };

  // Normalize incoming permission values
  const cameraPermission = normalizeStatus(permissions?.camera);
  const micPermission = normalizeStatus(permissions?.microphone);
  const screenPermission = normalizeStatus(permissions?.screenShare);

  // Normalize device tests (they might be booleans from the client)
  const toTestStatus = (v) => {
    if (v === true || String(v).toLowerCase() === "true") return "PASSED";
    if (v === false || String(v).toLowerCase() === "false") return "FAILED";
    return normalizeStatus(v);
  };

  const cameraWorking = toTestStatus(deviceTests?.cameraWorking);
  const micWorking = toTestStatus(deviceTests?.micWorking);
  const faceDetected = toTestStatus(deviceTests?.faceDetected);

  // Network status (if provided) — otherwise keep PENDING
  const networkStatus = normalizeStatus(req.body.network?.status);

  // Determine critical failures (these should block starting a session)
  const criticalFailures = [];
  if (cameraPermission === "FAILED" || cameraWorking === "FAILED")
    criticalFailures.push("camera");
  if (micPermission === "FAILED" || micWorking === "FAILED")
    criticalFailures.push("microphone");
  if (screenPermission === "FAILED") criticalFailures.push("screenShare");
  if (faceDetected === "FAILED") criticalFailures.push("faceDetection");
  if (networkStatus === "FAILED") criticalFailures.push("network");

  const allChecksPassed =
    criticalFailures.length === 0 &&
    cameraPermission === "PASSED" &&
    micPermission === "PASSED" &&
    cameraWorking === "PASSED" &&
    micWorking === "PASSED" &&
    faceDetected === "PASSED";

  // create system check record in database
  const systemCheck = await prisma.systemCheck.create({
    data: {
      candidateId,
      attemptId: attemptId || null,

      // device info
      browserName: deviceInfo?.browserName,
      browserVersion: deviceInfo?.browserVersion,
      operatingSystem: deviceInfo?.operatingSystem,
      deviceType: deviceInfo?.deviceType,
      userAgent: deviceInfo?.userAgent,
      screenWidth: deviceInfo?.screenWidth,
      screenHeight: deviceInfo?.screenHeight,
      viewportWidth: deviceInfo?.viewportWidth,
      viewportHeight: deviceInfo?.viewportHeight,
      devicePixelRatio: deviceInfo?.devicePixelRatio,

      // Permissions
      cameraPermission,
      micPermission,
      screenPermission,

      // Device tests
      cameraWorking,
      micWorking,
      faceDetected,

      // Network
      networkStatus,

      // Overall status
      allChecksPassed,
      criticalFailures: criticalFailures.length ? criticalFailures : null,

      // Raw data for debugging
      rawCheckData: req.body || null,
    },
  });

  logger.info(
    `System check created for candidate: ${candidateId}, allChecksPassed=${allChecksPassed}`
  );

  return sendSuccess(res, systemCheck, "system check created successfully");
});
