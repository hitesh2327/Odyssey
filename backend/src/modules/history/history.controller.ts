import { Request, Response, NextFunction } from 'express';
import { historyService } from './history.service';

export class HistoryController {
  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      
      const filters = {
        topicId: req.query.topicId as string,
        difficulty: req.query.difficulty as string,
        status: req.query.status as string,
        performanceLevel: req.query.performanceLevel as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const history = await historyService.getHistory(userId, page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const historyController = new HistoryController();
