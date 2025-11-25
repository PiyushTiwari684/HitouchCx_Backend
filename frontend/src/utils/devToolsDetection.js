/**
 * 🆕 NEW UTILITY: Developer Tools Detection
 *
 * This file provides a utility function to detect if Developer Tools are open.
 * This should ONLY be used when the user has exited fullscreen mode.
 *
 * WHY: Window size detection is unreliable during fullscreen because the
 *      browser chrome (address bar, tabs) affects window dimensions.
 *      When NOT in fullscreen, this method is very accurate.
 */

/**
 * Detects if Developer Tools are currently open
 *
 * Method: Window Dimension Comparison
 * - Compares window.outerHeight/Width (browser window) with window.innerHeight/Width (viewport)
 * - If the difference is > 160px, DevTools are likely docked and open
 *
 * @returns {boolean} true if DevTools are detected as open, false otherwise
 *
 * @example
 * const isDevToolsOpen = detectDevTools();
 * if (isDevToolsOpen) {
 *   console.log('DevTools are open!');
 * }
 */
export function detectDevTools() {
  // Calculate the difference between outer (browser window) and inner (viewport) dimensions
  const heightDiff = window.outerHeight - window.innerHeight;
  const widthDiff = window.outerWidth - window.innerWidth;

  // Log for debugging
  console.log('[DevTools Detection]', {
    outerHeight: window.outerHeight,
    innerHeight: window.innerHeight,
    heightDiff,
    outerWidth: window.outerWidth,
    innerWidth: window.innerWidth,
    widthDiff
  });

  // DevTools typically add 200-400px when docked
  // Normal browser UI (address bar, tabs) adds ~100-120px
  // Using 160px as threshold to distinguish between them
  const isOpen = heightDiff > 160 || widthDiff > 160;

  if (isOpen) {
    console.log('%c🔍 [DevTools Detection] DevTools detected as OPEN',
      'color: #dc2626; font-weight: bold;');
  } else {
    console.log('%c✅ [DevTools Detection] DevTools detected as CLOSED',
      'color: #059669; font-weight: bold;');
  }

  return isOpen;
}

/**
 * Checks if DevTools are currently open (synchronous)
 * Same as detectDevTools but with a clearer name for boolean checks
 *
 * @returns {boolean}
 */
export function areDevToolsOpen() {
  return detectDevTools();
}
