// import { useState, useEffect, useRef, useCallback } from "react";
// import { useFaceRecognition } from "./useFaceRecognition";
// import { logFaceComparison } from "../api/identityVerificationAPI";

// /**
//  * Custom hook for continuous face comparison during assessment
//  * Compares live webcam feed with reference descriptor every X seconds
//  *
//  * @param {Object} options - Configuration options
//  * @param {Array<number>} options.referenceDescriptor - Reference face descriptor (128-d array)
//  * @param {React.RefObject} options.webcamRef - Reference to video element
//  * @param {boolean} options.enabled - Enable/disable comparison
//  * @param {number} options.interval - Comparison interval in milliseconds (default: 10000)
//  * @param {number} options.mismatchThreshold - Distance threshold for mismatch (default: 0.6)
//  * @param {Function} options.onMismatch - Callback when faces don't match
//  * @param {Function} options.onMatch - Callback when faces match
//  * @param {Function} options.onError - Callback on detection errors
//  * @param {string} options.attemptId - Assessment attempt ID (for logging)
//  *
//  * @returns {Object} - { isComparing, lastMatchScore, matchHistory, lastCheckTime }
//  */
// export function useLiveFaceComparison({
//   referenceDescriptor,
//   webcamRef,
//   enabled = true,
//   interval = 10000, // 10 seconds default
//   mismatchThreshold = 0.6,
//   onMismatch,
//   onMatch,
//   onError,
//   attemptId,
// }) {
//   const [isComparing, setIsComparing] = useState(false);
//   const [lastMatchScore, setLastMatchScore] = useState(null);
//   const [matchHistory, setMatchHistory] = useState([]);
//   const [lastCheckTime, setLastCheckTime] = useState(null);

//   const intervalRef = useRef(null);
//   const isProcessingRef = useRef(false);

//   // Face recognition utilities
//   const { extractDescriptor, compareDescriptors, arrayToDescriptor } =
//     useFaceRecognition();

//   /**
//    * Perform single face comparison
//    */
//   const performComparison = useCallback(async () => {
//     // Prevent concurrent comparisons
//     if (isProcessingRef.current) {
//       console.log(
//         "[LiveFaceComparison] Skipping comparison - already processing"
//       );
//       return;
//     }

//     // Validate prerequisites
//     if (!referenceDescriptor || !Array.isArray(referenceDescriptor)) {
//       console.warn("[LiveFaceComparison] No reference descriptor available");
//       return;
//     }

//     if (!webcamRef?.current) {
//       console.warn("[LiveFaceComparison] Webcam ref not available");
//       return;
//     }

//     // Models will be loaded automatically by faceRecognitionService.ensureModelsLoaded()
//     // No need to check here - the service handles it

//     const video = webcamRef.current;

//     // Check if video is ready
//     if (video.readyState !== 4) {
//       console.warn("[LiveFaceComparison] Video not ready");
//       return;
//     }

//     isProcessingRef.current = true;
//     setIsComparing(true);

//     try {
//       console.log("[LiveFaceComparison] Starting face comparison...");

//       // Capture current frame from video
//       const canvas = document.createElement("canvas");
//       canvas.width = video.videoWidth || 640;
//       canvas.height = video.videoHeight || 480;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//       // Extract descriptor from current frame
//       const liveDescriptor = await extractDescriptor(canvas);

//       if (!liveDescriptor) {
//         console.warn("[LiveFaceComparison] No face detected in current frame");

//         // Call error callback
//         if (onError) {
//           onError({
//             type: "no_face_detected",
//             message: "No face detected in webcam",
//             timestamp: new Date().toISOString(),
//           });
//         }

//         // Log to backend (optional)
//         if (attemptId) {
//           await logFaceComparison(attemptId, {
//             matchScore: null,
//             matched: false,
//             faceDetected: false,
//             faceCount: 0,
//           });
//         }

//         isProcessingRef.current = false;
//         setIsComparing(false);
//         return;
//       }

//       // Convert reference descriptor array back to Float32Array
//       const referenceDescriptorObj = arrayToDescriptor(referenceDescriptor);

//       // // Calculate similarity distance
//       // const distance = compareDescriptors(referenceDescriptorObj, liveDescriptor);
//       // const matched = distance < mismatchThreshold;

//       // const result = compareDescriptors(referenceDescriptorObj, liveDescriptor);
//       // const distance = result.distance; // Extract the actual distance number
//       // const matched = distance < mismatchThreshold;

//       // AFTER (Fixed):
//       const comparisonResult = compareDescriptors(
//         referenceDescriptorObj,
//         liveDescriptor
//       );
//       const distance = comparisonResult.distance; // Extract distance from result object
//       const matched = distance < mismatchThreshold;

//       console.log(
//         `[LiveFaceComparison] Distance: ${distance.toFixed(
//           4
//         )} | Matched: ${matched} | Threshold: ${mismatchThreshold}`
//       );
//       console.log(
//         "[LiveFaceComparison] Full comparison result:",
//         comparisonResult
//       );

//       console.log(
//         `[LiveFaceComparison] Distance: ${distance.toFixed(
//           4
//         )} | Matched: ${matched} | Threshold: ${mismatchThreshold}`
//       );

//       // Update state
//       const comparisonResult = {
//         distance,
//         matched,
//         timestamp: new Date().toISOString(),
//       };

//       setLastMatchScore(distance);
//       setLastCheckTime(new Date());
//       setMatchHistory((prev) => [...prev.slice(-19), comparisonResult]); // Keep last 20 results

//       // Optional: Capture snapshot on mismatch
//       let snapshotBase64 = null;
//       if (!matched && onMismatch) {
//         snapshotBase64 = canvas.toDataURL("image/jpeg", 0.8);
//       }

//       // Call appropriate callback
//       if (matched) {
//         if (onMatch) {
//           onMatch({
//             distance,
//             matched: true,
//             timestamp: comparisonResult.timestamp,
//           });
//         }
//       } else {
//         if (onMismatch) {
//           onMismatch({
//             distance,
//             matched: false,
//             timestamp: comparisonResult.timestamp,
//             snapshot: snapshotBase64,
//           });
//         }
//       }

//       // Log to backend
//       if (attemptId) {
//         await logFaceComparison(attemptId, {
//           matchScore: distance,
//           matched,
//           faceDetected: true,
//           faceCount: 1,
//           snapshotBase64: !matched ? snapshotBase64 : null, // Only send snapshot on mismatch
//         });
//       }
//     } catch (error) {
//       console.error("[LiveFaceComparison] Comparison error:", error);

//       if (onError) {
//         onError({
//           type: "comparison_error",
//           message: error.message,
//           timestamp: new Date().toISOString(),
//         });
//       }
//     } finally {
//       isProcessingRef.current = false;
//       setIsComparing(false);
//     }
//   }, [
//     referenceDescriptor,
//     webcamRef,
//     mismatchThreshold,
//     onMismatch,
//     onMatch,
//     onError,
//     extractDescriptor,
//     compareDescriptors,
//     arrayToDescriptor,
//     attemptId,
//   ]);

//   /**
//    * Start/stop comparison loop based on enabled flag
//    */
//   useEffect(() => {
//     if (!enabled || !referenceDescriptor) {
//       // Clear interval if disabled
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//         console.log("[LiveFaceComparison] Comparison disabled");
//       }
//       return;
//     }

//     console.log(
//       `[LiveFaceComparison] Starting comparison loop (interval: ${interval}ms)`
//     );

//     // Perform initial comparison immediately
//     performComparison();

//     // Set up interval for subsequent comparisons
//     intervalRef.current = setInterval(() => {
//       performComparison();
//     }, interval);

//     // Cleanup on unmount or when dependencies change
//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//         console.log("[LiveFaceComparison] Comparison stopped");
//       }
//     };
//   }, [enabled, referenceDescriptor, interval, performComparison]);

//   /**
//    * Calculate match statistics from history
//    */
//   const getMatchStatistics = useCallback(() => {
//     if (matchHistory.length === 0) {
//       return {
//         totalChecks: 0,
//         matchCount: 0,
//         mismatchCount: 0,
//         matchPercentage: 0,
//         averageDistance: null,
//       };
//     }

//     const matchCount = matchHistory.filter((h) => h.matched).length;
//     const mismatchCount = matchHistory.length - matchCount;
//     const averageDistance =
//       matchHistory.reduce((sum, h) => sum + h.distance, 0) /
//       matchHistory.length;

//     return {
//       totalChecks: matchHistory.length,
//       matchCount,
//       mismatchCount,
//       matchPercentage: (matchCount / matchHistory.length) * 100,
//       averageDistance,
//     };
//   }, [matchHistory]);

//   return {
//     isComparing,
//     lastMatchScore,
//     matchHistory,
//     lastCheckTime,
//     getMatchStatistics,
//   };
// }



import { useState, useEffect, useRef, useCallback } from "react";
import { useFaceRecognition } from "./useFaceRecognition";
import { logFaceComparison } from "../api/identityVerificationAPI";

/**
 * Custom hook for continuous face comparison during assessment
 * Compares live webcam feed with reference descriptor every X seconds
 *
 * @param {Object} options - Configuration options
 * @param {Array<number>} options.referenceDescriptor - Reference face descriptor (128-d array)
 * @param {React.RefObject} options.webcamRef - Reference to video element
 * @param {boolean} options.enabled - Enable/disable comparison
 * @param {number} options.interval - Comparison interval in milliseconds (default: 10000)
 * @param {number} options.mismatchThreshold - Distance threshold for mismatch (default: 0.6)
 * @param {Function} options.onMismatch - Callback when faces don't match
 * @param {Function} options.onMatch - Callback when faces match
 * @param {Function} options.onError - Callback on detection errors
 * @param {string} options.attemptId - Assessment attempt ID (for logging)
 *
 * @returns {Object} - { isComparing, lastMatchScore, matchHistory, lastCheckTime, getMatchStatistics }
 */
export function useLiveFaceComparison({
  referenceDescriptor,
  webcamRef,
  enabled = true,
  interval = 10000, // 10 seconds default
  mismatchThreshold = 0.6,
  onMismatch,
  onMatch,
  onError,
  attemptId,
}) {
  const [isComparing, setIsComparing] = useState(false);
  const [lastMatchScore, setLastMatchScore] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  // FIXED: Add refs to prevent infinite loop from unstable dependencies
  const onMismatchRef = useRef(onMismatch);
  const onMatchRef = useRef(onMatch);
  const onErrorRef = useRef(onError);
  const attemptIdRef = useRef(attemptId);
  const mismatchThresholdRef = useRef(mismatchThreshold);

  // Face recognition utilities
  const { extractDescriptor, compareDescriptors, arrayToDescriptor } =
    useFaceRecognition();

  // FIXED: Sync refs whenever props change (prevents stale closures)
  useEffect(() => {
    onMismatchRef.current = onMismatch;
    onMatchRef.current = onMatch;
    onErrorRef.current = onError;
    attemptIdRef.current = attemptId;
    mismatchThresholdRef.current = mismatchThreshold;
  }, [onMismatch, onMatch, onError, attemptId, mismatchThreshold]);

  /**
   * Perform single face comparison
   * FIXED: Use refs for callbacks and values to prevent dependency issues
   */
  const performComparison = useCallback(async () => {
    // Prevent concurrent comparisons
    if (isProcessingRef.current) {
      console.log(
        "[LiveFaceComparison] Skipping comparison - already processing"
      );
      return;
    }

    // Validate prerequisites
    if (!referenceDescriptor || !Array.isArray(referenceDescriptor)) {
      console.warn("[LiveFaceComparison] No reference descriptor available");
      return;
    }

    if (!webcamRef?.current) {
      console.warn("[LiveFaceComparison] Webcam ref not available");
      return;
    }

    const video = webcamRef.current;

    // Check if video is ready
    if (video.readyState !== 4) {
      console.warn("[LiveFaceComparison] Video not ready");
      return;
    }

    isProcessingRef.current = true;
    setIsComparing(true);

    try {
      console.log("[LiveFaceComparison] Starting face comparison...");

      // Capture current frame from video
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d",{willReadFrequently: true});
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract descriptor from current frame
      const liveDescriptor = await extractDescriptor(canvas);

      if (!liveDescriptor) {
        console.warn("[LiveFaceComparison] No face detected in current frame");

        // Call error callback (use ref to avoid dependency)
        if (onErrorRef.current) {
          onErrorRef.current({
            type: "no_face_detected",
            message: "No face detected in webcam",
            timestamp: new Date().toISOString(),
          });
        }

        // Log to backend (optional) - use ref
        if (attemptIdRef.current) {
          try {
            await logFaceComparison(attemptIdRef.current, {
              matchScore: null,
              matched: false,
              faceDetected: false,
              faceCount: 0,
            });
          } catch (error) {
            console.error(
              "[LiveFaceComparison] Failed to log no-face event:",
              error.message
            );
          }
        }

        isProcessingRef.current = false;
        setIsComparing(false);
        return;
      }

      // Convert reference descriptor array back to Float32Array
      const referenceDescriptorObj = arrayToDescriptor(referenceDescriptor);

      // FIXED: compareDescriptors returns an object, not a number
      const comparisonResult = compareDescriptors(
        referenceDescriptorObj,
        liveDescriptor
      );
      const distance = comparisonResult.distance; // Extract distance from result object
      const matched = distance < mismatchThresholdRef.current; // Use ref

      console.log(
        `[LiveFaceComparison] Distance: ${distance.toFixed(
          4
        )} | Matched: ${matched} | Threshold: ${mismatchThresholdRef.current}`
      );
      console.log(
        "[LiveFaceComparison] Full comparison result:",
        comparisonResult
      );

      // Update state
      const result = {
        distance,
        matched,
        timestamp: new Date().toISOString(),
      };

      setLastMatchScore(distance);
      setLastCheckTime(new Date());
      setMatchHistory((prev) => [...prev.slice(-19), result]); // Keep last 20 results

      // Optional: Capture snapshot on mismatch
      let snapshotBase64 = null;
      if (!matched && onMismatchRef.current) {
        snapshotBase64 = canvas.toDataURL("image/jpeg", 0.8);
      }

      // Call appropriate callback (use refs)
      if (matched) {
        if (onMatchRef.current) {
          onMatchRef.current({
            distance,
            matched: true,
            timestamp: result.timestamp,
          });
        }
      } else {
        if (onMismatchRef.current) {
          onMismatchRef.current({
            distance,
            matched: false,
            timestamp: result.timestamp,
            snapshot: snapshotBase64,
          });
        }
      }

      // Log to backend (use ref)
      if (attemptIdRef.current) {
        try {
          await logFaceComparison(attemptIdRef.current, {
            matchScore: distance,
            matched,
            faceDetected: true,
            faceCount: 1,
            snapshotBase64: !matched ? snapshotBase64 : null, // Only send snapshot on mismatch
          });
        } catch (error) {
          console.error(
            "[LiveFaceComparison] Failed to log face comparison:",
            error.message
          );
          // Don't throw - continue even if logging fails
        }
      }
    } catch (error) {
      console.error("[LiveFaceComparison] Comparison error:", error);

      if (onErrorRef.current) {
        onErrorRef.current({
          type: "comparison_error",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      isProcessingRef.current = false;
      setIsComparing(false);
    }
  }, [
    referenceDescriptor,
    webcamRef,
    extractDescriptor,
    compareDescriptors,
    arrayToDescriptor,
    // REMOVED unstable dependencies that were causing infinite loop:
    // mismatchThreshold, onMismatch, onMatch, onError, attemptId
    // These are now accessed via refs
  ]);

  /**
   * Start/stop comparison loop based on enabled flag
   * FIXED: Stable dependencies prevent infinite loop
   */
  useEffect(() => {
    if (!enabled || !referenceDescriptor) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("[LiveFaceComparison] Comparison stopped");
      }
      return;
    }

    console.log(
      `[LiveFaceComparison] Starting comparison loop (interval: ${interval}ms)`
    );

    // Perform initial comparison immediately
    performComparison();

    // Set up interval for subsequent comparisons
    intervalRef.current = setInterval(() => {
      performComparison();
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("[LiveFaceComparison] Comparison stopped");
      }
    };
  }, [enabled, referenceDescriptor, interval, performComparison]);

  /**
   * Calculate match statistics from history
   */
  const getMatchStatistics = useCallback(() => {
    if (matchHistory.length === 0) {
      return {
        totalChecks: 0,
        matchCount: 0,
        mismatchCount: 0,
        matchPercentage: 0,
        averageDistance: null,
      };
    }

    const matchCount = matchHistory.filter((h) => h.matched).length;
    const mismatchCount = matchHistory.length - matchCount;
    const averageDistance =
      matchHistory.reduce((sum, h) => sum + h.distance, 0) /
      matchHistory.length;

    return {
      totalChecks: matchHistory.length,
      matchCount,
      mismatchCount,
      matchPercentage: (matchCount / matchHistory.length) * 100,
      averageDistance,
    };
  }, [matchHistory]);

  return {
    isComparing,
    lastMatchScore,
    matchHistory,
    lastCheckTime,
    getMatchStatistics,
  };
}
