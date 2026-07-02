import { api } from '@/services/api';
import {
  ApiProfile,
  UpdateProfileDto,
  ReplaceTopicsDto,
  ResumeResponse,
  ResumeDto,
  AvatarUploadResponse,
  ParsedResumeResult,
} from '@/types/profile';

export class ProfileService {
  public async getProfile(): Promise<ApiProfile> {
    const { data } = await api.get<{ data: ApiProfile }>('/profile');
    return data.data;
  }

  public async updateProfile(payload: UpdateProfileDto): Promise<ApiProfile> {
    const { data } = await api.patch<{ data: ApiProfile }>('/profile', payload);
    return data.data;
  }

  public async replaceTopics(payload: ReplaceTopicsDto): Promise<ApiProfile> {
    const { data } = await api.put<{ data: ApiProfile }>('/profile/topics', payload);
    return data.data;
  }

  public async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    // Setting Content-Type to undefined lets the browser auto-set it to multipart/form-data with boundary
    const { data } = await api.post<{ data: AvatarUploadResponse }>('/profile/avatar', formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return data.data;
  }

  public async removeAvatar(): Promise<void> {
    await api.delete('/profile/avatar');
  }

  public async getResumes(): Promise<ResumeResponse> {
    const { data } = await api.get<{ data: ResumeResponse }>('/profile/resumes');
    return data.data;
  }

  public async uploadResume(file: File): Promise<{ resume: ResumeDto }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ data: { resume: ResumeDto } }>('/profile/resumes', formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return data.data;
  }

  public async setPrimaryResume(resumeId: string): Promise<{ resume: ResumeDto }> {
    const { data } = await api.patch<{ data: { resume: ResumeDto } }>(`/profile/resumes/${resumeId}/primary`);
    return data.data;
  }

  public async deleteResume(resumeId: string): Promise<void> {
    await api.delete(`/profile/resumes/${resumeId}`);
  }

  public getResumeDownloadUrl(resumeId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/profile/resumes/${resumeId}/download`;
  }

  public async parseResume(resumeId: string): Promise<ParsedResumeResult> {
    const response = await api.post(`/profile/resumes/${resumeId}/parse`);
    return response.data.data;
  }
}

export const profileService = new ProfileService();
