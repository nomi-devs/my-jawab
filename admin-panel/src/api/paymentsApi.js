// src/api/paymentsApi.js
import axiosClient from './axiosClient';

const paymentsApi = {
  /**
   * Get paginated list of all payments across all users
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search by transaction ID or gateway
   * @param {string} [params.sort_by=created_at] - Field to sort by
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC
   * @param {number} [params.user_id] - Filter by user ID
   * @param {number} [params.users_subscriptions_id] - Filter by user subscription ID
   * @param {string} [params.payment_status] - Filter by status: pending, completed, failed
   * @param {string} [params.payment_method] - Filter by method: credit_card, debit_card, paypal, bank_transfer, cash
   * @returns {Promise} Response with data array and meta pagination info
   */
  getPayments(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.user_id && { user_id: params.user_id }),
      ...(params.users_subscriptions_id && {
        users_subscriptions_id: params.users_subscriptions_id,
      }),
      ...(params.payment_status && { payment_status: params.payment_status }),
      ...(params.payment_method && { payment_method: params.payment_method }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/payments', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific payment
   * @param {number} id - Payment ID
   * @returns {Promise} Response with payment data
   */
  getPayment(id) {
    return axiosClient.get(`/admin/payments/${id}`);
  },

  /**
   * Create a payment record (admin can create payments for any user)
   * @param {Object} data - Payment data
   * @param {number} data.users_subscriptions_id - User subscription ID
   * @param {number} data.payment_amount - Payment amount
   * @param {string} data.payment_status - Status: pending, completed, failed
   * @param {string} data.payment_method - Method: credit_card, debit_card, paypal, bank_transfer, cash
   * @param {string} data.payment_currency - Currency code (e.g., USD, EUR)
   * @param {string} data.payment_gateway - Payment gateway (e.g., stripe, paypal)
   * @param {string} data.payment_transaction_id - Unique transaction ID from gateway
   * @returns {Promise} Response with created payment data
   */
  createPayment(data) {
    return axiosClient.post('/admin/payments', data);
  },

  /**
   * Update the status of a payment
   * @param {number} id - Payment ID
   * @param {Object} data - Status update data
   * @param {string} data.status - Status: pending, completed, failed
   * @returns {Promise} Response with updated payment data
   */
  updatePaymentStatus(id, data) {
    return axiosClient.put(`/admin/payments/${id}/status`, data);
  },

  /**
   * Export all payments matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full payment dataset
   */
  exportPayments(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.payment_status && { payment_status: params.payment_status }),
      ...(params.payment_method && { payment_method: params.payment_method }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/payments/export', { params: cleanedParams });
  },
};

export default paymentsApi;
