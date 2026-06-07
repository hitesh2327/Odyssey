import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

export class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      setAuthCookie(res, result.token);
      res.status(201).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      setAuthCookie(res, result.token);
      res.status(200).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  public googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken } = req.body;
      const result = await authService.googleAuth(idToken);
      setAuthCookie(res, result.token);
      res.status(200).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('accessToken', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
