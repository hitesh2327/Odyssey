import { api } from '../../helpers/request.helper';
import { cleanDb, assertCleanDb } from '../../helpers/db.helper';
import { createVerifiedUser } from '../../helpers/auth.helper';
import { prisma } from '../../../src/lib/prisma';
import { groq } from '../../../src/lib/groq';
import { resumeParserService } from '../../../src/modules/profile/resume-parser.service';
import fs from 'fs';
import path from 'path';

jest.mock('../../../src/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      }
    }
  }
}));

jest.mock('../../../src/modules/profile/resume-parser.service', () => ({
  resumeParserService: {
    parseResume: jest.fn()
  }
}));

jest.mock('../../../src/modules/profile/waypoints.service', () => ({
  waypointsService: {
    checkAndUnlock: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Profile Lifecycle (Integration)', () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // await cleanDb();
    // await assertCleanDb();
    const user = await createVerifiedUser();
    userToken = user.token;
    userId = user.id;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // await cleanDb();
    // Clean up uploaded files (optional, but good practice)
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const resumesDir = path.join(process.cwd(), uploadDir, 'resumes');
    if (fs.existsSync(resumesDir)) {
      const files = fs.readdirSync(resumesDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(resumesDir, file));
          } catch (err) {
            // ignore EPERM
          }
        }
      }
    }
    const avatarsDir = path.join(process.cwd(), uploadDir, 'avatars');
    if (fs.existsSync(avatarsDir)) {
      const files = fs.readdirSync(avatarsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(avatarsDir, file));
          } catch (err) {
            // ignore EPERM
          }
        }
      }
    }
  });

  it('should successfully complete the Profile lifecycle: GET -> PATCH -> Topics -> Avatar -> Resume -> Parse & Download', async () => {
    // 1. GET Profile (should auto-create profile row)
    const getRes = await api
      .get('/api/v1/profile')
      .set('Cookie', [`accessToken=${userToken}`]);
    
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.profile).toBeDefined();

    // Verify DB creation
    const dbProfile = await prisma.profile.findUnique({ where: { userId } });
    expect(dbProfile).not.toBeNull();

    // 2. PATCH Profile
    const patchRes = await api
      .patch('/api/v1/profile')
      .set('Cookie', [`accessToken=${userToken}`])
      .send({
        role: 'Software Engineer',
        bio: 'Hello world',
        homePort: 'San Francisco',
        experienceLevel: 'INTERMEDIATE',
        githubUrl: 'https://github.com/test'
      });
    
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.role).toBe('Software Engineer');

    // 3. PUT Topics
    // First create some topics to put
    const topic1 = await prisma.topic.upsert({ where: { name: 'NodeJS' }, create: { name: 'NodeJS' }, update: {} });
    const topic2 = await prisma.topic.upsert({ where: { name: 'Typescript' }, create: { name: 'Typescript' }, update: {} });

    const putTopicsRes = await api
      .put('/api/v1/profile/topics')
      .set('Cookie', [`accessToken=${userToken}`])
      .send({
        topicIds: [topic1.id, topic2.id]
      });
    
    expect(putTopicsRes.status).toBe(200);
    expect(putTopicsRes.body.data.topicsOfInterest).toHaveLength(2);

    // 4. POST Avatar Upload
    const avatarBuf = Buffer.from('fake image data');
    const avatarRes = await api
      .post('/api/v1/profile/avatar')
      .set('Cookie', [`accessToken=${userToken}`])
      .attach('file', avatarBuf, 'avatar.png');
    
    expect(avatarRes.status).toBe(200);
    expect(avatarRes.body.data.avatarUrl).toContain('/uploads/avatars/');

    // 5. POST Resume Upload
    const resumeBuf = Buffer.from('fake pdf data');
    const resumeRes = await api
      .post('/api/v1/profile/resumes')
      .set('Cookie', [`accessToken=${userToken}`])
      .attach('file', resumeBuf, 'resume.pdf');
    
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.resume.fileName).toBe('resume.pdf');
    expect(resumeRes.body.data.resume.isPrimary).toBe(true);
    
    const resumeId = resumeRes.body.data.resume.id;

    // 6. POST Resume Parse
    (resumeParserService.parseResume as jest.Mock).mockResolvedValueOnce({
      role: 'Backend Engineer',
      experienceLevel: 'ADVANCED',
      skills: ['NodeJS', 'Typescript'],
      suggestedTopics: ['NodeJS', 'Typescript']
    });

    const parseRes = await api
      .post(`/api/v1/profile/resumes/${resumeId}/parse`)
      .set('Cookie', [`accessToken=${userToken}`]);
    
    expect(parseRes.status).toBe(200);
    expect(parseRes.body.data.role).toBe('Backend Engineer');
    expect(parseRes.body.data.skills).toContain('NodeJS');

    // 7. GET Resume Download (assert Content-Disposition and 200)
    const downloadRes = await api
      .get(`/api/v1/profile/resumes/${resumeId}/download`)
      .set('Cookie', [`accessToken=${userToken}`]);
    
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-disposition']).toMatch(/attachment; filename=".*resume\.pdf"/);
  });
});
