import OpenAI from 'openai';
import { config } from '../config';
import { logger } from './logger';

if (!config.OPENAI_API_KEY) {
  logger.warn('⚠️ OPENAI_API_KEY environment variable is not defined. OpenAI operations will fail at runtime.');
}

export const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY || 'dummy_key',
});
