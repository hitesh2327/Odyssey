import http from 'http';
import app from '../../../src/app';
import { createVerifiedUser } from '../../helpers/auth.helper';
import { cleanDb, seedTestTopics, assertCleanDb } from '../../helpers/db.helper';
import { prisma } from '../../../src/lib/prisma';
import { groq } from '../../../src/lib/groq';

jest.mock('../../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      }
    }
  }
}));

let server: http.Server;
let port: number;

beforeAll((done) => {
  server = app.listen(0, () => {
    port = (server.address() as any).port;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('GET /api/v1/questions/:questionId/assist/stream', () => {
  let userToken: string;
  let qId: string;

  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
    await seedTestTopics();
    
    const user = await createVerifiedUser();
    userToken = user.token;

    const topic = await prisma.topic.findFirst();
    
    const session = await prisma.assessmentSession.create({
      data: {
        userId: user.id,
        topicId: topic!.id,
        difficulty: 'INTERMEDIATE',
        totalQuestions: 5,
        status: 'IN_PROGRESS'
      }
    });

    const question = await prisma.question.create({
      data: {
        sessionId: session.id,
        topicId: topic!.id,
        difficulty: 'INTERMEDIATE',
        questionOrder: 1,
        text: 'What is a closure?'
      }
    });

    qId = question.id;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await cleanDb();
  });

  it('should stream AI assistance chunks and terminate properly', (done) => {
    async function* mockStream() {
      yield { choices: [{ delta: { content: 'chunk1' } }] };
      yield { choices: [{ delta: { content: 'chunk2' } }] };
    }
    
    (groq.chat.completions.create as jest.Mock).mockResolvedValue(mockStream());

    const options = {
      hostname: '127.0.0.1',
      port,
      path: `/api/v1/questions/${qId}/assist/stream`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      }
    };

    const req = http.request(options, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/event-stream');

      let data = '';
      
      const timeout = setTimeout(() => {
        req.destroy();
        done(new Error('Test timed out - SSE stream did not close'));
      }, 5000);

      res.on('data', (chunk) => {
        const str = chunk.toString();
        data += str;
        
        // Terminate condition based on the specific stream closing event we wrote in service
        if (str.includes('event: end')) {
          clearTimeout(timeout);
          req.destroy(); // explicitly close connection since SSE might linger
          
          expect(data).toContain('chunk1');
          expect(data).toContain('chunk2');
          done();
        }
      });
    });

    req.on('error', (e) => {
      done(e);
    });

    req.end();
  });
});
