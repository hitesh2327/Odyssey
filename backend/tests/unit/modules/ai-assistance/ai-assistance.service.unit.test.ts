import { aiAssistanceService } from '../../../../src/modules/ai-assistance/ai-assistance.service';
import { prisma } from '../../../../src/lib/prisma';
import { groq } from '../../../../src/lib/groq';
import { chatMemoryService } from '../../../../src/services/chat-memory.service';
import { config } from '../../../../src/config';

jest.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    question: { findUnique: jest.fn() },
    assessmentSession: { findUnique: jest.fn() },
    aIAssistance: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('../../../../src/services/chat-memory.service', () => ({
  chatMemoryService: {
    getMessages: jest.fn(),
    addMessage: jest.fn(),
  },
}));

jest.mock('../../../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AIAssistanceService', () => {
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    config.GROQ_API_KEY = 'real-key';

    mockRes = {
      write: jest.fn(),
      end: jest.fn(),
    };
  });

  afterEach(() => {
    config.GROQ_API_KEY = 'test_key';
  });

  describe('streamAssistance', () => {
    it('should throw 404 if question is not found', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(aiAssistanceService.streamAssistance('user1', 'q1', mockRes)).rejects.toThrow('Question not found');
    });

    it('should write error and end if assistance was already used', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', topic: { name: 'React' } });
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS' });
      (prisma.aIAssistance.findUnique as jest.Mock).mockResolvedValue({ id: 'usage1' });

      await aiAssistanceService.streamAssistance('user1', 'q1', mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('already used'));
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should write error and end if GROQ_API_KEY is missing', async () => {
      config.GROQ_API_KEY = '';
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', topic: { name: 'React' } });
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS' });
      (prisma.aIAssistance.findUnique as jest.Mock).mockResolvedValue(null);

      await aiAssistanceService.streamAssistance('user1', 'q1', mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('temporarily unavailable'));
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should stream successfully and save to DB', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', text: 'Q text', difficulty: 'Medium', topic: { name: 'React' } });
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS' });
      (prisma.aIAssistance.findUnique as jest.Mock).mockResolvedValue(null);

      (chatMemoryService.getMessages as jest.Mock).mockResolvedValue([{ role: 'system', content: 'hello' }]);

      // Create an async generator to mock the stream
      async function* mockStream() {
        yield { choices: [{ delta: { content: 'chunk1' } }] };
        yield { choices: [{ delta: { content: 'chunk2' } }] };
      }

      (groq.chat.completions.create as jest.Mock).mockResolvedValue(mockStream());

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = { aIAssistance: { create: jest.fn() } };
        await cb(tx);
        expect(tx.aIAssistance.create).toHaveBeenCalled();
      });

      await aiAssistanceService.streamAssistance('user1', 'q1', mockRes);

      // Verify streamed chunks
      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ text: 'chunk1' })}\n\n`);
      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ text: 'chunk2' })}\n\n`);
      expect(mockRes.write).toHaveBeenCalledWith('event: end\ndata: {}\n\n');
      expect(mockRes.end).toHaveBeenCalled();

      // Verify DB / Memory saving
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(chatMemoryService.addMessage).toHaveBeenCalledTimes(2); // one for user prompt, one for assistant
    });

    it('should catch error during streaming and write error', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', sessionId: 'sess1', text: 'Q text', difficulty: 'Medium', topic: { name: 'React' } });
      (prisma.assessmentSession.findUnique as jest.Mock).mockResolvedValue({ id: 'sess1', userId: 'user1', status: 'IN_PROGRESS' });
      (prisma.aIAssistance.findUnique as jest.Mock).mockResolvedValue(null);
      (chatMemoryService.getMessages as jest.Mock).mockResolvedValue([]);

      (groq.chat.completions.create as jest.Mock).mockRejectedValue(new Error('Network Error'));

      await aiAssistanceService.streamAssistance('user1', 'q1', mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('Stream disconnected unexpectedly'));
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
});
