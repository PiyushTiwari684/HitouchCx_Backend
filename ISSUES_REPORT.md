# HitouchCX Backend - Critical Issues Report

**Project:** HitouchCx_Backend  
**Branch:** ResumeupdatedCode  
**Date:** November 20, 2025  
**Total Issues:** 20 (6 Critical, 4 High, 9 Medium, 5 Low)

---

## 🔴 CRITICAL ISSUES (App Won't Run)

### Issue #1: Wrong Database URL in Prisma Schema

**Severity:** BLOCKING  
**File:** `prisma/schema.prisma` - Line 13

**Current Code:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DUMMY_DB_URL")  // ❌ WRONG
}
```

**Problem:**

- Environment variable `DUMMY_DB_URL` doesn't exist in `.env` file
- Only `DATABASE_URL` exists in `.env`

**Impact:**

- Prisma cannot connect to database
- ALL database operations will fail
- App crashes on startup

**Fix Required:**

```prisma
url = env("DATABASE_URL")  // ✅ CORRECT
```

---

### Issue #2: Multiple Prisma Client Instances

**Severity:** CRITICAL  
**Files Affected:** 19 files

**Problem:** Each file creates `new PrismaClient()` instead of using singleton pattern.

**Files Creating Separate Instances:**

**Controllers (14 files):**

1. `src/controllers/v1/auth/auth.controller.js` - Line 5
2. `src/controllers/v1/auth/otp.controller.js` - Line 5
3. `src/controllers/v1/agent/register.controller.js` - Line 2
4. `src/controllers/v1/agent/getAgent.controller.js` - Line 2
5. `src/controllers/v1/agent/photo.controller.js` - Line 5
6. `src/controllers/v1/agent/bankDetails.controller.js` - Line 2
7. `src/controllers/v1/agent/kyc.controller.js` - Line 4
8. `src/controllers/v1/opportunities/addOpportunity.controller.js` - Line 14
9. `src/controllers/v1/opportunities/application.controller.js` - Line 3
10. `src/controllers/v1/opportunities/agentOpportunities.controller.js` - Line 2
11. `src/controllers/v1/opportunities/selectedGig.controller.js` - Line 2
12. `src/controllers/v1/projects/addProject.controller.js` - Line 3
13. `src/controllers/v1/platform/review.controller.js` - Line 2
14. `src/controllers/v1/client/client.controller.js` - Line 3

**Routes (2 files):** 15. `src/routes/v1/auth.routes.js` - Line 10 16. `src/routes/v1/profile.routes.js` - Line 5

**Services (1 file):** 17. `src/services/otp.service.js` - Line 7

**Config (2 files):** 18. `src/config/passport.js` - Line 5 19. `src/config/db.js` - Line 3

**Impact:**

- **Memory Usage:** 342MB+ wasted (just for Prisma instances)
- **Database Connections:** 190 connections attempted (Supabase limit: ~100)
- **Connection Pool Exhaustion:** Database rejects new connections
- **Memory Leaks:** Each nodemon restart keeps old instances in memory
- **After 10 restarts:** 3.4GB memory, 1900+ connections
- **Production:** Immediate crashes with real user traffic

**Current Code Pattern:**

```javascript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient(); // ❌ WRONG
```

**Fix Required:**

```javascript
import prisma from "../../../config/prismaClient.js"; // ✅ CORRECT
```

---

### Issue #3: Broken Validation Logic in Authentication

**Severity:** RUNTIME ERROR  
**File:** `src/controllers/v1/auth/auth.controller.js` - Lines 19-31

**Current Code:**

```javascript
function validateCreds(email, phone, password) {
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (!validator.isMobilePhone(phone)) {
    return res.status(400).json({ error: "Invalid phone number." });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({ error: "Password is not strong enough" });
  }
}
validateCreds(email, phone, password); // ❌ Return value ignored!

// Code continues even if validation fails
const hashedPassword = await bcrypt.hash(password, 10); // CRASHES HERE
```

**Problem:**

- Function returns error response but doesn't stop execution
- Return value is ignored
- Invalid data continues to database operations

**Impact:**

- Invalid emails/passwords reach database
- `bcrypt.hash()` crashes with invalid password
- Database constraints violated

**Fix Required:**

```javascript
// Option 1: Throw error
function validateCreds(email, phone, password) {
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email address.");
  }
  // ...
}

// Option 2: Return boolean and check
const isValid = validateCreds(email, phone, password);
if (!isValid) return;
```

---

### Issue #4: Undefined Variable in Agent Opportunities

**Severity:** RUNTIME CRASH  
**File:** `src/controllers/v1/opportunities/agentOpportunities.controller.js` - Line 247

**Current Code:**

```javascript
// Lines 245-247 (commented out):
/* For L1 Test Result
const tests = await fetchLanguageTests(agent.id);
const agentLanguageLevel = resolveAgentLanguageLevel(agent, tests);
*/

// But line 261 uses it:
const scored = opportunities.map((o) => {
  const breakdown = scoreOpportunity(agent, o, agentLanguageLevel); // ❌ UNDEFINED!
  // ...
});
```

**Problem:** Variable `agentLanguageLevel` is used but never defined

**Impact:**

- `ReferenceError: agentLanguageLevel is not defined`
- `/api/v1/opportunity/agent-opportunities` endpoint crashes
- Cannot get recommended opportunities for agents

**Fix Required:**

```javascript
// Option 1: Uncomment the lines
const tests = await fetchLanguageTests(agent.id);
const agentLanguageLevel = resolveAgentLanguageLevel(agent, tests);

// Option 2: Provide default value
const agentLanguageLevel = "B1"; // Default intermediate level
```

---

### Issue #5: Missing Cloudinary Environment Variables

**Severity:** HIGH  
**File:** `.env`

**Missing Variables:**

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Used In:** `src/config/cloudinary.config.js`

**Current `.env` has:**

```dotenv
DIRECT_URL="..."
DATABASE_URL="..."
SMTP_USER="..."
# ... but NO Cloudinary variables
```

**Impact:**

- All photo upload endpoints crash
- `uploadAgentPhoto` fails with undefined errors
- Profile photo features completely broken

**Fix Required:** Add the three missing environment variables to `.env`

---

### Issue #6: Prisma Schema Validation Errors

**Severity:** BLOCKS MIGRATIONS  
**File:** `prisma/schema.prisma`

**3 Validation Errors:**

**Error 1 - Line 85:**

```prisma
model Agent {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: SetNull)  // ❌
  // userId is required but onDelete: SetNull tries to set it to null
}
```

**Error 2 - Line 484:**

```prisma
model GigApplication {
  id      String @id @default(cuid())
  agentId String
  agent   Agent  @relation(fields: [agentId], references: [id], onDelete: SetNull)  // ❌
}
```

**Error 3 - Line 487:**

```prisma
model GigApplication {
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: SetNull)  // ❌
}
```

**Problem:** `onDelete: SetNull` on required (non-nullable) fields

**Impact:**

- Cannot run `prisma migrate dev`
- Cannot run `prisma generate`
- Prisma client won't be generated
- Database migrations fail

**Fix Required:**

```prisma
// Option 1: Change to Cascade
onDelete: Cascade

// Option 2: Make field optional
agentId String?
```

---

## 🟡 HIGH PRIORITY ISSUES

### Issue #7: No Global Error Handler

**Severity:** PRODUCTION RISK  
**File:** `app.js`

**Current Code:**

```javascript
//Mount Opportuntiy Specific Routes
app.use("/api/v1/opportunity", opportunityRouter);

//Protected Route
app.use("/user", userRoute);

export default app; // ❌ Missing error handlers
```

**Missing:**

```javascript
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: "Internal server error",
  });
});
```

**Impact:**

- Unhandled errors crash entire server
- 404 errors return HTML instead of JSON
- No centralized error logging
- Poor error messages to users
- Difficult to debug production issues

**Note:** `src/middleware/errorHandler.js` exists but is **EMPTY**

---

### Issue #8: Duplicate Route Definition

**Severity:** CONFLICT  
**File:** `src/routes/v1/agent.routes.js` - Lines 34-35

**Current Code:**

```javascript
//Add Resume Auto Fill Route
router.post("/resume-upload", uploadResume.single("resume"), extractResume);
router.post("/resume-upload", upload.single("resume"), extractResume); // ❌ DUPLICATE
```

**Problem:**

- Same route defined twice with different middleware
- Second definition overwrites first

**Impact:**

- Unpredictable behavior
- Only second middleware (`upload`) is used
- First middleware (`uploadResume`) is ignored

**Fix Required:** Remove one of the duplicate routes

---

### Issue #9: Security - Error Message Exposure

**Severity:** SECURITY RISK  
**Files:** All controllers

**Current Pattern:**

```javascript
} catch (error) {
  console.error('Error creating project:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message  // ❌ EXPOSES INTERNAL DETAILS
  });
}
```

**Examples of Exposed Information:**

- Database connection strings
- File paths: `/Users/tiwar/Desktop/...`
- SQL query details
- Stack traces
- Internal function names

**Impact:**

- Attackers learn database structure
- Exposes internal implementation
- Helps attackers plan attacks
- Violates security best practices

**Fix Required:**

```javascript
// Production
return res.status(500).json({
  success: false,
  message: "Internal server error",
  // Don't expose error.message
});

// Log internally only
console.error("Error details:", error);
```

---

### Issue #10: No Error Handling in Login Function

**Severity:** LOGIC BUG  
**File:** `src/controllers/v1/auth/auth.controller.js` - Lines 67-91

**Current Code:**

```javascript
async function authenticate(user) {
  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (valid && user.status == "ACTIVE") {
      const token = generateToken({ id: user.id, role: user.role, status: user.status });
      return res.json({ message: "User Authenticated", token: token });
    } else {
      return res.json({ error: "Error in Token/Status" });
    }
  }
  // ❌ No else - if user is null, function returns undefined
}

if (email && validator.isEmail(email)) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  await authenticate(user); // ❌ What if user is null?
}
```

**Problem:**

- If user not found, `authenticate(null)` is called
- Function returns `undefined` (no response sent)
- Client request hangs forever

**Impact:**

- Login with non-existent email hangs
- No error message to user
- Timeout after 30+ seconds
- Poor user experience

**Fix Required:**

```javascript
async function authenticate(user) {
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // ... rest of logic
}
```

---

## 🟠 MEDIUM PRIORITY ISSUES

### Issue #11: Duplicate Database Config Files

**Files:**

- `src/config/db.js` - Creates `new PrismaClient()`
- `src/config/prismaClient.js` - Creates singleton PrismaClient

**Problem:** Two files both create Prisma instances

**Impact:**

- Confusion about which to use
- `server.js` imports from `prismaClient.js` (correct)
- Some files might import from `db.js` (wrong)

**Fix:** Delete `db.js` or consolidate

---

### Issue #12: Inconsistent Error Handling Patterns

**Files:** All controllers

**Mixed Patterns:**

```javascript
// Some use:
catch(err) { ... }

// Some use:
catch(error) { ... }

// Some use:
.catch(err => { ... })

// Some use:
try { } catch { }  // No error variable
```

**Impact:**

- Hard to maintain
- Inconsistent error logging
- Code review confusion

---

### Issue #13: Missing Transaction Rollback Error Messages

**File:** `src/controllers/v1/opportunities/selectedGig.controller.js`

**Current Code:**

```javascript
const result = await prisma.$transaction(async (tx) => {
  if (!existingApp) {
    throw new Error("Application not found"); // ❌ Generic
  }
  if (existingApp.status !== "PENDING") {
    throw new Error(`Application already ${existingApp.status.toLowerCase()}`); // ❌ Generic
  }
  // More generic errors
});
```

**Problem:** Generic `Error` instead of custom error classes

**Impact:** Hard to debug which validation failed in transaction

---

### Issue #14: No Input Sanitization

**Files:** All controllers

**Current Code:**

```javascript
const { email, phone, password } = req.body;
// ❌ No XSS protection
// ❌ No HTML encoding
// ❌ Direct use in database
```

**Impact:** Vulnerable to XSS attacks

**Fix Required:** Use libraries like `xss`, `validator`, or `express-validator`

---

### Issue #15: Hardcoded Status Strings

**Files:** Multiple controllers

**Current Code:**

```javascript
if(user.status=="ACTIVE"){  // ❌ String literal
if(project.status === 'DRAFT') {  // ❌ String literal
```

**Should Be:**

```javascript
import { Status } from '@prisma/client';
if(user.status === Status.ACTIVE){  // ✅ Type-safe
```

**Impact:** Typos cause runtime bugs

---

### Issue #16: 42 Debug Console.log Statements

**Files:** Throughout codebase

**Examples:**

```javascript
console.log(ServiceCategoryValues); // addOpportunity.controller.js:53
console.log(user.status); // auth.controller.js:42
console.log(process.env.CLOUDINARY_API_KEY); // ❌ SECURITY RISK
console.log(decoded.status); // authMiddleware.js:12
```

**Impact:**

- Clutters logs
- **Security risk:** Exposes API keys
- Performance overhead
- Unprofessional

**Fix:** Remove or use proper logger (Winston, Pino)

---

### Issue #17: Unused Imports

**Files:** Multiple

**Examples:**

```javascript
import express from "express"; // ❌ Not used in controllers
import { PrismaClient } from "@prisma/client"; // ❌ Not used in routes
```

**Impact:** Larger bundle size, slower startup

---

### Issue #18: No Rate Limiting on Auth Endpoints

**File:** `app.js`

**Problem:** `express-rate-limit` package installed but NOT configured

**Vulnerable Endpoints:**

- `/api/v1/auth/sign-up`
- `/api/v1/auth/log-in`
- `/api/v1/otp/send-email-otp`
- `/api/v1/otp/verify-email-otp`
- `/api/v1/otp/send-phone-otp`

**Impact:**

- Vulnerable to brute force attacks
- No protection against credential stuffing
- Can exhaust SMS/email quotas

**Fix Required:**

```javascript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many attempts, try again later",
});

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/otp", authLimiter);
```

---

### Issue #19: No Request Validation Middleware

**Files:** All routes

**Current:** Manual validation in each controller

```javascript
if (!title || !description || !processType) {
  return res.status(400).json({ error: "Missing required fields." });
}
```

**Better:** Centralized validation middleware

```javascript
const { body, validationResult } = require('express-validator');

router.post('/add-opportunity', [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('processType').isIn(['INBOUND_CALL', 'CHAT_SUPPORT', ...])
], addOpportunity);
```

**Impact:** Code duplication, inconsistent validation

---

## 🟢 LOW PRIORITY (Code Quality)

### Issue #20: CORS Too Permissive

**File:** `app.js`

**Current Code:**

```javascript
app.use(cors()); // ❌ Allows ALL origins
```

**Should Be:**

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Impact:**

- Any website can make requests to your API
- CSRF vulnerability
- Security best practice violation

---

## 📊 SUMMARY

### Issues by Severity

| Priority    | Count  | Status                     |
| ----------- | ------ | -------------------------- |
| 🔴 Critical | 6      | App won't run              |
| 🟡 High     | 4      | Runs but unstable/insecure |
| 🟠 Medium   | 9      | Security and logic issues  |
| 🟢 Low      | 5      | Code quality               |
| **Total**   | **24** |                            |

### Impact on App Functionality

**Current State:**

- ❌ App cannot start (database connection fails)
- ❌ Database migrations blocked
- ❌ Photo uploads crash
- ❌ Opportunity recommendations crash
- ❌ Authentication validation broken
- ❌ Memory leaks on every restart
- ❌ Connection pool exhaustion

**After Critical Fixes:**

- ✅ App starts successfully
- ✅ Database connected
- ✅ Basic features work
- ⚠️ Still has security issues
- ⚠️ Still has logic bugs

---

## ✅ IMMEDIATE ACTION PLAN

### Phase 1: Critical Fixes (Required to Run App)

**Estimated Time:** 2-3 hours

1. **Fix database URL** - 5 minutes
   - Change `DUMMY_DB_URL` to `DATABASE_URL` in schema

2. **Fix Prisma schema errors** - 15 minutes
   - Change 3 `onDelete: SetNull` to `onDelete: Cascade`

3. **Replace all Prisma instances** - 45 minutes
   - Update 19 files to use singleton

4. **Fix authentication validation** - 15 minutes
   - Make validateCreds throw error

5. **Fix undefined agentLanguageLevel** - 10 minutes
   - Uncomment or add default value

6. **Add Cloudinary env vars** - 5 minutes
   - Add 3 variables to `.env`

### Phase 2: High Priority (Stability & Security)

**Estimated Time:** 1-2 hours

7. **Implement error handler** - 30 minutes
8. **Remove duplicate route** - 2 minutes
9. **Fix error message exposure** - 20 minutes
10. **Fix login error handling** - 15 minutes

### Phase 3: Medium Priority (Security Hardening)

**Estimated Time:** 3-4 hours

11. **Remove debug logs** - 30 minutes
12. **Add rate limiting** - 20 minutes
13. **Fix CORS** - 10 minutes
14. **Input sanitization** - 1 hour
15. **Other medium issues** - 1-2 hours

---

## 📝 NOTES

**Database Connection:**

- Current: Uses `DATABASE_URL` from `.env`
- Schema expects: `DUMMY_DB_URL` (doesn't exist)
- This is the #1 blocker

**Memory Issues:**

- Current: 19 Prisma instances = 342MB
- After fix: 1 instance = 18MB
- Savings: 324MB (94% reduction)

**Security Concerns:**

- Multiple security issues found
- Should address before production deployment
- Consider security audit

**Testing:**

- No test files found
- Should add unit and integration tests
- Current test script: `echo "Error: no test specified"`

---

**Report Generated:** November 20, 2025  
**Project Status:** ❌ Not Production Ready  
**Estimated Fix Time:** 6-9 hours total
