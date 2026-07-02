import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendOtpSchema,
  changeEmailRequestSchema,
  changeEmailVerifySchema,
  forgotPasswordSchema,
  resetPasswordVerifySchema,
  resetPasswordResendSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);

router.post(
  '/change-email/request',
  authMiddleware,
  validate(changeEmailRequestSchema),
  authController.changeEmailRequest,
);
router.post(
  '/change-email/verify',
  authMiddleware,
  validate(changeEmailVerifySchema),
  authController.changeEmailVerify,
);

router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordVerifySchema), authController.resetPasswordVerify);
router.post(
  '/reset-password/resend',
  validate(resetPasswordResendSchema),
  authController.resetPasswordResend,
);

export { router as authRouter };
