import { prisma } from '../lib/prisma';
import { ChatMessage } from '../interfaces/chat-message.interface';
import { ChatRole } from '@prisma/client';

export class ChatMemoryService {
  private memory = new Map<string, ChatMessage[]>();

  /**
   * First checks Map.
   * If not found, loads from Postgres and populates Map.
   */
  public async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const cachedMessages = this.memory.get(sessionId);

    if (cachedMessages) {
      return cachedMessages;
    }

    const interactions = await prisma.aIInteraction.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const messages: ChatMessage[] = interactions.map((interaction) => ({
      role: interaction.role.toLowerCase() as 'system' | 'user' | 'assistant',
      content: interaction.content,
    }));

    this.memory.set(sessionId, messages);

    return messages;
  }

  /**
   * Adds message to both Postgres and Map.
   */
  public async addMessage(
    sessionId: string,
    message: ChatMessage,
    tokensUsed?: number,
  ): Promise<void> {
    await prisma.aIInteraction.create({
      data: {
        sessionId,
        role: message.role.toUpperCase() as ChatRole,
        content: message.content,
        tokensUsed,
      },
    });

    const messages = this.memory.get(sessionId) || [];

    messages.push(message);

    this.memory.set(sessionId, messages);
  }

  public clear(sessionId: string): void {
    this.memory.delete(sessionId);
  }

  /**
   * Useful after server restart or redis implementation.
   */
  public async refresh(sessionId: string): Promise<void> {
    this.memory.delete(sessionId);

    await this.getMessages(sessionId);
  }
}

export const chatMemoryService = new ChatMemoryService();
