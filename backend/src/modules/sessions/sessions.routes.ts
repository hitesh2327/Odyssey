import { Router } from 'express';
import { sessionsController } from './sessions.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSessionSchema, getSessionParamsSchema } from './sessions.validation';
import { EvaluationService } from '../evaluation/evaluation.service';

const router = Router();
const evaluationService = new EvaluationService();

router.post('/', authMiddleware, validate(createSessionSchema), sessionsController.createSession);
router.get(
  '/:sessionId',
  authMiddleware,
  validate(getSessionParamsSchema),
  sessionsController.getSessionById,
);
router.get('/:sessionId/regenerate-eval', async (req, res) => {
  try {
    await evaluationService.evaluateSessionBackground(req.params.sessionId);
    res.json({ success: true, message: 'Triggered' });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});
router.get(
  '/:sessionId/progress',
  authMiddleware,
  validate(getSessionParamsSchema),
  sessionsController.getSessionProgress,
);

export { router as sessionsRouter };
