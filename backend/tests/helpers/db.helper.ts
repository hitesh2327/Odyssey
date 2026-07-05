import { prisma } from '../../src/lib/prisma';

// Wipe all test data between tests — order matters for FK constraints
export async function cleanDb() {
  await prisma.$transaction([
    prisma.otpLock.deleteMany(),
    prisma.otpRecord.deleteMany(),
    prisma.userWaypoint.deleteMany(),
    prisma.topicOfInterest.deleteMany(),
    prisma.resume.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.aIInteraction.deleteMany(),
    prisma.aIAssistance.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.sessionTopic.deleteMany(),
    prisma.question.deleteMany(),
    prisma.assessmentSession.deleteMany(),
    prisma.user.deleteMany(),
    // Keep topics — seeded once in global setup
  ]);
}

// Seeds the minimum topics needed for session/question tests
export async function seedTestTopics() {
  const topics = ['PostgreSQL', 'Docker', 'AWS', 'Django', 'Express.js'];
  for (const name of topics) {
    await prisma.topic.upsert({
      where: { name },
      create: { name, description: `${name} interview questions`, isActive: true },
      update: {},
    });
  }
}

export async function assertCleanDb() {
  const counts = await prisma.$transaction([
    prisma.otpLock.count(),
    prisma.otpRecord.count(),
    prisma.userWaypoint.count(),
    prisma.resume.count(),
    prisma.profile.count(),
    prisma.aIInteraction.count(),
    prisma.aIAssistance.count(),
    prisma.answer.count(),
    prisma.sessionTopic.count(),
    prisma.question.count(),
    prisma.assessmentSession.count(),
    prisma.user.count(),
  ]);

  const total = counts.reduce((a, b) => a + b, 0);
  if (total > 0) {
    throw new Error('Database is not clean. Ensure cleanDb() is called and awaited correctly before tests.');
  }
}
