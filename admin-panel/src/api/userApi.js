// src/api/userApi.js
import axiosClient from './axiosClient';

const userApi = {
  /**
   * Get paginated list of all users with optional search and sorting
   *
   * According to API_ADMIN_MODULE.md, the API only supports:
   * - page, limit, search, sort_by, sort_order
   *
   * Role, status, and verification filters are NOT supported server-side
   * and must be handled client-side.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page (max 100)
   * @param {string} [params.search] - Search in username or email (server-side)
   * @param {string} [params.sort_by=created_at] - Field to sort by (server-side)
   * @param {string} [params.sort_order=DESC] - Sort order: ASC or DESC (server-side)
   * @returns {Promise} Response with data array and meta pagination info
   */
  getUsers(params = {}) {
    // Enhanced filters according to API_ADMIN_MODULE.md v4.0.0
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.role && params.role !== 'all' && { role: params.role }),
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
      ...(params.is_verified !== undefined &&
        params.is_verified !== null && { is_verified: params.is_verified }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
      ...(params.user_id && { user_id: params.user_id }),
    };

    // Remove undefined/null values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/users', { params: cleanedParams });
  },

  /**
   * Get detailed information about a specific user
   * @param {number} id - User ID
   * @returns {Promise} Response with user data including profile and follower counts
   */
  getUser(id) {
    return axiosClient.get(`/admin/users/${id}`);
  },

  /**
   * Update user's active status, verification status, or role
   * @param {number} id - User ID
   * @param {Object} data - Status update data
   * @param {boolean} [data.is_active] - User active status
   * @param {boolean} [data.is_verified] - User verified status
   * @param {string} [data.role] - User role (admin, sub_admin, pro_user, user)
   * @returns {Promise} Response with updated user data
   */
  updateUserStatus(id, data) {
    return axiosClient.put(`/admin/users/${id}/status`, data);
  },

  /**
   * Delete (soft delete) a user account. Sets is_deleted = true; user cannot log in.
   * @param {number} id - User ID
   * @returns {Promise} Response with success message
   */
  deleteUser(id) {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  /**
   * Get paginated list of SOFT-DELETED users.
   * Admin only. These users are hidden from getUsers() and cannot log in.
   */
  getDeletedUsers(params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get('/admin/users/deleted', { params: cleanedParams });
  },

  /**
   * Restore a soft-deleted user (reverses deleteUser).
   * Fails if another active user has taken the same email/username.
   */
  restoreUser(id) {
    return axiosClient.put(`/admin/users/${id}/restore`);
  },

  /**
   * Permanently delete a user from the database (hard delete).
   * Only allowed when the user has NO content (posts, polls, comments).
   */
  hardDeleteUser(id) {
    return axiosClient.delete(`/admin/users/${id}/hard`);
  },

  /**
   * Get all posts created by a specific user (paginated)
   * @param {number} userId - User ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with user's posts
   */
  getUserPosts(userId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/users/${userId}/posts`, { params: cleanedParams });
  },

  /**
   * Get all communities a user is a member of (paginated)
   * @param {number} userId - User ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with user's communities
   */
  getUserCommunities(userId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/users/${userId}/communities`, { params: cleanedParams });
  },

  /**
   * Get all comments made by a specific user (paginated)
   * @param {number} userId - User ID
   * @param {Object} [params={}] - Query parameters (page, limit, search, sort_by, sort_order)
   * @returns {Promise} Response with user's comments
   */
  getUserComments(userId, params = {}) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );
    return axiosClient.get(`/admin/users/${userId}/comments`, { params: cleanedParams });
  },

  /**
   * Get comprehensive statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise} Response with user statistics
   */
  getUserStats(userId) {
    return axiosClient.get(`/admin/users/${userId}/stats`);
  },

  /**
   * Get the authenticated user's own profile (non-admin endpoint)
   * Uses /api/users/profile which reads the userId from the JWT token.
   * This is intended for the logged-in admin/sub_admin to manage their own profile.
   */
  getOwnProfile() {
    return axiosClient.get('/ma/users/profile');
  },

  /**
   * Update the authenticated user's own profile (non-admin endpoint)
   * Uses /api/users/profile (PUT) and supports the same fields as the public User Profile API.
   * Can accept plain JSON or FormData when uploading profile images.
   *
   * @param {Object|FormData} data - Profile update payload
   */
  updateOwnProfile(data) {
    const config =
      data instanceof FormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : {};

    return axiosClient.put('/ma/users/profile', data, config);
  },

  /**
   * Create a new user
   * Admin can create users with email or phone number (one is optional but at least one must be provided)
   * @param {Object} data - User data
   * @param {string} data.username - Unique username (required)
   * @param {string} [data.email] - User email address (required if phone_number not provided)
   * @param {string} [data.phone_number] - User phone number (required if email not provided)
   * @param {string} [data.password] - User password (min 6 chars, required for email/phone auth)
   * @param {string} [data.auth_type] - Auth type: email, phone, google, apple (auto-determined if not provided)
   * @param {string} [data.role=user] - User role: admin, sub_admin, pro_user, user (default: user)
   * @param {string} [data.device_id] - Device identifier for tracking
   * @param {string} [data.device_type] - Device type (web, ios, android)
   * @param {string} [data.device_token] - Push notification token
   * @returns {Promise} Response with created user data
   */
  createUser(data) {
    return axiosClient.post('/admin/users', data);
  },

  /**
   * Update user information including username, email, password, role, auth_type, and status fields
   * @param {number} id - User ID
   * @param {Object|FormData} data - User update data (all fields optional) or FormData for file uploads
   * @param {string} [data.username] - New username (must be unique)
   * @param {string} [data.email] - New email address (must be unique, required if phone_number not provided)
   * @param {string} [data.phone_number] - New phone number (required if email not provided)
   * @param {string} [data.password] - New password (min 6 chars, clears tokens on update)
   * @param {string} [data.auth_type] - Auth type: email, phone, google, apple
   * @param {string} [data.role] - User role: admin, sub_admin, pro_user, user
   * @param {string} [data.is_active] - Status: active or inactive
   * @param {string} [data.is_verified] - Status: verified or unverified
   * @returns {Promise} Response with updated user data
   */
  updateUser(id, data) {
    // If FormData, set proper headers for multipart/form-data
    const config =
      data instanceof FormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : {};

    return axiosClient.put(`/admin/users/${id}`, data, config);
  },

  /**
   * Export all users matching filters (bypasses pagination)
   * @param {Object} [params={}] - Filter parameters
   * @returns {Promise} Response with full user dataset
   */
  exportUsers(params = {}) {
    const queryParams = {
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      sort_by: params.sort_by || 'created_at',
      sort_order: params.sort_order || 'DESC',
      ...(params.role && params.role !== 'all' && { role: params.role }),
      ...(params.is_active !== undefined &&
        params.is_active !== null && { is_active: params.is_active }),
      ...(params.is_verified !== undefined &&
        params.is_verified !== null && { is_verified: params.is_verified }),
      ...(params.created_from && { created_from: params.created_from }),
      ...(params.created_to && { created_to: params.created_to }),
      ...(params.user_id && { user_id: params.user_id }),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null),
    );

    return axiosClient.get('/admin/users/export', { params: cleanedParams });
  },
};

export default userApi;
