import { api } from '../../helpers/request.helper';
import { cleanDb } from '../../helpers/db.helper';
import { createVerifiedUser, createUnverifiedUser } from '../../helpers/auth.helper';
import { prisma } from '../../../src/lib/prisma';

describe('Auth Module - Login', () => {
  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully for verified user', async () => {
      const user = await createVerifiedUser({ password: 'TestPass123!' });
      const res = await api.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'TestPass123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toMatch(/accessToken=/);
      expect(res.body.user.isEmailVerified).toBe(true);
    });

    it('should reject login for unverified user with 403 EMAIL_NOT_VERIFIED', async () => {
      const user = await createUnverifiedUser({ password: 'TestPass123!' });
      const res = await api.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'TestPass123!'
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should reject login with wrong password', async () => {
      const user = await createVerifiedUser({ password: 'TestPass123!' });
      const res = await api.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'wrongpassword'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should block local login if no password is set (Google account)', async () => {
      const user = await createVerifiedUser();
      // Remove passwordHash simulating a Google-only account
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: null, provider: 'google' }
      });

      const res = await api.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'TestPass123!'
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Please continue with Google/i);
    });
  });
});
