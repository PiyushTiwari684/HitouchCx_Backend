-- AlterTable
ALTER TABLE "identity_verifications" ADD COLUMN     "audioAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "audioMatchScore" DOUBLE PRECISION,
ADD COLUMN     "audioOriginalText" TEXT,
ADD COLUMN     "audioTranscription" TEXT,
ADD COLUMN     "audioVerified" BOOLEAN NOT NULL DEFAULT false;
