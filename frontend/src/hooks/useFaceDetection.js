import { useState, useEffect, useRef, useCallback } from "react";
import blazeFaceService from "../utils/blazeFaceService";
import { getValidationStatus } from "../utils/validationHelpers";

/**
 * useFaceDetection Hook
 *
 * Real-time face detection using BlazeFace
 *
 * @param {Object} videoRef - React ref to video element
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Detection interval in ms (default: 100)
 * @param {boolean} options.enabled - Enable/disable detection (default: true)
 * @param {boolean} options.skipLookingAwayCheck - Skip looking away validation (default: true for WebcamCapture, false for assessment)
 * @returns {Object} Detection state and controls
 */
export function useFaceDetection(videoRef, options = {}) {
  const {
    interval = 100,
    enabled = true,
    skipLookingAwayCheck = true,
  } = options;

  const [faces, setFaces] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [error, setError] = useState(null);

  const detectionIntervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  /**
   * Detect faces in current video frame
   */
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !enabled || isProcessingRef.current) {
      console.log(
        "[useFaceDetection] Skipping detection - videoRef:",
        !!videoRef.current,
        "enabled:",
        enabled,
        "isProcessing:",
        isProcessingRef.current
      );
      return;
    }

    try {
      isProcessingRef.current = true;

      // Get video element (handle both direct video and webcam component ref)
      const video = videoRef.current.video || videoRef.current;

      // Check if video is ready
      if (!video || video.readyState !== 4) {
        console.log(
          "[useFaceDetection] Video not ready - video exists:",
          !!video,
          "readyState:",
          video?.readyState
        );
        return;
      }

      // Run detection
      const detectedFaces = await blazeFaceService.detectFaces(video);
      console.log(
        "[useFaceDetection] Detection complete - faces found:",
        detectedFaces.length
      );
      setFaces(detectedFaces);
      
      // Validate faces
      // Pass skipLookingAwayCheck to control whether to check face orientation
      const status = getValidationStatus(
        detectedFaces,
        video.videoWidth,
        video.videoHeight,
        skipLookingAwayCheck
      );
      console.log(
        "[useFaceDetection] Validation status:",
        status.status,
        "isValid:",
        status.isValid
      );
      setValidationStatus(status);

      setError(null);
    } catch (err) {
      console.error("[useFaceDetection] Detection error:", err);
      setError(err.message);
    } finally {
      isProcessingRef.current = false;
    }
  }, [videoRef, enabled, skipLookingAwayCheck]);

  /**
   * Start detection loop
   */
  const startDetection = useCallback(() => {
    console.log(
      "[useFaceDetection] startDetection called, current interval ref:",
      !!detectionIntervalRef.current
    );

    if (detectionIntervalRef.current) {
      console.log("[useFaceDetection] Detection already running, skipping");
      return; // Already running
    }

    console.log(
      `%c[useFaceDetection] ✓ Starting detection loop - interval: ${interval}ms, skipLookingAwayCheck: ${skipLookingAwayCheck}`,
      "color: #3B82F6; font-weight: bold;"
    );
    setIsDetecting(true);

    // Run detection immediately
    detectFaces();

    // Then run at interval
    detectionIntervalRef.current = setInterval(detectFaces, interval);
    console.log(
      "[useFaceDetection] Interval set, ref:",
      !!detectionIntervalRef.current
    );
  }, [detectFaces, interval, skipLookingAwayCheck]);

  /**
   * Stop detection loop
   */
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      console.log("[useFaceDetection] Stopping detection loop");
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      setIsDetecting(false);
    }
  }, []);

  /**
   * Auto-start/stop detection based on enabled flag
   */
  useEffect(() => {
    console.log(
      "[useFaceDetection] Auto-start/stop effect - enabled:",
      enabled
    );

    if (enabled) {
      console.log("[useFaceDetection] Enabled=true, calling startDetection...");
      startDetection();
    } else {
      console.log("[useFaceDetection] Enabled=false, calling stopDetection...");
      stopDetection();
    }

    return () => {
      console.log("[useFaceDetection] Cleanup - stopping detection");
      stopDetection();
    };
  }, [enabled, startDetection, stopDetection]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  return {
    faces,
    isDetecting,
    validationStatus,
    error,
    startDetection,
    stopDetection,
  };
}
