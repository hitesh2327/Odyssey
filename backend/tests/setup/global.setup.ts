export default async () => {
  // Load .env.test BEFORE importing anything that reads config
  const fs = require('fs');
  const path = require('path');
  const metaPath = path.join(process.cwd(), 'test-output', 'http-meta.jsonl');
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);

  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.test', override: true });
  process.env.NODE_ENV = 'test';

  // Run migrations against test DB
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env },
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Migration failed:', error);
  }

  // Clean database once at the very start of test suite execution
  const { cleanDb, seedTestTopics } = require('../helpers/db.helper');
  await cleanDb();
  await seedTestTopics();
};
