export interface QuestionSummary {
  questionId: string;
  questionOrder: number;
  questionText: string;
  answer: string;
  usedAI: boolean;
  aiUsageCount: number;
}

export interface SessionSummaryResponse {
  sessionId: string;
  status: string;
  topic: string;
  difficulty: string;
  startedAt: Date | null;
  completedAt: Date | null;
  statistics: {
    totalQuestions: number;
    answeredQuestions: number;
    aiAssistUsed: number;
    completionPercentage: number;
    durationInMinutes: number | null;
  };
  questions: QuestionSummary[];
}
