# Odyssey Backend Tests

Automated testing infrastructure using Jest, Supertest, and ts-jest.

## Prerequisites
- Node.js
- Local PostgreSQL instance (with a test database created: `odyssey_test`)
- Local Redis instance running on default port `6379`

## Environment Setup
Make sure `.env.test` exists in the `backend/` root directory. It should look like this:
```env
NODE_ENV=test
PORT=5001
DATABASE_URL=postgresql://odyssey_test:odyssey_test@localhost:5432/odyssey_test
JWT_SECRET=test_jwt_secret_minimum_8_chars_odyssey
REDIS_HOST=localhost
REDIS_PORT=6379
# ... other vars
```

## Running Tests

**Run everything (Full CI pipeline):**
```bash
./run-tests.sh
```

**Run one module/suite:**
```bash
npm run test:module -- auth/register
```

**Run a single specific test by name:**
```bash
npm test -- --testNamePattern "should register"
```

**Watch mode (re-runs on save):**
```bash
npm run test:watch
```

**Run with Coverage:**
```bash
npm run test:coverage
```
*Open `coverage/index.html` in your browser to view the interactive report.*

## Folder Structure
- `setup/`: Global Jest hooks and environment initialization.
- `helpers/`: DB cleaning, auth mocking, supertest wrappers.
- `factories/`: Test payload generators.
- `integration/`: End-to-end API route tests using Supertest.
- `unit/`: Isolated unit tests for libraries and middleware.

## Adding New Tests
1. Create a `.test.ts` file in the appropriate module folder under `integration/` or `unit/`.
2. Always import and call `cleanDb()` inside a `beforeEach()` hook to prevent test cross-contamination.
3. NEVER make real external API calls (e.g., SMTP, Groq). They are mocked globally in `setup/jest.setup.ts`.
