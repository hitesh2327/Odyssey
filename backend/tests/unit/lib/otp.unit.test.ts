import * as otpLib from '../../../src/lib/otp';
import { prisma } from '../../../src/lib/prisma';
import bcrypt from 'bcrypt';
import { emailService } from '../../../src/lib/email';
import * as health from '../../../src/lib/health';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    otpRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    otpLock: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../../src/lib/email', () => ({
  emailService: {
    sendOtpEmail: jest.fn(),
  },
}));

jest.mock('../../../src/lib/health', () => ({
  isServerHealthy: jest.fn(),
}));

describe('OTP Library', () => {
  const type: any = 'verify_email';
  const identifier = 'user@example.com';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Locks & Cooldowns', () => {
    it('Branch 1: should treat expired lock (unlocksAt < now) as no lock and delete it', async () => {
      const pastDate = new Date(Date.now() - 10000); // 10s ago
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({ unlocksAt: pastDate });
      
      const lock = await otpLib.getLockRecord(type, identifier);
      
      expect(lock).toBeNull();
      expect(prisma.otpLock.delete).toHaveBeenCalledWith({ where: { identifier_type: { identifier, type } } });
    });

    it('Branch 2: should return active lock (unlocksAt > now)', async () => {
      const futureDate = new Date(Date.now() + 10000); // 10s future
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({ unlocksAt: futureDate, reason: 'test' });
      
      const lock = await otpLib.getLockRecord(type, identifier);
      
      expect(lock).not.toBeNull();
      expect(prisma.otpLock.delete).not.toHaveBeenCalled();
    });

    it('Branch 3: should block sending if resendCount is >= 3 and upsert lock', async () => {
      const futureDate = new Date(Date.now() + 10000);
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({ 
        unlocksAt: futureDate, 
        resendCount: 3,
        reason: '' 
      });

      await expect(otpLib.sendOtp(type, identifier, identifier)).rejects.toThrow('Too many attempts');
      expect(prisma.otpLock.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ reason: 'max_resends', resendCount: 3 }),
        update: expect.objectContaining({ reason: 'max_resends' })
      }));
    });

    it('Branch 4: should calculate nextResendAllowedAt with healthy server (resend scaling)', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue(null);
      (health.isServerHealthy as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      // Attempt 1: resendCount goes from 0 -> 1. cooldowns[1] = 60s
      const res1 = await otpLib.sendOtp(type, identifier, identifier);
      const diff1 = (res1.nextResendAllowedAt.getTime() - Date.now()) / 1000;
      expect(Math.round(diff1)).toBe(60);

      // Attempt 2: resendCount goes from 1 -> 2. cooldowns[2] = 180s
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({
        unlocksAt: new Date(Date.now() + 86400000),
        resendCount: 1,
        nextResendAllowedAt: new Date(Date.now() - 1000) // cooldown passed
      });
      const res2 = await otpLib.sendOtp(type, identifier, identifier);
      const diff2 = (res2.nextResendAllowedAt.getTime() - Date.now()) / 1000;
      expect(Math.round(diff2)).toBe(180);
      
      // Attempt 3: resendCount goes from 2 -> 3. cooldowns[3] = 300s
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({
        unlocksAt: new Date(Date.now() + 86400000),
        resendCount: 2,
        nextResendAllowedAt: new Date(Date.now() - 1000) // cooldown passed
      });
      const res3 = await otpLib.sendOtp(type, identifier, identifier);
      const diff3 = (res3.nextResendAllowedAt.getTime() - Date.now()) / 1000;
      expect(Math.round(diff3)).toBe(300);
    });

    it('Branch 5: should calculate nextResendAllowedAt with degraded server (flat 60s)', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue({
        unlocksAt: new Date(Date.now() + 86400000),
        resendCount: 2, // Would normally be 300s
        nextResendAllowedAt: new Date(Date.now() - 1000)
      });
      (health.isServerHealthy as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const res = await otpLib.sendOtp(type, identifier, identifier);
      const diff = (res.nextResendAllowedAt.getTime() - Date.now()) / 1000;
      // degraded fallback is 60s for all
      expect(Math.round(diff)).toBe(60);
    });
  });

  describe('Verification branches', () => {
    it('Branch 6: OTP match on the first attempt', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpRecord.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        otpHash: 'hashed',
        attempts: 0
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(otpLib.verifyOtp(type, identifier, '123456')).resolves.not.toThrow();
      expect(prisma.otpRecord.delete).toHaveBeenCalledWith({ where: { identifier_type: { identifier, type } } });
    });

    it('Branch 7: OTP mismatch on attempt 1', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpRecord.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        otpHash: 'hashed',
        attempts: 0
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(otpLib.verifyOtp(type, identifier, '000000')).rejects.toThrow('2 attempt(s) remaining');
      expect(prisma.otpRecord.update).toHaveBeenCalledWith({
        where: { identifier_type: { identifier, type } },
        data: { attempts: 1 }
      });
    });

    it('Branch 8: OTP mismatch on attempt 2', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpRecord.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        otpHash: 'hashed',
        attempts: 1
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(otpLib.verifyOtp(type, identifier, '000000')).rejects.toThrow('1 attempt(s) remaining');
      expect(prisma.otpRecord.update).toHaveBeenCalledWith({
        where: { identifier_type: { identifier, type } },
        data: { attempts: 2 }
      });
    });

    it('Branch 9: OTP mismatch on attempt 3 triggering a lock', async () => {
      (prisma.otpLock.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.otpRecord.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        otpHash: 'hashed',
        attempts: 2 // This is the 3rd attempt
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(otpLib.verifyOtp(type, identifier, '000000')).rejects.toThrow('Locked for 24 hours');
      expect(prisma.otpRecord.delete).toHaveBeenCalled();
      expect(prisma.otpLock.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ reason: 'max_attempts' }),
        update: expect.objectContaining({ reason: 'max_attempts' })
      }));
    });
  });
});
