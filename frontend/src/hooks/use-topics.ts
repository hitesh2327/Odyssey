import { useQuery } from '@tanstack/react-query';
import { topicsService } from '@/services/topics.service';

export function useTopics(search?: string) {
  return useQuery({
    queryKey: ['topics', search],
    queryFn: () => topicsService.getTopics(search),
  });
}
