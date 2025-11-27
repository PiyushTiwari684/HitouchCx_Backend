
import { sendSuccess} from "../utils/response.js";
import asyncHandler from "express-async-handler";

/**
 * Validate device compatibility
 * Checks if device meets requirements for assessment
 */
export const validateDevice = asyncHandler(async (req, res) => {
  const {
    browserName,
    screenWidth,
    screenHeight,
    deviceType,
    fullscreenSupported,
  } = req.body;

  try {
    // 1. DEFINE VALIDATION RULES
    const ALLOWED_BROWSERS = ["Chrome", "Firefox", "Edge", "Safari"];
    const MIN_SCREEN_WIDTH = 1024;
    const MIN_SCREEN_HEIGHT = 768;

    // 2. VALIDATE BROWSER
    const browserValid = ALLOWED_BROWSERS.includes(browserName);
    const browserValidation = {
      valid: browserValid,
      message: browserValid
        ? `${browserName} is supported`
        : `${browserName} is not supported. Please use: ${ALLOWED_BROWSERS.join(
            ", "
          )}`,
    };

    // 3. VALIDATE SCREEN SIZE
    const screenValid =
      screenWidth >= MIN_SCREEN_WIDTH && screenHeight >= MIN_SCREEN_HEIGHT;
    const screenValidation = {
      valid: screenValid,
      message: screenValid
        ? `Screen size ${screenWidth}x${screenHeight} is adequate`
        : `Screen too small. Minimum required: ${MIN_SCREEN_WIDTH}x${MIN_SCREEN_HEIGHT}, Current: ${screenWidth}x${screenHeight}`,
    };

    // 4. VALIDATE DEVICE TYPE
    const deviceValid = deviceType === "desktop";
    const deviceValidation = {
      valid: deviceValid,
      message: deviceValid
        ? "Desktop device detected"
        : "This assessment requires a desktop computer. Please use a laptop or desktop.",
    };

    // 5. VALIDATE FULLSCREEN SUPPORT
    const fullscreenValid = fullscreenSupported === true;
    const fullscreenValidation = {
      valid: fullscreenValid,
      message: fullscreenValid
        ? "Fullscreen API supported"
        : "Your browser does not support fullscreen mode. Please use Chrome, Firefox, or Edge.",
    };

    // 6. OVERALL VALIDATION
    const isValid =
      browserValid && screenValid && deviceValid && fullscreenValid;

    // 7. COLLECT ERRORS
    const errors = [];
    if (!browserValid) errors.push(browserValidation.message);
    if (!screenValid) errors.push(screenValidation.message);
    if (!deviceValid) errors.push(deviceValidation.message);
    if (!fullscreenValid) errors.push(fullscreenValidation.message);

    // 8. LOG VALIDATION RESULT
    console.log(`✅ Device Validation: ${isValid ? "PASSED" : "FAILED"}`, {
      browserName,
      screenWidth,
      screenHeight,
      deviceType,
      fullscreenSupported,
    });

    // 9. SEND RESPONSE
    return sendSuccess(
      res,
      {
        isValid,
        validations: {
          browser: browserValidation,
          screenSize: screenValidation,
          deviceType: deviceValidation,
          fullscreen: fullscreenValidation,
        },
        errors: errors.length > 0 ? errors : null,
      },
      isValid ? "Device validation passed" : "Device validation failed"
    );
  } catch (error) {
    console.error("Device validation error:", error);
    throw new Error(`Device validation failed: ${error.message}`);
  }
});
