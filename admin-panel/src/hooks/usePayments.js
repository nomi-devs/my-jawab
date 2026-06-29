import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import paymentsApi from '../api/paymentsApi';

export const usePaymentsList = (params) => {
    return useQuery({
        queryKey: ['payments', params],
        queryFn: async () => {
            const response = await paymentsApi.getPayments(params);
            const paymentsData = response.data.data || [];
            const meta = response.data.meta || {};

            return {
                payments: paymentsData,
                total: meta.total || 0,
                totalPages: meta.total_pages || 1,
                page: meta.page || params.page
            };
        },
        placeholderData: keepPreviousData,
    });
};

export const usePaymentActions = () => {
    const queryClient = useQueryClient();

    const createPaymentMutation = useMutation({
        mutationFn: (data) => paymentsApi.createPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });

    const updatePaymentStatusMutation = useMutation({
        mutationFn: ({ id, status }) => paymentsApi.updatePaymentStatus(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });

    return {
        createPayment: createPaymentMutation.mutateAsync,
        isCreating: createPaymentMutation.isPending,

        updatePaymentStatus: updatePaymentStatusMutation.mutateAsync,
        isUpdatingStatus: updatePaymentStatusMutation.isPending,
    };
};
