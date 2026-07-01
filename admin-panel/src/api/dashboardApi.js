// src/api/dashboardApi.js
import axiosClient from './axiosClient';

const dashboardApi = {
  /**
   * Get comprehensive dashboard statistics with time range support, trends, and engagement metrics
   *
   * According to API_ADMIN_MODULE.md:
   * - Endpoint: GET /api/admin/dashboard/stats
   * - Query params: time_range OR (start_date + end_date)
   * - time_range options: week, month, year, all (default: all)
   * - Cannot use time_range together with start_date/end_date
   * - Both start_date and end_date are required together when using custom dates
   *
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.time_range] - Time range: 'week', 'month', 'year', 'all' (default: 'all')
   *   - week: Last 7 days (including today)
   *   - month: Last 30 days (including today)
   *   - year: Last 365 days (including today)
   *   - all: All-time statistics (no date filtering)
   * @param {string} [params.start_date] - Custom start date (ISO date string, e.g., '2024-01-01')
   *   - Must be used with end_date
   *   - Cannot be used with time_range
   *   - Must be before end_date
   * @param {string} [params.end_date] - Custom end date (ISO date string, e.g., '2024-01-31')
   *   - Must be used with start_date
   *   - Cannot be used with time_range
   *   - Must be after start_date
   * @returns {Promise} Response with dashboard statistics including trends, top posts, top users, recent activity
   */
  getDashboardStats(params = {}) {
    // Validate parameters according to API requirements
    const hasTimeRange = params.time_range && params.time_range.trim();
    const hasStartDate = params.start_date && params.start_date.trim();
    const hasEndDate = params.end_date && params.end_date.trim();

    // Cannot use time_range together with custom dates
    if (hasTimeRange && (hasStartDate || hasEndDate)) {
      return Promise.reject(
        new Error(
          'Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.',
        ),
      );
    }

    // If using custom dates, both are required
    if ((hasStartDate && !hasEndDate) || (!hasStartDate && hasEndDate)) {
      return Promise.reject(
        new Error(
          'Both start_date and end_date are required together when using custom date range.',
        ),
      );
    }

    // Validate time_range value if provided
    if (hasTimeRange) {
      const validTimeRanges = ['week', 'month', 'year', 'all'];
      if (!validTimeRanges.includes(params.time_range)) {
        return Promise.reject(
          new Error(`Invalid time_range. Must be one of: ${validTimeRanges.join(', ')}`),
        );
      }
    }

    // Build query parameters
    const queryParams = {};

    if (hasTimeRange) {
      queryParams.time_range = params.time_range;
    } else if (hasStartDate && hasEndDate) {
      queryParams.start_date = params.start_date;
      queryParams.end_date = params.end_date;
    }
    // If neither is provided, API will default to 'all'

    // Remove null/undefined values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null && value !== ''),
    );

    return axiosClient.get('/admin/dashboard/stats', { params: cleanedParams });
  },

  /**
   * Get user growth data with historical breakdown
   *
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.time_range] - Time range: 'week', 'month', 'year', 'all' (default: 'all')
   * @param {string} [params.start_date] - Custom start date (ISO date string, e.g., '2024-01-01')
   * @param {string} [params.end_date] - Custom end date (ISO date string, e.g., '2024-01-31')
   * @returns {Promise} Response with user growth data including date, count, and cumulative count
   */
  getUserGrowth(params = {}) {
    // Validate parameters (same as dashboard stats)
    const hasTimeRange = params.time_range && params.time_range.trim();
    const hasStartDate = params.start_date && params.start_date.trim();
    const hasEndDate = params.end_date && params.end_date.trim();

    // Cannot use time_range together with custom dates
    if (hasTimeRange && (hasStartDate || hasEndDate)) {
      return Promise.reject(
        new Error(
          'Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.',
        ),
      );
    }

    // If using custom dates, both are required
    if ((hasStartDate && !hasEndDate) || (!hasStartDate && hasEndDate)) {
      return Promise.reject(
        new Error(
          'Both start_date and end_date are required together when using custom date range.',
        ),
      );
    }

    // Validate time_range value if provided
    if (hasTimeRange) {
      const validTimeRanges = ['week', 'month', 'year', 'all'];
      if (!validTimeRanges.includes(params.time_range)) {
        return Promise.reject(
          new Error(`Invalid time_range. Must be one of: ${validTimeRanges.join(', ')}`),
        );
      }
    }

    // Build query parameters
    const queryParams = {};

    if (hasTimeRange) {
      queryParams.time_range = params.time_range;
    } else if (hasStartDate && hasEndDate) {
      queryParams.start_date = params.start_date;
      queryParams.end_date = params.end_date;
    }
    // If neither is provided, API will default to 'all'

    // Remove null/undefined values
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value != null && value !== ''),
    );

    return axiosClient.get('/admin/dashboard/user-growth', { params: cleanedParams });
  },
};

export default dashboardApi;
