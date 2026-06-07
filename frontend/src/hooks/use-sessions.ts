import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService, CreateSessionParams } from '@/services/sessions.service';
import { useLoaderStore } from '@/store/loader.store';

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { showLoader, hideLoader } = useLoaderStore();

  return useMutation({
    mutationFn: (data: CreateSessionParams) => {
      showLoader();
      return sessionsService.createSession(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onSettled: () => {
      hideLoader();
    }
  });
}

export function useSessionResume(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ['session', sessionId, 'resume'],
    queryFn: () => sessionsService.getSessionResume(sessionId),
    enabled: !!sessionId && enabled,
  });
}

export function useSessionProgress(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ['session', sessionId, 'progress'],
    queryFn: () => sessionsService.getSessionProgress(sessionId),
    enabled: !!sessionId && enabled,
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsService.completeSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useSessionSummary(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ['session', sessionId, 'summary'],
    queryFn: () => sessionsService.getSessionSummary(sessionId),
    enabled: !!sessionId && enabled,
  });
}
