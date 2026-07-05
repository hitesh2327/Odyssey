import { sessionSummaryService } from '../../../../src/modules/session-summary/session-summary.service';
import { prisma } from '../../../../src/lib/prisma';
import { logger } from '../../../../src/lib/logger';

jest.mock('../../../../src/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));
import { evaluationService } from '../../../../src/modules/evaluation/evaluation.service';
import { cacheService } from '../../../../src/services/cache.service';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    assessmentSession: {
      findUnique: jest.fn(),
    },
    answer: {
      count: jest.fn(),
    },
    aIAssistance: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../../src/modules/evaluation/evaluation.service', () => ({
  evaluationService: {
    evaluateSessionBackground: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../../src/services/cache.service', () => ({
  cacheService: {
    invalidateUserCache: jest.fn(),
  },
}));

describe('SessionSummaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('completeSession', () => {
    it('Branch: Session status transition from IN_PROGRESS to COMPLETED and evaluationStatus update', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          assessmentSession: {
            findUnique: jest.fn().mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS', totalQuestions: 5 }),
            update: jest.fn(),
          },
          answer: {
            count: jest.fn().mockResolvedValue(5), // All answered
          }
        };
        await cb(tx);
        expect(tx.assessmentSession.update).toHaveBeenCalledWith({
          where: { id: 'sess1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            evaluationStatus: 'PROCESSING',
          })
        });
      });

      await sessionSummaryService.completeSession('user1', 'sess1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(evaluationService.evaluateSessionBackground).toHaveBeenCalledWith('sess1');
      expect(cacheService.invalidateUserCache).toHaveBeenCalledWith('user1');
    });

    it('should throw if not all questions answered', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          assessmentSession: {
            findUnique: jest.fn().mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS', totalQuestions: 5 }),
            update: jest.fn(),
          },
          answer: {
            count: jest.fn().mockResolvedValue(4), // Missing one answer
          }
        };
        await cb(tx);
      });

      await expect(sessionSummaryService.completeSession('user1', 'sess1')).rejects.toThrow('Complete all questions before finishing the assessment.');
    });
  });
});
