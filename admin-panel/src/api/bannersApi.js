// src/api/bannersApi.js
import axiosClient from './axiosClient';

const bannersApi = {
  /**
   * Get paginated list of all banners (admin)
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search]
   * @param {string} [params.sort_by='display_order']
   * @param {string} [params.sort_order='DESC']
   * @param {string} [params.banner_type] - 'promotion' | 'ad' | 'announcement'
   * @param {boolean} [params.is_active]
   */
  getBanners(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'display_order',
      sort_order: params.sort_order || 'DESC',
      ...(params.banner_type &&
        params.banner_type !== 'all' && { banner_type: params.banner_type }),
      ...(params.is_active !== undefined &&
        params.is_active !== null &&
        params.is_active !== 'all' && {
          is_active: params.is_active === 'active' || params.is_active === true,
        }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null),
    );

    return axiosClient.get('/admin/banners', { params: cleanedParams });
  },

  /** Get a single banner by ID */
  getBanner(id) {
    return axiosClient.get(`/admin/banners/${id}`);
  },

  /** Create a new banner (FormData with banner_image file required) */
  createBanner(data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      return axiosClient.post('/admin/banners', data);
    }
    const payload = { ...data };
    if (payload.is_active !== undefined) {
      payload.is_active =
        payload.is_active === true || payload.is_active === 'active' ? 'active' : 'inactive';
    }
    return axiosClient.post('/admin/banners', payload);
  },

  /** Update an existing banner (FormData for image replacement) */
  updateBanner(id, data) {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      return axiosClient.put(`/admin/banners/${id}`, data);
    }
    const payload = { ...data };
    if (payload.is_active !== undefined) {
      payload.is_active =
        payload.is_active === true || payload.is_active === 'active' ? 'active' : 'inactive';
    }
    return axiosClient.put(`/admin/banners/${id}`, payload);
  },

  /** Quick status toggle (active/inactive) */
  updateBannerStatus(id, isActive) {
    const status = isActive === true || isActive === 'active' ? 'active' : 'inactive';
    return axiosClient.put(`/admin/banners/${id}`, { is_active: status });
  },

  /** Delete a banner */
  deleteBanner(id) {
    return axiosClient.delete(`/admin/banners/${id}`);
  },
};

export default bannersApi;
