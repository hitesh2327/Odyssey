import { authService } from '../../../../src/modules/auth/auth.service';
import { prisma } from '../../../../src/lib/prisma';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { sendOtp } from '../../../../src/lib/otp';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../../../src/lib/otp', () => ({
  sendOtp: jest.fn(),
}));

jest.mock('google-auth-library');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('Branch: Duplicate email registration conflict', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });
      await expect(authService.register({ name: 'test', email: 'test@test.com', password: 'pass' }))
        .rejects.toThrow('Email address is already in use');
    });

    it('should register successfully and return requiresVerification: true', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user1', email: 'test@test.com' });
      (sendOtp as jest.Mock).mockResolvedValue({ nextResendAllowedAt: new Date() });

      const result = await authService.register({ name: 'test', email: 'test@test.com', password: 'pass' });
      
      expect(result.requiresVerification).toBe(true);
      expect(result.userId).toBe('user1');
      expect(sendOtp).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('Branch: User not found on login', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(authService.login({ email: 'test@test.com', password: 'pass' }))
        .rejects.toThrow('Invalid email or password');
    });

    it('Branch: Password mismatch on login', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: 'hashed', isEmailVerified: true });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login({ email: 'test@test.com', password: 'pass' }))
        .rejects.toThrow('Invalid email or password');
    });

    it('Branch: Login throws 403 when isEmailVerified is false', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: 'user1', email: 'test@test.com', passwordHash: 'hashed', isEmailVerified: false 
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      try {
        await authService.login({ email: 'test@test.com', password: 'pass' });
        fail('Should have thrown ApiError');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('EMAIL_NOT_VERIFIED');
        expect(err.data).toEqual({ userId: 'user1', email: 'test@test.com' });
      }
    });
  });

  describe('googleAuth', () => {
    let mockVerifyIdToken: jest.Mock;

    beforeEach(() => {
      mockVerifyIdToken = jest.fn();
      (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));
    });

    it('Branch: Google auth matching an existing user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'test@test.com', name: 'Test', picture: 'url', email_verified: true, sub: 'google123' })
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1', email: 'test@test.com', provider: 'google', googleId: 'google123'
      });

      const result = await authService.googleAuth('token');
      expect(result.user.id).toBe('user1');
      expect(prisma.user.update).not.toHaveBeenCalled(); // Already linked
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('Branch: Google auth triggering new user creation', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'new@test.com', name: 'New User', picture: 'url', email_verified: true, sub: 'google456' })
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user2', email: 'new@test.com', provider: 'google', isEmailVerified: true
      });

      const result = await authService.googleAuth('token');
      expect(result.user.id).toBe('user2');
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email: 'new@test.com', googleId: 'google456' })
      }));
    });
  });
});
