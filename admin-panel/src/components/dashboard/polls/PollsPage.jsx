// src/components/dashboard/polls/PollsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import PollsHeader from './PollsHeader';
import PollsList from './PollsList';
import AddPollModal from './AddPollModal';
import EditPollModal from './EditPollModal';
import PollsDetailsModal from './PollsDetailsModal';
import ErrorMessage from '../../common/ErrorMessage';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { usePollsList, usePollActions } from '../../../hooks/usePolls';

const PollsPage = () => {
  const { t } = useTranslation('polls');
  const location = useLocation();
  const navigate = useNavigate();

  // UI State
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [showPollDetailsModal, setShowPollDetailsModal] = useState(false);
  const [selectedPollForDetails, setSelectedPollForDetails] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPollForEdit, setSelectedPollForEdit] = useState(null);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const pollsPerPage = 10;

  const searchIdRef = useRef(null); // Store search ID for filtering

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized query params
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pollsPerPage,
      ...(debouncedSearchTerm &&
        debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(statusFilter && statusFilter !== 'all' && { poll_status: statusFilter }),
    }),
    [currentPage, debouncedSearchTerm, statusFilter, sortBy, sortOrder, pollsPerPage],
  );

  // TanStack Query Hooks
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    isPlaceholderData,
    refetch,
  } = usePollsList(queryParams);

  const {
    createPoll,
    updatePoll,
    deletePoll,
    updatePollStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingStatus,
  } = usePollActions();

  const polls = data?.polls || [];
  const totalPolls = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Handle navigation state from search
  useEffect(() => {
    const state = location.state;
    if (state && (state.searchPollId || state.searchQuery)) {
      const { searchPollId, searchQuery } = state;
      if (searchQuery) {
        setSearchTerm(searchQuery);
        setDebouncedSearchTerm(searchQuery);
        setCurrentPage(1);
      }
      if (searchPollId) {
        searchIdRef.current = searchPollId;
      }
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  // displayPolls memo for deep linked filtering
  const displayPolls = useMemo(() => {
    if (searchIdRef.current && polls.length > 0) {
      const filtered = polls.filter((poll) => poll.id === searchIdRef.current);
      if (filtered.length > 0) return filtered;
    }
    return polls;
  }, [polls]);

  // Action handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
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

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleAddPoll = useCallback(
    async (pollData) => {
      try {
        await createPoll(pollData);
        setSuccessMessage(t('pollsPage.successCreated'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddModal(false);
      } catch (err) {
        console.error('Error creating poll:', err);
      }
    },
    [createPoll],
  );

  const handleDeletePoll = useCallback(
    (pollOrId) => {
      const poll =
        typeof pollOrId === 'object'
          ? pollOrId
          : polls.find((p) => p.id === pollOrId) || { id: pollOrId };
      setPollToDelete(poll);
      setShowDeleteConfirm(true);
    },
    [polls],
  );

  const confirmDeletePoll = useCallback(async () => {
    if (!pollToDelete) return;
    try {
      await deletePoll(pollToDelete.id);
      setSuccessMessage(t('pollsPage.successDeleted'));
      setShowDeleteConfirm(false);
      setPollToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting poll:', err);
    }
  }, [pollToDelete, deletePoll]);

  const handleEditPoll = useCallback(
    async (pollOrId, updatedData) => {
      if (updatedData !== undefined) {
        try {
          const pollId = typeof pollOrId === 'object' ? pollOrId.id : pollOrId;
          await updatePoll({ id: pollId, data: updatedData });
          setSuccessMessage(t('pollsPage.successUpdated'));
          setTimeout(() => setSuccessMessage(''), 3000);
          setShowEditModal(false);
          setSelectedPollForEdit(null);
        } catch (err) {
          console.error('Error updating poll:', err);
        }
      } else {
        const poll = typeof pollOrId === 'object' ? pollOrId : polls.find((p) => p.id === pollOrId);
        if (poll) {
          setSelectedPollForEdit(poll);
          setShowEditModal(true);
        }
      }
    },
    [updatePoll, polls],
  );

  const handleUpdatePollStatus = useCallback(
    async (pollId, statusData) => {
      try {
        await updatePollStatus({ id: pollId, data: statusData });
        setSuccessMessage(t('pollsPage.successStatusUpdated'));
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error updating poll status:', err);
      }
    },
    [updatePollStatus],
  );

  const handleViewDetails = useCallback((poll) => {
    setSelectedPollForDetails(poll);
    setShowPollDetailsModal(true);
  }, []);

  if (isLoading && !data) {
    return (
      <TableSkeleton
        rows={10}
        columns={7}
        showAvatar
        showActions
        avatarColumnIndex={1}
        columnWidths={[
          'w-10',
          'w-[240px]',
          'w-[260px]',
          'w-[120px]',
          'w-[140px]',
          'w-[130px]',
          'w-[100px]',
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        message={queryError?.message || t('pollsPage.loadFailedError')}
        onRetry={() => refetch()}
      />
    );
  }

  const isRefreshing = isFetching;

  return (
    <>
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        type="success"
        title={t('common:success')}
        message={successMessage}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPollToDelete(null);
        }}
        onConfirm={confirmDeletePoll}
        type="danger"
        title={t('pollsPage.deletePollTitle')}
        message={
          pollToDelete
            ? t('pollsPage.deletePollMessage', {
                title: pollToDelete.poll_title || pollToDelete.title || pollToDelete.question,
              })
            : ''
        }
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={isDeleting}
      />

      <AddPollModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPoll={handleAddPoll}
        loading={isCreating}
      />

      <PollsDetailsModal
        isOpen={showPollDetailsModal}
        onClose={() => {
          setShowPollDetailsModal(false);
          setSelectedPollForDetails(null);
        }}
        pollId={selectedPollForDetails?.id}
        pollData={selectedPollForDetails}
        onUpdateStatus={handleUpdatePollStatus}
        onEdit={handleEditPoll}
        onDelete={(pollId) => {
          handleDeletePoll(pollId);
          setShowPollDetailsModal(false);
        }}
        loading={isUpdatingStatus}
      />

      <EditPollModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPollForEdit(null);
        }}
        poll={selectedPollForEdit}
        onUpdatePoll={handleEditPoll}
        loading={isUpdating}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <PollsHeader
          pollCount={totalPolls}
          onAddClick={() => setShowAddModal(true)}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          loading={isRefreshing}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        <div
          className={`relative overflow-hidden transition-all duration-300 ${isRefreshing ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto transition-all duration-300 ease-in-out"
          style={{
            minHeight: displayPolls.length === 0 ? '400px' : 'auto',
            opacity: isRefreshing ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {displayPolls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No polls found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try changing your search or filters'
                  : 'Start by adding your first poll'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Poll
              </button>
            </div>
          ) : (
            <PollsList
              viewMode={viewMode}
              polls={displayPolls}
              onEdit={handleEditPoll}
              onDelete={handleDeletePoll}
              onViewDetails={handleViewDetails}
              onUpdateStatus={handleUpdatePollStatus}
              serialNumberStart={(currentPage - 1) * pollsPerPage + 1}
            />
          )}
        </div>

        {viewMode === 'list' && displayPolls.length > 0 && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalPolls}
            itemsPerPage={pollsPerPage}
            itemName="polls"
          />
        )}
      </div>
    </>
  );
};

export default React.memo(PollsPage);
