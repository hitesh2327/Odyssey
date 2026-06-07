import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

router.get('/', dashboardController.getOverview);
router.get('/history', dashboardController.getHistory);
router.get('/performance', dashboardController.getPerformanceByTopic);

export const dashboardRoutes = router;
