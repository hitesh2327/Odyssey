import { Difficulty, SessionStatus } from '@prisma/client';

export interface CreateSessionRequest {
  topicId: string;
  difficulty: Difficulty;
}

export interface CreateSessionResponseData {
  sessionId: string;
  status: SessionStatus;
  totalQuestions: number;
  currentQuestion: number;
}

export interface SessionProgressResponseData {
  answered: number;
  total: number;
  currentQuestion: number;
  status: SessionStatus;
}
