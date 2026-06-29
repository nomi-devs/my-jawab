// src/components/dashboard/payments/PaymentsPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import PaymentsHeader from './PaymentsHeader';
import PaymentsList from './PaymentsList';
import AddPaymentModal from './AddPaymentModal';
import PaymentDetailsModal from './PaymentDetailsModal';
import AlertModal from '../../common/AlertModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { usePaymentsList, usePaymentActions } from '../../../hooks/usePayments';

const PaymentsPage = () => {
  /*
   * UI State
   */
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [localError, setLocalError] = useState(null);

  /*
   * Filter and Pagination State
   */
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('list');
  const paymentsPerPage = 10;

  // Memoized params for TanStack Query
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: paymentsPerPage,
    ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(statusFilter && statusFilter !== 'all' && { payment_status: statusFilter }),
    ...(methodFilter && methodFilter !== 'all' && { payment_method: methodFilter })
  }), [currentPage, searchTerm, sortBy, sortOrder, statusFilter, methodFilter, paymentsPerPage]);

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch
  } = usePaymentsList(queryParams);

  const {
    createPayment,
    isCreating
  } = usePaymentActions();

  const payments = data?.payments || [];
  const totalPayments = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI (shimmer only on initial load)
  const loading = isInitialLoading;



  // Fetch payments from API


  // Track previous values to prevent unnecessary fetches
  const prevFiltersRef = useRef({ searchTerm, statusFilter, methodFilter, sortBy, sortOrder });

  // Initial fetch and refetch when filters change


  // Handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status || 'all');
    setCurrentPage(1);
  }, []);

  const handleMethodFilter = useCallback((method) => {
    setMethodFilter(method || 'all');
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

  const handleViewDetails = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleAddSuccess = useCallback(() => {
    setShowAddModal(false);
    setSuccessMessage('Payment created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  // Initial loading: shimmer skeleton instead of circle loader
  if (loading && payments.length === 0) {
    return (
      <TableSkeleton
        rows={10}
        columns={7}
        showAvatar={false}
        showActions
        columnWidths={[
          'w-10',        // #
          'w-[260px]',   // User / Reference
          'w-[220px]',   // Method
          'w-[140px]',   // Amount
          'w-[120px]',   // Status
          'w-[130px]',   // Date
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

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <PaymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayment(null);
          }}
          paymentId={selectedPayment.id}
          paymentData={selectedPayment}
        />
      )}

      {/* Main Payments Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <PaymentsHeader
          paymentCount={totalPayments}
          onAddClick={handleAddClick}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onMethodFilter={handleMethodFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          loading={isFetching}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          methodFilter={methodFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        {/* Loading Overlay - Smooth transition */}
        <div className={`relative overflow-hidden transition-all duration-300 ${isFetching && payments.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto transition-all duration-300 ease-in-out p-2" style={{
          minHeight: payments.length === 0 ? '400px' : 'auto',
          opacity: isFetching && payments.length > 0 ? 0.6 : 1,
          scrollbarGutter: 'stable'
        }}>
          {loading && payments.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No payments found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try changing your search or filters'
                  : 'Start by adding your first payment'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Payment
              </button>
            </div>
          ) : (
            <PaymentsList
              payments={payments}
              loading={isFetching && payments.length > 0}
              viewMode={viewMode}
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
            totalItems={totalPayments}
            itemsPerPage={paymentsPerPage}
            itemName="payments"
          />
        )}
      </div>
    </>
  );
};

export default PaymentsPage;

