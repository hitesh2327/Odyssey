import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export class DashboardService {
  public async getOverview(userId: string) {
    const totalAssessments = await prisma.assessmentSession.count({ where: { userId } });
    const completedAssessments = await prisma.assessmentSession.count({ where: { userId, status: 'COMPLETED' } });
    const inProgressAssessments = await prisma.assessmentSession.count({ where: { userId, status: 'IN_PROGRESS' } });

    // Aggregate average score
    const scoreAgg = await prisma.assessmentSession.aggregate({
      where: { userId, status: 'COMPLETED', score: { not: null } },
      _avg: { score: true },
    });
    const averageScore = Math.round(scoreAgg._avg.score || 0);

    // AI Usage
    // We need to count AIAssistance for this user's sessions
    const totalAiUsage = await prisma.aIAssistance.count({
      where: { session: { userId } },
    });

    // Recent Performance Trend (Last 5 completed sessions with score)
    const recentCompleted = await prisma.assessmentSession.findMany({
      where: { userId, status: 'COMPLETED', score: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: { id: true, score: true, completedAt: true, topic: { select: { name: true } } },
    });
    // Reverse to show chronological order
    const trend = recentCompleted.reverse().map(s => ({
      sessionId: s.id,
      score: s.score,
      topic: s.topic.name,
      date: s.completedAt,
    }));

    // Active Sessions (IN_PROGRESS)
    const activeSessions = await prisma.assessmentSession.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        topic: { select: { name: true } },
        difficulty: true,
        currentQuestionOrder: true,
        totalQuestions: true,
        updatedAt: true,
      },
    });

    return {
      totalAssessments,
      completedAssessments,
      inProgressAssessments,
      averageScore,
      totalAiUsage,
      trend,
      activeSessions: activeSessions.map(s => ({
        sessionId: s.id,
        topic: s.topic.name,
        difficulty: s.difficulty,
        progress: `${s.currentQuestionOrder - 1}/${s.totalQuestions}`,
        lastActive: s.updatedAt,
      })),
    };
  }

  public async getHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          topic: { select: { name: true } },
          difficulty: true,
          score: true,
          status: true,
          evaluationStatus: true,
          completedAt: true,
          createdAt: true,
          startedAt: true,
        },
      }),
      prisma.assessmentSession.count({ where: { userId } }),
    ]);

    return {
      items: items.map(s => {
        let duration = 0;
        if (s.completedAt && s.startedAt) {
          duration = Math.round((s.completedAt.getTime() - s.startedAt.getTime()) / 60000);
        }
        return {
          sessionId: s.id,
          topic: s.topic.name,
          difficulty: s.difficulty,
          score: s.score,
          status: s.status,
          evaluationStatus: s.evaluationStatus,
          completedAt: s.completedAt,
          createdAt: s.createdAt,
          duration,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getPerformanceByTopic(userId: string) {
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId, status: 'COMPLETED', score: { not: null } },
      select: { score: true, topic: { select: { name: true } } },
    });

    // Aggregate manually since Prisma groupBy with nested relations isn't fully supported
    const topicStats: Record<string, { total: number; count: number }> = {};
    for (const session of sessions) {
      const topicName = session.topic.name;
      if (!topicStats[topicName]) topicStats[topicName] = { total: 0, count: 0 };
      topicStats[topicName].total += session.score!;
      topicStats[topicName].count += 1;
    }

    const topics = Object.keys(topicStats).map(name => ({
      name,
      averageScore: Math.round(topicStats[name].total / topicStats[name].count),
      assessmentsCount: topicStats[name].count,
    }));

    return { topics };
  }
}

export const dashboardService = new DashboardService();
