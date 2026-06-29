// src/api/appSettingsApi.js
import axiosClient from "./axiosClient";

const appSettingsApi = {
    /**
     * Get all application settings
     * @param {string} [group] - Optional group filter
     * @returns {Promise} Response with array of settings
     */
    getSettings(group) {
        const params = group ? { group } : {};
        return axiosClient.get("/admin/app-settings", { params });
    },

    /**
     * Get a specific setting by key
     * @param {string} key - Setting key
     * @returns {Promise} Response with setting data
     */
    getSetting(key) {
        return axiosClient.get(`/admin/app-settings/${key}`);
    },

    /**
     * Create a new setting
     * @param {Object} data - Setting data
     * @returns {Promise} Response with created setting data
     */
    createSetting(data) {
        return axiosClient.post("/admin/app-settings", data);
    },

    /**
     * Update an existing setting
     * @param {string} key - Setting key
     * @param {Object} data - Updated setting data
     * @returns {Promise} Response with updated setting data
     */
    updateSetting(key, data) {
        return axiosClient.patch(`/admin/app-settings/${key}`, data);
    },

    /**
     * Delete a setting
     * @param {string} key - Setting key
     * @returns {Promise} Response with success message
     */
    deleteSetting(key) {
        return axiosClient.delete(`/admin/app-settings/${key}`);
    }
};

export default appSettingsApi;
