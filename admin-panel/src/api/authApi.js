// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  /**
   * Admin login endpoint
   * @param {Object} data - Login credentials
   * @param {string} data.identifier - Email or username
   * @param {string} data.password - User password
   * @param {string} [data.device_id] - Optional device identifier
   * @param {string} [data.device_type] - Optional device type (web, ios, android)
   * @param {string} [data.device_token] - Optional push notification token
   * @returns {Promise} Response with access_token, refresh_token, and user data
   */
  login(data) {
    return axiosClient.post("/admin/login", data);
  },

  /**
   * Admin logout endpoint
   * Requires authentication token
   * @returns {Promise} Response with success message
   */
  logout() {
    return axiosClient.post("/admin/logout");
  },

  /**
   * Request password reset code
   * @param {Object} data - Email for password reset
   * @param {string} data.email - Admin email address
   * @returns {Promise} Response with success message
   */
  forgotPassword(data) {
    return axiosClient.post("/admin/forgot-password", data);
  },

  /**
   * Reset password using reset code
   * @param {Object} data - Reset password data
   * @param {string} data.email - Admin email address
   * @param {string} data.reset_code - 6-digit reset code
   * @param {string} data.new_password - New password (minimum 6 characters)
   * @returns {Promise} Response with success message
   */
  resetPassword(data) {
    return axiosClient.post("/admin/reset-password", data);
  },

  /**
   * Change password for authenticated admin
   * Requires authentication token
   * @param {Object} data - Change password data
   * @param {string} data.old_password - Current password
   * @param {string} data.new_password - New password (minimum 6 characters)
   * @returns {Promise} Response with success message
   */
  changePassword(data) {
    return axiosClient.post("/admin/change-password", data);
  }
};

export default authApi;
