import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import communitiesApi from '../api/communitiesApi';

// Helper function to assign colors based on category
const getCommunityColor = (category) => {
  const colorMap = {
    technology: 'bg-blue-500',
    entertainment: 'bg-purple-500',
    gaming: 'bg-green-500',
    education: 'bg-indigo-500',
    business: 'bg-amber-500',
    sports: 'bg-red-500',
    art: 'bg-pink-500',
    music: 'bg-teal-500',
    default: 'bg-gray-500',
  };
  return colorMap[category?.toLowerCase()] || colorMap.default;
};

export const useCommunitiesList = (params) => {
  return useQuery({
    queryKey: ['communities', params],
    queryFn: async () => {
      const response = await communitiesApi.getCommunities(params);
      const communitiesData = response.data.data || [];
      const meta = response.data.meta || {};

      // Transform API response to match component's expected format
      const transformedCommunities = communitiesData.map((community) => ({
        id: community.id,
        name: community.community_name || community.name,
        description: community.community_description || community.description || '',
        community_image: community.community_image || null,
        color: getCommunityColor(community.category),
        category: community.category || 'general',
        members_count: community.member_count || community.members_count || 0,
        posts_per_day: community.posts_per_day || 0,
        is_active: community.is_active || false,
        created_at: community.created_at || new Date().toISOString(),
        owner: community.owner || null,
        rules_count: community.rules_count || 0,
        moderator_count: community.moderator_count || 0,
        topic_count: community.topic_count || 0,
        topics: community.topics || [],
        raw: community,
      }));

      return {
        communities: transformedCommunities,
        total: meta.total || 0,
        totalPages: meta.total_pages || 1,
        page: meta.page || params.page,
      };
    },
    placeholderData: keepPreviousData,
  });
};

export const useCommunityActions = () => {
  const queryClient = useQueryClient();

  const createCommunityMutation = useMutation({
    mutationFn: (data) => communitiesApi.createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const updateCommunityMutation = useMutation({
    mutationFn: ({ id, data }) => communitiesApi.updateCommunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const updateCommunityStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => communitiesApi.updateCommunityStatus(id, { is_active }),
    onSuccess: () => {
      // We can optimistically update or just invalidate. Invalidation is safer.
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: (id) => communitiesApi.deleteCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  // Helper to handle topic sync if needed, though this might be better kept in component if complex
  // For now we expose the basic operations.

  return {
    createCommunity: createCommunityMutation.mutateAsync,
    isCreating: createCommunityMutation.isPending,

    updateCommunity: updateCommunityMutation.mutateAsync,
    isUpdating: updateCommunityMutation.isPending,

    updateCommunityStatus: updateCommunityStatusMutation.mutateAsync,
    isUpdatingStatus: updateCommunityStatusMutation.isPending,

    deleteCommunity: deleteCommunityMutation.mutateAsync,
    isDeleting: deleteCommunityMutation.isPending,
  };
};
