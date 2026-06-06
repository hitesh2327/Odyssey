import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export class QuestionsService {
  public async getQuestionByOrder(sessionId: string, userId: string, order: number) {
    // Fetch the session details to validate ownership and ranges
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    if (!session.startedAt) {
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { startedAt: new Date() },
      });
    }

    // Dynamic question limit check
    if (order < 1 || order > session.totalQuestions) {
      throw new ApiError(404, 'Question not found');
    }

    // Retrieve the question and its associated answer for this session
    const question = await prisma.question.findFirst({
      where: {
        sessionId,
        questionOrder: order,
      },
      include: {
        answers: {
          where: {
            sessionId,
          },
        },
      },
    });

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    const existingAnswer = question.answers.length > 0 ? question.answers[0].userResponse : null;

    return {
      id: question.id,
      questionOrder: question.questionOrder,
      questionText: question.text,
      existingAnswer,
    };
  }
}

export const questionsService = new QuestionsService();
