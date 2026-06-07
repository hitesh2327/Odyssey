import { groq } from '../../lib/groq';
import { logger } from '../../lib/logger';
import { config } from '../../config';

interface GeneratedQuestion {
  order: number;
  text: string;
}

export class QuestionGeneratorService {
  public async generateQuestions(
    topicName: string,
    difficulty: string,
  ): Promise<{ questions: GeneratedQuestion[]; prompt: string }> {
    const prompt = `Generate exactly 5 technical interview questions for the topic "${topicName}" at "${difficulty}" difficulty level.
Return your response as a JSON object matching this schema:
{
  "questions": [
    {
      "order": 1,
      "question": "Question text here..."
    }
  ]
}
Do not include any extra text outside the JSON markdown format. Return only valid JSON.`;

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
            if (formatted.length === 5) {
              logger.info(`Successfully generated 5 questions via Groq for ${topicName}`);
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
    const fallbackQuestions = this.getFallbackQuestions(topicName, difficulty);
    return { questions: fallbackQuestions, prompt };
  }

  private getFallbackQuestions(topicName: string, difficulty: string): GeneratedQuestion[] {
    const cleanTopic = topicName.toLowerCase().trim();

    if (cleanTopic.includes('javascript')) {
      return [
        { order: 1, text: 'Explain closures in JavaScript and how they can lead to memory leaks.' },
        {
          order: 2,
          text: 'What is the difference between Promises, async/await, and callbacks? How do you handle parallel executions?',
        },
        {
          order: 3,
          text: 'Describe the JavaScript event loop, microtasks, and macrotasks. What is the execution order?',
        },
        {
          order: 4,
          text: 'What is hoisting in JavaScript? Explain the difference in hoisting behavior between var, let, const, and functions.',
        },
        {
          order: 5,
          text: 'Explain prototypical inheritance in JavaScript. How does the prototype chain work?',
        },
      ];
    }

    if (
      cleanTopic.includes('node.js') ||
      cleanTopic.includes('nodejs') ||
      cleanTopic.includes('node')
    ) {
      return [
        {
          order: 1,
          text: 'What are streams in Node.js? Detail the four types of streams and explain backpressure.',
        },
        {
          order: 2,
          text: 'How does the Node.js cluster module work, and how does it load-balance requests across worker processes?',
        },
        {
          order: 3,
          text: 'Explain the EventEmitter class in Node.js. How do you implement a custom event emitter?',
        },
        {
          order: 4,
          text: 'What are Buffers in Node.js? In what scenarios are they used, and how do they interact with binary data streams?',
        },
        {
          order: 5,
          text: 'Describe the Node.js event loop phases. What happens in timers, poll, check, and close callbacks?',
        },
      ];
    }

    if (cleanTopic.includes('mongodb') || cleanTopic.includes('mongo')) {
      return [
        {
          order: 1,
          text: 'What are the different types of indexes in MongoDB? How do you optimize query performance using covered queries?',
        },
        {
          order: 2,
          text: 'Explain the MongoDB aggregation pipeline. How do stage operators like $lookup, $group, and $unwind function?',
        },
        {
          order: 3,
          text: 'What is sharding in MongoDB? Explain the roles of shard keys, config servers, and mongos routing instances.',
        },
        {
          order: 4,
          text: 'How does replication work in MongoDB? Detail primary-secondary election logic and replication oplogs.',
        },
        {
          order: 5,
          text: 'Does MongoDB support ACID transactions? Under what conditions are multi-document transactions recommended?',
        },
      ];
    }

    // Generic fallback for any other topic
    return [
      {
        order: 1,
        text: `What are the core principles and fundamental concepts of ${topicName} at a ${difficulty} level?`,
      },
      {
        order: 2,
        text: `Can you describe a common, real-world architectural design pattern or scenario where ${topicName} is applied?`,
      },
      {
        order: 3,
        text: `What are the trade-offs, pros, and cons of incorporating ${topicName} in a large-scale enterprise application?`,
      },
      {
        order: 4,
        text: `How would you debug, profile, or optimize performance issues for systems implemented using ${topicName}?`,
      },
      {
        order: 5,
        text: `What are the industry-standard security and clean coding best practices when designing modules with ${topicName}?`,
      },
    ];
  }
}

export const questionGeneratorService = new QuestionGeneratorService();
