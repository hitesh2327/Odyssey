import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcrypt';
import { OtpType } from '../../src/types/otp';

// Read the raw OTP from DB by finding the record and bypassing bcrypt
// Strategy: directly insert a known OTP hash so tests can use '123456'
export async function plantOtp(
  type: OtpType,
  identifier: string,
  plainOtp = '123456',
  newEmail?: string
): Promise<string> {
  const otpHash = await bcrypt.hash(plainOtp, 10);
  await prisma.otpRecord.upsert({
    where: { identifier_type: { identifier, type } },
    create: {
      identifier, type, otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 600_000),
      ...(newEmail ? { newEmail } : {}),
    },
    update: {
      otpHash, attempts: 0,
      expiresAt: new Date(Date.now() + 600_000),
      ...(newEmail ? { newEmail } : {}),
    }
  });
  return plainOtp;
}

// Plant an expired OTP for testing expiry behaviour
export async function plantExpiredOtp(type: OtpType, identifier: string) {
  const otpHash = await bcrypt.hash('123456', 10);
  await prisma.otpRecord.upsert({
    where: { identifier_type: { identifier, type } },
    create: {
      identifier, type, otpHash, attempts: 0,
      expiresAt: new Date(Date.now() - 1000), // already expired
    },
    update: {
      otpHash, attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
    }
  });
}

// Plant a lock record for testing locked state
export async function plantLock(
  type: OtpType,
  identifier: string,
  reason: 'max_attempts' | 'max_resends' = 'max_attempts'
) {
  await prisma.otpLock.upsert({
    where: { identifier_type: { identifier, type } },
    create: {
      identifier, type, reason, resendCount: 3,
      lockedAt: new Date(),
      unlocksAt: new Date(Date.now() + 86_400_000),
    },
    update: {
      reason, resendCount: 3,
      unlocksAt: new Date(Date.now() + 86_400_000),
    }
  });
}
