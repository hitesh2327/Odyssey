import fs from 'fs';
import path from 'path';

export interface HttpInteraction {
  method: string;
  endpoint: string;
  requestBody?: any;
  requestHeaders?: Record<string, string>;
  responseStatus: number;
  responseBody?: any;
}

export function recordInteraction(interaction: HttpInteraction): void {
  const testName = expect.getState().currentTestName ?? 'unknown';
  const outDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const file = path.join(outDir, 'http-meta.jsonl');
  const payload = { testName, interaction };
  fs.appendFileSync(file, JSON.stringify(payload) + '\n');
}

export function flushMetadata(): void {
  // Deprecated: No longer needed since recordInteraction writes directly to file.
}

export function clearMetadata(): void {
  // Deprecated
}
