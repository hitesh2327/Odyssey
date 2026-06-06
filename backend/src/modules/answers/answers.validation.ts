import { z } from 'zod';

export const submitAnswerSchema = z.object({
  body: z.object({
    sessionId: z
      .string({ required_error: 'Session ID is required' })
      .uuid({ message: 'Session ID must be a valid UUID' }),
    questionId: z
      .string({ required_error: 'Question ID is required' })
      .uuid({ message: 'Question ID must be a valid UUID' }),
    answerText: z
      .string({ required_error: 'Answer text is required' })
      .trim()
      .min(1, 'Answer text cannot be empty'),
  }),
});
