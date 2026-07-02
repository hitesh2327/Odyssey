import fs from 'fs';
import path from 'path';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { cacheService } from '../../services/cache.service';
import { UpdateProfileInput } from './profile.types';
import { waypointsService } from './waypoints.service';
import { Prisma } from '@prisma/client';

export class ProfileService {
  private getCacheKey(userId: string): string {
    return `odyssey:profile:${userId}`;
  }

  private async updateStreak(userId: string): Promise<void> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return;

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    let lastActive = null;
    if (profile.lastActiveDate) {
      lastActive = new Date(Date.UTC(
        profile.lastActiveDate.getUTCFullYear(),
        profile.lastActiveDate.getUTCMonth(),
        profile.lastActiveDate.getUTCDate()
      ));
    }

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    if (lastActive && lastActive.getTime() === today.getTime()) {
      return; // No change
    }

    let newStreak = profile.streakDays;
    if (lastActive && lastActive.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    await prisma.profile.update({
      where: { userId },
      data: {
        streakDays: newStreak,
        lastActiveDate: today,
      },
    });
  }

  public async getProfile(userId: string) {
    const cacheKey = this.getCacheKey(userId);
    const cachedData = await cacheService.get<any>(cacheKey);
    if (cachedData) {
      // Passively check waypoints (this doesn't need to block response if we don't want it to, 
      // but wait, the prompt says passive check on GET /profile. We'll do it after cache hit too)
      waypointsService.checkAndUnlock(userId).catch(e => console.error(e));
      return cachedData;
    }

    // Ensure streak is updated before we fetch
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({ data: { userId } });
    }
    
    await this.updateStreak(userId);

    // Re-fetch to get updated streak if it changed
    profile = await prisma.profile.findUnique({ where: { userId } }) as any;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, avatarUploadedAt: true },
    });

    const topicsOfInterest = await prisma.topicOfInterest.findMany({
      where: { userId },
      select: { id: true, topicId: true, topic: { select: { id: true, name: true } } },
    });

    const userWaypoints = await prisma.userWaypoint.findMany({
      where: { userId },
      include: { waypoint: true },
    });

    const allWaypoints = await prisma.waypoint.findMany();
    const unlockedIds = new Set(userWaypoints.map(uw => uw.waypointId));

    const waypoints = allWaypoints.map(wp => {
      const userWp = userWaypoints.find(uw => uw.waypointId === wp.id);
      return {
        waypoint: { id: wp.id, code: wp.code, title: wp.title, description: wp.description, icon: wp.icon },
        unlockedAt: userWp ? userWp.unlockedAt : null,
        unlocked: unlockedIds.has(wp.id),
      };
    });

    const resumePrimary = await prisma.resume.findFirst({
      where: { userId, isPrimary: true },
    });

    const totalSessions = await prisma.assessmentSession.count({ where: { userId } });
    const completedSessions = await prisma.assessmentSession.count({ where: { userId, status: 'COMPLETED' } });
    
    const scoreAgg = await prisma.assessmentSession.aggregate({
      where: { userId, status: 'COMPLETED', score: { not: null } },
      _avg: { score: true },
    });
    const avgScore = scoreAgg._avg.score ? Math.round(scoreAgg._avg.score) : 0;

    const aiUsesThisMonth = await prisma.aIAssistance.count({
      where: {
        session: { userId },
        createdAt: { gte: profile!.currentPeriodStart },
      },
    });

    const responseData = {
      user,
      profile,
      topicsOfInterest,
      waypoints,
      resumePrimary,
      stats: {
        totalSessions,
        completedSessions,
        avgScore,
        aiUsesThisMonth,
      },
    };

    await cacheService.set(cacheKey, responseData, 300, userId);
    waypointsService.checkAndUnlock(userId).catch(e => console.error(e));

    return responseData;
  }

  public async updateProfile(userId: string, data: UpdateProfileInput) {
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    await cacheService.invalidateUserCache(userId);
    await waypointsService.checkAndUnlock(userId);
    return updatedProfile;
  }

  public async replaceTopics(userId: string, topicIds: string[]) {
    // Verify topics exist
    if (topicIds.length > 0) {
      const existingTopics = await prisma.topic.count({
        where: { id: { in: topicIds } },
      });
      if (existingTopics !== topicIds.length) {
        throw new ApiError(400, 'One or more topic IDs are invalid');
      }
    }

    await prisma.$transaction([
      prisma.topicOfInterest.deleteMany({ where: { userId } }),
      ...topicIds.map(topicId =>
        prisma.topicOfInterest.create({ data: { userId, topicId } })
      ),
    ]);

    await cacheService.invalidateUserCache(userId);
    
    const newTopics = await prisma.topicOfInterest.findMany({
      where: { userId },
      select: { id: true, topicId: true, topic: { select: { id: true, name: true } } },
    });

    return { topicsOfInterest: newTopics };
  }

  public async updateAvatar(userId: string, avatarUrl: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        avatarUploadedAt: new Date(),
      },
    });
    await cacheService.invalidateUserCache(userId);
    return { avatarUrl };
  }

  public async removeAvatar(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl) {
      // avatarUrl is e.g. /uploads/avatars/user-id.jpg
      // Get the absolute path. This is a bit tricky, assume it matches the filename in /uploads/avatars
      const filename = path.basename(user.avatarUrl);
      const absolutePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarUploadedAt: null,
      },
    });
    await cacheService.invalidateUserCache(userId);
  }

  public async getResumes(userId: string) {
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
    return resumes;
  }

  public async uploadResume(userId: string, fileKey: string, fileName: string, fileType: 'PDF' | 'DOCX', fileSizeBytes: number) {
    const existingCount = await prisma.resume.count({ where: { userId } });
    const isPrimary = existingCount === 0;

    const resume = await prisma.resume.create({
      data: {
        userId,
        fileKey,
        fileName,
        fileType,
        fileSizeBytes,
        isPrimary,
      },
    });
    
    await cacheService.invalidateUserCache(userId);
    return resume;
  }

  public async setPrimaryResume(userId: string, resumeId: string) {
    const targetResume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!targetResume || targetResume.userId !== userId) {
      throw new ApiError(404, 'Resume not found');
    }

    await prisma.$transaction([
      prisma.resume.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.resume.update({
        where: { id: resumeId },
        data: { isPrimary: true },
      }),
    ]);
    
    await cacheService.invalidateUserCache(userId);
    const updated = await prisma.resume.findUnique({ where: { id: resumeId } });
    return updated;
  }

  public async deleteResume(userId: string, resumeId: string) {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new ApiError(404, 'Resume not found');
    }

    const absolutePath = path.resolve(resume.fileKey);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await prisma.$transaction(async (tx) => {
      await tx.resume.delete({ where: { id: resumeId } });
      
      if (resume.isPrimary) {
        const nextResume = await tx.resume.findFirst({
          where: { userId },
          orderBy: { uploadedAt: 'desc' },
        });
        if (nextResume) {
          await tx.resume.update({
            where: { id: nextResume.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    await cacheService.invalidateUserCache(userId);
  }

  public async getResumePath(userId: string, resumeId: string) {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new ApiError(404, 'Resume not found');
    }

    return {
      absolutePath: path.resolve(resume.fileKey),
      fileName: resume.fileName,
    };
  }
}

export const profileService = new ProfileService();
