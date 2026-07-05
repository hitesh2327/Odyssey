import { evaluationService } from '../../../../src/modules/evaluation/evaluation.service';
import { prisma } from '../../../../src/lib/prisma';
import { groq } from '../../../../src/lib/groq';
import { cacheService } from '../../../../src/services/cache.service';
import { config } from '../../../../src/config';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    assessmentSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    answer: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    invalidateUserCache: jest.fn(),
  },
}));

jest.mock('../../../../src/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('EvaluationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.GROQ_API_KEY = 'real-key';
  });

  afterEach(() => {
    config.GROQ_API_KEY = 'test_key';
  });

  describe('evaluateSessionBackground', () => {
    it('should do nothing if session is not found', async () => {
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue(null);
      await evaluationService.evaluateSessionBackground('sess1');
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });

    it('should set session to FAILED if all question evaluations fail', async () => {
      const mockSession = {
        id: 'sess1',
        userId: 'user1',
        difficulty: 'Medium',
        topic: { name: 'React' },
        questions: [
          { text: 'Q1', topic: { name: 'React' }, answers: [{ id: 'a1', userResponse: 'Ans1' }] },
        ],
      };
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Force Groq to fail
      (groq.chat.completions.create as jest.Mock).mockRejectedValue(new Error('Groq Error'));

      await evaluationService.evaluateSessionBackground('sess1');

      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess1' },
        data: { evaluationStatus: 'FAILED' },
      });
    });

    it('should parse score successfully, compute overall summary, and complete session', async () => {
      const mockSession = {
        id: 'sess1',
        userId: 'user1',
        difficulty: 'Medium',
        topic: { name: 'React' },
        questions: [
          { text: 'Q1', topic: { name: 'React' }, answers: [{ id: 'a1', userResponse: 'Ans1' }] },
          { text: 'Q2', topic: { name: 'React' }, answers: [{ id: 'a2', userResponse: 'Ans2' }] },
        ],
      };
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      // Mock individual answer evaluations
      (groq.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ score: 80, feedback: 'Good', expectedConcepts: [], strengths: [], improvements: [], breakdown: {} }) } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ score: '90', feedback: 'Great', expectedConcepts: null, strengths: null, improvements: null, breakdown: null }) } }] // tests fallback logic
        })
        // Mock summary generation
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Overall solid performance.' } }]
        });

      await evaluationService.evaluateSessionBackground('sess1');

      // Check if answers were updated
      expect(prisma.answer.update).toHaveBeenCalledTimes(2);
      expect(prisma.answer.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'a1' },
        data: expect.objectContaining({ score: 80 })
      }));
      expect(prisma.answer.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'a2' },
        data: expect.objectContaining({ score: 90 }) // parsed string to int
      }));

      // Check session was completed with average score (85)
      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess1' },
        data: {
          score: 85,
          feedback: 'Overall solid performance.',
          evaluationStatus: 'COMPLETED',
        },
      });

      expect(cacheService.invalidateUserCache).toHaveBeenCalledWith('user1');
    });

    it('should use fallback text if summary generation fails', async () => {
      const mockSession = {
        id: 'sess1',
        userId: 'user1',
        difficulty: 'Medium',
        topic: { name: 'React' },
        questions: [
          { text: 'Q1', topic: { name: 'React' }, answers: [{ id: 'a1', userResponse: 'Ans1' }] },
        ],
      };
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      (groq.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ score: 100, feedback: 'Perfect' }) } }]
        })
        .mockRejectedValueOnce(new Error('Summary Gen Error'));

      await evaluationService.evaluateSessionBackground('sess1');

      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess1' },
        data: {
          score: 100,
          feedback: 'You scored 100/100 based on 1 successfully evaluated questions.',
          evaluationStatus: 'COMPLETED',
        },
      });
    });

    it('should fail session evaluation if GROQ_API_KEY is missing', async () => {
      config.GROQ_API_KEY = ''; // Simulate missing key
      const mockSession = {
        id: 'sess1',
        userId: 'user1',
        difficulty: 'Medium',
        topic: { name: 'React' },
        questions: [
          { text: 'Q1', topic: { name: 'React' }, answers: [{ id: 'a1', userResponse: 'Ans1' }] },
        ],
      };
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue(mockSession);

      await evaluationService.evaluateSessionBackground('sess1');

      // The individual question evaluation throws because of missing key, catching it in Promise.allSettled
      // Resulting in 0 successful evaluations, thus falling to FAILED.
      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess1' },
        data: { evaluationStatus: 'FAILED' },
      });
    });
  });
});
