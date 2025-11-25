
const SUPPORTED_BROWSERS = {
  CHROME: 'Chrome',
  FIREFOX: 'Firefox',
  SAFARI: 'Safari',
  EDGE: 'Edge'
};

/**
 * Check if the browser supports fullscreen API
 * @returns {boolean} True if fullscreen is supported
 */
export function isFullscreenSupported() {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
}

/**
 * Detect current browser
 * @returns {string|null} Browser name or null if unsupported
 */
export function detectBrowser() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    return SUPPORTED_BROWSERS.CHROME;
  } else if (userAgent.indexOf('Firefox') > -1) {
    return SUPPORTED_BROWSERS.FIREFOX;
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    return SUPPORTED_BROWSERS.SAFARI;
  } else if (userAgent.indexOf('Edg') > -1) {
    return SUPPORTED_BROWSERS.EDGE;
  }

  return null;
}

/**
 * Check if current browser is in the allowed list
 * @returns {boolean} True if browser is supported
 */
export function isBrowserAllowed() {
  const browser = detectBrowser();
  return browser !== null;
}

/**
 * Request fullscreen on an element (cross-browser)
 * @param {HTMLElement} element - Element to make fullscreen (default: document.documentElement)
 * @returns {Promise} Promise that resolves when fullscreen is entered
 */
export function requestFullscreen(element = document.documentElement) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    // Safari
    return element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    // Firefox
    return element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    // IE11
    return element.msRequestFullscreen();
  }

  return Promise.reject(new Error('Fullscreen API not supported'));
}

/**
 * Exit fullscreen mode (cross-browser)
 * @returns {Promise} Promise that resolves when fullscreen is exited
 */
export function exitFullscreen() {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    // Safari
    return document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    // Firefox
    return document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    // IE11
    return document.msExitFullscreen();
  }

  return Promise.reject(new Error('Fullscreen API not supported'));
}

/**
 * Check if currently in fullscreen mode
 * @returns {boolean} True if in fullscreen
 */
export function isCurrentlyFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

/**
 * Get the current fullscreen element
 * @returns {Element|null} The fullscreen element or null
 */
export function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

/**
 * Get all fullscreen change event names for cross-browser support
 * @returns {string[]} Array of event names
 */
export function getFullscreenChangeEvents() {
  return [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
  ];
}

/**
 * Get all fullscreen error event names for cross-browser support
 * @returns {string[]} Array of event names
 */
export function getFullscreenErrorEvents() {
  return [
    'fullscreenerror',
    'webkitfullscreenerror',
    'mozfullscreenerror',
    'MSFullscreenError'
  ];
}

/**
 * Add fullscreen change listener (cross-browser)
 * @param {Function} callback - Function to call on fullscreen change
 * @returns {Function} Cleanup function to remove listeners
 */
export function addFullscreenChangeListener(callback) {
  const events = getFullscreenChangeEvents();

  events.forEach(event => {
    document.addEventListener(event, callback);
  });

  // Return cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, callback);
    });
  };
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getFullscreenErrorMessage(error) {
  const message = error?.message || '';

  if (message.includes('denied') || message.includes('permission')) {
    return 'Fullscreen permission was denied. Please allow fullscreen to continue.';
  }

  if (message.includes('not supported')) {
    return 'Your browser does not support fullscreen mode. Please use Chrome, Firefox, Safari, or Edge.';
  }

  return 'Unable to enter fullscreen mode. Please try again.';
}
