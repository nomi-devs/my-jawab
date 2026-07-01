import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import topicsApi from '../api/topicsApi';

export const useTopicsList = (params) => {
  return useQuery({
    queryKey: ['topics', params],
    queryFn: async () => {
      const response = await topicsApi.getTopics(params);
      const topicsData = response.data.data || [];
      const meta = response.data.meta || {};

      return {
        topics: topicsData,
        total: meta.total || 0,
        totalPages: meta.total_pages || 1,
        page: meta.page || params.page,
      };
    },
    placeholderData: keepPreviousData,
  });
};

export const useTopicActions = () => {
  const queryClient = useQueryClient();

  const createTopicMutation = useMutation({
    mutationFn: (data) => topicsApi.createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }) => topicsApi.updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  const updateTopicStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => topicsApi.updateTopicStatus(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id) => topicsApi.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  return {
    createTopic: createTopicMutation.mutateAsync,
    isCreating: createTopicMutation.isPending,

    updateTopic: updateTopicMutation.mutateAsync,
    isUpdating: updateTopicMutation.isPending,

    updateTopicStatus: updateTopicStatusMutation.mutateAsync,
    isUpdatingStatus: updateTopicStatusMutation.isPending,

    deleteTopic: deleteTopicMutation.mutateAsync,
    isDeleting: deleteTopicMutation.isPending,
  };
};
