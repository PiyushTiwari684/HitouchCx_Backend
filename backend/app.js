// Import required packages
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

//Import routes
import routes from './src/routes/index.js';

// Import configuration
import { CORS_CONFIG, RATE_LIMIT_CONFIG } from './src/config/constants.js';

// Import middleware
import errorHandler, { notFoundHandler } from './src/middlewares/errorHandler.js';

// Import logger
import logger from './src/utils/logger.js';

// Create Express app
const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// 1. HELMET - Security headers
// Protects against: XSS, clickjacking, MIME sniffing, etc.
// Without this: App vulnerable to common web attacks
app.use(helmet({
  // Allow loading scripts/styles from same origin
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow inline scripts (needed for some APIs)
      // Without this: Inline scripts would be blocked
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  // Enable cross-origin resource sharing for WebSockets
  // Without this: Socket.IO connections might fail
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
// What helmet adds:
// - X-Frame-Options: Prevents clickjacking
// - X-Content-Type-Options: Prevents MIME sniffing
// - Strict-Transport-Security: Forces HTTPS
// - X-XSS-Protection: Enables XSS filter

// ============================================================================
// PERFORMANCE MIDDLEWARE
// ============================================================================

// 2. COMPRESSION - Gzip responses
// Reduces response size by ~70%
// Without this: Large JSON responses would be slow
app.use(compression());
// Example: 500KB JSON → 150KB compressed
// Faster API, less bandwidth usage

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

// 3. MORGAN - HTTP request logging
// Logs every API call for debugging
// Without this: Can't see which endpoints are being called
if (process.env.NODE_ENV === 'development') {
  // Development: Detailed logs in console
  app.use(morgan('dev'));
  // Output: GET /api/assessments 200 45.123 ms - 1234
} else {
  // Production: Stream logs to winston
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
  // Logs saved to files for later analysis
}

// ============================================================================
// RATE LIMITING
// ============================================================================

// 4. RATE LIMITER - Prevent brute force & DDoS
// Without this: Attackers can send unlimited requests
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,        // 15 minutes
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,          // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,  // Return rate limit info in headers
  // Without standardHeaders: Client doesn't know when to retry
  legacyHeaders: false,   // Disable old X-RateLimit-* headers
  // Handler called when limit exceeded
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

// Apply rate limiting to all API routes
// Without '/api': Rate limiting would apply to static files too
app.use('/api', limiter);
// Now: Max 100 API calls per 15 min per IP
// Prevents: Password brute force, API abuse, DDoS

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

// 5. CORS - Cross-Origin Resource Sharing
// Without this: Frontend on different domain can't access API
app.use(cors({
  origin: CORS_CONFIG.ALLOWED_ORIGINS,
  // Only these origins can access API (from .env)
  // Without origin check: Any website could call your API
  credentials: CORS_CONFIG.CREDENTIALS,
  // Allow cookies/auth headers
  // Without credentials: Can't send JWT tokens
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Allowed request headers
}));
// Example: Frontend at localhost:3000 can now call API at localhost:3001

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================

// 6. JSON body parser
// Parse incoming JSON requests
// Without this: req.body would be undefined
app.use(express.json({ 
  limit: '10mb',  // Max request body size
  // Without limit: Could receive huge payloads, crash server
}));

// 7. URL-encoded body parser (for form submissions)
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

// Simple endpoint to check if server is alive
// Without this: Can't monitor if server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});
// Usage: curl http://localhost:3001/health
// Docker/Kubernetes use this for health checks

// ============================================================================
// API ROUTES
// ============================================================================

// API routes will be added here
app.use('/api/v1',routes);


// Example: app.use('/api/v1/auth', authRoutes);
// Example: app.use('/api/v1/assessments', assessmentRoutes);

// ============================================================================
// ERROR HANDLING MIDDLEWARE (Must be LAST)
// ============================================================================

// 404 handler - catches requests to non-existent routes
// MUST be placed AFTER all other routes
// Without this: Would return HTML 404 page instead of JSON
app.use(notFoundHandler);

// Global error handler - catches all errors
// MUST be LAST middleware
// Without this: Errors would crash the app
app.use(errorHandler);

// Export configured app
export default app;