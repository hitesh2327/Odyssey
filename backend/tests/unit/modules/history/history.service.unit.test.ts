import { historyService } from '../../../../src/modules/history/history.service';
import { prisma } from '../../../../src/lib/prisma';
import { cacheService } from '../../../../src/services/cache.service';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    assessmentSession: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('HistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should return cached data if available', async () => {
      const mockCached = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (cacheService.get as jest.Mock).mockResolvedValue(mockCached);

      const result = await historyService.getHistory('user1');
      expect(result).toEqual(mockCached);
      expect(prisma.assessmentSession.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and format response if not in cache', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const mockItems = [
        {
          id: 'sess1',
          topic: { name: 'Node.js' },
          sessionTopics: [{ topicNameSnapshot: 'Node.js' }],
          difficulty: 'Medium',
          score: 85,
          status: 'COMPLETED',
          evaluationStatus: 'COMPLETED',
          completedAt: new Date('2023-01-01T10:30:00Z'),
          startedAt: new Date('2023-01-01T10:00:00Z'),
          createdAt: new Date('2023-01-01T10:00:00Z'),
        },
        {
          id: 'sess2',
          topic: { name: 'React' },
          sessionTopics: [],
          difficulty: 'Hard',
          score: 55,
          status: 'COMPLETED',
          evaluationStatus: 'COMPLETED',
          completedAt: new Date('2023-01-02T10:30:00Z'),
          startedAt: new Date('2023-01-02T10:00:00Z'),
          createdAt: new Date('2023-01-02T10:00:00Z'),
        },
        {
          id: 'sess3',
          topic: { name: 'AWS' },
          sessionTopics: [{ topicNameSnapshot: 'AWS' }, { topicNameSnapshot: 'Docker' }, { topicNameSnapshot: 'K8s' }, { topicNameSnapshot: 'GCP' }],
          difficulty: 'Easy',
          score: null,
          status: 'IN_PROGRESS',
          evaluationStatus: 'PENDING',
          completedAt: null,
          startedAt: new Date('2023-01-03T10:00:00Z'),
          createdAt: new Date('2023-01-03T10:00:00Z'),
        },
        {
          id: 'sess4',
          topic: null,
          sessionTopics: null,
          difficulty: 'Medium',
          score: null,
          status: 'COMPLETED',
          evaluationStatus: 'FAILED',
          completedAt: null,
          startedAt: null,
          createdAt: new Date('2023-01-04T10:00:00Z'),
        }
      ];

      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(4);

      const result = await historyService.getHistory('user1', 1, 10, {
        topicId: 'topic1',
        difficulty: 'Medium',
        status: 'COMPLETED',
        performanceLevel: 'Strong',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      });

      expect(prisma.assessmentSession.findMany).toHaveBeenCalled();
      expect(result.total).toBe(4);
      expect(result.totalPages).toBe(1);
      
      // Checking formatting logic
      expect(result.items[0].performanceLevel).toBe('Strong');
      expect(result.items[0].topic).toBe('Node.js');
      expect(result.items[0].duration).toBe(30);

      expect(result.items[1].performanceLevel).toBe('Needs Improvement');
      expect(result.items[1].topic).toBe('React');

      // 4 topics truncation logic
      expect(result.items[2].performanceLevel).toBe('Pending');
      expect(result.items[2].topic).toBe('AWS, Docker +2');

      expect(result.items[3].performanceLevel).toBe('Failed');
      expect(result.items[3].topic).toBe('Unknown');

      // All Performance levels
      (prisma.assessmentSession.findMany as jest.Mock).mockResolvedValue([
        { ...mockItems[0], score: 95, evaluationStatus: 'COMPLETED' },
        { ...mockItems[0], score: 75, evaluationStatus: 'COMPLETED' },
        { ...mockItems[0], score: 65, evaluationStatus: 'COMPLETED' }
      ]);
      (prisma.assessmentSession.count as jest.Mock).mockResolvedValue(3);

      const res2 = await historyService.getHistory('user1', 1, 10, { performanceLevel: 'Excellent' });
      expect(res2.items[0].performanceLevel).toBe('Excellent'); // >= 90
      expect(res2.items[1].performanceLevel).toBe('Good');      // 70-79
      expect(res2.items[2].performanceLevel).toBe('Average');   // 60-69

      // Check remaining performanceLevel branches in the query builder
      await historyService.getHistory('user1', 1, 10, { performanceLevel: 'Good' });
      await historyService.getHistory('user1', 1, 10, { performanceLevel: 'Average' });
      await historyService.getHistory('user1', 1, 10, { performanceLevel: 'Needs Improvement' });
      
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
