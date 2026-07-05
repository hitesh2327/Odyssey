import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError';
import { prisma } from './prisma';
import { emailService } from './email';
import { OtpType } from '../types/otp';
import { logger } from './logger';
import { isServerHealthy } from './health';

export function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

export async function getOtpRecord(type: OtpType, identifier: string) {
  const record = await prisma.otpRecord.findUnique({
    where: {
      identifier_type: { identifier, type },
    },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

export async function getLockRecord(type: OtpType, identifier: string) {
  const lock = await prisma.otpLock.findUnique({
    where: {
      identifier_type: { identifier, type },
    },
  });

  if (!lock) {
    return null;
  }

  if (lock.unlocksAt < new Date()) {
    // Expired lock — treat as no lock, and delete the stale row
    await prisma.otpLock.delete({
      where: { identifier_type: { identifier, type } },
    });
    return null;
  }

  return lock;
}

export async function sendOtp(type: OtpType, identifier: string, email: string, newEmail?: string): Promise<{ nextResendAllowedAt: Date }> {
  // 1. Check lock
  const lock = await getLockRecord(type, identifier);
  
  if (lock && lock.reason) {
    throw new ApiError(429, 'Too many attempts. Try again after 24 hours.');
  }

  const now = new Date();

  // Progressive cooldown check
  if (lock && lock.nextResendAllowedAt && now < lock.nextResendAllowedAt) {
    throw new ApiError(429, 'Please wait before requesting another OTP.', {
      nextResendAllowedAt: lock.nextResendAllowedAt,
    });
  }

  // 2. Get resendCount
  const currentResendCount = lock ? lock.resendCount : 0;

  // 3. Check resend limit (if this request puts it AT 3, it's blocked from SENDING)
  // Wait, the instructions say: If resendCount >= 3 -> upsert OtpLock with reason:'max_resends'
  if (currentResendCount >= 3) {
    await prisma.otpLock.upsert({
      where: { identifier_type: { identifier, type } },
      create: {
        identifier,
        type,
        reason: 'max_resends',
        resendCount: currentResendCount,
        unlocksAt: new Date(Date.now() + 86_400_000), // now + 24h
      },
      update: {
        reason: 'max_resends',
        unlocksAt: new Date(Date.now() + 86_400_000),
      },
    });
    throw new ApiError(429, 'Too many attempts. Try again after 24 hours.');
  }

  // 4. Generate plaintext OTP, hash it with bcrypt
  const otp = generateOtp();
  const hash = await bcrypt.hash(otp, 10);

  // 5. Upsert OtpRecord
  await prisma.otpRecord.upsert({
    where: { identifier_type: { identifier, type } },
    create: {
      identifier,
      type,
      otpHash: hash,
      attempts: 0,
      newEmail,
      expiresAt: new Date(Date.now() + 600_000),
    },
    update: {
      otpHash: hash,
      attempts: 0,
      newEmail,
      expiresAt: new Date(Date.now() + 600_000),
      createdAt: new Date(),
    },
  });

  // Calculate nextResendAllowedAt with health override
  const healthy = await isServerHealthy();
  const nextResendCount = currentResendCount + 1;
  const cooldowns = healthy
    ? [0, 60, 180, 300]   // [initial, after 1st, after 2nd, after 3rd] seconds
    : [0, 60,  60,  60];  // degraded: all resends use 1 minute
  
  const cooldownSeconds = cooldowns[nextResendCount] ?? 300;
  const nextResendAllowedAt = new Date(Date.now() + cooldownSeconds * 1000);

  // 6. Upsert OtpLock to increment resendCount
  await prisma.otpLock.upsert({
    where: { identifier_type: { identifier, type } },
    create: {
      identifier,
      type,
      reason: '',
      resendCount: 1,
      unlocksAt: new Date(Date.now() + 86_400_000),
      nextResendAllowedAt,
    },
    update: {
      resendCount: { increment: 1 },
      nextResendAllowedAt,
    },
  });

  // 7. Send Email
  await emailService.sendOtpEmail(newEmail || email, otp, type);

  // 8. Log plaintext OTP at info level if NODE_ENV !== 'production'
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[OTP] Generated OTP for ${type} (${identifier}): ${otp}`);
  }

  return { nextResendAllowedAt };
}

export async function verifyOtp(type: OtpType, identifier: string, submittedOtp: string): Promise<void> {
  // 1. Check lock
  const lock = await getLockRecord(type, identifier);
  // Only block verification on max_attempts. Max resends only blocks sending.
  if (lock && lock.reason === 'max_attempts') {
    throw new ApiError(429, 'Too many incorrect attempts. Locked for 24 hours.');
  }

  // 2. Get OTP record
  const record = await getOtpRecord(type, identifier);
  if (!record) {
    throw new ApiError(400, 'OTP is invalid or has expired.');
  }

  // 3. Compare
  const isMatch = await bcrypt.compare(submittedOtp, record.otpHash);

  // 4. If NO match
  if (!isMatch) {
    const newAttempts = record.attempts + 1;
    const remaining = 3 - newAttempts;

    if (newAttempts >= 3) {
      await prisma.otpRecord.delete({
        where: { identifier_type: { identifier, type } },
      });

      await prisma.otpLock.upsert({
        where: { identifier_type: { identifier, type } },
        create: {
          identifier,
          type,
          reason: 'max_attempts',
          resendCount: 0,
          unlocksAt: new Date(Date.now() + 86_400_000),
        },
        update: {
          reason: 'max_attempts',
          unlocksAt: new Date(Date.now() + 86_400_000),
        },
      });

      throw new ApiError(429, 'Too many incorrect attempts. Locked for 24 hours.');
    } else {
      await prisma.otpRecord.update({
        where: { identifier_type: { identifier, type } },
        data: { attempts: newAttempts },
      });
      throw new ApiError(400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }
  }

  // 5. If match
  await prisma.otpRecord.delete({
    where: { identifier_type: { identifier, type } },
  });
}

export async function clearOtp(type: OtpType, identifier: string): Promise<void> {
  await prisma.otpRecord.deleteMany({
    where: { identifier, type },
  });
  await prisma.otpLock.deleteMany({
    where: { identifier, type },
  });
}
