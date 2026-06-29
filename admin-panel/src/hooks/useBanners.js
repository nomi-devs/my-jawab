// src/hooks/useBanners.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import bannersApi from '../api/bannersApi';

/**
 * Hook to fetch paginated banner list with filters.
 */
export const useBannersList = (params) => {
    return useQuery({
        queryKey: ['banners', params],
        queryFn: async () => {
            const response = await bannersApi.getBanners(params);
            const bannersData = response.data.data || [];
            const meta = response.data.meta || {};
            return {
                banners: bannersData,
                total: meta.total || 0,
                totalPages: meta.total_pages || 1,
                page: meta.page || params.page,
            };
        },
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook providing CRUD mutation functions.
 */
export const useBannerActions = () => {
    const queryClient = useQueryClient();

    const createBannerMutation = useMutation({
        mutationFn: (data) => bannersApi.createBanner(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });

    const updateBannerMutation = useMutation({
        mutationFn: ({ id, data }) => bannersApi.updateBanner(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });

    const updateBannerStatusMutation = useMutation({
        mutationFn: ({ id, is_active }) => bannersApi.updateBannerStatus(id, is_active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });

    const deleteBannerMutation = useMutation({
        mutationFn: (id) => bannersApi.deleteBanner(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });

    return {
        createBanner: createBannerMutation.mutateAsync,
        isCreating: createBannerMutation.isPending,
        updateBanner: updateBannerMutation.mutateAsync,
        isUpdating: updateBannerMutation.isPending,
        updateBannerStatus: updateBannerStatusMutation.mutateAsync,
        isUpdatingStatus: updateBannerStatusMutation.isPending,
        deleteBanner: deleteBannerMutation.mutateAsync,
        isDeleting: deleteBannerMutation.isPending,
    };
};
