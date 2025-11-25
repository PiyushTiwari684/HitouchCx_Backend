// This file exports a function to get all the device info we need.

// We'll use a simple library to parse the userAgent string.
// Run this in your terminal: npm install ua-parser-js
import {UAParser} from "ua-parser-js";

export const getDeviceInfo = () => {
  const parser = new UAParser();
  const result = parser.getResult();

  return {
    browserName: result.browser.name || "Unknown",
    browserVersion: result.browser.version || "Unknown",
    operatingSystem: result.os.name || "Unknown",
    deviceType: result.device.type || "desktop", // Default to desktop
    userAgent: result.ua || navigator.userAgent,
    screenWidth: window.screen.width || 0,
    screenHeight: window.screen.height || 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
};

