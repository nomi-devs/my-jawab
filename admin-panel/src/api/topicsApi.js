// src/api/topicsApi.js
import axiosClient from "./axiosClient";

const topicsApi = {
  /**
   * Get paginated list of all topics (active and inactive)
   * 
   * According to API_ADMIN_MODULE.md, the API only supports:
   * - page, limit, search, sort_by, sort_order
   * 
   * Status and type filters are NOT supported server-side
   * and must be handled client-side.
   * 
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in topic name, slug, or description (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getTopics(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || "created_at",
      sort_order: params.sort_order || "DESC",
      ...(params.is_active !== undefined && params.is_active !== null && { is_active: params.is_active }),
      ...(params.parent_id !== undefined && params.parent_id !== null && { parent_id: params.parent_id }),
      ...(params.type && params.type !== 'all' && { type: params.type }),
      ...(params.has_children !== undefined && params.has_children !== null && { has_children: params.has_children }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to })
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null)
    );

    return axiosClient.get("/admin/topics", { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific topic including parent and children
   * @param {number} id - Topic ID
   * @returns {Promise} Response with topic data including parent and children
   */
  getTopic(id) {
    return axiosClient.get(`/admin/topics/${id}`);
  },

  /**
   * Create a new topic
   * @param {FormData|Object} data - Topic data (FormData for file upload, Object for regular data)
   * @returns {Promise} Response with created topic data
   */
  createTopic(data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      // Let the browser/axios set Content-Type with the correct multipart boundary.
      return axiosClient.post("/admin/topics", data);
    }
    // For regular objects, convert is_active boolean to 'active'/'inactive' string
    const payload = { ...data };
    if (payload.is_active !== undefined) {
      payload.is_active = payload.is_active === true || payload.is_active === 'active' ? 'active' : 'inactive';
    }
    return axiosClient.post("/admin/topics", payload);
  },

  /**
   * Update an existing topic
   * @param {number} id - Topic ID
   * @param {FormData|Object} data - Topic data (FormData for file upload, Object for regular data)
   * @returns {Promise} Response with updated topic data
   */
  updateTopic(id, data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      // Let the browser/axios set Content-Type with the correct multipart boundary.
      return axiosClient.put(`/admin/topics/${id}`, data);
    }
    // For regular objects, convert is_active boolean to 'active'/'inactive' string
    const payload = { ...data };
    if (payload.is_active !== undefined) {
      payload.is_active = payload.is_active === true || payload.is_active === 'active' ? 'active' : 'inactive';
    }
    return axiosClient.put(`/admin/topics/${id}`, payload);
  },

  /**
   * Activate or deactivate a topic
   * @param {number} id - Topic ID
   * @param {Object} data - Status update data
   * @param {string} data.is_active - Topic active status: 'active' or 'inactive'
   * @returns {Promise} Response with updated topic data
   */
  updateTopicStatus(id, data) {
    // Ensure is_active is sent as 'active' or 'inactive' string
    const status = data.is_active === true || data.is_active === 'active' ? 'active' : 'inactive';
    const payload = {
      is_active: status
    };
    return axiosClient.put(`/admin/topics/${id}/status`, payload);
  },

  /**
   * Get all posts using a specific topic (paginated)
   * @param {number} topicId - Topic ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with topic posts
   */
  getTopicPosts(topicId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || "created_at",
      sort_order: params.sort_order || "DESC"
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null)
    );
    return axiosClient.get(`/admin/topics/${topicId}/posts`, { params: cleanedParams });
  },

  /**
   * Get all communities using a specific topic (paginated)
   * @param {number} topicId - Topic ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with topic communities
   */
  getTopicCommunities(topicId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || "created_at",
      sort_order: params.sort_order || "DESC"
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null)
    );
    return axiosClient.get(`/admin/topics/${topicId}/communities`, { params: cleanedParams });
  },

  /**
   * Get usage statistics for a topic
   * @param {number} topicId - Topic ID
   * @returns {Promise} Response with topic statistics
   */
  getTopicStats(topicId) {
    return axiosClient.get(`/admin/topics/${topicId}/stats`);
  },

  /**
   * Export all topics matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full topic dataset
   */
  exportTopics(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || "created_at",
      sort_order: params.sort_order || "DESC",
      ...(params.is_active !== undefined && params.is_active !== null && { is_active: params.is_active }),
      ...(params.parent_id !== undefined && params.parent_id !== null && { parent_id: params.parent_id })
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null)
    );

    return axiosClient.get("/admin/topics/export", { params: cleanedParams });
  },

  /**
   * Get paginated list of only parent topics (parent_id = 0)
   * 
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in topic name, slug, or description
   * @param {string} [params.sort_by=created_at] - Field to sort by
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC
   * @returns {Promise} Response with data array and meta pagination info
   */
  getParentTopics(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 100,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || "created_at",
      sort_order: params.sort_order || "DESC"
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null)
    );

    return axiosClient.get("/admin/parent-topics", { params: cleanedParams });
  },

  /**
   * Get topics for select list (parent-child format for dropdowns)
   * Returns hierarchical structure with parents and children
   * @returns {Promise} Response with topics in select list format
   */
  getTopicsForSelectList() {
    return axiosClient.get("/admin/topics/select-list");
  },

  /**
   * Delete a topic permanently from the database
   * Only works if the topic is not used by any posts, communities, or user subscriptions
   * @param {number} id - Topic ID
   * @returns {Promise} Response with success message
   */
  deleteTopic(id) {
    return axiosClient.delete(`/admin/topics/${id}`);
  }
};

export default topicsApi;