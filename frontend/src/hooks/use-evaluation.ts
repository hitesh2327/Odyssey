import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useEvaluationStatus = (sessionId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['evaluationStatus', sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ data: { evaluationStatus: string } }>(
        `/sessions/${sessionId}/evaluation-status`
      );
      return data.data.evaluationStatus;
    },
    enabled: options?.enabled,
    refetchInterval: (query) => {
      // Poll every 3 seconds if status is PENDING or PROCESSING
      const status = query.state.data;
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 3000;
      }
      return false; // Stop polling
    },
  });
};
