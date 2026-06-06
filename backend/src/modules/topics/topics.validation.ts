import { z } from 'zod';

export const getTopicsSchema = z.object({
  query: z.object({
    search: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
  }),
});

export const getTopicByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Topic ID must be a valid UUID' }),
  }),
});
export type GetTopicsQuery = z.infer<typeof getTopicsSchema>['query'];
