import { useMutation, useQueryClient } from '@tanstack/react-query';
import { answersService, SaveAnswerParams } from '@/services/answers.service';

export function useSaveAnswer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SaveAnswerParams) => answersService.saveAnswer(data),
    onSuccess: (_, variables) => {
      // Invalidate progress so sidebar updates
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId, 'progress'] });
    },
  });
}
