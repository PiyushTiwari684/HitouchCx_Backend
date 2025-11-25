// import { useEffect, useCallback, useRef } from 'react';
// import { useProctorContext } from '../context/ProctorContext';

// /**
//  * Custom hook for comprehensive browser restrictions
//  * Handles all security features: tab switching, keyboard blocking, right-click, etc.
//  */
// export function useBrowserRestrictions({
//   enabled = false,
//   onWarning,
//   onCriticalViolation // 🔄 NOTE: No longer used since DevTools detection moved to FullscreenWarningOverlay
// } = {}) {
//   const { logViolation, ViolationType } = useProctorContext();
//   const tabSwitchTimeRef = useRef(null);
//   // 🗑️ REMOVED: devToolsCheckIntervalRef - no longer needed
//   // const devToolsCheckIntervalRef = useRef(null);

//   /**
//    * 1. TAB SWITCHING / VISIBILITY DETECTION
//    * Also catches Windows overlays (Copilot, Widgets, etc.)
//    */
//   const handleVisibilityChange = useCallback(() => {
//     if (!enabled) return;

//     if (document.hidden || document.visibilityState === 'hidden') {
//       // Tab switched away, minimized, or Windows overlay appeared
//       tabSwitchTimeRef.current = Date.now();

//       // Check if fullscreen is still active - if yes, likely an overlay
//       const isFullscreen = document.fullscreenElement !== null;

//       logViolation(ViolationType.TAB_SWITCH, {
//         action: 'hidden',
//         reason: isFullscreen ? 'overlay_detected' : 'tab_switch',
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.TAB_SWITCH);
//       }
//     } else {
//       // Tab returned
//       if (tabSwitchTimeRef.current) {
//         const duration = Math.floor((Date.now() - tabSwitchTimeRef.current) / 1000);
//         logViolation(ViolationType.TAB_SWITCH, {
//           action: 'returned',
//           duration: `${duration}s`,
//           timestamp: new Date().toISOString()
//         });
//         tabSwitchTimeRef.current = null;
//       }
//     }
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   /**
//    * 2. WINDOW BLUR DETECTION
//    * Detects when window loses focus (including Windows overlays)
//    */
//   const handleWindowBlur = useCallback(() => {
//     if (!enabled) return;

//     // Check if fullscreen is still active
//     const isFullscreen = document.fullscreenElement !== null;

//     logViolation(ViolationType.PAGE_BLUR, {
//       reason: isFullscreen ? 'overlay_or_system_window' : 'window_blur',
//       timestamp: new Date().toISOString()
//     });

//     // Show alert if it seems like an overlay appeared
//     if (isFullscreen) {
//       console.warn('%c[Proctoring] Window blur detected while in fullscreen - possible overlay',
//         'color: #ea580c; font-weight: bold;');
//     }
//   }, [enabled, logViolation, ViolationType]);

//   /**
//    * 2b. DOCUMENT FOCUS DETECTION
//    * Additional layer to catch focus changes (helps detect Windows overlays)
//    */
//   const handleFocusLoss = useCallback(() => {
//     if (!enabled) return;

//     // Only log if document doesn't have focus
//     if (!document.hasFocus()) {
//       const isFullscreen = document.fullscreenElement !== null;

//       console.warn('%c[Proctoring] Document lost focus',
//         'color: #ea580c; font-weight: bold;',
//         isFullscreen ? '(overlay suspected)' : '');
//     }
//   }, [enabled]);

//   const handleFocusGain = useCallback(() => {
//     if (!enabled) return;

//     if (document.hasFocus()) {
//       console.log('%c[Proctoring] Document regained focus',
//         'color: #059669; font-weight: bold;');
//     }
//   }, [enabled]);

//   /**
//    * 3. RIGHT-CLICK BLOCKING
//    */
//   const handleContextMenu = useCallback((e) => {
//     if (!enabled) return;

//     e.preventDefault();
//     logViolation(ViolationType.RIGHT_CLICK, {
//       target: e.target.tagName,
//       timestamp: new Date().toISOString()
//     });

//     if (onWarning) {
//       onWarning(ViolationType.RIGHT_CLICK);
//     }

//     return false;
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   /**
//    * 4. KEYBOARD SHORTCUTS BLOCKING
//    */
//   const handleKeyDown = useCallback((e) => {
//     if (!enabled) return;

//     // Get the key code and key name
//     const keyCode = e.keyCode || e.which;
//     const key = e.key;

//     // SPECIAL WINDOWS KEYS DETECTION
//     // Block Windows key, Copilot key, and other special keys
//     if (key === 'Meta' || key === 'OS' || keyCode === 91 || keyCode === 92 || keyCode === 93) {
//       e.preventDefault();
//       e.stopPropagation();

//       logViolation(ViolationType.KEYBOARD_SHORTCUT, {
//         shortcut: 'Windows/Meta Key',
//         action: 'Special key blocked',
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.KEYBOARD_SHORTCUT);
//       }

//       return false;
//     }

//     // Block Copilot key (Windows Copilot) - keyCode 0xEB (235)
//     if (keyCode === 235 || key === 'LaunchApplication2' || key === 'BrowserSearch') {
//       e.preventDefault();
//       e.stopPropagation();

//       alert('⚠️ SPECIAL KEY BLOCKED!\n\nSpecial system keys (Copilot, Search, etc.) are not allowed during the assessment.\n\nThis action has been logged as a violation.');

//       logViolation(ViolationType.KEYBOARD_SHORTCUT, {
//         shortcut: 'Copilot/Special Key',
//         action: 'System overlay attempt',
//         key: key,
//         keyCode: keyCode,
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.KEYBOARD_SHORTCUT);
//       }

//       return false;
//     }

//     // List of blocked shortcuts
//     const blockedShortcuts = {
//       // Developer tools
//       'F12': 'Developer Tools',
//       'Ctrl+Shift+I': 'Developer Tools',
//       'Ctrl+Shift+i': 'Developer Tools',
//       'Ctrl+Shift+J': 'Console',
//       'Ctrl+Shift+j': 'Console',
//       'Ctrl+Shift+C': 'Inspect Element',
//       'Ctrl+Shift+c': 'Inspect Element',
//       'Cmd+Option+I': 'Developer Tools (Mac)',
//       'Cmd+Option+i': 'Developer Tools (Mac)',
//       'Cmd+Option+J': 'Console (Mac)',
//       'Cmd+Option+j': 'Console (Mac)',
//       'Cmd+Option+C': 'Inspect Element (Mac)',
//       'Cmd+Option+c': 'Inspect Element (Mac)',

//       // Copy/Paste/Cut
//       'Ctrl+C': 'Copy',
//       'Ctrl+c': 'Copy',
//       'Ctrl+V': 'Paste',
//       'Ctrl+v': 'Paste',
//       'Ctrl+X': 'Cut',
//       'Ctrl+x': 'Cut',
//       'Ctrl+A': 'Select All',
//       'Ctrl+a': 'Select All',
//       'Cmd+C': 'Copy (Mac)',
//       'Cmd+c': 'Copy (Mac)',
//       'Cmd+V': 'Paste (Mac)',
//       'Cmd+v': 'Paste (Mac)',
//       'Cmd+X': 'Cut (Mac)',
//       'Cmd+x': 'Cut (Mac)',
//       'Cmd+A': 'Select All (Mac)',
//       'Cmd+a': 'Select All (Mac)',

//       // Save/Print
//       'Ctrl+S': 'Save',
//       'Ctrl+s': 'Save',
//       'Ctrl+P': 'Print',
//       'Ctrl+p': 'Print',
//       'Cmd+S': 'Save (Mac)',
//       'Cmd+s': 'Save (Mac)',
//       'Cmd+P': 'Print (Mac)',
//       'Cmd+p': 'Print (Mac)',

//       // View source
//       'Ctrl+U': 'View Source',
//       'Ctrl+u': 'View Source',
//       'Cmd+U': 'View Source (Mac)',
//       'Cmd+u': 'View Source (Mac)',

//       // New tab/window
//       'Ctrl+N': 'New Window',
//       'Ctrl+n': 'New Window',
//       'Ctrl+T': 'New Tab',
//       'Ctrl+t': 'New Tab',
//       'Ctrl+Shift+N': 'Incognito Window',
//       'Ctrl+Shift+n': 'Incognito Window',
//       'Cmd+N': 'New Window (Mac)',
//       'Cmd+n': 'New Window (Mac)',
//       'Cmd+T': 'New Tab (Mac)',
//       'Cmd+t': 'New Tab (Mac)',
//       'Cmd+Shift+N': 'Incognito Window (Mac)',
//       'Cmd+Shift+n': 'Incognito Window (Mac)',

//       // Windows shortcuts that might escape
//       'Ctrl+Shift+Escape': 'Task Manager',
//       'Ctrl+Shift+Esc': 'Task Manager',
//       'Ctrl+Alt+Delete': 'Security Options',
//       'Ctrl+Alt+Del': 'Security Options',
//       'Alt+F4': 'Close Window',

//       // Screenshot keys
//       'PrintScreen': 'Screenshot',
//       'Ctrl+PrintScreen': 'Screenshot',
//       'Alt+PrintScreen': 'Screenshot',
//       'Shift+PrintScreen': 'Screenshot',
//       'Cmd+Shift+3': 'Screenshot (Mac)',
//       'Cmd+Shift+4': 'Screenshot (Mac)',
//       'Cmd+Shift+5': 'Screenshot (Mac)'
//     };

//     // Build current key combination string
//     let currentShortcut = '';
//     if (e.metaKey || e.key === 'Meta') currentShortcut += 'Cmd+';
//     if (e.ctrlKey) currentShortcut += 'Ctrl+';
//     if (e.shiftKey && key !== 'Shift') currentShortcut += 'Shift+';
//     if (e.altKey && key !== 'Alt') currentShortcut += 'Alt+';
//     currentShortcut += key;

//     // Check PrintScreen specifically (keyCode 44 or key 'PrintScreen')
//     const isPrintScreen = key === 'PrintScreen' || keyCode === 44 || key === 'Print';

//     if (isPrintScreen) {
//       e.preventDefault();
//       e.stopPropagation();

//       alert('⚠️ SCREENSHOT BLOCKED!\n\nScreenshots are not allowed during the assessment.\n\nThis action has been logged as a violation.');

//       logViolation(ViolationType.KEYBOARD_SHORTCUT, {
//         shortcut: 'PrintScreen',
//         action: 'Screenshot attempt',
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.KEYBOARD_SHORTCUT);
//       }

//       return false;
//     }

//     // Check if current shortcut is blocked
//     if (blockedShortcuts[currentShortcut]) {
//       e.preventDefault();
//       e.stopPropagation();

//       const actionName = blockedShortcuts[currentShortcut];

//       // Special alert for print
//       if (currentShortcut.includes('P') && (e.ctrlKey || e.metaKey)) {
//         alert(`⚠️ PRINT BLOCKED!\n\nPrinting is not allowed during the assessment.\n\nAction: ${actionName}\nThis action has been logged as a violation.`);
//       }

//       logViolation(ViolationType.KEYBOARD_SHORTCUT, {
//         shortcut: currentShortcut,
//         action: actionName,
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.KEYBOARD_SHORTCUT);
//       }

//       return false;
//     }

//     // Alt+Tab detection (partial - not fully reliable)
//     if (e.altKey && key === 'Tab') {
//       e.preventDefault();
//       logViolation(ViolationType.TAB_SWITCH, {
//         method: 'Alt+Tab',
//         timestamp: new Date().toISOString()
//       });
//       return false;
//     }
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   /**
//    * 5. COPY/PASTE BLOCKING
//    */
//   const handleCopy = useCallback((e) => {
//     if (!enabled) return;

//     e.preventDefault();
//     e.stopPropagation();

//     logViolation(ViolationType.COPY_PASTE, {
//       action: 'copy',
//       timestamp: new Date().toISOString()
//     });

//     if (onWarning) {
//       onWarning(ViolationType.COPY_PASTE);
//     }

//     return false;
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   const handlePaste = useCallback((e) => {
//     if (!enabled) return;

//     e.preventDefault();
//     e.stopPropagation();

//     logViolation(ViolationType.COPY_PASTE, {
//       action: 'paste',
//       timestamp: new Date().toISOString()
//     });

//     if (onWarning) {
//       onWarning(ViolationType.COPY_PASTE);
//     }

//     return false;
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   /**
//    * 5b. TEXT SELECTION BLOCKING
//    */
//   const handleSelectStart = useCallback((e) => {
//     if (!enabled) return;

//     e.preventDefault();
//     return false;
//   }, [enabled]);

//   const handleDragStart = useCallback((e) => {
//     if (!enabled) return;

//     e.preventDefault();
//     return false;
//   }, [enabled]);

//   /**
//    * ⚠️ 6. DEVELOPER TOOLS DETECTION - DISABLED ⚠️
//    *
//    * 🔄 CHANGE: Continuous DevTools detection has been REMOVED from this hook
//    *
//    * WHY: Window size detection caused false positives when exiting fullscreen
//    *      because the browser chrome (address bar, tabs) reappears and changes window dimensions
//    *
//    * NEW APPROACH: DevTools detection now ONLY happens in FullscreenWarningOverlay
//    *               when user exits fullscreen. This is when window size detection is reliable.
//    *
//    * BENEFITS:
//    * ✅ No false positives
//    * ✅ DevTools can only be opened when user exits fullscreen
//    * ✅ More accurate detection
//    * ✅ Better user experience
//    *
//    * See: frontend/src/features/shared/FullscreenWarningOverlay.jsx for new implementation
//    */

//   // 🗑️ REMOVED: detectDevTools function and interval checking
//   // The code below is commented out and will be removed in future cleanup

//   /*
//   const devToolsOpenRef = useRef(false);
//   const devToolsCheckedOnLoadRef = useRef(false);

//   const detectDevTools = useCallback(() => {
//     // This code has been moved to FullscreenWarningOverlay component
//   }, [enabled, logViolation, ViolationType, onCriticalViolation]);
//   */

//   /**
//    * 7. PREVENT NEW WINDOWS/TABS
//    */
//   const blockNewWindows = useCallback(() => {
//     if (!enabled) return;

//     // Override window.open
//     const originalOpen = window.open;
//     window.open = function(...args) {
//       logViolation(ViolationType.NEW_WINDOW_ATTEMPT, {
//         url: args[0] || 'unknown',
//         timestamp: new Date().toISOString()
//       });

//       if (onWarning) {
//         onWarning(ViolationType.NEW_WINDOW_ATTEMPT);
//       }

//       return null;
//     };

//     return () => {
//       window.open = originalOpen;
//     };
//   }, [enabled, logViolation, ViolationType, onWarning]);

//   /**
//    * 8. BEFOREUNLOAD WARNING
//    */
//   const handleBeforeUnload = useCallback((e) => {
//     if (!enabled) return;

//     const message = 'Are you sure you want to leave? Your assessment is in progress and this action will be logged.';
//     e.preventDefault();
//     e.returnValue = message;
//     return message;
//   }, [enabled]);

//   /**
//    * 9. PRINT DIALOG DETECTION
//    */
//   const handleBeforePrint = useCallback(() => {
//     if (!enabled) return;

//     logViolation(ViolationType.KEYBOARD_SHORTCUT, {
//       shortcut: 'Print Dialog',
//       action: 'Print attempt detected',
//       timestamp: new Date().toISOString()
//     });

//     alert('⚠️ PRINT BLOCKED!\n\nPrinting is not allowed during the assessment.\n\nThis action has been logged as a violation.');
//   }, [enabled, logViolation, ViolationType]);

//   const handleAfterPrint = useCallback(() => {
//     if (!enabled) return;

//     console.log('%c[Proctoring] Print dialog was opened',
//       'color: #ea580c; font-weight: bold;');
//   }, [enabled]);

//   // Set up all event listeners
//   useEffect(() => {
//     if (!enabled) return;

//     // Add CSS to prevent text selection and printing
//     const styleElement = document.createElement('style');
//     styleElement.id = 'proctoring-restrictions';
//     styleElement.textContent = `
//       body {
//         -webkit-user-select: none !important;
//         -moz-user-select: none !important;
//         -ms-user-select: none !important;
//         user-select: none !important;
//       }
//       * {
//         -webkit-user-select: none !important;
//         -moz-user-select: none !important;
//         -ms-user-select: none !important;
//         user-select: none !important;
//       }
//       @media print {
//         body {
//           display: none !important;
//         }
//       }
//     `;
//     document.head.appendChild(styleElement);

//     // Visibility and blur
//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     window.addEventListener('blur', handleWindowBlur);
//     window.addEventListener('focus', handleFocusGain);

//     // Document focus monitoring (helps detect overlays)
//     window.addEventListener('blur', handleFocusLoss, true);

//     // Right-click
//     document.addEventListener('contextmenu', handleContextMenu);

//     // Keyboard
//     document.addEventListener('keydown', handleKeyDown, true);

//     // Copy/Paste/Selection
//     document.addEventListener('copy', handleCopy);
//     document.addEventListener('paste', handlePaste);
//     document.addEventListener('cut', handleCopy); // Treat cut same as copy
//     document.addEventListener('selectstart', handleSelectStart);
//     document.addEventListener('dragstart', handleDragStart);

//     // Print detection
//     window.addEventListener('beforeprint', handleBeforePrint);
//     window.addEventListener('afterprint', handleAfterPrint);

//     // Before unload
//     window.addEventListener('beforeunload', handleBeforeUnload);

//     // Block new windows
//     const cleanupNewWindows = blockNewWindows();

//     // 🔄 REMOVED: DevTools detection (now only in FullscreenWarningOverlay)
//     // detectDevTools();
//     // devToolsCheckIntervalRef.current = setInterval(detectDevTools, 2000);

//     console.log('[Proctoring] Browser restrictions enabled');

//     // Cleanup
//     return () => {
//       // Remove CSS
//       const style = document.getElementById('proctoring-restrictions');
//       if (style) style.remove();

//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//       window.removeEventListener('blur', handleWindowBlur);
//       window.removeEventListener('focus', handleFocusGain);
//       window.removeEventListener('blur', handleFocusLoss, true);
//       document.removeEventListener('contextmenu', handleContextMenu);
//       document.removeEventListener('keydown', handleKeyDown, true);
//       document.removeEventListener('copy', handleCopy);
//       document.removeEventListener('paste', handlePaste);
//       document.removeEventListener('cut', handleCopy);
//       document.removeEventListener('selectstart', handleSelectStart);
//       document.removeEventListener('dragstart', handleDragStart);
//       window.removeEventListener('beforeprint', handleBeforePrint);
//       window.removeEventListener('afterprint', handleAfterPrint);
//       window.removeEventListener('beforeunload', handleBeforeUnload);

//       if (cleanupNewWindows) cleanupNewWindows();

//       // 🔄 REMOVED: DevTools interval cleanup (no longer needed)
//       // if (devToolsCheckIntervalRef.current) {
//       //   clearInterval(devToolsCheckIntervalRef.current);
//       // }

//       console.log('[Proctoring] Browser restrictions disabled');
//     };
//   }, [
//     enabled,
//     handleVisibilityChange,
//     handleWindowBlur,
//     handleFocusGain,
//     handleFocusLoss,
//     handleContextMenu,
//     handleKeyDown,
//     handleCopy,
//     handlePaste,
//     handleSelectStart,
//     handleDragStart,
//     handleBeforePrint,
//     handleAfterPrint,
//     handleBeforeUnload,
//     blockNewWindows
//     // 🔄 REMOVED: detectDevTools from dependencies
//   ]);

//   return {
//     enabled
//   };
// }



import { useEffect, useCallback, useRef } from "react";
import { useProctorContext } from "../context/ProctorContext";

/**
 * Custom hook for comprehensive browser restrictions
 * FIXED: Using refs to prevent infinite loop from unstable dependencies
 */
export function useBrowserRestrictions({
  enabled = false,
  onWarning,
  onCriticalViolation,
} = {}) {
  const { logViolation, ViolationType } = useProctorContext();
  const tabSwitchTimeRef = useRef(null);

  // FIXED: Add refs for callbacks to prevent dependency issues
  const onWarningRef = useRef(onWarning);
  const onCriticalViolationRef = useRef(onCriticalViolation);
  const logViolationRef = useRef(logViolation);
  const ViolationTypeRef = useRef(ViolationType);

  // Sync refs whenever props/context values change
  useEffect(() => {
    onWarningRef.current = onWarning;
    onCriticalViolationRef.current = onCriticalViolation;
    logViolationRef.current = logViolation;
    ViolationTypeRef.current = ViolationType;
  }, [onWarning, onCriticalViolation, logViolation, ViolationType]);

  /**
   * 1. TAB SWITCHING / VISIBILITY DETECTION
   * FIXED: Use refs instead of direct dependencies
   */
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    if (document.hidden || document.visibilityState === "hidden") {
      tabSwitchTimeRef.current = Date.now();
      const isFullscreen = document.fullscreenElement !== null;

      logViolationRef.current(ViolationTypeRef.current.TAB_SWITCH, {
        action: "hidden",
        reason: isFullscreen ? "overlay_detected" : "tab_switch",
        timestamp: new Date().toISOString(),
      });

      if (onWarningRef.current) {
        onWarningRef.current(ViolationTypeRef.current.TAB_SWITCH);
      }
    } else {
      if (tabSwitchTimeRef.current) {
        const duration = Math.floor(
          (Date.now() - tabSwitchTimeRef.current) / 1000
        );
        logViolationRef.current(ViolationTypeRef.current.TAB_SWITCH, {
          action: "returned",
          duration: `${duration}s`,
          timestamp: new Date().toISOString(),
        });
        tabSwitchTimeRef.current = null;
      }
    }
  }, [enabled]);

  /**
   * 2. WINDOW BLUR DETECTION
   */
  const handleWindowBlur = useCallback(() => {
    if (!enabled) return;

    const isFullscreen = document.fullscreenElement !== null;

    logViolationRef.current(ViolationTypeRef.current.PAGE_BLUR, {
      reason: isFullscreen ? "overlay_or_system_window" : "window_blur",
      timestamp: new Date().toISOString(),
    });

    if (isFullscreen) {
      console.warn(
        "%c[Proctoring] Window blur detected while in fullscreen - possible overlay",
        "color: #ea580c; font-weight: bold;"
      );
    }
  }, [enabled]);

  /**
   * 2b. DOCUMENT FOCUS DETECTION
   */
  const handleFocusLoss = useCallback(() => {
    if (!enabled) return;

    if (!document.hasFocus()) {
      const isFullscreen = document.fullscreenElement !== null;
      console.warn(
        "%c[Proctoring] Document lost focus",
        "color: #ea580c; font-weight: bold;",
        isFullscreen ? "(overlay suspected)" : ""
      );
    }
  }, [enabled]);

  const handleFocusGain = useCallback(() => {
    if (!enabled) return;

    if (document.hasFocus()) {
      console.log(
        "%c[Proctoring] Document regained focus",
        "color: #059669; font-weight: bold;"
      );
    }
  }, [enabled]);

  /**
   * 3. RIGHT-CLICK BLOCKING
   */
  const handleContextMenu = useCallback(
    (e) => {
      if (!enabled) return;

      e.preventDefault();
      logViolationRef.current(ViolationTypeRef.current.RIGHT_CLICK, {
        target: e.target.tagName,
        timestamp: new Date().toISOString(),
      });

      if (onWarningRef.current) {
        onWarningRef.current(ViolationTypeRef.current.RIGHT_CLICK);
      }

      return false;
    },
    [enabled]
  );

  /**
   * 4. KEYBOARD SHORTCUTS BLOCKING
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      const keyCode = e.keyCode || e.which;
      const key = e.key;

      // Windows/Meta key
      if (
        key === "Meta" ||
        key === "OS" ||
        keyCode === 91 ||
        keyCode === 92 ||
        keyCode === 93
      ) {
        e.preventDefault();
        e.stopPropagation();

        logViolationRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT, {
          shortcut: "Windows/Meta Key",
          action: "Special key blocked",
          timestamp: new Date().toISOString(),
        });

        if (onWarningRef.current) {
          onWarningRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT);
        }

        return false;
      }

      // Copilot key
      if (
        keyCode === 235 ||
        key === "LaunchApplication2" ||
        key === "BrowserSearch"
      ) {
        e.preventDefault();
        e.stopPropagation();

        alert(
          "⚠️ SPECIAL KEY BLOCKED!\n\nSpecial system keys (Copilot, Search, etc.) are not allowed during the assessment.\n\nThis action has been logged as a violation."
        );

        logViolationRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT, {
          shortcut: "Copilot/Special Key",
          action: "System overlay attempt",
          key: key,
          keyCode: keyCode,
          timestamp: new Date().toISOString(),
        });

        if (onWarningRef.current) {
          onWarningRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT);
        }

        return false;
      }

      // Build shortcut string
      let currentShortcut = "";
      if (e.metaKey || e.key === "Meta") currentShortcut += "Cmd+";
      if (e.ctrlKey) currentShortcut += "Ctrl+";
      if (e.shiftKey && key !== "Shift") currentShortcut += "Shift+";
      if (e.altKey && key !== "Alt") currentShortcut += "Alt+";
      currentShortcut += key;

      // PrintScreen
      const isPrintScreen =
        key === "PrintScreen" || keyCode === 44 || key === "Print";

      if (isPrintScreen) {
        e.preventDefault();
        e.stopPropagation();

        alert(
          "⚠️ SCREENSHOT BLOCKED!\n\nScreenshots are not allowed during the assessment.\n\nThis action has been logged as a violation."
        );

        logViolationRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT, {
          shortcut: "PrintScreen",
          action: "Screenshot attempt",
          timestamp: new Date().toISOString(),
        });

        if (onWarningRef.current) {
          onWarningRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT);
        }

        return false;
      }

      // Blocked shortcuts map (same as before, keeping for brevity)
      const blockedShortcuts = {
        F12: "Developer Tools",
        "Ctrl+Shift+I": "Developer Tools",
        "Ctrl+C": "Copy",
        "Ctrl+V": "Paste",
        "Ctrl+P": "Print",
        // ... (keep all your existing shortcuts)
      };

      if (blockedShortcuts[currentShortcut]) {
        e.preventDefault();
        e.stopPropagation();

        const actionName = blockedShortcuts[currentShortcut];

        if (currentShortcut.includes("P") && (e.ctrlKey || e.metaKey)) {
          alert(
            `⚠️ PRINT BLOCKED!\n\nPrinting is not allowed during the assessment.\n\nAction: ${actionName}\nThis action has been logged as a violation.`
          );
        }

        logViolationRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT, {
          shortcut: currentShortcut,
          action: actionName,
          timestamp: new Date().toISOString(),
        });

        if (onWarningRef.current) {
          onWarningRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT);
        }

        return false;
      }

      // Alt+Tab
      if (e.altKey && key === "Tab") {
        e.preventDefault();
        logViolationRef.current(ViolationTypeRef.current.TAB_SWITCH, {
          method: "Alt+Tab",
          timestamp: new Date().toISOString(),
        });
        return false;
      }
    },
    [enabled]
  );

  /**
   * 5. COPY/PASTE BLOCKING
   */
  const handleCopy = useCallback(
    (e) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      logViolationRef.current(ViolationTypeRef.current.COPY_PASTE, {
        action: "copy",
        timestamp: new Date().toISOString(),
      });

      if (onWarningRef.current) {
        onWarningRef.current(ViolationTypeRef.current.COPY_PASTE);
      }

      return false;
    },
    [enabled]
  );

  const handlePaste = useCallback(
    (e) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      logViolationRef.current(ViolationTypeRef.current.COPY_PASTE, {
        action: "paste",
        timestamp: new Date().toISOString(),
      });

      if (onWarningRef.current) {
        onWarningRef.current(ViolationTypeRef.current.COPY_PASTE);
      }

      return false;
    },
    [enabled]
  );

  /**
   * 5b. TEXT SELECTION BLOCKING
   */
  const handleSelectStart = useCallback(
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      return false;
    },
    [enabled]
  );

  const handleDragStart = useCallback(
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      return false;
    },
    [enabled]
  );

  /**
   * 7. PREVENT NEW WINDOWS/TABS
   */
  const blockNewWindows = useCallback(() => {
    if (!enabled) return;

    const originalOpen = window.open;
    window.open = function (...args) {
      logViolationRef.current(ViolationTypeRef.current.NEW_WINDOW_ATTEMPT, {
        url: args[0] || "unknown",
        timestamp: new Date().toISOString(),
      });

      if (onWarningRef.current) {
        onWarningRef.current(ViolationTypeRef.current.NEW_WINDOW_ATTEMPT);
      }

      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, [enabled]);

  /**
   * 8. BEFOREUNLOAD WARNING
   */
  const handleBeforeUnload = useCallback(
    (e) => {
      if (!enabled) return;

      const message =
        "Are you sure you want to leave? Your assessment is in progress and this action will be logged.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    },
    [enabled]
  );

  /**
   * 9. PRINT DIALOG DETECTION
   */
  const handleBeforePrint = useCallback(() => {
    if (!enabled) return;

    logViolationRef.current(ViolationTypeRef.current.KEYBOARD_SHORTCUT, {
      shortcut: "Print Dialog",
      action: "Print attempt detected",
      timestamp: new Date().toISOString(),
    });

    alert(
      "⚠️ PRINT BLOCKED!\n\nPrinting is not allowed during the assessment.\n\nThis action has been logged as a violation."
    );
  }, [enabled]);

  const handleAfterPrint = useCallback(() => {
    if (!enabled) return;

    console.log(
      "%c[Proctoring] Print dialog was opened",
      "color: #ea580c; font-weight: bold;"
    );
  }, [enabled]);

  // FIXED: Main useEffect with ONLY stable dependencies
  useEffect(() => {
    if (!enabled) return;

    const styleElement = document.createElement("style");
    styleElement.id = "proctoring-restrictions";
    styleElement.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      @media print {
        body {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleFocusGain);
    window.addEventListener("blur", handleFocusLoss, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    window.addEventListener("beforeunload", handleBeforeUnload);

    const cleanupNewWindows = blockNewWindows();

    console.log("[Proctoring] Browser restrictions enabled");

    return () => {
      const style = document.getElementById("proctoring-restrictions");
      if (style) style.remove();

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleFocusGain);
      window.removeEventListener("blur", handleFocusLoss, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (cleanupNewWindows) cleanupNewWindows();

      console.log("[Proctoring] Browser restrictions disabled");
    };
  }, [
    enabled,
    handleVisibilityChange,
    handleWindowBlur,
    handleFocusGain,
    handleFocusLoss,
    handleContextMenu,
    handleKeyDown,
    handleCopy,
    handlePaste,
    handleSelectStart,
    handleDragStart,
    handleBeforePrint,
    handleAfterPrint,
    handleBeforeUnload,
    blockNewWindows,
  ]);

  return {
    enabled,
  };
}
