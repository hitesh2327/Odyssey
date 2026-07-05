import { dashboardService } from '../../../../src/modules/dashboard/dashboard.service';
import { prisma } from '../../../../src/lib/prisma';
import { cacheService } from '../../../../src/services/cache.service';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    assessmentSession: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    aIAssistance: {
      count: jest.fn(),
    }
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return cached data if available', async () => {
      const mockCached = { totalAssessments: 5 };
      (cacheService.get as jest.Mock).mockResolvedValue(mockCached);

      const result = await dashboardService.getOverview('user1');
      expect(result).toEqual(mockCached);
      expect(prisma.assessmentSession.count).not.toHaveBeenCalled();
    });

    it('should query DB and aggregate overview if not in cache', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      (prisma.assessmentSession.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7)  // completed
        .mockResolvedValueOnce(3); // inProgress

      (prisma.assessmentSession.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 85.6 } });
      (prisma.aIAssistance.count as jest.Mock).mockResolvedValue(12);

      (prisma.assessmentSession.findMany as jest.Mock)
        .mockResolvedValueOnce([ // trend (recent completed)
          { id: 'sess1', score: 90, completedAt: new Date('2023-01-01'), topic: { name: 'Node.js' } },
          { id: 'sess2', score: 80, completedAt: new Date('2023-01-02'), topic: { name: 'React' } }
        ])
        .mockResolvedValueOnce([ // active sessions
          { id: 'sess3', topic: { name: 'AWS' }, difficulty: 'Medium', currentQuestionOrder: 3, totalQuestions: 5, updatedAt: new Date('2023-01-03') }
        ]);

      const result = await dashboardService.getOverview('user1');

      expect(result.totalAssessments).toBe(10);
      expect(result.completedAssessments).toBe(7);
      expect(result.inProgressAssessments).toBe(3);
      expect(result.averageScore).toBe(86);
      expect(result.totalAiUsage).toBe(12);
      
      // Trend is reversed chronologically
      expect(result.trend.length).toBe(2);
      expect(result.trend[0].sessionId).toBe('sess2'); // since it reverses
      expect(result.trend[1].sessionId).toBe('sess1');

      expect(result.activeSessions.length).toBe(1);
      expect(result.activeSessions[0].progress).toBe('2/5');

      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return cached data if available', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue({ total: 5 });
      const result = await dashboardService.getHistory('user1');
      expect(result.total).toBe(5);
    });

    it('should query DB if not cached', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([
        { id: 'sess1', topic: { name: 'Node' }, completedAt: new Date('2023-01-02'), startedAt: new Date('2023-01-01') }
      ]);
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(1);

      const result = await dashboardService.getHistory('user1');
      expect(result.total).toBe(1);
      expect(result.items[0].duration).toBeGreaterThan(0);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('getPerformanceByTopic', () => {
    it('should return cached data if available', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue({ topics: [] });
      const result = await dashboardService.getPerformanceByTopic('user1');
      expect(result.topics.length).toBe(0);
    });

    it('should query DB and calculate performance manually if not cached', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([
        { score: 90, topic: { name: 'Node.js' } },
        { score: 80, topic: { name: 'Node.js' } },
        { score: 75, topic: { name: 'React' } }
      ]);

      const result = await dashboardService.getPerformanceByTopic('user1');
      expect(result.topics).toHaveLength(2);
      
      const nodeTopic = result.topics.find((t: any) => t.name === 'Node.js');
      expect(nodeTopic?.averageScore).toBe(85); // (90+80)/2
      expect(nodeTopic?.assessmentsCount).toBe(2);

      const reactTopic = result.topics.find((t: any) => t.name === 'React');
      expect(reactTopic?.averageScore).toBe(75);
      expect(reactTopic?.assessmentsCount).toBe(1);

      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
