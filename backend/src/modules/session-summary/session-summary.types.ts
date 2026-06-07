export interface QuestionSummary {
  questionId: string;
  questionOrder: number;
  questionText: string;
  answer: string;
  usedAI: boolean;
  aiUsageCount: number;
  score: number | null;
  feedback: string | null;
  expectedConcepts: string[];
  breakdown: any | null;
  strengths: string[];
  improvements: string[];
}

export interface SessionSummaryResponse {
  sessionId: string;
  status: string;
  evaluationStatus: string;
  overallScore: number | null;
  overallFeedback: string | null;
  performanceLevel: string;
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
