import { useQuery, useMutation } from '@tanstack/react-query';
import { questionsService } from '@/services/questions.service';

export function useQuestion(sessionId: string, order: number, enabled = true) {
  return useQuery({
    queryKey: ['question', sessionId, order],
    queryFn: () => questionsService.getQuestionByOrder(sessionId, order),
    enabled: !!sessionId && !!order && enabled,
  });
}

export function useAskAI() {
  return useMutation({
    mutationFn: (questionId: string) => questionsService.askAIAssistance(questionId),
  });
}
