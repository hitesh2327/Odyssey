import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { SessionSummaryResponse } from './session-summary.types';

export class SessionSummaryService {
  public async completeSession(userId: string, sessionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Validate Session Exists
      const session = await tx.assessmentSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new ApiError(404, 'Session not found');
      }

      // 2. Validate Session Ownership
      if (session.userId !== userId) {
        throw new ApiError(403, 'Access denied');
      }

      // 3. Validate Session Status
      if (session.status !== 'IN_PROGRESS') {
        throw new ApiError(400, 'Session is already completed');
      }

      // 4. Validate All Questions Answered
      const answeredCount = await tx.answer.count({
        where: { sessionId },
      });

      if (answeredCount < session.totalQuestions) {
        throw new ApiError(400, 'Complete all questions before finishing the assessment.');
      }

      // 5. Update status and timestamp
      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });
  }

  public async getSessionSummary(userId: string, sessionId: string): Promise<SessionSummaryResponse> {
    // 1. Fetch Session with Optimized include to avoid N+1 queries
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        topic: true,
        questions: {
          orderBy: { questionOrder: 'asc' },
          include: {
            answers: true,
            aiAssistance: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // 2. Ownership Validation
    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    // 3. Status Validation
    if (session.status !== 'COMPLETED') {
      throw new ApiError(400, 'Assessment is not completed yet.');
    }

    // 4. Calculate statistics
    const totalQuestions = session.totalQuestions;
    const answeredQuestions = await prisma.answer.count({
      where: { sessionId },
    });
    const aiAssistUsed = await prisma.aIAssistance.count({
      where: { sessionId },
    });
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    let durationInMinutes: number | null = null;
    if (session.completedAt && session.startedAt) {
      const diffMs = session.completedAt.getTime() - session.startedAt.getTime();
      durationInMinutes = Math.round(diffMs / 60000);
    } else if (session.completedAt && !session.startedAt) {
      durationInMinutes = 0; // Fallback to 0 if completed but not started
    }

    // 5. Map Questions Summary
    const questionsSummary = session.questions.map((q) => {
      // Find the user answer for this session/question
      const answerRecord = q.answers.find((ans) => ans.sessionId === sessionId);
      // Check if AI assistance was used for this session/question
      const aiRecord = q.aiAssistance.find((ai) => ai.sessionId === sessionId);

      return {
        questionId: q.id,
        questionOrder: q.questionOrder,
        questionText: q.text,
        answer: answerRecord ? answerRecord.userResponse : '',
        usedAI: !!aiRecord,
        aiUsageCount: aiRecord ? 1 : 0,
      };
    });

    return {
      sessionId: session.id,
      status: session.status,
      topic: session.topic.name,
      difficulty: session.difficulty,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      statistics: {
        totalQuestions,
        answeredQuestions,
        aiAssistUsed,
        completionPercentage,
        durationInMinutes,
      },
      questions: questionsSummary,
    };
  }
}

export const sessionSummaryService = new SessionSummaryService();
