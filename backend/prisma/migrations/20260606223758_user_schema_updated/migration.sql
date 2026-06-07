/*
  Warnings:

  - You are about to drop the column `prompt` on the `ai_assistance` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `ai_assistance` table. All the data in the column will be lost.
  - You are about to drop the column `tokensUsed` on the `ai_assistance` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ai_assistance` table. All the data in the column will be lost.
  - Added the required column `aiResponse` to the `ai_assistance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ai_assistance" DROP CONSTRAINT "ai_assistance_userId_fkey";

-- DropIndex
DROP INDEX "ai_assistance_userId_idx";

-- AlterTable
ALTER TABLE "ai_assistance" DROP COLUMN "prompt",
DROP COLUMN "response",
DROP COLUMN "tokensUsed",
DROP COLUMN "userId",
ADD COLUMN     "aiResponse" JSONB NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ai_interactions" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "promptVersion" TEXT;

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currentQuestionOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "questionGenerationPrompt" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ALTER COLUMN "passwordHash" DROP NOT NULL;
