/*
  Warnings:

  - You are about to drop the column `completionTokens` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `modelName` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `promptTokens` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `promptVersion` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `ai_interactions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ai_interactions` table. All the data in the column will be lost.
  - Added the required column `content` to the `ai_interactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `ai_interactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "ai_interactions" DROP CONSTRAINT "ai_interactions_questionId_fkey";

-- DropIndex
DROP INDEX "ai_interactions_questionId_idx";

-- AlterTable
ALTER TABLE "ai_interactions" DROP COLUMN "completionTokens",
DROP COLUMN "modelName",
DROP COLUMN "prompt",
DROP COLUMN "promptTokens",
DROP COLUMN "promptVersion",
DROP COLUMN "questionId",
DROP COLUMN "response",
DROP COLUMN "type",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "role" "ChatRole" NOT NULL;

-- CreateIndex
CREATE INDEX "ai_interactions_sessionId_createdAt_idx" ON "ai_interactions"("sessionId", "createdAt");
