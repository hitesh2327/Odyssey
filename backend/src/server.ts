import app from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection pool disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error disconnecting database connection pool:', err);
      process.exit(1);
    }
  });
};

// Handle process termination events
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
