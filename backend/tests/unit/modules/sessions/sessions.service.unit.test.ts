import { sessionsService } from '../../../../src/modules/sessions/sessions.service';
import { prisma } from '../../../../src/lib/prisma';
import { questionGeneratorService } from '../../../../src/modules/questions/question-generator.service';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    topic: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    assessmentSession: {
      findUnique: jest.fn(),
    },
    answer: {
      count: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/modules/questions/question-generator.service', () => ({
  questionGeneratorService: {
    generateQuestions: jest.fn(),
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    invalidateUserCache: jest.fn(),
  },
}));

describe('SessionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('Branch: Creating a session with an invalid/non-existent topic creates it', async () => {
      // FindFirst returns null, so it creates the topic
      (prisma.topic.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.topic.create as jest.Mock).mockResolvedValue({ id: 'newTopicId', name: 'NewTopic' });
      
      (questionGeneratorService.generateQuestions as jest.Mock).mockResolvedValue({
        questions: [{ text: 'Q1' }, { text: 'Q2' }, { text: 'Q3' }, { text: 'Q4' }, { text: 'Q5' }],
        prompt: 'prompt',
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return { id: 'newSess1', status: 'IN_PROGRESS', totalQuestions: 5, currentQuestionOrder: 1 };
      });

      const result = await sessionsService.createSession('user1', ['NewTopic'], 'INTERMEDIATE');

      expect(prisma.topic.create).toHaveBeenCalledWith({ data: { name: 'NewTopic' } });
      expect(result.sessionId).toBe('newSess1');
    });
  });

  describe('getSessionById', () => {
    it('Branch: Requesting a session that belongs to a different user', async () => {
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'otherUser' });
      
      await expect(sessionsService.getSessionById('sess1', 'user1')).rejects.toThrow('Access denied');
    });
  });
});
