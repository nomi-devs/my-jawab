// src/api/privacyPolicyApi.js
import axiosClient from './axiosClient';

const privacyPolicyApi = {
  /**
   * Get the active privacy policy (public)
   * @returns {Promise} Response with active privacy policy
   */
  getActive() {
    return axiosClient.get('/ma/privacy-policy');
  },

  /**
   * Get privacy policy for admin (any status)
   * @returns {Promise} Response with privacy policy data
   */
  getAdmin() {
    return axiosClient.get('/admin/privacy-policy');
  },

  /**
   * Create a new privacy policy
   * @param {Object} data - { slug, title, content, is_active? }
   * @returns {Promise} Response with created privacy policy
   */
  create(data) {
    return axiosClient.post('/admin/privacy-policy', data);
  },

  /**
   * Update an existing privacy policy
   * @param {number} id - Privacy policy ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Response with updated privacy policy
   */
  update(id, data) {
    return axiosClient.put(`/admin/privacy-policy/${id}`, data);
  },
};

export default privacyPolicyApi;
