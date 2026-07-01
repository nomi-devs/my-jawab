import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '../api/userApi';
import authApi from '../api/authApi';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const response = await userApi.getOwnProfile();
      return response.data || {};
    },
  });
};

export const useProfileActions = () => {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userApi.updateOwnProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,

    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
