import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import commentsApi from '../api/commentsApi';

export const useCommentsList = (params) => {
  return useQuery({
    queryKey: ['comments', params],
    queryFn: async () => {
      const response = await commentsApi.getComments(params);
      const commentsData = response.data.data || [];
      const meta = response.data.meta || {};

      // Transform API response if necessary, similar to component logic
      const transformedComments = commentsData.map((comment) => ({
        id: comment.id,
        content: comment.comment_content || comment.content || '',
        created_at: comment.created_at || new Date().toISOString(),
        is_approved: comment.is_approved || false,
        is_reported: comment.is_reported || false,
        likes_count: comment.like_count || comment.likes_count || 0,
        user: {
          id: comment.user?.id,
          name: comment.user?.username || comment.user?.name || 'Anonymous User',
          avatar: comment.user?.profile_picture || comment.user?.avatar || null,
          role: comment.user?.role || 'user',
        },
        post: {
          id: comment.post?.id || comment.post_id,
          title: comment.post?.post_title || comment.post?.title || 'Original Post',
        },
      }));

      return {
        comments: transformedComments,
        total: meta.total || 0,
        totalPages: meta.total_pages || 1,
        page: meta.page || params.page,
      };
    },
    placeholderData: keepPreviousData,
  });
};

export const useCommentActions = () => {
  const queryClient = useQueryClient();

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => commentsApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => commentsApi.updateComment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  return {
    deleteComment: deleteCommentMutation.mutateAsync,
    isDeleting: deleteCommentMutation.isPending,

    updateComment: updateCommentMutation.mutateAsync,
    isUpdating: updateCommentMutation.isPending,
  };
};
