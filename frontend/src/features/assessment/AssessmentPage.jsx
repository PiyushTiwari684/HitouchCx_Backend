import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useFullscreenContext } from "../../context/FullscreenContext";
import { useProctorContext } from "../../context/ProctorContext";
import FullscreenWarningOverlay from "../shared/FullscreenWarningOverlay";
import SecurityWatermark from "../shared/SecurityWatermark";
import ViolationWarningModal from "../shared/ViolationWarningModal";
import { ToastContainer, useToast } from "../shared/Toast";
import { useBrowserRestrictions } from "../../hooks/useBrowserRestrictions";
import { useWebcamMonitoring } from "../../hooks/useWebcamMonitoring";
import { useLiveFaceComparison } from "../../hooks/useLiveFaceComparison";
import { getReferenceDescriptor } from "../../api/identityVerificationAPI";
import { getCombinedLocationData, monitorLocationChanges } from "../../utils/locationTracking";

const AssessmentPage = () => {
  const { assessmentId, attemptId } = useParams(); // From route params
  const navigate = useNavigate();

  // ==================== CONTEXT & HOOKS ====================

  // Fullscreen context - manages fullscreen state and tracking
  // Tracks: exit count, time outside fullscreen, pause state, auto-submit triggers
  const {
    isPaused,                      // true when user exits fullscreen (assessment paused)
    shouldAutoSubmit,              // true when cumulative time outside fullscreen > 5 min
    fullscreenExitCount,           // number of times user exited fullscreen
    totalTimeOutsideFullscreen,    // total seconds spent outside fullscreen
    resetTracking                  // function to reset fullscreen tracking
  } = useFullscreenContext();

  // Proctor context - centralized violation tracking system
  // Manages: all violations, thresholds, auto-submit logic, batch sending to backend
  const {
    startProctoring,               // start proctoring session (must call before tracking violations)
    stopProctoring,                // stop proctoring and send remaining violations
    logViolation,                  // log a violation (type, details, severity)
    getViolationSummary,           // get summary of all violations for submission
    shouldShowWarning,             // check if should show warning modal for violation type
    shouldAutoSubmitForViolations, // check if should auto-submit based on violations
    ViolationType,                 // enum of all violation types (TAB_SWITCH, RIGHT_CLICK, etc.)
    VIOLATION_THRESHOLDS,          // thresholds config for each violation type
    setInitialLocation,            // set initial geolocation for comparison
    setInitialIP                   // set initial IP address for comparison
  } = useProctorContext();

  // Toast notifications - lightweight notification system
  const toast = useToast();

  // ==================== COMPONENT STATE ====================

  // Assessment data state
  const [assessment, setAssessment] = useState(null);  // Full assessment object from API
  const [loading, setLoading] = useState(true);        // Loading state for initial fetch
  const [error, setError] = useState("");              // Error message if fetch fails

  // Navigation state - track current position in assessment
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);   // Current section (0-based)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Current question in section

  // Answers state - store all candidate answers
  // Format: { questionId: selectedAnswer }
  const [answers, setAnswers] = useState({});

  // Timer state - countdown timer for assessment
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds, null = not initialized

  // ==================== PROCTORING STATE ====================

  // Proctoring initialization flag - prevents multiple initialization
  const [proctoringInitialized, setProctoringInitialized] = useState(false);

  // Violation warning modal state
  const [violationModalOpen, setViolationModalOpen] = useState(false);      // Modal open/closed
  const [currentViolationType, setCurrentViolationType] = useState(null);   // Which violation triggered modal
  const [violationCounts, setViolationCounts] = useState({});               // Local count tracking for UI

  // Live face comparison state
  const webcamRef = useRef(null);                                           // Hidden webcam for face comparison
  const [referenceDescriptor, setReferenceDescriptor] = useState(null);     // Reference face descriptor from verification
  const [faceComparisonReady, setFaceComparisonReady] = useState(false);    // Flag when descriptor is loaded

  // ==================== VIOLATION HANDLERS ====================

  /**
   * Handle warning-level violations
   * Called by useBrowserRestrictions and useWebcamMonitoring when violations occur
   * Shows modal if violation count is between warning and auto-submit threshold
   * Otherwise shows toast notification
   */
  const handleViolationWarning = useCallback((violationType) => {
    const threshold = VIOLATION_THRESHOLDS[violationType];
    const currentCount = violationCounts[violationType] || 0;

    // Show modal if count is in warning range (e.g., 2-4 for tab switching)
    if (currentCount >= threshold?.warningThreshold && currentCount < threshold?.autoSubmitThreshold) {
      setCurrentViolationType(violationType);
      setViolationModalOpen(true);
    } else {
      // Show toast for first few violations before warning threshold
      toast.violation(`Violation detected: ${violationType.replace(/_/g, ' ')}`);
    }

    // Update local count for UI display
    setViolationCounts(prev => ({
      ...prev,
      [violationType]: (prev[violationType] || 0) + 1
    }));
  }, [VIOLATION_THRESHOLDS, violationCounts, toast]);

  /**
   * Handle critical violations (DEVTOOLS_OPEN, IP_CHANGE, LOCATION_CHANGE)
   * These trigger immediate auto-submit after 2 seconds delay
   */
  const handleCriticalViolation = useCallback((violationType) => {
    toast.error(`Critical violation: ${violationType}. Assessment will be auto-submitted.`);
    // Wait 2 seconds to let user see the error message
    setTimeout(() => {
      submitAssessment('CRITICAL_VIOLATION');
    }, 2000);
  }, [toast]);

  /**
   * Handle auto-submit from ProctorContext
   * Called when violation count reaches auto-submit threshold
   */
  const handleViolationAutoSubmit = useCallback((reason) => {
    toast.error(`Assessment auto-submitted: ${reason}`);
    submitAssessment(reason);
  }, [toast]);

  // ==================== PROCTORING HOOKS ====================

  /**
   * Browser Restrictions Hook
   * Enables all keyboard/mouse/window security when proctoring is active
   *
   * What it blocks:
   * - Tab switching (Alt+Tab, clicking other tabs)
   * - Right-click context menu
   * - Copy/Paste/Cut (Ctrl+C/V/X, Cmd+C/V/X)
   * - Text selection (mouse drag, Ctrl+A)
   * - Keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
   * - Developer tools (detects if open, checks every 2 seconds)
   * - New windows/tabs (Ctrl+N/T, window.open)
   * - Print (Ctrl+P, Cmd+P, print dialog)
   * - Screenshots (PrintScreen key, Mac screenshot shortcuts)
   *
   * How it works:
   * - Adds event listeners for all blocked actions
   * - Calls preventDefault() to stop default behavior
   * - Logs violations via ProctorContext
   * - Shows alerts for critical actions (DevTools, Print, Screenshot)
   * - Injects CSS to disable text selection
   */
  useBrowserRestrictions({
    enabled: proctoringInitialized,           // Only active after proctoring starts
    onWarning: handleViolationWarning,        // Callback for warning-level violations
    onCriticalViolation: handleCriticalViolation  // Callback for critical violations
  });

  /**
   * Webcam Monitoring Hook
   * Continuously monitors webcam for face detection during assessment
   *
   * What it checks:
   * - No face detected (candidate left screen)
   * - Multiple faces (someone else in frame)
   *
   * How it works:
   * - Uses existing BlazeFace detection from system check
   * - Runs face detection every 5 seconds
   * - Tracks consecutive "no face" duration
   * - Warns after 10s of no face
   * - Critical violation after 30s of no face
   * - Immediately detects multiple faces
   *
   * Thresholds:
   * - interval: 5000ms (check every 5 seconds)
   * - noFaceThreshold: 10000ms (warn after 10 seconds)
   * - criticalNoFaceThreshold: 30000ms (critical after 30 seconds)
   */
  console.log('[AssessmentPage] Calling useWebcamMonitoring with proctoringInitialized:', proctoringInitialized);
  useWebcamMonitoring({
    videoRef: webcamRef,                      // Share webcam with face comparison
    enabled: proctoringInitialized,           // Only active after proctoring starts
    interval: 5000,                           // Check every 5 seconds
    noFaceThreshold: 10000,                   // Warn if no face for 10 seconds
    criticalNoFaceThreshold: 30000,           // Critical if no face for 30 seconds
    onWarning: handleViolationWarning,        // Callback for warnings
    onCritical: handleCriticalViolation,      // Callback for critical (30s no face)
    toast                                     // Pass toast for on-screen notifications
  });

  /**
   * Live Face Comparison Hook
   * Continuously compares live webcam feed with reference face descriptor
   *
   * What it does:
   * - Runs face comparison every 10 seconds
   * - Extracts descriptor from current webcam frame
   * - Compares with reference descriptor using Euclidean distance
   * - Distance < 0.6 = same person (match)
   * - Distance >= 0.6 = different person (mismatch)
   *
   * How it works:
   * - Uses face-api.js for descriptor extraction
   * - Logs comparison results to backend for audit
   * - Captures snapshots on mismatch for review
   * - Auto-submits assessment after 3 mismatches
   *
   * Prerequisites:
   * - Reference descriptor must be loaded from backend
   * - Webcam must be accessible (hidden video element)
   * - Face recognition models must be loaded
   */
  useLiveFaceComparison({
    referenceDescriptor,                      // Reference from verification
    webcamRef,                                // Hidden webcam video element
    enabled: proctoringInitialized && faceComparisonReady, // Only after both are ready
    interval: 10000,                          // Compare every 10 seconds
    mismatchThreshold: 0.6,                   // Euclidean distance threshold
    attemptId,                                // For logging to backend

    onMatch: (details) => {
      // Optional: Log successful matches for audit trail
      console.log('[FaceComparison] Face verified:', details.distance.toFixed(4));
    },

    onMismatch: (details) => {
      // Log violation to ProctorContext
      logViolation(ViolationType.FACE_MISMATCH, {
        matchScore: details.distance,
        timestamp: details.timestamp,
        matched: false
      });

      // Show warning to user
      toast.warning('⚠️ Face mismatch detected! Ensure you are the registered test-taker.');

      // Update local count for modal
      handleViolationWarning(ViolationType.FACE_MISMATCH);

      console.warn('[FaceComparison] MISMATCH DETECTED:', {
        distance: details.distance.toFixed(4),
        threshold: 0.6,
        timestamp: details.timestamp
      });
    },

    onError: (error) => {
      // Don't show errors to user (could be temporary detection failures)
      // Just log for debugging
      console.error('[FaceComparison] Error:', error.message);
    }
  });

  // Submit assessment function
  const submitAssessment = useCallback(async (reason = 'MANUAL') => {
    try {
      // Get violation summary
      const violationSummary = getViolationSummary();

      // Stop proctoring
      stopProctoring();

      // TODO: Add actual API call to submit assessment
      console.log("Submitting assessment with answers:", answers);
      console.log("Violation Summary:", violationSummary);
      console.log("Fullscreen violations:", {
        exitCount: fullscreenExitCount,
        totalTimeOutside: totalTimeOutsideFullscreen
      });
      console.log("Submit reason:", reason);

      // TODO: Uncomment when backend is ready
      /*
      await apiClient.post(`/assessments/${assessmentId}/attempts/${attemptId}/submit`, {
        answers,
        violations: violationSummary,
        fullscreenViolations: {
          exitCount: fullscreenExitCount,
          totalTimeOutside: totalTimeOutsideFullscreen
        },
        submitReason: reason,
        timestamp: new Date().toISOString()
      });
      */

      // Reset fullscreen tracking
      resetTracking();

      // Navigate to completion page
      navigate("/assessment-complete");
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to submit assessment. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, fullscreenExitCount, totalTimeOutsideFullscreen, resetTracking, navigate, assessmentId, attemptId]);

  // Handle auto-submit from timer
  const handleAutoSubmit = useCallback(() => {
    alert("Time's up! Submitting assessment...");
    submitAssessment(false);
  }, [submitAssessment]);

  // Handle auto-submit from fullscreen violations
  const handleFullscreenAutoSubmit = useCallback(() => {
    alert("Assessment auto-submitted due to fullscreen violations.");
    submitAssessment(true);
  }, [submitAssessment]);

  // Fetch assessment on mount
  const fetchAssessment = useCallback(async () => {
    try {
      const response = await apiClient.get(
        `/assessments/${assessmentId}/attempt/${attemptId}`
      );

      if (response.data.success) {
        setAssessment(response.data.data);
        setTimeRemaining(response.data.data.totalDuration * 60); // Convert minutes to seconds
        setLoading(false);
      } else {
        setError(response.data.message || "Failed to load assessment");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Error loading assessment");
      setLoading(false);
    }
  }, [assessmentId, attemptId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  /**
   * ==================== PROCTORING INITIALIZATION ====================
   * Initialize proctoring system when assessment loads
   *
   * This runs once when assessment data is fetched and proctoring hasn't been initialized yet
   *
   * Steps:
   * 1. Start proctoring session in ProctorContext
   * 2. Capture initial IP address and geolocation
   * 3. Set proctoringInitialized to true
   * 4. This enables useBrowserRestrictions and useWebcamMonitoring hooks
   *
   * Why we do this:
   * - ProctorContext needs to be initialized before logging violations
   * - Location tracking needs baseline to compare against (detect IP/location changes)
   * - The enabled flag prevents hooks from running before proctoring is ready
   *
   * Cleanup:
   * - When component unmounts, stop proctoring and send remaining violations
   */



  // useEffect(() => {
  //   if (assessment && !proctoringInitialized) {
  //     // Log initialization message in console (visible to developers, helps debugging)
  //     console.log('%c[Proctoring] Initializing proctoring system...',
  //       'color: #059669; font-weight: bold; font-size: 14px;');

  //     // Step 1: Start proctoring session
  //     // This resets violation counts, sets assessment/attempt IDs, starts batch sending interval
  //     startProctoring(assessmentId, attemptId, handleViolationAutoSubmit);

  //     // Step 2: Capture initial IP address and geolocation
  //     // We need this baseline to detect if user changes location or uses VPN during assessment
  //     getCombinedLocationData().then(data => {
  //       if (data.ip) setInitialIP(data.ip.ip);  // Store initial IP
  //       if (data.geolocation) setInitialLocation(data.geolocation);  // Store initial lat/long
  //       console.log('%c[Proctoring] Location tracking initialized',
  //         'color: #059669; font-weight: bold;',
  //         '\nIP:', data.ip?.ip,
  //         '\nLocation:', data.geolocation);
  //     }).catch(err => {
  //       console.error('[Proctoring] Failed to get location data:', err);
  //     });

  //     // Step 3: Initialize webcam stream
  //     // Request camera access and set up video stream
  //     navigator.mediaDevices.getUserMedia({
  //       video: {
  //         width: { ideal: 640 },
  //         height: { ideal: 480 },
  //         facingMode: 'user'
  //       }
  //     })
  //       .then(stream => {
  //         if (webcamRef.current) {
  //           webcamRef.current.srcObject = stream;
  //           console.log('%c[Proctoring] Webcam stream started',
  //             'color: #059669; font-weight: bold;');
  //         }
  //       })
  //       .catch(err => {
  //         console.error('[Proctoring] Failed to access webcam:', err);
  //         toast.error('Failed to access webcam. Please check permissions.');
  //       });

  //     // Step 4: Fetch reference face descriptor for live comparison
  //     // This is needed for continuous face verification during assessment
  //     getReferenceDescriptor(attemptId)
  //       .then(response => {
  //         if (response.data && response.data.descriptor) {
  //           setReferenceDescriptor(response.data.descriptor);
  //           setFaceComparisonReady(true);
  //           console.log('%c[Proctoring] Live face comparison initialized',
  //             'color: #059669; font-weight: bold;');
  //         } else {
  //           console.warn('[Proctoring] No reference descriptor found - face comparison disabled');
  //         }
  //       })
  //       .catch(err => {
  //         console.error('[Proctoring] Failed to load reference descriptor:', err);
  //         toast.warning('Face verification not available for this session');
  //       });

  //     // Log all active restrictions (helps verify everything is working)
  //     console.log('%c[Proctoring] All restrictions are now active!',
  //       'color: #059669; font-weight: bold; font-size: 14px; background: #d1fae5; padding: 10px;',
  //       '\n✓ Tab switching detection',
  //       '\n✓ Right-click blocking',
  //       '\n✓ Keyboard shortcuts blocking',
  //       '\n✓ Copy/paste blocking',
  //       '\n✓ Text selection blocking',
  //       '\n✓ Developer tools detection',
  //       '\n✓ Webcam monitoring',
  //       '\n✓ Live face comparison',
  //       '\n✓ Location tracking',
  //       '\n✓ Fullscreen monitoring'
  //     );

  //     // Step 4: Mark proctoring as initialized
  //     // This enables the useBrowserRestrictions and useWebcamMonitoring hooks
  //     setProctoringInitialized(true);
  //   }

  //   // Cleanup function - runs when component unmounts or dependencies change
  //   return () => {
  //     if (proctoringInitialized) {
  //       console.log('%c[Proctoring] Stopping proctoring system',
  //         'color: #dc2626; font-weight: bold;');

  //       // Stop webcam stream
  //       if (webcamRef.current && webcamRef.current.srcObject) {
  //         const stream = webcamRef.current.srcObject;
  //         const tracks = stream.getTracks();
  //         tracks.forEach(track => track.stop());
  //         webcamRef.current.srcObject = null;
  //         console.log('[Proctoring] Webcam stream stopped');
  //       }

  //       // Send any remaining violations to backend and clear intervals
  //       stopProctoring();
  //     }
  //   };
  // }, [assessment, proctoringInitialized, assessmentId, attemptId, startProctoring, stopProctoring, setInitialIP, setInitialLocation, handleViolationAutoSubmit]);


/**
 * ==================== PROCTORING INITIALIZATION ====================
 * Initialize proctoring system when assessment loads
 * FIXED: Use refs to prevent infinite loop from function dependencies
 */

// Add these refs at the top with your other refs (around line 80)
const startProctoringRef = useRef(null);
const stopProctoringRef = useRef(null);
const setInitialIPRef = useRef(null);
const setInitialLocationRef = useRef(null);
const handleViolationAutoSubmitRef = useRef(null);

// Sync the refs whenever the functions change (add this BEFORE the proctoring useEffect)
useEffect(() => {
  startProctoringRef.current = startProctoring;
  stopProctoringRef.current = stopProctoring;
  setInitialIPRef.current = setInitialIP;
  setInitialLocationRef.current = setInitialLocation;
  handleViolationAutoSubmitRef.current = handleViolationAutoSubmit;
}, [startProctoring, stopProctoring, setInitialIP, setInitialLocation, handleViolationAutoSubmit]);

// NOW the main proctoring initialization effect with STABLE dependencies
useEffect(() => {
  if (assessment && !proctoringInitialized) {
    console.log('%c[Proctoring] Initializing proctoring system...',
      'color: #059669; font-weight: bold; font-size: 14px;');

    // Step 1: Start proctoring session (use ref)
    startProctoringRef.current(assessmentId, attemptId, handleViolationAutoSubmitRef.current);

    // Step 2: Capture initial IP address and geolocation (use refs)
    getCombinedLocationData().then(data => {
      if (data.ip) setInitialIPRef.current(data.ip.ip);
      if (data.geolocation) setInitialLocationRef.current(data.geolocation);
      console.log('%c[Proctoring] Location tracking initialized',
        'color: #059669; font-weight: bold;',
        '\nIP:', data.ip?.ip,
        '\nLocation:', data.geolocation);
    }).catch(err => {
      console.error('[Proctoring] Failed to get location data:', err);
    });

    // Step 3: Initialize webcam stream
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    })
      .then(stream => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          console.log('%c[Proctoring] Webcam stream started',
            'color: #059669; font-weight: bold;',
            '\nVideo element:', webcamRef.current,
            '\nStream active:', stream.active,
            '\nVideo tracks:', stream.getVideoTracks().length);

          // Wait for video to be ready
          webcamRef.current.onloadedmetadata = () => {
            console.log('%c[Proctoring] ✓ Video metadata loaded - ready for detection',
              'color: #059669; font-weight: bold;',
              '\nVideo dimensions:', webcamRef.current.videoWidth, 'x', webcamRef.current.videoHeight,
              '\nReady state:', webcamRef.current.readyState);
          };
        }
      })
      .catch(err => {
        console.error('[Proctoring] Failed to access webcam:', err);
        toast.error('Failed to access webcam. Please check permissions.');
      });

    // Step 4: Fetch reference face descriptor
    getReferenceDescriptor(attemptId)
      .then(response => {
        if (response.data && response.data.descriptor) {
          setReferenceDescriptor(response.data.descriptor);
          setFaceComparisonReady(true);
          console.log('%c[Proctoring] Live face comparison initialized',
            'color: #059669; font-weight: bold;');
        } else {
          console.warn('[Proctoring] No reference descriptor found - face comparison disabled');
        }
      })
      .catch(err => {
        console.error('[Proctoring] Failed to load reference descriptor:', err);
        toast.warning('Face verification not available for this session');
      });

    console.log('%c[Proctoring] All restrictions are now active!',
      'color: #059669; font-weight: bold; font-size: 14px; background: #d1fae5; padding: 10px;',
      '\n✓ Tab switching detection',
      '\n✓ Right-click blocking',
      '\n✓ Keyboard shortcuts blocking',
      '\n✓ Copy/paste blocking',
      '\n✓ Text selection blocking',
      '\n✓ Developer tools detection',
      '\n✓ Webcam monitoring',
      '\n✓ Live face comparison',
      '\n✓ Location tracking',
      '\n✓ Fullscreen monitoring'
    );

    // Mark proctoring as initialized
    setProctoringInitialized(true);
  }

  // Cleanup function
  return () => {
    if (proctoringInitialized) {
      console.log('%c[Proctoring] Stopping proctoring system',
        'color: #dc2626; font-weight: bold;');

      // Stop webcam stream
      if (webcamRef.current && webcamRef.current.srcObject) {
        const stream = webcamRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        webcamRef.current.srcObject = null;
        console.log('[Proctoring] Webcam stream stopped');
      }

      // Send remaining violations (use ref)
      stopProctoringRef.current();
    }
  };
  // FIXED: Only depend on stable values (IDs and flags)
}, [assessment, proctoringInitialized, assessmentId, attemptId]);



  /**
   * ==================== LOCATION MONITORING ====================
   * Monitor IP address and geolocation changes during assessment
   *
   * Why we monitor location:
   * - Detect if candidate uses VPN or changes network
   * - Detect if candidate physically moves to different location
   * - These are critical violations that trigger auto-submit
   *
   * How it works:
   * - Calls monitorLocationChanges() which sets up interval
   * - Checks every 60 seconds (1 minute)
   * - Compares current IP/location with initial baseline
   * - If different, logs violation and shows toast
   *
   * Violations:
   * - IP_CHANGE: CRITICAL - Auto-submits after 1 occurrence
   * - LOCATION_CHANGE: CRITICAL - Auto-submits after 1 occurrence
   */
  useEffect(() => {
    if (!proctoringInitialized) return;  // Wait for proctoring to be initialized

    // Start monitoring - returns cleanup function
    const cleanup = monitorLocationChanges(
      { ip: { ip: null }, geolocation: null },  // Initial data (will be fetched inside function)
      (newIP) => {
        // IP changed callback - this is CRITICAL
        logViolation(ViolationType.IP_CHANGE, {
          newIP: newIP.ip,
          timestamp: new Date().toISOString()
        });
        toast.error('IP address changed! This is a critical violation.');
      },
      (newLocation) => {
        // Location changed callback - this is CRITICAL
        logViolation(ViolationType.LOCATION_CHANGE, {
          newLocation,
          timestamp: new Date().toISOString()
        });
        toast.warning('Location changed!');
      },
      60000 // Check every 1 minute (60000ms)
    );

    // Cleanup interval when component unmounts
    return cleanup;
  }, [proctoringInitialized, logViolation, ViolationType, toast]);

  /**
   * ==================== AUTO-SUBMIT CHECKS ====================
   * Continuously check if assessment should be auto-submitted
   */

  /**
   * Check for violation-based auto-submit
   * Runs whenever violation counts change
   * Auto-submits if any violation type exceeds its threshold
   */
  useEffect(() => {
    if (shouldAutoSubmitForViolations()) {
      handleViolationAutoSubmit('VIOLATION_THRESHOLD_EXCEEDED');
    }
  }, [shouldAutoSubmitForViolations, handleViolationAutoSubmit]);

  /**
   * Check for fullscreen-based auto-submit
   * Runs whenever fullscreen tracking changes
   * Auto-submits if total time outside fullscreen > 5 minutes
   */
  useEffect(() => {
    if (shouldAutoSubmit()) {
      handleFullscreenAutoSubmit();
    }
  }, [shouldAutoSubmit, handleFullscreenAutoSubmit]);

  // Timer countdown - pause when fullscreen is exited
  useEffect(() => {
    // Don't start timer if not initialized yet
    if (timeRemaining === null || timeRemaining === undefined) {
      return;
    }

    // Pause timer if fullscreen is exited
    if (isPaused) {
      return;
    }

    if (timeRemaining <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setTimeout(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeRemaining, isPaused, handleAutoSubmit]);

  // Navigation handlers
  const handleNextQuestion = () => {
    const currentSection = assessment.sections[currentSectionIndex];
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < assessment.sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      // Move to previous section
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = assessment.sections[currentSectionIndex - 1];
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitAssessment = async () => {
    // Submit via our new function
    submitAssessment(false);
  };

  // Format time remaining (MM:SS)
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "Loading...";
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="p-8 text-center">Loading assessment...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!assessment) return null;

  // Check if assessment has sections and questions
  if (!assessment.sections || assessment.sections.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Assessment is being generated. Please wait...</p>
        <div className="mt-4 inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentSection = assessment.sections[currentSectionIndex];

  // Check if current section has questions
  if (!currentSection || !currentSection.questions || currentSection.questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Assessment questions are being generated. Please wait...</p>
        <div className="mt-4 inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentQuestion = currentSection.questions[currentQuestionIndex];
  const isLastQuestion =
    currentSectionIndex === assessment.sections.length - 1 &&
    currentQuestionIndex === currentSection.questions.length - 1;
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Webcam Preview - Bottom Right Corner */}
      {/* Shows live feed during assessment for user reference */}
      {/* Also used by face comparison and monitoring hooks */}
      {proctoringInitialized && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-lg overflow-hidden shadow-2xl border-4 border-blue-500"
          style={{
            width: '240px',
            height: '180px',
            backgroundColor: '#000'
          }}
        >
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        </div>
      )}

      {/* Security Watermark */}
      <SecurityWatermark
        assessmentId={assessmentId}
        candidateName={`Candidate-${attemptId?.slice(0, 8) || 'Unknown'}`}
        attemptId={attemptId}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Fullscreen Warning Overlay */}
      <FullscreenWarningOverlay
        onAutoSubmit={handleFullscreenAutoSubmit}
      />

      {/* Violation Warning Modal */}
      <ViolationWarningModal
        isOpen={violationModalOpen}
        violationType={currentViolationType}
        currentCount={violationCounts[currentViolationType] || 0}
        threshold={VIOLATION_THRESHOLDS[currentViolationType]?.autoSubmitThreshold || 5}
        onClose={() => setViolationModalOpen(false)}
      />

      {/* Header with timer */}
      <div className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{assessment.title}</h1>
          <div className="text-lg font-mono">
            Time Remaining: {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded shadow p-6 mb-4">
          {/* Section header */}
          <h2 className="text-xl font-bold mb-2">
            Section {currentSectionIndex + 1}: {currentSection.name}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{currentSection.description}</p>

          {/* Question display */}
          <div className="mb-6">
            <div className="mb-2 text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {currentSection.questions.length}
            </div>
            <div className="text-lg font-medium mb-4">{currentQuestion.questionText}</div>

            {/* Answer input (textarea for now, we'll customize by type later) */}
            <textarea
              className="w-full border rounded p-3 min-h-[150px]"
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
              onClick={handlePreviousQuestion}
              disabled={isFirstQuestion}
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                className="px-6 py-2 bg-green-600 text-white rounded font-bold"
                onClick={handleSubmitAssessment}
              >
                Submit Assessment
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleNextQuestion}
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Section progress indicator */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Progress</h3>
          <div className="flex gap-2">
            {assessment.sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex-1 h-2 rounded ${
                  idx === currentSectionIndex
                    ? "bg-blue-600"
                    : idx < currentSectionIndex
                    ? "bg-green-600"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
