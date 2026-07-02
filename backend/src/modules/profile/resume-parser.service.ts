import path from 'path';
import { groq } from '../../lib/groq';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { cacheService } from '../../services/cache.service';
import { extractTextFromResume } from '../../lib/resume-extractor';
import { ResumeParserPromptTemplate } from '../../prompts/resume-parser.prompt';
import { ParsedResumeResult } from './profile.types';

export class ResumeParserService {
  public async parseResume(resumeId: string, userId: string): Promise<ParsedResumeResult> {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new ApiError(404, 'Resume not found');
    }

    let absolutePath = resume.fileKey;
    if (!path.isAbsolute(absolutePath)) {
      absolutePath = path.join(process.cwd(), resume.fileKey);
    }

    const resumeText = await extractTextFromResume(absolutePath);
    if (resumeText.length < 50) {
      throw new ApiError(422, 'Could not extract readable text from this resume');
    }

    const topics = await prisma.topic.findMany({ where: { isActive: true }, select: { name: true } });
    const availableTopics = topics.map(t => t.name);

    const prompt = ResumeParserPromptTemplate.build({ resumeText, availableTopics });

    let parsedResponse: any;
    try {
      const response = await groq.chat.completions.create({
        model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
         throw new Error('Empty response from Groq');
      }
      parsedResponse = JSON.parse(content);
    } catch (err: any) {
      logger.error(`Groq resume parsing failed: ${err.message}`);
      throw new ApiError(502, 'AI returned an invalid response');
    }

    const parsedAt = new Date();
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsedData: {
          education: parsedResponse.education || [],
          experience: parsedResponse.experience || [],
          projects: parsedResponse.projects || []
        },
        parsedAt
      }
    });

    await cacheService.invalidateUserCache(userId);

    return {
      suggestions: {
        role: parsedResponse.role || '',
        bio: parsedResponse.bio || '',
        homePort: parsedResponse.homePort || '',
        experienceLevel: parsedResponse.experienceLevel || 'INTERMEDIATE',
        matchedTopics: parsedResponse.matchedTopics || []
      },
      parsed: {
        education: parsedResponse.education || [],
        experience: parsedResponse.experience || [],
        projects: parsedResponse.projects || []
      },
      resumeId,
      parsedAt
    };
  }
}

export const resumeParserService = new ResumeParserService();
