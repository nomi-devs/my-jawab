// src/api/postsApi.js
import axiosClient from './axiosClient';

const postsApi = {
  /**
   * Get paginated list of all posts with full details
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in post title, content, or slug
   * @param {string} [params.status] - Filter by status: all, published, draft, archived
   * @param {boolean} [params.is_featured] - Filter by featured status
   * @param {boolean} [params.has_media] - Filter posts with/without media
   * @param {string} [params.media_type] - Filter by media type: image, video, audio, none
   * @param {string} [params.sort_by=created_at] - Field to sort by (like_count, comment_count, view_count, created_at, updated_at)
   * @param {string} [params.sort_order=DESC] - Sort order (ASC or DESC)
   * @returns {Promise} Response with data array and meta pagination info
   */
  /**
   * Get paginated list of all posts with optional search and sorting
   *
   * According to API_ADMIN_MODULE.md, the API only supports:
   * - page, limit, search, sort_by, sort_order
   *
   * Status, featured, and media filters are NOT supported server-side
   * and must be handled client-side.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in post title, content, or slug (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getPosts(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.post_status &&
        params.post_status !== 'all' && { post_status: params.post_status }),
      ...(params.is_featured !== undefined &&
        params.is_featured !== null && { is_featured: params.is_featured }),
      ...(params.has_media !== undefined &&
        params.has_media !== null && { has_media: params.has_media }),
      ...(params.media_type && { media_type: params.media_type }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.topic_id && { topic_id: params.topic_id }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/posts', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific post
   * @param {number} id - Post ID
   * @returns {Promise} Response with post data including user and topic info
   */
  getPost(id) {
    return axiosClient.get(`/admin/posts/${id}`);
  },

  /**
   * Update post status (draft, published, archived) or featured status
   * @param {number} id - Post ID
   * @param {Object} data - Status update data
   * @param {string} [data.post_status] - Post status (draft, published, archived)
   * @param {boolean} [data.is_featured] - Featured post status
   * @returns {Promise} Response with updated post data
   */
  updatePostStatus(id, data) {
    return axiosClient.put(`/admin/posts/${id}/status`, data);
  },

  /**
   * Create a new post (admin can create posts on behalf of any user)
   * @param {FormData|Object} data - Post data (multipart/form-data or JSON)
   * @param {string} data.post_slug - Unique post slug (required)
   * @param {string} data.post_title - Post title (required)
   * @param {string} data.post_content - Post content (required)
   * @param {number} data.post_topic_id - Topic ID (required)
   * @param {string} [data.post_status] - Post status (draft, published, archived)
   * @param {string[]} [data.post_tags] - Array of post tags
   * @param {number[]} [data.community_ids] - Array of community IDs
   * @param {string} [data.post_image] - Post image URL
   * @param {string} [data.post_video] - Post video URL
   * @param {string} [data.post_audio] - Post audio URL
   * @param {string} [data.post_link] - Post link URL
   * @param {boolean} [data.is_featured] - Featured status
   * @param {File[]} [data.files] - Up to 3 files (images, videos, or audio)
   * @returns {Promise} Response with created post data
   */
  createPost(data) {
    // Check if data is FormData (for file uploads) or regular object
    const isFormData = data instanceof FormData;

    if (isFormData) {
      // Don't set Content-Type header manually - let browser set it with boundary
      return axiosClient.post('/admin/posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // For JSON data, convert arrays to proper format if needed
    const postData = { ...data };
    if (postData.post_tags && Array.isArray(postData.post_tags)) {
      postData.post_tags = postData.post_tags.join(',');
    }
    if (postData.community_ids && Array.isArray(postData.community_ids)) {
      postData.community_ids = postData.community_ids.join(',');
    }

    return axiosClient.post('/admin/posts', postData);
  },

  /**
   * Update an existing post (admin can update any post)
   * @param {number} id - Post ID
   * @param {FormData|Object} data - Post update data (multipart/form-data or JSON)
   * @param {string} [data.post_slug] - Unique post slug
   * @param {string} [data.post_title] - Post title
   * @param {string} [data.post_content] - Post content
   * @param {number} [data.post_topic_id] - Topic ID
   * @param {string} [data.post_status] - Post status (draft, published, archived)
   * @param {string[]} [data.post_tags] - Array of post tags
   * @param {number[]} [data.community_ids] - Array of community IDs
   * @param {string} [data.post_image] - Post image URL
   * @param {string} [data.post_video] - Post video URL
   * @param {string} [data.post_audio] - Post audio URL
   * @param {string} [data.post_link] - Post link URL
   * @param {boolean} [data.is_featured] - Featured status
   * @param {File[]} [data.files] - Up to 3 files (images, videos, or audio)
   * @returns {Promise} Response with updated post data
   */
  updatePost(id, data) {
    // Check if data is FormData (for file uploads) or regular object
    const isFormData = data instanceof FormData;

    if (isFormData) {
      // Don't set Content-Type header manually - let browser set it with boundary
      return axiosClient.put(`/admin/posts/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // For JSON data, convert arrays to proper format if needed
    const postData = { ...data };
    if (postData.post_tags && Array.isArray(postData.post_tags)) {
      postData.post_tags = postData.post_tags.join(',');
    }
    if (postData.community_ids && Array.isArray(postData.community_ids)) {
      postData.community_ids = postData.community_ids.join(',');
    }

    return axiosClient.put(`/admin/posts/${id}`, postData);
  },

  /**
   * Delete a post (soft delete - sets status to archived)
   * @param {number} id - Post ID
   * @returns {Promise} Response with success message
   */
  deletePost(id) {
    return axiosClient.delete(`/admin/posts/${id}`);
  },

  /**
   * Get all comments on a specific post (paginated, includes replies)
   * @param {number} postId - Post ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with post comments
   */
  getPostComments(postId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/posts/${postId}/comments`, { params: cleanedParams });
  },

  /**
   * Get detailed analytics for a post
   * @param {number} postId - Post ID
   * @param {Object} [params={}] - Query parameters (time_range: week, month, year, all)
   * @returns {Promise} Response with post analytics
   */
  getPostAnalytics(postId, params = {}) {
    const queryParams = {
      ...(params.time_range && { time_range: params.time_range }),
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/posts/${postId}/analytics`, { params: cleanedParams });
  },

  /**
   * Export all posts matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full post dataset
   */
  exportPosts(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.post_status &&
        params.post_status !== 'all' && { post_status: params.post_status }),
      ...(params.is_featured !== undefined &&
        params.is_featured !== null && { is_featured: params.is_featured }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.topic_id && { topic_id: params.topic_id }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/posts/export', { params: cleanedParams });
  },
};

export default postsApi;
