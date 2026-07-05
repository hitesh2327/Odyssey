import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });
process.env.NODE_ENV = 'test';

import { logger } from '../../src/lib/logger';

beforeEach(() => {
  jest.spyOn(logger, 'error').mockImplementation();
});

// Mock nodemailer / email — never send real emails in tests
jest.mock('../../src/lib/email', () => ({
  emailService: {
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Groq — never call real AI in tests
jest.mock('../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({
            questions: [
              { order: 1, question: 'What is a primary key?' },
              { order: 2, question: 'Explain indexing.' },
              { order: 3, question: 'What is normalization?' },
              { order: 4, question: 'What is a join?' },
              { order: 5, question: 'What is a transaction?' },
            ]
          })}}]
        })
      }
    }
  }
}));

// Mock pdf-parse and mammoth for resume tests
jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({
  text: 'John Doe\nSoftware Engineer\nPostgreSQL, Docker, AWS\n3 years experience'
}));
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'John Doe\nSoftware Engineer\nPostgreSQL, Docker, AWS\n3 years experience'
  })
}));

afterEach(async () => {
  jest.clearAllMocks();
});
