// // import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
// // import apiClient from '../api/apiClient';
// // import { v4 as uuidv4 } from 'uuid';

// // const ProctorContext = createContext();

// // // Violation types
// // export const ViolationType = {
// //   TAB_SWITCH: 'TAB_SWITCH',
// //   RIGHT_CLICK: 'RIGHT_CLICK',
// //   KEYBOARD_SHORTCUT: 'KEYBOARD_SHORTCUT',
// //   DEVTOOLS_OPEN: 'DEVTOOLS_OPEN',
// //   NEW_WINDOW_ATTEMPT: 'NEW_WINDOW_ATTEMPT',
// //   FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
// //   NO_FACE_DETECTED: 'NO_FACE_DETECTED',
// //   MULTIPLE_FACES: 'MULTIPLE_FACES',
// //   FACE_MISMATCH: 'FACE_MISMATCH', // NEW: Live face comparison mismatch
// //   IP_CHANGE: 'IP_CHANGE',
// //   LOCATION_CHANGE: 'LOCATION_CHANGE',
// //   COPY_PASTE: 'COPY_PASTE',
// //   PAGE_BLUR: 'PAGE_BLUR'
// // };

// // // Severity levels
// // export const ViolationSeverity = {
// //   LOW: 'LOW',
// //   MEDIUM: 'MEDIUM',
// //   HIGH: 'HIGH',
// //   CRITICAL: 'CRITICAL'
// // };

// // // Violation thresholds and auto-actions
// // export const VIOLATION_THRESHOLDS = {
// //   [ViolationType.TAB_SWITCH]: {
// //     warningThreshold: 1, // tab switches before warning threshold
// //     autoSubmitThreshold: 3,
// //     severity: ViolationSeverity.HIGH
// //   },
// //   [ViolationType.PAGE_BLUR]:{
// //     warningThreshold: 3, // 3 pe warning 
// //     autoSubmitThreshold: 5, // 5 pe submit
// //     severity: ViolationSeverity.HIGH  
// //   },
// //   [ViolationType.RIGHT_CLICK]: {
// //     warningThreshold: 3, 
// //     autoSubmitThreshold: 5,
// //     severity: ViolationSeverity.LOW
// //   },
// //   [ViolationType.KEYBOARD_SHORTCUT]: {
// //     warningThreshold: 3,
// //     autoSubmitThreshold: 5,
// //     severity: ViolationSeverity.MEDIUM
// //   },
// //   [ViolationType.DEVTOOLS_OPEN]: {
// //     warningThreshold: 1,
// //     autoSubmitThreshold: 2,
// //     severity: ViolationSeverity.CRITICAL
// //   },
// //   [ViolationType.NEW_WINDOW_ATTEMPT]: {
// //     warningThreshold: 1,
// //     autoSubmitThreshold: 3,
// //     severity: ViolationSeverity.HIGH
// //   },  
// //   [ViolationType.FULLSCREEN_EXIT]: {
// //     warningThreshold: 1,
// //     autoSubmitThreshold: 3,
// //     severity: ViolationSeverity.HIGH
// //   },
// //   [ViolationType.NO_FACE_DETECTED]: {
// //     warningThreshold:2,
// //     autoSubmitThreshold:7,
// //     severity: ViolationSeverity.HIGH
// //   },
// //   [ViolationType.MULTIPLE_FACES]: {
// //     warningThreshold: 1,
// //     autoSubmitThreshold: 3,
// //     severity: ViolationSeverity.HIGH
// //   },
// //   [ViolationType.FACE_MISMATCH]: {
// //     warningThreshold: 1,
// //     autoSubmitThreshold: 3,
// //     severity: ViolationSeverity.CRITICAL
// //   },
// //   [ViolationType.IP_CHANGE]: {
// //     warningThreshold: 0,
// //     autoSubmitThreshold: 1,
// //     severity: ViolationSeverity.CRITICAL
// //   },
// //   [ViolationType.LOCATION_CHANGE]: {
// //     warningThreshold: 0,
// //     autoSubmitThreshold: 1,
// //     severity: ViolationSeverity.CRITICAL
// //   },
// //   [ViolationType.COPY_PASTE]: {
// //     warningThreshold: 3,
// //     autoSubmitThreshold: 8,
// //     severity: ViolationSeverity.MEDIUM
// //   }
// // };

// // export function ProctorProvider({ children }) {
// //   // Violations array
// //   const [violations, setViolations] = useState([]);

// //   // Violation counts by type
// //   const [violationCounts, setViolationCounts] = useState(
// //     Object.keys(ViolationType).reduce((acc, key) => {
// //       acc[ViolationType[key]] = 0;
// //       return acc;
// //     }, {})
// //   );

// //   // Ref to track violation counts without triggering re-renders
// //   const violationCountsRef = useRef(violationCounts);

// //   // Proctoring state
// //   const [isProctoringActive, setIsProctoringActive] = useState(false);
// //   const [assessmentId, setAssessmentId] = useState(null);
// //   const [attemptId, setAttemptId] = useState(null);

// //   // Refs to track IDs without triggering re-renders
// //   const assessmentIdRef = useRef(null);
// //   const attemptIdRef = useRef(null);

// //   // Batch violation queue for sending to backend
// //   const [violationQueue, setViolationQueue] = useState([]);
// //   const violationQueueRef = useRef([]); // Ref to track queue without triggering re-renders
// //   const batchIntervalRef = useRef(null);

// //   // Initial location and IP
// //   const [initialLocation, setInitialLocation] = useState(null);
// //   const [initialIP, setInitialIP] = useState(null);

// //   // Auto-submit callback
// //   const [onAutoSubmit, setOnAutoSubmit] = useState(null);
// //   const onAutoSubmitRef = useRef(null);

// //   /**
// //    * Send violations in batch
// //    */
// //   const sendViolationsBatch = useCallback(async (batch) => {
// //     if (batch.length === 0) return;

// //     try {
// //       // TODO: Replace with actual backend endpoint
// //       await apiClient.post(
// //         `/assessments/${assessmentIdRef.current}/attempts/${attemptIdRef.current}/violations/batch`,
// //         {
// //           violations: batch.map(v => ({
// //             type: v.type,
// //             timestamp: v.timestamp,
// //             details: v.details,
// //             severity: v.severity,
// //             count: v.count
// //           }))
// //         }
// //       );
// //       console.log(`Batch of ${batch.length} violations sent successfully`);

// //       // Clear queue
// //       setViolationQueue([]);
// //     } catch (error) {
// //       console.error('Failed to send violation batch:', error);
// //       // Store in localStorage as backup
// //       batch.forEach(v => storeViolationLocally(v));
// //     }
// //   }, [storeViolationLocally]);

// //   /**
// //    * Store violation in localStorage as backup
// //    */
// //   const storeViolationLocally = useCallback((violation) => {
// //     try {
// //       const key = `violations_${attemptIdRef.current}`;
// //       const existing = JSON.parse(localStorage.getItem(key) || '[]');
// //       existing.push(violation);
// //       localStorage.setItem(key, JSON.stringify(existing));
// //     } catch (error) {
// //       console.error('Failed to store violation locally:', error);
// //     }
// //   }, []);

// //   /**
// //    * Start proctoring session
// //    */
// //   const startProctoring = useCallback((assessId, attemId, autoSubmitCallback) => {
// //     setIsProctoringActive(true);
// //     setAssessmentId(assessId);
// //     setAttemptId(attemId);

// //     // Sync refs
// //     assessmentIdRef.current = assessId;
// //     attemptIdRef.current = attemId;

// //     setOnAutoSubmit(() => autoSubmitCallback);
// //     onAutoSubmitRef.current = autoSubmitCallback;

// //     // Reset violations
// //     setViolations([]);
// //     const initialCounts = Object.keys(ViolationType).reduce((acc, key) => {
// //       acc[ViolationType[key]] = 0;
// //       return acc;
// //     }, {});
// //     setViolationCounts(initialCounts);
// //     violationCountsRef.current = initialCounts;
// //     setViolationQueue([]);
// //   }, []);

// //   /**
// //    * Stop proctoring session
// //    */
// //   const stopProctoring = useCallback(() => {
// //     setIsProctoringActive(false);

// //     // Send any remaining violations (use ref to avoid dependency)
// //     if (violationQueueRef.current.length > 0) {
// //       sendViolationsBatch(violationQueueRef.current);
// //     }

// //     // Clear batch interval
// //     if (batchIntervalRef.current) {
// //       clearInterval(batchIntervalRef.current);
// //       batchIntervalRef.current = null;
// //     }
// //   }, [sendViolationsBatch]);

// //   /**
// //    * Send violation immediately (for critical violations)
// //    */
// //   const sendViolationImmediate = useCallback(async (violation) => {
// //     try {
// //       // TODO: Replace with actual backend endpoint
// //       await apiClient.post(
// //         `/assessments/${violation.assessmentId}/attempts/${violation.attemptId}/violations`,
// //         {
// //           type: violation.type,
// //           timestamp: violation.timestamp,
// //           details: violation.details,
// //           severity: violation.severity,
// //           count: violation.count
// //         }
// //       );
// //       console.log('Critical violation sent immediately:', violation.id);
// //     } catch (error) {
// //       console.error('Failed to send critical violation:', error);
// //       // Store in localStorage as backup
// //       storeViolationLocally(violation);
// //     }
// //   }, [storeViolationLocally]);

// //   /**
// //    * Log a violation
// //    */
// //   const logViolation = useCallback((type, details = {}, customSeverity = null) => {
// //     if (!isProctoringActive) {
// //       console.warn('[Proctoring] Not active, violation not logged:', type);
// //       return;
// //     }

// //     const config = VIOLATION_THRESHOLDS[type];
// //     if (!config) {
// //       console.error('[Proctoring] Unknown violation type:', type);
// //       return;
// //     }

// //     const severity = customSeverity || config.severity;
// //     const timestamp = new Date().toISOString();
// //     const newCount = (violationCountsRef.current[type] || 0) + 1;

// //     // Create violation record
// //     const violation = {
// //       id: uuidv4(),
// //       attemptId: attemptIdRef.current,
// //       assessmentId: assessmentIdRef.current,
// //       type,
// //       timestamp,
// //       details,
// //       severity,
// //       count: newCount
// //     };

// //     // Console log with styling
// //     console.log(
// //       `%c[Proctoring Violation] ${type}`,
// //       `color: ${severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : severity === 'MEDIUM' ? '#d97706' : '#65a30d'}; font-weight: bold;`,
// //       `\nCount: ${newCount}/${config.autoSubmitThreshold}`,
// //       `\nSeverity: ${severity}`,
// //       `\nDetails:`, details,
// //       `\nTimestamp: ${timestamp}`
// //     );

// //     // Update state
// //     setViolations(prev => [...prev, violation]);
// //     setViolationCounts(prev => {
// //       const updated = {
// //         ...prev,
// //         [type]: newCount
// //       };
// //       violationCountsRef.current = updated; // Sync ref
// //       return updated;
// //     });

// //     // Add to queue
// //     setViolationQueue(prev => [...prev, violation]);

// //     // Check if should auto-submit
// //     if (newCount >= config.autoSubmitThreshold) {
// //       console.warn(
// //         `%c[Proctoring] AUTO-SUBMIT TRIGGERED`,
// //         'color: #dc2626; font-weight: bold; font-size: 14px;',
// //         `\nViolation: ${type}`,
// //         `\nCount: ${newCount}/${config.autoSubmitThreshold}`
// //       );
// //       if (onAutoSubmitRef.current) {
// //         onAutoSubmitRef.current(type, newCount);
// //       }
// //     }

// //     // Send immediately if critical
// //     if (severity === ViolationSeverity.CRITICAL) {
// //       sendViolationImmediate(violation);
// //     }
// //   }, [isProctoringActive, sendViolationImmediate]);

// //   /**
// //    * Get violation summary
// //    */
// //   const getViolationSummary = useCallback(() => {
// //     return {
// //       total: violations.length,
// //       counts: violationCounts,
// //       byType: Object.keys(ViolationType).map(key => ({
// //         type: ViolationType[key],
// //         count: violationCounts[ViolationType[key]],
// //         threshold: VIOLATION_THRESHOLDS[ViolationType[key]].autoSubmitThreshold
// //       })),
// //       critical: violations.filter(v => v.severity === ViolationSeverity.CRITICAL).length,
// //       high: violations.filter(v => v.severity === ViolationSeverity.HIGH).length,
// //       medium: violations.filter(v => v.severity === ViolationSeverity.MEDIUM).length,
// //       low: violations.filter(v => v.severity === ViolationSeverity.LOW).length
// //     };
// //   }, [violations, violationCounts]);

// //   /**
// //    * Check if should show warning for a violation type
// //    */
// //   const shouldShowWarning = useCallback((type) => {
// //     const config = VIOLATION_THRESHOLDS[type];
// //     const count = violationCounts[type];
// //     return count >= config.warningThreshold && count < config.autoSubmitThreshold;
// //   }, [violationCounts]);

// //   /**
// //    * Check if should auto-submit for any violation type
// //    */
// //   const shouldAutoSubmitForViolations = useCallback(() => {
// //     return Object.keys(ViolationType).some(key => {
// //       const type = ViolationType[key];
// //       const config = VIOLATION_THRESHOLDS[type];
// //       return violationCounts[type] >= config.autoSubmitThreshold;
// //     });
// //   }, [violationCounts]);

// //   // Sync violationQueue state with ref
// //   useEffect(() => {
// //     violationQueueRef.current = violationQueue;
// //   }, [violationQueue]);

// //   // Set up batch sending interval (every 30 seconds)
// //   useEffect(() => {
// //     if (isProctoringActive) {
// //       batchIntervalRef.current = setInterval(() => {
// //         if (violationQueueRef.current.length > 0) {
// //           sendViolationsBatch(violationQueueRef.current);
// //         }
// //       }, 30000); // 30 seconds

// //       return () => {
// //         if (batchIntervalRef.current) {
// //           clearInterval(batchIntervalRef.current);
// //         }
// //       };
// //     }
// //   }, [isProctoringActive, sendViolationsBatch]);

// //   const value = {
// //     // State
// //     violations,
// //     violationCounts,
// //     isProctoringActive,
// //     assessmentId,
// //     attemptId,
// //     initialLocation,
// //     initialIP,

// //     // Setters
// //     setInitialLocation,
// //     setInitialIP,

// //     // Methods
// //     startProctoring,
// //     stopProctoring,
// //     logViolation,
// //     getViolationSummary,
// //     shouldShowWarning,
// //     shouldAutoSubmitForViolations,

// //     // Constants
// //     ViolationType,
// //     ViolationSeverity,
// //     VIOLATION_THRESHOLDS
// //   };

// //   return (
// //     <ProctorContext.Provider value={value}>
// //       {children}
// //     </ProctorContext.Provider>
// //   );
// // }

// // export function useProctorContext(){
// //   const context = useContext(ProctorContext);
// //   if (!context) {
// //     throw new Error('useProctorContext must be used within ProctorProvider');
// //   }
// //   return context;
// // }



// import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
// import apiClient from '../api/apiClient';
// import { v4 as uuidv4 } from 'uuid';

// const ProctorContext = createContext();

// // Violation types
// export const ViolationType = {
//   TAB_SWITCH: 'TAB_SWITCH',
//   RIGHT_CLICK: 'RIGHT_CLICK',
//   KEYBOARD_SHORTCUT: 'KEYBOARD_SHORTCUT',
//   DEVTOOLS_OPEN: 'DEVTOOLS_OPEN',
//   NEW_WINDOW_ATTEMPT: 'NEW_WINDOW_ATTEMPT',
//   FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
//   NO_FACE_DETECTED: 'NO_FACE_DETECTED',
//   MULTIPLE_FACES: 'MULTIPLE_FACES',
//   FACE_MISMATCH: 'FACE_MISMATCH',
//   IP_CHANGE: 'IP_CHANGE',
//   LOCATION_CHANGE: 'LOCATION_CHANGE',
//   COPY_PASTE: 'COPY_PASTE',
//   PAGE_BLUR: 'PAGE_BLUR'
// };

// // Severity levels
// export const ViolationSeverity = {
//   LOW: 'LOW',
//   MEDIUM: 'MEDIUM',
//   HIGH: 'HIGH',
//   CRITICAL: 'CRITICAL'
// };

// // Violation thresholds
// export const VIOLATION_THRESHOLDS = {
//   [ViolationType.TAB_SWITCH]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 3,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.PAGE_BLUR]: {
//     warningThreshold: 3,
//     autoSubmitThreshold: 5,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.RIGHT_CLICK]: {
//     warningThreshold: 3,
//     autoSubmitThreshold: 5,
//     severity: ViolationSeverity.LOW
//   },
//   [ViolationType.KEYBOARD_SHORTCUT]: {
//     warningThreshold: 3,
//     autoSubmitThreshold: 5,
//     severity: ViolationSeverity.MEDIUM
//   },
//   [ViolationType.DEVTOOLS_OPEN]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 2,
//     severity: ViolationSeverity.CRITICAL
//   },
//   [ViolationType.NEW_WINDOW_ATTEMPT]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 3,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.FULLSCREEN_EXIT]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 3,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.NO_FACE_DETECTED]: {
//     warningThreshold: 2,
//     autoSubmitThreshold: 7,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.MULTIPLE_FACES]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 3,
//     severity: ViolationSeverity.HIGH
//   },
//   [ViolationType.FACE_MISMATCH]: {
//     warningThreshold: 1,
//     autoSubmitThreshold: 3,
//     severity: ViolationSeverity.CRITICAL
//   },
//   [ViolationType.IP_CHANGE]: {
//     warningThreshold: 0,
//     autoSubmitThreshold: 1,
//     severity: ViolationSeverity.CRITICAL
//   },
//   [ViolationType.LOCATION_CHANGE]: {
//     warningThreshold: 0,
//     autoSubmitThreshold: 1,
//     severity: ViolationSeverity.CRITICAL
//   },
//   [ViolationType.COPY_PASTE]: {
//     warningThreshold: 3,
//     autoSubmitThreshold: 8,
//     severity: ViolationSeverity.MEDIUM
//   }
// };

// export function ProctorProvider({ children }) {
//   const [violations, setViolations] = useState([]);
//   const [violationCounts, setViolationCounts] = useState(
//     Object.keys(ViolationType).reduce((acc, key) => {
//       acc[ViolationType[key]] = 0;
//       return acc;
//     }, {})
//   );

//   const violationCountsRef = useRef(violationCounts);
//   const [isProctoringActive, setIsProctoringActive] = useState(false);
//   const [assessmentId, setAssessmentId] = useState(null);
//   const [attemptId, setAttemptId] = useState(null);

//   const assessmentIdRef = useRef(null);
//   const attemptIdRef = useRef(null);

//   const [violationQueue, setViolationQueue] = useState([]);
//   const violationQueueRef = useRef([]);
//   const batchIntervalRef = useRef(null);

//   const [initialLocation, setInitialLocation] = useState(null);
//   const [initialIP, setInitialIP] = useState(null);

//   const [onAutoSubmit, setOnAutoSubmit] = useState(null);
//   const onAutoSubmitRef = useRef(null);

//   /**
//    * Store violation in localStorage as backup
//    * FIXED: Defined before usage to avoid dependency issues
//    */
//   const storeViolationLocally = useCallback((violation) => {
//     try {
//       const key = `violations_${attemptIdRef.current}`;
//       const existing = JSON.parse(localStorage.getItem(key) || '[]');
//       existing.push(violation);
//       localStorage.setItem(key, JSON.stringify(existing));
//     } catch (error) {
//       console.error('Failed to store violation locally:', error);
//     }
//   }, []);

//   /**
//    * Send violations in batch
//    * FIXED: Removed circular dependency
//    */
//   const sendViolationsBatch = useCallback(async (batch) => {
//     if (batch.length === 0) return;

//     try {
//       await apiClient.post(
//         `/assessments/${assessmentIdRef.current}/attempts/${attemptIdRef.current}/violations/batch`,
//         {
//           violations: batch.map(v => ({
//             type: v.type,
//             timestamp: v.timestamp,
//             details: v.details,
//             severity: v.severity,
//             count: v.count
//           }))
//         }
//       );
//       console.log(`Batch of ${batch.length} violations sent successfully`);

//       // Clear queue
//       setViolationQueue([]);
//       violationQueueRef.current = []; // FIXED: Also clear ref
//     } catch (error) {
//       console.error('Failed to send violation batch:', error);
//       batch.forEach(v => storeViolationLocally(v));
//     }
//   }, [storeViolationLocally]);

//   /**
//    * Start proctoring session
//    * FIXED: Sync violationCountsRef properly
//    */
//   const startProctoring = useCallback((assessId, attemId, autoSubmitCallback) => {
//     setIsProctoringActive(true);
//     setAssessmentId(assessId);
//     setAttemptId(attemId);

//     assessmentIdRef.current = assessId;
//     attemptIdRef.current = attemId;

//     setOnAutoSubmit(() => autoSubmitCallback);
//     onAutoSubmitRef.current = autoSubmitCallback;

//     // Reset violations
//     setViolations([]);
//     const initialCounts = Object.keys(ViolationType).reduce((acc, key) => {
//       acc[ViolationType[key]] = 0;
//       return acc;
//     }, {});
//     setViolationCounts(initialCounts);
//     violationCountsRef.current = initialCounts; // FIXED: Sync ref
//     setViolationQueue([]);
//     violationQueueRef.current = []; // FIXED: Also reset ref
//   }, []);

//   /**
//    * Stop proctoring session
//    */
//   const stopProctoring = useCallback(() => {
//     setIsProctoringActive(false);

//     // Send remaining violations
//     if (violationQueueRef.current.length > 0) {
//       sendViolationsBatch(violationQueueRef.current);
//     }

//     // Clear batch interval
//     if (batchIntervalRef.current) {
//       clearInterval(batchIntervalRef.current);
//       batchIntervalRef.current = null;
//     }
//   }, [sendViolationsBatch]);

//   /**
//    * Send violation immediately (for critical violations)
//    */
//   const sendViolationImmediate = useCallback(async (violation) => {
//     try {
//       await apiClient.post(
//         `/assessments/${violation.assessmentId}/attempts/${violation.attemptId}/violations`,
//         {
//           type: violation.type,
//           timestamp: violation.timestamp,
//           details: violation.details,
//           severity: violation.severity,
//           count: violation.count
//         }
//       );
//       console.log('Critical violation sent immediately:', violation.id);
//     } catch (error) {
//       console.error('Failed to send critical violation:', error);
//       storeViolationLocally(violation);
//     }
//   }, [storeViolationLocally]);

//   /**
//    * Log a violation
//    */
//   const logViolation = useCallback((type, details = {}, customSeverity = null) => {
//     if (!isProctoringActive) {
//       console.warn('[Proctoring] Not active, violation not logged:', type);
//       return;
//     }

//     const config = VIOLATION_THRESHOLDS[type];
//     if (!config) {
//       console.error('[Proctoring] Unknown violation type:', type);
//       return;
//     }

//     const severity = customSeverity || config.severity;
//     const timestamp = new Date().toISOString();
//     const newCount = (violationCountsRef.current[type] || 0) + 1;

//     const violation = {
//       id: uuidv4(),
//       attemptId: attemptIdRef.current,
//       assessmentId: assessmentIdRef.current,
//       type,
//       timestamp,
//       details,
//       severity,
//       count: newCount
//     };

//     console.log(
//       `%c[Proctoring Violation] ${type}`,
//       `color: ${severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : severity === 'MEDIUM' ? '#d97706' : '#65a30d'}; font-weight: bold;`,
//       `\nCount: ${newCount}/${config.autoSubmitThreshold}`,
//       `\nSeverity: ${severity}`,
//       `\nDetails:`, details,
//       `\nTimestamp: ${timestamp}`
//     );

//     setViolations(prev => [...prev, violation]);
//     setViolationCounts(prev => {
//       const updated = {
//         ...prev,
//         [type]: newCount
//       };
//       violationCountsRef.current = updated;
//       return updated;
//     });

//     setViolationQueue(prev => {
//       const updated = [...prev, violation];
//       violationQueueRef.current = updated; // FIXED: Sync ref immediately
//       return updated;
//     });

//     // Check auto-submit
//     if (newCount >= config.autoSubmitThreshold) {
//       console.warn(
//         `%c[Proctoring] AUTO-SUBMIT TRIGGERED`,
//         'color: #dc2626; font-weight: bold; font-size: 14px;',
//         `\nViolation: ${type}`,
//         `\nCount: ${newCount}/${config.autoSubmitThreshold}`
//       );
//       if (onAutoSubmitRef.current) {
//         onAutoSubmitRef.current(type, newCount);
//       }
//     }

//     // Send immediately if critical
//     if (severity === ViolationSeverity.CRITICAL) {
//       sendViolationImmediate(violation);
//     }
//   }, [isProctoringActive, sendViolationImmediate]);

//   /**
//    * Get violation summary
//    */
//   const getViolationSummary = useCallback(() => {
//     return {
//       total: violations.length,
//       counts: violationCounts,
//       byType: Object.keys(ViolationType).map(key => ({
//         type: ViolationType[key],
//         count: violationCounts[ViolationType[key]],
//         threshold: VIOLATION_THRESHOLDS[ViolationType[key]].autoSubmitThreshold
//       })),
//       critical: violations.filter(v => v.severity === ViolationSeverity.CRITICAL).length,
//       high: violations.filter(v => v.severity === ViolationSeverity.HIGH).length,
//       medium: violations.filter(v => v.severity === ViolationSeverity.MEDIUM).length,
//       low: violations.filter(v => v.severity === ViolationSeverity.LOW).length
//     };
//   }, [violations, violationCounts]);

//   /**
//    * Check if should show warning
//    */
//   const shouldShowWarning = useCallback((type) => {
//     const config = VIOLATION_THRESHOLDS[type];
//     const count = violationCounts[type];
//     return count >= config.warningThreshold && count < config.autoSubmitThreshold;
//   }, [violationCounts]);

//   /**
//    * Check if should auto-submit
//    */
//   const shouldAutoSubmitForViolations = useCallback(() => {
//     return Object.keys(ViolationType).some(key => {
//       const type = ViolationType[key];
//       const config = VIOLATION_THRESHOLDS[type];
//       return violationCounts[type] >= config.autoSubmitThreshold;
//     });
//   }, [violationCounts]);

//   // REMOVED: violationQueue useEffect (now synced directly in logViolation)

//   // Batch sending interval
//   useEffect(() => {
//     if (isProctoringActive) {
//       batchIntervalRef.current = setInterval(() => {
//         if (violationQueueRef.current.length > 0) {
//           sendViolationsBatch(violationQueueRef.current);
//         }
//       }, 30000);

//       return () => {
//         if (batchIntervalRef.current) {
//           clearInterval(batchIntervalRef.current);
//         }
//       };
//     }
//   }, [isProctoringActive, sendViolationsBatch]);

//   const value = {
//     violations,
//     violationCounts,
//     isProctoringActive,
//     assessmentId,
//     attemptId,
//     initialLocation,
//     initialIP,
//     setInitialLocation,
//     setInitialIP,
//     startProctoring,
//     stopProctoring,
//     logViolation,
//     getViolationSummary,
//     shouldShowWarning,
//     shouldAutoSubmitForViolations,
//     ViolationType,
//     ViolationSeverity,
//     VIOLATION_THRESHOLDS
//   };

//   return (
//     <ProctorContext.Provider value={value}>
//       {children}
//     </ProctorContext.Provider>
//   );
// }

// export function useProctorContext() {
//   const context = useContext(ProctorContext);
//   if (!context) {
//     throw new Error('useProctorContext must be used within ProctorProvider');
//   }
//   return context;
// }


import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import { v4 as uuidv4 } from 'uuid';

const ProctorContext = createContext();

// Violation types
export const ViolationType = {
  TAB_SWITCH: 'TAB_SWITCH',
  RIGHT_CLICK: 'RIGHT_CLICK',
  KEYBOARD_SHORTCUT: 'KEYBOARD_SHORTCUT',
  DEVTOOLS_OPEN: 'DEVTOOLS_OPEN',
  NEW_WINDOW_ATTEMPT: 'NEW_WINDOW_ATTEMPT',
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
  NO_FACE_DETECTED: 'NO_FACE_DETECTED',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  FACE_MISMATCH: 'FACE_MISMATCH',
  LOOKING_AWAY: 'LOOKING_AWAY',
  FACE_NOT_CENTERED: 'FACE_NOT_CENTERED',
  FACE_TOO_CLOSE: 'FACE_TOO_CLOSE',
  FACE_TOO_FAR: 'FACE_TOO_FAR',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  IP_CHANGE: 'IP_CHANGE',
  LOCATION_CHANGE: 'LOCATION_CHANGE',
  COPY_PASTE: 'COPY_PASTE',
  PAGE_BLUR: 'PAGE_BLUR'
};

// Severity levels
export const ViolationSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Violation thresholds
export const VIOLATION_THRESHOLDS = {
  [ViolationType.TAB_SWITCH]: {
    warningThreshold: 1,
    autoSubmitThreshold: 3,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.PAGE_BLUR]: {
    warningThreshold: 3,
    autoSubmitThreshold: 5,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.RIGHT_CLICK]: {
    warningThreshold: 3,
    autoSubmitThreshold: 5,
    severity: ViolationSeverity.LOW
  },
  [ViolationType.KEYBOARD_SHORTCUT]: {
    warningThreshold: 3,
    autoSubmitThreshold: 5,
    severity: ViolationSeverity.MEDIUM
  },
  [ViolationType.DEVTOOLS_OPEN]: {
    warningThreshold: 1,
    autoSubmitThreshold: 2,
    severity: ViolationSeverity.CRITICAL
  },
  [ViolationType.NEW_WINDOW_ATTEMPT]: {
    warningThreshold: 1,
    autoSubmitThreshold: 3,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.FULLSCREEN_EXIT]: {
    warningThreshold: 1,
    autoSubmitThreshold: 3,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.NO_FACE_DETECTED]: {
    warningThreshold: 2,
    autoSubmitThreshold: 7,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.MULTIPLE_FACES]: {
    warningThreshold: 1,
    autoSubmitThreshold: 3,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.FACE_MISMATCH]: {
    warningThreshold: 1,
    autoSubmitThreshold: 3,
    severity: ViolationSeverity.CRITICAL
  },
  [ViolationType.LOOKING_AWAY]: {
    warningThreshold: 2,
    autoSubmitThreshold: 6,
    severity: ViolationSeverity.HIGH
  },
  [ViolationType.FACE_NOT_CENTERED]: {
    warningThreshold: 5,
    autoSubmitThreshold: 10,
    severity: ViolationSeverity.MEDIUM
  },
  [ViolationType.FACE_TOO_CLOSE]: {
    warningThreshold: 5,
    autoSubmitThreshold: 10,
    severity: ViolationSeverity.MEDIUM
  },
  [ViolationType.FACE_TOO_FAR]: {
    warningThreshold: 5,
    autoSubmitThreshold: 10,
    severity: ViolationSeverity.MEDIUM
  },
  [ViolationType.LOW_CONFIDENCE]: {
    warningThreshold: 5,
    autoSubmitThreshold: 10,
    severity: ViolationSeverity.MEDIUM
  },
  [ViolationType.IP_CHANGE]: {
    warningThreshold: 0,
    autoSubmitThreshold: 1,
    severity: ViolationSeverity.CRITICAL
  },
  [ViolationType.LOCATION_CHANGE]: {
    warningThreshold: 0,
    autoSubmitThreshold: 1,
    severity: ViolationSeverity.CRITICAL
  },
  [ViolationType.COPY_PASTE]: {
    warningThreshold: 3,
    autoSubmitThreshold: 8,
    severity: ViolationSeverity.MEDIUM
  }
};

export function ProctorProvider({ children }) {
  const [violations, setViolations] = useState([]);
  const [violationCounts, setViolationCounts] = useState(
    Object.keys(ViolationType).reduce((acc, key) => {
      acc[ViolationType[key]] = 0;
      return acc;
    }, {})
  );

  const violationCountsRef = useRef(violationCounts);
  
  // FIXED: Added ref for isProctoringActive
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const isProctoringActiveRef = useRef(false);
  
  const [assessmentId, setAssessmentId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  const assessmentIdRef = useRef(null);
  const attemptIdRef = useRef(null);

  const [violationQueue, setViolationQueue] = useState([]);
  const violationQueueRef = useRef([]);
  const batchIntervalRef = useRef(null);

  const [initialLocation, setInitialLocation] = useState(null);
  const [initialIP, setInitialIP] = useState(null);

  const [onAutoSubmit, setOnAutoSubmit] = useState(null);
  const onAutoSubmitRef = useRef(null);

  /**
   * Store violation in localStorage as backup
   */
  const storeViolationLocally = useCallback((violation) => {
    try {
      const key = `violations_${attemptIdRef.current}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(violation);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store violation locally:', error);
    }
  }, []);

  /**
   * Send violations in batch
   */
  const sendViolationsBatch = useCallback(async (batch) => {
    if (batch.length === 0) return;

    try {
      await apiClient.post(
        `/assessments/${assessmentIdRef.current}/attempts/${attemptIdRef.current}/violations/batch`,
        {
          violations: batch.map(v => ({
            type: v.type,
            timestamp: v.timestamp,
            details: v.details,
            severity: v.severity,
            count: v.count
          }))
        }
      );
      console.log(`✅ Batch of ${batch.length} violations sent successfully`);

      // Clear queue
      setViolationQueue([]);
      violationQueueRef.current = [];
    } catch (error) {
      console.error('Failed to send violation batch:', error);
      batch.forEach(v => storeViolationLocally(v));
    }
  }, [storeViolationLocally]);

  /**
   * Start proctoring session
   * FIXED: Sync isProctoringActiveRef
   */
  const startProctoring = useCallback((assessId, attemId, autoSubmitCallback) => {
    console.log('[ProctorContext] Starting proctoring session');
    
    setIsProctoringActive(true);
    isProctoringActiveRef.current = true; // FIXED: Sync ref
    
    setAssessmentId(assessId);
    setAttemptId(attemId);

    assessmentIdRef.current = assessId;
    attemptIdRef.current = attemId;

    setOnAutoSubmit(() => autoSubmitCallback);
    onAutoSubmitRef.current = autoSubmitCallback;

    // Reset violations
    setViolations([]);
    const initialCounts = Object.keys(ViolationType).reduce((acc, key) => {
      acc[ViolationType[key]] = 0;
      return acc;
    }, {});
    setViolationCounts(initialCounts);
    violationCountsRef.current = initialCounts;
    setViolationQueue([]);
    violationQueueRef.current = [];
  }, []);

  /**
   * Stop proctoring session
   * FIXED: Sync isProctoringActiveRef
   */
  const stopProctoring = useCallback(() => {
    console.log('[ProctorContext] Stopping proctoring session');
    
    setIsProctoringActive(false);
    isProctoringActiveRef.current = false; // FIXED: Sync ref

    // Send remaining violations
    if (violationQueueRef.current.length > 0) {
      sendViolationsBatch(violationQueueRef.current);
    }

    // Clear batch interval
    if (batchIntervalRef.current) {
      clearInterval(batchIntervalRef.current);
      batchIntervalRef.current = null;
    }
  }, [sendViolationsBatch]);

  /**
   * Send violation immediately (for critical violations)
   */
  const sendViolationImmediate = useCallback(async (violation) => {
    try {
      await apiClient.post(
        `/assessments/${violation.assessmentId}/attempts/${violation.attemptId}/violations`,
        {
          type: violation.type,
          timestamp: violation.timestamp,
          details: violation.details,
          severity: violation.severity,
          count: violation.count
        }
      );
      console.log('⚠️ Critical violation sent immediately:', violation.id);
    } catch (error) {
      console.error('Failed to send critical violation:', error);
      storeViolationLocally(violation);
    }
  }, [storeViolationLocally]);

  /**
   * Log a violation
   * FIXED: Use isProctoringActiveRef instead of state
   * FIXED: Removed isProctoringActive from dependencies
   */
  const logViolation = useCallback((type, details = {}, customSeverity = null) => {
    // FIXED: Use ref instead of state
    if (!isProctoringActiveRef.current) {
      console.warn('[Proctoring] Not active, violation not logged:', type);
      return;
    }

    const config = VIOLATION_THRESHOLDS[type];
    if (!config) {
      console.error('[Proctoring] Unknown violation type:', type);
      return;
    }

    const severity = customSeverity || config.severity;
    const timestamp = new Date().toISOString();
    const newCount = (violationCountsRef.current[type] || 0) + 1;

    const violation = {
      id: uuidv4(),
      attemptId: attemptIdRef.current,
      assessmentId: assessmentIdRef.current,
      type,
      timestamp,
      details,
      severity,
      count: newCount
    };

    console.log(
      `%c[Proctoring Violation] ${type}`,
      `color: ${severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : severity === 'MEDIUM' ? '#d97706' : '#65a30d'}; font-weight: bold;`,
      `\nCount: ${newCount}/${config.autoSubmitThreshold}`,
      `\nSeverity: ${severity}`,
      `\nDetails:`, details,
      `\nTimestamp: ${timestamp}`
    );

    setViolations(prev => [...prev, violation]);
    setViolationCounts(prev => {
      const updated = {
        ...prev,
        [type]: newCount
      };
      violationCountsRef.current = updated;
      return updated;
    });

    setViolationQueue(prev => {
      const updated = [...prev, violation];
      violationQueueRef.current = updated;
      return updated;
    });

    // Check auto-submit
    if (newCount >= config.autoSubmitThreshold) {
      console.warn(
        `%c[Proctoring] AUTO-SUBMIT TRIGGERED`,
        'color: #dc2626; font-weight: bold; font-size: 14px;',
        `\nViolation: ${type}`,
        `\nCount: ${newCount}/${config.autoSubmitThreshold}`
      );
      if (onAutoSubmitRef.current) {
        onAutoSubmitRef.current(type, newCount);
      }
    }

    // Send immediately if critical
    if (severity === ViolationSeverity.CRITICAL) {
      sendViolationImmediate(violation);
    }
  }, [sendViolationImmediate]); // FIXED: Removed isProctoringActive

  /**
   * Get violation summary
   */
  const getViolationSummary = useCallback(() => {
    return {
      total: violations.length,
      counts: violationCounts,
      byType: Object.keys(ViolationType).map(key => ({
        type: ViolationType[key],
        count: violationCounts[ViolationType[key]],
        threshold: VIOLATION_THRESHOLDS[ViolationType[key]].autoSubmitThreshold
      })),
      critical: violations.filter(v => v.severity === ViolationSeverity.CRITICAL).length,
      high: violations.filter(v => v.severity === ViolationSeverity.HIGH).length,
      medium: violations.filter(v => v.severity === ViolationSeverity.MEDIUM).length,
      low: violations.filter(v => v.severity === ViolationSeverity.LOW).length
    };
  }, [violations, violationCounts]);

  /**
   * Check if should show warning
   */
  const shouldShowWarning = useCallback((type) => {
    const config = VIOLATION_THRESHOLDS[type];
    const count = violationCounts[type];
    return count >= config.warningThreshold && count < config.autoSubmitThreshold;
  }, [violationCounts]);

  /**
   * Check if should auto-submit
   */
  const shouldAutoSubmitForViolations = useCallback(() => {
    return Object.keys(ViolationType).some(key => {
      const type = ViolationType[key];
      const config = VIOLATION_THRESHOLDS[type];
      return violationCounts[type] >= config.autoSubmitThreshold;
    });
  }, [violationCounts]);

  /**
   * Batch sending interval
   * FIXED: Use isProctoringActiveRef and removed from dependencies
   */
  useEffect(() => {
    // FIXED: Use ref instead of state
    if (isProctoringActiveRef.current) {
      console.log('[ProctorContext] Starting batch violation sending interval (30s)');
      
      batchIntervalRef.current = setInterval(() => {
        if (violationQueueRef.current.length > 0) {
          console.log(`[ProctorContext] Sending batch of ${violationQueueRef.current.length} violations`);
          sendViolationsBatch(violationQueueRef.current);
        }
      }, 30000);

      return () => {
        if (batchIntervalRef.current) {
          console.log('[ProctorContext] Clearing batch interval');
          clearInterval(batchIntervalRef.current);
        }
      };
    }
  }, [sendViolationsBatch]); // FIXED: Removed isProctoringActive

  const value = {
    violations,
    violationCounts,
    isProctoringActive,
    assessmentId,
    attemptId,
    initialLocation,
    initialIP,
    setInitialLocation,
    setInitialIP,
    startProctoring,
    stopProctoring,
    logViolation,
    getViolationSummary,
    shouldShowWarning,
    shouldAutoSubmitForViolations,
    ViolationType,
    ViolationSeverity,
    VIOLATION_THRESHOLDS
  };

  return (
    <ProctorContext.Provider value={value}>
      {children}
    </ProctorContext.Provider>
  );
}

export function useProctorContext() {
  const context = useContext(ProctorContext);
  if (!context) {
    throw new Error('useProctorContext must be used within ProctorProvider');
  }
  return context;
}
