// src/api/searchApi.js
import axiosClient from "./axiosClient";

const searchApi = {
  /**
   * Global Search (users, posts, communities, topics)
   * 
   * According to API_ADMIN_MODULE.md:
   * - Endpoint: GET /api/admin/search
   * - Query params: q (required), limit (optional, default 5, max 20)
   * - Returns: users, posts, communities, topics arrays with meta information
   * 
   * Search Fields:
   * - Users: username, email, full_name
   * - Posts: post_title, post_content, post_slug
   * - Communities: community_name, community_slug, community_description
   * - Topics: topic_name, topic_slug, topic_description
   * 
   * @param {Object} params - Query parameters
   * @param {string} params.q - Search keyword (required) - matches names, titles, slugs, emails, usernames, descriptions, content
   * @param {number} [params.limit=5] - Per-entity limit (default 5, max 20)
   * @returns {Promise} Response with users, posts, communities, topics arrays and meta
   */
  globalSearch(params) {
    if (!params.q || !params.q.trim()) {
      return Promise.reject(new Error("Search query (q) is required"));
    }

    const queryParams = {
      q: params.q.trim(),
      ...(params.limit && params.limit > 0 && params.limit <= 20 && { limit: params.limit }),
    };

    return axiosClient.get("/admin/search", { params: queryParams });
  },
};

export default searchApi;
