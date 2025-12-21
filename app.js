import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import passport from "./src/config/passport.js";
import routes from "./src/routes/index.routes.js"; //main route aggregator
import { CORS_CONFIG, RATE_LIMIT_CONFIG } from "./src/config/constants.js";
import errorHandler, { notFoundHandler } from "./src/middlewares/errorHandler.js";
import logger from "./src/utils/logger.js";

const app = express();

// Trust only one hop (ngrok) or local networks
app.set("trust proxy", 1); // one reverse proxy hop (ngrok)

const corsOptions = {
  origin: (origin, callback) => {
    const allowedLocal = ["http://localhost:5173", "http://localhost:3000","http://localhost:5174"];
    const isNgrok = origin && /https:\/\/[a-z0-9-]+\.ngrok(-free)?\.(dev|app|io)/i.test(origin);
    if (!origin || allowedLocal.includes(origin) || isNgrok) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "ngrok-skip-browser-warning", // add this
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.use(cors(corsOptions));
// Handle all preflight OPTIONS (Express v5)
app.options(/.*/, cors(corsOptions));

// ========== SECURITY MIDDLEWARE ==========
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(compression());

// ========== LOGGING ==========
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

// ========== RATE LIMITING ==========
// General API rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
    });
  },
});

// Stricter rate limiting for authentication endpoints (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again after 15 minutes.",
    });
  },
});

app.use("/api", limiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/forgot-password", authLimiter);
app.use("/api/v1/auth/reset-password", authLimiter);
app.use("/api/v1/otp", authLimiter);

// ========== BODY PARSERS ==========
app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// ========== AUTH INITIALIZATION ==========
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ========== API ROUTES ==========
app.use("/api/v1", routes);

// ========== ERROR HANDLING (LAST) ==========
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
