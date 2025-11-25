-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('AUDIO_MCQ', 'SPEAKING', 'READING_MCQ', 'WRITING', 'FILL_BLANK');

-- CreateEnum
CREATE TYPE "CEFRLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'SKIPPED', 'RETRY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'FACE_MISMATCH', 'TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT', 'RIGHT_CLICK', 'DEV_TOOLS_OPEN', 'MOUSE_LEAVE', 'KEYBOARD_SHORTCUT', 'SCREEN_SHARE_DISABLED', 'AUDIO_DISABLED', 'CAMERA_DISABLED', 'BACKGROUND_NOISE', 'NETWORK_DISCONNECTED', 'SUSPICIOUS_ACTIVITY');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'AUTO_SUBMITTED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "BlacklistReason" AS ENUM ('VIOLATION_THRESHOLD', 'CRITICAL_VIOLATION', 'MANUAL_ADMIN', 'SUSPICIOUS_PATTERN', 'IDENTITY_FRAUD');

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "overallCEFRLevel" "CEFRLevel",
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalDuration" INTEGER NOT NULL,
    "passingScore" DOUBLE PRECISION,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isFlexible" BOOLEAN NOT NULL DEFAULT true,
    "requireCamera" BOOLEAN NOT NULL DEFAULT true,
    "requireMicrophone" BOOLEAN NOT NULL DEFAULT true,
    "requireScreenShare" BOOLEAN NOT NULL DEFAULT true,
    "faceCheckInterval" INTEGER NOT NULL DEFAULT 5,
    "violationThreshold" INTEGER NOT NULL DEFAULT 10,
    "graceViolations" INTEGER NOT NULL DEFAULT 2,
    "maxReconnects" INTEGER NOT NULL DEFAULT 3,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 10,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "randomize" BOOLEAN NOT NULL DEFAULT true,
    "allowSkip" BOOLEAN NOT NULL DEFAULT true,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "lockOnComplete" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "audioFilePath" TEXT,
    "audioFileName" TEXT,
    "audioFileSize" INTEGER,
    "audioDuration" INTEGER,
    "readingPassage" TEXT,
    "options" JSONB,
    "correctAnswer" TEXT,
    "wordCountMin" INTEGER,
    "wordCountMax" INTEGER,
    "speakingPrompt" TEXT,
    "speakingDuration" INTEGER,
    "cefrLevel" "CEFRLevel" NOT NULL,
    "skillTested" TEXT,
    "difficultyScore" DOUBLE PRECISION,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sections" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_assessments" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "totalTimeSpent" INTEGER,
    "totalScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "overallCEFRLevel" "CEFRLevel",
    "cefrResults" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "systemCheckStatus" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "graceViolations" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "sessionStatus" "SessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reconnectCount" INTEGER NOT NULL DEFAULT 0,
    "disconnectCount" INTEGER NOT NULL DEFAULT 0,
    "autoSubmitReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_checks" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "attemptId" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "operatingSystem" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "devicePixelRatio" DOUBLE PRECISION,
    "cameraPermission" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "micPermission" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "screenPermission" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "cameraWorking" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "micWorking" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "faceDetected" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "networkLatency" INTEGER,
    "downloadSpeed" DOUBLE PRECISION,
    "uploadSpeed" DOUBLE PRECISION,
    "networkStatus" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "ipCountry" TEXT,
    "ipCity" TEXT,
    "ipASN" TEXT,
    "ipOrganization" TEXT,
    "isVpnDetected" BOOLEAN NOT NULL DEFAULT false,
    "vpnCheckStatus" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "multipleMonitors" BOOLEAN NOT NULL DEFAULT false,
    "monitorCount" INTEGER NOT NULL DEFAULT 1,
    "allChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "criticalFailures" JSONB,
    "warnings" JSONB,
    "rawCheckData" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "checkStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "faceImagePath" TEXT,
    "audioRecordingPath" TEXT,
    "faceImageBase64" TEXT,
    "faceEmbedding" JSONB,
    "faceDescriptorHash" TEXT,
    "faceDetectedInitial" BOOLEAN NOT NULL DEFAULT false,
    "faceQualityScore" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verificationMethod" TEXT,
    "totalFramesChecked" INTEGER NOT NULL DEFAULT 0,
    "framesWithFace" INTEGER NOT NULL DEFAULT 0,
    "framesWithMultipleFaces" INTEGER NOT NULL DEFAULT 0,
    "framesWithMismatch" INTEGER NOT NULL DEFAULT 0,
    "avgMatchScore" DOUBLE PRECISION,
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_snapshots" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "snapshotPath" TEXT,
    "snapshotBase64" TEXT,
    "faceDetected" BOOLEAN NOT NULL,
    "faceCount" INTEGER NOT NULL DEFAULT 0,
    "faceMatchScore" DOUBLE PRECISION,
    "violationType" "ViolationType",
    "violationSeverity" "ViolationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_sessions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "sessionStartedAt" TIMESTAMP(3),
    "sessionEndedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "sessionStatus" "SessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "totalViolations" INTEGER NOT NULL DEFAULT 0,
    "graceViolations" INTEGER NOT NULL DEFAULT 0,
    "criticalViolations" INTEGER NOT NULL DEFAULT 0,
    "screenRecordingPath" TEXT,
    "audioRecordingPath" TEXT,
    "recordingStartedAt" TIMESTAMP(3),
    "recordingEndedAt" TIMESTAMP(3),
    "recordingFileSize" INTEGER,
    "terminatedReason" TEXT,
    "isAutoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proctoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "violationType" "ViolationType",
    "eventDescription" TEXT,
    "severity" "ViolationSeverity" NOT NULL DEFAULT 'INFO',
    "isViolation" BOOLEAN NOT NULL DEFAULT false,
    "countsTowardLimit" BOOLEAN NOT NULL DEFAULT false,
    "faceDetected" BOOLEAN,
    "faceCount" INTEGER,
    "faceMatchScore" DOUBLE PRECISION,
    "tabVisible" BOOLEAN,
    "windowFocused" BOOLEAN,
    "isFullscreen" BOOLEAN,
    "metadata" JSONB,
    "userAction" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proctoring_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconnection_logs" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "disconnectReason" TEXT,
    "disconnectDuration" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconnection_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "audioFilePath" TEXT,
    "wordCount" INTEGER,
    "characterCount" INTEGER,
    "isCorrect" BOOLEAN,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "grammarErrors" JSONB,
    "grammarScore" DOUBLE PRECISION,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "isMarkedForReview" BOOLEAN NOT NULL DEFAULT false,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "copyPasteDetected" BOOLEAN NOT NULL DEFAULT false,
    "pasteCount" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER,
    "firstViewedAt" TIMESTAMP(3),
    "lastModifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_evaluations" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "audioFilePath" TEXT,
    "audioDuration" INTEGER,
    "audioFileSize" INTEGER,
    "fluencyScore" DOUBLE PRECISION,
    "pronunciationScore" DOUBLE PRECISION,
    "grammarScore" DOUBLE PRECISION,
    "vocabularyScore" DOUBLE PRECISION,
    "coherenceScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "cefrLevel" "CEFRLevel",
    "wordsPerMinute" DOUBLE PRECISION,
    "totalWords" INTEGER,
    "uniqueWords" INTEGER,
    "fillerWords" INTEGER,
    "pauseCount" INTEGER,
    "avgPauseDuration" DOUBLE PRECISION,
    "transcription" TEXT,
    "grammarErrors" JSONB,
    "asrProvider" TEXT,
    "processingTime" INTEGER,
    "confidenceScore" DOUBLE PRECISION,
    "audioDeleted" BOOLEAN NOT NULL DEFAULT false,
    "audioDeletedAt" TIMESTAMP(3),
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaking_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "reason" "BlacklistReason" NOT NULL,
    "reasonDescription" TEXT NOT NULL,
    "relatedAttemptId" TEXT,
    "violationCount" INTEGER,
    "isPermanent" BOOLEAN NOT NULL DEFAULT true,
    "bannedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "blacklistedBy" TEXT NOT NULL,
    "blacklistedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "canReadResults" BOOLEAN NOT NULL DEFAULT true,
    "canReadReports" BOOLEAN NOT NULL DEFAULT false,
    "canWebhook" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "webhookEvents" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 3600,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actionDescription" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_clip_usage" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "audioFilePath" TEXT NOT NULL,
    "audioDuration" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" TIMESTAMP(3),
    "lastPlayedAt" TIMESTAMP(3),
    "wasCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completionPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_clip_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "candidates_email_idx" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "candidates_isBlacklisted_idx" ON "candidates"("isBlacklisted");

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "assessments_createdById_idx" ON "assessments"("createdById");

-- CreateIndex
CREATE INDEX "sections_assessmentId_idx" ON "sections"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_assessmentId_orderIndex_key" ON "sections"("assessmentId", "orderIndex");

-- CreateIndex
CREATE INDEX "questions_questionType_idx" ON "questions"("questionType");

-- CreateIndex
CREATE INDEX "questions_cefrLevel_idx" ON "questions"("cefrLevel");

-- CreateIndex
CREATE INDEX "questions_isActive_idx" ON "questions"("isActive");

-- CreateIndex
CREATE INDEX "question_sections_sectionId_idx" ON "question_sections"("sectionId");

-- CreateIndex
CREATE INDEX "question_sections_questionId_idx" ON "question_sections"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_sections_sectionId_questionId_key" ON "question_sections"("sectionId", "questionId");

-- CreateIndex
CREATE INDEX "candidate_assessments_candidateId_idx" ON "candidate_assessments"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_assessments_assessmentId_idx" ON "candidate_assessments"("assessmentId");

-- CreateIndex
CREATE INDEX "candidate_assessments_sessionStatus_idx" ON "candidate_assessments"("sessionStatus");

-- CreateIndex
CREATE INDEX "candidate_assessments_isFlagged_idx" ON "candidate_assessments"("isFlagged");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_assessments_candidateId_assessmentId_attemptNumbe_key" ON "candidate_assessments"("candidateId", "assessmentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_checks_attemptId_key" ON "system_checks"("attemptId");

-- CreateIndex
CREATE INDEX "system_checks_candidateId_idx" ON "system_checks"("candidateId");

-- CreateIndex
CREATE INDEX "system_checks_attemptId_idx" ON "system_checks"("attemptId");

-- CreateIndex
CREATE INDEX "system_checks_allChecksPassed_idx" ON "system_checks"("allChecksPassed");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_attemptId_key" ON "identity_verifications"("attemptId");

-- CreateIndex
CREATE INDEX "identity_verifications_candidateId_idx" ON "identity_verifications"("candidateId");

-- CreateIndex
CREATE INDEX "identity_verifications_attemptId_idx" ON "identity_verifications"("attemptId");

-- CreateIndex
CREATE INDEX "identity_verifications_verificationStatus_idx" ON "identity_verifications"("verificationStatus");

-- CreateIndex
CREATE INDEX "violation_snapshots_verificationId_idx" ON "violation_snapshots"("verificationId");

-- CreateIndex
CREATE INDEX "violation_snapshots_candidateId_idx" ON "violation_snapshots"("candidateId");

-- CreateIndex
CREATE INDEX "violation_snapshots_sessionId_idx" ON "violation_snapshots"("sessionId");

-- CreateIndex
CREATE INDEX "violation_snapshots_capturedAt_idx" ON "violation_snapshots"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "proctoring_sessions_attemptId_key" ON "proctoring_sessions"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "proctoring_sessions_sessionToken_key" ON "proctoring_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "proctoring_sessions_candidateId_idx" ON "proctoring_sessions"("candidateId");

-- CreateIndex
CREATE INDEX "proctoring_sessions_assessmentId_idx" ON "proctoring_sessions"("assessmentId");

-- CreateIndex
CREATE INDEX "proctoring_sessions_sessionStatus_idx" ON "proctoring_sessions"("sessionStatus");

-- CreateIndex
CREATE INDEX "proctoring_sessions_sessionToken_idx" ON "proctoring_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "proctoring_logs_sessionId_timestamp_idx" ON "proctoring_logs"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "proctoring_logs_candidateId_idx" ON "proctoring_logs"("candidateId");

-- CreateIndex
CREATE INDEX "proctoring_logs_violationType_idx" ON "proctoring_logs"("violationType");

-- CreateIndex
CREATE INDEX "proctoring_logs_severity_idx" ON "proctoring_logs"("severity");

-- CreateIndex
CREATE INDEX "proctoring_logs_isViolation_idx" ON "proctoring_logs"("isViolation");

-- CreateIndex
CREATE INDEX "reconnection_logs_candidateId_idx" ON "reconnection_logs"("candidateId");

-- CreateIndex
CREATE INDEX "reconnection_logs_attemptId_idx" ON "reconnection_logs"("attemptId");

-- CreateIndex
CREATE INDEX "reconnection_logs_eventType_idx" ON "reconnection_logs"("eventType");

-- CreateIndex
CREATE INDEX "answers_candidateId_idx" ON "answers"("candidateId");

-- CreateIndex
CREATE INDEX "answers_attemptId_idx" ON "answers"("attemptId");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_attemptId_questionId_key" ON "answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_evaluations_answerId_key" ON "speaking_evaluations"("answerId");

-- CreateIndex
CREATE INDEX "speaking_evaluations_candidateId_idx" ON "speaking_evaluations"("candidateId");

-- CreateIndex
CREATE INDEX "speaking_evaluations_answerId_idx" ON "speaking_evaluations"("answerId");

-- CreateIndex
CREATE INDEX "blacklist_candidateId_idx" ON "blacklist"("candidateId");

-- CreateIndex
CREATE INDEX "blacklist_isActive_idx" ON "blacklist"("isActive");

-- CreateIndex
CREATE INDEX "blacklist_reason_idx" ON "blacklist"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_apiKey_key" ON "api_keys"("apiKey");

-- CreateIndex
CREATE INDEX "api_keys_apiKey_idx" ON "api_keys"("apiKey");

-- CreateIndex
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

-- CreateIndex
CREATE INDEX "audit_logs_actorType_actorId_idx" ON "audit_logs"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "audit_logs_actionType_idx" ON "audit_logs"("actionType");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audio_clip_usage_candidateId_idx" ON "audio_clip_usage"("candidateId");

-- CreateIndex
CREATE INDEX "audio_clip_usage_attemptId_idx" ON "audio_clip_usage"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "audio_clip_usage_attemptId_questionId_key" ON "audio_clip_usage"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sections" ADD CONSTRAINT "question_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sections" ADD CONSTRAINT "question_sections_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_checks" ADD CONSTRAINT "system_checks_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_checks" ADD CONSTRAINT "system_checks_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "candidate_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "candidate_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_snapshots" ADD CONSTRAINT "violation_snapshots_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "identity_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_snapshots" ADD CONSTRAINT "violation_snapshots_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_snapshots" ADD CONSTRAINT "violation_snapshots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "proctoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "candidate_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_logs" ADD CONSTRAINT "proctoring_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "proctoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_logs" ADD CONSTRAINT "proctoring_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconnection_logs" ADD CONSTRAINT "reconnection_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "candidate_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_evaluations" ADD CONSTRAINT "speaking_evaluations_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_evaluations" ADD CONSTRAINT "speaking_evaluations_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_blacklistedBy_fkey" FOREIGN KEY ("blacklistedBy") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
