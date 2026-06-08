import { api } from './api';

export interface CreateSessionParams {
  topicIds: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface SessionData {
  sessionId: string;
  status: string;
  totalQuestions: number;
  currentQuestion?: number;
  currentQuestionOrder?: number;
}

export interface SessionProgress {
  answered: number;
  total: number;
  currentQuestion: number;
  status: string;
}

export interface SessionSummary {
  sessionId: string;
  status: string;
  evaluationStatus?: string;
  overallScore?: number | null;
  overallFeedback?: string | null;
  performanceLevel?: string;
  topic: string;
  difficulty: string;
  startedAt: string;
  completedAt: string;
  statistics: {
    totalQuestions: number;
    answeredQuestions: number;
    aiAssistUsed: number;
    completionPercentage: number;
    durationInMinutes: number;
  };
  topicsCovered?: string[];
  questions: {
    questionId: string;
    questionOrder: number;
    questionText: string;
    answer: string;
    usedAI: boolean;
    aiUsageCount: number;
    score?: number | null;
    feedback?: string | null;
    expectedConcepts?: string[];
    breakdown?: any | null;
    strengths?: string[];
    improvements?: string[];
  }[];
}

export class SessionsService {
  public async createSession(data: CreateSessionParams): Promise<SessionData> {
    const response = await api.post('/sessions', data);
    return response.data.data;
  }

  public async getSessionResume(sessionId: string): Promise<SessionData> {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data.data;
  }

  public async getSessionProgress(sessionId: string): Promise<SessionProgress> {
    const response = await api.get(`/sessions/${sessionId}/progress`);
    return response.data.data;
  }

  public async completeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/sessions/${sessionId}/complete`);
    return response.data;
  }

  public async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    const response = await api.get(`/sessions/${sessionId}/summary`);
    return response.data.data;
  }
}

export const sessionsService = new SessionsService();
