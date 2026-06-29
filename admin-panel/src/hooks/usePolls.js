import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import pollsApi from '../api/pollsApi';

export const usePollsList = (params) => {
    return useQuery({
        queryKey: ['polls', params],
        queryFn: async () => {
            const response = await pollsApi.getPolls(params);
            const pollsData = response.data.data || [];
            const meta = response.data.meta || {};

            // Transform API response to match component format (from PollsPage.jsx)
            const transformedPolls = pollsData.map(poll => {
                const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.vote_count || 0), 0) || 0;

                // Calculate status
                const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
                const status = isExpired ? 'Expired' : (poll.poll_status === 'published' ? 'Active' : 'Ended');

                return {
                    id: poll.id,
                    poll_title: poll.poll_title,
                    poll_description: poll.poll_description,
                    poll_status: poll.poll_status,
                    poll_expires_at: poll.poll_expires_at, // Ensure date matches
                    question: poll.poll_title || 'Untitled Poll',
                    options: poll.options?.map(opt => ({
                        id: opt.id,
                        text: opt.option_text,
                        option_text: opt.option_text, // Keep original
                        votes: opt.vote_count || 0,
                        vote_count: opt.vote_count || 0, // Keep original
                        percent: totalVotes > 0 ? Math.round((opt.vote_count || 0) / totalVotes * 100) : 0
                    })) || [],
                    totalVotes,
                    status,
                    is_expired: isExpired,
                    is_featured: poll.is_featured || false,
                    view_count: poll.view_count || 0, // Add view_count
                    author: {
                        name: poll.user?.profile?.full_name || poll.user?.username || 'System',
                        avatar: poll.user?.profile?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${poll.user?.username || 'poll'}`
                    },
                    createdAt: poll.created_at || new Date().toISOString(),
                    expiresAt: poll.expires_at,
                    raw: poll
                };
            });

            return {
                polls: transformedPolls,
                total: meta.total || 0,
                totalPages: meta.total_pages || 1,
                page: meta.page || params.page
            };
        },
        placeholderData: keepPreviousData,
    });
};

export const usePollActions = () => {
    const queryClient = useQueryClient();

    const createPollMutation = useMutation({
        mutationFn: (pollData) => pollsApi.createPoll(pollData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
    });

    const updatePollMutation = useMutation({
        mutationFn: ({ id, data }) => pollsApi.updatePoll(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
    });

    const deletePollMutation = useMutation({
        mutationFn: (id) => pollsApi.deletePoll(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
    });

    const updatePollStatusMutation = useMutation({
        mutationFn: ({ id, data }) => pollsApi.updatePoll(id, data), // Same endpoint as updatePoll
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
    });

    return {
        createPoll: createPollMutation.mutateAsync,
        isCreating: createPollMutation.isPending,
        updatePoll: updatePollMutation.mutateAsync,
        isUpdating: updatePollMutation.isPending,
        deletePoll: deletePollMutation.mutateAsync,
        isDeleting: deletePollMutation.isPending,
        updatePollStatus: updatePollStatusMutation.mutateAsync,
        isUpdatingStatus: updatePollStatusMutation.isPending,
    };
};
