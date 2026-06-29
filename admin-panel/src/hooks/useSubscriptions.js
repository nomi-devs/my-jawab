import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import subscriptionsApi from '../api/subscriptionsApi';

export const useSubscriptionsList = (params) => {
    return useQuery({
        queryKey: ['subscriptions', params],
        queryFn: async () => {
            const response = await subscriptionsApi.getSubscriptions(params);
            const subscriptionsData = response.data.data || [];
            const meta = response.data.meta || {};

            return {
                subscriptions: subscriptionsData,
                total: meta.total || 0,
                totalPages: meta.total_pages || 1,
                page: meta.page || params.page
            };
        },
        placeholderData: keepPreviousData,
    });
};

export const useSubscriptionActions = () => {
    const queryClient = useQueryClient();

    const createSubscriptionMutation = useMutation({
        mutationFn: (data) => subscriptionsApi.createSubscription(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
    });

    const updateSubscriptionMutation = useMutation({
        mutationFn: ({ id, data }) => subscriptionsApi.updateSubscription(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
    });

    const deleteSubscriptionMutation = useMutation({
        mutationFn: (id) => subscriptionsApi.deleteSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
    });

    return {
        createSubscription: createSubscriptionMutation.mutateAsync,
        isCreating: createSubscriptionMutation.isPending,

        updateSubscription: updateSubscriptionMutation.mutateAsync,
        isUpdating: updateSubscriptionMutation.isPending,

        deleteSubscription: deleteSubscriptionMutation.mutateAsync,
        isDeleting: deleteSubscriptionMutation.isPending,
    };
};
