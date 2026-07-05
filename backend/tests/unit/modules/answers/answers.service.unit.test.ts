import { answersService } from '../../../../src/modules/answers/answers.service';
import { prisma } from '../../../../src/lib/prisma';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    assessmentSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
    },
    answer: {
      upsert: jest.fn(),
    },
  },
}));

describe('AnswersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAnswer', () => {
    it('Branch: Requesting a session that belongs to a different user', async () => {
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'otherUser' });
      await expect(answersService.submitAnswer('user1', 'sess1', 'q1', 'ans')).rejects.toThrow('Access denied');
    });

    it('Branch: Submitting an answer to a question that already has an answer row (duplicate submission behaviour)', async () => {
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', currentQuestionOrder: 1, totalQuestions: 5 });
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', questionOrder: 1 });
      
      await answersService.submitAnswer('user1', 'sess1', 'q1', 'my updated answer');

      expect(prisma.answer.upsert).toHaveBeenCalledWith({
        where: { sessionId_questionId: { sessionId: 'sess1', questionId: 'q1' } },
        update: { userResponse: 'my updated answer' },
        create: { sessionId: 'sess1', questionId: 'q1', userResponse: 'my updated answer' },
      });
      
      // Since it's qOrder 1, next is 2. current=1 -> new=2.
      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess1' },
        data: { currentQuestionOrder: 2 },
      });
    });

    it('should cap question order at totalQuestions', async () => {
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', currentQuestionOrder: 5, totalQuestions: 5 });
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', questionOrder: 5 });
      
      await answersService.submitAnswer('user1', 'sess1', 'q1', 'last answer');

      // nextOrder = 6, max(5, 6)=6, min(5, 6)=5. new=5, current=5. So NO update.
      expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
    });
  });
});
