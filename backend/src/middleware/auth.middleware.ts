import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

interface TokenPayload {
  userId: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new ApiError(401, 'Authorization token required');
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    } catch (_err) {
      throw new ApiError(401, 'Invalid or expired authorization token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User associated with token no longer exists');
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
