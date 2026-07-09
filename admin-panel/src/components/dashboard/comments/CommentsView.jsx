// src/components/dashboard/comments/CommentsView.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommentsList, useCommentActions } from '../../../hooks/useComments';
import CommentsHeader from './CommentsHeader';
import CommentRow from './CommentRow';
import CommentsDetailsModal from './CommentsDetailsModal';
import ErrorMessage from '../../common/ErrorMessage';
import AlertModal from '../../common/AlertModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import TableSkeleton from '../../common/TableSkeleton';
import PaginationFooter from '../../common/PaginationFooter';
import {
  MessageSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Trash2,
  CheckCircle,
  Eye,
} from 'lucide-react';

const CommentsView = () => {
  const { t } = useTranslation('comments');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showCommentDetailsModal, setShowCommentDetailsModal] = useState(false);
  const [selectedCommentForDetails, setSelectedCommentForDetails] = useState(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('list');
  const commentsPerPage = 10;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Prepare query parameters
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: commentsPerPage,
      ...(searchTerm && searchTerm.trim() && { search: searchTerm.trim() }),
      sort_by: sortBy,
      sort_order: sortOrder,
      is_approved:
        statusFilter === 'approved'
          ? 'approved'
          : statusFilter === 'pending'
            ? 'not_approved'
            : undefined, // statusFilter 'all' maps to undefined
    }),
    [currentPage, commentsPerPage, searchTerm, sortBy, sortOrder, statusFilter],
  );

  // Use TanStack Query
  const {
    data,
    isLoading: isInitialLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useCommentsList(queryParams);

  const { deleteComment, updateComment } = useCommentActions();

  const comments = data?.comments || [];
  const totalComments = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Use effective loading state for UI (shimmer only on initial load)
  const loading = isInitialLoading;
  const error = isError ? queryError?.message || t('commentsView.loadError') : null;

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

  // Handle delete comment
  const handleDeleteComment = useCallback(
    (commentId, commentContent) => {
      const comment = comments.find((c) => c.id === commentId);
      setCommentToDelete({ id: commentId, content: commentContent });
      setShowDeleteConfirm(true);
    },
    [comments],
  );

  const confirmDeleteComment = useCallback(async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(commentToDelete.id);
      setSuccessMessage(t('commentsView.deleteSuccess'));
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting comment:', err);
      // setError('Failed to delete comment. Please try again.');
      alert(t('commentsView.deleteFailed', { message: err.message }));
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  }, [commentToDelete, deleteComment, t]);

  // Handle view comment details
  const handleViewDetails = useCallback((comment) => {
    setSelectedCommentForDetails(comment);
    setShowCommentDetailsModal(true);
  }, []);

  // Handle approve comment
  const handleApproveComment = useCallback(
    async (commentId) => {
      try {
        // Use updateComment API to approve comment
        await updateComment({ id: commentId, data: { is_approved: true } });
        setSuccessMessage(t('commentsView.approveSuccess'));
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error approving comment:', err);
        alert(t('commentsView.approveFailed', { message: err.message }));
      }
    },
    [updateComment, t],
  );

  // Handle unapprove comment
  const handleUnapproveComment = useCallback(
    async (commentId) => {
      try {
        // Use updateComment API to unapprove comment
        await updateComment({ id: commentId, data: { is_approved: false } });
        setSuccessMessage(t('commentsView.unapproveSuccess'));
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error unapproving comment:', err);
        alert(t('commentsView.unapproveFailed', { message: err.message }));
      }
    },
    [updateComment, t],
  );

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('commentsView.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('commentsView.hoursAgo', { count: diffHours });
    } else {
      return t('commentsView.daysAgo', { count: diffDays });
    }
  };

  // Get user avatar initials
  const getUserInitials = (name) => {
    return name?.charAt(0).toUpperCase() || 'U';
  };

  // Get status badge
  const getStatusBadge = (comment) => {
    if (comment.is_reported) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle size={10} className="me-1" />
          {t('commentsView.status.reported')}
        </span>
      );
    } else if (!comment.is_approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <Clock size={10} className="me-1" />
          {t('commentsView.status.pending')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={10} className="me-1" />
          {t('commentsView.status.approved')}
        </span>
      );
    }
  };

  // Show loading state
  // Initial loading: shimmer skeleton instead of circle loader
  if (loading && comments.length === 0) {
    return (
      <TableSkeleton
        rows={10}
        columns={6}
        showAvatar
        showActions
        columnWidths={[
          'w-[260px]', // User & Content
          'w-[260px]', // Content
          'w-[120px]', // Status
          'w-[160px]', // Post & Stats
          'w-[130px]', // Date
          'w-[100px]', // Actions
        ]}
        containerClassName="min-h-[560px]"
      />
    );
  }

  // Show error state
  if (error && comments.length === 0) {
    return <ErrorMessage message={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
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
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title={t('common:error')}
        message={error}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCommentToDelete(null);
        }}
        onConfirm={confirmDeleteComment}
        type="danger"
        title={t('commentsView.deleteCommentTitle')}
        message={commentToDelete ? t('commentsView.deleteConfirmMessage') : ''}
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
      />

      {/* Comment Details Modal */}
      <CommentsDetailsModal
        isOpen={showCommentDetailsModal}
        onClose={() => {
          setShowCommentDetailsModal(false);
          setSelectedCommentForDetails(null);
        }}
        commentId={selectedCommentForDetails?.id}
        commentData={selectedCommentForDetails}
        onApprove={handleApproveComment}
        onDelete={(commentId) => {
          const comment = comments.find((c) => c.id === commentId);
          handleDeleteComment(commentId, comment?.content);
          setShowCommentDetailsModal(false);
        }}
      />

      {/* Header */}
      <CommentsHeader
        commentCount={totalComments}
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
          loading && comments.length > 0 ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('commentsView.updating')}</span>
          </div>
        </div>
      </div>

      <div
        className="overflow-x-auto transition-all duration-300 ease-in-out"
        style={{
          minHeight: comments.length === 0 ? '400px' : 'auto',
          opacity: loading && comments.length > 0 ? 0.6 : 1,
          scrollbarGutter: 'stable',
        }}
      >
        {loading && comments.length === 0 ? (
          <div className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('commentsView.loadingComments')}</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <MessageSquare className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('commentsView.noCommentsFound')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all'
                ? t('commentsView.tryChangingFilters')
                : t('commentsView.noCommentsYet')}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <>
            <table className="w-full text-start border-collapse transition-opacity duration-300">
              <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
                <tr>
                  <th className="p-4">{t('commentsView.tableHeaders.user')}</th>
                  <th className="p-4">{t('commentsView.tableHeaders.content')}</th>
                  <th className="p-4">{t('common:status')}</th>
                  <th className="p-4">{t('commentsView.tableHeaders.postStats')}</th>
                  <th className="p-4">{t('common:date')}</th>
                  <th className="p-4 text-end">{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
                {comments.map((comment, index) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    onDelete={(commentId) => handleDeleteComment(commentId, comment.content)}
                    onViewDetails={handleViewDetails}
                    onApprove={handleApproveComment}
                    onUnapprove={handleUnapproveComment}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-4 hover:shadow-lg transition-all animate-fadeIn"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0 ${
                      comment.user.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : comment.user.role === 'moderator'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {getUserInitials(comment.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                        {comment.user.name}
                      </span>
                      {getStatusBadge(comment)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {comment.content}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimeAgo(comment.created_at)}
                  </span>
                  <span className="flex items-center gap-1" title={t('commentRow.likes')}>
                    <ThumbsUp size={12} />
                    {comment.likes_count || comment.like_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-red-500 w-12" title={t('commentRow.unlikes')}>
                    <ThumbsDown size={12} />
                    {comment.dislike_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleViewDetails(comment)}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('commentsView.viewDetails')}
                  >
                    <Eye size={16} />
                  </button>
                  {!comment.is_approved && (
                    <button
                      onClick={() => handleApproveComment(comment.id)}
                      className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title={t('commentsView.approveComment')}
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {comment.is_approved && (
                    <button
                      onClick={() => handleUnapproveComment(comment.id)}
                      className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title={t('commentsView.unapproveComment')}
                    >
                      <AlertCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteComment(comment.id, comment.content)}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('commentsView.deleteComment')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {viewMode === 'list' && (
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalComments}
          itemsPerPage={commentsPerPage}
          itemName="comments"
        />
      )}
    </div>
  );
};

export default CommentsView;
