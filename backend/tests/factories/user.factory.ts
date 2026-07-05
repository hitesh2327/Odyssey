export const userFactory = {
  validRegister: (n = Date.now()) => ({
    name: `Test User ${n}`,
    email: `user_${n}@odyssey.test`,
    password: 'TestPass123!',
  }),
  withWeakPassword: () => ({ ...userFactory.validRegister(), password: 'short' }),
  withInvalidEmail: () => ({ ...userFactory.validRegister(), email: 'not-an-email' }),
  withMissingName: () => ({ email: `u_${Date.now()}@odyssey.test`, password: 'TestPass123!' }),
};
