/// <reference types="node" />
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
  }
  console.log(`Successfully seeded ${topics.length} topics.`);

  console.log('Starting waypoint seed...');
  const waypoints = [
    { code: 'FIRST_VOYAGE', title: 'First Voyage', description: 'Complete your first assessment session', icon: 'anchor' },
    { code: 'FIRST_NAVIGATOR', title: 'First Navigator', description: 'Score 70 or higher on a single topic assessment', icon: 'compass' },
    { code: 'STEADY_HAND', title: 'Steady Hand', description: 'Maintain a 3-day streak', icon: 'star' },
    { code: 'FULL_FLEET', title: 'Full Fleet', description: 'Complete assessments on 5 distinct topics', icon: 'ship' },
    { code: 'PROFILE_COMPLETE', title: 'Profile Complete', description: 'Fill out your profile role, bio, home port, and experience level', icon: 'user-check' }
  ];

  for (const wp of waypoints) {
    await prisma.waypoint.upsert({
      where: { code: wp.code },
      update: {
        title: wp.title,
        description: wp.description,
        icon: wp.icon,
      },
      create: wp,
    });
  }
  console.log(`Successfully seeded ${waypoints.length} waypoints.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
