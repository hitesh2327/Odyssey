-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('SINGLE_TOPIC', 'MULTI_TOPIC');

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "assessmentType" "AssessmentType" NOT NULL DEFAULT 'SINGLE_TOPIC';

-- CreateTable
CREATE TABLE "session_topics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "topicNameSnapshot" TEXT NOT NULL,

    CONSTRAINT "session_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_topics_sessionId_idx" ON "session_topics"("sessionId");

-- CreateIndex
CREATE INDEX "session_topics_topicId_idx" ON "session_topics"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "session_topics_sessionId_topicId_key" ON "session_topics"("sessionId", "topicId");

-- AddForeignKey
ALTER TABLE "session_topics" ADD CONSTRAINT "session_topics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_topics" ADD CONSTRAINT "session_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Copy existing topicId from assessment_sessions to session_topics
INSERT INTO "session_topics" ("id", "sessionId", "topicId", "topicNameSnapshot")
SELECT gen_random_uuid()::text, a.id, a."topicId", t."name"
FROM "assessment_sessions" a
JOIN "topics" t ON t.id = a."topicId"
WHERE a."topicId" IS NOT NULL
ON CONFLICT ("sessionId", "topicId") DO NOTHING;
