import { TECH_SCAN_REQUIREMENTS } from '../config/constants.js';

/**
 * Tech Scan Validation Service
 * Validates system requirements for proctored assessments
 */

/**
 * Validate Operating System
 * @param {string} osName - Operating system name
 * @param {string} osVersion - Operating system version
 * @returns {object} Validation result
 */
export const validateOS = (osName, osVersion) => {
  const isSupported = TECH_SCAN_REQUIREMENTS.SUPPORTED_OS.some((os) =>
    osName?.includes(os)
  );

  return {
    passed: isSupported,
    message: isSupported
      ? `${osName} ${osVersion || ''}`
      : `Unsupported OS: ${osName}. Required: Windows 10/11 or macOS`,
  };
};

/**
 * Validate CPU Cores
 * @param {number} cpuCores - Number of CPU cores
 * @returns {object} Validation result
 */
export const validateCPU = (cpuCores) => {
  const passed = cpuCores >= TECH_SCAN_REQUIREMENTS.MIN_CPU_CORES;
  return {
    passed,
    message: passed
      ? `${cpuCores} cores (✓ Meets requirement)`
      : `${cpuCores} cores (Minimum: ${TECH_SCAN_REQUIREMENTS.MIN_CPU_CORES} cores required)`,
  };
};

/**
 * Validate RAM
 * @param {number} ramGB - RAM in GB
 * @returns {object} Validation result
 */
export const validateRAM = (ramGB) => {
  const passed = ramGB >= TECH_SCAN_REQUIREMENTS.MIN_RAM_GB;
  return {
    passed,
    message: passed
      ? `${ramGB} GB (✓ Meets requirement)`
      : `${ramGB} GB (Minimum: ${TECH_SCAN_REQUIREMENTS.MIN_RAM_GB} GB required)`,
  };
};

/**
 * Validate Display Resolution
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {object} Validation result
 */
export const validateDisplay = (width, height) => {
  const passed =
    width >= TECH_SCAN_REQUIREMENTS.MIN_SCREEN_WIDTH &&
    height >= TECH_SCAN_REQUIREMENTS.MIN_SCREEN_HEIGHT;

  return {
    passed,
    message: passed
      ? `${width}×${height} (✓ Meets requirement)`
      : `${width}×${height} (Minimum: ${TECH_SCAN_REQUIREMENTS.MIN_SCREEN_WIDTH}×${TECH_SCAN_REQUIREMENTS.MIN_SCREEN_HEIGHT} required)`,
  };
};

/**
 * Validate Internet Speed
 * @param {number} downloadMbps - Download speed in Mbps
 * @param {number} uploadMbps - Upload speed in Mbps
 * @returns {object} Validation result
 */
export const validateInternetSpeed = (downloadMbps, uploadMbps) => {
  const downloadPassed = downloadMbps >= TECH_SCAN_REQUIREMENTS.MIN_DOWNLOAD_SPEED_MBPS;
  const uploadPassed = uploadMbps >= TECH_SCAN_REQUIREMENTS.MIN_UPLOAD_SPEED_MBPS;
  const passed = downloadPassed && uploadPassed;

  const failureReasons = [];
  if (!downloadPassed) {
    failureReasons.push(`Download: ${downloadMbps} Mbps (Min: ${TECH_SCAN_REQUIREMENTS.MIN_DOWNLOAD_SPEED_MBPS} Mbps)`);
  }
  if (!uploadPassed) {
    failureReasons.push(`Upload: ${uploadMbps} Mbps (Min: ${TECH_SCAN_REQUIREMENTS.MIN_UPLOAD_SPEED_MBPS} Mbps)`);
  }

  return {
    passed,
    message: passed
      ? `${downloadMbps} Mbps ↓ / ${uploadMbps} Mbps ↑ (✓ Meets requirement)`
      : `${downloadMbps} Mbps ↓ / ${uploadMbps} Mbps ↑ (${failureReasons.join(', ')})`,
  };
};

/**
 * Validate Browser Version
 * @param {string} browserName - Browser name
 * @param {string} browserVersion - Browser version
 * @returns {object} Validation result
 */
export const validateBrowser = (browserName, browserVersion) => {
  const isSupported = TECH_SCAN_REQUIREMENTS.SUPPORTED_BROWSERS.includes(browserName);

  if (!isSupported) {
    return {
      passed: false,
      message: `Unsupported browser: ${browserName}. Required: ${TECH_SCAN_REQUIREMENTS.SUPPORTED_BROWSERS.join(', ')}`,
    };
  }

  const minVersion = TECH_SCAN_REQUIREMENTS.MIN_BROWSER_VERSIONS[browserName];
  if (!minVersion) {
    // Browser is supported but we don't have a min version requirement
    return {
      passed: true,
      message: `${browserName} ${browserVersion}`,
    };
  }

  const currentVersion = parseInt(browserVersion?.split('.')[0]) || 0;
  const passed = currentVersion >= minVersion;

  return {
    passed,
    message: passed
      ? `${browserName} ${browserVersion} (✓ Up to date)`
      : `${browserName} ${browserVersion} (Minimum version: ${minVersion})`,
  };
};

/**
 * Check Multiple Monitors (Warning only)
 * @param {boolean} multipleMonitors - Whether multiple monitors detected
 * @returns {object} Warning result
 */
export const checkMultipleMonitors = (multipleMonitors) => {
  return {
    warning: multipleMonitors,
    message: multipleMonitors
      ? 'Multiple monitors detected - Please disconnect secondary displays for security'
      : 'Single monitor detected',
  };
};

/**
 * Main Tech Scan Validation Function
 * @param {object} scanData - Complete scan data from frontend
 * @returns {object} Complete validation results
 */
export const validateTechScan = (scanData) => {
  const results = {
    os: validateOS(scanData.operatingSystem, scanData.osVersion),
    cpu: validateCPU(scanData.cpuCores || 0),
    ram: validateRAM(scanData.ramGB || 0),
    display: validateDisplay(scanData.screenWidth || 0, scanData.screenHeight || 0),
    internetSpeed: validateInternetSpeed(
      scanData.downloadSpeedMbps || 0,
      scanData.uploadSpeedMbps || 0
    ),
    browser: validateBrowser(scanData.browserName, scanData.browserVersion),
  };

  const warnings = {
    multipleMonitors: checkMultipleMonitors(scanData.multipleMonitors),
  };

  // Collect failures
  const criticalFailures = [];
  Object.keys(results).forEach((key) => {
    if (!results[key].passed) {
      criticalFailures.push(key);
    }
  });

  // Collect warnings
  const warningsList = [];
  Object.keys(warnings).forEach((key) => {
    if (warnings[key].warning) {
      warningsList.push(key);
    }
  });

  return {
    allPassed: criticalFailures.length === 0,
    criticalFailures,
    warnings: warningsList,
    results,
    warningDetails: warnings,
  };
};

export default {
  validateOS,
  validateCPU,
  validateRAM,
  validateDisplay,
  validateInternetSpeed,
  validateBrowser,
  checkMultipleMonitors,
  validateTechScan,
};
