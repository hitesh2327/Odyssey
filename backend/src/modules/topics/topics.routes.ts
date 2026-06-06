import { Router } from 'express';
import { topicsController } from './topics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getTopicsSchema, getTopicByIdSchema } from './topics.validation';

const router = Router();

router.get('/', authMiddleware, validate(getTopicsSchema), topicsController.getAllTopics);
router.get('/:id', authMiddleware, validate(getTopicByIdSchema), topicsController.getTopicById);

export { router as topicsRouter };
