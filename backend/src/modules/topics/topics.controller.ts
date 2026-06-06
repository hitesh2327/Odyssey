import { Request, Response, NextFunction } from 'express';
import { topicsService } from './topics.service';

export class TopicsController {
  public getAllTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const topics = await topicsService.getAllTopics(search);
      res.status(200).json({
        success: true,
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTopicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const topic = await topicsService.getTopicById(id);
      res.status(200).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const topicsController = new TopicsController();
