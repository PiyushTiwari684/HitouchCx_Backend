import { useEffect, useRef, useCallback, useState } from "react";
import { useFaceDetection } from "./useFaceDetection";
import { useProctorContext } from "../context/ProctorContext";
import { ValidationStatus } from "../utils/validationHelpers";

/**
 * Custom hook for continuous webcam monitoring during assessment
 * Detects no face, multiple faces, and other anomalies
 */
export function useWebcamMonitoring({
  videoRef,
  enabled = false,
  interval = 5000,
  noFaceThreshold = 10000,
  criticalNoFaceThreshold = 30000,
  lookingAwayThreshold = 10000,
  warningIssueThreshold = 30000,
  onWarning,
  onCritical,
  toast,
} = {}) {
  const { logViolation, ViolationType } = useProctorContext();
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Timer refs
  const noFaceStartTimeRef = useRef(null);
  const lookingAwayStartTimeRef = useRef(null);
  const notCenteredStartTimeRef = useRef(null);
  const tooCloseStartTimeRef = useRef(null);
  const tooFarStartTimeRef = useRef(null);
  const lowConfidenceStartTimeRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const lastViolationTimeRef = useRef({});
  const lastToastTimeRef = useRef({});

  // ✅ FIX #2: Add refs to store unstable callback dependencies
  const toastRef = useRef(toast);
  const onWarningRef = useRef(onWarning);
  const onCriticalRef = useRef(onCritical);

  // ✅ FIX #2: Keep refs synced with latest prop values
  useEffect(() => {
    toastRef.current = toast;
    onWarningRef.current = onWarning;
    onCriticalRef.current = onCritical;
  }, [toast, onWarning, onCritical]);

  // Use the existing face detection hook with videoRef
  const { faces, isDetecting, validationStatus } = useFaceDetection(videoRef, {
    enabled: enabled,
    interval: 1000,
    skipLookingAwayCheck: false,
  });

  /**
   * Check face status and log violations
   */
  // const checkFaceStatus = useCallback(() => {

  //   console.log("🔥 [DEBUG] checkFaceStatus CALLED!");
  //   // ✅ FIX #2: Get current values from refs
  //   const currentToast = toastRef.current;
  //   const currentOnWarning = onWarningRef.current;
  //   const currentOnCritical = onCriticalRef.current;

  //   if (!enabled || faces === undefined || faces === null) {
  //     return;
  //   }

  //   const now = Date.now();

  //   // NO FACE DETECTED
  //   if (!faces || faces.length === 0) {
  //     if (!noFaceStartTimeRef.current) {
  //       noFaceStartTimeRef.current = now;
  //     }

  //     const noFaceDuration = now - noFaceStartTimeRef.current;

  //     if (noFaceDuration >= noFaceThreshold) {
  //       const lastLog =
  //         lastViolationTimeRef.current[ViolationType.NO_FACE_DETECTED] || 0;
  //       if (now - lastLog >= 5000) {
  //         logViolation(ViolationType.NO_FACE_DETECTED, {
  //           duration: Math.floor(noFaceDuration / 1000),
  //           timestamp: new Date().toISOString(),
  //         });

  //         lastViolationTimeRef.current[ViolationType.NO_FACE_DETECTED] = now;

  //         console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: NO_FACE", {
  //           duration: noFaceDuration,
  //           toastExists: !!currentToast,
  //         });

  //         if (currentToast) {
  //           currentToast.warning(
  //             `⚠️ No face detected for ${Math.floor(noFaceDuration / 1000)}s`
  //           );
  //           console.log("[WebcamMonitoring] ✅ Toast.warning() called");
  //         }

  //         if (currentOnWarning) {
  //           currentOnWarning(ViolationType.NO_FACE_DETECTED);
  //         }
  //       }
  //     }

  //     if (noFaceDuration >= criticalNoFaceThreshold) {
  //       if (currentOnCritical) {
  //         currentOnCritical(
  //           ViolationType.NO_FACE_DETECTED,
  //           Math.floor(noFaceDuration / 1000)
  //         );
  //       }
  //     }
  //   } else {
  //     noFaceStartTimeRef.current = null;
  //   }

  //   // LOOKING AWAY DETECTION
  //   if (faces && faces.length === 1 && validationStatus) {
  //     if (validationStatus.status === ValidationStatus.LOOKING_AWAY) {
  //       if (!lookingAwayStartTimeRef.current) {
  //         lookingAwayStartTimeRef.current = now;
  //       }

  //       const lookingAwayDuration = now - lookingAwayStartTimeRef.current;

  //       if (lookingAwayDuration >= 3000) {
  //         const lastToast =
  //           lastToastTimeRef.current[ViolationType.LOOKING_AWAY] || 0;
  //         if (now - lastToast >= 3000) {
  //           console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: LOOKING_AWAY", {
  //             duration: lookingAwayDuration,
  //             toastExists: !!currentToast,
  //           });

  //           if (currentToast) {
  //             currentToast.warning(
  //               `👀 Looking away detected! Please look at the screen.`
  //             );
  //             console.log("[WebcamMonitoring] ✅ Toast.warning() called");
  //           }

  //           lastToastTimeRef.current[ViolationType.LOOKING_AWAY] = now;
  //         }
  //       }

  //       if (lookingAwayDuration >= lookingAwayThreshold) {
  //         const lastLog =
  //           lastViolationTimeRef.current[ViolationType.LOOKING_AWAY] || 0;
  //         if (now - lastLog >= 5000) {
  //           logViolation(ViolationType.LOOKING_AWAY, {
  //             duration: Math.floor(lookingAwayDuration / 1000),
  //             timestamp: new Date().toISOString(),
  //           });

  //           lastViolationTimeRef.current[ViolationType.LOOKING_AWAY] = now;

  //           if (currentOnWarning) {
  //             currentOnWarning(ViolationType.LOOKING_AWAY);
  //           }
  //         }
  //       }
  //     } else {
  //       lookingAwayStartTimeRef.current = null;
  //     }
  //   } else {
  //     lookingAwayStartTimeRef.current = null;
  //   }

  //   // MULTIPLE FACES DETECTED
  //   if (faces && faces.length > 1) {
  //     const lastToast =
  //       lastToastTimeRef.current[ViolationType.MULTIPLE_FACES] || 0;
  //     if (now - lastToast >= 3000) {
  //       console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: MULTIPLE_FACES", {
  //         faceCount: faces.length,
  //         toastExists: !!currentToast,
  //       });

  //       if (currentToast) {
  //         currentToast.warning(
  //           `⚠️ Multiple faces detected! Only you should be visible.`
  //         );
  //         console.log("[WebcamMonitoring] ✅ Toast.warning() called");
  //       }

  //       lastToastTimeRef.current[ViolationType.MULTIPLE_FACES] = now;
  //     }

  //     const lastLog =
  //       lastViolationTimeRef.current[ViolationType.MULTIPLE_FACES] || 0;
  //     if (now - lastLog >= 5000) {
  //       logViolation(ViolationType.MULTIPLE_FACES, {
  //         faceCount: faces.length,
  //         timestamp: new Date().toISOString(),
  //       });

  //       lastViolationTimeRef.current[ViolationType.MULTIPLE_FACES] = now;

  //       if (currentOnWarning) {
  //         currentOnWarning(ViolationType.MULTIPLE_FACES);
  //       }
  //     }
  //   }

  //   // WARNING-LEVEL VIOLATIONS
  //   if (
  //     faces &&
  //     faces.length === 1 &&
  //     validationStatus &&
  //     !validationStatus.isValid
  //   ) {
  //     const status = validationStatus.status;

  //     const showToastWarning = (violationType, message) => {
  //       const lastToast = lastToastTimeRef.current[violationType] || 0;
  //       if (now - lastToast >= 10000) {
  //         if (currentToast) {
  //           currentToast.warning(`⚠️ ${message}`);
  //         }
  //         lastToastTimeRef.current[violationType] = now;
  //       }
  //     };

  //     // FACE NOT CENTERED
  //     if (status === ValidationStatus.NOT_CENTERED) {
  //       if (!notCenteredStartTimeRef.current) {
  //         notCenteredStartTimeRef.current = now;
  //         showToastWarning(
  //           ViolationType.FACE_NOT_CENTERED,
  //           "Please center your face in the frame"
  //         );
  //       }

  //       const duration = now - notCenteredStartTimeRef.current;
  //       if (duration >= warningIssueThreshold) {
  //         const lastLog =
  //           lastViolationTimeRef.current[ViolationType.FACE_NOT_CENTERED] || 0;
  //         if (now - lastLog >= 5000) {
  //           logViolation(ViolationType.FACE_NOT_CENTERED, {
  //             duration: Math.floor(duration / 1000),
  //             timestamp: new Date().toISOString(),
  //           });
  //           lastViolationTimeRef.current[ViolationType.FACE_NOT_CENTERED] = now;
  //         }
  //       }
  //     } else {
  //       notCenteredStartTimeRef.current = null;
  //     }

  //     // FACE TOO CLOSE
  //     if (status === ValidationStatus.TOO_CLOSE) {
  //       if (!tooCloseStartTimeRef.current) {
  //         tooCloseStartTimeRef.current = now;
  //         showToastWarning(
  //           ViolationType.FACE_TOO_CLOSE,
  //           "Please move back from the camera"
  //         );
  //       }

  //       const duration = now - tooCloseStartTimeRef.current;
  //       if (duration >= warningIssueThreshold) {
  //         const lastLog =
  //           lastViolationTimeRef.current[ViolationType.FACE_TOO_CLOSE] || 0;
  //         if (now - lastLog >= 5000) {
  //           logViolation(ViolationType.FACE_TOO_CLOSE, {
  //             duration: Math.floor(duration / 1000),
  //             timestamp: new Date().toISOString(),
  //           });
  //           lastViolationTimeRef.current[ViolationType.FACE_TOO_CLOSE] = now;
  //         }
  //       }
  //     } else {
  //       tooCloseStartTimeRef.current = null;
  //     }

  //     // FACE TOO FAR
  //     if (status === ValidationStatus.TOO_FAR) {
  //       if (!tooFarStartTimeRef.current) {
  //         tooFarStartTimeRef.current = now;
  //         showToastWarning(
  //           ViolationType.FACE_TOO_FAR,
  //           "Please move closer to the camera"
  //         );
  //       }

  //       const duration = now - tooFarStartTimeRef.current;
  //       if (duration >= warningIssueThreshold) {
  //         const lastLog =
  //           lastViolationTimeRef.current[ViolationType.FACE_TOO_FAR] || 0;
  //         if (now - lastLog >= 5000) {
  //           logViolation(ViolationType.FACE_TOO_FAR, {
  //             duration: Math.floor(duration / 1000),
  //             timestamp: new Date().toISOString(),
  //           });
  //           lastViolationTimeRef.current[ViolationType.FACE_TOO_FAR] = now;
  //         }
  //       }
  //     } else {
  //       tooFarStartTimeRef.current = null;
  //     }

  //     // LOW CONFIDENCE
  //     if (status === ValidationStatus.LOW_CONFIDENCE) {
  //       if (!lowConfidenceStartTimeRef.current) {
  //         lowConfidenceStartTimeRef.current = now;
  //         showToastWarning(
  //           ViolationType.LOW_CONFIDENCE,
  //           "Please ensure good lighting"
  //         );
  //       }

  //       const duration = now - lowConfidenceStartTimeRef.current;
  //       if (duration >= warningIssueThreshold) {
  //         const lastLog =
  //           lastViolationTimeRef.current[ViolationType.LOW_CONFIDENCE] || 0;
  //         if (now - lastLog >= 5000) {
  //           logViolation(ViolationType.LOW_CONFIDENCE, {
  //             duration: Math.floor(duration / 1000),
  //             timestamp: new Date().toISOString(),
  //           });
  //           lastViolationTimeRef.current[ViolationType.LOW_CONFIDENCE] = now;
  //         }
  //       }
  //     } else {
  //       lowConfidenceStartTimeRef.current = null;
  //     }
  //   } else {
  //     notCenteredStartTimeRef.current = null;
  //     tooCloseStartTimeRef.current = null;
  //     tooFarStartTimeRef.current = null;
  //     lowConfidenceStartTimeRef.current = null;
  //   }
  // }, [
  //   enabled,
  //   faces,
  //   validationStatus,
  //   noFaceThreshold,
  //   criticalNoFaceThreshold,
  //   lookingAwayThreshold,
  //   warningIssueThreshold,
  //   logViolation,
  //   ViolationType,
  // ]);

  // ✅ FIX #3: Auto-start/stop with inlined logic (breaks circular dependency)
  /**
   * Check face status and log violations
   * ✅ Use refs to prevent recreation
   */
  const checkFaceStatus = useCallback(() => {
    console.log("🔥 [DEBUG] checkFaceStatus CALLED!");

    // Get current values from refs
    const currentToast = toastRef.current;
    const currentOnWarning = onWarningRef.current;
    const currentOnCritical = onCriticalRef.current;

    if (
      !enabled ||
      faces === undefined ||
      faces === null
    ) {
      return;
    }

    const now = Date.now();

    // NO FACE DETECTED
    if (!faces || faces.length === 0) {
      if (!noFaceStartTimeRef.current) {
        noFaceStartTimeRef.current = now;
      }

      const noFaceDuration = now - noFaceStartTimeRef.current;

      if (noFaceDuration >= noFaceThreshold) {
        const lastLog =
          lastViolationTimeRef.current[ViolationType.NO_FACE_DETECTED] || 0;
        if (now - lastLog >= 5000) {
          logViolation(ViolationType.NO_FACE_DETECTED, {
            duration: Math.floor(noFaceDuration / 1000),
            timestamp: new Date().toISOString(),
          });

          lastViolationTimeRef.current[ViolationType.NO_FACE_DETECTED] = now;

          console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: NO_FACE", {
            duration: noFaceDuration,
            toastExists: !!currentToast,
          });

          if (currentToast) {
            currentToast.warning(
              `⚠️ No face detected for ${Math.floor(noFaceDuration / 1000)}s`
            );
            console.log("[WebcamMonitoring] ✅ Toast.warning() called");
          }

          if (currentOnWarning) {
            currentOnWarning(ViolationType.NO_FACE_DETECTED);
          }
        }
      }

      if (noFaceDuration >= criticalNoFaceThreshold) {
        if (currentOnCritical) {
          currentOnCritical(
            ViolationType.NO_FACE_DETECTED,
            Math.floor(noFaceDuration / 1000)
          );
        }
      }
    } else {
      noFaceStartTimeRef.current = null;
    }

    // LOOKING AWAY DETECTION
    if (faces && faces.length === 1 && validationStatus) {
      if (validationStatus.status === ValidationStatus.LOOKING_AWAY) {
        if (!lookingAwayStartTimeRef.current) {
          lookingAwayStartTimeRef.current = now;
        }

        const lookingAwayDuration = now - lookingAwayStartTimeRef.current;

        if (lookingAwayDuration >= 3000) {
          const lastToast =
            lastToastTimeRef.current[ViolationType.LOOKING_AWAY] || 0;
          if (now - lastToast >= 3000) {
            console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: LOOKING_AWAY", {
              duration: lookingAwayDuration,
              toastExists: !!currentToast,
            });

            if (currentToast) {
              currentToast.warning(
                `👀 Looking away detected! Please look at the screen.`
              );
              console.log("[WebcamMonitoring] ✅ Toast.warning() called");
            }

            lastToastTimeRef.current[ViolationType.LOOKING_AWAY] = now;
          }
        }

        if (lookingAwayDuration >= lookingAwayThreshold) {
          const lastLog =
            lastViolationTimeRef.current[ViolationType.LOOKING_AWAY] || 0;
          if (now - lastLog >= 5000) {
            logViolation(ViolationType.LOOKING_AWAY, {
              duration: Math.floor(lookingAwayDuration / 1000),
              timestamp: new Date().toISOString(),
            });

            lastViolationTimeRef.current[ViolationType.LOOKING_AWAY] = now;

            if (currentOnWarning) {
              currentOnWarning(ViolationType.LOOKING_AWAY);
            }
          }
        }
      } else {
        lookingAwayStartTimeRef.current = null;
      }
    } else {
      lookingAwayStartTimeRef.current = null;
    }

    // MULTIPLE FACES DETECTED
    if (faces && faces.length > 1) {
      const lastToast =
        lastToastTimeRef.current[ViolationType.MULTIPLE_FACES] || 0;
      if (now - lastToast >= 3000) {
        console.log("[WebcamMonitoring] 🚨 TOAST TRIGGER: MULTIPLE_FACES", {
          faceCount: faces.length,
          toastExists: !!currentToast,
        });

        if (currentToast) {
          currentToast.warning(
            `⚠️ Multiple faces detected! Only you should be visible.`
          );
          console.log("[WebcamMonitoring] ✅ Toast.warning() called");
        }

        lastToastTimeRef.current[ViolationType.MULTIPLE_FACES] = now;
      }

      const lastLog =
        lastViolationTimeRef.current[ViolationType.MULTIPLE_FACES] || 0;
      if (now - lastLog >= 5000) {
        logViolation(ViolationType.MULTIPLE_FACES, {
          faceCount: faces.length,
          timestamp: new Date().toISOString(),
        });

        lastViolationTimeRef.current[ViolationType.MULTIPLE_FACES] = now;

        if (currentOnWarning) {
          currentOnWarning(ViolationType.MULTIPLE_FACES);
        }
      }
    }

    // WARNING-LEVEL VIOLATIONS
    if (
      faces &&
      faces.length === 1 &&
      validationStatus &&
      !validationStatus.isValid
    ) {
      const status = validationStatus.status;

      const showToastWarning = (violationType, message) => {
        const lastToast = lastToastTimeRef.current[violationType] || 0;
        if (now - lastToast >= 10000) {
          if (currentToast) {
            currentToast.warning(`⚠️ ${message}`);
          }
          lastToastTimeRef.current[violationType] = now;
        }
      };

      if (status === ValidationStatus.NOT_CENTERED) {
        if (!notCenteredStartTimeRef.current) {
          notCenteredStartTimeRef.current = now;
          showToastWarning(
            ViolationType.FACE_NOT_CENTERED,
            "Please center your face in the frame"
          );
        }
        const duration = now - notCenteredStartTimeRef.current;
        if (duration >= warningIssueThreshold) {
          const lastLog =
            lastViolationTimeRef.current[ViolationType.FACE_NOT_CENTERED] || 0;
          if (now - lastLog >= 5000) {
            logViolation(ViolationType.FACE_NOT_CENTERED, {
              duration: Math.floor(duration / 1000),
              timestamp: new Date().toISOString(),
            });
            lastViolationTimeRef.current[ViolationType.FACE_NOT_CENTERED] = now;
          }
        }
      } else {
        notCenteredStartTimeRef.current = null;
      }

      if (status === ValidationStatus.TOO_CLOSE) {
        if (!tooCloseStartTimeRef.current) {
          tooCloseStartTimeRef.current = now;
          showToastWarning(
            ViolationType.FACE_TOO_CLOSE,
            "Please move back from the camera"
          );
        }
        const duration = now - tooCloseStartTimeRef.current;
        if (duration >= warningIssueThreshold) {
          const lastLog =
            lastViolationTimeRef.current[ViolationType.FACE_TOO_CLOSE] || 0;
          if (now - lastLog >= 5000) {
            logViolation(ViolationType.FACE_TOO_CLOSE, {
              duration: Math.floor(duration / 1000),
              timestamp: new Date().toISOString(),
            });
            lastViolationTimeRef.current[ViolationType.FACE_TOO_CLOSE] = now;
          }
        }
      } else {
        tooCloseStartTimeRef.current = null;
      }

      if (status === ValidationStatus.TOO_FAR) {
        if (!tooFarStartTimeRef.current) {
          tooFarStartTimeRef.current = now;
          showToastWarning(
            ViolationType.FACE_TOO_FAR,
            "Please move closer to the camera"
          );
        }
        const duration = now - tooFarStartTimeRef.current;
        if (duration >= warningIssueThreshold) {
          const lastLog =
            lastViolationTimeRef.current[ViolationType.FACE_TOO_FAR] || 0;
          if (now - lastLog >= 5000) {
            logViolation(ViolationType.FACE_TOO_FAR, {
              duration: Math.floor(duration / 1000),
              timestamp: new Date().toISOString(),
            });
            lastViolationTimeRef.current[ViolationType.FACE_TOO_FAR] = now;
          }
        }
      } else {
        tooFarStartTimeRef.current = null;
      }

      if (status === ValidationStatus.LOW_CONFIDENCE) {
        if (!lowConfidenceStartTimeRef.current) {
          lowConfidenceStartTimeRef.current = now;
          showToastWarning(
            ViolationType.LOW_CONFIDENCE,
            "Please ensure good lighting"
          );
        }
        const duration = now - lowConfidenceStartTimeRef.current;
        if (duration >= warningIssueThreshold) {
          const lastLog =
            lastViolationTimeRef.current[ViolationType.LOW_CONFIDENCE] || 0;
          if (now - lastLog >= 5000) {
            logViolation(ViolationType.LOW_CONFIDENCE, {
              duration: Math.floor(duration / 1000),
              timestamp: new Date().toISOString(),
            });
            lastViolationTimeRef.current[ViolationType.LOW_CONFIDENCE] = now;
          }
        }
      } else {
        lowConfidenceStartTimeRef.current = null;
      }
    } else {
      notCenteredStartTimeRef.current = null;
      tooCloseStartTimeRef.current = null;
      tooFarStartTimeRef.current = null;
      lowConfidenceStartTimeRef.current = null;
    }
  }, [
    enabled,
    faces,
    validationStatus,
    noFaceThreshold,
    criticalNoFaceThreshold,
    lookingAwayThreshold,
    warningIssueThreshold,
    logViolation,
    ViolationType.NO_FACE_DETECTED,
    ViolationType.LOOKING_AWAY,
    ViolationType.MULTIPLE_FACES,
    ViolationType.FACE_NOT_CENTERED,
    ViolationType.FACE_TOO_CLOSE,
    ViolationType.FACE_TOO_FAR,
    ViolationType.LOW_CONFIDENCE
  ]);

  useEffect(() => {
    if (enabled && !isMonitoring) {
      console.log("[WebcamMonitoring] Starting monitoring...");
      setIsMonitoring(true);

      checkIntervalRef.current = setInterval(() => {
        checkFaceStatus();
      }, interval);

      console.log(
        `%c[WebcamMonitoring] ✓ Monitoring STARTED - checking every ${interval}ms`,
        "color: #10B981; font-weight: bold;"
      );
    } else if (!enabled && isMonitoring) {
      console.log("[WebcamMonitoring] Stopping monitoring...");
      setIsMonitoring(false);

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }

      noFaceStartTimeRef.current = null;
      lookingAwayStartTimeRef.current = null;
      notCenteredStartTimeRef.current = null;
      tooCloseStartTimeRef.current = null;
      tooFarStartTimeRef.current = null;
      lowConfidenceStartTimeRef.current = null;
      lastViolationTimeRef.current = {};
      lastToastTimeRef.current = {};
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [enabled, isMonitoring, interval, checkFaceStatus]);

  return {
    isMonitoring,
    faces,
    validationStatus,
  };
}
