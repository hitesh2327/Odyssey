import { prisma } from './prisma';
import { redisService } from './redis';
import { logger } from './logger';

export async function isServerHealthy(): Promise<boolean> {
  try {
    // Check Database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    const client = redisService.getClient();
    if (!client) {
      return false;
    }
    await client.ping();

    return true;
  } catch (error) {
    logger.error('Health check failed in isServerHealthy:', error);
    return false;
  }
}
