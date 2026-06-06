import { Router } from 'express';
import { sessionsController } from './sessions.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSessionSchema, getSessionParamsSchema } from './sessions.validation';

const router = Router();

router.post('/', authMiddleware, validate(createSessionSchema), sessionsController.createSession);
router.get(
  '/:sessionId',
  authMiddleware,
  validate(getSessionParamsSchema),
  sessionsController.getSessionById,
);
router.get(
  '/:sessionId/progress',
  authMiddleware,
  validate(getSessionParamsSchema),
  sessionsController.getSessionProgress,
);

export { router as sessionsRouter };
