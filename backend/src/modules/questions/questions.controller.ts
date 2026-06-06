import { Request, Response, NextFunction } from 'express';
import { questionsService } from './questions.service';

export class QuestionsController {
  public getQuestionByOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const order = req.params.order as unknown as number; // Already parsed to number by Zod

      const question = await questionsService.getQuestionByOrder(sessionId, userId, order);

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const questionsController = new QuestionsController();
