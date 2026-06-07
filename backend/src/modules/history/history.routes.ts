import { Router } from 'express';
import { historyController } from './history.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, historyController.getHistory);

export { router as historyRouter };
