// src/components/dashboard/users/UsersHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Search, X, Filter, Grid, List, Download } from 'lucide-react';
import RefreshButton from '../../common/RefreshButton';
import ExportButton from '../../common/ExportButton';
import userApi from '../../../api/userApi';

const UsersHeader = React.memo(
  ({
    userCount,
    onAddClick,
    onSearch,
    onRoleFilter,
    onStatusFilter,
    onVerifiedFilter,
    onSortChange,
    viewMode = 'list',
    onViewModeChange,
    loading = false,
    searchTerm = '',
    roleFilter = 'all',
    statusFilter = 'all',
    verifiedFilter = 'all',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    onRefresh,
  }) => {
    const { t } = useTranslation('users');
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [selectedRole, setSelectedRole] = useState(roleFilter);
    const [selectedStatus, setSelectedStatus] = useState(statusFilter);
    const [selectedVerified, setSelectedVerified] = useState(verifiedFilter);
    const [selectedSortBy, setSelectedSortBy] = useState(sortBy);
    const [selectedSortOrder, setSelectedSortOrder] = useState(sortOrder);

    // Sync local state with props
    useEffect(() => {
      setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
      setSelectedRole(roleFilter);
    }, [roleFilter]);

    useEffect(() => {
      setSelectedStatus(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
      setSelectedVerified(verifiedFilter);
    }, [verifiedFilter]);

    useEffect(() => {
      setSelectedSortBy(sortBy);
    }, [sortBy]);

    useEffect(() => {
      setSelectedSortOrder(sortOrder);
    }, [sortOrder]);

    // Debounced search
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Don't trigger if local search matches current search term
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
    }, [localSearchTerm]);

    const handleRoleChange = (e) => {
      const role = e.target.value;
      setSelectedRole(role);
      // Immediately trigger filter (no debounce needed for dropdowns)
      if (onRoleFilter) {
        onRoleFilter(role);
      }
    };

    const handleStatusChange = (e) => {
      const status = e.target.value;
      setSelectedStatus(status);
      // Immediately trigger filter (no debounce needed for dropdowns)
      if (onStatusFilter) {
        onStatusFilter(status);
      }
    };

    const handleVerifiedChange = (e) => {
      const verified = e.target.value;
      setSelectedVerified(verified);
      if (onVerifiedFilter) {
        onVerifiedFilter(verified);
      }
    };

    const handleSortByChange = (e) => {
      const sortBy = e.target.value;
      setSelectedSortBy(sortBy);
      if (onSortChange) {
        onSortChange({ sortBy, sortOrder: selectedSortOrder });
      }
    };

    const handleSortOrderChange = (e) => {
      const sortOrder = e.target.value;
      setSelectedSortOrder(sortOrder);
      if (onSortChange) {
        onSortChange({ sortBy: selectedSortBy, sortOrder });
      }
    };

    const clearFilters = () => {
      setLocalSearchTerm('');
      setSelectedRole('all');
      setSelectedStatus('all');
      setSelectedVerified('all');
      setSelectedSortBy('created_at');
      setSelectedSortOrder('DESC');
      if (onSearch) onSearch('');
      if (onRoleFilter) onRoleFilter('all');
      if (onStatusFilter) onStatusFilter('all');
      if (onVerifiedFilter) onVerifiedFilter('all');
      if (onSortChange) onSortChange({ sortBy: 'created_at', sortOrder: 'DESC' });
    };

    const hasActiveFilters =
      localSearchTerm ||
      selectedRole !== 'all' ||
      selectedStatus !== 'all' ||
      selectedVerified !== 'all' ||
      selectedSortBy !== 'created_at' ||
      selectedSortOrder !== 'DESC';

    const handleExportData = async () => {
      const params = {
        search: localSearchTerm,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        is_active:
          selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        is_verified:
          selectedVerified === 'verified'
            ? true
            : selectedVerified === 'unverified'
              ? false
              : undefined,
        sort_by: selectedSortBy,
        sort_order: selectedSortOrder,
      };

      try {
        const response = await userApi.exportUsers(params);
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
              {t('usersHeader.allUsers')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
              {loading ? (
                <span className="flex items-center">
                  <span className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin me-2"></span>
                  {t('common:loading')}
                </span>
              ) : (
                t('usersHeader.totalUsers', { count: userCount })
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
                title={t('usersHeader.listView')}
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
                title={t('usersHeader.gridView')}
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
                title={t('usersHeader.refreshUsers')}
                size={18}
              />
            )}

            {/* Export Button */}
            <ExportButton fetchData={handleExportData} filename="users_export" disabled={loading} />

            {/* Add User Button */}
            <button
              onClick={onAddClick}
              disabled={loading}
              className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              <span>{t('usersHeader.addUser')}</span>
            </button>
          </div>
        </div>

        {/* Compact Filters Row - Always Visible */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full sm:w-auto sm:min-w-[200px]">
            <Search className="absolute start-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder={t('usersHeader.searchPlaceholder')}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              disabled={loading}
              className="w-full ps-9 pe-8 py-1.5 text-sm border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            {localSearchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative flex-shrink-0">
            <Filter className="absolute start-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 pointer-events-none" />
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 ps-8 pe-6 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">{t('usersHeader.allRoles')}</option>
              <option value="user">{t('usersHeader.roleUser')}</option>
              <option value="pro_user">{t('usersHeader.roleProUser')}</option>
              <option value="admin">{t('usersHeader.roleAdmin')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 px-3 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">{t('usersHeader.allStatus')}</option>
              <option value="active">{t('common:active')}</option>
              <option value="inactive">{t('common:inactive')}</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedVerified}
              onChange={handleVerifiedChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 px-3 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">{t('usersHeader.allVerified')}</option>
              <option value="verified">{t('usersHeader.verified')}</option>
              <option value="unverified">{t('usersHeader.unverified')}</option>
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
              <option value="created_at">{t('usersHeader.sortDate')}</option>
              <option value="username">{t('usersHeader.sortUsername')}</option>
              <option value="email">{t('usersHeader.sortEmail')}</option>
              {/* Note: API docs only explicitly mention created_at, other fields may need backend support */}
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => {
              const newOrder = selectedSortOrder === 'DESC' ? 'ASC' : 'DESC';
              setSelectedSortOrder(newOrder);
              if (onSortChange) {
                onSortChange({ sortBy: selectedSortBy, sortOrder: newOrder });
              }
            }}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedSortOrder === 'DESC'
                ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-200'
                : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-200'
            }`}
            title={
              selectedSortOrder === 'DESC'
                ? t('usersHeader.sortNewestFirst')
                : t('usersHeader.sortOldestFirst')
            }
          >
            <span className="text-base leading-none">
              {selectedSortOrder === 'DESC' ? '↓' : '↑'}
            </span>
            <span className="hidden sm:inline">
              {selectedSortOrder === 'DESC' ? t('usersHeader.sortDesc') : t('usersHeader.sortAsc')}
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
            title={
              hasActiveFilters ? t('usersHeader.clearAllFilters') : t('usersHeader.noFiltersToClear')
            }
          >
            <X size={14} />
            <span>{t('usersHeader.clear')}</span>
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
                <span className="font-medium">{t('usersHeader.searchBadge')}</span>
                <span className="truncate max-w-[120px]">{localSearchTerm}</span>
                <button
                  onClick={() => setLocalSearchTerm('')}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('usersHeader.removeSearch')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedRole !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('usersHeader.roleBadge')}</span>
                <span className="capitalize">{selectedRole.replace('_', ' ')}</span>
                <button
                  onClick={() => {
                    setSelectedRole('all');
                    if (onRoleFilter) onRoleFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('usersHeader.removeRoleFilter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('usersHeader.statusBadge')}</span>
                <span className="capitalize">{selectedStatus}</span>
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    if (onStatusFilter) onStatusFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('usersHeader.removeStatusFilter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedVerified !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('usersHeader.verifiedBadge')}</span>
                <span className="capitalize">{selectedVerified}</span>
                <button
                  onClick={() => {
                    setSelectedVerified('all');
                    if (onVerifiedFilter) onVerifiedFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('usersHeader.removeVerifiedFilter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(selectedSortBy !== 'created_at' || selectedSortOrder !== 'DESC') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('usersHeader.sortBadge')}</span>
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

UsersHeader.displayName = 'UsersHeader';
export default UsersHeader;
