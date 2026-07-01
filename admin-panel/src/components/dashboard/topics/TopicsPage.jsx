// src/components/dashboard/topics/TopicsPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import topicsApi from '../../../api/topicsApi';
import TopicsHeader from './TopicsHeader';
import TopicsGrid from './TopicsGrid';
import AddTopicModal from './AddTopicModal';
import EditTopicModal from './EditTopicModal';
import TopicsDetailsModal from './TopicsDetailsModal';
import ErrorMessage from '../../common/ErrorMessage';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { useTopicsList, useTopicActions } from '../../../hooks/useTopics';

const TopicsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Removed manual states: topics, loading, error, etc. managed by hook now

  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTopicForEdit, setSelectedTopicForEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [showTopicDetailsModal, setShowTopicDetailsModal] = useState(false);
  const [selectedTopicForDetails, setSelectedTopicForDetails] = useState(null);

  // Filter and search state
  /*
   * Filter and Pagination State
   */
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const topicsPerPage = 10;
  const searchIdRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localError, setLocalError] = useState(null); // For non-query errors

  // Memoized params for TanStack Query
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: topicsPerPage,
      parent_id: 0, // Only fetch parent topics
      ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(statusFilter !== 'all' &&
        statusFilter !== null && {
          is_active: statusFilter,
        }),
      ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
    }),
    [currentPage, searchTerm, sortBy, sortOrder, statusFilter, typeFilter, topicsPerPage],
  );

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useTopicsList(queryParams);

  const {
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTopicActions();

  const topics = data?.topics || [];
  const totalTopics = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI (shimmer only on initial load)
  const loading = isInitialLoading;

  // Fetch topics from API

  // Track previous values to prevent unnecessary fetches
  const prevFiltersRef = useRef({ searchTerm, statusFilter, typeFilter, sortBy, sortOrder });

  // Handle navigation state from search
  useEffect(() => {
    // Check if there's actual state data to process
    const state = location.state;
    if (state && (state.searchTopicId || state.searchQuery)) {
      const { searchTopicId, searchQuery } = state;

      if (searchQuery) {
        setSearchTerm(searchQuery);
        setCurrentPage(1);
      }

      // Store the search ID to filter results to show only the selected item
      if (searchTopicId) {
        searchIdRef.current = searchTopicId;
      }

      // Clear navigation state to prevent re-applying on re-render
      // Use setTimeout to avoid infinite loop - navigate after state is processed
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  // Filter results by search ID if provided (after fetch completes)
  // Specific filter by ID logic (if navigated from search results)
  useEffect(() => {
    if (searchIdRef.current && topics.length > 0) {
      // Logic for deep linking to a specific item would go here.
      // For now, we just clear the ref since we rely on regular filtering.
      searchIdRef.current = null;
    }
  }, [topics]);

  // Initial fetch and refetch when filters change

  // Filter handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status || 'all');
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((type) => {
    setTypeFilter(type || 'all');
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

  // Handle add topic
  const handleAddTopic = useCallback(
    async (topicData) => {
      try {
        await createTopic(topicData);
        setSuccessMessage('Topic created successfully!');
        setShowAddModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error creating topic:', err);
        setLocalError(`Failed to create topic: ${err.response?.data?.message || err.message}`);
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [createTopic],
  );

  // Handle edit topic
  const handleEditTopic = useCallback((topic) => {
    setSelectedTopicForEdit(topic);
    setShowEditModal(true);
  }, []);

  // Handle save edit
  // Handle save edit
  const handleSaveEdit = useCallback(
    async (topicId, updatedData) => {
      try {
        await updateTopic({ id: topicId, data: updatedData });
        setSuccessMessage('Topic updated successfully!');
        setShowEditModal(false);
        setSelectedTopicForEdit(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error updating topic:', err);
        setLocalError(`Failed to update topic: ${err.response?.data?.message || err.message}`);
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [updateTopic],
  );

  // Handle toggle topic active status
  // Handle toggle topic active status
  const handleToggleActive = useCallback(
    async (topicId, isActive) => {
      try {
        // Convert boolean to 'active'/'inactive' string handled by hook or API
        await updateTopicStatus({ id: topicId, is_active: isActive });

        const topic = topics.find((t) => t.id === topicId);
        setSuccessMessage(
          isActive
            ? `Topic "${topic?.topic_name || 'Topic'}" activated!`
            : `Topic "${topic?.topic_name || 'Topic'}" deactivated!`,
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error toggling topic status:', err);
        const errorMsg =
          err.response?.data?.message || 'Failed to update topic status. Please try again.';
        setLocalError(errorMsg);
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [topics, updateTopicStatus],
  );

  // Handle delete topic
  const handleDeleteTopic = useCallback(
    (topicId) => {
      const topic = topics.find((t) => t.id === topicId);
      setTopicToDelete(topic);
      setShowDeleteConfirm(true);
    },
    [topics],
  );

  const confirmDeleteTopic = useCallback(async () => {
    if (!topicToDelete) return;

    try {
      // Delete topic permanently from database
      await deleteTopic(topicToDelete.id);

      setSuccessMessage(`Topic "${topicToDelete.topic_name}" deleted successfully!`);
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting topic:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete topic. Please try again.';
      setLocalError(errorMsg);
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
      setTimeout(() => setLocalError(null), 5000);
    }
  }, [topicToDelete, deleteTopic]);

  // Handle view topic details
  const handleViewDetails = useCallback((topic) => {
    setSelectedTopicForDetails(topic);
    setShowTopicDetailsModal(true);
  }, []);

  // Initial loading: shimmer skeleton instead of circle loader
  if (loading && topics.length === 0) {
    return (
      <TableSkeleton
        rows={10}
        columns={8}
        showAvatar
        showActions
        avatarColumnIndex={1}
        columnWidths={[
          'w-10', // #
          'w-[240px]', // Topic
          'w-[260px]', // Description
          'w-[120px]', // Status
          'w-[160px]', // Parent
          'w-[200px]', // Sub-Topics
          'w-[130px]', // Created
          'w-[100px]', // Actions
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  if (isError && !topics.length) {
    return (
      <ErrorMessage
        message={queryError?.message || 'Failed to load topics'}
        onRetry={() => refetch()}
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
          setTopicToDelete(null);
        }}
        onConfirm={confirmDeleteTopic}
        type="danger"
        title="Delete Topic"
        message={
          topicToDelete
            ? `Are you sure you want to permanently delete "${topicToDelete.topic_name}"? This action cannot be undone. The topic will be removed from the database.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Topic Details Modal */}
      <TopicsDetailsModal
        isOpen={showTopicDetailsModal}
        onClose={() => {
          setShowTopicDetailsModal(false);
          setSelectedTopicForDetails(null);
        }}
        topicId={selectedTopicForDetails?.id}
        topicData={selectedTopicForDetails}
        onUpdateStatus={handleToggleActive}
        onEdit={handleEditTopic}
        onDelete={handleDeleteTopic}
      />

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTopic={handleAddTopic}
      />

      {/* Edit Topic Modal */}
      <EditTopicModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTopicForEdit(null);
        }}
        topic={selectedTopicForEdit}
        onSave={handleSaveEdit}
      />

      {/* Main Topics Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <TopicsHeader
          title="Parent Topics"
          countLabel="Total Parent Topics"
          topicCount={totalTopics}
          onAddClick={() => setShowAddModal(true)}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onTypeFilter={handleTypeFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          loading={isFetching}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        {/* Loading Overlay - Smooth transition */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            isFetching && topics.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
          }`}
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
            minHeight: topics.length === 0 ? '400px' : 'auto',
            opacity: isFetching && topics.length > 0 ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {loading && topics.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading topics...</p>
              </div>
            </div>
          ) : topics.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-2xl">#</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No topics found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try changing your search or filters'
                  : 'Start by adding your first topic'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Topic
              </button>
            </div>
          ) : (
            <TopicsGrid
              topics={topics}
              viewMode={viewMode}
              onEdit={handleEditTopic}
              onDelete={handleDeleteTopic}
              onViewDetails={handleViewDetails}
              onToggleActive={handleToggleActive}
              currentPage={currentPage}
              itemsPerPage={topicsPerPage}
            />
          )}
        </div>

        {/* Pagination Footer */}
        {viewMode === 'list' && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalTopics}
            itemsPerPage={topicsPerPage}
            itemName="topics"
          />
        )}
      </div>
    </>
  );
};

export default React.memo(TopicsPage);
