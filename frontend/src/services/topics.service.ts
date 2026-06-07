import { api } from './api';

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export class TopicsService {
  public async getTopics(search?: string): Promise<Topic[]> {
    const params = search ? { search } : undefined;
    const response = await api.get('/topics', { params });
    return response.data.data;
  }

  public async getTopicById(id: string): Promise<Topic> {
    const response = await api.get(`/topics/${id}`);
    return response.data.data;
  }
}

export const topicsService = new TopicsService();
