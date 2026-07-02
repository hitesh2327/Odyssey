import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redisService, redisMetrics } from '../lib/redis';
import { authRouter } from '../modules/auth/auth.routes';
import { topicsRouter } from '../modules/topics/topics.routes';
import { sessionsRouter } from '../modules/sessions/sessions.routes';
import { questionsRouter } from '../modules/questions/questions.routes';
import { answersRouter } from '../modules/answers/answers.routes';
import { aiAssistanceRouter } from '../modules/ai-assistance/ai-assistance.routes';
import { sessionSummaryRouter } from '../modules/session-summary/session-summary.routes';
import { historyRouter } from '../modules/history/history.routes';

import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { profileRouter } from '../modules/profile/profile.routes';

const router = Router();

// Enhanced Health Check Endpoint
router.get('/health', async (_req, res) => {
  let dbStatus = 'UP';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'DOWN';
  }

  const client = redisService.getClient();
  let redisStatus = 'UP';
  try {
    if (client) {
      await client.ping();
    } else {
      redisStatus = 'DOWN';
    }
  } catch (error) {
    redisStatus = 'DOWN';
  }

  res.status(200).json({
    status: 'UP',
    database: dbStatus,
    redis: redisStatus,
    cacheHits: redisMetrics.cacheHits,
    cacheMisses: redisMetrics.cacheMisses,
    cacheErrors: redisMetrics.cacheErrors,
  });
});

// Mount module routes
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRoutes);
router.use('/topics', topicsRouter);
router.use('/sessions', sessionsRouter);
router.use('/sessions/:sessionId/questions', questionsRouter);
router.use('/answers', answersRouter);
router.use('/questions', aiAssistanceRouter);
router.use('/sessions', sessionSummaryRouter);
router.use('/history', historyRouter);
router.use('/profile', profileRouter);

export default router;
