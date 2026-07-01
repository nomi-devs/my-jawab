// src/api/subscriptionsApi.js
import axiosClient from './axiosClient';

const subscriptionsApi = {
  /**
   * Get paginated list of all subscriptions (including inactive)
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in subscription name or description
   * @param {string} [params.sort_by=created_at] - Field to sort by
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC
   * @param {string} [params.subscription_type] - Filter by type: free, pro, premium
   * @param {boolean} [params.is_active] - Filter by active status
   * @returns {Promise} Response with data array and meta pagination info
   */
  getSubscriptions(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.subscription_type && { subscription_type: params.subscription_type }),
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/subscriptions', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific subscription
   * @param {number} id - Subscription ID
   * @returns {Promise} Response with subscription data
   */
  getSubscription(id) {
    return axiosClient.get(`/admin/subscriptions/${id}`);
  },

  /**
   * Create a new subscription plan
   * @param {Object} data - Subscription data
   * @param {string} data.subscription_type - Type: free, pro, premium
   * @param {string} data.subscription_name - Unique subscription name
   * @param {string} [data.subscription_description] - Subscription description
   * @param {number} data.subscription_price - Price (decimal)
   * @param {number} data.subscription_duration - Duration value
   * @param {string} data.subscription_duration_type - Duration type: days, weeks, months, years
   * @param {boolean} [data.is_active=true] - Active status
   * @returns {Promise} Response with created subscription data
   */
  createSubscription(data) {
    return axiosClient.post('/admin/subscriptions', data);
  },

  /**
   * Update an existing subscription plan
   * @param {number} id - Subscription ID
   * @param {Object} data - Subscription update data (all fields optional)
   * @returns {Promise} Response with updated subscription data
   */
  updateSubscription(id, data) {
    return axiosClient.put(`/admin/subscriptions/${id}`, data);
  },

  /**
   * Delete a subscription (soft delete - sets is_active to false)
   * @param {number} id - Subscription ID
   * @returns {Promise} Response with success message
   */
  deleteSubscription(id) {
    return axiosClient.delete(`/admin/subscriptions/${id}`);
  },

  /**
   * Get paginated list of all user subscriptions across all users
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in subscription name
   * @param {string} [params.sort_by=created_at] - Field to sort by
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC
   * @param {number} [params.user_id] - Filter by user ID
   * @param {number} [params.subscription_id] - Filter by subscription ID
   * @param {string} [params.subscription_status] - Filter by status: pending, active, inactive, expired
   * @param {boolean} [params.is_active] - Filter by active status
   * @returns {Promise} Response with data array and meta pagination info
   */
  getUserSubscriptions(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.subscription_id && { subscription_id: params.subscription_id }),
      ...(params.subscription_status && { subscription_status: params.subscription_status }),
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/user-subscriptions', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific user subscription
   * @param {number} id - User subscription ID
   * @returns {Promise} Response with user subscription data
   */
  getUserSubscription(id) {
    return axiosClient.get(`/admin/user-subscriptions/${id}`);
  },

  /**
   * Update the status of a user subscription
   * @param {number} id - User subscription ID
   * @param {Object} data - Status update data
   * @param {string} data.status - Status: pending, active, inactive, expired
   * @returns {Promise} Response with updated user subscription data
   */
  updateUserSubscriptionStatus(id, data) {
    return axiosClient.put(`/admin/user-subscriptions/${id}/status`, data);
  },

  /**
   * Export all user subscriptions matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full subscription dataset
   */
  exportSubscriptions(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.subscription_status && { subscription_status: params.subscription_status }),
      ...(params.subscription_type && { subscription_type: params.subscription_type }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/subscriptions/export', { params: cleanedParams });
  },
};

export default subscriptionsApi;
