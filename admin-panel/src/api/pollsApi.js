// src/api/pollsApi.js
import axiosClient from './axiosClient';

const pollsApi = {
  /**
   * Get paginated list of all polls with user and option information
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
   * @param {string} [params.search] - Search in poll title or description (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getPolls(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.poll_status &&
        params.poll_status !== 'all' && { poll_status: params.poll_status }),
      ...(params.is_featured !== undefined &&
        params.is_featured !== null && { is_featured: params.is_featured }),
      ...(params.is_expired !== undefined &&
        params.is_expired !== null && { is_expired: params.is_expired }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.expires_from && { expires_from: params.expires_from }),
      ...(params.expires_to && { expires_to: params.expires_to }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/polls', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific poll
   * @param {number} id - Poll ID
   * @returns {Promise} Response with poll data including user and options
   */
  getPoll(id) {
    return axiosClient.get(`/admin/polls/${id}`);
  },

  /**
   * Create a new poll with options
   * @param {Object} data - Poll data including options array
   * @returns {Promise} Response with created poll data
   */
  createPoll(data) {
    return axiosClient.post('/admin/polls', data);
  },

  /**
   * Update an existing poll
   * @param {number} id - Poll ID
   * @param {Object} data - Poll update data
   * @returns {Promise} Response with updated poll data
   */
  updatePoll(id, data) {
    return axiosClient.put(`/admin/polls/${id}`, data);
  },

  /**
   * Delete a poll (soft delete - sets status to ended)
   * @param {number} id - Poll ID
   * @returns {Promise} Response with success message
   */
  deletePoll(id) {
    return axiosClient.delete(`/admin/polls/${id}`);
  },

  /**
   * Export all polls matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full poll dataset
   */
  exportPolls(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.poll_status &&
        params.poll_status !== 'all' && { poll_status: params.poll_status }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/polls/export', { params: cleanedParams });
  },
  /**
   * Get detailed analytics for a poll
   * @param {number} pollId - Poll ID
   * @returns {Promise} Response with poll analytics
   */
  getPollAnalytics(pollId) {
    return axiosClient.get(`/admin/polls/${pollId}/analytics`);
  },

  /**
   * Get detailed vote breakdown (who voted for what)
   * @param {number} pollId - Poll ID
   * @param {Object} [params={}] - Query parameters (page, limit)
   * @returns {Promise} Response with poll votes
   */
  getPollVotes(pollId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 50,
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/polls/${pollId}/votes`, { params: cleanedParams });
  },
};

export default pollsApi;
