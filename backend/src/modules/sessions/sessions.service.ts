import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { questionGeneratorService } from '../questions/question-generator.service';
import { cacheService } from '../../services/cache.service';
import { Difficulty } from '@prisma/client';

export class SessionsService {
  public async createSession(userId: string, topicIds: string[], difficulty: Difficulty) {
    const uniqueInputTopicIds = Array.from(new Set(topicIds));
    if (uniqueInputTopicIds.length === 0) {
      throw new ApiError(400, 'At least one topic is required');
    }
    if (uniqueInputTopicIds.length > 5) {
      throw new ApiError(400, 'Maximum 5 topics allowed');
    }

    const topics = await Promise.all(
      uniqueInputTopicIds.map(async (t) => {
        let topic = await prisma.topic.findFirst({
          where: {
            OR: [{ id: t }, { name: { equals: t, mode: 'insensitive' } }],
          },
        });
        if (!topic) {
          topic = await prisma.topic.create({ data: { name: t } });
        }
        return topic;
      }),
    );

    const uniqueTopicsMap = new Map();
    topics.forEach((t: { id: any }) => uniqueTopicsMap.set(t.id, t));
    const uniqueTopics = Array.from(uniqueTopicsMap.values());

    if (uniqueTopics.length > 5) {
      throw new ApiError(400, 'Maximum 5 topics allowed');
    }

    const totalQuestions = uniqueTopics.length === 1 ? 5 : 10;
    const assessmentType = uniqueTopics.length === 1 ? 'SINGLE_TOPIC' : 'MULTI_TOPIC';
    const distribution = this.distributeQuestions(uniqueTopics.length, totalQuestions);

    const allQuestions: {
      topicId: string;
      text: string;
      difficulty: Difficulty;
      questionOrder: number;
    }[] = [];
    let combinedPrompt = '';
    let questionOrder = 1;

    for (let i = 0; i < uniqueTopics.length; i++) {
      const topic = uniqueTopics[i];
      const numQuestions = distribution[i];

      const { questions, prompt } = await questionGeneratorService.generateQuestions(
        topic.name,
        difficulty,
        numQuestions,
      );

      combinedPrompt += `\nTopic: ${topic.name}\n${prompt}`;

      if (questions.length !== numQuestions) {
        throw new ApiError(
          500,
          `Failed to generate enough questions for topic ${topic.name}. Expected ${numQuestions}, got ${questions.length}.`,
        );
      }

      for (const q of questions.slice(0, numQuestions)) {
        allQuestions.push({
          topicId: topic.id,
          text: q.text,
          difficulty,
          questionOrder: questionOrder++,
        });
      }
    }

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.assessmentSession.create({
        data: {
          userId,
          topicId: uniqueTopics[0].id,
          assessmentType,
          difficulty,
          status: 'IN_PROGRESS',
          totalQuestions,
          currentQuestionOrder: 1,
          questionGenerationPrompt: combinedPrompt,
          sessionTopics: {
            create: uniqueTopics.map((t) => ({
              topicId: t.id,
              topicNameSnapshot: t.name,
            })),
          },
        },
      });

      const questionsData = allQuestions.map((q) => ({
        sessionId: newSession.id,
        topicId: q.topicId,
        text: q.text,
        difficulty: q.difficulty,
        questionOrder: q.questionOrder,
      }));

      await tx.question.createMany({
        data: questionsData,
      });

      return newSession;
    });

    await cacheService.invalidateUserCache(userId);

    return {
      sessionId: session.id,
      status: session.status,
      totalQuestions: session.totalQuestions,
      currentQuestion: session.currentQuestionOrder,
    };
  }

  private distributeQuestions(numTopics: number, totalQuestions: number): number[] {
    const distribution = new Array(numTopics).fill(Math.floor(totalQuestions / numTopics));
    let remainder = totalQuestions % numTopics;
    for (let i = 0; i < remainder; i++) {
      distribution[i]++;
    }
    return distribution;
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
