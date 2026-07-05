import { api } from '../../helpers/request.helper';
import { cleanDb, assertCleanDb } from '../../helpers/db.helper';
import { plantOtp } from '../../helpers/otp.helper';
import { prisma } from '../../../src/lib/prisma';
import { emailService } from '../../../src/lib/email';

jest.mock('../../../src/lib/email', () => ({
  emailService: {
    sendOtpEmail: jest.fn(),
  },
}));

describe('Auth Lifecycle (Integration)', () => {
  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await cleanDb();
  });

  it('should successfully complete the register -> verify lifecycle', async () => {
    const email = 'lifecycle@test.com';

    // 1. Register
    const registerRes = await api.post('/api/v1/auth/register').send({
      name: 'Lifecycle User',
      email,
      password: 'Password123!',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.requiresVerification).toBe(true);
    expect(registerRes.body.userId).toBeDefined();

    const userId = registerRes.body.userId;

    // Verify DB state after register
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeDefined();
    expect(user?.isEmailVerified).toBe(false);

    // Verify email sending was mocked
    expect(emailService.sendOtpEmail).toHaveBeenCalled();

    // 2. Plant known OTP hash directly in DB so we know what to send
    const otpCode = await plantOtp('verify_email', userId, '123456');

    // 3. Verify Email
    const verifyRes = await api.post('/api/v1/auth/verify-email').send({
      userId,
      otp: otpCode,
    });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.user.isEmailVerified).toBe(true);

    // Auth cookie should be set after successful verify
    const cookies = verifyRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(
      Array.isArray(cookies)
        ? cookies.some((c: string) => c.startsWith('accessToken='))
        : (cookies as unknown as string).includes('accessToken='),
    ).toBe(true);

    // Verify DB state after verify
    const verifiedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(verifiedUser?.isEmailVerified).toBe(true);

    // Ensure OTP record was deleted
    const otpRecord = await prisma.otpRecord.findUnique({
      where: { identifier_type: { identifier: userId, type: 'verify_email' } },
    });
    expect(otpRecord).toBeNull();
  });
});
