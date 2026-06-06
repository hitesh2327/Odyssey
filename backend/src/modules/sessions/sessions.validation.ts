import { z } from 'zod';
import { Difficulty } from '@prisma/client';

export const createSessionSchema = z.object({
  body: z.object({
    topicId: z
      .string({ required_error: 'Topic ID is required' })
      .uuid({ message: 'Topic ID must be a valid UUID' }),
    difficulty: z.nativeEnum(Difficulty, {
      errorMap: () => ({ message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED' }),
    }),
  }),
});

export const getSessionParamsSchema = z.object({
  params: z.object({
    sessionId: z
      .string({ required_error: 'Session ID is required' })
      .uuid({ message: 'Session ID must be a valid UUID' }),
  }),
});
