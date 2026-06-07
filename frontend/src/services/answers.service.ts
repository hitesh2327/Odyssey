import { api } from './api';

export interface SaveAnswerParams {
  sessionId: string;
  questionId: string;
  answerText: string;
}

export class AnswersService {
  public async saveAnswer(data: SaveAnswerParams): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/answers', data);
    return response.data;
  }
}

export const answersService = new AnswersService();
