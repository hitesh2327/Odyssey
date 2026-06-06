import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const topics = [
  'Java',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Express.js',
  'NestJS',
  'React',
  'Next.js',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Python',
  'FastAPI',
  'Django',
  'Generative AI',
  'Prompt Engineering',
  'LangChain',
  'LangGraph',
  'Vector Databases',
  'System Design',
  'Microservices',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GraphQL',
  'REST APIs',
];

async function main() {
  console.log('Starting topic seed...');
  for (const topicName of topics) {
    await prisma.topic.upsert({
      where: { name: topicName },
      update: {
        description: `${topicName} interview preparation`,
      },
      create: {
        name: topicName,
        description: `${topicName} interview preparation`,
        isActive: true,
      },
    });
  }
  console.log(`Successfully seeded ${topics.length} topics.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
