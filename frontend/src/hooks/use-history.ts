import { useQuery } from '@tanstack/react-query';
import { getHistory, HistoryFilters } from '@/services/history.service';

export const historyKeys = {
  all: ['history'] as const,
  list: (page: number, limit: number, filters: HistoryFilters) => [...historyKeys.all, page, limit, filters] as const,
};

export const useHistory = (page = 1, limit = 10, filters: HistoryFilters = {}) => {
  return useQuery({
    queryKey: historyKeys.list(page, limit, filters),
    queryFn: () => getHistory(page, limit, filters),
  });
};
