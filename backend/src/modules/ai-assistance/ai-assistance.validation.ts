import { z } from 'zod';

export const getAssistSchema = z.object({
  params: z.object({
    questionId: z
      .string({ required_error: 'Question ID is required' })
      .uuid({ message: 'Question ID must be a valid UUID' }),
  }),
});
