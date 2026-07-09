// src/components/dashboard/posts/PostsList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import PostsHeader from './PostsHeader';
import PostRow from './PostRow';
import PostCard from './PostCard';
import AddPostModal from './AddPostModal';
import EditPostModal from './EditPostModal';
import PostDetailsModal from './PostDetailsModal';
import ErrorMessage from '../../common/ErrorMessage';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import PaginationFooter from '../../common/PaginationFooter';
import TableSkeleton from '../../common/TableSkeleton';
import { usePostsList, usePostActions } from '../../../hooks/usePosts';

const PostsList = () => {
  const { t } = useTranslation('posts');
  const location = useLocation();
  const navigate = useNavigate();

  // UI State
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostForDetails, setSelectedPostForDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showAnalyticsAlert, setShowAnalyticsAlert] = useState(false);
  const [analyticsPost, setAnalyticsPost] = useState(null);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

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
      limit: postsPerPage,
      ...(debouncedSearchTerm &&
        debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(statusFilter && statusFilter !== 'all' && { post_status: statusFilter }),
      ...(featuredFilter !== 'all' &&
        featuredFilter !== null && {
          is_featured: featuredFilter,
        }),
    }),
    [
      currentPage,
      debouncedSearchTerm,
      statusFilter,
      featuredFilter,
      sortBy,
      sortOrder,
      postsPerPage,
    ],
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
  } = usePostsList(queryParams);

  const {
    createPost,
    updatePost,
    updatePostStatus,
    deletePost,
    isCreating,
    isUpdating,
    isUpdatingStatus,
    isDeleting,
  } = usePostActions();

  const posts = data?.posts || [];
  const totalPosts = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Handle navigation state from search
  useEffect(() => {
    const state = location.state;
    if (state && (state.searchPostId || state.searchQuery)) {
      const { searchPostId, searchQuery } = state;
      if (searchQuery) {
        setSearchTerm(searchQuery);
        setDebouncedSearchTerm(searchQuery);
        setCurrentPage(1);
      }
      if (searchPostId) {
        searchIdRef.current = searchPostId;
      }
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }
  }, [location.state, location.pathname, navigate]);

  // displayPosts memo for deep linked filtering
  const displayPosts = useMemo(() => {
    if (searchIdRef.current && posts.length > 0) {
      const filtered = posts.filter((post) => post.id === searchIdRef.current);
      if (filtered.length > 0) return filtered;
    }
    return posts;
  }, [posts]);

  // Action handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term || '');
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status || 'all');
    setCurrentPage(1);
  }, []);

  const handleFeaturedFilter = useCallback((featured) => {
    setFeaturedFilter(featured || 'all');
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    setSortBy(newSortBy || 'created_at');
    setSortOrder(newSortOrder || 'DESC');
    setCurrentPage(1);
  }, []);

  const handleUpdatePostStatus = useCallback(
    async (postId, statusData) => {
      try {
        await updatePostStatus({ id: postId, data: statusData });
        setSuccessMessage(t('postsList.postStatusUpdated'));
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error updating post status:', err);
      }
    },
    [updatePostStatus],
  );

  const handleEditPost = useCallback((post) => {
    setSelectedPost(post);
    setShowEditModal(true);
  }, []);

  const handleViewDetails = useCallback((post) => {
    setSelectedPostForDetails(post);
    setShowPostDetailsModal(true);
  }, []);

  const handleAddPost = useCallback(
    async (formData) => {
      try {
        await createPost(formData);
        setSuccessMessage(t('postsList.postCreated'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowAddModal(false);
      } catch (err) {
        console.error('Error creating post:', err);
      }
    },
    [createPost],
  );

  const handleSaveEdit = useCallback(
    async (postId, updatedData) => {
      try {
        if (updatedData instanceof FormData) {
          await updatePost({ id: postId, data: updatedData });
        } else {
          const hasStatusUpdate =
            updatedData.post_status !== undefined || updatedData.is_featured !== undefined;
          const hasContentUpdate = [
            'content',
            'title',
            'post_title',
            'post_content',
            'tags',
            'post_tags',
            'post_topic_id',
          ].some((k) => updatedData[k] !== undefined);

          if (hasStatusUpdate && !hasContentUpdate) {
            await updatePostStatus({
              id: postId,
              data: {
                post_status: updatedData.post_status,
                is_featured: updatedData.is_featured,
              },
            });
          } else if (hasContentUpdate) {
            const postData = {
              post_title: updatedData.title || updatedData.post_title,
              post_content: updatedData.content || updatedData.post_content,
              post_status: updatedData.post_status,
              is_featured: updatedData.is_featured,
              post_tags: updatedData.tags || updatedData.post_tags,
              post_topic_id: updatedData.post_topic_id,
              post_slug: updatedData.post_slug,
            };
            await updatePost({ id: postId, data: postData });
          }
        }
        setSuccessMessage(t('postsList.postUpdated'));
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowEditModal(false);
      } catch (err) {
        console.error('Error updating post:', err);
      }
    },
    [updatePost, updatePostStatus],
  );

  const handleDeletePost = useCallback(
    (postId) => {
      const post = posts.find((post) => post.id === postId);
      setPostToDelete(post);
      setShowDeleteConfirm(true);
    },
    [posts],
  );

  const confirmDeletePost = useCallback(async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete.id);
      setSuccessMessage(t('postsList.postDeleted'));
      setShowDeleteConfirm(false);
      setPostToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  }, [postToDelete, deletePost]);

  const handleViewAnalytics = useCallback((post) => {
    setAnalyticsPost(post);
    setShowAnalyticsAlert(true);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
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
          'w-[260px]',
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
        message={queryError?.message || t('postsList.failedToLoad')}
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
          setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        type="danger"
        title={t('postsList.deletePostTitle')}
        message={
          postToDelete
            ? t('postsList.deletePostConfirm', { name: postToDelete.author.name })
            : ''
        }
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={isDeleting}
      />

      <AlertModal
        isOpen={showAnalyticsAlert}
        onClose={() => {
          setShowAnalyticsAlert(false);
          setAnalyticsPost(null);
        }}
        type="info"
        title={t('postsList.analyticsTitle')}
        message={
          analyticsPost
            ? t('postsList.analyticsMessage', { name: analyticsPost.author.name })
            : ''
        }
        duration={0}
      />

      <AddPostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPost={handleAddPost}
        loading={isCreating}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onSave={handleSaveEdit}
        loading={isUpdating || isUpdatingStatus}
      />

      <PostDetailsModal
        isOpen={showPostDetailsModal}
        onClose={() => {
          setShowPostDetailsModal(false);
          setSelectedPostForDetails(null);
        }}
        postId={selectedPostForDetails?.id}
        postData={selectedPostForDetails}
        onUpdateStatus={handleUpdatePostStatus}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        <PostsHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          postCount={totalPosts}
          onAddClick={() => setShowAddModal(true)}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onFeaturedFilter={handleFeaturedFilter}
          onSortChange={handleSortChange}
          loading={isRefreshing}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          featuredFilter={featuredFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRefresh={() => refetch()}
        />

        <div
          className={`relative overflow-hidden transition-all duration-300 ${isRefreshing ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('postsList.updatingText')}
              </span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto transition-all duration-300 ease-in-out"
          style={{
            minHeight: displayPosts.length === 0 ? '400px' : 'auto',
            opacity: isRefreshing ? 0.6 : 1,
            scrollbarGutter: 'stable',
          }}
        >
          {displayPosts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('postsList.noPostsFound')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || featuredFilter !== 'all'
                  ? t('postsList.tryChangingFilters')
                  : t('postsList.startAddingFirstPost')}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('postsList.addFirstPostButton')}
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full text-start border-collapse transition-opacity duration-300">
              <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
                <tr>
                  <th className="p-4 w-16">{t('postsList.tableHeaders.serial')}</th>
                  <th className="p-4">{t('postsList.tableHeaders.postAuthor')}</th>
                  <th className="p-4">{t('postsList.tableHeaders.content')}</th>
                  <th className="p-4">{t('common:status')}</th>
                  <th className="p-4">{t('postsList.tableHeaders.stats')}</th>
                  <th className="p-4">{t('common:date')}</th>
                  <th className="p-4 text-end">{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
                {displayPosts.map((post, index) => {
                  const serialNumber = (currentPage - 1) * postsPerPage + index + 1;
                  return (
                    <PostRow
                      key={post.id}
                      post={post}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                      onAnalytics={handleViewAnalytics}
                      onUpdateStatus={handleUpdatePostStatus}
                      onViewDetails={handleViewDetails}
                      index={index}
                      serialNumber={serialNumber}
                    />
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {displayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onAnalytics={handleViewAnalytics}
                  onUpdateStatus={handleUpdatePostStatus}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {viewMode === 'list' && displayPosts.length > 0 && (
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalPosts}
            itemsPerPage={postsPerPage}
            itemName="posts"
          />
        )}
      </div>
    </>
  );
};

export default PostsList;
