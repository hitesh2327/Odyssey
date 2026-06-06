import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { topicsRouter } from '../modules/topics/topics.routes';
import { sessionsRouter } from '../modules/sessions/sessions.routes';
import { questionsRouter } from '../modules/questions/questions.routes';
import { answersRouter } from '../modules/answers/answers.routes';
import { aiAssistanceRouter } from '../modules/ai-assistance/ai-assistance.routes';
import { sessionSummaryRouter } from '../modules/session-summary/session-summary.routes';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
  });
});

// Mount module routes
router.use('/auth', authRouter);
router.use('/topics', topicsRouter);
router.use('/sessions', sessionsRouter);
router.use('/sessions/:sessionId/questions', questionsRouter);
router.use('/answers', answersRouter);
router.use('/questions', aiAssistanceRouter);
router.use('/sessions', sessionSummaryRouter);

export default router;
