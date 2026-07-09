// src/components/dashboard/topics/SubTopicsPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTopicsList, useTopicActions } from '../../../hooks/useTopics';
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

const SubTopicsPage = () => {
  const { t } = useTranslation('topics');
  const location = useLocation();
  const navigate = useNavigate();

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('subtopics'); // Default to subtopics
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const topicsPerPage = 10;
  const searchIdRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Prepare query parameters
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: topicsPerPage,
      type: typeFilter,
      ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      is_active: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [currentPage, topicsPerPage, typeFilter, searchTerm, sortBy, sortOrder, statusFilter],
  );

  // Use TanStack Query
  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useTopicsList(queryParams);

  const { createTopic, updateTopic, updateTopicStatus, deleteTopic } = useTopicActions();

  const topics = data?.topics || [];
  const totalTopics = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI (shimmer only on initial load)
  const loading = isInitialLoading;
  const error = isError ? queryError?.message || t('subTopicsPage.failedToLoad') : null;

  useEffect(() => {
    const state = location.state;
    if (state && (state.searchTopicId || state.searchQuery)) {
      const { searchTopicId, searchQuery } = state;
      if (searchQuery) {
        setSearchTerm(searchQuery);
        setCurrentPage(1);
      }
      if (searchTopicId) {
        searchIdRef.current = searchTopicId;
      }
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (searchIdRef.current && topics.length > 0) {
      // Logic to highlight or filter specifically for the searched ID if needed.
      // With react-query, if the ID was passed in query params (which it isn't here, it's just local ref),
      // we might handle it differently.
      // The original logic filtered the *fetched* topics.
      // We can replicate similar behavior or just assume user search query did the work.
      // Original logic:
      /*
           const filteredTopics = topics.filter(topic => topic.id === searchIdRef.current);
           if (filteredTopics.length > 0) {
               setTopics(filteredTopics); // This was mutating local state in original. 
               // We can't mutate 'topics' from useQuery directly. 
               // But usually navigating with state.searchQuery sets the searchTerm, which triggers a fetch.
           }
           */
      searchIdRef.current = null;
    }
  }, [topics]);

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

  const handleAddTopic = useCallback(
    async (topicData) => {
      try {
        await createTopic(topicData);
        setSuccessMessage(t('subTopicsPage.topicCreated'));
        setShowAddModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error creating topic:', err);
        // setError handled by main error state usually, but for modals we might want local feedback or just toast
        // The global error state is for the list load.
        // We can set a temporary error or just log.
        // The original code set the main 'error' state.
        // setError(`Failed to create topic: ${err.response?.data?.message || err.message}`);
        // But we already map 'error' to queryError.
        // We can add a secondary error state for actions/modals if we want strict parity.
        // For now, let's use alert modal via a temp state or side-effect?
        // Actually, let's keep it simple:
        alert(`${t('subTopicsPage.failedCreate')}: ${err.message}`);
      }
    },
    [createTopic],
  );

  const handleEditTopic = useCallback((topic) => {
    setSelectedTopicForEdit(topic);
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(
    async (topicId, updatedData) => {
      try {
        await updateTopic({ id: topicId, data: updatedData });
        setSuccessMessage(t('subTopicsPage.topicUpdated'));
        setShowEditModal(false);
        setSelectedTopicForEdit(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error updating topic:', err);
        alert(`${t('subTopicsPage.failedUpdate')}: ${err.message}`);
      }
    },
    [updateTopic],
  );

  const handleToggleActive = useCallback(
    async (topicId, isActive) => {
      try {
        const status = isActive ? 'active' : 'inactive';
        await updateTopicStatus({ id: topicId, is_active: status });

        const topic = topics.find((tp) => tp.id === topicId);
        setSuccessMessage(
          isActive
            ? t('subTopicsPage.topicActivated', { name: topic?.topic_name || t('subTopicsPage.defaultTopicName') })
            : t('subTopicsPage.topicDeactivated', { name: topic?.topic_name || t('subTopicsPage.defaultTopicName') }),
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error toggling topic status:', err);
        alert(`${t('subTopicsPage.failedStatus')}: ${err.message}`);
      }
    },
    [topics, updateTopicStatus, t],
  );

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
      await deleteTopic(topicToDelete.id);
      setSuccessMessage(t('subTopicsPage.topicDeleted', { name: topicToDelete.topic_name }));
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert(`${t('subTopicsPage.failedDelete')}: ${err.message}`);
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    }
  }, [topicToDelete, deleteTopic, t]);

  const handleViewDetails = useCallback((topic) => {
    setSelectedTopicForDetails(topic);
    setShowTopicDetailsModal(true);
  }, []);

  if (loading && topics.length === 0) {
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
          'w-[160px]',
          'w-[130px]',
          'w-[100px]',
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  if (error && topics.length === 0) {
    return <ErrorMessage message={error} onRetry={() => refetch()} />;
  }

  return (
    <>
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        type="success"
        title={t('common:success')}
        message={successMessage}
      />
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title={t('common:error')}
        message={error}
      />
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTopicToDelete(null);
        }}
        onConfirm={confirmDeleteTopic}
        type="danger"
        title={t('subTopicsPage.deleteTopicTitle')}
        message={
          topicToDelete
            ? t('subTopicsPage.deleteTopicMessage', { name: topicToDelete.topic_name })
            : ''
        }
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={loading}
      />

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

      <AddTopicModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTopic={handleAddTopic}
      />
      <EditTopicModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTopicForEdit(null);
        }}
        topic={selectedTopicForEdit}
        onSave={handleSaveEdit}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <TopicsHeader
          title={t('subTopicsPage.pageTitle')}
          countLabel={t('subTopicsPage.countLabel')}
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

        <div
          className={`relative overflow-hidden transition-all duration-300 ${loading && topics.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('subTopicsPage.updating')}
              </span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto transition-all duration-300 ease-in-out"
          style={{
            minHeight: topics.length === 0 ? '400px' : 'auto',
            opacity: loading && topics.length > 0 ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {topics.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('subTopicsPage.noSubTopicsFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
                {t('subTopicsPage.tryChangingFilters')}
              </p>
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

        {viewMode === 'list' && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalTopics}
            itemsPerPage={topicsPerPage}
            itemName="sub-topics"
          />
        )}
      </div>
    </>
  );
};

export default React.memo(SubTopicsPage);
