import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ApiError } from '../utils/ApiError';

export async function extractTextFromResume(absolutePath: string): Promise<string> {
  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'Resume file not found on disk');
  }
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(absolutePath);
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value;
  }
  throw new ApiError(415, 'Unsupported file type for parsing');
}
