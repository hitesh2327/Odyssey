import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  history: (page: number) => [...dashboardKeys.all, 'history', page] as const,
  performance: () => [...dashboardKeys.all, 'performance'] as const,
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: dashboardService.getOverview,
    refetchOnMount: 'always',
  });
};

export const useDashboardHistory = (page = 1) => {
  return useQuery({
    queryKey: dashboardKeys.history(page),
    queryFn: () => dashboardService.getHistory(page),
    refetchOnMount: 'always',
  });
};

export const useDashboardPerformance = () => {
  return useQuery({
    queryKey: dashboardKeys.performance(),
    queryFn: dashboardService.getPerformance,
    refetchOnMount: 'always',
  });
};
