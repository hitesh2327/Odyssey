import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import {
  ApiProfile,
  UpdateProfileDto,
  ReplaceTopicsDto,
  ParsedResumeResult,
} from '@/types/profile';

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  resumes: () => [...profileKeys.all, 'resumes'] as const,
};

export const useProfile = () => {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useResumes = () => {
  return useQuery({
    queryKey: profileKeys.resumes(),
    queryFn: () => profileService.getResumes(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['update-profile'],
    mutationFn: (data: UpdateProfileDto) => profileService.updateProfile(data),
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.detail() });
      const previousProfile = queryClient.getQueryData<ApiProfile>(profileKeys.detail());

      if (previousProfile) {
        queryClient.setQueryData<ApiProfile>(profileKeys.detail(), {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            ...newProfileData,
          },
        });
      }

      return { previousProfile };
    },
    onError: (err: any, newProfileData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.detail(), context.previousProfile);
      }
      toast.error(err.message || 'Failed to update profile');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ApiProfile>(profileKeys.detail(), (old) => {
        if (!old) return old as any;
        return {
          ...old,
          profile: {
            ...old.profile,
            ...data
          }
        };
      });
      toast.success('Profile updated');
    },
  });
};

export const useReplaceTopics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['replace-topics'],
    mutationFn: (data: ReplaceTopicsDto) => profileService.replaceTopics(data),
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update topics');
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ApiProfile>(profileKeys.detail(), (old) => {
        if (!old) return old as any;
        return {
          ...old,
          topicsOfInterest: data.topicsOfInterest
        };
      });
      toast.success('Topics saved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationKey: ['upload-avatar'],
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (data) => {
      if (user) {
        setUser({ ...user, avatarUrl: data.avatarUrl });
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Avatar updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload avatar');
    },
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationKey: ['remove-avatar'],
    mutationFn: () => profileService.removeAvatar(),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, avatarUrl: null });
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Avatar removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove avatar');
    },
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['upload-resume'],
    mutationFn: (file: File) => profileService.uploadResume(file),
    onSuccess: (data) => {
      // Optimistically update resume cache
      queryClient.setQueryData(profileKeys.resumes(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          resumes: [...(old.resumes || []), data.resume],
        };
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.resumes() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Resume uploaded');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload resume');
    },
  });
};

export const useSetPrimaryResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['set-primary-resume'],
    mutationFn: (resumeId: string) => profileService.setPrimaryResume(resumeId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.resumes() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Primary resume updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to set primary resume');
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['delete-resume'],
    mutationFn: (resumeId: string) => profileService.deleteResume(resumeId),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(profileKeys.resumes(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          resumes: (old.resumes || []).filter((r: any) => r.id !== deletedId),
        };
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.resumes() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      toast.success('Resume deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete resume');
    },
  });
};

export const useParseResume = (onSuccess?: (data: ParsedResumeResult) => void) => {
  return useMutation({
    mutationKey: ['parse-resume'],
    mutationFn: (resumeId: string) => profileService.parseResume(resumeId),
    onSuccess: (data) => onSuccess?.(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to parse resume');
    },
  });
};
