# Restructuring Guide: Modular Monolith Architecture

This guide explains how to restructure the existing `HitouchCx_Backend` codebase into a modular architecture. This approach groups related features (controllers, services, validators, routes) into self-contained modules, making the application more scalable and maintainable.

## 1. High-Level Strategy

*   **Modules (`src/modules/`)**: Each domain (Auth, KYC, Assessment, etc.) gets its own folder. All logic specific to that domain lives there.
*   **Shared (`src/shared/`)**: Reusable code used across multiple modules (Database, generic Utils, Middlewares, Integrations like SendGrid/Twilio).
*   **Root Files**: `app.js` and `server.js` will remain but will need to be updated to load routes from the new module locations.
*   **Module System**: The project uses **ESM** (`import`/`export`), so all file moves must update import paths relative to the new location.

---

## 2. Directory Structure Mapping

### A. Modules (`src/modules/`)

Create the `src/modules` directory. Then, move and split files as follows:

#### 1. Auth Module (`src/modules/auth/`)
*   **Controllers**:
    *   Split `src/controllers/v1/auth/auth.controller.js`:
        *   `signUp`, `logIn`, `refresh`, `logout` -> `src/modules/auth/controllers/auth.controller.js`
        *   `requestForgotPassword`, `verifyForgotPasswordOtp`, `resetPasswordWithToken` -> `src/modules/auth/controllers/password.controller.js`
*   **Services**:
    *   Extract logic from controllers into services if not already done.
    *   `src/services/otp.service.js` -> `src/modules/auth/services/auth.service.js` (or keep as a shared notification service if used elsewhere).
    *   Logic for token generation from `src/utils/token.js` -> `src/modules/auth/services/token.service.js`.
*   **Routes**:
    *   `src/routes/v1/core/auth.routes.js` -> `src/modules/auth/routes/auth.routes.js`
*   **Validators**:
    *   Extract validation logic (currently inside controllers or `src/utils/validators`) into:
        *   `src/modules/auth/validators/signUp.validator.js`
        *   `src/modules/auth/validators/logIn.validator.js`

#### 2. KYC Module (`src/modules/kyc/`)
*   **Controllers**: `src/controllers/v1/kyc/*.js` -> `src/modules/kyc/controllers/kyc.controller.js`
*   **Services**: `src/services/kyc/*.js` -> `src/modules/kyc/services/`
*   **Routes**: `src/routes/v1/core/kyc.routes.js` -> `src/modules/kyc/routes/kyc.routes.js`
*   **Validators**: `src/utils/kyc-validator.js` -> `src/modules/kyc/validators/`

#### 3. Assessment Module (`src/modules/assessment/`)
*   *Note: Rename `proctoring-assessment` to `assessment`.*
*   **Controllers**: `src/controllers/v1/proctoring-assessment/*.js` -> `src/modules/assessment/controllers/`
*   **Services**: `src/services/proctoring-assessment/*.js` -> `src/modules/assessment/services/`
*   **Routes**: `src/routes/v1/proctoring-assessment/` -> `src/modules/assessment/routes/assessment.routes.js`

#### 4. Agreement Module (`src/modules/agreement/`)
*   **Controllers**: `src/controllers/v1/agreement/*.js` -> `src/modules/agreement/controllers/agreement.controller.js`
*   **Services**:
    *   `src/services/agreement.service.js` -> `src/modules/agreement/services/agreement.service.js`
    *   `src/services/pdf.service.js` -> `src/modules/agreement/services/pdfGeneration.service.js`
*   **Routes**: `src/routes/v1/core/agreement.routes.js` -> `src/modules/agreement/routes/agreement.routes.js`

#### 5. Agent Module (`src/modules/agent/`)
*   **Controllers**: `src/controllers/v1/agent/*.js` -> `src/modules/agent/controllers/`
*   **Routes**: `src/routes/v1/core/agent.routes.js` -> `src/modules/agent/routes/agent.routes.js`

#### 6. Resume Module (`src/modules/resume/`)
*   **Controllers**: `src/controllers/v1/resume/*.js` -> `src/modules/resume/controllers/resume.controller.js`
*   **Services**: `src/services/resumeParser.service.js` -> `src/modules/resume/services/resumeParsing.service.js`
*   **Routes**: Create `src/modules/resume/routes/resume.routes.js` (if it exists in `index.routes.js` or elsewhere).

#### 7. Chatbot Module (`src/modules/chatbot/`)
*   **Controllers**: `src/controllers/v1/chatbot/*.js` -> `src/modules/chatbot/controllers/chatbot.controller.js`
*   **Services**: `src/services/conversation.service.js` -> `src/modules/chatbot/services/conversationFlow.service.js`
*   **Routes**: `src/routes/v1/chatbot/` -> `src/modules/chatbot/routes/chatbot.routes.js`

#### 8. Notification Module (`src/modules/notification/`)
*   **Services**:
    *   `src/services/notification.service.js` -> `src/modules/notification/services/`
    *   `src/services/email.service.js` -> `src/modules/notification/services/email.service.js`
    *   `src/services/otp.service.js` -> `src/modules/notification/services/sms.service.js` (if strictly SMS/OTP).

#### 9. Other Modules (New)
*   **Client**: `src/controllers/v1/client` -> `src/modules/client/`
*   **Opportunities**: `src/controllers/v1/opportunities` -> `src/modules/opportunities/`
*   **Projects**: `src/controllers/v1/projects` -> `src/modules/projects/`
*   **Platform**: `src/controllers/v1/platform` -> `src/modules/platform/`

---

### B. Shared (`src/shared/`)

Move reusable components here.

*   **Database**:
    *   `src/config/db.js` -> `src/shared/database/connection.js` (or similar).
    *   `prisma/` remains at the root, but repository wrappers can go to `src/shared/database/repositories/`.
*   **Integrations**:
    *   **Cloudinary**: `src/utils/cloudinaryUpload.js` & `src/config/cloudinary.config.js` -> `src/shared/integrations/cloudinary/`
    *   **AI**: `src/utils/groq.client.js`, `src/services/assemblyAi.service.js` -> `src/shared/integrations/ai/`
    *   **SendGrid/Twilio**: Move relevant parts from `src/services/email.service.js` if they are raw clients -> `src/shared/integrations/sendgrid/`, etc.
*   **Utils**:
    *   `src/utils/ApiError.js`, `ApiResponse.js`, `asyncHandler.js` -> `src/shared/utils/errors/` or `src/shared/utils/helpers/`.
*   **Middlewares**:
    *   `src/middlewares/` -> `src/shared/middlewares/`.

---

## 3. Implementation Steps

### Step 1: Create Directory Skeleton
Run the following commands to create the structure:
```bash
mkdir -p src/modules/{auth,kyc,assessment,agreement,agent,resume,chatbot,notification,client,opportunities,projects,platform}/{controllers,services,validators,routes}
mkdir -p src/shared/{routes,database,integrations,utils,middlewares,config}
```

### Step 2: Move Files & Refactor Imports
For each module:
1.  **Move the file**: e.g., `mv src/controllers/v1/auth/auth.controller.js src/modules/auth/controllers/auth.controller.js`.
2.  **Update Imports**: Open the moved file.
    *   Change `import prisma from '../../../config/db.js'` to `import prisma from '../../../shared/config/db.js'` (adjusting depth).
    *   Change `import { ApiError } from '../../../utils/ApiError.js'` to `import { ApiError } from '../../../shared/utils/errors/ApiError.js'`.

### Step 3: Central Route Aggregator
Create `src/shared/routes/index.js` (or `src/modules/index.js`) to combine all module routes.

```javascript
// src/shared/routes/index.js
import express from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes.js';
import kycRoutes from '../../modules/kyc/routes/kyc.routes.js';
// ... import other routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
// ...

export default router;
```

### Step 4: Update Entry Point
Update `app.js` or `server.js` to point to the new main router.

```javascript
// app.js
import routes from './src/shared/routes/index.js';
app.use('/api/v1', routes);
```

## 4. Handling Unlisted Modules
The existing code contains `client`, `opportunities`, `projects`, and `platform` features. These were not in your target list but are essential for the app. I have mapped them to their own modules in `src/modules/` to maintain the pattern.
