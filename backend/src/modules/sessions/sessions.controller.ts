import { Request, Response, NextFunction } from 'express';
import { sessionsService } from './sessions.service';

export class SessionsController {
  public createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { topicId, difficulty } = req.body;
      const result = await sessionsService.createSession(userId, topicId, difficulty);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const result = await sessionsService.getSessionById(sessionId, userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSessionProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const result = await sessionsService.getSessionProgress(sessionId, userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const sessionsController = new SessionsController();
