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
┌─────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVER.JS                             │
│  • Loads .env                                            │
│  • Starts Express server                                 │
│  • Handles graceful shutdown                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                     APP.JS                               │
│  MIDDLEWARE LAYERS:                                      │
│  ├── Helmet (Security)                                   │
│  ├── Compression (Performance)                           │
│  ├── Morgan (Logging)                                    │
│  ├── Rate Limiting                                       │
│  ├── CORS                                                │
│  └── Body Parsers                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│               ROUTES (src/routes/index.js)               │
│  ├── /api/v1/auth                                        │
│  ├── /api/v1/system-checks                               │
│  ├── /api/v1/identity-verification                       │
│  ├── /api/v1/ping                                        │
│  └── /api/v1/test                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│            AUTHENTICATION MIDDLEWARE                     │
│  • Validates JWT token                                   │
│  • Extracts candidate info                               │
│  • Adds req.candidate                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  CONTROLLERS                             │
│  ├── authControllers.js                                  │
│  ├── systemCheckController.js                            │
│  ├── identityVerificationController.js                   │
│  └── proctoringController.js                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVICES                              │
│  ├── authService.js                                      │
│  ├── proctoringService.js                                │
│  ├── assessmentService.js                                │
│  └── assemblyAiServices.js                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              PRISMA ORM (Database Layer)                 │
│  • Connects to PostgreSQL                                │
│  • Manages transactions                                  │
│  • Type-safe queries                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│             POSTGRESQL DATABASE                          │
│  • Stores all application data                           │
│  • Managed by Supabase                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Server Initialization

### File: `server.js`

```javascript
SERVER STARTUP SEQUENCE:

1. Load Environment Variables
   ├── dotenv.config()
   ├── Reads .env file
   └── Sets process.env variables

2. Initialize Database Connection
   ├── Import './src/config/db.js'
   ├── Prisma connects to PostgreSQL
   └── Connection pooling configured

3. Start Express Server
   ├── app.listen(PORT)
   ├── Default PORT: 3000
   ├── Logs: "Server listening at port: 3000"
   └── Logs: "Environment: development"

4. Setup Error Handlers
   ├── SIGTERM: Graceful shutdown
   ├── SIGINT (Ctrl+C): Graceful shutdown
   ├── unhandledRejection: Log and exit
   └── EADDRINUSE: Port already in use error

5. Server Ready
   └── Listening for HTTP requests
```

### Graceful Shutdown Process

```
SIGNAL RECEIVED (SIGTERM/SIGINT)
   ↓
Log: "SIGTERM received. Closing HTTP server..."
   ↓
server.close()
   ↓
Wait for active connections to finish
   ↓
Close database connections
   ↓
Log: "HTTP server closed"
   ↓
process.exit(0)
```

---

## Middleware Stack

### File: `app.js`

The middleware stack processes EVERY request in this order:

```
REQUEST ENTERS
   ↓
1. HELMET (Security Headers)
   ├── Sets X-Frame-Options: SAMEORIGIN
   ├── Sets X-Content-Type-Options: nosniff
   ├── Sets Strict-Transport-Security
   └── Prevents XSS, clickjacking, MIME sniffing
   ↓
2. COMPRESSION (Gzip Responses)
   ├── Compresses JSON responses
   ├── Reduces bandwidth by ~70%
   └── Faster API responses
   ↓
3. MORGAN (HTTP Logging)
   ├── Development: Logs to console
   ├── Production: Logs to winston files
   └── Example: "GET /api/v1/auth/login 200 45ms"
   ↓
4. RATE LIMITER
   ├── Max: 100 requests per 15 minutes
   ├── Per IP address
   ├── Returns 429 if exceeded
   └── Prevents brute force & DDoS
   ↓
5. CORS (Cross-Origin Sharing)
   ├── Allowed origins: localhost:5174
   ├── Credentials: true
   ├── Methods: GET, POST, PUT, PATCH, DELETE
   └── Headers: Content-Type, Authorization
   ↓
6. BODY PARSERS
   ├── express.json() - Parse JSON bodies
   ├── express.urlencoded() - Parse form data
   └── Limit: 10MB per request
   ↓
7. ROUTES
   ├── /health → Health check
   ├── /api/v1/* → API routes
   └── Matches route pattern
   ↓
8. ROUTE-SPECIFIC MIDDLEWARE
   ├── authenticateCandidate (JWT validation)
   ├── upload middleware (Multer for files)
   └── validation middleware
   ↓
9. CONTROLLER
   └── Business logic execution
   ↓
10. ERROR HANDLERS (if error occurs)
    ├── notFoundHandler (404)
    └── errorHandler (global catch-all)
   ↓
RESPONSE SENT TO CLIENT
```

### Security Features

```
HELMET Protection:
├── XSS Protection: Blocks inline scripts
├── Clickjacking: Prevents iframe embedding
├── MIME Sniffing: Forces correct content types
└── HSTS: Forces HTTPS connections

RATE LIMITING:
├── Window: 15 minutes
├── Max Requests: 100
├── Per: IP Address
└── Response: 429 Too Many Requests

CORS Configuration:
├── Allowed Origins: From .env
├── Credentials: Enabled for cookies/auth
├── Methods: REST HTTP verbs
└── Headers: Content-Type, Authorization
```

---

## Request Flow

### Complete HTTP Request Lifecycle

```
1. CLIENT SENDS REQUEST
   POST /api/v1/auth/login
   Headers: { Content-Type: 'application/json' }
   Body: { "email": "john@example.com" }
   ↓

2. SERVER RECEIVES REQUEST
   ├── Express server accepts connection
   ├── TCP handshake complete
   └── Request object created
   ↓

3. SECURITY MIDDLEWARE
   ├── Helmet adds security headers
   ├── Rate limiter checks IP
   ├── CORS validates origin
   └── Body parser reads JSON
   ↓

4. ROUTE MATCHING
   ├── Checks: /api/v1/auth/login
   ├── Matches: authRoutes
   └── Method: POST
   ↓

5. AUTH MIDDLEWARE (if protected route)
   ├── Extracts Bearer token
   ├── Verifies JWT signature
   ├── Checks expiration
   ├── Extracts candidateId
   └── Sets req.candidate
   ↓

6. VALIDATION MIDDLEWARE (if configured)
   ├── Validates request body
   ├── Checks required fields
   └── Returns 400 if invalid
   ↓

7. CONTROLLER EXECUTION
   ├── authControllers.login()
   ├── Business logic runs
   └── Database queries execute
   ↓

8. DATABASE INTERACTION
   ├── Prisma query: findUnique()
   ├── PostgreSQL executes query
   ├── Returns candidate data
   └── Connection returned to pool
   ↓

9. RESPONSE PREPARATION
   ├── Generate JWT token
   ├── Format response object
   └── Call sendSuccess()
   ↓

10. COMPRESSION & HEADERS
    ├── Gzip compresses response
    ├── Sets Content-Encoding: gzip
    └── Sets Content-Type: application/json
    ↓

11. SEND RESPONSE
    ├── HTTP 200 OK
    ├── JSON body sent
    └── Connection closed (or kept alive)
    ↓

12. LOGGING
    ├── Morgan logs request
    ├── Winston logs to file
    └── Console logs (dev only)
```

---

## Authentication Flow

### Registration Flow

```
POST /api/v1/auth/register
Body: { email, firstName, lastName, phone }
   ↓
Controller: authControllers.register()
   ↓
1. VALIDATION
   ├── Check: email exists?
   ├── Check: firstName exists?
   └── Return 400 if missing
   ↓
2. CHECK EXISTING USER
   ├── Query: prisma.candidate.findUnique()
   ├── Where: { email }
   └── If exists: Return 409 "Already exists"
   ↓
3. CREATE CANDIDATE
   ├── Query: prisma.candidate.create()
   ├── Data: { email, firstName, lastName, phone }
   └── Returns: candidate object
   ↓
4. GENERATE JWT TOKEN
   ├── Payload: { candidateId, email }
   ├── Secret: JWT_ACCESS_TOKEN_SECRET
   ├── Expiry: 1 hour
   └── Returns: token string
   ↓
5. SEND RESPONSE
   ├── Status: 201 Created
   ├── Data: { candidate, token, expiresIn }
   └── Message: "Registration successful"
```

### Login Flow

```
POST /api/v1/auth/login
Body: { email }
   ↓
Controller: authControllers.login()
   ↓
1. VALIDATION
   ├── Check: email provided?
   └── Return 400 if missing
   ↓
2. FIND CANDIDATE
   ├── Query: prisma.candidate.findUnique()
   ├── Where: { email }
   └── If not found: Return 404 "Candidate not found"
   ↓
3. GENERATE JWT TOKEN
   ├── Payload: { candidateId, email }
   ├── Secret: JWT_ACCESS_TOKEN_SECRET
   ├── Expiry: 1 hour
   └── Algorithm: HS256
   ↓
4. SEND RESPONSE
   ├── Status: 200 OK
   ├── Data: { candidate, token, expiresIn }
   └── Message: "Login successful"
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
   ↓
1. EXTRACT TOKEN
   ├── Get: req.headers.authorization
   ├── Format: "Bearer <token>"
   ├── Extract: token = authHeader.substring(7)
   └── If missing: Return 401 "Access token required"
   ↓
2. VERIFY TOKEN
   ├── jwt.verify(token, JWT_ACCESS_TOKEN_SECRET)
   ├── Check signature
   ├── Check expiration
   └── Decode payload
   ↓
3. HANDLE ERRORS
   ├── TokenExpiredError: Return 401 "Token expired"
   ├── JsonWebTokenError: Return 401 "Invalid token"
   └── Other: Return 401 "Authentication failed"
   ↓
4. SET USER CONTEXT
   ├── req.candidate = { id, email }
   ├── Extracted from decoded token
   └── Available in controller
   ↓
5. CONTINUE
   └── next() → Proceed to controller
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
   ↓
Middleware: authenticateCandidate
   ├── Validates JWT
   └── Sets req.candidate
   ↓
Controller: systemCheckController.createSystemCheck()
   ↓
1. EXTRACT DATA
   ├── candidateId = req.candidate.id
   ├── attemptId = req.body.attemptId
   ├── deviceInfo = req.body.deviceInfo
   ├── permissions = req.body.permissions
   └── deviceTests = req.body.deviceTests
   ↓
2. NORMALIZE STATUS VALUES
   ├── Convert booleans → "PASSED"/"FAILED"
   ├── Convert strings → uppercase
   ├── Validate against enum: [PENDING, PASSED, FAILED, RETRY]
   └── Default: "PENDING"

   Examples:
   • true → "PASSED"
   • false → "FAILED"
   • "passed" → "PASSED"
   • "invalid" → "PENDING"
   ↓
3. DETERMINE CRITICAL FAILURES
   ├── Check: cameraPermission === "FAILED"
   ├── Check: micPermission === "FAILED"
   ├── Check: screenPermission === "FAILED"
   ├── Check: cameraWorking === "FAILED"
   ├── Check: micWorking === "FAILED"
   └── Check: faceDetected === "FAILED"

   Result: criticalFailures = ["camera", "microphone"]
   ↓
4. CALCULATE ALL CHECKS PASSED
   └── allChecksPassed =
       criticalFailures.length === 0 &&
       cameraPermission === "PASSED" &&
       micPermission === "PASSED" &&
       cameraWorking === "PASSED" &&
       micWorking === "PASSED" &&
       faceDetected === "PASSED"
   ↓
5. CREATE DATABASE RECORD
   ├── Query: prisma.systemCheck.create()
   ├── Data: {
   │     candidateId,
   │     attemptId,
   │     browserName,
   │     browserVersion,
   │     operatingSystem,
   │     deviceType,
   │     userAgent,
   │     screenWidth,
   │     screenHeight,
   │     viewportWidth,
   │     viewportHeight,
   │     devicePixelRatio,
   │     cameraPermission: "PASSED",
   │     micPermission: "PASSED",
   │     screenPermission: "PASSED",
   │     cameraWorking: "PASSED",
   │     micWorking: "PASSED",
   │     faceDetected: "PENDING",
   │     networkStatus: "PENDING",
   │     allChecksPassed: false,
   │     criticalFailures: ["faceDetection"],
   │     rawCheckData: req.body
   │   }
   └── Returns: systemCheck object
   ↓
6. LOG SUCCESS
   ├── logger.info()
   └── "System check created for candidate: {id}, allChecksPassed={bool}"
   ↓
7. SEND RESPONSE
   ├── Status: 200 OK
   ├── Data: systemCheck object
   └── Message: "system check created successfully"
```

### System Check Validation Logic

```javascript
Permission/Test Status Normalization:

Input        → Output
------------ → --------
true         → "PASSED"
false        → "FAILED"
"true"       → "PASSED"
"false"      → "FAILED"
"PASSED"     → "PASSED"
"passed"     → "PASSED"
"FAILED"     → "FAILED"
"failed"     → "FAILED"
"PENDING"    → "PENDING"
"pending"    → "PENDING"
null         → "PENDING"
undefined    → "PENDING"
"invalid"    → "PENDING"

Critical Failures Check:
✓ Camera Permission Failed     → Block
✓ Mic Permission Failed         → Block
✓ Screen Share Permission Failed → Block
✓ Camera Not Working            → Block
✓ Mic Not Working               → Block
✓ Face Not Detected             → Block
✓ Network Failed                → Block

All Checks Passed Criteria:
✓ NO critical failures
✓ cameraPermission === "PASSED"
✓ micPermission === "PASSED"
✓ cameraWorking === "PASSED"
✓ micWorking === "PASSED"
✓ faceDetected === "PASSED"
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
   ↓
Middleware Chain:
1. authenticateCandidate (JWT validation)
2. uploadFaceImage.single('faceImage') (Multer)
   ↓
Controller: identityVerificationController.uploadFaceCapture()
   ↓
1. VALIDATE INPUTS
   ├── Check: attemptId exists?
   ├── Check: candidateId exists?
   ├── Check: req.file exists?
   └── Return 400 if missing
   ↓
2. VERIFY CANDIDATE EXISTS
   ├── Query: prisma.candidate.findUnique()
   ├── Where: { id: candidateId }
   └── If not found: Delete file → Return 404
   ↓
3. READ UPLOADED IMAGE
   ├── fs.readFileSync(req.file.path)
   └── imageBuffer = Buffer
   ↓
4. CHECK IMAGE QUALITY (BLUR DETECTION)
   ├── Call: checkImageBlur(imageBuffer)
   ├── Uses: sharp library
   ├── Calculates: Laplacian variance (sharpness)
   ├── Threshold: 100
   └── Result: { isBlurry, sharpness }

   If blurry:
   ├── Delete uploaded file
   └── Return 400 "Image too blurry. Please retake."
   ↓
5. GET IMAGE METADATA
   ├── Call: getImageMetadata(imageBuffer)
   ├── Uses: sharp.metadata()
   └── Returns: { width, height, format, size }
   ↓
6. RESIZE IF TOO LARGE
   ├── Check: width > 1280 OR height > 720?
   ├── If yes: resizeImage(imageBuffer)
   ├── Resize: fit(1280, 720, { fit: 'inside' })
   ├── Compress: quality(85)
   └── Overwrite original file
   ↓
7. STORE RELATIVE PATH
   ├── relativePath = path.relative(process.cwd(), filePath)
   └── Example: "uploads/faces/1699228800-face.jpg"
   ↓
8. CREATE OR UPDATE VERIFICATION RECORD
   ├── Check: Record exists for attemptId?
   │
   ├── If EXISTS:
   │   └── Query: prisma.identityVerification.update()
   │
   └── If NOT EXISTS:
       └── Query: prisma.identityVerification.create()

   Data: {
     candidateId,
     attemptId,
     faceImagePath: relativePath,
     faceDetectedInitial: true,
     faceQualityScore: sharpness / 1000,
     verificationStatus: "IN_PROGRESS"
   }
   ↓
9. SEND RESPONSE
   ├── Status: 200 OK
   ├── Data: {
   │     verification,
   │     imageQuality: {
   │       sharpness,
   │       isSharp: true,
   │       dimensions: "1920x1080"
   │     }
   │   }
   └── Message: "Face captured successfully"
   ↓
10. ERROR HANDLING
    ├── If ANY error occurs
    ├── Delete uploaded file (cleanup)
    └── Throw error → Global error handler
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
   ↓
Middleware Chain:
1. authenticateCandidate
2. uploadAudio.single('audioFile')
   ↓
Controller: identityVerificationController.uploadAudioRecording()
   ↓
1. VALIDATE INPUTS
   ├── Check: attemptId, candidateId, originalText
   ├── Check: req.file exists
   └── Return 400 if missing
   ↓
2. VERIFY CANDIDATE
   └── Same as face capture
   ↓
3. GET VERIFICATION RECORD
   ├── Query: prisma.identityVerification.findUnique()
   ├── Where: { attemptId }
   └── If not found: Return 404 "Complete face capture first"
   ↓
4. CHECK RETRY LIMIT
   ├── Max attempts: 3
   ├── Current: verification.audioAttemptCount
   └── If >= 3: Delete file → Return 400 "Max attempts exceeded"
   ↓
5. PROCESS AUDIO
   ├── Call: processAudio(filePath)
   ├── Uses: fluent-ffmpeg
   ├── Converts to: MP3
   ├── Compress: bitrate 64k
   └── Returns: { filePath, size, compressed }
   ↓
6. GET AUDIO DURATION
   ├── Call: getAudioDuration(filePath)
   ├── Uses: ffmpeg.ffprobe()
   └── Returns: duration in seconds
   ↓
7. GET TRANSCRIPTION
   ├── Check: transcription from frontend?
   │
   ├── If PROVIDED:
   │   └── Use frontend transcription (Web Speech API)
   │
   └── If NOT PROVIDED:
       ├── Check: AssemblyAI configured?
       ├── Call: transcribeAudio(filePath)
       ├── Upload to AssemblyAI
       ├── Wait for transcription
       └── Returns: { text, confidence }
   ↓
8. CALCULATE MATCH SCORE
   ├── Call: checkMatch(originalText, transcription, 80)
   ├── Uses: String similarity algorithm
   ├── Threshold: 80%
   ├── Returns: {
   │     score: 85.5,
   │     isMatch: true,
   │     threshold: 80
   │   }
   ↓
9. UPDATE VERIFICATION RECORD
   ├── Query: prisma.identityVerification.update()
   ├── Data: {
   │     audioRecordingPath: relativePath,
   │     audioTranscription: text,
   │     audioOriginalText: originalText,
   │     audioMatchScore: 85.5,
   │     audioVerified: true,
   │     audioAttemptCount: currentCount + 1
   │   }
   └── Returns: updated verification
   ↓
10. PREPARE RESPONSE
    ├── Include: verification object
    ├── Include: audio validation details
    ├── Include: audio info (duration, size)
    │
    └── If 2nd failed attempt:
        Add warning: "1 more try remaining"
    ↓
11. SEND RESPONSE
    └── Status: 200 OK
```

### Image Processing Utilities

```
File: src/utils/imageProcessor.js

1. checkImageBlur(imageBuffer, threshold=100)
   ├── Uses: sharp library
   ├── Process:
   │   1. Grayscale conversion
   │   2. Laplacian convolution (edge detection)
   │   3. Calculate variance
   │   4. Higher variance = sharper image
   ├── Returns: { isBlurry: boolean, sharpness: number }
   └── Example: sharpness < 100 → Too blurry

2. getImageMetadata(imageBuffer)
   ├── Uses: sharp.metadata()
   └── Returns: { width, height, format, size, space, channels }

3. resizeImage(imageBuffer, maxWidth=1280, maxHeight=720)
   ├── Uses: sharp.resize()
   ├── Options: { fit: 'inside', withoutEnlargement: true }
   ├── Quality: 85
   └── Returns: resized buffer
```

### Audio Processing Utilities

```
File: src/utils/audioProcessor.js

1. processAudio(inputPath)
   ├── Uses: fluent-ffmpeg
   ├── Output: MP3 format
   ├── Bitrate: 64kbps
   ├── Channels: Mono
   └── Returns: { filePath, size, compressed }

2. getAudioDuration(filePath)
   ├── Uses: ffmpeg.ffprobe()
   ├── Extracts: format.duration
   └── Returns: duration in seconds
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
├── server.js                          # Entry point
├── app.js                             # Express app configuration
├── package.json
├── .env
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── migrations/
│       └── 20251105043423_init/
│
├── src/
│   ├── config/
│   │   ├── constants.js               # App configuration
│   │   ├── db.js                      # Prisma client
│   │   └── multer.config.js           # File upload config
│   │
│   ├── middlewares/
│   │   ├── auth.js                    # JWT authentication
│   │   ├── errorHandler.js            # Global error handler
│   │   ├── upload.js                  # Multer middleware
│   │   └── validation.js              # Request validation
│   │
│   ├── routes/
│   │   ├── index.js                   # Main router
│   │   ├── authRoutes.js              # Auth endpoints
│   │   ├── systemCheckRoutes.js       # System check endpoints
│   │   ├── identityVerificationRoutes.js
│   │   ├── proctoringRoutes.js
│   │   ├── assessmentRoutes.js
│   │   └── pingRoutes.js
│   │
│   ├── controllers/
│   │   ├── authControllers.js         # Auth logic
│   │   ├── systemCheckController.js   # System check logic
│   │   ├── identityVerificationController.js
│   │   ├── proctoringController.js
│   │   └── assessmentController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── proctoringService.js
│   │   ├── assessmentService.js
│   │   ├── assemblyAiServices.js      # Speech-to-text
│   │   └── SocketService.js
│   │
│   └── utils/
│       ├── response.js                # Response helpers
│       ├── logger.js                  # Winston logger
│       ├── helpers.js
│       ├── imageProcessor.js          # Sharp utilities
│       ├── audioProcessor.js          # FFmpeg utilities
│       └── stringSimilarity.js        # Text comparison
│
└── uploads/                           # File uploads
    ├── faces/
    ├── audio/
    └── snapshots/
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
   ↓
throw new Error("Something went wrong")
   ↓
asyncHandler catches error
   ↓
Calls next(error)
   ↓
Express error handling middleware
   ↓
errorHandler(err, req, res, next)
   ↓
1. LOG ERROR
   ├── logger.error(err.message)
   ├── Stack trace logged
   └── Request details logged
   ↓
2. DETERMINE STATUS CODE
   ├── err.statusCode (if set)
   ├── 500 (default)
   └── Special cases: 404, 401, 403
   ↓
3. FORMAT ERROR RESPONSE
   ├── Development: Include stack trace
   ├── Production: Hide stack trace
   └── Structure: { success, message, error }
   ↓
4. SEND RESPONSE
   └── res.status(statusCode).json(...)
```

### Error Types

```javascript
400 Bad Request
├── Missing required fields
├── Invalid request body
└── Validation errors

401 Unauthorized
├── Missing JWT token
├── Invalid JWT token
├── Expired JWT token
└── Authentication failed

404 Not Found
├── Route not found
├── Candidate not found
└── Resource not found

409 Conflict
├── Duplicate email
└── Resource already exists

429 Too Many Requests
└── Rate limit exceeded

500 Internal Server Error
├── Database errors
├── File system errors
└── Unexpected errors
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
├── PORT: 3000
├── NODE_ENV: 'development'
├── API_VERSION: 'v1'
└── BASE_URL: 'http://localhost:3000'

JWT_CONFIG:
├── ACCESS_TOKEN_SECRET: from .env
├── REFRESH_TOKEN_SECRET: from .env
├── ACCESS_TOKEN_EXPIRY: '1h'
└── REFRESH_TOKEN_EXPIRY: '7d'

CORS_CONFIG:
├── ALLOWED_ORIGINS: ['http://localhost:5174']
└── CREDENTIALS: true

RATE_LIMIT_CONFIG:
├── WINDOW_MS: 900000 (15 minutes)
└── MAX_REQUESTS: 100

UPLOAD_CONFIG:
├── MAX_FILE_SIZE: 10MB
├── ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png']
├── ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav']
└── UPLOAD_DIR: './uploads'
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
1. CLIENT → HTTP Request
2. SERVER → Receives request
3. MIDDLEWARE STACK → Processes request
   ├── Security (Helmet)
   ├── Compression
   ├── Logging (Morgan)
   ├── Rate Limiting
   ├── CORS
   └── Body Parsing
4. ROUTING → Matches route
5. AUTH MIDDLEWARE → Validates JWT (if protected)
6. CONTROLLER → Business logic
7. SERVICE → Complex operations (if needed)
8. DATABASE → Prisma queries
9. RESPONSE → Format and send
10. LOGGING → Log request/response
```

### Key Features

```
✅ JWT Authentication
✅ Rate Limiting
✅ CORS Configuration
✅ Request Logging
✅ Error Handling
✅ File Uploads (Multer)
✅ Image Processing (Sharp)
✅ Audio Processing (FFmpeg)
✅ Database (Prisma + PostgreSQL)
✅ Input Validation
✅ Security Headers (Helmet)
✅ Response Compression
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
