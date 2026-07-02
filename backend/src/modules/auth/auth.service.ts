import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { registerSchema, loginSchema } from './auth.validation';
import { z } from 'zod';
import { sendOtp } from '../../lib/otp';

type RegisterInput = z.infer<typeof registerSchema>['body'];
type LoginInput = z.infer<typeof loginSchema>['body'];

export class AuthService {
  public generateToken(userId: string, isEmailVerified: boolean): string {
    return jwt.sign({ userId, isEmailVerified }, config.JWT_SECRET, { expiresIn: '1d' });
  }

  public async register(input: RegisterInput) {
    const emailLower = input.email.toLowerCase();
    
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new ApiError(400, 'Email address is already in use');
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: emailLower,
        passwordHash,
        isEmailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
      },
    });

    // Send verify email OTP
    await sendOtp('verify_email', user.id, user.email, undefined);

    return { 
      userId: user.id, 
      email: user.email, 
      requiresVerification: true 
    };
  }

  public async login(input: LoginInput) {
    const emailLower = input.email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Block local login for Google accounts
    if (user.provider === 'google' || !user.passwordHash) {
      throw new ApiError(400, 'Please continue with Google.');
    }

    // Verify password match
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Login guard: check email verification
    if (!user.isEmailVerified) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', {
        userId: user.id,
        email: user.email,
      });
    }

    const token = this.generateToken(user.id, user.isEmailVerified);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  public async googleAuth(idToken: string) {
    const clientId = config.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ApiError(500, 'Google Client ID is not configured on the server');
    }

    const client = new OAuth2Client(clientId);
    let payload;

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      throw new ApiError(400, 'Invalid Google token');
    }

    if (!payload || !payload.email) {
      throw new ApiError(400, 'Invalid Google token payload');
    }

    const emailLower = payload.email.toLowerCase();
    const name = payload.name || emailLower.split('@')[0];
    const avatarUrl = payload.picture || null;
    const isEmailVerified = payload.email_verified || false;
    const googleId = payload.sub;

    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (user) {
      // Link Google info if user is not already google provider
      if (user.provider !== 'google' || !user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            googleId,
            avatarUrl: user.avatarUrl || avatarUrl,
            isEmailVerified: true,
          },
        });
      }
    } else {
      // Create user if missing
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name,
          provider: 'google',
          googleId,
          avatarUrl,
          isEmailVerified,
        },
      });
    }

    const token = this.generateToken(user.id, user.isEmailVerified);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
export const authService = new AuthService();
