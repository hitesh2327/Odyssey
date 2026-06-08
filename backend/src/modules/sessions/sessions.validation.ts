import { z } from 'zod';
import { Difficulty } from '@prisma/client';

export const createSessionSchema = z.object({
  body: z.object({
    topicId: z.string().optional(), // Deprecated
    topicIds: z.array(z.string().min(1, 'Topic ID cannot be empty'))
      .min(1, 'At least one topic is required')
      .max(5, 'Maximum 5 topics allowed')
      .optional(),
    difficulty: z.nativeEnum(Difficulty, {
      errorMap: () => ({ message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED' }),
    }),
  }).refine(data => data.topicId || (data.topicIds && data.topicIds.length > 0), {
    message: 'Either topicId or topicIds must be provided',
    path: ['topicIds'],
  }).refine(data => {
    if (data.topicIds) {
      return new Set(data.topicIds).size === data.topicIds.length;
    }
    return true;
  }, {
    message: 'Duplicate topics are not allowed',
    path: ['topicIds'],
  }),
});

export const getSessionParamsSchema = z.object({
  params: z.object({
    sessionId: z
      .string({ required_error: 'Session ID is required' })
      .uuid({ message: 'Session ID must be a valid UUID' }),
  }),
});
