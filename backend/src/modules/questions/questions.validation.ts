import { z } from 'zod';

export const getQuestionByOrderSchema = z.object({
  params: z.object({
    sessionId: z
      .string({ required_error: 'Session ID is required' })
      .uuid({ message: 'Session ID must be a valid UUID' }),
    order: z
      .string({ required_error: 'Question order is required' })
      .transform((val, ctx) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Question order must be an integer number',
          });
          return z.NEVER;
        }
        return num;
      }),
  }),
});
