import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { openai } from '../../lib/openai';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { AIAssistanceResponseData } from './ai-assistance.types';

export class AIAssistanceService {
  public async requestAssistance(userId: string, questionId: string) {
    // 1. Validate Question Exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { topic: true },
    });

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    // 2. Validate Session Exists and belongs to User (Ownership)
    const session = await prisma.assessmentSession.findUnique({
      where: { id: question.sessionId },
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'Access denied');
    }

    // 3. Validate Session is Active (IN_PROGRESS)
    if (session.status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'Session is no longer active');
    }

    // 4. Validate One-Time Usage per Question
    const existingUsage = await prisma.aIAssistance.findUnique({
      where: {
        sessionId_questionId: {
          sessionId: session.id,
          questionId,
        },
      },
    });

    if (existingUsage) {
      throw new ApiError(400, 'AI assistance already used for this question.');
    }

    // 5. OpenAI Prompt Engineering (Strict System Prompt)
    const systemPrompt = `You are a senior technical interviewer and mentor.

Your job is to guide candidates without revealing answers.

Provide:
1. Hint
2. Guidance
3. Suggested Approach
4. Related Concepts
5. Learning Resources (optional)

Rules:
- Never provide direct answers.
- Never provide complete solutions.
- Never provide copy-paste responses.
- Never provide code implementations.
- Guide the candidate toward the answer.
- Keep responses concise.
- Maximum 200 words.
- Return valid JSON only.`;

    const userPrompt = `Question:
${question.text}

Difficulty:
${question.difficulty}

Topic:
${question.topic.name}`;

    let aiResult: AIAssistanceResponseData;
    let tokenUsage: any = null;

    if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY === 'dummy_key') {
      logger.warn('OpenAI API Key is missing. Returning 503 error.');
      throw new ApiError(503, 'AI assistance is temporarily unavailable.');
    }

    try {
      const response = await openai.chat.completions.create({
        model: config.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ai_assistance_schema',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                hint: { type: 'string' },
                guidance: { type: 'string' },
                suggestedApproach: { type: 'string' },
                relatedConcepts: {
                  type: 'array',
                  items: { type: 'string' },
                },
                learningResources: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: [
                'hint',
                'guidance',
                'suggestedApproach',
                'relatedConcepts',
                'learningResources',
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      tokenUsage = response.usage || null;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      aiResult = JSON.parse(content) as AIAssistanceResponseData;
    } catch (err: any) {
      logger.error(`Failed calling OpenAI assistance endpoint: ${err.message}`);
      throw new ApiError(503, 'AI assistance is temporarily unavailable.');
    }

    // 6. Response Length Guards (Slice boundaries safely)
    const hint = aiResult.hint.slice(0, 500);
    const guidance = aiResult.guidance.slice(0, 1000);
    const suggestedApproach = aiResult.suggestedApproach.slice(0, 1000);

    const structuredResponse: AIAssistanceResponseData = {
      hint,
      guidance,
      suggestedApproach,
      relatedConcepts: aiResult.relatedConcepts,
      learningResources: aiResult.learningResources,
    };

    // 7. DB Transaction: Write to both AIAssistance and AIInteraction
    await prisma.$transaction(async (tx:any) => {
      await tx.aIAssistance.create({
        data: {
          sessionId: session.id,
          questionId,
          aiResponse: structuredResponse,
        },
      });

      await tx.aIInteraction.create({
        data: {
          sessionId: session.id,
          questionId,
          type: 'HINT_REQUEST',
          prompt: userPrompt,
          response: JSON.stringify(structuredResponse),
          tokensUsed: tokenUsage?.total_tokens || null,
          promptTokens: tokenUsage?.prompt_tokens || null,
          completionTokens: tokenUsage?.completion_tokens || null,
          modelName: config.OPENAI_MODEL || 'gpt-4o-mini',
          promptVersion: 'AI_ASSIST_V1',
        },
      });
    });

    return structuredResponse;
  }
}

export const aiAssistanceService = new AIAssistanceService();
