import { api } from './api';

export interface QuestionData {
  id: string;
  questionOrder: number;
  questionText: string;
  existingAnswer: string | null;
  topic?: string;
  difficulty?: string;
}



export class QuestionsService {
  public async getQuestionByOrder(sessionId: string, order: number): Promise<QuestionData> {
    const response = await api.get(`/sessions/${sessionId}/questions/${order}`);
    return response.data.data;
  }


}

export const questionsService = new QuestionsService();
