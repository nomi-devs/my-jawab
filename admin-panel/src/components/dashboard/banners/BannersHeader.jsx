// src/components/dashboard/banners/BannersHeader.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Plus, Search, X } from 'lucide-react';
import RefreshButton from '../../common/RefreshButton';

const BannersHeader = React.memo(
  ({
    searchTerm = '',
    statusFilter = 'all',
    typeFilter = 'all',
    sortBy = 'display_order',
    sortOrder = 'DESC',
    onSearch,
    onStatusFilter,
    onTypeFilter,
    onSortByChange,
    onSortOrderToggle,
    onAddClick,
    onRefresh,
    loading = false,
    totalBanners = 0,
  }) => {
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const timeoutRef = useRef(null);

    useEffect(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (localSearch === searchTerm) return;
      timeoutRef.current = setTimeout(() => {
        onSearch?.(localSearch);
      }, 500);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [localSearch, onSearch, searchTerm]);

    const hasActiveFilters = useMemo(
      () => !!localSearch || statusFilter !== 'all' || typeFilter !== 'all',
      [localSearch, statusFilter, typeFilter],
    );

    const clearFilters = () => {
      setLocalSearch('');
      onSearch?.('');
      onStatusFilter?.('all');
      onTypeFilter?.('all');
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 transition-colors">
        {/* Top row title + add button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ImageIcon className="text-purple-600 w-5 h-5" />
              Banners
              <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {totalBanners}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Manage promotional and ad banners shown in the mobile app feed.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <RefreshButton
              onClick={onRefresh}
              loading={loading}
              title="Refresh banners"
              size={18}
            />
            <button
              onClick={onAddClick}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-medium shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus size={14} />
              Add Banner
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter?.(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilter?.(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
          >
            <option value="all">All Types</option>
            <option value="promotion">Promotion</option>
            <option value="ad">Ad</option>
            <option value="announcement">Announcement</option>
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange?.(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
          >
            <option value="display_order">Sort: Order</option>
            <option value="created_at">Sort: Date</option>
            <option value="banner_title">Sort: Title</option>
          </select>

          {/* Sort order */}
          <button
            onClick={onSortOrderToggle}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 font-medium"
            title="Toggle sort order"
          >
            <span>{sortOrder === 'DESC' ? '↓' : '↑'}</span>
            <span>{sortOrder === 'DESC' ? 'Desc' : 'Asc'}</span>
          </button>

          {/* Clear filters */}
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30'
                : 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>
    );
  },
);

export default BannersHeader;
