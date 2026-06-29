import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import postsApi from '../api/postsApi';
import { normalizeMediaUrl } from '../utils/mediaUtils';

export const usePostsList = (params) => {
    return useQuery({
        queryKey: ['posts', params],
        queryFn: async () => {
            const response = await postsApi.getPosts(params);
            const postsData = response.data.data || [];
            const meta = response.data.meta || {};

            // Transform API response to match component format (from PostsList.jsx)
            const transformedPosts = postsData.map(post => {
                // Parse post_tags from comma-separated string to array
                const tags = post.post_tags
                    ? (typeof post.post_tags === 'string' ? post.post_tags.split(',').map(t => t.trim()).filter(Boolean) : post.post_tags)
                    : [];

                // Determine media type and URL
                let media = null;
                if (post.post_image) {
                    media = { type: 'image', url: normalizeMediaUrl(post.post_image) };
                } else if (post.post_video) {
                    media = { type: 'video', url: normalizeMediaUrl(post.post_video) };
                } else if (post.post_audio) {
                    media = { type: 'audio', url: normalizeMediaUrl(post.post_audio) };
                }

                // Map API fields to component format
                return {
                    id: post.id,
                    author: {
                        name: post.user?.profile?.full_name || post.user?.username || 'Unknown User',
                        username: post.user?.username || 'user',
                        avatar: post.user?.profile?.profile_picture || post.user?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username || 'user'}`
                    },
                    content: post.post_content || post.post_title || '',
                    title: post.post_title || '',
                    tags: tags,
                    media: media,
                    visibility: 'public',
                    scheduled: false,
                    hidden: post.post_status === 'archived',
                    timestamp: post.created_at || new Date().toISOString(),
                    stats: {
                        likes: post.like_count || 0,
                        dislikes: post.dislike_count || 0,
                        comments: post.comment_count || 0,
                        shares: 0,
                        views: post.view_count || 0
                    },
                    post_status: post.post_status || 'published',
                    is_featured: post.is_featured || false,
                    is_reported: false,
                    raw: post
                };
            });

            return {
                posts: transformedPosts,
                total: meta.total || 0,
                totalPages: meta.total_pages || 1,
                page: meta.page || params.page
            };
        },
        placeholderData: keepPreviousData,
    });
};

export const usePostActions = () => {
    const queryClient = useQueryClient();

    const createPostMutation = useMutation({
        mutationFn: (formData) => postsApi.createPost(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    const updatePostMutation = useMutation({
        mutationFn: ({ id, data }) => postsApi.updatePost(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    const updatePostStatusMutation = useMutation({
        mutationFn: ({ id, data }) => postsApi.updatePostStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    const deletePostMutation = useMutation({
        mutationFn: (id) => postsApi.deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    return {
        createPost: createPostMutation.mutateAsync,
        isCreating: createPostMutation.isPending,
        updatePost: updatePostMutation.mutateAsync,
        isUpdating: updatePostMutation.isPending,
        updatePostStatus: updatePostStatusMutation.mutateAsync,
        isUpdatingStatus: updatePostStatusMutation.isPending,
        deletePost: deletePostMutation.mutateAsync,
        isDeleting: deletePostMutation.isPending,
    };
};
