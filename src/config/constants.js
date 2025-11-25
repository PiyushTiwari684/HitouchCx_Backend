// Application Constants
export const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: 'v1',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
};

export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'csantoresbooshhitouchx',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'csantoresbooshneelugastyahitouchx',
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d',
  SESSION_TOKEN_EXPIRY: '4h', // For proctoring sessions
};

// Proctoring Configuration
export const PROCTORING_CONFIG = {
  FACE_CHECK_INTERVAL: parseInt(process.env.FACE_CHECK_INTERVAL) || 5, // seconds
  MAX_VIOLATIONS: parseInt(process.env.MAX_VIOLATIONS) || 10,
  GRACE_VIOLATIONS: parseInt(process.env.GRACE_VIOLATIONS) || 2,
  MAX_RECONNECTS: parseInt(process.env.MAX_RECONNECTS) || 3,
  IDLE_TIMEOUT_MINUTES: parseInt(process.env.IDLE_TIMEOUT_MINUTES) || 10,
  SNAPSHOT_QUALITY: 0.7, // 0-1
  MAX_SNAPSHOT_SIZE: 500 * 1024, // 500KB
};

// Assessment Configuration
export const ASSESSMENT_CONFIG = {
  MAX_ATTEMPTS: 2,
  AUTO_SAVE_INTERVAL: 30, // seconds
  QUESTION_NAVIGATION_TIMEOUT: 300, // seconds (5 min)
  SECTION_LOCK_ENABLED: true,
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/webm'],
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  PATHS: {
    FACES: 'faces',
    SNAPSHOTS: 'snapshots',
    AUDIO: 'audio',
    RECORDINGS: 'recordings',
  },
};


// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  API_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  API_MAX_REQUESTS: 1000,
};

// CORS Configuration
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  CREDENTIALS: true,
};


// WebSocket Events
export const SOCKET_EVENTS = {
  // Server -> Client
  VIOLATION_WARNING: 'violation:warning',
  VIOLATION_THRESHOLD: 'violation:threshold',
  SESSION_TERMINATED: 'session:terminated',
  PROCTORING_STATUS: 'proctoring:status',
  FACE_CHECK_RESULT: 'face:check:result',
  
  // Client -> Server
  PROCTORING_FRAME: 'proctoring:frame',
  PROCTORING_EVENT: 'proctoring:event',
  SESSION_HEARTBEAT: 'session:heartbeat',
  ANSWER_SAVE: 'answer:save',
  CONNECTION_AUTH: 'connection:auth',
};


// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation failed',
  BLACKLISTED: 'User is blacklisted',
  SESSION_EXPIRED: 'Session expired',
  MAX_ATTEMPTS_REACHED: 'Maximum attempts reached',
  SYSTEM_CHECK_FAILED: 'System checks not passed',
  VERIFICATION_FAILED: 'Identity verification failed',
};


// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  FETCHED: 'Resource fetched successfully',
};