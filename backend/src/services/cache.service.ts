import { redisService, redisMetrics } from '../lib/redis';
import { logger } from '../lib/logger';

export class CacheService {
  private get client() {
    return redisService.getClient();
  }

  /**
   * Generates the cache key for a user tracking Set.
   */
  private getUserSetKey(userId: string): string {
    return `odyssey:cachekeys:user:${userId}`;
  }

  /**
   * Store a key in the user's Set for deterministic invalidation.
   */
  private async trackKeyForUser(key: string, userId?: string) {
    if (!this.client || !userId) return;
    try {
      await this.client.sAdd(this.getUserSetKey(userId), key);
    } catch (error) {
      logger.error(`[CACHE_ERROR] Failed to track key ${key} for user ${userId}`, error);
    }
  }

  /**
   * Retrieves an item from the cache.
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const data = await this.client.get(key);
      if (data) {
        redisMetrics.cacheHits++;
        logger.info(`[CACHE_HIT] ${key}`);
        return JSON.parse(data) as T;
      } else {
        redisMetrics.cacheMisses++;
        logger.info(`[CACHE_MISS] ${key}`);
        return null;
      }
    } catch (error) {
      redisMetrics.cacheErrors++;
      logger.error(`[CACHE_ERROR] Failed to get ${key}`, error);
      return null;
    }
  }

  /**
   * Sets an item in the cache, tracking it in the user's Set if userId is provided.
   */
  public async set(key: string, value: any, ttlSeconds: number, userId?: string): Promise<void> {
    if (!this.client) return;

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedValue);
      logger.info(`[CACHE_SET] ${key}`);

      if (userId) {
        await this.trackKeyForUser(key, userId);
      }
    } catch (error) {
      redisMetrics.cacheErrors++;
      logger.error(`[CACHE_ERROR] Failed to set ${key}`, error);
    }
  }

  /**
   * Deterministically deletes a specific key.
   */
  public async delete(key: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.del(key);
      logger.info(`[CACHE_INVALIDATED] Deleted exact key ${key}`);
    } catch (error) {
      redisMetrics.cacheErrors++;
      logger.error(`[CACHE_ERROR] Failed to delete ${key}`, error);
    }
  }

  /**
   * Deterministically invalidates all tracked keys for a user.
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    if (!this.client) return;

    const setKey = this.getUserSetKey(userId);
    try {
      const keys = await this.client.sMembers(setKey);
      if (keys && keys.length > 0) {
        await this.client.del(keys);
        logger.info(`[CACHE_INVALIDATED] Deleted ${keys.length} keys for user ${userId}`);
      }
      await this.client.del(setKey);
    } catch (error) {
      redisMetrics.cacheErrors++;
      logger.error(`[CACHE_ERROR] Failed to invalidate cache for user ${userId}`, error);
    }
  }
}

export const cacheService = new CacheService();
