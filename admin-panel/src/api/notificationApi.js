// src/api/notificationApi.js
import axiosClient from './axiosClient';

const notificationApi = {
  /**
   * Get Subscription and Payment Notifications
   *
   * According to API_ADMIN_MODULE.md:
   * - Endpoint: GET /api/admin/notifications/subscription-payment
   * - Returns notifications related to subscriptions and payments
   * - Filters by notification_type and data JSON field
   *
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.is_read] - Filter by read status: 'read' or 'unread'
   * @param {number} [params.user_id] - Filter by specific user ID
   * @param {string} [params.search] - Search in title and body
   * @param {string} [params.sort_by=created_at] - Sort field: 'created_at', 'updated_at', 'title', 'is_read'
   * @param {string} [params.sort_order=DESC] - Sort order: 'ASC' or 'DESC'
   * @returns {Promise} Response with notifications array and meta pagination info
   */
  getSubscriptionPaymentNotifications(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.is_read && { is_read: params.is_read }),
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/notifications/subscription-payment', { params: cleanedParams });
  },

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise} Response with success message
   */
  markAsRead(id) {
    return axiosClient.put(`/admin/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Response with success message
   */
  markAllAsRead() {
    return axiosClient.put('/admin/notifications/read-all');
  },

  /**
   * Delete notification
   * @param {number} id - Notification ID
   * @returns {Promise} Response with success message
   */
  deleteNotification(id) {
    return axiosClient.delete(`/admin/notifications/${id}`);
  },
};

export default notificationApi;
