import { Request, Response, NextFunction } from 'express';
import { answersService } from './answers.service';

export class AnswersController {
  public submitAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { sessionId, questionId, answerText } = req.body;
      const result = await answersService.submitAnswer(userId, sessionId, questionId, answerText);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const answersController = new AnswersController();
