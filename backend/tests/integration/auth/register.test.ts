import { api } from '../../helpers/request.helper';
import { cleanDb } from '../../helpers/db.helper';
import { userFactory } from '../../factories/user.factory';
import { prisma } from '../../../src/lib/prisma';
import { emailService } from '../../../src/lib/email';

describe('Auth Module - Register', () => {
  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a valid user', async () => {
      const payload = userFactory.validRegister();
      const res = await api.post('/api/v1/auth/register').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.userId).toBeDefined();

      // Ensure OtpRecord row created
      const otp = await prisma.otpRecord.findUnique({
        where: { identifier_type: { identifier: res.body.userId, type: 'verify_email' } }
      });
      expect(otp).toBeDefined();

      // Ensure email was sent
      expect(emailService.sendOtpEmail).toHaveBeenCalled();
    });

    it('should reject registration if email is already in use', async () => {
      const payload = userFactory.validRegister();
      await api.post('/api/v1/auth/register').send(payload);

      const res2 = await api.post('/api/v1/auth/register').send(payload);
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/already in use/i);
    });

    it('should reject registration if password is under 8 chars', async () => {
      const payload = userFactory.withWeakPassword();
      const res = await api.post('/api/v1/auth/register').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 8 characters/i);
    });
  });
});
