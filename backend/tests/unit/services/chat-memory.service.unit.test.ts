import { ChatMemoryService } from '../../../src/services/chat-memory.service';
import { prisma } from '../../../src/lib/prisma';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    aIInteraction: {
      findMany: jest.fn(),
      create: jest.fn(),
    }
  }
}));

describe('ChatMemoryService', () => {
  let chatMemoryService: ChatMemoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    chatMemoryService = new ChatMemoryService();
  });

  describe('getMessages', () => {
    it('should load messages from DB on first call and store in memory Map', async () => {
      (prisma.aIInteraction.findMany as jest.Mock).mockResolvedValue([
        { role: 'SYSTEM', content: 'hello' },
        { role: 'USER', content: 'hi' }
      ]);

      const messages = await chatMemoryService.getMessages('session1');
      
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session1' },
        orderBy: { createdAt: 'asc' }
      });
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'system', content: 'hello' });
      expect(messages[1]).toEqual({ role: 'user', content: 'hi' });
    });

    it('should return cached messages from memory Map on subsequent calls', async () => {
      (prisma.aIInteraction.findMany as jest.Mock).mockResolvedValue([
        { role: 'SYSTEM', content: 'hello' }
      ]);

      await chatMemoryService.getMessages('session2'); // Loads from DB
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledTimes(1);

      const messages = await chatMemoryService.getMessages('session2'); // Returns from Map
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledTimes(1); // No new DB call
      expect(messages).toHaveLength(1);
    });
  });

  describe('addMessage', () => {
    it('should add message to DB and push to Map', async () => {
      // First populate the Map to ensure push works correctly
      (prisma.aIInteraction.findMany as jest.Mock).mockResolvedValue([{ role: 'SYSTEM', content: 'hello' }]);
      await chatMemoryService.getMessages('session3');

      await chatMemoryService.addMessage('session3', { role: 'user', content: 'my message' }, 100);

      expect(prisma.aIInteraction.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session3',
          role: 'USER',
          content: 'my message',
          tokensUsed: 100
        }
      });

      const messages = await chatMemoryService.getMessages('session3');
      expect(messages).toHaveLength(2); // The DB one + the pushed one
      expect(messages[1]).toEqual({ role: 'user', content: 'my message' });
    });

    it('should initialize empty array in Map if it did not exist', async () => {
      await chatMemoryService.addMessage('session4', { role: 'assistant', content: 'test' });
      
      const messages = await chatMemoryService.getMessages('session4');
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(prisma.aIInteraction.findMany).not.toHaveBeenCalled(); // Should not need DB because Map is populated now
    });
  });

  describe('clear', () => {
    it('should remove session from Map', async () => {
      (prisma.aIInteraction.findMany as jest.Mock).mockResolvedValue([{ role: 'SYSTEM', content: 'test' }]);
      await chatMemoryService.getMessages('session5'); // Populates Map

      chatMemoryService.clear('session5');

      await chatMemoryService.getMessages('session5'); // Should hit DB again
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('should delete from Map and reload from DB', async () => {
      (prisma.aIInteraction.findMany as jest.Mock).mockResolvedValue([{ role: 'SYSTEM', content: 'test' }]);
      
      await chatMemoryService.refresh('session6');
      expect(prisma.aIInteraction.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
