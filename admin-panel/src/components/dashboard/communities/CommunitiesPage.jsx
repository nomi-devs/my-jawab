// src/components/dashboard/communities/CommunitiesPage.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import communitiesApi from '../../../api/communitiesApi';
import CommunitiesGrid from './CommunitiesGrid';
import CommunitiesHeader from './CommunitiesHeader';
import AddCommunityModal from './AddCommunityModal';
import EditCommunityModal from './EditCommunityModal';
import CommunitiesDetailsModal from './CommunitiesDetailsModal';
import ErrorMessage from '../../common/ErrorMessage';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { useCommunitiesList, useCommunityActions } from '../../../hooks/useCommunities';

const CommunitiesPage = () => {
  const { t } = useTranslation('communities');
  const location = useLocation();
  const navigate = useNavigate();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('list');
  const communitiesPerPage = 10;
  const searchIdRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [successMessage, setSuccessMessage] = useState('');
  const [showInfoAlert, setShowInfoAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCommunityForEdit, setSelectedCommunityForEdit] = useState(null);
  const [showCommunityDetailsModal, setShowCommunityDetailsModal] = useState(false);
  const [selectedCommunityForDetails, setSelectedCommunityForDetails] = useState(null);
  const [initialDetailsTab, setInitialDetailsTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [localError, setLocalError] = useState(null); // For non-query errors

  // Memoized params for TanStack Query
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: communitiesPerPage,
      ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(statusFilter !== 'all' &&
        statusFilter !== null && {
          is_active: statusFilter,
        }),
    }),
    [currentPage, searchTerm, statusFilter, sortBy, sortOrder, communitiesPerPage],
  );

  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useCommunitiesList(queryParams);

  const {
    createCommunity,
    updateCommunity,
    updateCommunityStatus,
    deleteCommunity,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCommunityActions();

  const communities = data?.communities || [];
  const totalCommunities = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI
  // If we have data (even previous), we show it.
  // Initial loading matches the "shimmer first time" requirement.
  const loading = isInitialLoading; // Only true when no data is available yet

  // Handle navigation state from search
  useEffect(() => {
    // Check if there's actual state data to process
    const state = location.state;
    if (state && (state.searchCommunityId || state.searchQuery)) {
      const { searchCommunityId, searchQuery } = state;

      if (searchQuery) {
        setSearchTerm(searchQuery);
        setCurrentPage(1);
      }

      // Store the search ID to filter results to show only the selected item
      if (searchCommunityId) {
        searchIdRef.current = searchCommunityId;
      }

      // Clear navigation state to prevent re-applying on re-render
      // Use setTimeout to avoid infinite loop - navigate after state is processed
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  // Specific filter by ID logic (if navigated from search results)
  // Logic to redirect if searchID is present but not in current list is tricky with server-side pagination
  // Typically one would fetch that specific item or search for it.
  // Assuming the general search handles finding it if we update filtering.
  useEffect(() => {
    if (searchIdRef.current && communities.length > 0) {
      // Ideally we would want to ensure the specific community is loaded.
      // For now relying on standard list loading.
      searchIdRef.current = null;
    }
  }, [communities]);

  // Filter handlers
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

  // Handle toggle community status
  const handleToggleStatus = useCallback(
    async (communityId, newStatus) => {
      try {
        await updateCommunityStatus({ id: communityId, is_active: newStatus });
        // Success message handling
        const community = communities.find((c) => c.id === communityId);
        setSuccessMessage(
          newStatus
            ? t('page.communityActivated', { name: community?.name })
            : t('page.communityDeactivated', { name: community?.name }),
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error toggling community status:', err);
        setLocalError(t('page.failedToUpdateStatus'));
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [communities, updateCommunityStatus],
  );

  // Handle view community
  const handleViewCommunity = useCallback((community) => {
    setSelectedCommunityForDetails(community);
    setInitialDetailsTab('details');
    setShowCommunityDetailsModal(true);
  }, []);

  // Handle view community members
  const handleViewMembers = useCallback((community) => {
    setSelectedCommunityForDetails(community);
    setInitialDetailsTab('members');
    setShowCommunityDetailsModal(true);
  }, []);

  // Handle edit community
  const handleEditCommunity = useCallback((community) => {
    // Use raw community data if available, otherwise use transformed data
    const communityToEdit = community.raw || community;
    setSelectedCommunityForEdit(communityToEdit);
    setShowEditModal(true);
  }, []);

  // Handle update community (including topics)
  // Handle update community (including topics)
  const handleUpdateCommunity = useCallback(
    async (communityId, communityData, topicIds = []) => {
      try {
        setLocalError(null);

        // 1) Update basic community fields (name, description, image, status)
        await updateCommunity({ id: communityId, data: communityData });

        // 2) Sync topics using dedicated admin endpoints
        // Note: keeping this complex logic here for now instead of hook, as it involves multiple potential calls
        try {
          const topicsRes = await communitiesApi.getCommunityTopics(communityId);
          const existingRelations = Array.isArray(topicsRes?.data) ? topicsRes.data : [];

          const existingIds = existingRelations
            .map((rel) => rel.topic_id)
            .filter((id) => id != null);

          const desiredIds = Array.from(new Set(topicIds || []));

          const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
          const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

          if (toAdd.length > 0) {
            await Promise.all(
              toAdd.map((id) => communitiesApi.addTopicToCommunity(communityId, id)),
            );
          }

          if (toRemove.length > 0) {
            await Promise.all(
              toRemove.map((id) => communitiesApi.removeTopicFromCommunity(communityId, id)),
            );
          }
        } catch (topicError) {
          console.error('Error syncing community topics:', topicError);
          // Don't block the main success on topic sync error, but surface message
          setLocalError(
            t('page.communityUpdatedTopicsFailed', {
              message: topicError.response?.data?.message || topicError.message,
            }),
          );
          setTimeout(() => setLocalError(null), 5000);
        }

        // Refetch to ensure everything is synced
        await refetch();

        const community = communities.find((c) => c.id === communityId);
        setSuccessMessage(
          t('page.communityUpdated', { name: community?.name || t('page.defaultCommunity') }),
        );
        setShowEditModal(false);
        setSelectedCommunityForEdit(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error updating community:', err);
        setLocalError(
          t('page.failedToUpdateCommunity', {
            message: err.response?.data?.message || err.message,
          }),
        );
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [updateCommunity, refetch, communities],
  );

  // Handle delete community
  const handleDeleteCommunity = useCallback(
    (communityId) => {
      const community = communities.find((c) => c.id === communityId);
      setCommunityToDelete(community);
      setShowDeleteConfirm(true);
    },
    [communities],
  );

  const confirmDeleteCommunity = useCallback(async () => {
    if (!communityToDelete) return;

    try {
      await deleteCommunity(communityToDelete.id);

      setSuccessMessage(t('page.communityDeleted', { name: communityToDelete.name }));
      setShowDeleteConfirm(false);
      setCommunityToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting community:', err);
      const errorMsg = err.response?.data?.message || t('page.failedToDeleteCommunity');
      setLocalError(errorMsg);
      setShowDeleteConfirm(false);
      setCommunityToDelete(null);
      setTimeout(() => setLocalError(null), 5000);
    }
  }, [communityToDelete, deleteCommunity]);

  // Handle create new community
  const handleCreateNew = useCallback(() => {
    setShowAddModal(true);
  }, []);

  // Handle add community
  const handleAddCommunity = useCallback(
    async (communityData) => {
      try {
        await createCommunity(communityData);
        setSuccessMessage(t('page.communityCreated'));
        setShowAddModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error creating community:', err);
        setLocalError(
          t('page.failedToCreateCommunity', {
            message: err.response?.data?.message || err.message,
          }),
        );
        setTimeout(() => setLocalError(null), 5000);
      }
    },
    [createCommunity],
  );

  // Initial loading: shimmer skeleton instead of circle loader
  if (loading && communities.length === 0) {
    return (
      <TableSkeleton
        rows={10}
        columns={7}
        showAvatar
        showActions
        avatarColumnIndex={1}
        columnWidths={[
          'w-10', // #
          'w-[240px]', // Community
          'w-[260px]', // Description
          'w-[140px]', // Category / Members
          'w-[120px]', // Status
          'w-[130px]', // Created
          'w-[100px]', // Actions
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  if (isError && !communities.length) {
    return (
      <ErrorMessage
        message={queryError?.message || t('page.failedToLoad')}
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
        title={t('common:success')}
        message={successMessage}
      />

      {/* Error Alert Modal */}
      <AlertModal
        isOpen={!!localError}
        onClose={() => setLocalError(null)}
        type="error"
        title={t('common:error')}
        message={localError}
      />

      {/* Info Alert Modal */}
      <AlertModal
        isOpen={showInfoAlert}
        onClose={() => {
          setShowInfoAlert(false);
          setAlertMessage('');
        }}
        type="info"
        title={t('page.information')}
        message={alertMessage}
        duration={0}
      />

      {/* Add Community Modal */}
      <AddCommunityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddCommunity={handleAddCommunity}
      />

      {/* Edit Community Modal */}
      <EditCommunityModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCommunityForEdit(null);
        }}
        community={selectedCommunityForEdit}
        onSave={handleUpdateCommunity}
      />

      {/* Community Details Modal */}
      <CommunitiesDetailsModal
        isOpen={showCommunityDetailsModal}
        onClose={() => {
          setShowCommunityDetailsModal(false);
          setSelectedCommunityForDetails(null);
        }}
        communityId={selectedCommunityForDetails?.id}
        communityData={selectedCommunityForDetails}
        onUpdateStatus={handleToggleStatus}
        onEdit={handleEditCommunity}
        onDelete={handleDeleteCommunity}
        initialTab={initialDetailsTab}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCommunityToDelete(null);
        }}
        onConfirm={confirmDeleteCommunity}
        type="danger"
        title={t('page.deleteCommunityTitle')}
        message={
          communityToDelete
            ? t('page.deleteCommunityMessage', { name: communityToDelete.name })
            : ''
        }
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={isDeleting}
      />

      {/* Main Communities Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <CommunitiesHeader
          communityCount={totalCommunities}
          onAddClick={handleCreateNew}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          loading={isFetching}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        {/* Loading Overlay - Smooth transition */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            isFetching && communities.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('page.updating')}</span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto transition-all duration-300 ease-in-out"
          style={{
            minHeight: communities.length === 0 ? '400px' : 'auto',
            opacity: isFetching && communities.length > 0 ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {loading && communities.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('page.loadingCommunities')}</p>
              </div>
            </div>
          ) : communities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('page.noCommunitiesFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? t('page.tryChangingFilters')
                  : t('page.startAdding')}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('page.addFirstCommunity')}
              </button>
            </div>
          ) : (
            <CommunitiesGrid
              communities={communities}
              viewMode={viewMode}
              loading={isFetching && communities.length > 0}
              onViewCommunity={handleViewCommunity}
              onViewMembers={handleViewMembers}
              onEditCommunity={handleEditCommunity}
              onDeleteCommunity={handleDeleteCommunity}
              onToggleStatus={handleToggleStatus}
              currentPage={currentPage}
              itemsPerPage={communitiesPerPage}
            />
          )}
        </div>

        {/* Pagination Footer */}
        {viewMode === 'list' && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalCommunities}
            itemsPerPage={communitiesPerPage}
            itemName="communities"
          />
        )}
      </div>
    </>
  );
};

export default CommunitiesPage;
