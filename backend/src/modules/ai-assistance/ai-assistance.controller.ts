import { Request, Response, NextFunction } from 'express';
import { aiAssistanceService } from './ai-assistance.service';

export class AIAssistanceController {


  public streamAssistance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { questionId } = req.params;

      // Ensure headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      await aiAssistanceService.streamAssistance(userId, questionId, res);
    } catch (error: any) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
        res.end();
      }
    }
  };
}

export const aiAssistanceController = new AIAssistanceController();
