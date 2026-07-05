import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/lib/prisma';
import { config } from '../../src/config';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
}

// Creates a verified user + returns auth token
// Use this for all tests that need an authenticated user
export async function createVerifiedUser(overrides: Partial<{
  name: string; email: string; password: string;
}> = {}): Promise<TestUser> {
  const password = overrides.password ?? 'TestPass123!';
  const email = overrides.email ?? `test_${Date.now()}@odyssey.test`;
  const name = overrides.name ?? 'Test User';
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, isEmailVerified: true }
  });
  const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '1d' });
  return { id: user.id, name, email, password, token };
}

// Creates an unverified user (for OTP flow tests)
export async function createUnverifiedUser(overrides = {}) {
  const user = await createVerifiedUser(overrides);
  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: false }
  });
  return user;
}

export function makeAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
