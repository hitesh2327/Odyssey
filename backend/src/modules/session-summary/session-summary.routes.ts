import { Router } from 'express';
import { sessionSummaryController } from './session-summary.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { sessionParamsSchema } from './session-summary.validation';

const router = Router();

router.post(
  '/:sessionId/complete',
  authMiddleware,
  validate(sessionParamsSchema),
  sessionSummaryController.completeSession,
);

router.get(
  '/:sessionId/summary',
  authMiddleware,
  validate(sessionParamsSchema),
  sessionSummaryController.getSessionSummary,
);

export { router as sessionSummaryRouter };
