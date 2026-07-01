// src/api/communitiesApi.js
import axiosClient from './axiosClient';

const communitiesApi = {
  /**
   * Get paginated list of all communities with member and topic counts
   *
   * According to API_ADMIN_MODULE.md, the API only supports:
   * - page, limit, search, sort_by, sort_order
   *
   * Status and privacy filters are NOT supported server-side
   * and must be handled client-side.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in community name, slug, or description (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getCommunities(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
      ...(params.is_private !== undefined &&
        params.is_private !== null && { is_private: params.is_private }),
      ...(params.category_id && { category_id: params.category_id }),
      ...(params.min_members && { min_members: params.min_members }),
      ...(params.max_members && { max_members: params.max_members }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/communities', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific community
   * @param {number} id - Community ID
   * @returns {Promise} Response with community data including member and topic counts
   */
  getCommunity(id) {
    return axiosClient.get(`/admin/communities/${id}`);
  },

  /**
   * Get topics associated with a community (admin endpoint)
   * @param {number} communityId - Community ID
   * @returns {Promise} Response with array of community-topic relations
   */
  getCommunityTopics(communityId) {
    return axiosClient.get(`/admin/communities/${communityId}/topics`);
  },

  /**
   * Create a new community
   * @param {FormData|Object} data - Community data
   * @returns {Promise} Response with created community data
   */
  createCommunity(data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      return axiosClient.post('/admin/communities', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return axiosClient.post('/admin/communities', data);
  },

  /**
   * Update an existing community
   * @param {number} id - Community ID
   * @param {FormData|Object} data - Community update data
   * @returns {Promise} Response with updated community data
   */
  updateCommunity(id, data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      return axiosClient.put(`/admin/communities/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return axiosClient.put(`/admin/communities/${id}`, data);
  },

  /**
   * Activate or deactivate a community
   * @param {number} id - Community ID
   * @param {Object} data - Status update data
   * @param {boolean} data.is_active - Community active status
   * @returns {Promise} Response with updated community data
   */
  updateCommunityStatus(id, data) {
    return axiosClient.put(`/admin/communities/${id}/status`, data);
  },

  /**
   * Add a topic to a community (admin endpoint)
   * @param {number} communityId - Community ID
   * @param {number} topicId - Topic ID
   * @returns {Promise} Response with created community-topic relation
   */
  addTopicToCommunity(communityId, topicId) {
    return axiosClient.post(`/admin/communities/${communityId}/topics`, {
      topic_id: topicId,
    });
  },

  /**
   * Remove a topic from a community (admin endpoint)
   * @param {number} communityId - Community ID
   * @param {number} topicId - Topic ID
   * @returns {Promise} Response with success message
   */
  removeTopicFromCommunity(communityId, topicId) {
    return axiosClient.delete(`/admin/communities/${communityId}/topics/${topicId}`);
  },

  /**
   * Export all communities matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full community dataset
   */
  exportCommunities(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/communities/export', { params: cleanedParams });
  },

  /**
   * Get all posts in a specific community (paginated)
   * @param {number} communityId - Community ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with community posts
   */
  getCommunityPosts(communityId, params = {}) {
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
    return axiosClient.get(`/admin/communities/${communityId}/posts`, { params: cleanedParams });
  },

  /**
   * Get recent activity in a community (posts and comments)
   * @param {number} communityId - Community ID
   * @param {Object} [params={}] - Query parameters (page, limit)
   * @returns {Promise} Response with community activity
   */
  getCommunityActivity(communityId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/communities/${communityId}/activity`, { params: cleanedParams });
  },

  /**
   * Get all members of a specific community (paginated)
   * @param {number} communityId - Community ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with community members list
   */
  getCommunityMembers(communityId, params = {}) {
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
    return axiosClient.get(`/admin/communities/${communityId}/members`, { params: cleanedParams });
  },

  /**
   * Get comprehensive statistics for a community
   * @param {number} communityId - Community ID
   * @returns {Promise} Response with community statistics
   */
  getCommunityStats(communityId) {
    return axiosClient.get(`/admin/communities/${communityId}/stats`);
  },

  /**
   * Delete a community (soft delete - sets is_active to false)
   * @param {number} id - Community ID
   * @returns {Promise} Response with success message
   */
  deleteCommunity(id) {
    return axiosClient.delete(`/admin/communities/${id}`);
  },
};

export default communitiesApi;
