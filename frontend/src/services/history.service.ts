import { api } from './api';

export interface HistoryFilters {
  topicId?: string;
  difficulty?: string;
  status?: string;
  performanceLevel?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryItem {
  sessionId: string;
  topic: string;
  difficulty: string;
  score: number | null;
  status: string;
  evaluationStatus: string;
  performanceLevel: string;
  completedAt: string | null;
  createdAt: string;
  duration: number;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getHistory = async (page = 1, limit = 10, filters: HistoryFilters = {}): Promise<HistoryResponse> => {
  const params: any = { page, limit };
  if (filters.topicId) params.topicId = filters.topicId;
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.status) params.status = filters.status;
  if (filters.performanceLevel) params.performanceLevel = filters.performanceLevel;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const { data } = await api.get<{ data: HistoryResponse }>('/history', { params });
  return data.data;
};
