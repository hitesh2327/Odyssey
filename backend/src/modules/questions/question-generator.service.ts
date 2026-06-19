import { groq } from '../../lib/groq';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { QuestionPromptTemplate } from '../../prompts/question.prompt';

interface GeneratedQuestion {
  order: number;
  text: string;
}

export class QuestionGeneratorService {
  public async generateQuestions(
    topicName: string,
    difficulty: string,
    count: number = 5,
  ): Promise<{ questions: GeneratedQuestion[]; prompt: string }> {
    const prompt = QuestionPromptTemplate.build({ topicName, difficulty, count });

    if (config.GROQ_API_KEY && config.GROQ_API_KEY !== 'dummy_key') {
      try {
        const response = await groq.chat.completions.create({
          model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && Array.isArray(parsed.questions)) {
            const formatted = parsed.questions.map((q: any) => ({
              order: q.order || 1,
              text: q.question || q.text || '',
            }));
            if (formatted.length === count) {
              logger.info(`Successfully generated ${count} questions via Groq for ${topicName}`);
              return { questions: formatted, prompt };
            }
          }
        }
      } catch (err: any) {
        logger.error(
          `Groq question generation failed: ${err.message}. Falling back to topic-specific placeholders.`,
        );
      }
    }

    logger.info(`Using fallback static questions for ${topicName} (${difficulty})`);
    return { questions: [], prompt };
  }
}

export const questionGeneratorService = new QuestionGeneratorService();
