// src/components/dashboard/polls/PollsHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Search, X, Filter, Grid, List, Download } from 'lucide-react';
import RefreshButton from '../../common/RefreshButton';
import ExportButton from '../../common/ExportButton';
import pollsApi from '../../../api/pollsApi';

const PollsHeader = React.memo(
  ({
    pollCount,
    onAddClick,
    onSearch,
    onStatusFilter,
    onSortChange,
    viewMode = 'list',
    onViewModeChange,
    loading = false,
    searchTerm = '',
    statusFilter = 'all',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    onRefresh,
  }) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [selectedStatus, setSelectedStatus] = useState(statusFilter);
    const [selectedSortBy, setSelectedSortBy] = useState(sortBy);
    const [selectedSortOrder, setSelectedSortOrder] = useState(sortOrder);

    // Sync local state with props
    useEffect(() => {
      setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
      setSelectedStatus(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
      setSelectedSortBy(sortBy);
    }, [sortBy]);

    useEffect(() => {
      setSelectedSortOrder(sortOrder);
    }, [sortOrder]);

    // Debounced search
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (localSearchTerm === searchTerm) return;

      searchTimeoutRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(localSearchTerm);
        }
      }, 500);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [localSearchTerm, onSearch, searchTerm]);

    const handleStatusChange = (e) => {
      const status = e.target.value;
      setSelectedStatus(status);
      if (onStatusFilter) {
        onStatusFilter(status);
      }
    };

    const handleSortByChange = (e) => {
      const newSortBy = e.target.value;
      setSelectedSortBy(newSortBy);
      if (onSortChange) {
        onSortChange({ sortBy: newSortBy, sortOrder: selectedSortOrder });
      }
    };

    const handleSortOrderToggle = () => {
      const newOrder = selectedSortOrder === 'DESC' ? 'ASC' : 'DESC';
      setSelectedSortOrder(newOrder);
      if (onSortChange) {
        onSortChange({ sortBy: selectedSortBy, sortOrder: newOrder });
      }
    };

    const clearFilters = () => {
      setLocalSearchTerm('');
      setSelectedStatus('all');
      setSelectedSortBy('created_at');
      setSelectedSortOrder('DESC');
      if (onSearch) onSearch('');
      if (onStatusFilter) onStatusFilter('all');
      if (onSortChange) onSortChange({ sortBy: 'created_at', sortOrder: 'DESC' });
    };

    const hasActiveFilters =
      localSearchTerm !== '' ||
      selectedStatus !== 'all' ||
      selectedSortBy !== 'created_at' ||
      selectedSortOrder !== 'DESC';

    const handleExportData = async () => {
      const params = {
        search: localSearchTerm,
        poll_status: selectedStatus !== 'all' ? selectedStatus : undefined,
        sort_by: selectedSortBy,
        sort_order: selectedSortOrder,
      };

      try {
        const response = await pollsApi.exportPolls(params);
        return response.data.data || [];
      } catch (error) {
        console.error('Fetch for export failed:', error);
        throw error;
      }
    };

    return (
      <div className="p-4 border-b border-purple-100 dark:border-gray-700 transition-colors">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors">
              All Polls
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
              {loading ? (
                <span className="flex items-center">
                  <span className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mr-2"></span>
                  Loading...
                </span>
              ) : (
                `Total Polls: ${pollCount}`
              )}
            </p>
          </div>

          {/* View Toggle, Refresh and Add Button */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-purple-50 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => onViewModeChange && onViewModeChange('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-600/50'}`}
                title="List View"
                disabled={loading}
              >
                <List
                  size={16}
                  className={
                    viewMode === 'list'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                />
              </button>
              <button
                onClick={() => onViewModeChange && onViewModeChange('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-600/50'}`}
                title="Grid View"
                disabled={loading}
              >
                <Grid
                  size={16}
                  className={
                    viewMode === 'grid'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                />
              </button>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <RefreshButton
                onClick={onRefresh}
                loading={loading}
                title="Refresh polls"
                size={18}
              />
            )}

            {/* Export Button */}
            <ExportButton fetchData={handleExportData} filename="polls_export" disabled={loading} />

            {/* Add Poll Button */}
            <button
              onClick={onAddClick}
              disabled={loading}
              className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 size={16} />
              <span>Add Poll</span>
            </button>
          </div>
        </div>

        {/* Compact Filters Row - Always Visible */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full sm:w-auto sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search polls..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-8 py-1.5 text-sm border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            {localSearchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative flex-shrink-0">
            <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 pl-8 pr-6 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedSortBy}
              onChange={handleSortByChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 px-3 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="created_at">Sort: Date</option>
              <option value="vote_count">Sort: Votes</option>
              <option value="view_count">Sort: Views</option>
              <option value="poll_title">Sort: Title</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={handleSortOrderToggle}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedSortOrder === 'DESC'
                ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-200'
                : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-200'
            }`}
            title={`Sort ${selectedSortOrder === 'DESC' ? 'Newest first (↓)' : 'Oldest first (↑)'}`}
          >
            <span className="text-base leading-none">
              {selectedSortOrder === 'DESC' ? '↓' : '↑'}
            </span>
            <span className="hidden sm:inline">
              {selectedSortOrder === 'DESC' ? 'Desc' : 'Asc'}
            </span>
          </button>

          {/* Clear Filters Button - Always visible, disabled when no filters active */}
          <button
            onClick={clearFilters}
            disabled={loading || !hasActiveFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30'
                : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={hasActiveFilters ? 'Clear all filters' : 'No filters to clear'}
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        </div>

        {/* Active Filters Badges - Compact Display with Smooth Transitions */}
        <div
          className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
            hasActiveFilters ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {localSearchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">Search:</span>
                <span className="truncate max-w-[120px]">{localSearchTerm}</span>
                <button
                  onClick={() => setLocalSearchTerm('')}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ml-0.5 transition-colors"
                  title="Remove search"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">Status:</span>
                <span className="capitalize">{selectedStatus}</span>
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    if (onStatusFilter) onStatusFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ml-0.5 transition-colors"
                  title="Remove status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(selectedSortBy !== 'created_at' || selectedSortOrder !== 'DESC') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">Sort:</span>
                <span className="capitalize">
                  {selectedSortBy.replace('_', ' ')} {selectedSortOrder}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

PollsHeader.displayName = 'PollsHeader';
export default PollsHeader;
