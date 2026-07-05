import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';
import { config } from '../config';

// Global express error handling middleware
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  if (err instanceof ApiError && err.statusCode < 500) {
    logger.warn(`[${req.method}] ${req.path} - Client Error (${err.statusCode}): ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data ? { data: err.data } : {}),
    });
  }

  logger.error(`[${req.method}] ${req.path} - Error: ${err.message}`, {
    stack: err.stack,
  });

  // Handle generic JWT signature or expired errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token expired',
    });
  }

  // Default server error representation
  const status = 500;
  const message =
    config.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Something went wrong';

  return res.status(status).json({
    success: false,
    message,
  });
};
