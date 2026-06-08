import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { cacheService } from '../../services/cache.service';
import { config } from '../../config';

export class HistoryService {
  public async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      topicId?: string;
      difficulty?: string;
      status?: string;
      performanceLevel?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const topicIdVal = filters.topicId || 'all';
    const diffVal = filters.difficulty || 'all';
    const statusVal = filters.status || 'all';
    const perfVal = filters.performanceLevel || 'all';
    const startVal = filters.startDate || 'all';
    const endVal = filters.endDate || 'all';
    const cacheKey = `odyssey:history:${userId}:${page}:${limit}:${topicIdVal}:${diffVal}:${statusVal}:${perfVal}:${startVal}:${endVal}`;
    
    const cachedData = await cacheService.get<any>(cacheKey);
    if (cachedData) return cachedData;

    const skip = (page - 1) * limit;

    const where: Prisma.AssessmentSessionWhereInput = { userId };

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    // performanceLevel logic mapping
    // Excellent >= 90, Strong >= 80, Good >= 70, Average >= 60, Needs Improvement < 60
    if (filters.performanceLevel) {
      if (filters.performanceLevel === 'Excellent') {
        where.score = { gte: 90 };
      } else if (filters.performanceLevel === 'Strong') {
        where.score = { gte: 80, lt: 90 };
      } else if (filters.performanceLevel === 'Good') {
        where.score = { gte: 70, lt: 80 };
      } else if (filters.performanceLevel === 'Average') {
        where.score = { gte: 60, lt: 70 };
      } else if (filters.performanceLevel === 'Needs Improvement') {
        where.score = { lt: 60 };
      }
    }

    const [items, total] = await Promise.all([
      prisma.assessmentSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          topic: { select: { name: true } },
          sessionTopics: { select: { topicNameSnapshot: true } },
          difficulty: true,
          score: true,
          status: true,
          evaluationStatus: true,
          completedAt: true,
          createdAt: true,
          startedAt: true,
        },
      }),
      prisma.assessmentSession.count({ where }),
    ]);

    const result = {
      items: items.map((s: any) => {
        let duration = 0;
        if (s.completedAt && s.startedAt) {
          duration = Math.round((s.completedAt.getTime() - s.startedAt.getTime()) / 60000);
        }
        
        let performanceLevel = 'Pending';
        if (s.evaluationStatus === 'COMPLETED' && s.score !== null) {
          if (s.score >= 90) performanceLevel = 'Excellent';
          else if (s.score >= 80) performanceLevel = 'Strong';
          else if (s.score >= 70) performanceLevel = 'Good';
          else if (s.score >= 60) performanceLevel = 'Average';
          else performanceLevel = 'Needs Improvement';
        } else if (s.evaluationStatus === 'FAILED') {
          performanceLevel = 'Failed';
        }

        let topicDisplay = s.topic?.name || 'Unknown';
        if (s.sessionTopics && s.sessionTopics.length > 0) {
          const names = s.sessionTopics.map((t: any) => t.topicNameSnapshot);
          if (names.length === 1) {
            topicDisplay = names[0];
          } else if (names.length <= 3) {
            topicDisplay = names.join(' + ');
          } else {
            topicDisplay = `${names[0]}, ${names[1]} +${names.length - 2}`;
          }
        }

        return {
          sessionId: s.id,
          topic: topicDisplay,
          difficulty: s.difficulty,
          score: s.score,
          status: s.status,
          evaluationStatus: s.evaluationStatus,
          performanceLevel,
          completedAt: s.completedAt,
          createdAt: s.createdAt,
          duration,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cacheService.set(cacheKey, result, config.REDIS_TTL_HISTORY, userId);
    return result;
  }
}

export const historyService = new HistoryService();
