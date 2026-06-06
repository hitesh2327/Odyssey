import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { registerSchema, loginSchema } from './auth.validation';
import { z } from 'zod';

type RegisterInput = z.infer<typeof registerSchema>['body'];
type LoginInput = z.infer<typeof loginSchema>['body'];

export class AuthService {
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '1d' });
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
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const token = this.generateToken(user.id);

    return { token, user };
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

    // Verify password match
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
export const authService = new AuthService();
