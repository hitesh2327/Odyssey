import { Router } from 'express';
import { questionsController } from './questions.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getQuestionByOrderSchema } from './questions.validation';

const router = Router({ mergeParams: true });

router.get(
  '/:order',
  authMiddleware,
  validate(getQuestionByOrderSchema),
  questionsController.getQuestionByOrder,
);

export { router as questionsRouter };
