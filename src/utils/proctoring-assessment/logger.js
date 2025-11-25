// Import winston logging library
import winston from 'winston';
// Import app configuration to check environment (dev/production)
import { APP_CONFIG } from '../config/constants.js';

// Destructure winston formatting utilities
// Without this: You'd have to write winston.format.combine, winston.format.timestamp, etc.
const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define custom log format - how each log line will appear
// Without this: Logs would be in default JSON format, harder to read
// Example with this: "2025-11-03 14:30:45 [info]: User logged in"
// Example without: {"level":"info","message":"User logged in","timestamp":"2025-11-03T14:30:45.123Z"}
const logFormat = printf(({ level, message, timestamp, stack }) => {
  // If error has stack trace, show it; otherwise show message
  // Without 'stack ||': Error stack traces wouldn't appear in logs
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create the main logger instance
const logger = winston.createLogger({
  
  // Set log level based on environment
  // Production: Only show 'info', 'warn', 'error' (hide 'debug')
  // Development: Show everything including 'debug'
  // Without this: Would default to 'info', losing debug logs in development
  level: APP_CONFIG.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // Configure how logs are formatted
  format: combine(
    // Include full error stack traces in logs
    // Without this: Errors would only show message, not where they occurred
    errors({ stack: true }),
    
    // Add timestamp to each log
    // Without this: You wouldn't know when an error occurred
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    
    // Apply our custom format defined above
    logFormat
  ),
  
  // Define where logs should be sent (console, files, etc.)
  transports: [
    
    // TRANSPORT 1: Console (Terminal) - for real-time viewing
    // Without this: Logs wouldn't appear in terminal during development
    new winston.transports.Console({
      format: combine(
        // Colorize logs in terminal (green=info, red=error, yellow=warn)
        // Without this: All logs would be white/gray, harder to spot errors
        colorize(),
        logFormat
      ),
    }),
    
    // TRANSPORT 2: Error Log File - captures ONLY errors
    // Without this: Error logs would mix with info logs, harder to debug
    new winston.transports.File({
      filename: 'logs/error.log',         // File path for errors
      level: 'error',                     // Only capture error level
      maxsize: 5242880,                   // 5MB max file size
      // Without maxsize: Log file could grow infinitely, fill disk
      maxFiles: 5,                        // Keep last 5 rotated files
      // Without maxFiles: Old logs accumulate, waste disk space
      // Rotation: error.log → error.log.1 → error.log.2 → ... → error.log.5 (oldest deleted)
    }),
    
    // TRANSPORT 3: Combined Log File - captures ALL logs
    // Without this: No permanent record of non-error logs
    new winston.transports.File({
      filename: 'logs/combined.log',      // All logs go here
      maxsize: 5242880,                   // 5MB max
      maxFiles: 5,                        // Keep last 5
      // This helps track what happened BEFORE an error occurred
    }),
  ],
  
  // Handle uncaught exceptions (code crashes)
  // Example: throw new Error("Unexpected crash")
  // Without this: App crashes silently, no log saved
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
    // This saves the crash reason and stack trace, helps debug later
  ],
  
  // Handle unhandled promise rejections (async errors not caught)
  // Example: Promise.reject("Database timeout")
  // Without this: Silent failures, hard to debug async issues
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
    // This catches async errors that would otherwise be invisible
  ],
});

// Export the configured logger for use in other files
// Without this: Other files can't import and use the logger
export default logger;