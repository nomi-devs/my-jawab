// src/components/dashboard/subscriptions/SubscriptionsPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Package } from 'lucide-react';
import SubscriptionsHeader from './SubscriptionsHeader';
import SubscriptionsList from './SubscriptionsList';
import AddSubscriptionModal from './AddSubscriptionModal';
import EditSubscriptionModal from './EditSubscriptionModal';
import SubscriptionDetailsModal from './SubscriptionDetailsModal';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { useSubscriptionsList, useSubscriptionActions } from '../../../hooks/useSubscriptions';

const SubscriptionsPage = () => {
  // Removed manual state: subscriptions

  /*
   * UI State
   */
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [localError, setLocalError] = useState(null);

  /*
   * Filter and Pagination State
   */
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('list');
  const subscriptionsPerPage = 10;

  // Memoized params for TanStack Query
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: subscriptionsPerPage,
    ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(typeFilter && typeFilter !== 'all' && { subscription_type: typeFilter }),
    ...(statusFilter !== 'all' && statusFilter !== null && {
      is_active: statusFilter
    })
  }), [currentPage, searchTerm, sortBy, sortOrder, typeFilter, statusFilter, subscriptionsPerPage]);

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch
  } = useSubscriptionsList(queryParams);

  const {
    createSubscription,
    updateSubscription,
    deleteSubscription,
    isCreating,
    isUpdating,
    isDeleting
  } = useSubscriptionActions();

  const subscriptions = data?.subscriptions || [];
  const totalSubscriptions = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI (shimmer only on initial load)
  const loading = isInitialLoading;


  // Fetch subscriptions from API


  // Track previous values to prevent unnecessary fetches
  const prevFiltersRef = useRef({ searchTerm, typeFilter, statusFilter, sortBy, sortOrder });

  // Initial fetch and refetch when filters change


  // Handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((type) => {
    setTypeFilter(type || 'all');
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status || 'all');
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    setSortBy(newSortBy || 'created_at');
    setSortOrder(newSortOrder || 'DESC');
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleAddClick = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleEditClick = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  }, []);

  const handleViewDetails = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  }, []);

  const handleDeleteClick = useCallback((subscription) => {
    setSubscriptionToDelete(subscription);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!subscriptionToDelete) return;

    try {
      await deleteSubscription(subscriptionToDelete.id);
      setShowDeleteConfirm(false);
      setSubscriptionToDelete(null);

      setSuccessMessage(`Subscription "${subscriptionToDelete.subscription_name}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting subscription:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete subscription. Please try again.';
      setLocalError(errorMsg);
      setTimeout(() => setLocalError(null), 5000);
    }
  }, [subscriptionToDelete, deleteSubscription]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleAddSuccess = useCallback(() => {
    setShowAddModal(false);
    // Reset to first page and latest sort to show new item
    setCurrentPage(1);
    setSortBy('created_at');
    setSortOrder('DESC');
    setSuccessMessage('Subscription created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setSelectedSubscription(null);
    // Refresh current view
    setSuccessMessage('Subscription updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  // Initial loading: shimmer skeleton instead of circle loader
  if (loading && subscriptions.length === 0) {
    return (
      <TableSkeleton
        rows={10}
        columns={7}
        showAvatar={false}
        showActions
        columnWidths={[
          'w-10',        // #
          'w-[260px]',   // Subscription
          'w-[220px]',   // Type
          'w-[140px]',   // Price
          'w-[120px]',   // Status
          'w-[130px]',   // Created
          'w-[100px]',   // Actions
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  return (
    <>
      {/* Success Alert Modal */}
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        type="success"
        title="Success"
        message={successMessage}
      />

      {/* Error Alert Modal */}
      <AlertModal
        isOpen={!!localError}
        onClose={() => setLocalError(null)}
        type="error"
        title="Error"
        message={localError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSubscriptionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title="Delete Subscription"
        message={subscriptionToDelete ? `Are you sure you want to delete "${subscriptionToDelete.subscription_name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add Subscription Modal */}
      {showAddModal && (
        <AddSubscriptionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && selectedSubscription && (
        <EditSubscriptionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubscription(null);
          }}
          subscription={selectedSubscription}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <SubscriptionDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSubscription(null);
          }}
          subscriptionId={selectedSubscription.id}
          subscriptionData={selectedSubscription}
        />
      )}

      {/* Main Subscriptions Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <SubscriptionsHeader
          subscriptionCount={totalSubscriptions}
          onAddClick={handleAddClick}
          onSearch={handleSearch}
          onTypeFilter={handleTypeFilter}
          onStatusFilter={handleStatusFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          loading={isFetching}
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        {/* Loading Overlay - Smooth transition */}
        <div className={`relative overflow-hidden transition-all duration-300 ${isFetching && subscriptions.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto transition-all duration-300 ease-in-out p-2" style={{
          minHeight: subscriptions.length === 0 ? '400px' : 'auto',
          opacity: isFetching && subscriptions.length > 0 ? 0.6 : 1,
          scrollbarGutter: 'stable'
        }}>
          {loading && subscriptions.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
              </div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No subscriptions found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try changing your search or filters'
                  : 'Start by adding your first subscription'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Subscription
              </button>
            </div>
          ) : (
            <SubscriptionsList
              subscriptions={subscriptions}
              loading={isFetching && subscriptions.length > 0}
              viewMode={viewMode}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>

        {/* Pagination Footer */}
        {viewMode === 'list' && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalSubscriptions}
            itemsPerPage={subscriptionsPerPage}
            itemName="subscriptions"
          />
        )}
      </div>
    </>
  );
};

export default SubscriptionsPage;

