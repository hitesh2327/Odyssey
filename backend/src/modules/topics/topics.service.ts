import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export class TopicsService {
  public async getAllTopics(search?: string) {
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return prisma.topic.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  public async getTopicById(id: string) {
    const topic = await prisma.topic.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!topic) {
      throw new ApiError(404, 'Invalid topic. Please select a valid topic.');
    }

    return topic;
  }
}

export const topicsService = new TopicsService();
