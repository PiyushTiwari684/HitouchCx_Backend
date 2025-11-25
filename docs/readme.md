# Proctoring System - Complete Documentation

## Table of Contents

### Frontend

1. [Frontend App Initialization](#frontend-app-initialization)
2. [Frontend User Registration Flow](#frontend-user-registration-flow)
3. [Frontend User Login Flow](#frontend-user-login-flow)
4. [Frontend Protected Route Authentication](#frontend-protected-route-authentication)
5. [Frontend System Check Page](#frontend-system-check-page)
6. [Frontend Permission Checks](#frontend-permission-checks)
7. [Frontend Save & Proceed](#frontend-save-and-proceed)
8. [Frontend Complete User Journey](#frontend-complete-user-journey)
9. [Frontend Data Storage](#frontend-data-storage)
10. [Frontend File Structure](#frontend-file-structure)

### Backend

11. [Backend Architecture Overview](#backend-architecture-overview)
12. [Backend Server Initialization](#backend-server-initialization)
13. [Backend Middleware Stack](#backend-middleware-stack)
14. [Backend Authentication Flow](#backend-authentication-flow)
15. [Backend System Check Flow](#backend-system-check-flow)
16. [Backend Identity Verification Flow](#backend-identity-verification-flow)
17. [Backend Database Schema](#backend-database-schema)
18. [Backend API Endpoints](#backend-api-endpoints)
19. [Backend File Structure](#backend-file-structure)
20. [Backend Error Handling](#backend-error-handling)

---

# FRONTEND DOCUMENTATION

## Frontend App Initialization

### Entry Point: `src/main.jsx`

```
Application Bootstrap:
1. ReactDOM creates root element
2. Wraps entire app in:
   - <BrowserRouter> (handles routing)
   - <AuthProvider> (manages authentication state)
3. Renders <App /> component
```

### Authentication Context: `src/context/AuthContext.jsx`
# Backend Application Flow - Complete Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Initialization](#server-initialization)
3. [Middleware Stack](#middleware-stack)
4. [Request Flow](#request-flow)
5. [Authentication Flow](#authentication-flow)
6. [System Check Flow](#system-check-flow)
7. [Identity Verification Flow](#identity-verification-flow)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [File Structure](#file-structure)
11. [Error Handling](#error-handling)

---

## Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CLIENT REQUEST                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    SERVER.JS                             â”‚
â”‚  â€¢ Loads .env                                            â”‚
â”‚  â€¢ Starts Express server                                 â”‚
â”‚  â€¢ Handles graceful shutdown                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     APP.JS                               â”‚
â”‚  MIDDLEWARE LAYERS:                                      â”‚
â”‚  â”œâ”€â”€ Helmet (Security)                                   â”‚
â”‚  â”œâ”€â”€ Compression (Performance)                           â”‚
â”‚  â”œâ”€â”€ Morgan (Logging)                                    â”‚
â”‚  â”œâ”€â”€ Rate Limiting                                       â”‚
â”‚  â”œâ”€â”€ CORS                                                â”‚
â”‚  â””â”€â”€ Body Parsers                                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚               ROUTES (src/routes/index.js)               â”‚
â”‚  â”œâ”€â”€ /api/v1/auth                                        â”‚
â”‚  â”œâ”€â”€ /api/v1/system-checks                               â”‚
â”‚  â”œâ”€â”€ /api/v1/identity-verification                       â”‚
â”‚  â”œâ”€â”€ /api/v1/ping                                        â”‚
â”‚  â””â”€â”€ /api/v1/test                                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚            AUTHENTICATION MIDDLEWARE                     â”‚
â”‚  â€¢ Validates JWT token                                   â”‚
â”‚  â€¢ Extracts candidate info                               â”‚
â”‚  â€¢ Adds req.candidate                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  CONTROLLERS                             â”‚
â”‚  â”œâ”€â”€ authControllers.js                                  â”‚
â”‚  â”œâ”€â”€ systemCheckController.js                            â”‚
â”‚  â”œâ”€â”€ identityVerificationController.js                   â”‚
â”‚  â””â”€â”€ proctoringController.js                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    SERVICES                              â”‚
â”‚  â”œâ”€â”€ authService.js                                      â”‚
â”‚  â”œâ”€â”€ proctoringService.js                                â”‚
â”‚  â”œâ”€â”€ assessmentService.js                                â”‚
â”‚  â””â”€â”€ assemblyAiServices.js                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              PRISMA ORM (Database Layer)                 â”‚
â”‚  â€¢ Connects to PostgreSQL                                â”‚
â”‚  â€¢ Manages transactions                                  â”‚
â”‚  â€¢ Type-safe queries                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
                     â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚             POSTGRESQL DATABASE                          â”‚
â”‚  â€¢ Stores all application data                           â”‚
â”‚  â€¢ Managed by Supabase                                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Server Initialization

### File: `server.js`

```javascript
SERVER STARTUP SEQUENCE:

1. Load Environment Variables
   â”œâ”€â”€ dotenv.config()
   â”œâ”€â”€ Reads .env file
   â””â”€â”€ Sets process.env variables

2. Initialize Database Connection
   â”œâ”€â”€ Import './src/config/db.js'
   â”œâ”€â”€ Prisma connects to PostgreSQL
   â””â”€â”€ Connection pooling configured

3. Start Express Server
   â”œâ”€â”€ app.listen(PORT)
   â”œâ”€â”€ Default PORT: 3000
   â”œâ”€â”€ Logs: "Server listening at port: 3000"
   â””â”€â”€ Logs: "Environment: development"

4. Setup Error Handlers
   â”œâ”€â”€ SIGTERM: Graceful shutdown
   â”œâ”€â”€ SIGINT (Ctrl+C): Graceful shutdown
   â”œâ”€â”€ unhandledRejection: Log and exit
   â””â”€â”€ EADDRINUSE: Port already in use error

5. Server Ready
   â””â”€â”€ Listening for HTTP requests
```

### Graceful Shutdown Process

```
SIGNAL RECEIVED (SIGTERM/SIGINT)
   â†“
Log: "SIGTERM received. Closing HTTP server..."
   â†“
server.close()
   â†“
Wait for active connections to finish
   â†“
Close database connections
   â†“
Log: "HTTP server closed"
   â†“
process.exit(0)
```

---

## Middleware Stack

### File: `app.js`

The middleware stack processes EVERY request in this order:

```
REQUEST ENTERS
   â†“
1. HELMET (Security Headers)
   â”œâ”€â”€ Sets X-Frame-Options: SAMEORIGIN
   â”œâ”€â”€ Sets X-Content-Type-Options: nosniff
   â”œâ”€â”€ Sets Strict-Transport-Security
   â””â”€â”€ Prevents XSS, clickjacking, MIME sniffing
   â†“
2. COMPRESSION (Gzip Responses)
   â”œâ”€â”€ Compresses JSON responses
   â”œâ”€â”€ Reduces bandwidth by ~70%
   â””â”€â”€ Faster API responses
   â†“
3. MORGAN (HTTP Logging)
   â”œâ”€â”€ Development: Logs to console
   â”œâ”€â”€ Production: Logs to winston files
   â””â”€â”€ Example: "GET /api/v1/auth/login 200 45ms"
   â†“
4. RATE LIMITER
   â”œâ”€â”€ Max: 100 requests per 15 minutes
   â”œâ”€â”€ Per IP address
   â”œâ”€â”€ Returns 429 if exceeded
   â””â”€â”€ Prevents brute force & DDoS
   â†“
5. CORS (Cross-Origin Sharing)
   â”œâ”€â”€ Allowed origins: localhost:5174
   â”œâ”€â”€ Credentials: true
   â”œâ”€â”€ Methods: GET, POST, PUT, PATCH, DELETE
   â””â”€â”€ Headers: Content-Type, Authorization
   â†“
6. BODY PARSERS
   â”œâ”€â”€ express.json() - Parse JSON bodies
   â”œâ”€â”€ express.urlencoded() - Parse form data
   â””â”€â”€ Limit: 10MB per request
   â†“
7. ROUTES
   â”œâ”€â”€ /health â†’ Health check
   â”œâ”€â”€ /api/v1/* â†’ API routes
   â””â”€â”€ Matches route pattern
   â†“
8. ROUTE-SPECIFIC MIDDLEWARE
   â”œâ”€â”€ authenticateCandidate (JWT validation)
   â”œâ”€â”€ upload middleware (Multer for files)
   â””â”€â”€ validation middleware
   â†“
9. CONTROLLER
   â””â”€â”€ Business logic execution
   â†“
10. ERROR HANDLERS (if error occurs)
    â”œâ”€â”€ notFoundHandler (404)
    â””â”€â”€ errorHandler (global catch-all)
   â†“
RESPONSE SENT TO CLIENT
```

### Security Features

```
HELMET Protection:
â”œâ”€â”€ XSS Protection: Blocks inline scripts
â”œâ”€â”€ Clickjacking: Prevents iframe embedding
â”œâ”€â”€ MIME Sniffing: Forces correct content types
â””â”€â”€ HSTS: Forces HTTPS connections

RATE LIMITING:
â”œâ”€â”€ Window: 15 minutes
â”œâ”€â”€ Max Requests: 100
â”œâ”€â”€ Per: IP Address
â””â”€â”€ Response: 429 Too Many Requests

CORS Configuration:
â”œâ”€â”€ Allowed Origins: From .env
â”œâ”€â”€ Credentials: Enabled for cookies/auth
â”œâ”€â”€ Methods: REST HTTP verbs
â””â”€â”€ Headers: Content-Type, Authorization
```

---

## Request Flow

### Complete HTTP Request Lifecycle

```
1. CLIENT SENDS REQUEST
   POST /api/v1/auth/login
   Headers: { Content-Type: 'application/json' }
   Body: { "email": "john@example.com" }
   â†“

2. SERVER RECEIVES REQUEST
   â”œâ”€â”€ Express server accepts connection
   â”œâ”€â”€ TCP handshake complete
   â””â”€â”€ Request object created
   â†“

3. SECURITY MIDDLEWARE
   â”œâ”€â”€ Helmet adds security headers
   â”œâ”€â”€ Rate limiter checks IP
   â”œâ”€â”€ CORS validates origin
   â””â”€â”€ Body parser reads JSON
   â†“

4. ROUTE MATCHING
   â”œâ”€â”€ Checks: /api/v1/auth/login
   â”œâ”€â”€ Matches: authRoutes
   â””â”€â”€ Method: POST
   â†“

5. AUTH MIDDLEWARE (if protected route)
   â”œâ”€â”€ Extracts Bearer token
   â”œâ”€â”€ Verifies JWT signature
   â”œâ”€â”€ Checks expiration
   â”œâ”€â”€ Extracts candidateId
   â””â”€â”€ Sets req.candidate
   â†“

6. VALIDATION MIDDLEWARE (if configured)
   â”œâ”€â”€ Validates request body
   â”œâ”€â”€ Checks required fields
   â””â”€â”€ Returns 400 if invalid
   â†“

7. CONTROLLER EXECUTION
   â”œâ”€â”€ authControllers.login()
   â”œâ”€â”€ Business logic runs
   â””â”€â”€ Database queries execute
   â†“

8. DATABASE INTERACTION
   â”œâ”€â”€ Prisma query: findUnique()
   â”œâ”€â”€ PostgreSQL executes query
   â”œâ”€â”€ Returns candidate data
   â””â”€â”€ Connection returned to pool
   â†“

9. RESPONSE PREPARATION
   â”œâ”€â”€ Generate JWT token
   â”œâ”€â”€ Format response object
   â””â”€â”€ Call sendSuccess()
   â†“

10. COMPRESSION & HEADERS
    â”œâ”€â”€ Gzip compresses response
    â”œâ”€â”€ Sets Content-Encoding: gzip
    â””â”€â”€ Sets Content-Type: application/json
    â†“

11. SEND RESPONSE
    â”œâ”€â”€ HTTP 200 OK
    â”œâ”€â”€ JSON body sent
    â””â”€â”€ Connection closed (or kept alive)
    â†“

12. LOGGING
    â”œâ”€â”€ Morgan logs request
    â”œâ”€â”€ Winston logs to file
    â””â”€â”€ Console logs (dev only)
```

---

## Authentication Flow

### Registration Flow

```
POST /api/v1/auth/register
Body: { email, firstName, lastName, phone }
   â†“
Controller: authControllers.register()
   â†“
1. VALIDATION
   â”œâ”€â”€ Check: email exists?
   â”œâ”€â”€ Check: firstName exists?
   â””â”€â”€ Return 400 if missing
   â†“
2. CHECK EXISTING USER
   â”œâ”€â”€ Query: prisma.candidate.findUnique()
   â”œâ”€â”€ Where: { email }
   â””â”€â”€ If exists: Return 409 "Already exists"
   â†“
3. CREATE CANDIDATE
   â”œâ”€â”€ Query: prisma.candidate.create()
   â”œâ”€â”€ Data: { email, firstName, lastName, phone }
   â””â”€â”€ Returns: candidate object
   â†“
4. GENERATE JWT TOKEN
   â”œâ”€â”€ Payload: { candidateId, email }
   â”œâ”€â”€ Secret: JWT_ACCESS_TOKEN_SECRET
   â”œâ”€â”€ Expiry: 1 hour
   â””â”€â”€ Returns: token string
   â†“
5. SEND RESPONSE
   â”œâ”€â”€ Status: 201 Created
   â”œâ”€â”€ Data: { candidate, token, expiresIn }
   â””â”€â”€ Message: "Registration successful"
```

### Login Flow

```
POST /api/v1/auth/login
Body: { email }
   â†“
Controller: authControllers.login()
   â†“
1. VALIDATION
   â”œâ”€â”€ Check: email provided?
   â””â”€â”€ Return 400 if missing
   â†“
2. FIND CANDIDATE
   â”œâ”€â”€ Query: prisma.candidate.findUnique()
   â”œâ”€â”€ Where: { email }
   â””â”€â”€ If not found: Return 404 "Candidate not found"
   â†“
3. GENERATE JWT TOKEN
   â”œâ”€â”€ Payload: { candidateId, email }
   â”œâ”€â”€ Secret: JWT_ACCESS_TOKEN_SECRET
   â”œâ”€â”€ Expiry: 1 hour
   â””â”€â”€ Algorithm: HS256
   â†“
4. SEND RESPONSE
   â”œâ”€â”€ Status: 200 OK
   â”œâ”€â”€ Data: { candidate, token, expiresIn }
   â””â”€â”€ Message: "Login successful"
```

### JWT Token Structure

```javascript
Token Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Decoded Token:
{
  // Header
  "alg": "HS256",
  "typ": "JWT",

  // Payload
  "candidateId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "iat": 1699228800,  // Issued at (Unix timestamp)
  "exp": 1699232400   // Expires at (Unix timestamp)
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_ACCESS_TOKEN_SECRET
)
```

### Authentication Middleware

```
File: src/middlewares/auth.js

Function: authenticateCandidate(req, res, next)
   â†“
1. EXTRACT TOKEN
   â”œâ”€â”€ Get: req.headers.authorization
   â”œâ”€â”€ Format: "Bearer <token>"
   â”œâ”€â”€ Extract: token = authHeader.substring(7)
   â””â”€â”€ If missing: Return 401 "Access token required"
   â†“
2. VERIFY TOKEN
   â”œâ”€â”€ jwt.verify(token, JWT_ACCESS_TOKEN_SECRET)
   â”œâ”€â”€ Check signature
   â”œâ”€â”€ Check expiration
   â””â”€â”€ Decode payload
   â†“
3. HANDLE ERRORS
   â”œâ”€â”€ TokenExpiredError: Return 401 "Token expired"
   â”œâ”€â”€ JsonWebTokenError: Return 401 "Invalid token"
   â””â”€â”€ Other: Return 401 "Authentication failed"
   â†“
4. SET USER CONTEXT
   â”œâ”€â”€ req.candidate = { id, email }
   â”œâ”€â”€ Extracted from decoded token
   â””â”€â”€ Available in controller
   â†“
5. CONTINUE
   â””â”€â”€ next() â†’ Proceed to controller
```

---

## System Check Flow

### Create System Check

```
POST /api/v1/system-checks
Headers: { Authorization: "Bearer <token>" }
Body: {
  deviceInfo: { browser, OS, screen },
  permissions: { camera, microphone, screenShare },
  deviceTests: { cameraWorking, micWorking, faceDetected }
}
   â†“
Middleware: authenticateCandidate
   â”œâ”€â”€ Validates JWT
   â””â”€â”€ Sets req.candidate
   â†“
Controller: systemCheckController.createSystemCheck()
   â†“
1. EXTRACT DATA
   â”œâ”€â”€ candidateId = req.candidate.id
   â”œâ”€â”€ attemptId = req.body.attemptId
   â”œâ”€â”€ deviceInfo = req.body.deviceInfo
   â”œâ”€â”€ permissions = req.body.permissions
   â””â”€â”€ deviceTests = req.body.deviceTests
   â†“
2. NORMALIZE STATUS VALUES
   â”œâ”€â”€ Convert booleans â†’ "PASSED"/"FAILED"
   â”œâ”€â”€ Convert strings â†’ uppercase
   â”œâ”€â”€ Validate against enum: [PENDING, PASSED, FAILED, RETRY]
   â””â”€â”€ Default: "PENDING"

   Examples:
   â€¢ true â†’ "PASSED"
   â€¢ false â†’ "FAILED"
   â€¢ "passed" â†’ "PASSED"
   â€¢ "invalid" â†’ "PENDING"
   â†“
3. DETERMINE CRITICAL FAILURES
   â”œâ”€â”€ Check: cameraPermission === "FAILED"
   â”œâ”€â”€ Check: micPermission === "FAILED"
   â”œâ”€â”€ Check: screenPermission === "FAILED"
   â”œâ”€â”€ Check: cameraWorking === "FAILED"
   â”œâ”€â”€ Check: micWorking === "FAILED"
   â””â”€â”€ Check: faceDetected === "FAILED"

   Result: criticalFailures = ["camera", "microphone"]
   â†“
4. CALCULATE ALL CHECKS PASSED
   â””â”€â”€ allChecksPassed =
       criticalFailures.length === 0 &&
       cameraPermission === "PASSED" &&
       micPermission === "PASSED" &&
       cameraWorking === "PASSED" &&
       micWorking === "PASSED" &&
       faceDetected === "PASSED"
   â†“
5. CREATE DATABASE RECORD
   â”œâ”€â”€ Query: prisma.systemCheck.create()
   â”œâ”€â”€ Data: {
   â”‚     candidateId,
   â”‚     attemptId,
   â”‚     browserName,
   â”‚     browserVersion,
   â”‚     operatingSystem,
   â”‚     deviceType,
   â”‚     userAgent,
   â”‚     screenWidth,
   â”‚     screenHeight,
   â”‚     viewportWidth,
   â”‚     viewportHeight,
   â”‚     devicePixelRatio,
   â”‚     cameraPermission: "PASSED",
   â”‚     micPermission: "PASSED",
   â”‚     screenPermission: "PASSED",
   â”‚     cameraWorking: "PASSED",
   â”‚     micWorking: "PASSED",
   â”‚     faceDetected: "PENDING",
   â”‚     networkStatus: "PENDING",
   â”‚     allChecksPassed: false,
   â”‚     criticalFailures: ["faceDetection"],
   â”‚     rawCheckData: req.body
   â”‚   }
   â””â”€â”€ Returns: systemCheck object
   â†“
6. LOG SUCCESS
   â”œâ”€â”€ logger.info()
   â””â”€â”€ "System check created for candidate: {id}, allChecksPassed={bool}"
   â†“
7. SEND RESPONSE
   â”œâ”€â”€ Status: 200 OK
   â”œâ”€â”€ Data: systemCheck object
   â””â”€â”€ Message: "system check created successfully"
```

### System Check Validation Logic

```javascript
Permission/Test Status Normalization:

Input        â†’ Output
------------ â†’ --------
true         â†’ "PASSED"
false        â†’ "FAILED"
"true"       â†’ "PASSED"
"false"      â†’ "FAILED"
"PASSED"     â†’ "PASSED"
"passed"     â†’ "PASSED"
"FAILED"     â†’ "FAILED"
"failed"     â†’ "FAILED"
"PENDING"    â†’ "PENDING"
"pending"    â†’ "PENDING"
null         â†’ "PENDING"
undefined    â†’ "PENDING"
"invalid"    â†’ "PENDING"

Critical Failures Check:
âœ“ Camera Permission Failed     â†’ Block
âœ“ Mic Permission Failed         â†’ Block
âœ“ Screen Share Permission Failed â†’ Block
âœ“ Camera Not Working            â†’ Block
âœ“ Mic Not Working               â†’ Block
âœ“ Face Not Detected             â†’ Block
âœ“ Network Failed                â†’ Block

All Checks Passed Criteria:
âœ“ NO critical failures
âœ“ cameraPermission === "PASSED"
âœ“ micPermission === "PASSED"
âœ“ cameraWorking === "PASSED"
âœ“ micWorking === "PASSED"
âœ“ faceDetected === "PASSED"
```

---

## Identity Verification Flow

### Face Capture Upload

```
POST /api/v1/identity-verification/:attemptId/face-capture
Headers: { Authorization: "Bearer <token>" }
Content-Type: multipart/form-data
Body: {
  faceImage: File,
  candidateId: string
}
   â†“
Middleware Chain:
1. authenticateCandidate (JWT validation)
2. uploadFaceImage.single('faceImage') (Multer)
   â†“
Controller: identityVerificationController.uploadFaceCapture()
   â†“
1. VALIDATE INPUTS
   â”œâ”€â”€ Check: attemptId exists?
   â”œâ”€â”€ Check: candidateId exists?
   â”œâ”€â”€ Check: req.file exists?
   â””â”€â”€ Return 400 if missing
   â†“
2. VERIFY CANDIDATE EXISTS
   â”œâ”€â”€ Query: prisma.candidate.findUnique()
   â”œâ”€â”€ Where: { id: candidateId }
   â””â”€â”€ If not found: Delete file â†’ Return 404
   â†“
3. READ UPLOADED IMAGE
   â”œâ”€â”€ fs.readFileSync(req.file.path)
   â””â”€â”€ imageBuffer = Buffer
   â†“
4. CHECK IMAGE QUALITY (BLUR DETECTION)
   â”œâ”€â”€ Call: checkImageBlur(imageBuffer)
   â”œâ”€â”€ Uses: sharp library
   â”œâ”€â”€ Calculates: Laplacian variance (sharpness)
   â”œâ”€â”€ Threshold: 100
   â””â”€â”€ Result: { isBlurry, sharpness }

   If blurry:
   â”œâ”€â”€ Delete uploaded file
   â””â”€â”€ Return 400 "Image too blurry. Please retake."
   â†“
5. GET IMAGE METADATA
   â”œâ”€â”€ Call: getImageMetadata(imageBuffer)
   â”œâ”€â”€ Uses: sharp.metadata()
   â””â”€â”€ Returns: { width, height, format, size }
   â†“
6. RESIZE IF TOO LARGE
   â”œâ”€â”€ Check: width > 1280 OR height > 720?
   â”œâ”€â”€ If yes: resizeImage(imageBuffer)
   â”œâ”€â”€ Resize: fit(1280, 720, { fit: 'inside' })
   â”œâ”€â”€ Compress: quality(85)
   â””â”€â”€ Overwrite original file
   â†“
7. STORE RELATIVE PATH
   â”œâ”€â”€ relativePath = path.relative(process.cwd(), filePath)
   â””â”€â”€ Example: "uploads/faces/1699228800-face.jpg"
   â†“
8. CREATE OR UPDATE VERIFICATION RECORD
   â”œâ”€â”€ Check: Record exists for attemptId?
   â”‚
   â”œâ”€â”€ If EXISTS:
   â”‚   â””â”€â”€ Query: prisma.identityVerification.update()
   â”‚
   â””â”€â”€ If NOT EXISTS:
       â””â”€â”€ Query: prisma.identityVerification.create()

   Data: {
     candidateId,
     attemptId,
     faceImagePath: relativePath,
     faceDetectedInitial: true,
     faceQualityScore: sharpness / 1000,
     verificationStatus: "IN_PROGRESS"
   }
   â†“
9. SEND RESPONSE
   â”œâ”€â”€ Status: 200 OK
   â”œâ”€â”€ Data: {
   â”‚     verification,
   â”‚     imageQuality: {
   â”‚       sharpness,
   â”‚       isSharp: true,
   â”‚       dimensions: "1920x1080"
   â”‚     }
   â”‚   }
   â””â”€â”€ Message: "Face captured successfully"
   â†“
10. ERROR HANDLING
    â”œâ”€â”€ If ANY error occurs
    â”œâ”€â”€ Delete uploaded file (cleanup)
    â””â”€â”€ Throw error â†’ Global error handler
```

### Audio Recording Upload

```
POST /api/v1/identity-verification/:attemptId/audio-recording
Headers: { Authorization: "Bearer <token>" }
Content-Type: multipart/form-data
Body: {
  audioFile: File,
  candidateId: string,
  originalText: string,
  transcription: string (optional)
}
   â†“
Middleware Chain:
1. authenticateCandidate
2. uploadAudio.single('audioFile')
   â†“
Controller: identityVerificationController.uploadAudioRecording()
   â†“
1. VALIDATE INPUTS
   â”œâ”€â”€ Check: attemptId, candidateId, originalText
   â”œâ”€â”€ Check: req.file exists
   â””â”€â”€ Return 400 if missing
   â†“
2. VERIFY CANDIDATE
   â””â”€â”€ Same as face capture
   â†“
3. GET VERIFICATION RECORD
   â”œâ”€â”€ Query: prisma.identityVerification.findUnique()
   â”œâ”€â”€ Where: { attemptId }
   â””â”€â”€ If not found: Return 404 "Complete face capture first"
   â†“
4. CHECK RETRY LIMIT
   â”œâ”€â”€ Max attempts: 3
   â”œâ”€â”€ Current: verification.audioAttemptCount
   â””â”€â”€ If >= 3: Delete file â†’ Return 400 "Max attempts exceeded"
   â†“
5. PROCESS AUDIO
   â”œâ”€â”€ Call: processAudio(filePath)
   â”œâ”€â”€ Uses: fluent-ffmpeg
   â”œâ”€â”€ Converts to: MP3
   â”œâ”€â”€ Compress: bitrate 64k
   â””â”€â”€ Returns: { filePath, size, compressed }
   â†“
6. GET AUDIO DURATION
   â”œâ”€â”€ Call: getAudioDuration(filePath)
   â”œâ”€â”€ Uses: ffmpeg.ffprobe()
   â””â”€â”€ Returns: duration in seconds
   â†“
7. GET TRANSCRIPTION
   â”œâ”€â”€ Check: transcription from frontend?
   â”‚
   â”œâ”€â”€ If PROVIDED:
   â”‚   â””â”€â”€ Use frontend transcription (Web Speech API)
   â”‚
   â””â”€â”€ If NOT PROVIDED:
       â”œâ”€â”€ Check: AssemblyAI configured?
       â”œâ”€â”€ Call: transcribeAudio(filePath)
       â”œâ”€â”€ Upload to AssemblyAI
       â”œâ”€â”€ Wait for transcription
       â””â”€â”€ Returns: { text, confidence }
   â†“
8. CALCULATE MATCH SCORE
   â”œâ”€â”€ Call: checkMatch(originalText, transcription, 80)
   â”œâ”€â”€ Uses: String similarity algorithm
   â”œâ”€â”€ Threshold: 80%
   â”œâ”€â”€ Returns: {
   â”‚     score: 85.5,
   â”‚     isMatch: true,
   â”‚     threshold: 80
   â”‚   }
   â†“
9. UPDATE VERIFICATION RECORD
   â”œâ”€â”€ Query: prisma.identityVerification.update()
   â”œâ”€â”€ Data: {
   â”‚     audioRecordingPath: relativePath,
   â”‚     audioTranscription: text,
   â”‚     audioOriginalText: originalText,
   â”‚     audioMatchScore: 85.5,
   â”‚     audioVerified: true,
   â”‚     audioAttemptCount: currentCount + 1
   â”‚   }
   â””â”€â”€ Returns: updated verification
   â†“
10. PREPARE RESPONSE
    â”œâ”€â”€ Include: verification object
    â”œâ”€â”€ Include: audio validation details
    â”œâ”€â”€ Include: audio info (duration, size)
    â”‚
    â””â”€â”€ If 2nd failed attempt:
        Add warning: "1 more try remaining"
    â†“
11. SEND RESPONSE
    â””â”€â”€ Status: 200 OK
```

### Image Processing Utilities

```
File: src/utils/imageProcessor.js

1. checkImageBlur(imageBuffer, threshold=100)
   â”œâ”€â”€ Uses: sharp library
   â”œâ”€â”€ Process:
   â”‚   1. Grayscale conversion
   â”‚   2. Laplacian convolution (edge detection)
   â”‚   3. Calculate variance
   â”‚   4. Higher variance = sharper image
   â”œâ”€â”€ Returns: { isBlurry: boolean, sharpness: number }
   â””â”€â”€ Example: sharpness < 100 â†’ Too blurry

2. getImageMetadata(imageBuffer)
   â”œâ”€â”€ Uses: sharp.metadata()
   â””â”€â”€ Returns: { width, height, format, size, space, channels }

3. resizeImage(imageBuffer, maxWidth=1280, maxHeight=720)
   â”œâ”€â”€ Uses: sharp.resize()
   â”œâ”€â”€ Options: { fit: 'inside', withoutEnlargement: true }
   â”œâ”€â”€ Quality: 85
   â””â”€â”€ Returns: resized buffer
```

### Audio Processing Utilities

```
File: src/utils/audioProcessor.js

1. processAudio(inputPath)
   â”œâ”€â”€ Uses: fluent-ffmpeg
   â”œâ”€â”€ Output: MP3 format
   â”œâ”€â”€ Bitrate: 64kbps
   â”œâ”€â”€ Channels: Mono
   â””â”€â”€ Returns: { filePath, size, compressed }

2. getAudioDuration(filePath)
   â”œâ”€â”€ Uses: ffmpeg.ffprobe()
   â”œâ”€â”€ Extracts: format.duration
   â””â”€â”€ Returns: duration in seconds
```

---

## Database Schema

### Key Models

```prisma
model Candidate {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String
  lastName  String
  phone     String?

  isBlacklisted Boolean @default(false)
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  systemChecks          SystemCheck[]
  identityVerifications IdentityVerification[]
  assessmentAttempts    CandidateAssessment[]
  proctoringLogs        ProctoringLog[]

  @@map("candidates")
}

model SystemCheck {
  id          String @id @default(uuid())
  candidateId String
  attemptId   String? @unique

  // Device Info
  browserName       String?
  browserVersion    String?
  operatingSystem   String?
  deviceType        String?
  userAgent         String?
  screenWidth       Int?
  screenHeight      Int?
  viewportWidth     Int?
  viewportHeight    Int?
  devicePixelRatio  Float?

  // Permissions
  cameraPermission CheckStatus @default(PENDING)
  micPermission    CheckStatus @default(PENDING)
  screenPermission CheckStatus @default(PENDING)

  // Device Tests
  cameraWorking CheckStatus @default(PENDING)
  micWorking    CheckStatus @default(PENDING)
  faceDetected  CheckStatus @default(PENDING)

  // Network
  networkStatus CheckStatus @default(PENDING)

  // Overall Status
  allChecksPassed  Boolean @default(false)
  criticalFailures Json?

  // Raw Data
  rawCheckData Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  candidate Candidate @relation(fields: [candidateId], references: [id])

  @@map("system_checks")
}

model IdentityVerification {
  id          String @id @default(uuid())
  candidateId String
  attemptId   String @unique

  // Face Capture
  faceImagePath       String?
  faceDetectedInitial Boolean @default(false)
  faceQualityScore    Float?

  // Audio Verification
  audioRecordingPath String?
  audioTranscription String?
  audioOriginalText  String?
  audioMatchScore    Float?
  audioVerified      Boolean @default(false)
  audioAttemptCount  Int     @default(0)

  // Status
  verificationStatus VerificationStatus @default(NOT_STARTED)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  candidate Candidate @relation(fields: [candidateId], references: [id])

  @@map("identity_verifications")
}

enum CheckStatus {
  PENDING
  PASSED
  FAILED
  SKIPPED
  RETRY
}

enum VerificationStatus {
  NOT_STARTED
  IN_PROGRESS
  VERIFIED
  FAILED
  FLAGGED
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register Candidate

```
POST /api/v1/auth/register

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}

Success Response (201):
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "candidate": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}

Error Response (409):
{
  "success": false,
  "message": "Candidate already exists"
}
```

#### 2. Login Candidate

```
POST /api/v1/auth/login

Request:
{
  "email": "john@example.com"
}

Success Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "candidate": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}

Error Response (404):
{
  "success": false,
  "message": "Candidate not found"
}
```

### System Check Endpoints

#### 3. Create System Check

```
POST /api/v1/system-checks

Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Request:
{
  "attemptId": "uuid" (optional),
  "deviceInfo": {
    "browserName": "Chrome",
    "browserVersion": "120.0",
    "operatingSystem": "Windows 10",
    "deviceType": "desktop",
    "userAgent": "Mozilla/5.0...",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "viewportWidth": 1400,
    "viewportHeight": 900,
    "devicePixelRatio": 1
  },
  "permissions": {
    "camera": true,
    "microphone": true,
    "screenShare": true
  },
  "deviceTests": {
    "cameraWorking": false,
    "micWorking": false,
    "faceDetected": false
  }
}

Success Response (200):
{
  "success": true,
  "message": "system check created successfully",
  "data": {
    "id": "uuid",
    "candidateId": "uuid",
    "attemptId": null,
    "browserName": "Chrome",
    "cameraPermission": "PASSED",
    "micPermission": "PASSED",
    "screenPermission": "PASSED",
    "cameraWorking": "FAILED",
    "micWorking": "FAILED",
    "faceDetected": "FAILED",
    "networkStatus": "PENDING",
    "allChecksPassed": false,
    "criticalFailures": ["camera", "microphone", "faceDetection"],
    "createdAt": "2025-11-06T10:30:00.000Z",
    "updatedAt": "2025-11-06T10:30:00.000Z"
  }
}
```

### Identity Verification Endpoints

#### 4. Upload Face Capture

```
POST /api/v1/identity-verification/:attemptId/face-capture

Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}

Request (Form Data):
{
  "faceImage": File,
  "candidateId": "uuid"
}

Success Response (200):
{
  "success": true,
  "message": "Face captured successfully",
  "data": {
    "verification": {
      "id": "uuid",
      "candidateId": "uuid",
      "attemptId": "uuid",
      "faceImagePath": "uploads/faces/1699228800-face.jpg",
      "faceDetectedInitial": true,
      "faceQualityScore": 0.85,
      "verificationStatus": "IN_PROGRESS"
    },
    "imageQuality": {
      "sharpness": 850.5,
      "isSharp": true,
      "dimensions": "1920x1080"
    }
  }
}

Error Response (400):
{
  "success": false,
  "message": "Image is too blurry (sharpness: 75.2). Please retake with better lighting."
}
```

#### 5. Upload Audio Recording

```
POST /api/v1/identity-verification/:attemptId/audio-recording

Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}

Request (Form Data):
{
  "audioFile": File,
  "candidateId": "uuid",
  "originalText": "The quick brown fox jumps over the lazy dog",
  "transcription": "The quick brown fox jumps over the lazy dog" (optional)
}

Success Response (200):
{
  "success": true,
  "message": "Audio recorded successfully",
  "data": {
    "verification": { ... },
    "audioValidation": {
      "transcription": "The quick brown fox jumps over the lazy dog",
      "originalText": "The quick brown fox jumps over the lazy dog",
      "matchScore": 98.5,
      "isMatch": true,
      "threshold": 80,
      "attemptsUsed": 1,
      "attemptsRemaining": 2
    },
    "audioInfo": {
      "duration": 3.5,
      "compressed": true,
      "fileSize": 28672
    }
  }
}

Error Response (400 - Max Attempts):
{
  "success": false,
  "message": "Maximum audio recording attempts (3) exceeded"
}
```

---

## File Structure

```
backend/
â”œâ”€â”€ server.js                          # Entry point
â”œâ”€â”€ app.js                             # Express app configuration
â”œâ”€â”€ package.json
â”œâ”€â”€ .env
â”‚
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma                  # Database schema
â”‚   â””â”€â”€ migrations/
â”‚       â””â”€â”€ 20251105043423_init/
â”‚
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ constants.js               # App configuration
â”‚   â”‚   â”œâ”€â”€ db.js                      # Prisma client
â”‚   â”‚   â””â”€â”€ multer.config.js           # File upload config
â”‚   â”‚
â”‚   â”œâ”€â”€ middlewares/
â”‚   â”‚   â”œâ”€â”€ auth.js                    # JWT authentication
â”‚   â”‚   â”œâ”€â”€ errorHandler.js            # Global error handler
â”‚   â”‚   â”œâ”€â”€ upload.js                  # Multer middleware
â”‚   â”‚   â””â”€â”€ validation.js              # Request validation
â”‚   â”‚
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ index.js                   # Main router
â”‚   â”‚   â”œâ”€â”€ authRoutes.js              # Auth endpoints
â”‚   â”‚   â”œâ”€â”€ systemCheckRoutes.js       # System check endpoints
â”‚   â”‚   â”œâ”€â”€ identityVerificationRoutes.js
â”‚   â”‚   â”œâ”€â”€ proctoringRoutes.js
â”‚   â”‚   â”œâ”€â”€ assessmentRoutes.js
â”‚   â”‚   â””â”€â”€ pingRoutes.js
â”‚   â”‚
â”‚   â”œâ”€â”€ controllers/
â”‚   â”‚   â”œâ”€â”€ authControllers.js         # Auth logic
â”‚   â”‚   â”œâ”€â”€ systemCheckController.js   # System check logic
â”‚   â”‚   â”œâ”€â”€ identityVerificationController.js
â”‚   â”‚   â”œâ”€â”€ proctoringController.js
â”‚   â”‚   â””â”€â”€ assessmentController.js
â”‚   â”‚
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ authService.js
â”‚   â”‚   â”œâ”€â”€ proctoringService.js
â”‚   â”‚   â”œâ”€â”€ assessmentService.js
â”‚   â”‚   â”œâ”€â”€ assemblyAiServices.js      # Speech-to-text
â”‚   â”‚   â””â”€â”€ SocketService.js
â”‚   â”‚
â”‚   â””â”€â”€ utils/
â”‚       â”œâ”€â”€ response.js                # Response helpers
â”‚       â”œâ”€â”€ logger.js                  # Winston logger
â”‚       â”œâ”€â”€ helpers.js
â”‚       â”œâ”€â”€ imageProcessor.js          # Sharp utilities
â”‚       â”œâ”€â”€ audioProcessor.js          # FFmpeg utilities
â”‚       â””â”€â”€ stringSimilarity.js        # Text comparison
â”‚
â””â”€â”€ uploads/                           # File uploads
    â”œâ”€â”€ faces/
    â”œâ”€â”€ audio/
    â””â”€â”€ snapshots/
```

---

## Error Handling

### Global Error Handler

```javascript
File: src/middlewares/errorHandler.js

Structure:
1. asyncHandler (wrapper for async routes)
2. notFoundHandler (404 errors)
3. errorHandler (global catch-all)
```

### Error Flow

```
ERROR OCCURS IN CONTROLLER
   â†“
throw new Error("Something went wrong")
   â†“
asyncHandler catches error
   â†“
Calls next(error)
   â†“
Express error handling middleware
   â†“
errorHandler(err, req, res, next)
   â†“
1. LOG ERROR
   â”œâ”€â”€ logger.error(err.message)
   â”œâ”€â”€ Stack trace logged
   â””â”€â”€ Request details logged
   â†“
2. DETERMINE STATUS CODE
   â”œâ”€â”€ err.statusCode (if set)
   â”œâ”€â”€ 500 (default)
   â””â”€â”€ Special cases: 404, 401, 403
   â†“
3. FORMAT ERROR RESPONSE
   â”œâ”€â”€ Development: Include stack trace
   â”œâ”€â”€ Production: Hide stack trace
   â””â”€â”€ Structure: { success, message, error }
   â†“
4. SEND RESPONSE
   â””â”€â”€ res.status(statusCode).json(...)
```

### Error Types

```javascript
400 Bad Request
â”œâ”€â”€ Missing required fields
â”œâ”€â”€ Invalid request body
â””â”€â”€ Validation errors

401 Unauthorized
â”œâ”€â”€ Missing JWT token
â”œâ”€â”€ Invalid JWT token
â”œâ”€â”€ Expired JWT token
â””â”€â”€ Authentication failed

404 Not Found
â”œâ”€â”€ Route not found
â”œâ”€â”€ Candidate not found
â””â”€â”€ Resource not found

409 Conflict
â”œâ”€â”€ Duplicate email
â””â”€â”€ Resource already exists

429 Too Many Requests
â””â”€â”€ Rate limit exceeded

500 Internal Server Error
â”œâ”€â”€ Database errors
â”œâ”€â”€ File system errors
â””â”€â”€ Unexpected errors
```

---

## Configuration

### Environment Variables

```bash
# .env file

# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# CORS
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# AssemblyAI (Optional)
ASSEMBLY_AI_API_KEY=your-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Constants Configuration

```javascript
File: src/config/constants.js

APP_CONFIG:
â”œâ”€â”€ PORT: 3000
â”œâ”€â”€ NODE_ENV: 'development'
â”œâ”€â”€ API_VERSION: 'v1'
â””â”€â”€ BASE_URL: 'http://localhost:3000'

JWT_CONFIG:
â”œâ”€â”€ ACCESS_TOKEN_SECRET: from .env
â”œâ”€â”€ REFRESH_TOKEN_SECRET: from .env
â”œâ”€â”€ ACCESS_TOKEN_EXPIRY: '1h'
â””â”€â”€ REFRESH_TOKEN_EXPIRY: '7d'

CORS_CONFIG:
â”œâ”€â”€ ALLOWED_ORIGINS: ['http://localhost:5174']
â””â”€â”€ CREDENTIALS: true

RATE_LIMIT_CONFIG:
â”œâ”€â”€ WINDOW_MS: 900000 (15 minutes)
â””â”€â”€ MAX_REQUESTS: 100

UPLOAD_CONFIG:
â”œâ”€â”€ MAX_FILE_SIZE: 10MB
â”œâ”€â”€ ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png']
â”œâ”€â”€ ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav']
â””â”€â”€ UPLOAD_DIR: './uploads'
```

---

## Running the Backend

### Development

```bash
# Install dependencies
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
npm start
```

### Production

```bash
# Build (if needed)
npm run build

# Run migrations
npx prisma migrate deploy

# Start production server
NODE_ENV=production npm start
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name your-migration-name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Open Prisma Studio (Database GUI)
npx prisma studio
```

---

## Summary

### Request Lifecycle

```
1. CLIENT â†’ HTTP Request
2. SERVER â†’ Receives request
3. MIDDLEWARE STACK â†’ Processes request
   â”œâ”€â”€ Security (Helmet)
   â”œâ”€â”€ Compression
   â”œâ”€â”€ Logging (Morgan)
   â”œâ”€â”€ Rate Limiting
   â”œâ”€â”€ CORS
   â””â”€â”€ Body Parsing
4. ROUTING â†’ Matches route
5. AUTH MIDDLEWARE â†’ Validates JWT (if protected)
6. CONTROLLER â†’ Business logic
7. SERVICE â†’ Complex operations (if needed)
8. DATABASE â†’ Prisma queries
9. RESPONSE â†’ Format and send
10. LOGGING â†’ Log request/response
```

### Key Features

```
âœ… JWT Authentication
âœ… Rate Limiting
âœ… CORS Configuration
âœ… Request Logging
âœ… Error Handling
âœ… File Uploads (Multer)
âœ… Image Processing (Sharp)
âœ… Audio Processing (FFmpeg)
âœ… Database (Prisma + PostgreSQL)
âœ… Input Validation
âœ… Security Headers (Helmet)
âœ… Response Compression
```

### Technology Stack

```
Runtime: Node.js
Framework: Express.js
Database: PostgreSQL (Supabase)
ORM: Prisma
Authentication: JWT (jsonwebtoken)
File Upload: Multer
Image Processing: Sharp
Audio Processing: FFmpeg (fluent-ffmpeg)
Speech-to-Text: AssemblyAI
Logging: Winston + Morgan
Security: Helmet
Validation: express-validator
```

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Project:** Proctoring System - Backend  
**Technology Stack:** Node.js + Express + Prisma + PostgreSQL
