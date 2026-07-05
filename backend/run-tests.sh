#!/usr/bin/env bash
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Odyssey Backend — Full Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load .env.test
if [ ! -f .env.test ]; then
  echo "❌ .env.test not found. Copy .env.test.example and fill in values."
  exit 1
fi
export $(grep -v '^#' .env.test | xargs)
export NODE_ENV=test

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build TypeScript
echo "🔨 Building backend..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix TypeScript errors before running tests."
  exit 1
fi

# 3. Run Prisma migrations on test DB
echo "🗄️  Running migrations on test database..."
npx prisma migrate deploy

# 4. Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

# 5. Run tests with coverage
echo "🧪 Running tests..."
npm run test:coverage

EXIT_CODE=$?

# 6. Summary
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed."
  echo "📊 Coverage report: coverage/index.html"
else
  echo "❌ Tests failed. See output above."
fi

# Generate and email report
echo "📊 Generating test report..."
npx ts-node tests/generate-report.ts

echo ""
echo "📨 Report emailed to portfolio.hitesh2711@gmail.com — check spam folder if not in inbox"
echo "📁 Report also saved to: test-output/odyssey-report.html"

exit $EXIT_CODE
