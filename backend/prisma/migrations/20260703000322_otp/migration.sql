-- CreateTable
CREATE TABLE "otp_records" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "newEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_locks" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlocksAt" TIMESTAMP(3) NOT NULL,
    "nextResendAllowedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_records_identifier_type_idx" ON "otp_records"("identifier", "type");

-- CreateIndex
CREATE UNIQUE INDEX "otp_records_identifier_type_key" ON "otp_records"("identifier", "type");

-- CreateIndex
CREATE INDEX "otp_locks_identifier_type_idx" ON "otp_locks"("identifier", "type");

-- CreateIndex
CREATE UNIQUE INDEX "otp_locks_identifier_type_key" ON "otp_locks"("identifier", "type");
