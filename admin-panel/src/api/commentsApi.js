// src/api/commentsApi.js
import axiosClient from './axiosClient';

const commentsApi = {
  /**
   * Get paginated list of all comments with user and post information
   *
   * According to API_ADMIN_MODULE.md, the API only supports:
   * - page, limit, search, sort_by, sort_order
   *
   * Status filters are NOT supported server-side
   * and must be handled client-side.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in comment content (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getComments(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.is_approved !== undefined &&
        params.is_approved !== null && { is_approved: params.is_approved }),
      ...(params.post_id && { post_id: params.post_id }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.has_replies !== undefined &&
        params.has_replies !== null && { has_replies: params.has_replies }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/comments', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific comment including replies
   * @param {number} id - Comment ID
   * @returns {Promise} Response with comment data including user, post, and replies
   */
  getComment(id) {
    return axiosClient.get(`/admin/comments/${id}`);
  },

  /**
   * Delete a comment (soft/hard delete based on replies)
   * @param {number} id - Comment ID
   * @returns {Promise} Response with success message
   */
  deleteComment(id) {
    return axiosClient.delete(`/admin/comments/${id}`);
  },

  /**
   * Export all comments matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full comment dataset
   */
  exportComments(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.is_approved !== undefined &&
        params.is_approved !== null && { is_approved: params.is_approved }),
      ...(params.post_id && { post_id: params.post_id }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/comments/export', { params: cleanedParams });
  },

  /**
   * Get all replies to a specific comment (paginated)
   * @param {number} commentId - Comment ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with comment replies
   */
  getCommentReplies(commentId, params = {}) {
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
    return axiosClient.get(`/admin/comments/${commentId}/replies`, { params: cleanedParams });
  },

  /**
   * Update an existing comment
   * Admin can update any comment regardless of ownership
   * @param {number} id - Comment ID
   * @param {Object} data - Comment update data
   * @param {string} [data.comment_content] - Updated comment content
   * @param {boolean} [data.is_approved] - Approval status
   * @returns {Promise} Response with updated comment data
   */
  updateComment(id, data) {
    return axiosClient.put(`/admin/comments/${id}`, data);
  },
};

export default commentsApi;
