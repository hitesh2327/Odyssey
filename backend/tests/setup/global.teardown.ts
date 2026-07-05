export default async () => {
  const { prisma } = require('../../src/lib/prisma');
  await prisma.$disconnect();
};
