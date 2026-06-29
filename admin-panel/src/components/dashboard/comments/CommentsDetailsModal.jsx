// src/components/dashboard/comments/CommentsDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Calendar, User, FileText, ThumbsUp, Edit, Trash2, CheckCircle, XCircle, Loader2, Settings, AlertCircle, Save } from 'lucide-react';
import commentsApi from '../../../api/commentsApi';

const CommentsDetailsModal = ({ isOpen, onClose, commentId, commentData, onApprove, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [commentDetails, setCommentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && commentId) {
      fetchCommentDetails();
    }
  }, [isOpen, commentId]);

  const fetchCommentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentsApi.getComment(commentId);
      setCommentDetails(response.data);
    } catch (err) {
      console.error('Error fetching comment details:', err);
      setError('Failed to load comment details');
      // Use provided commentData as fallback
      if (commentData) {
        const isApproved = commentData.is_approved || false;
        setCommentDetails({
          ...commentData,
          comment_content: commentData.content || commentData.comment_content,
          is_approved: isApproved,
          is_reported: commentData.is_reported || false,
          like_count: commentData.likes_count || 0
        });
      }
    } finally {
      setLoading(false);
    }
  };





  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const comment = commentDetails || commentData;

  const getStatusBadge = () => {
    if (comment?.is_reported) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
          <AlertCircle size={14} className="mr-2" />
          Reported
        </span>
      );
    } else if (!comment?.is_approved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
          <XCircle size={14} className="mr-2" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle size={14} className="mr-2" />
          Approved
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {comment && (
              <>
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                    {loading ? 'Loading...' : 'Comment Details'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {getStatusBadge()}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs - REMOVED */}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading && !comment ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error && !comment ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab Content - Always Visible */}
              {comment && (
                <div className="px-6 py-5 space-y-5">
                  {/* Comment Content */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Content</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {comment.comment_content || comment.content || 'No content'}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {((comment.like_count > 0) || (comment.likes_count > 0)) && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ThumbsUp size={14} className="text-purple-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Likes</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {comment.like_count || comment.likes_count || 0}
                        </p>
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText size={14} className="text-blue-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Post</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {comment.post?.post_title || comment.post?.title || 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={14} className="text-green-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Author</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {comment.user?.username || comment.user?.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Author</h3>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-purple-200 dark:border-purple-700 ${comment.user?.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          comment.user?.role === 'moderator' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {comment.user?.name || comment.user?.username || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{comment.user?.username || 'user'}
                            {comment.user?.role && ` • ${comment.user.role}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Created</h3>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar size={14} />
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>

          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(commentId);
                  onClose();
                }}
                className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}

          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div >
  );
};

export default CommentsDetailsModal;

