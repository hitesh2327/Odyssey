import { Request, Response, NextFunction } from 'express';
import { aiAssistanceService } from './ai-assistance.service';

export class AIAssistanceController {
  public requestAssistance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { questionId } = req.params;

      const result = await aiAssistanceService.requestAssistance(userId, questionId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const aiAssistanceController = new AIAssistanceController();
