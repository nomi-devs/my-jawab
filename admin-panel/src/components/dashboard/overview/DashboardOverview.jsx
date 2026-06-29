// src/components/dashboard/overview/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Crown,
  Globe,
  FileText,
  MessageCircle,
  Hash,
  CheckCircle,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  X,
  Heart
} from 'lucide-react';
import StatCard from './StatCard';
import UserGrowthGraph from './UserGrowthGraph';
import { useDashboardStats, useUserGrowth } from '../../../hooks/useDashboard';

const DashboardOverview = () => {
  const navigate = useNavigate();
  // State for filters
  const [timeRange, setTimeRange] = useState('all'); // week, month, year, all
  const [filterMode, setFilterMode] = useState('time_range'); // 'time_range' or 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format numbers with K/M suffix
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    const numValue = Number(num);

    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    }
    if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    }
    return numValue.toString();
  };

  // Get trend from API response
  const getTrend = (trendKey, trends) => {
    if (!trends || !trends[trendKey]) return null;
    const change = trends[trendKey];
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Get max date for date picker (today)
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Determine effective query parameters
  const queryParams = React.useMemo(() => {
    if (filterMode === 'time_range') {
      if (timeRange && timeRange !== 'all') {
        return { time_range: timeRange };
      }
      return {}; // 'all'
    } else if (filterMode === 'custom') {
      // Return null or partial params if invalid, to control 'enabled' if desired, 
      // or just return what we have and let API validate/fail.
      // But for smooth UX, we might want to wait until both are set.
      if (startDate && endDate) {
        return { start_date: startDate, end_date: endDate };
      }
    }
    return {};
  }, [filterMode, timeRange, startDate, endDate]);

  const isValidCustomRange = filterMode === 'custom' ? (startDate && endDate) : true;

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isError: statsError,
    error: statsErrorObj,
    refetch: refetchStats
  } = useDashboardStats(
    // Only pass params if valid custom range or time range mode. 
    // If invalid custom range, we pass empty obj but 'enabled' will block it.
    isValidCustomRange ? queryParams : {}
  );

  const {
    data: userGrowthData,
    isLoading: growthLoading,
    isFetching: growthFetching,
    refetch: refetchGrowth
  } = useUserGrowth(
    isValidCustomRange ? queryParams : {}
  );

  // Handle refresh
  const handleRefresh = () => {
    refetchStats();
    refetchGrowth();
  };

  const loading = statsFetching || growthFetching;
  const error = statsError ? (
    statsErrorObj?.response?.data?.message ||
    statsErrorObj?.message ||
    'Failed to load dashboard statistics'
  ) : null;

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setFilterMode('time_range');
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    setFilterMode('custom');
    setTimeRange('all');
    setShowDatePicker(true);
  };

  // Apply custom date range
  const applyCustomDateRange = () => {
    if (!startDate || !endDate) {
      // Logic handled by memoized params & hook enabled check, 
      // but UI might want to show error if user tries to apply invalid range manually?
      // Actually with auto-fetch on state change, we don't have an "Apply" button usually?
      // The logic in previous code was auto-fetching when date changed.
      // But 'custom' mode requires valid dates.
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      // setError not available for local validation easily without state.
      // But we can let API handle it or just rely on inputs.
      return;
    }

    setShowDatePicker(false);
  };

  // Clear custom date range
  const clearCustomDateRange = () => {
    setStartDate('');
    setEndDate('');
    setFilterMode('time_range');
    setTimeRange('all');
    setShowDatePicker(false);
  };



  // Prepare stat cards data from API response
  const getStatCardsData = () => {
    if (!stats) return [];

    const trends = stats.trends || {};

    return [
      {
        title: 'Total Users',
        count: formatNumber(stats.total_users),
        icon: Users,
        trend: getTrend('total_users_change', trends),
        description: `${formatNumber(stats.active_users)} active • ${formatNumber(stats.recent_users || 0)} new`
      },
      {
        title: 'Pro Users',
        count: formatNumber(stats.pro_users),
        icon: Crown,
        trend: getTrend('pro_users_change', trends),
        description: stats.total_users > 0 ? `${Math.round((stats.pro_users / stats.total_users) * 100)}% of total users` : '0% of total users'
      },
      {
        title: 'Communities',
        count: formatNumber(stats.total_communities),
        icon: Globe,
        trend: getTrend('total_communities_change', trends),
        description: `${formatNumber(stats.active_communities)} active communities`
      },
      {
        title: 'Total Posts',
        count: formatNumber(stats.total_posts),
        icon: FileText,
        trend: getTrend('total_posts_change', trends),
        description: `${formatNumber(stats.published_posts)} published • ${formatNumber(stats.recent_posts || 0)} new`
      },
      {
        title: 'Comments',
        count: formatNumber(stats.total_comments),
        icon: MessageCircle,
        trend: getTrend('total_comments_change', trends),
        description: stats.engagement_rate ? `Engagement: ${stats.engagement_rate.toFixed(1)}%` : 'Comments across all posts'
      },
      {
        title: 'Topics',
        count: formatNumber(stats.total_topics),
        icon: Hash,
        trend: getTrend('total_topics_change', trends),
        description: `${formatNumber(stats.active_topics)} active topics`
      },
      {
        title: 'Verified Users',
        count: formatNumber(stats.verified_users),
        icon: CheckCircle,
        trend: getTrend('verified_users_change', trends),
        description: stats.total_users > 0 ? `${Math.round((stats.verified_users / stats.total_users) * 100)}% verification rate` : '0% verification rate'
      },
      {
        title: 'Published Polls',
        count: formatNumber(stats.published_polls),
        icon: BarChart2,
        trend: getTrend('published_polls_change', trends),
        description: `${formatNumber(stats.total_polls)} total polls created`
      },
    ];
  };

  // Generate chart data from real user growth data
  const generateChartData = () => {
    // If we have real user growth data, use it
    if (userGrowthData && userGrowthData.data && userGrowthData.data.length > 0) {
      const growthData = userGrowthData.data;
      const maxCount = Math.max(...growthData.map(item => item.cumulative || item.count), 1);

      return growthData.map((item, index) => {
        // Calculate height based on cumulative count
        const count = item.cumulative || item.count || 0;
        const height = maxCount > 0 ? Math.max(2, (count / maxCount) * 100) : 2;

        // Format date label - ensure proper date parsing
        let label = item.date;
        if (item.date && item.date.includes('-')) {
          const dateParts = item.date.split('-');
          if (dateParts.length === 3) {
            // Daily format: YYYY-MM-DD
            try {
              const date = new Date(item.date + 'T00:00:00'); // Add time to avoid timezone issues
              if (!isNaN(date.getTime())) {
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              } else {
                // Fallback if date parsing fails
                label = `${dateParts[1]}/${dateParts[2]}`;
              }
            } catch (e) {
              label = `${dateParts[1]}/${dateParts[2]}`;
            }
          } else if (dateParts.length === 2 && !item.date.includes('W')) {
            // Monthly format: YYYY-MM
            try {
              const date = new Date(item.date + '-01T00:00:00');
              if (!isNaN(date.getTime())) {
                label = date.toLocaleDateString('en-US', { month: 'short' });
              } else {
                label = dateParts[1];
              }
            } catch (e) {
              label = dateParts[1];
            }
          } else if (item.date.includes('W')) {
            // Weekly format: YYYY-WXX
            label = item.date.replace('W', ' Week ');
          }
        }

        // Show label for every nth item to avoid crowding
        const showLabel = index % Math.max(1, Math.floor(growthData.length / 7)) === 0 ||
          index === growthData.length - 1 ||
          index === 0;

        return {
          height: Math.max(2, Math.min(100, height)),
          value: item.count || 0,
          cumulative: item.cumulative || 0,
          label: label,
          showLabel: showLabel,
          date: item.date
        };
      });
    }

    // Fallback: return empty array if no data
    return [];
  };

  // Loading state
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-purple-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-purple-100 dark:border-gray-700 animate-pulse transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-purple-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors">Dashboard Overview</h2>
              <p className="text-gray-500 dark:text-gray-400 transition-colors">Welcome to your daily social analysis.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-purple-100 dark:border-gray-700 text-center transition-colors">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors">Error Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const chartData = generateChartData();
  const statCardsData = getStatCardsData();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-purple-100 dark:border-gray-700 transition-colors">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">Dashboard Overview</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">Welcome to your daily social analysis.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}

              {/* Time Range Buttons */}
              {filterMode === 'time_range' && (
                <div className="flex items-center bg-purple-50 dark:bg-gray-700 rounded-lg p-1 transition-colors">
                  {['week', 'month', 'year', 'all'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTimeRangeChange(range)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeRange === range
                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                      disabled={loading}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Date Range */}
              {filterMode === 'custom' && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-gray-700 rounded-lg p-1.5 transition-colors">
                  <Calendar size={16} className="text-purple-600 dark:text-purple-400" />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || getMaxDate()}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded border border-purple-200 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                      disabled={loading}
                    />
                    <span className="text-gray-500 dark:text-gray-400 text-xs">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={getMaxDate()}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded border border-purple-200 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                      disabled={loading}
                    />
                    <button
                      onClick={clearCustomDateRange}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      disabled={loading}
                      title="Clear custom date range"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle to Custom Date Range */}
              {filterMode === 'time_range' && (
                <button
                  onClick={handleCustomDateRange}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5 border border-purple-200 dark:border-gray-600"
                >
                  <Calendar size={14} />
                  Custom Range
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh statistics"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts / Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-purple-100 dark:border-gray-700 transition-colors w-full overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">User Growth</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {filterMode === 'custom' && startDate && endDate
                  ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : timeRange === 'week' ? 'Last 7 days' :
                    timeRange === 'month' ? 'Last 30 days' :
                      timeRange === 'year' ? 'Last 365 days' :
                        'All time'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(stats?.trends?.total_users_change !== undefined && stats?.trends?.total_users_change !== null && stats.trends.total_users_change !== 0) && (
                <div className={`flex items-center gap-1 text-sm transition-colors ${stats.trends.total_users_change > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}>
                  {stats.trends.total_users_change > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  <span>{stats.trends.total_users_change > 0 ? '+' : ''}{stats.trends.total_users_change.toFixed(1)}% growth</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Engagement: {stats?.engagement_rate && stats.engagement_rate > 0 && (stats.engagement_rate.toFixed(1))}%</span>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          {growthLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : chartData.length > 0 ? (
            <UserGrowthGraph data={chartData} formatNumber={formatNumber} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No chart data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Trending Topics */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">Trending Topics</h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full transition-colors">
              {stats?.trending_topics?.length || 0} topics
            </span>
          </div>

          <div className="space-y-3">
            {stats?.trending_topics?.slice(0, 5).map((topic, i) => {
              const maxUsage = Math.max(...(stats.trending_topics?.map(t => t.usage_count) || [100]));
              const widthPercentage = (topic.usage_count / maxUsage) * 100;

              return (
                <div key={topic.topic_id} className="group">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {topic.topic_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-gray-400 transition-colors">{formatNumber(topic.usage_count)} uses</span>
                      {i < 3 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                            'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                          } transition-colors`}>
                          #{i + 1}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-purple-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full purple-gradient rounded-full transition-all duration-500"
                      style={{ width: `${widthPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    <span>{formatNumber(topic.community_count)} communities</span>
                    <span>{formatNumber(topic.post_count)} posts</span>
                  </div>
                </div>
              );
            })}

            {(!stats?.trending_topics || stats.trending_topics.length === 0) && (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Hash className="text-gray-400 dark:text-gray-500" size={24} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 transition-colors">No trending topics data available</p>
              </div>
            )}
          </div>

          {stats?.trending_topics && stats.trending_topics.length > 5 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => navigate('/topics')}
                className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                View all {stats.trending_topics.length} topics →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-purple-100 dark:border-gray-700 transition-colors">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 transition-colors">Content Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Published Posts</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.published_posts && stats.published_posts > 0 && formatNumber(stats.published_posts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Draft Posts</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.draft_posts && stats.draft_posts > 0 && formatNumber(stats.draft_posts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Total Comments</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_comments && stats.total_comments > 0 && formatNumber(stats.total_comments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Published Polls</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.published_polls && stats.published_polls > 0 && formatNumber(stats.published_polls)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-purple-100 dark:border-gray-700 transition-colors">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 transition-colors">User Engagement</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Active Users</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.active_users && stats.active_users > 0 && formatNumber(stats.active_users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Daily Active</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.daily_active_users && stats.daily_active_users > 0 && formatNumber(stats.daily_active_users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Weekly Active</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.weekly_active_users && stats.weekly_active_users > 0 && formatNumber(stats.weekly_active_users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Monthly Active</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.monthly_active_users && stats.monthly_active_users > 0 && formatNumber(stats.monthly_active_users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Engagement Rate</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.engagement_rate && stats.engagement_rate > 0 && (stats.engagement_rate.toFixed(1))}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-purple-100 dark:border-gray-700 transition-colors">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 transition-colors">Platform Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Active Communities</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.active_communities && stats.active_communities > 0 && formatNumber(stats.active_communities)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Active Topics</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.active_topics && stats.active_topics > 0 && formatNumber(stats.active_topics)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Total Polls</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{stats?.total_polls && stats.total_polls > 0 && formatNumber(stats.total_polls)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Content Ratio</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                {stats?.total_posts && stats?.total_comments
                  ? `1:${Math.round(stats.total_comments / stats.total_posts)}`
                  : '1:0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts & Users Section */}
      {(stats?.top_posts?.length > 0 || stats?.top_users?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Top Posts */}
          {stats?.top_posts?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">Top Posts</h3>
                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full transition-colors">
                  {stats.top_posts.length} posts
                </span>
              </div>
              <div className="space-y-3">
                {stats.top_posts.slice(0, 5).map((post, i) => (
                  <div key={post.id} className="group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {i < 3 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                                'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                              } transition-colors`}>
                              #{i + 1}
                            </span>
                          )}
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {post.post_title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                          <span>@{post.user?.username || 'Unknown'}</span>
                          {(post.like_count > 0) && (
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatNumber(post.like_count)}
                            </span>
                          )}
                          {(post.comment_count > 0) && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {formatNumber(post.comment_count)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Users */}
          {stats?.top_users?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">Top Users</h3>
                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full transition-colors">
                  {stats.top_users.length} users
                </span>
              </div>
              <div className="space-y-3">
                {stats.top_users.slice(0, 5).map((user, i) => (
                  <div key={user.id} className="group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {i < 3 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                              'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                            } transition-colors`}>
                            #{i + 1}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {user.username || user.email}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
                            {(user.post_count > 0) && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {formatNumber(user.post_count)} posts
                              </span>
                            )}
                            {(user.comment_count > 0) && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {formatNumber(user.comment_count)} comments
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recent_activity?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 mt-4 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">Recent Activity</h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full transition-colors">
              {stats.recent_activity.length} activities
            </span>
          </div>
          <div className="space-y-2">
            {stats.recent_activity.slice(0, 10).map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'post'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  } transition-colors`}>
                  {activity.type === 'post' ? <FileText size={14} /> : <MessageCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors">
                    {activity.type === 'post' ? activity.title : activity.content}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                      @{activity.user?.username || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 transition-colors">•</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
                      {activity.created_at ? new Date(activity.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;