-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'PERMISSION_GRANTED';
ALTER TYPE "SessionStatus" ADD VALUE 'DEVICE_TEST_IN_PROGRESS';
ALTER TYPE "SessionStatus" ADD VALUE 'DEVICE_TEST_COMPLETED';
ALTER TYPE "SessionStatus" ADD VALUE 'FULLSCREEN_ENTERED';

-- AlterTable
ALTER TABLE "candidate_assessments" ADD COLUMN     "fullscreenEntered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fullscreenEnteredAt" TIMESTAMP(3),
ADD COLUMN     "fullscreenExitCount" INTEGER NOT NULL DEFAULT 0;
