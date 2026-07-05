require('ts-node').register({ transpileOnly: true });
const fs = require('fs');
const path = require('path');
const { flushMetadata } = require('../helpers/test-meta.ts');

class JsonSummaryReporter {
  onRunComplete(_, results) {
    const outDir = path.join(process.cwd(), 'test-output');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'results.json'),
      JSON.stringify(results, null, 2)
    );
    flushMetadata();
  }
}
module.exports = JsonSummaryReporter;
