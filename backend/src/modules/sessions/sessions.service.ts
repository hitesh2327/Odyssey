import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { questionGeneratorService } from '../questions/question-generator.service';
import { Difficulty } from '@prisma/client';

export class SessionsService {
  public async createSession(userId: string, topicId: string, difficulty: Difficulty) {
    // Validate that the topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new ApiError(404, 'Invalid topic. Please select a valid topic.');
    }

    // Generate questions using the QuestionGeneratorService
    const { questions, prompt } = await questionGeneratorService.generateQuestions(
      topic.name,
      difficulty,
    );

    // Save session and generated questions atomically within a Prisma transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.assessmentSession.create({
        data: {
          userId,
          topicId,
          difficulty,
          status: 'IN_PROGRESS',
          totalQuestions: 5,
          currentQuestionOrder: 1,
          questionGenerationPrompt: prompt,
        },
      });

      const questionsData = questions.map((q) => ({
        sessionId: newSession.id,
        topicId,
        text: q.text,
        difficulty,
        questionOrder: q.order,
      }));

      await tx.question.createMany({
        data: questionsData,
      });

      return newSession;
    });

    return {
      sessionId: session.id,
      status: session.status,
      totalQuestions: session.totalQuestions,
      currentQuestion: session.currentQuestionOrder,
    };
  }

  public async getSessionById(sessionId: string, userId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    return {
      sessionId: session.id,
      status: session.status,
      currentQuestionOrder: session.currentQuestionOrder,
      totalQuestions: session.totalQuestions,
    };
  }

  public async getSessionProgress(sessionId: string, userId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    const answeredCount = await prisma.answer.count({
      where: { sessionId },
    });

    return {
      answered: answeredCount,
      total: session.totalQuestions,
      currentQuestion: session.currentQuestionOrder,
      status: session.status,
    };
  }
}

export const sessionsService = new SessionsService();
