import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import userApi from '../api/userApi';

export const useUsersList = (params) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await userApi.getUsers(params);
      const usersData = response.data.data || [];
      const meta = response.data.meta || {};

      // Transform users data to match component structure (from UsersTable.jsx)
      const formattedUsers = usersData.map((user) => ({
        id: user.id,
        name: user.profile?.full_name || null,
        username: user.username || `@user${user.id}`,
        handle: user.username || `@user${user.id}`,
        email: user.email,
        role: user.role || 'user',
        status: user.is_active ? 'Active' : 'Inactive',
        is_active: user.is_active,
        is_verified: user.is_verified,
        joined: user.created_at
          ? new Date(user.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'N/A',
        img:
          user.profile?.profile_picture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.email}`,
        raw: user,
      }));

      return {
        users: formattedUsers,
        total: meta.total || 0,
        totalPages: meta.total_pages || 1,
        page: meta.page || params.page,
      };
    },
    placeholderData: keepPreviousData,
  });
};

export const useUserActions = () => {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (userData) => userApi.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
};
