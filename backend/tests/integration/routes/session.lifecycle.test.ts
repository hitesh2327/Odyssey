import { api } from '../../helpers/request.helper';
import { cleanDb, seedTestTopics, assertCleanDb } from '../../helpers/db.helper';
import { createVerifiedUser } from '../../helpers/auth.helper';
import { prisma } from '../../../src/lib/prisma';
import { groq } from '../../../src/lib/groq';
import { evaluationService } from '../../../src/modules/evaluation/evaluation.service';

jest.mock('../../../src/modules/profile/waypoints.service', () => ({
  waypointsService: {
    checkAndUnlock: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      }
    }
  }
}));

describe('Session Lifecycle (Integration)', () => {
  let userToken: string;

  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
    await seedTestTopics();
    const user = await createVerifiedUser();
    userToken = user.token;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await cleanDb();
  });

  it('should successfully complete the Session lifecycle: create -> answer -> complete -> summary', async () => {
    // 1. Mock Groq for question generation
    (groq.chat.completions.create as jest.Mock).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              { text: 'Question 1 about React' },
              { text: 'Question 2 about React' },
              { text: 'Question 3 about React' },
              { text: 'Question 4 about React' },
              { text: 'Question 5 about React' }
            ]
          })
        }
      }]
    });

    const topic = await prisma.topic.findFirst();
    // Step 1: Create Session
    const createRes = await api
      .post('/api/v1/sessions')
      .set('Cookie', [`accessToken=${userToken}`])
      .send({
        topicIds: [topic!.id],
        difficulty: 'INTERMEDIATE'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const sessionId = createRes.body.data.sessionId;

    // Fetch the session questions from DB to know their IDs
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { questionOrder: 'asc' } } }
    });
    expect(session?.questions).toHaveLength(5);
    const q1 = session!.questions[0];
    const q2 = session!.questions[1];
    const q3 = session!.questions[2];
    const q4 = session!.questions[3];
    const q5 = session!.questions[4];

    // Step 2: Answer Question 1
    const ans1Res = await api
      .post(`/api/v1/answers`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ sessionId, questionId: q1.id, answerText: 'My answer to Q1' });
    
    expect(ans1Res.status).toBe(200);

    // Step 3: Answer Question 2
    const ans2Res = await api
      .post(`/api/v1/answers`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ sessionId, questionId: q2.id, answerText: 'My answer to Q2' });
    
    expect(ans2Res.status).toBe(200);

    const ans3Res = await api
      .post(`/api/v1/answers`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ sessionId, questionId: q3.id, answerText: 'My answer to Q3' });
    expect(ans3Res.status).toBe(200);

    const ans4Res = await api
      .post(`/api/v1/answers`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ sessionId, questionId: q4.id, answerText: 'My answer to Q4' });
    expect(ans4Res.status).toBe(200);

    const ans5Res = await api
      .post(`/api/v1/answers`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ sessionId, questionId: q5.id, answerText: 'My answer to Q5' });
    expect(ans5Res.status).toBe(200);

    // 4. Mock Groq for evaluation (5 questions + 1 summary)
    (groq.chat.completions.create as jest.Mock)
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ score: 80, feedback: 'Good Q1' }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ score: 90, feedback: 'Great Q2' }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ score: 80, feedback: 'Good Q3' }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ score: 80, feedback: 'Good Q4' }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ score: 80, feedback: 'Good Q5' }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Overall you did well.' } }] }); // Summary text

    const evalSpy = jest.spyOn(evaluationService, 'evaluateSessionBackground');

    // Step 4: Complete Session
    const completeRes = await api
      .post(`/api/v1/sessions/${sessionId}/complete`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({});
    
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.message).toBe('Assessment completed successfully');

    // Step 5: Wait for background processing deterministically
    await evalSpy.mock.results[0].value;

    // Step 6: Get Session Summary
    const summaryRes = await api
      .get(`/api/v1/sessions/${sessionId}/summary`)
      .set('Cookie', [`accessToken=${userToken}`]);
    
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.data.status).toBe('COMPLETED');
    expect(summaryRes.body.data.evaluationStatus).toBe('COMPLETED');
    expect(summaryRes.body.data.overallScore).toBe(82);
    expect(summaryRes.body.data.overallFeedback).toBe('Overall you did well.');
    expect(summaryRes.body.data.questions).toHaveLength(5);
    expect(summaryRes.body.data.questions[0].score).toBe(80);
    expect(summaryRes.body.data.questions[1].score).toBe(90);
  });
});
