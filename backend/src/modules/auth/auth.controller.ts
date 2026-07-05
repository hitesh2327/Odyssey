import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { authService } from './auth.service';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { sendOtp, verifyOtp, getOtpRecord, clearOtp } from '../../lib/otp';

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
      // No setAuthCookie on registration; user must verify OTP first
      res.status(201).json({
        success: true,
        requiresVerification: true,
        userId: result.userId,
        email: result.email,
        nextResendAllowedAt: result.nextResendAllowedAt,
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

  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, otp } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.isEmailVerified) {
        // Idempotent success
        const token = authService.generateToken(user.id, true);
        setAuthCookie(res, token);
        res.status(200).json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: true,
          },
        });
        return;
      }

      // Verify OTP
      await verifyOtp('verify_email', userId, otp);

      // Update User verification status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });

      // Clear OTP records
      await clearOtp('verify_email', userId);

      const token = authService.generateToken(updatedUser.id, true);
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isEmailVerified: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (user.isEmailVerified) {
        throw new ApiError(400, 'Email address is already verified');
      }

      const { nextResendAllowedAt } = await sendOtp('verify_email', userId, user.email, undefined);

      res.status(200).json({
        success: true,
        message: 'OTP verification code resent successfully',
        nextResendAllowedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  public changeEmailRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { newEmail } = req.body;
      const newEmailLower = newEmail.toLowerCase();

      // Check if new email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmailLower },
      });

      if (existingUser) {
        throw new ApiError(400, 'Email address is already in use');
      }

      // Send OTP to new email address
      const { nextResendAllowedAt } = await sendOtp('change_email', userId, req.user!.email, newEmailLower);

      res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your new email',
        nextResendAllowedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  public changeEmailVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { otp } = req.body;

      // Get change email record to find the pending new email
      const record = await getOtpRecord('change_email', userId);
      if (!record || !record.newEmail) {
        throw new ApiError(400, 'OTP request has expired. Please initiate email change again.');
      }

      const newEmail = record.newEmail;

      // Verify OTP
      await verifyOtp('change_email', userId, otp);

      // Update User email
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          isEmailVerified: true,
        },
      });

      // Clear OTP records
      await clearOtp('change_email', userId);

      // Generate a new JWT token with updated email/verified info
      const token = authService.generateToken(updatedUser.id, true);
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isEmailVerified: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const emailLower = email.toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      // Anonymity check: don't leak user existence
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If that email exists, a password reset code has been sent',
        });
        return;
      }


      // Send OTP to user's email
      const { nextResendAllowedAt } = await sendOtp('reset_password', emailLower, emailLower, undefined);

      res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset code has been sent',
        nextResendAllowedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPasswordVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp, password } = req.body;
      const emailLower = email.toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify OTP
      await verifyOtp('reset_password', emailLower, otp);

      // Hash the new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update User password and set verified as true (safeguard)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          isEmailVerified: true,
        },
      });

      // Clear OTP records
      await clearOtp('reset_password', emailLower);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPasswordResend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const emailLower = email.toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }


      const { nextResendAllowedAt } = await sendOtp('reset_password', emailLower, emailLower, undefined);

      res.status(200).json({
        success: true,
        message: 'Password reset OTP code resent successfully',
        nextResendAllowedAt,
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
