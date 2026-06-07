import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { groq } from '../../lib/groq';
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

    // 5. Groq Prompt Engineering (Strict System Prompt)
    const systemPrompt = `You are a strict technical interviewer and mentor.
Your job is to guide candidates without revealing answers.
Return your response as a JSON object matching this schema:
{
  "hint": "A subtle hint or guiding question...",
  "guidance": "General direction on what concepts to think about...",
  "suggestedApproach": "High-level steps without giving away the exact solution...",
  "relatedConcepts": ["concept1", "concept2"],
  "learningResources": ["resource1", "resource2"]
}

CRITICAL RULES:
- NEVER provide direct answers or complete solutions.
- NEVER provide code implementations.
- Always ask guiding questions or point to specific concepts to make the candidate think.
- Keep responses very concise and strictly under 200 words.
- Do not include any extra text outside the JSON format. Return only valid JSON.`;

    const userPrompt = `Question:
${question.text}

Difficulty:
${question.difficulty}

Topic:
${question.topic.name}`;

    let aiResult: AIAssistanceResponseData;
    let tokenUsage: any = null;

    if (!config.GROQ_API_KEY || config.GROQ_API_KEY === 'dummy_key') {
      logger.warn('Groq API Key is missing. Returning 503 error.');
      throw new ApiError(503, 'AI assistance is temporarily unavailable.');
    }

    try {
      const response = await groq.chat.completions.create({
        model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const content = response.choices[0]?.message?.content;
      tokenUsage = response.usage || null;

      if (!content) {
        throw new Error('Empty response from Groq');
      }

      aiResult = JSON.parse(content) as AIAssistanceResponseData;
    } catch (err: any) {
      logger.error(`Failed calling Groq assistance endpoint: ${err.message}`);
      throw new ApiError(503, 'AI assistance is temporarily unavailable.');
    }

    // 6. Response Length Guards (Slice boundaries safely)
    const hint = (aiResult.hint || '').slice(0, 500);
    const guidance = (aiResult.guidance || '').slice(0, 1000);
    const suggestedApproach = (aiResult.suggestedApproach || '').slice(0, 1000);

    const structuredResponse: AIAssistanceResponseData = {
      hint,
      guidance,
      suggestedApproach,
      relatedConcepts: aiResult.relatedConcepts || [],
      learningResources: aiResult.learningResources || [],
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
          modelName: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
          promptVersion: 'AI_ASSIST_V1',
        },
      });
    });

    return structuredResponse;
  }
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
      res.write(`data: ${JSON.stringify({ error: 'AI assistance already used for this question.' })}\n\n`);
      res.end();
      return;
    }

    if (!config.GROQ_API_KEY || config.GROQ_API_KEY === 'dummy_key') {
      logger.warn('Streaming Failed: Groq API Key missing');
      res.write(`data: ${JSON.stringify({ error: 'AI assistance is temporarily unavailable.' })}\n\n`);
      res.end();
      return;
    }

    const systemPrompt = `You are a strict technical interviewer and mentor. 
Your goal is to guide the candidate to find the answer themselves without ever revealing the direct solution.
CRITICAL RULES:
1. NEVER provide the direct answer to the question.
2. NEVER write code snippets that solve the problem.

You MUST format your response EXACTLY using these markdown headers and include a markdown horizontal rule (---) between each section:

### 💡 Hint
(Provide 2-3 key names, terms, or concepts wrapped in backticks like \`Keyword\`. Do NOT write full sentences or give away the answer.)

---
### 🎯 Concepts To Mention
✓ (Concept 1)
✓ (Concept 2)
✓ (Concept 3)

---
### ⚠ Common Mistake
(Point out a common pitfall or misconception to avoid)

---
### ⭐ Strong Answer Bonus
(Suggest an advanced concept or real-world application they could mention to stand out)

Do not include any other text outside these headers.`;

    const userPrompt = `Question:
${question.text}

Difficulty:
${question.difficulty}

Topic:
${question.topic.name}`;

    try {
      const stream = await groq.chat.completions.create({
        model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
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

        await tx.aIInteraction.create({
          data: {
            sessionId: session.id,
            questionId,
            type: 'HINT_REQUEST',
            prompt: userPrompt,
            response: fullContent,
            modelName: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
            promptVersion: 'AI_STREAM_V1',
          },
        });
      });

      logger.info(`Streaming Completed: Successfully streamed and saved for Question ${questionId}`);

    } catch (err: any) {
      logger.error(`Streaming Failed for Question ${questionId}: ${err.message}`);
      res.write(`data: ${JSON.stringify({ error: 'Stream disconnected unexpectedly' })}\n\n`);
      res.end();
    }
  }
}

export const aiAssistanceService = new AIAssistanceService();
