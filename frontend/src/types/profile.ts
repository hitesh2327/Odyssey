export interface ApiProfile {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    avatarUploadedAt: string | null;
  };
  profile: {
    role: string | null;
    homePort: string | null;
    bio: string | null;
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    timezone: string | null;
    streakDays: number;
    lastActiveDate: string | null;
    planTier: 'FREE' | 'PRO';
    aiUsesLimit: number;
    currentPeriodStart: string;
  };
  topicsOfInterest: Array<{
    id: string;
    topicId: string;
    topic: { id: string; name: string };
  }>;
  waypoints: Array<{
    waypoint: { id: string; code: string; title: string; description: string; icon: string };
    unlockedAt: string | null;
    unlocked: boolean;
  }>;
  resumePrimary: ResumeDto | null;
  stats: {
    totalSessions: number;
    completedSessions: number;
    avgScore: number;
    aiUsesThisMonth: number;
  };
}

export interface UpdateProfileDto {
  role?: string;
  homePort?: string;
  bio?: string;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  timezone?: string;
}

export interface ReplaceTopicsDto {
  topicIds: string[];
}

export interface ResumeDto {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX';
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface ResumeResponse {
  resumes: ResumeDto[];
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface ParsedResumeSuggestions {
  role: string;
  bio: string;
  homePort: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  matchedTopics: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export interface ResumeExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
}

export interface ResumeProject {
  name: string;
  description: string;
  techStack: string[];
}

export interface ParsedResumeResult {
  suggestions: ParsedResumeSuggestions;
  parsed: {
    education: ResumeEducation[];
    experience: ResumeExperience[];
    projects: ResumeProject[];
  };
  resumeId: string;
  parsedAt: string;
}
