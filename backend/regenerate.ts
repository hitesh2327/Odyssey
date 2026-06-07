import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { EvaluationService } from './src/modules/evaluation/evaluation.service';
import fs from 'fs';

const prisma = new PrismaClient();
const evaluationService = new EvaluationService();

async function run() {
  const sessionId = "85c53ddc-10bd-4376-9a11-b034c60a8999";
  let log = `Regenerating evaluation for specific session: ${sessionId}\n`;
  try {
    await evaluationService.evaluateSessionBackground(sessionId);
    
    const updatedSession = await prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    log += `Finished regeneration for session ${sessionId}. New status: ${updatedSession?.evaluationStatus}, Score: ${updatedSession?.score}\n`;
  } catch (e: any) {
    log += `Failed to regenerate ${sessionId}: ${e.message}\n${e.stack}\n`;
  }
  fs.writeFileSync('d:\\Code\\Odyssey\\backend\\regen_log.txt', log);
}

run()
  .catch(e => fs.writeFileSync('d:\\Code\\Odyssey\\backend\\regen_log.txt', e.message))
  .finally(() => prisma.$disconnect());
