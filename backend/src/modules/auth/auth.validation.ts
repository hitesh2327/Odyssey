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

export const verifyEmailSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is required' }).uuid('Invalid User ID'),
    otp: z.string({ required_error: 'otp is required' }).length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'userId is required' }).uuid('Invalid User ID'),
  }),
});

export const changeEmailRequestSchema = z.object({
  body: z.object({
    newEmail: z
      .string({ required_error: 'New email is required' })
      .trim()
      .email('Invalid email format'),
  }),
});

export const changeEmailVerifySchema = z.object({
  body: z.object({
    otp: z.string({ required_error: 'otp is required' }).length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email format'),
  }),
});

export const resetPasswordVerifySchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email format'),
    otp: z.string({ required_error: 'otp is required' }).length(6, 'OTP must be exactly 6 digits'),
    password: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

export const resetPasswordResendSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email format'),
  }),
});
