// src/api/supportApi.js
import axiosClient from './axiosClient';

const supportApi = {
  /**
   * Get the active support info (public)
   * @returns {Promise} Response with active support data
   */
  getActive() {
    return axiosClient.get('/support');
  },

  /**
   * Get support info for admin (any status)
   * @returns {Promise} Response with support data
   */
  getAdmin() {
    return axiosClient.get('/admin/support');
  },

  /**
   * Create a new support record
   * @param {Object} data - { email, phone, whatsapp, website, address, is_active? }
   * @returns {Promise} Response with created support data
   */
  create(data) {
    return axiosClient.post('/admin/support', data);
  },

  /**
   * Update an existing support record
   * @param {number} id - Support ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Response with updated support data
   */
  update(id, data) {
    return axiosClient.put(`/admin/support/${id}`, data);
  },
};

export default supportApi;
