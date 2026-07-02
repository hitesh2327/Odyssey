import crypto from 'crypto';
import { ApiError } from '../utils/ApiError';
import { cacheService } from '../services/cache.service';
import { redisService } from './redis';
import { emailService } from './email';
import { OtpType, OtpRecord, LockRecord } from '../types/otp';

const OTP_TTL = 600; // 10 minutes
const LOCK_TTL = 86400; // 24 hours

export function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function getPendingKey(type: OtpType, identifier: string): string {
  return `odyssey:otp:pending:${type}:${identifier}`;
}

function getLockKey(type: OtpType, identifier: string): string {
  return `odyssey:otp:lock:${type}:${identifier}`;
}

export async function getOtpRecord(type: OtpType, identifier: string): Promise<OtpRecord | null> {
  return cacheService.get<OtpRecord>(getPendingKey(type, identifier));
}

export async function getLockRecord(type: OtpType, identifier: string): Promise<LockRecord | null> {
  return cacheService.get<LockRecord>(getLockKey(type, identifier));
}

export async function sendOtp(type: OtpType, identifier: string, email: string, newEmail?: string): Promise<void> {
  // 1. Check lock record
  const lock = await getLockRecord(type, identifier);
  if (lock && lock.reason) {
    throw new ApiError(429, 'Too many attempts. Try again after 24 hours.');
  }

  // 2. Get current resend count
  const currentResendCount = lock ? lock.resendCount : 0;

  // 3. Check resend limit
  if (currentResendCount >= 3) {
    const updatedLock: LockRecord = {
      lockedAt: new Date().toISOString(),
      reason: 'max_resends',
      resendCount: currentResendCount,
    };
    await cacheService.set(getLockKey(type, identifier), updatedLock, LOCK_TTL);
    throw new ApiError(429, 'Too many attempts. Try again after 24 hours.');
  }

  // 4. Generate OTP
  const otp = generateOtp();

  // 5. Store OTP record
  const otpRecord: OtpRecord = {
    otp,
    attempts: 0,
    createdAt: new Date().toISOString(),
    ...(newEmail ? { newEmail } : {}),
  };
  await cacheService.set(getPendingKey(type, identifier), otpRecord, OTP_TTL);

  // 6. Update lock record resendCount
  const nextResendCount = currentResendCount + 1;
  const newLockRecord: LockRecord = {
    lockedAt: lock ? lock.lockedAt : new Date().toISOString(),
    reason: nextResendCount >= 3 ? 'max_resends' : (undefined as any), // Omit or set undefined
    resendCount: nextResendCount,
  };
  // Strip undefined fields for clean JSON
  if (newLockRecord.reason === undefined) {
    delete (newLockRecord as any).reason;
  }
  await cacheService.set(getLockKey(type, identifier), newLockRecord, LOCK_TTL);

  // 7. Send Email
  // If verifying email or changing email, user name can be passed if available, otherwise undefined
  await emailService.sendOtpEmail(newEmail || email, otp, type);
}

export async function verifyOtp(type: OtpType, identifier: string, submittedOtp: string): Promise<void> {
  const pendingKey = getPendingKey(type, identifier);
  const lockKey = getLockKey(type, identifier);

  // 1. Check lock
  const lock = await getLockRecord(type, identifier);
  if (lock && lock.reason) {
    throw new ApiError(429, 'Account locked. Try again after 24 hours.');
  }

  const client = redisService.getClient();
  if (!client) {
    throw new ApiError(500, 'Redis connection is not available');
  }

  // Use watch/transaction block to safely read, verify, and update attempts to avoid race conditions
  await client.watch(pendingKey);

  const data = await client.get(pendingKey);
  if (!data) {
    await client.unwatch();
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  const record = JSON.parse(data) as OtpRecord;

  // 3. OTP Match Check
  if (submittedOtp !== record.otp) {
    const newAttempts = record.attempts + 1;
    const remaining = 3 - newAttempts;

    const ttl = await client.ttl(pendingKey);
    const multi = client.multi();

    if (newAttempts >= 3) {
      // Create lock record with max_attempts
      const lockRecord: LockRecord = {
        lockedAt: new Date().toISOString(),
        reason: 'max_attempts',
        resendCount: lock ? lock.resendCount : 0,
      };
      multi.del(pendingKey);
      // Execute transaction before setting lock key via cacheService to avoid MULTI limitations
      const results = await multi.exec();
      if (results === null) {
        throw new ApiError(409, 'Conflict occurred. Please try again.');
      }
      await cacheService.set(lockKey, lockRecord, LOCK_TTL);
      throw new ApiError(429, 'Too many incorrect attempts. Locked for 24 hours.');
    } else {
      record.attempts = newAttempts;
      multi.setEx(pendingKey, ttl > 0 ? ttl : OTP_TTL, JSON.stringify(record));
      const results = await multi.exec();
      if (results === null) {
        throw new ApiError(409, 'Conflict occurred. Please try again.');
      }
      throw new ApiError(400, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
    }
  }

  // 4. Matches successfully: delete OTP record, unwatch, and return
  await client.unwatch();
  await cacheService.delete(pendingKey);
}

export async function clearOtp(type: OtpType, identifier: string): Promise<void> {
  await cacheService.delete(getPendingKey(type, identifier));
  await cacheService.delete(getLockKey(type, identifier));
}
