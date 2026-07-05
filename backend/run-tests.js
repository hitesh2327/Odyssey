const { execSync } = require('child_process');
const fs = require('fs');

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Odyssey Backend — Full Test Suite");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (!fs.existsSync('.env.test')) {
  console.error("❌ .env.test not found. Copy .env.test.example and fill in values.");
  process.exit(1);
}

// Load .env.test manually so we don't need dotenv installed globally
const envConfig = fs.readFileSync('.env.test', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.trim().startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key) {
      acc[key.trim()] = val.join('=').trim().replace(/(^"|"$)/g, ''); // strip quotes
    }
    return acc;
  }, {});

const env = { ...process.env, ...envConfig, NODE_ENV: 'test' };

function run(cmd, errorMessage) {
  try {
    execSync(cmd, { stdio: 'inherit', env });
  } catch (error) {
    if (errorMessage) {
      console.error(`\n❌ ${errorMessage}`);
    } else {
      console.error("\n❌ Tests failed. See output above.");
    }
    process.exit(1);
  }
}

console.log("📦 Installing dependencies...");
run("npm install");

console.log("\n🔨 Building backend...");
run("npm run build", "Build failed. Fix TypeScript errors before running tests.");

console.log("\n🗄️  Running migrations on test database...");
run("npx prisma migrate deploy");

console.log("\n⚙️  Generating Prisma client...");
run("npx prisma generate");

let testsFailed = false;

console.log("\n🧪 Running tests...");
try {
  execSync("npm run test:coverage", { stdio: 'inherit', env });
} catch (error) {
  testsFailed = true;
  console.error("\n❌ Tests failed. Proceeding to generate report...");
}

console.log("\n📊 Generating test report...");
run("npx ts-node tests/generate-report.ts");

if (testsFailed) {
  console.error("\n❌ Test suite failed. Check the generated report.");
  process.exit(1);
} else {
  console.log("\n✅ All tests passed.");
}

console.log("📨 Report emailed to portfolio.hitesh2711@gmail.com — check spam folder if not in inbox");
console.log("📁 Report also saved to: test-output/odyssey-report.html");
