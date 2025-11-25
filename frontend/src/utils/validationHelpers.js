/**
 * Validation Helpers for Face Detection
 *
 * Provides functions to validate face positioning, size, and quality
 * Used by both WebCam verification and future proctoring features
 */


export function isFaceCentered(face, videoWidth, videoHeight, tolerance = 0.4) {
  const faceCenterX = (face.topLeft[0] + face.bottomRight[0]) / 2;
  const faceCenterY = (face.topLeft[1] + face.bottomRight[1]) / 2;

  const videoCenterX = videoWidth / 2;
  const videoCenterY = videoHeight / 2;

  const offsetX = Math.abs(faceCenterX - videoCenterX) / videoWidth;
  const offsetY = Math.abs(faceCenterY - videoCenterY) / videoHeight;

  return offsetX < tolerance && offsetY < tolerance;
}


export function isFaceProperSize(
  face,
  videoWidth,
  videoHeight,
  minSize = 0.10,
  maxSize = 0.60
) {
  const faceWidth = face.bottomRight[0] - face.topLeft[0];
  const faceHeight = face.bottomRight[1] - face.topLeft[1];

  const faceArea = faceWidth * faceHeight;
  const videoArea = videoWidth * videoHeight;

  const facePercentage = faceArea / videoArea;

  return facePercentage >= minSize && facePercentage <= maxSize;
}


export function getFaceSizePercentage(face, videoWidth, videoHeight) {
  const faceWidth = face.bottomRight[0] - face.topLeft[0];
  const faceHeight = face.bottomRight[1] - face.topLeft[1];
  const faceArea = faceWidth * faceHeight;
  const videoArea = videoWidth * videoHeight;
  return faceArea / videoArea;
}


export function hasGoodConfidence(face, threshold = 0.6) {
  return face.probability >= threshold;
}

/**
 * Check if face is looking at the screen using landmark analysis
 * Detects if user's head is turned away or looking in different direction
 *
 * @param {Object} face - Face object from BlazeFace with landmarks
 * @returns {boolean} - True if face is looking at screen, false if looking away
 */
export function isFaceLookingAtScreen(face) {
  // If no landmarks available, we can't determine orientation
  if (!face.landmarks || face.landmarks.length < 6) {
    console.warn('[isFaceLookingAtScreen] Insufficient landmarks for orientation check');
    return true; // Assume looking at screen if we can't verify (benefit of doubt)
  }

  // BlazeFace landmark indices:
  // 0: Right eye, 1: Left eye, 2: Nose, 3: Mouth, 4: Right ear, 5: Left ear
  const rightEye = face.landmarks[0];
  const leftEye = face.landmarks[1];
  const nose = face.landmarks[2];

  // Calculate eye distance (horizontal distance between eyes)
  const eyeDistanceX = Math.abs(leftEye[0] - rightEye[0]);
  const eyeDistanceY = Math.abs(leftEye[1] - rightEye[1]);

  // Calculate face bounding box dimensions
  const faceWidth = face.bottomRight[0] - face.topLeft[0];
  const faceHeight = face.bottomRight[1] - face.topLeft[1];

  // 1. Eye Distance Check
  // When face is looking straight, eyes should be roughly 30-40% of face width apart
  // If eyes are too close together (< 25%), head is likely turned sideways
  const eyeDistanceRatio = eyeDistanceX / faceWidth;
  if (eyeDistanceRatio < 0.25) {
    console.log('[FaceOrientation] Eyes too close - head turned sideways', eyeDistanceRatio.toFixed(2));
    return false;
  }

  // 2. Eye Alignment Check
  // When looking straight, eyes should be roughly on same horizontal level
  // If Y-distance is too large (> 15% of face height), head is tilted or looking up/down
  const eyeAlignmentRatio = eyeDistanceY / faceHeight;
  if (eyeAlignmentRatio > 0.15) {
    console.log('[FaceOrientation] Eyes misaligned - head tilted', eyeAlignmentRatio.toFixed(2));
    return false;
  }

  // 3. Nose Position Check
  // Nose should be centered between the eyes when looking straight
  // Calculate midpoint between eyes
  const eyeMidpointX = (leftEye[0] + rightEye[0]) / 2;
  const eyeMidpointY = (leftEye[1] + rightEye[1]) / 2;

  // Calculate nose offset from eye midpoint
  const noseOffsetX = Math.abs(nose[0] - eyeMidpointX);

  // Nose should be within 20% of eye distance horizontally (allows for slight turns)
  const noseHorizontalRatio = noseOffsetX / eyeDistanceX;
  if (noseHorizontalRatio > 0.3) {
    console.log('[FaceOrientation] Nose offset horizontally - head turned left/right', noseHorizontalRatio.toFixed(2));
    return false;
  }

  // 4. Nose-to-Eye Distance Check
  // When looking straight, nose should be below eyes by a reasonable amount
  // If nose is too close to eye level or above, person might be looking down/up
  const noseToEyeDistance = nose[1] - eyeMidpointY;

  // Nose should be between 5% and 30% of face height below eye level
  const noseVerticalRatio = noseToEyeDistance / faceHeight;
  if (noseVerticalRatio < 0.05 || noseVerticalRatio > 0.35) {
    console.log('[FaceOrientation] Nose-eye distance unusual - looking up/down', noseVerticalRatio.toFixed(2));
    return false;
  }

  // 5. Face Aspect Ratio Check
  // When face is frontal, width/height ratio should be around 0.7-0.9
  // If ratio deviates significantly, face is turned
  const aspectRatio = faceWidth / faceHeight;
  if (aspectRatio < 0.6 || aspectRatio > 1.0) {
    console.log('[FaceOrientation] Face aspect ratio unusual - head turned', aspectRatio.toFixed(2));
    return false;
  }

  // All checks passed - face is looking at screen
  return true;
}

export function getPositioningHints(face, videoWidth, videoHeight) {
  const faceCenterX = (face.topLeft[0] + face.bottomRight[0]) / 2;
  const faceCenterY = (face.topLeft[1] + face.bottomRight[1]) / 2;

  const videoCenterX = videoWidth / 2;
  const videoCenterY = videoHeight / 2;

  const offsetX = (faceCenterX - videoCenterX) / videoWidth;
  const offsetY = (faceCenterY - videoCenterY) / videoHeight;

  let horizontal = 'centered';
  let vertical = 'centered';

  if (offsetX < -0.2) horizontal = 'move right';
  else if (offsetX > 0.2) horizontal = 'move left';

  if (offsetY < -0.2) vertical = 'move down';
  else if (offsetY > 0.2) vertical = 'move up';

  return { horizontal, vertical };
}

/**
 * Validation status codes
 */
export const ValidationStatus = {
  VALID: 'VALID',
  NO_FACE: 'NO_FACE',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  LOOKING_AWAY: 'LOOKING_AWAY',
  NOT_CENTERED: 'NOT_CENTERED',
  TOO_FAR: 'TOO_FAR',
  TOO_CLOSE: 'TOO_CLOSE'
};


export function getValidationStatus(faces, videoWidth, videoHeight, skipLookingAwayCheck = false) {
  // No face detected
  if (faces.length === 0) {
    return {
      isValid: false,
      status: ValidationStatus.NO_FACE,
      message: 'No face detected. Please position yourself in front of camera.',
      icon: '❌'
    };
  }

  // Multiple faces detected
  if (faces.length > 1) {
    return {
      isValid: false,
      status: ValidationStatus.MULTIPLE_FACES,
      message: `Multiple faces detected (${faces.length}). Ensure only you are visible.`,
      icon: '⚠️'
    };
  }

  const face = faces[0];

  // Low confidence
  if (!hasGoodConfidence(face)) {
    return {
      isValid: false,
      status: ValidationStatus.LOW_CONFIDENCE,
      message: 'Face not clear. Ensure good lighting and face the camera.',
      icon: '💡'
    };
  }

  // Face orientation - check if looking at screen
  // ONLY check during assessment proctoring, NOT during initial webcam verification
  if (!skipLookingAwayCheck && !isFaceLookingAtScreen(face)) {
    return {
      isValid: false,
      status: ValidationStatus.LOOKING_AWAY,
      message: 'Please look directly at the screen.',
      icon: '👀'
    };
  }

  // Face not centered
  if (!isFaceCentered(face, videoWidth, videoHeight)) {
    const hints = getPositioningHints(face, videoWidth, videoHeight);
    let message = 'Please center your face.';

    if (hints.horizontal !== 'centered' || hints.vertical !== 'centered') {
      const directions = [];
      if (hints.horizontal !== 'centered') directions.push(hints.horizontal);
      if (hints.vertical !== 'centered') directions.push(hints.vertical);
      message = `Please ${directions.join(' and ')}.`;
    }

    return {
      isValid: false,
      status: ValidationStatus.NOT_CENTERED,
      message,
      icon: '🎯'
    };
  }

  // Face size validation
  if (!isFaceProperSize(face, videoWidth, videoHeight)) {
    const facePercentage = getFaceSizePercentage(face, videoWidth, videoHeight);

    if (facePercentage < 0.10) {
      return {
        isValid: false,
        status: ValidationStatus.TOO_FAR,
        message: 'Move closer to the camera.',
        icon: '📏'
      };
    } else {
      return {
        isValid: false,
        status: ValidationStatus.TOO_CLOSE,
        message: 'Move back from the camera.',
        icon: '📏'
      };
    }
  }

  // All validations passed
  return {
    isValid: true,
    status: ValidationStatus.VALID,
    message: 'Perfect! Face detected and positioned correctly.',
    icon: '✅'
  };
}

/**
 * Calculate guide box dimensions (ideal face position overlay)
 * @param {number} videoWidth - Video width in pixels
 * @param {number} videoHeight - Video height in pixels
 * @returns {Object} Guide box { x, y, width, height }
 */
export function getGuideBoxDimensions(videoWidth, videoHeight) {
  // Guide box should be ~40% of video area, centered
  const guideWidth = videoWidth * 0.5;
  const guideHeight = videoHeight * 0.65;
  const x = (videoWidth - guideWidth) / 2;
  const y = (videoHeight - guideHeight) / 2;

  return { x, y, width: guideWidth, height: guideHeight };
}

/**
 * Check if face is within guide box
 * @param {Object} face - Face object from BlazeFace
 * @param {Object} guideBox - Guide box dimensions
 * @returns {boolean}
 */
export function isFaceInGuideBox(face, guideBox) {
  const faceLeft = face.topLeft[0];
  const faceTop = face.topLeft[1];
  const faceRight = face.bottomRight[0];
  const faceBottom = face.bottomRight[1];

  const guideLeft = guideBox.x;
  const guideTop = guideBox.y;
  const guideRight = guideBox.x + guideBox.width;
  const guideBottom = guideBox.y + guideBox.height;

  // Check if face is mostly within guide box (with some tolerance)
  const tolerance = 20; // pixels
  return (
    faceLeft >= guideLeft - tolerance &&
    faceTop >= guideTop - tolerance &&
    faceRight <= guideRight + tolerance &&
    faceBottom <= guideBottom + tolerance
  );
}
