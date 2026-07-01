import { useQuery, keepPreviousData } from '@tanstack/react-query';
import dashboardApi from '../api/dashboardApi';

export const useDashboardStats = (params) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', params],
    queryFn: async () => {
      const response = await dashboardApi.getDashboardStats(params);
      return response.data;
    },
    placeholderData: keepPreviousData,
    // Don't fetch if params are invalid (e.g., partial custom dates) - managed by enabled prop if needed,
    // but API validation rejects promise which causes error state, which is fine.
    // Or we can rely on the component to only pass valid params.
    retry: false, // Don't retry on validation errors
  });
};

export const useUserGrowth = (params) => {
  return useQuery({
    queryKey: ['dashboard', 'growth', params],
    queryFn: async () => {
      const response = await dashboardApi.getUserGrowth(params);
      return response.data;
    },
    placeholderData: keepPreviousData,
    retry: false,
  });
};
