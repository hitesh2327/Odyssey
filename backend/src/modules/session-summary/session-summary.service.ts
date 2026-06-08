import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { SessionSummaryResponse } from './session-summary.types';
import { evaluationService } from '../evaluation/evaluation.service';
import { cacheService } from '../../services/cache.service';
import { logger } from '../../lib/logger';

export class SessionSummaryService {
  public async completeSession(userId: string, sessionId: string): Promise<void> {
    try {
      
    
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

      // 5. Update status, evaluationStatus, and timestamp
      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          evaluationStatus: 'PROCESSING',
          completedAt: new Date(),
        },
      });
    });

    // Invalidate Redis cache since session status has changed
    await cacheService.invalidateUserCache(userId);

    // 6. Trigger Background AI Evaluation
    evaluationService.evaluateSessionBackground(sessionId).catch((err) => {
      logger.error(`Background evaluation failed to start for session ${sessionId}:`, err);
    });
    } catch (error) {
      logger.error(`Failed to complete session ${sessionId}:`, error);
    }
  }

  public async getEvaluationStatus(userId: string, sessionId: string): Promise<string> {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, evaluationStatus: true },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    return session.evaluationStatus;
  }

  public async getSessionSummary(userId: string, sessionId: string): Promise<SessionSummaryResponse> {
    // 1. Fetch Session with Optimized include to avoid N+1 queries
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        topic: true,
        sessionTopics: true,
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

    // Calculate performance level
    let performanceLevel = 'Pending';
    if (session.evaluationStatus === 'COMPLETED' && session.score !== null) {
      if (session.score >= 90) performanceLevel = 'Excellent';
      else if (session.score >= 80) performanceLevel = 'Strong';
      else if (session.score >= 70) performanceLevel = 'Good';
      else if (session.score >= 60) performanceLevel = 'Average';
      else performanceLevel = 'Needs Improvement';
    } else if (session.evaluationStatus === 'FAILED') {
      performanceLevel = 'Failed';
    }

    const topicsCovered = session.sessionTopics && session.sessionTopics.length > 0
      ? session.sessionTopics.map(st => {
          const qCount = session.questions.filter(q => q.topicId === st.topicId).length;
          return `${st.topicNameSnapshot}: ${qCount} Questions`;
        })
      : [`${session.topic?.name || 'Unknown Topic'}: ${totalQuestions} Questions`];

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
        score: answerRecord?.score ?? null,
        feedback: answerRecord?.feedback ?? null,
        expectedConcepts: answerRecord?.expectedConcepts ?? [],
        breakdown: answerRecord?.breakdown ?? null,
        strengths: answerRecord?.strengths ?? [],
        improvements: answerRecord?.improvements ?? [],
      };
    });

    return {
      sessionId: session.id,
      status: session.status,
      evaluationStatus: session.evaluationStatus,
      overallScore: session.score,
      overallFeedback: session.feedback,
      performanceLevel,
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
      topicsCovered,
      questions: questionsSummary,
    };
  }
}

export const sessionSummaryService = new SessionSummaryService();
