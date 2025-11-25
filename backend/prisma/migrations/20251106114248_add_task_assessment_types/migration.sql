-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('LANGUAGE', 'SKILL');

-- CreateEnum
CREATE TYPE "TaskLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "assessmentType" "AssessmentType" NOT NULL DEFAULT 'LANGUAGE';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "assessmentType" "AssessmentType",
ADD COLUMN     "sectionType" TEXT,
ADD COLUMN     "taskLevel" "TaskLevel";

-- CreateIndex
CREATE INDEX "assessments_assessmentType_idx" ON "assessments"("assessmentType");

-- CreateIndex
CREATE INDEX "questions_taskLevel_idx" ON "questions"("taskLevel");

-- CreateIndex
CREATE INDEX "questions_sectionType_idx" ON "questions"("sectionType");

-- CreateIndex
CREATE INDEX "questions_assessmentType_idx" ON "questions"("assessmentType");
