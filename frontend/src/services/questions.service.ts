import { api } from './api';

export interface QuestionData {
  id: string;
  questionOrder: number;
  questionText: string;
  existingAnswer: string | null;
}

export interface AIAssistanceData {
  hint: string;
  guidance: string;
  suggestedApproach: string;
  relatedConcepts: string[];
  learningResources: string[];
}

export class QuestionsService {
  public async getQuestionByOrder(sessionId: string, order: number): Promise<QuestionData> {
    const response = await api.get(`/sessions/${sessionId}/questions/${order}`);
    return response.data.data;
  }

  public async askAIAssistance(questionId: string): Promise<AIAssistanceData> {
    const response = await api.post(`/questions/${questionId}/assist`);
    return response.data.data;
  }
}

export const questionsService = new QuestionsService();
