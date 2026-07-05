import { CacheService } from '../../../src/services/cache.service';
import { redisService } from '../../../src/lib/redis';
import { logger } from '../../../src/lib/logger';

jest.mock('../../../src/lib/redis', () => ({
  redisService: {
    getClient: jest.fn(),
  },
  redisMetrics: {
    cacheHits: 0,
    cacheMisses: 0,
    cacheErrors: 0,
  }
}));

jest.mock('../../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      sAdd: jest.fn(),
      sMembers: jest.fn(),
    };
    (redisService.getClient as jest.Mock).mockReturnValue(mockClient);
    cacheService = new CacheService();
  });

  describe('get', () => {
    it('should return null if client is not available', async () => {
      (redisService.getClient as jest.Mock).mockReturnValue(null);
      const result = await cacheService.get('testKey');
      expect(result).toBeNull();
    });

    it('should return parsed data on cache hit', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ data: 'test' }));
      const result = await cacheService.get('testKey');
      expect(result).toEqual({ data: 'test' });
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[CACHE_HIT]'));
    });

    it('should return null on cache miss', async () => {
      mockClient.get.mockResolvedValue(null);
      const result = await cacheService.get('testKey');
      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[CACHE_MISS]'));
    });

    it('should catch error and return null on Redis failure', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis Timeout'));
      const result = await cacheService.get('testKey');
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[CACHE_ERROR]'), expect.any(Error));
    });
  });

  describe('set', () => {
    it('should do nothing if client is not available', async () => {
      (redisService.getClient as jest.Mock).mockReturnValue(null);
      await cacheService.set('testKey', { data: 'test' }, 60);
      expect(mockClient.setEx).not.toHaveBeenCalled();
    });

    it('should set data with TTL and not track if userId is not provided', async () => {
      await cacheService.set('testKey', { data: 'test' }, 60);
      expect(mockClient.setEx).toHaveBeenCalledWith('testKey', 60, JSON.stringify({ data: 'test' }));
      expect(mockClient.sAdd).not.toHaveBeenCalled();
    });

    it('should set data and track key if userId is provided', async () => {
      await cacheService.set('testKey', { data: 'test' }, 60, 'user1');
      expect(mockClient.setEx).toHaveBeenCalledWith('testKey', 60, JSON.stringify({ data: 'test' }));
      expect(mockClient.sAdd).toHaveBeenCalledWith('odyssey:cachekeys:user:user1', 'testKey');
    });

    it('should catch error on set failure', async () => {
      mockClient.setEx.mockRejectedValue(new Error('Redis Error'));
      await cacheService.set('testKey', { data: 'test' }, 60);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[CACHE_ERROR]'), expect.any(Error));
    });

    it('should catch error if tracking fails', async () => {
      mockClient.sAdd.mockRejectedValue(new Error('Set Error'));
      await cacheService.set('testKey', { data: 'test' }, 60, 'user1');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[CACHE_ERROR] Failed to track key'), expect.any(Error));
    });
  });

  describe('delete', () => {
    it('should do nothing if client is not available', async () => {
      (redisService.getClient as jest.Mock).mockReturnValue(null);
      await cacheService.delete('testKey');
      expect(mockClient.del).not.toHaveBeenCalled();
    });

    it('should call del on client', async () => {
      await cacheService.delete('testKey');
      expect(mockClient.del).toHaveBeenCalledWith('testKey');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[CACHE_INVALIDATED] Deleted exact key'));
    });

    it('should catch error on delete failure', async () => {
      mockClient.del.mockRejectedValue(new Error('Del Error'));
      await cacheService.delete('testKey');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[CACHE_ERROR] Failed to delete testKey'), expect.any(Error));
    });
  });

  describe('invalidateUserCache', () => {
    it('should do nothing if client is not available', async () => {
      (redisService.getClient as jest.Mock).mockReturnValue(null);
      await cacheService.invalidateUserCache('user1');
      expect(mockClient.sMembers).not.toHaveBeenCalled();
    });

    it('should delete keys from set and the set itself', async () => {
      mockClient.sMembers.mockResolvedValue(['key1', 'key2']);
      await cacheService.invalidateUserCache('user1');
      expect(mockClient.del).toHaveBeenCalledWith(['key1', 'key2']);
      expect(mockClient.del).toHaveBeenCalledWith('odyssey:cachekeys:user:user1');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Deleted 2 keys for user user1'));
    });

    it('should only delete the set if no tracked keys exist', async () => {
      mockClient.sMembers.mockResolvedValue([]);
      await cacheService.invalidateUserCache('user1');
      expect(mockClient.del).toHaveBeenCalledWith('odyssey:cachekeys:user:user1');
      expect(mockClient.del).toHaveBeenCalledTimes(1);
    });

    it('should catch error on invalidation failure', async () => {
      mockClient.sMembers.mockRejectedValue(new Error('Set Error'));
      await cacheService.invalidateUserCache('user1');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[CACHE_ERROR] Failed to invalidate cache for user user1'), expect.any(Error));
    });
  });
});
