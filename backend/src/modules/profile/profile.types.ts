import { ExperienceLevel, ResumeFileType, PlanTier } from '@prisma/client';

export interface UpdateProfileInput {
  role?: string;
  homePort?: string;
  bio?: string;
  experienceLevel?: ExperienceLevel;
  timezone?: string;
}

export interface ReplaceTopicsInput {
  topicIds: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  techStack: string[];
}

export interface ParsedResumeResult {
  suggestions: {
    role: string;
    bio: string;
    homePort: string;
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    matchedTopics: string[];
  };
  parsed: {
    education: EducationEntry[];
    experience: ExperienceEntry[];
    projects: ProjectEntry[];
  };
  resumeId: string;
  parsedAt: Date;
}
