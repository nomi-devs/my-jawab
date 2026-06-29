// src/components/dashboard/comments/CommentRow.jsx
import React from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock, CheckCircle, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';

const CommentRow = React.memo(({
  comment,

  onDelete,
  onViewDetails,
  onApprove,
  onUnapprove,
  index = 0
}) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getUserInitials = (name) => {
    return name?.charAt(0).toUpperCase() || 'U';
  };

  const getStatusBadge = () => {
    if (comment.is_reported) {
      return (
        <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
          <AlertCircle size={9} className="mr-0.5" />
          Reported
        </span>
      );
    } else if (!comment.is_approved) {
      return (
        <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
          <Clock size={9} className="mr-0.5" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle size={9} className="mr-0.5" />
          Approved
        </span>
      );
    }
  };

  return (
    <tr
      className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200"
      style={{
        animation: `fadeIn 0.3s ease-in-out ${index * 20}ms both`
      }}
    >
      {/* User & Content */}
      <td className="p-2 transition-colors">
        <div className="flex items-center space-x-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors flex-shrink-0 ${comment.user?.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
            comment.user?.role === 'moderator' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
            {getUserInitials(comment.user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors truncate">
              {comment.user?.name || 'Anonymous'}
            </div>
          </div>
        </div>
      </td>

      {/* Content Preview */}
      <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors max-w-xs">
        <div className="truncate" title={comment.content}>
          {truncateText(comment.content, 50)}
        </div>
      </td>

      {/* Status */}
      <td className="p-2 transition-colors">
        {getStatusBadge()}
      </td>

      {/* Post & Stats */}
      <td className="p-2 transition-colors">
        <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
          <div className="truncate" title={comment.post?.title}>
            {truncateText(comment.post?.title || 'Unknown Post', 30)}
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="flex items-center space-x-0.5" title="Likes">
              <ThumbsUp size={9} />
              <span>{comment.likes_count || comment.like_count || 0}</span>
            </span>
            <span className="flex items-center space-x-0.5 text-red-500" title="Unlikes">
              <ThumbsDown size={9} />
              <span>{comment.dislike_count || 0}</span>
            </span>
          </div>
        </div>
      </td>

      {/* Date */}
      <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
        {formatDate(comment.created_at)}
      </td>

      {/* Actions */}
      <td className="p-2 text-right transition-colors">
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => onViewDetails && onViewDetails(comment)}
            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          {!comment.is_approved && onApprove && (
            <button
              onClick={() => onApprove(comment.id)}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
              title="Approve Comment"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {comment.is_approved && onUnapprove && (
            <button
              onClick={() => onUnapprove(comment.id)}
              className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
              title="Unapprove Comment"
            >
              <AlertCircle size={14} />
            </button>
          )}

          <button
            onClick={() => onDelete && onDelete(comment.id)}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete Comment"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

CommentRow.displayName = 'CommentRow';
export default CommentRow;

