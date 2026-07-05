import { profileService } from '../../../../src/modules/profile/profile.service';
import { prisma } from '../../../../src/lib/prisma';
import { cacheService } from '../../../../src/services/cache.service';
import { waypointsService } from '../../../../src/modules/profile/waypoints.service';
import fs from 'fs';
import path from 'path';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    topicOfInterest: { findMany: jest.fn() },
    userWaypoint: { findMany: jest.fn() },
    waypoint: { findMany: jest.fn() },
    resume: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assessmentSession: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    aIAssistance: { count: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    invalidateUserCache: jest.fn(),
  },
}));

jest.mock('../../../../src/modules/profile/waypoints.service', () => ({
  waypointsService: {
    checkAndUnlock: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('fs');

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should auto-create a profile row when none exists', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // first call returns null (not found), second returns created profile
      (prisma.profile.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'user1', streakDays: 1, lastActiveDate: new Date() })
        .mockResolvedValueOnce({ userId: 'user1', streakDays: 1, lastActiveDate: new Date() }); // for re-fetch

      (prisma.profile.create as jest.Mock).mockResolvedValue({ userId: 'user1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (prisma.topicOfInterest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userWaypoint.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.waypoint.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resume.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(0);
      (prisma.assessmentSession.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: null } });
      (prisma.aIAssistance.count as jest.Mock).mockResolvedValue(0);

      await profileService.getProfile('user1');

      expect(prisma.profile.create).toHaveBeenCalledWith({ data: { userId: 'user1' } });
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(3); // Initial, inside updateStreak, Re-fetch
    });
  });

  describe('setPrimaryResume', () => {
    it('should set other resumes to false and target to true in a transaction', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue({ id: 'res1', userId: 'user1' });
      (prisma.$transaction as jest.Mock).mockImplementation(async (queries) => queries);

      await profileService.setPrimaryResume('user1', 'res1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.resume.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { isPrimary: false },
      });
      expect(prisma.resume.update).toHaveBeenCalledWith({
        where: { id: 'res1' },
        data: { isPrimary: true },
      });
      expect(cacheService.invalidateUserCache).toHaveBeenCalledWith('user1');
    });

    it('should throw ApiError if resume not found or belongs to another user', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue({ id: 'res1', userId: 'otherUser' });
      await expect(profileService.setPrimaryResume('user1', 'res1')).rejects.toThrow('Resume not found');
    });
  });

  describe('deleteResume', () => {
    it('should promote the next most recent resume if the deleted one was primary', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue({
        id: 'res1',
        userId: 'user1',
        isPrimary: true,
        fileKey: 'dummy/path',
      });
      (fs.existsSync as jest.Mock).mockReturnValue(false); // mock file check

      // We need to simulate the transaction callback logic
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          resume: {
            delete: jest.fn(),
            findFirst: jest.fn().mockResolvedValue({ id: 'res2' }),
            update: jest.fn(),
          },
        };
        await callback(tx);
        expect(tx.resume.delete).toHaveBeenCalledWith({ where: { id: 'res1' } });
        expect(tx.resume.findFirst).toHaveBeenCalledWith({
          where: { userId: 'user1' },
          orderBy: { uploadedAt: 'desc' },
        });
        expect(tx.resume.update).toHaveBeenCalledWith({
          where: { id: 'res2' },
          data: { isPrimary: true },
        });
      });

      await profileService.deleteResume('user1', 'res1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(cacheService.invalidateUserCache).toHaveBeenCalledWith('user1');
    });

    it('should not promote if the deleted resume was not primary', async () => {
      (prisma.resume.findUnique as jest.Mock).mockResolvedValue({
        id: 'res1',
        userId: 'user1',
        isPrimary: false,
        fileKey: 'dummy/path',
      });
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          resume: {
            delete: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
          },
        };
        await callback(tx);
        expect(tx.resume.delete).toHaveBeenCalledWith({ where: { id: 'res1' } });
        expect(tx.resume.findFirst).not.toHaveBeenCalled();
        expect(tx.resume.update).not.toHaveBeenCalled();
      });

      await profileService.deleteResume('user1', 'res1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
