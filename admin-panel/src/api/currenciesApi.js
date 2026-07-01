// src/api/currenciesApi.js
import axiosClient from './axiosClient';

const currenciesApi = {
  /**
   * Get all currencies
   * @returns {Promise} Response with array of currencies
   */
  getCurrencies() {
    return axiosClient.get('/admin/currencies');
  },

  /**
   * Get a specific currency
   * @param {number} id - Currency ID
   * @returns {Promise} Response with currency data
   */
  getCurrency(id) {
    return axiosClient.get(`/admin/currencies/${id}`);
  },

  /**
   * Create a new currency
   * @param {Object} data - Currency data
   * @returns {Promise} Response with created currency data
   */
  createCurrency(data) {
    return axiosClient.post('/admin/currencies', data);
  },

  /**
   * Update an existing currency
   * @param {number} id - Currency ID
   * @param {Object} data - Updated currency data
   * @returns {Promise} Response with updated currency data
   */
  updateCurrency(id, data) {
    return axiosClient.patch(`/admin/currencies/${id}`, data);
  },

  /**
   * Delete a currency
   * @param {number} id - Currency ID
   * @returns {Promise} Response with success message
   */
  deleteCurrency(id) {
    return axiosClient.delete(`/admin/currencies/${id}`);
  },
};

export default currenciesApi;
