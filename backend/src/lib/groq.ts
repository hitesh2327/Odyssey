import Groq from 'groq-sdk';
import { config } from '../config';
import { logger } from './logger';

if (!config.GROQ_API_KEY) {
  logger.warn('⚠️ GROQ_API_KEY environment variable is not defined. Groq operations will fail at runtime.');
}

export const groq = new Groq({
  apiKey: config.GROQ_API_KEY || 'dummy_key',
});
