-- AlterTable
ALTER TABLE "answers" ADD COLUMN     "expectedConcepts" TEXT[];

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "evaluationStatus" TEXT NOT NULL DEFAULT 'PENDING';
