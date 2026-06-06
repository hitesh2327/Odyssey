import { z } from 'zod';

export const sessionParamsSchema = z.object({
  params: z.object({
    sessionId: z
      .string({ required_error: 'Session ID is required' })
      .uuid({ message: 'Session ID must be a valid UUID' }),
  }),
});
