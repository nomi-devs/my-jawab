// src/components/dashboard/payments/PaymentsHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Search, X, Filter, Grid, List, Download } from 'lucide-react';
import RefreshButton from '../../common/RefreshButton';
import ExportButton from '../../common/ExportButton';
import paymentsApi from '../../../api/paymentsApi';

const PaymentsHeader = React.memo(
  ({
    paymentCount,
    onAddClick,
    onSearch,
    onStatusFilter,
    onMethodFilter,
    onSortChange,
    viewMode = 'list',
    onViewModeChange,
    loading = false,
    searchTerm = '',
    statusFilter = 'all',
    methodFilter = 'all',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    onRefresh,
  }) => {
    const { t } = useTranslation('payments');
    const statusLabels = {
      pending: t('status.pending'),
      completed: t('status.completed'),
      failed: t('status.failed'),
    };
    const methodLabels = {
      credit_card: t('methods.creditCard'),
      debit_card: t('methods.debitCard'),
      paypal: t('methods.paypal'),
      bank_transfer: t('methods.bankTransfer'),
      cash: t('methods.cash'),
    };
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [selectedStatus, setSelectedStatus] = useState(statusFilter);
    const [selectedMethod, setSelectedMethod] = useState(methodFilter);
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
      setSelectedMethod(methodFilter);
    }, [methodFilter]);

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

    const handleMethodChange = (e) => {
      const method = e.target.value;
      setSelectedMethod(method);
      if (onMethodFilter) {
        onMethodFilter(method);
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
      setSelectedMethod('all');
      setSelectedSortBy('created_at');
      setSelectedSortOrder('DESC');
      if (onSearch) onSearch('');
      if (onStatusFilter) onStatusFilter('all');
      if (onMethodFilter) onMethodFilter('all');
      if (onSortChange) onSortChange({ sortBy: 'created_at', sortOrder: 'DESC' });
    };

    const hasActiveFilters =
      localSearchTerm !== '' ||
      selectedStatus !== 'all' ||
      selectedMethod !== 'all' ||
      selectedSortBy !== 'created_at' ||
      selectedSortOrder !== 'DESC';

    const handleExportData = async () => {
      const params = {
        search: localSearchTerm,
        payment_status: selectedStatus !== 'all' ? selectedStatus : undefined,
        payment_method: selectedMethod !== 'all' ? selectedMethod : undefined,
        sort_by: selectedSortBy,
        sort_order: selectedSortOrder,
      };

      try {
        const response = await paymentsApi.exportPayments(params);
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
              {t('header.allPayments')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
              {loading ? (
                <span className="flex items-center">
                  <span className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin me-2"></span>
                  {t('common:loading')}
                </span>
              ) : (
                t('header.totalPayments', { count: paymentCount })
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
                title={t('header.listView')}
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
                title={t('header.gridView')}
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
                title={t('header.refreshPayments')}
                size={18}
              />
            )}

            {/* Export Button */}
            <ExportButton
              fetchData={handleExportData}
              filename="payments_export"
              disabled={loading}
            />

            {/* Add Payment Button */}
            <button
              onClick={onAddClick}
              disabled={loading}
              className="purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard size={16} />
              <span>{t('header.addPayment')}</span>
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
              placeholder={t('header.searchPlaceholder')}
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

          {/* Status Filter */}
          <div className="relative flex-shrink-0">
            <Filter className="absolute start-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 ps-8 pe-6 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">{t('status.all')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="failed">{t('status.failed')}</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedMethod}
              onChange={handleMethodChange}
              disabled={loading}
              className="appearance-none bg-white dark:bg-gray-700 border border-purple-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 px-3 py-1.5 outline-none cursor-pointer w-full sm:w-auto min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="all">{t('methods.all')}</option>
              <option value="credit_card">{t('methods.creditCard')}</option>
              <option value="debit_card">{t('methods.debitCard')}</option>
              <option value="paypal">{t('methods.paypal')}</option>
              <option value="bank_transfer">{t('methods.bankTransfer')}</option>
              <option value="cash">{t('methods.cash')}</option>
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
              <option value="created_at">{t('header.sortDate')}</option>
              <option value="payment_amount">{t('header.sortAmount')}</option>
              <option value="payment_status">{t('header.sortStatus')}</option>
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
            title={
              selectedSortOrder === 'DESC'
                ? t('header.sortNewestTitle')
                : t('header.sortOldestTitle')
            }
          >
            <span className="text-base leading-none">
              {selectedSortOrder === 'DESC' ? '↓' : '↑'}
            </span>
            <span className="hidden sm:inline">
              {selectedSortOrder === 'DESC' ? t('header.sortDesc') : t('header.sortAsc')}
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
            title={hasActiveFilters ? t('header.clearAllFilters') : t('header.noFiltersToClear')}
          >
            <X size={14} />
            <span>{t('header.clear')}</span>
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
                <span className="font-medium">{t('header.searchLabel')}</span>
                <span className="truncate max-w-[120px]">{localSearchTerm}</span>
                <button
                  onClick={() => setLocalSearchTerm('')}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('header.removeSearch')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('header.statusLabel')}</span>
                <span className="capitalize">{statusLabels[selectedStatus] || selectedStatus}</span>
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    if (onStatusFilter) onStatusFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('header.removeStatusFilter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedMethod !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('header.methodLabel')}</span>
                <span className="capitalize">
                  {methodLabels[selectedMethod] || selectedMethod.replace('_', ' ')}
                </span>
                <button
                  onClick={() => {
                    setSelectedMethod('all');
                    if (onMethodFilter) onMethodFilter('all');
                  }}
                  className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200 ms-0.5 transition-colors"
                  title={t('header.removeMethodFilter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(selectedSortBy !== 'created_at' || selectedSortOrder !== 'DESC') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md text-xs text-purple-700 dark:text-purple-300 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="font-medium">{t('header.sortLabel')}</span>
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

PaymentsHeader.displayName = 'PaymentsHeader';

export default PaymentsHeader;
