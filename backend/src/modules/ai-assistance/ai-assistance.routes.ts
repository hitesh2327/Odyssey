import { Router } from 'express';
import { aiAssistanceController } from './ai-assistance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getAssistSchema } from './ai-assistance.validation';

const router = Router();

router.post(
  '/:questionId/assist',
  authMiddleware,
  validate(getAssistSchema),
  aiAssistanceController.requestAssistance,
);

router.get(
  '/:questionId/assist/stream',
  authMiddleware,
  validate(getAssistSchema),
  aiAssistanceController.streamAssistance,
);

export { router as aiAssistanceRouter };
