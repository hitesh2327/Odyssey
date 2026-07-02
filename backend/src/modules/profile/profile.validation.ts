import { z } from 'zod';
import { ExperienceLevel } from '@prisma/client';

export const updateProfileSchema = z.object({
  body: z.object({
    role: z.string().max(150).optional(),
    homePort: z.string().max(150).optional(),
    bio: z.string().max(1000).optional(),
    experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
    timezone: z.string().max(50).optional(),
  }),
});

export const replaceTopicsSchema = z.object({
  body: z.object({
    topicIds: z.array(z.string().uuid('Invalid Topic ID')),
  }),
});
