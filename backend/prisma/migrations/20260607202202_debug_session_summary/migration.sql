-- AlterTable
ALTER TABLE "answers" ADD COLUMN     "breakdown" JSONB,
ADD COLUMN     "improvements" TEXT[],
ADD COLUMN     "strengths" TEXT[];
