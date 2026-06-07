import { api } from '@/services/api';

export interface DashboardOverview {
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  averageScore: number;
  totalAiUsage: number;
  trend: Array<{
    sessionId: string;
    score: number;
    topic: string;
    date: string;
  }>;
  activeSessions: Array<{
    sessionId: string;
    topic: string;
    difficulty: string;
    progress: string;
    lastActive: string;
  }>;
}

export interface HistoryItem {
  sessionId: string;
  topic: string;
  difficulty: string;
  score: number | null;
  status: string;
  evaluationStatus: string;
  completedAt: string | null;
  createdAt: string;
  duration: number;
}

export interface DashboardHistory {
  items: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PerformanceTopic {
  name: string;
  averageScore: number;
  assessmentsCount: number;
}

export interface DashboardPerformance {
  topics: PerformanceTopic[];
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const { data } = await api.get<{ data: DashboardOverview }>('/dashboard');
    return data.data;
  },

  getHistory: async (page = 1, limit = 10): Promise<DashboardHistory> => {
    const { data } = await api.get<{ data: DashboardHistory }>('/dashboard/history', { params: { page, limit } });
    return data.data;
  },

  getPerformance: async (): Promise<DashboardPerformance> => {
    const { data } = await api.get<{ data: DashboardPerformance }>('/dashboard/performance');
    return data.data;
  },
};
