import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from './logger';

export const redisMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  cacheErrors: 0,
};

class RedisService {
  public client: RedisClientType | null = null;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const url = `redis://${config.REDIS_HOST || 'localhost'}:${config.REDIS_PORT || 6379}`;
      this.client = createClient({ url });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        redisMetrics.cacheErrors++;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
      });

      this.client.on('reconnecting', () => {
        logger.info('Reconnecting to Redis...');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis connection', error);
      this.client = null;
    } finally {
      this.isConnecting = false;
    }
  }

  public getClient(): RedisClientType | null {
    if (this.client && this.client.isOpen) {
      return this.client;
    }
    return null;
  }
}

export const redisService = new RedisService();
