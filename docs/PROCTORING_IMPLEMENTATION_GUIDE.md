# Browser Restrictions & Proctoring System - Implementation Guide

## ✅ COMPLETED COMPONENTS

All the core infrastructure has been created and is ready to use. Here's what's been implemented:

### **1. Core System Files**

| File | Purpose | Status |
|------|---------|--------|
| `frontend/src/context/ProctorContext.jsx` | Centralized violation management | ✅ Complete |
| `frontend/src/hooks/useBrowserRestrictions.js` | All browser security restrictions | ✅ Complete |
| `frontend/src/hooks/useWebcamMonitoring.js` | Continuous face detection | ✅ Complete |
| `frontend/src/utils/locationTracking.js` | IP & geolocation tracking | ✅ Complete |
| `frontend/src/features/shared/Toast.jsx` | Toast notifications system | ✅ Complete |
| `frontend/src/features/shared/ViolationWarningModal.jsx` | Violation warning UI | ✅ Complete |
| `frontend/src/features/shared/SecurityWatermark.jsx` | Security watermark overlay | ✅ Complete |
| `frontend/src/main.jsx` | ProctorProvider added | ✅ Complete |

---

## 🎯 WHAT EACH SYSTEM DOES

### **ProctorContext** (`context/ProctorContext.jsx`)
**Purpose:** Centralized violation tracking and management

**Features:**
- Tracks all violation types (tab switch, right-click, keyboard shortcuts, etc.)
- Maintains violation counts per type
- Automatic threshold checking (warnings + auto-submit)
- Batch violation sending to backend (every 30 seconds)
- Critical violations sent immediately
- LocalStorage backup for offline scenarios

**Violation Types Supported:**
```javascript
- TAB_SWITCH (5 violations = auto-submit)
- PAGE_BLUR (7 violations = auto-submit)
- RIGHT_CLICK (15 violations = auto-submit)
- KEYBOARD_SHORTCUT (10 violations = auto-submit)
- DEVTOOLS_OPEN (1 violation = auto-submit) [CRITICAL]
- NEW_WINDOW_ATTEMPT (3 violations = auto-submit)
- FULLSCREEN_EXIT (3 violations = auto-submit)
- NO_FACE_DETECTED (5 violations = auto-submit)
- MULTIPLE_FACES (3 violations = auto-submit)
- IP_CHANGE (1 violation = auto-submit) [CRITICAL]
- LOCATION_CHANGE (1 violation = auto-submit) [CRITICAL]
- COPY_PASTE (8 violations = auto-submit)
```

**API:**
```javascript
const {
  startProctoring,          // Start tracking violations
  stopProctoring,           // Stop tracking
  logViolation,             // Log a violation
  getViolationSummary,      // Get summary for submission
  shouldShowWarning,        // Check if should show warning
  shouldAutoSubmitForViolations, // Check if should auto-submit
  ViolationType,            // Violation type constants
  VIOLATION_THRESHOLDS      // Threshold configuration
} = useProctorContext();
```

---

### **useBrowserRestrictions** Hook
**Purpose:** Implements all keyboard/mouse/window restrictions

**Features:**
- ✅ Tab switching detection (`visibilitychange` + `blur` events)
- ✅ Right-click blocking (`contextmenu` prevention)
- ✅ Keyboard shortcut blocking (Ctrl+C/V/X/A/S/P/U, F12, etc.)
- ✅ Copy/Paste detection
- ✅ New window/tab blocking (override `window.open`)
- ✅ Developer tools detection (2 methods)
- ✅ Before unload warning

**Usage:**
```javascript
useBrowserRestrictions({
  enabled: true,
  onWarning: (violationType) => {
    // Show toast or modal warning
  },
  onCriticalViolation: (violationType) => {
    // Handle critical violations (e.g., devtools)
  }
});
```

---

### **useWebcamMonitoring** Hook
**Purpose:** Continuous face detection during assessment

**Features:**
- Real-time face detection (every 5 seconds)
- No face detection with duration tracking
- Multiple faces detection
- Automatic violation logging
- Warning after 10 seconds, critical after 30 seconds

**Usage:**
```javascript
const { isMonitoring, faces } = useWebcamMonitoring({
  enabled: true,
  interval: 5000, // Check every 5 seconds
  onWarning: (violationType) => {},
  onCritical: (violationType, duration) => {}
});
```

---

### **Location Tracking** (`utils/locationTracking.js`)
**Purpose:** IP and geolocation monitoring

**Features:**
- Get IP address via `ipapi.co` API
- Get geolocation via browser Geolocation API
- Monitor for IP changes
- Monitor for location changes (> 1km threshold)
- Automatic periodic checking

**Usage:**
```javascript
// Get initial location
const locationData = await getCombinedLocationData();

// Monitor for changes
const cleanup = monitorLocationChanges(
  initialData,
  (newIP, oldIP) => {
    // IP changed - log violation
  },
  (newLocation, oldLocation) => {
    // Location changed - log violation
  },
  60000 // Check every 1 minute
);
```

---

## 📋 INTEGRATION CHECKLIST FOR ASSESSMENTPAGE

You need to integrate all these systems into `AssessmentPage.jsx`. Here's the step-by-step checklist:

### **Step 1: Add State Variables**
```javascript
// Proctoring state
const [violationModalOpen, setViolationModalOpen] = useState(false);
const [currentViolationType, setCurrentViolationType] = useState(null);
const [proctoringInitialized, setProctoringInitialized] = useState(false);
```

### **Step 2: Initialize Proctoring on Assessment Start**
```javascript
useEffect(() => {
  if (assessment && !proctoringInitialized) {
    // Start proctoring
    startProctoring(assessmentId, attemptId, handleViolationAutoSubmit);

    // Capture initial location
    getCombinedLocationData().then(data => {
      if (data.ip) setInitialIP(data.ip.ip);
      if (data.geolocation) setInitialLocation(data.geolocation);
    });

    setProctoringInitialized(true);
  }
}, [assessment, proctoringInitialized]);
```

### **Step 3: Enable Browser Restrictions**
```javascript
// Enable all browser restrictions
useBrowserRestrictions({
  enabled: proctoringInitialized,
  onWarning: handleViolationWarning,
  onCriticalViolation: handleCriticalViolation
});
```

### **Step 4: Enable Webcam Monitoring**
```javascript
// Enable webcam monitoring
useWebcamMonitoring({
  enabled: proctoringInitialized,
  interval: 5000,
  onWarning: handleViolationWarning,
  onCritical: handleCriticalViolation
});
```

### **Step 5: Monitor Location Changes**
```javascript
useEffect(() => {
  if (!proctoringInitialized) return;

  const cleanup = monitorLocationChanges(
    { ip: initialIP, geolocation: initialLocation },
    (newIP) => {
      logViolation(ViolationType.IP_CHANGE, {
        oldIP: initialIP,
        newIP: newIP.ip
      });
      toast.violation('IP address changed! This is a critical violation.');
    },
    (newLocation) => {
      logViolation(ViolationType.LOCATION_CHANGE, {
        oldLocation: initialLocation,
        newLocation
      });
    }
  );

  return cleanup;
}, [proctoringInitialized, initialIP, initialLocation]);
```

### **Step 6: Handle Violation Warnings**
```javascript
const handleViolationWarning = (violationType) => {
  if (shouldShowWarning(violationType)) {
    setCurrentViolationType(violationType);
    setViolationModalOpen(true);
  } else {
    // Show toast for minor violations
    toast.violation(`Violation detected: ${violationType}`);
  }
};

const handleCriticalViolation = (violationType) => {
  toast.error(`Critical violation: ${violationType}. Assessment will be auto-submitted.`);
  // Auto-submit immediately
  setTimeout(() => {
    handleViolationAutoSubmit(violationType);
  }, 2000);
};
```

### **Step 7: Check for Auto-Submit**
```javascript
useEffect(() => {
  if (shouldAutoSubmitForViolations()) {
    handleViolationAutoSubmit('THRESHOLD_EXCEEDED');
  }
}, [shouldAutoSubmitForViolations]);
```

### **Step 8: Update Submit Function**
```javascript
const submitAssessment = useCallback(async (reason = 'MANUAL') => {
  try {
    // Get violation summary
    const violationSummary = getViolationSummary();

    // Stop proctoring
    stopProctoring();

    // TODO: Submit to backend with violations
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

    navigate("/assessment-complete");
  } catch (error) {
    console.error("Error submitting assessment:", error);
    toast.error("Failed to submit assessment");
  }
}, [answers, getViolationSummary, fullscreenExitCount, totalTimeOutsideFullscreen]);
```

### **Step 9: Add UI Components to JSX**
```javascript
return (
  <div className="min-h-screen bg-gray-50">
    {/* Security Watermark */}
    <SecurityWatermark
      assessmentId={assessmentId}
      candidateName={user?.name || 'Candidate'}
      attemptId={attemptId}
    />

    {/* Toast Notifications */}
    <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

    {/* Fullscreen Warning Overlay */}
    <FullscreenWarningOverlay onAutoSubmit={handleFullscreenAutoSubmit} />

    {/* Violation Warning Modal */}
    <ViolationWarningModal
      isOpen={violationModalOpen}
      violationType={currentViolationType}
      currentCount={violationCounts[currentViolationType] || 0}
      threshold={VIOLATION_THRESHOLDS[currentViolationType]?.autoSubmitThreshold || 5}
      onClose={() => setViolationModalOpen(false)}
    />

    {/* Rest of your assessment UI */}
    ...
  </div>
);
```

---

## 🔧 BACKEND API ENDPOINTS NEEDED

Your backend needs to implement these endpoints:

### **1. Log Single Violation**
```
POST /api/assessments/:assessmentId/attempts/:attemptId/violations

Body:
{
  "type": "TAB_SWITCH",
  "timestamp": "2025-01-10T12:34:56.789Z",
  "details": {
    "action": "hidden",
    "duration": "30s"
  },
  "severity": "HIGH",
  "count": 3
}

Response:
{
  "success": true,
  "message": "Violation logged successfully"
}
```

### **2. Batch Log Violations**
```
POST /api/assessments/:assessmentId/attempts/:attemptId/violations/batch

Body:
{
  "violations": [
    {
      "type": "TAB_SWITCH",
      "timestamp": "...",
      "details": {...},
      "severity": "HIGH",
      "count": 1
    },
    ...
  ]
}

Response:
{
  "success": true,
  "message": "Batch violations logged",
  "count": 5
}
```

### **3. Submit Assessment with Violations**
```
POST /api/assessments/:assessmentId/attempts/:attemptId/submit

Body:
{
  "answers": {...},
  "violations": {
    "total": 15,
    "counts": {
      "TAB_SWITCH": 3,
      "RIGHT_CLICK": 5,
      ...
    },
    "critical": 0,
    "high": 3,
    "medium": 8,
    "low": 4
  },
  "fullscreenViolations": {
    "exitCount": 2,
    "totalTimeOutside": 120
  },
  "submitReason": "MANUAL" | "TIME_UP" | "VIOLATION_THRESHOLD" | "FULLSCREEN_VIOLATION",
  "timestamp": "2025-01-10T12:34:56.789Z"
}
```

---

## 🚀 QUICK START INTEGRATION

**Minimal integration (just copy this into AssessmentPage):**

```javascript
// 1. Add to imports
import { useProctorContext } from "../../context/ProctorContext";
import { useBrowserRestrictions } from "../../hooks/useBrowserRestrictions";
import { ToastContainer, useToast } from "../shared/Toast";
import SecurityWatermark from "../shared/SecurityWatermark";

// 2. Add to component
const { startProctoring, stopProctoring } = useProctorContext();
const toast = useToast();

// 3. Start proctoring when assessment loads
useEffect(() => {
  if (assessment) {
    startProctoring(assessmentId, attemptId, () => {
      toast.error("Assessment auto-submitted due to violations");
      submitAssessment('VIOLATION_THRESHOLD');
    });
  }
  return () => stopProctoring();
}, [assessment]);

// 4. Enable restrictions
useBrowserRestrictions({
  enabled: !!assessment,
  onWarning: (type) => toast.warning(`Warning: ${type}`),
  onCriticalViolation: () => submitAssessment('CRITICAL_VIOLATION')
});

// 5. Add to JSX
<SecurityWatermark assessmentId={assessmentId} candidateName="Student" attemptId={attemptId} />
<ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
```

---

## 📊 VIOLATION THRESHOLDS (CONFIGURABLE)

All thresholds are defined in `ProctorContext.jsx` and can be adjusted:

```javascript
export const VIOLATION_THRESHOLDS = {
  TAB_SWITCH: { warningThreshold: 2, autoSubmitThreshold: 5 },
  RIGHT_CLICK: { warningThreshold: 5, autoSubmitThreshold: 15 },
  // ... etc
};
```

---

## ✅ TESTING CHECKLIST

Test each feature:

- [ ] Tab switching detected and logged
- [ ] Right-click blocked and logged
- [ ] Ctrl+C/V blocked
- [ ] F12 (devtools) detected
- [ ] Multiple faces detected
- [ ] No face detected (after 10s warning)
- [ ] IP change detected
- [ ] Toast notifications appear
- [ ] Warning modal shows at threshold
- [ ] Auto-submit at violation threshold
- [ ] Security watermark visible
- [ ] Violations sent to backend
- [ ] Assessment submission includes violation summary

---

## 🎯 NEXT STEPS

1. ✅ All core components are ready
2. ⏳ Integrate into AssessmentPage (follow checklist above)
3. ⏳ Implement backend API endpoints
4. ⏳ Test each restriction type
5. ⏳ Adjust thresholds based on testing
6. ⏳ Add analytics/reporting for violations

---

**Need help with integration? Ask me specific questions about any component!**
