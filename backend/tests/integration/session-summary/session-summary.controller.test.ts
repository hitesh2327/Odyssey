import { api } from '../../helpers/request.helper';
import { prisma } from '../../../src/lib/prisma';
import { cleanDb, assertCleanDb, seedTestTopics } from '../../helpers/db.helper';
import { createVerifiedUser } from '../../helpers/auth.helper';

jest.mock('../../../src/modules/evaluation/evaluation.service', () => {
  const evaluateSessionBackground = jest.fn().mockResolvedValue(undefined);
  return {
    evaluationService: { evaluateSessionBackground },
    EvaluationService: class { evaluateSessionBackground = evaluateSessionBackground; }
  };
});

jest.mock('../../../src/modules/profile/waypoints.service', () => ({
  waypointsService: {
    checkAndUnlock: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Session Summary Controller (Integration)', () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let topicId: string;
  let sessionId: string;
  let completedSessionId: string;

  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
    await seedTestTopics();

    const user1 = await createVerifiedUser({ email: `user1_${Date.now()}@test.com` });
    userToken = user1.token;
    userId = user1.id;

    const user2 = await createVerifiedUser({ email: `user2_${Date.now()}@test.com` });
    otherUserToken = user2.token;

    const topic = await prisma.topic.findFirst();
    topicId = topic!.id;

    // Create an in-progress session
    const session = await prisma.assessmentSession.create({
      data: {
        userId: user1.id,
        topicId,
        difficulty: 'INTERMEDIATE',
        totalQuestions: 2,
        status: 'IN_PROGRESS',
      }
    });
    sessionId = session.id;
    
    // Create answers so it can be completed
    const q1 = await prisma.question.create({
      data: {
        sessionId: session.id,
        topicId,
        difficulty: 'INTERMEDIATE',
        questionOrder: 1,
        text: 'Q1'
      }
    });
    const q2 = await prisma.question.create({
      data: {
        sessionId: session.id,
        topicId,
        difficulty: 'INTERMEDIATE',
        questionOrder: 2,
        text: 'Q2'
      }
    });

    await prisma.answer.create({
      data: {
        sessionId: session.id,
        questionId: q1.id,
        userResponse: 'A1'
      }
    });
    await prisma.answer.create({
      data: {
        sessionId: session.id,
        questionId: q2.id,
        userResponse: 'A2'
      }
    });

    // Create a completed session
    const completedSession = await prisma.assessmentSession.create({
      data: {
        userId: user1.id,
        topicId,
        difficulty: 'INTERMEDIATE',
        totalQuestions: 1,
        status: 'COMPLETED',
        evaluationStatus: 'COMPLETED',
        score: 85,
        feedback: 'Good job'
      }
    });
    completedSessionId = completedSession.id;
    const cq1 = await prisma.question.create({
      data: {
        sessionId: completedSessionId,
        topicId,
        difficulty: 'INTERMEDIATE',
        questionOrder: 1,
        text: 'CQ1',
      }
    });
    await prisma.answer.create({
      data: {
        sessionId: completedSessionId,
        questionId: cq1.id,
        userResponse: 'CA1',
        score: 85,
        feedback: 'Nice',
        expectedConcepts: ['Concept1']
      }
    });
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await cleanDb();
  });

  describe('POST /api/v1/sessions/:sessionId/complete', () => {
    it('should return 200 for a valid session belonging to the user', async () => {
      const res = await api
        .post(`/api/v1/sessions/${sessionId}/complete`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({});
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Assessment completed successfully');
    });

    it('should return 403 (or 404 depending on service logic) for a session belonging to a different user', async () => {
      const res = await api
        .post(`/api/v1/sessions/${sessionId}/complete`)
        .set('Cookie', [`accessToken=${otherUserToken}`])
        .send({});
      
      // The service throws 403 'Access denied' when session.userId !== userId
      expect(res.status).toBe(403);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 for a non-existent sessionId', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await api
        .post(`/api/v1/sessions/${nonExistentId}/complete`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({});
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for an invalid UUID', async () => {
      const res = await api
        .post(`/api/v1/sessions/invalid-uuid/complete`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/sessions/:sessionId/summary', () => {
    it('should return 200 with summary data for a valid completed session', async () => {
      const res = await api
        .get(`/api/v1/sessions/${completedSessionId}/summary`)
        .set('Cookie', [`accessToken=${userToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(85);
      expect(res.body.data.overallFeedback).toBe('Good job');
      expect(res.body.data.questions).toHaveLength(1);
    });

    it('should return 400 for an in-progress session', async () => {
      const res = await api
        .get(`/api/v1/sessions/${sessionId}/summary`)
        .set('Cookie', [`accessToken=${userToken}`]);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Assessment is not completed yet.');
    });

    it('should return 403 (or 404) for a session belonging to a different user', async () => {
      const res = await api
        .get(`/api/v1/sessions/${completedSessionId}/summary`)
        .set('Cookie', [`accessToken=${otherUserToken}`]);
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/sessions/:sessionId/evaluation-status', () => {
    it('should return 200 with evaluationStatus field for a valid session', async () => {
      const res = await api
        .get(`/api/v1/sessions/${completedSessionId}/evaluation-status`)
        .set('Cookie', [`accessToken=${userToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evaluationStatus).toBe('COMPLETED');
    });

    it('should return 403 for a session belonging to a different user', async () => {
      const res = await api
        .get(`/api/v1/sessions/${completedSessionId}/evaluation-status`)
        .set('Cookie', [`accessToken=${otherUserToken}`]);
      
      expect(res.status).toBe(403);
    });
  });
});
