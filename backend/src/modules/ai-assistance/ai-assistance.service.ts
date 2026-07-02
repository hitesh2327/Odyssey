import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { groq } from '../../lib/groq';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { AIAssistanceResponseData } from './ai-assistance.types';
import { StreamAssistance } from '../../prompts/stream.assistance.prompt';
import { chatMemoryService } from '../../services/chat-memory.service';

export class AIAssistanceService {
  public async streamAssistance(userId: string, questionId: string, res: any) {
    // 1. Validations
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { topic: true },
    });
    if (!question) throw new ApiError(404, 'Question not found');

    const session = await prisma.assessmentSession.findUnique({
      where: { id: question.sessionId },
    });
    if (!session) throw new ApiError(404, 'Session not found');
    if (session.userId !== userId) throw new ApiError(403, 'Access denied');
    if (session.status !== 'IN_PROGRESS') throw new ApiError(400, 'Session is no longer active');

    // 2. Structured Logging
    logger.info(`Streaming Started: User ${userId} requested AI stream for Question ${questionId}`);

    // 3. Prevent duplicate usage
    const existingUsage = await prisma.aIAssistance.findUnique({
      where: { sessionId_questionId: { sessionId: session.id, questionId } },
    });
    if (existingUsage) {
      logger.warn(`Streaming Failed: AI assistance already used for Question ${questionId}`);
      res.write(
        `data: ${JSON.stringify({ error: 'AI assistance already used for this question.' })}\n\n`,
      );
      res.end();
      return;
    }

    if (!config.GROQ_API_KEY || config.GROQ_API_KEY === 'dummy_key') {
      logger.warn('Streaming Failed: Groq API Key missing');
      res.write(
        `data: ${JSON.stringify({ error: 'AI assistance is temporarily unavailable.' })}\n\n`,
      );
      res.end();
      return;
    }

    const systemPrompt = StreamAssistance.systemPrompt();

    const userPrompt = StreamAssistance.userPrompt({
      text: question.text,
      difficulty: question.difficulty,
      name: question.topic.name,
    });

    try {
      const history = await chatMemoryService.getMessages(session.id);

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...history,
        {
          role: 'user' as const,
          content: userPrompt,
        },
      ];
      const stream = await groq.chat.completions.create({
        model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        stream: true,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullContent += token;
          res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
        }
      }

      res.write('event: end\ndata: {}\n\n');
      res.end();

      // 4. Save to Database asynchronously
      const structuredResponse = {
        hint: fullContent,
        guidance: '',
        suggestedApproach: '',
        relatedConcepts: [],
        learningResources: [],
      };

      await prisma.$transaction(async (tx: any) => {
        await tx.aIAssistance.create({
          data: {
            sessionId: session.id,
            questionId,
            aiResponse: structuredResponse,
          },
        });

        await chatMemoryService.addMessage(session.id, {
          role: 'user',
          content: userPrompt,
        });

        await chatMemoryService.addMessage(session.id, {
          role: 'assistant',
          content: fullContent,
        });
      });

      logger.info(
        `Streaming Completed: Successfully streamed and saved for Question ${questionId}`,
      );
    } catch (err: any) {
      logger.error(`Streaming Failed for Question ${questionId}: ${err.message}`);
      res.write(`data: ${JSON.stringify({ error: 'Stream disconnected unexpectedly' })}\n\n`);
      res.end();
    }
  }
}

export const aiAssistanceService = new AIAssistanceService();
