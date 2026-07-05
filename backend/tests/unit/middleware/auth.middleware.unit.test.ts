import { authMiddleware } from '../../../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../src/lib/prisma';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Auth Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided in cookies or headers', async () => {
    await authMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    expect(mockNext.mock.calls[0][0].message).toBe('Authorization token required');
  });

  it('should return 401 if JWT is invalid', async () => {
    mockReq.cookies = { accessToken: 'invalid-token' };
    await authMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should call next() and attach user to req if token is valid and user exists', async () => {
    const validToken = jwt.sign({ userId: 'user-id-123' }, process.env.JWT_SECRET || 'test_jwt_secret_minimum_8_chars_odyssey');
    mockReq.cookies = { accessToken: validToken };
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      email: 'test@example.com',
    });

    await authMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.id).toBe('user-id-123');
  });
});
