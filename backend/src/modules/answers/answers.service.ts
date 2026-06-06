import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export class AnswersService {
  public async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    answerText: string,
  ) {
    // 1. Fetch the session and validate existence & ownership
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    // 2. Fetch the question and validate existence
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    // 3. Validate that the question belongs to this session
    if (question.sessionId !== sessionId) {
      throw new ApiError(400, 'Question does not belong to session');
    }

    // 4. Perform an Upsert on the Answer record
    await prisma.answer.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId,
        },
      },
      update: {
        userResponse: answerText,
      },
      create: {
        sessionId,
        questionId,
        userResponse: answerText,
      },
    });

    // 5. Update session progress pointer (highest question order reached)
    const nextOrder = question.questionOrder + 1;
    const highestReached = Math.max(session.currentQuestionOrder, nextOrder);
    const newQuestionOrder = Math.min(session.totalQuestions, highestReached);

    if (newQuestionOrder !== session.currentQuestionOrder) {
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { currentQuestionOrder: newQuestionOrder },
      });
    }

    return {
      success: true,
      message: 'Answer saved successfully',
    };
  }
}

export const answersService = new AnswersService();
