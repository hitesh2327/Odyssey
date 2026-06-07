import { Request, Response, NextFunction } from 'express';
import { sessionSummaryService } from './session-summary.service';

export class SessionSummaryController {
  public async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      await sessionSummaryService.completeSession(userId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Assessment completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getSessionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      const summary = await sessionSummaryService.getSessionSummary(userId, sessionId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
  public async getEvaluationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      const status = await sessionSummaryService.getEvaluationStatus(userId, sessionId);

      res.status(200).json({
        success: true,
        data: { evaluationStatus: status },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sessionSummaryController = new SessionSummaryController();
