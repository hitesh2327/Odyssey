import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name cannot be empty'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z
      .string({ required_error: 'idToken is required' })
      .min(1, 'idToken cannot be empty'),
  }),
});
