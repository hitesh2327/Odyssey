import { Router } from 'express';
import { answersController } from './answers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { submitAnswerSchema } from './answers.validation';

const router = Router();

router.post('/', authMiddleware, validate(submitAnswerSchema), answersController.submitAnswer);

export { router as answersRouter };
