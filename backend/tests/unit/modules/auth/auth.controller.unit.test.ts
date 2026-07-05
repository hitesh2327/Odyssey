import { authController } from '../../../../src/modules/auth/auth.controller';
import { authService } from '../../../../src/modules/auth/auth.service';
import { prisma } from '../../../../src/lib/prisma';
import bcrypt from 'bcrypt';
import * as otpLib from '../../../../src/lib/otp';

jest.mock('../../../../src/modules/auth/auth.service', () => ({
  authService: {
    register: jest.fn(),
    generateToken: jest.fn().mockReturnValue('mock-token'),
  }
}));

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    }
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('../../../../src/lib/otp', () => ({
  getOtpRecord: jest.fn(),
  verifyOtp: jest.fn(),
  clearOtp: jest.fn(),
}));

describe('AuthController', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      user: { id: 'user1', email: 'old@test.com' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('Branch: register() returns requiresVerification: true and does NOT set an auth cookie', async () => {
      mockReq.body = { name: 'test', email: 't@t.com', password: 'pass' };
      (authService.register as jest.Mock).mockResolvedValue({
        userId: 'user1',
        email: 't@t.com',
        requiresVerification: true,
        nextResendAllowedAt: new Date()
      });

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        requiresVerification: true,
      }));
      expect(mockRes.cookie).not.toHaveBeenCalled(); // No cookie set
    });
  });

  describe('changeEmailVerify', () => {
    it('Branch: changeEmailVerify() reads newEmail from OTP record before deleting it and updates user row', async () => {
      mockReq.body = { otp: '123456' };
      
      // Mock OTP record returning a newEmail
      (otpLib.getOtpRecord as jest.Mock).mockResolvedValue({ newEmail: 'new@test.com' });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user1', email: 'new@test.com' });

      await authController.changeEmailVerify(mockReq, mockRes, mockNext);

      expect(otpLib.getOtpRecord).toHaveBeenCalledWith('change_email', 'user1');
      expect(otpLib.verifyOtp).toHaveBeenCalledWith('change_email', 'user1', '123456');
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { email: 'new@test.com', isEmailVerified: true }
      });

      expect(otpLib.clearOtp).toHaveBeenCalledWith('change_email', 'user1');
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe('resetPasswordVerify', () => {
    it('Branch: resetPasswordVerify() updates passwordHash and then clears OtpRecord and OtpLock', async () => {
      mockReq.body = { email: 'test@test.com', otp: '123456', password: 'newpass' };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpass');

      await authController.resetPasswordVerify(mockReq, mockRes, mockNext);

      expect(otpLib.verifyOtp).toHaveBeenCalledWith('reset_password', 'test@test.com', '123456');
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { passwordHash: 'newhashedpass', isEmailVerified: true }
      });

      expect(otpLib.clearOtp).toHaveBeenCalledWith('reset_password', 'test@test.com');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
