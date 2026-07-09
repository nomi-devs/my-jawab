// src/components/dashboard/posts/PostRow.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Heart, ThumbsDown, Edit, Trash2, Eye } from 'lucide-react';
import { normalizeMediaUrl } from '../../../utils/mediaUtils';

const PostRow = React.memo(
  ({
    post,
    onEdit,
    onDelete,
    onAnalytics,
    onUpdateStatus,
    onViewDetails,
    index = 0,
    serialNumber = 0,
  }) => {
    const { t } = useTranslation('posts');

    const formatDate = (timestamp) => {
      if (!timestamp) return t('postRow.notAvailable');
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const getStatusBadge = (status) => {
      const statusConfig = {
        published: {
          label: t('postRow.status.published'),
          className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
          dot: 'bg-green-500 dark:bg-green-400',
        },
        draft: {
          label: t('postRow.status.draft'),
          className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
          dot: 'bg-yellow-500 dark:bg-yellow-400',
        },
        archived: {
          label: t('postRow.status.archived'),
          className: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
          dot: 'bg-gray-500 dark:bg-gray-400',
        },
      };

      const config = statusConfig[status] || statusConfig['draft'];

      return (
        <span
          className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${config.className}`}
        >
          <span className={`w-1 h-1 rounded-full me-1 ${config.dot}`}></span>
          {config.label}
        </span>
      );
    };

    const truncateText = (text, maxLength = 80) => {
      if (!text) return t('postRow.noContent');
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    return (
      <tr
        className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200"
        style={{
          animation: `fadeIn 0.3s ease-in-out ${index * 20}ms both`,
        }}
      >
        <td className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
          {serialNumber}
        </td>
        {/* Author & Title */}
        <td className="p-2 transition-colors">
          <div className="flex items-center gap-2">
            <img
              src={
                post.author?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'user'}`
              }
              alt={post.author?.name || t('postRow.userFallback')}
              className="w-7 h-7 rounded-full bg-purple-200 dark:bg-purple-900/30 border border-white dark:border-gray-700 transition-transform duration-200 hover:scale-105 flex-shrink-0"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors truncate">
                {post.title || truncateText(post.content, 50)}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-[10px] transition-colors truncate">
                {post.author?.name || t('postRow.unknownAuthor')} •{' '}
                {post.author?.username || t('postRow.userFallback')}
              </div>
            </div>
            {/* Post Thumbnail */}
            {(post.media?.url || post.raw?.post_image) && post.media?.type === 'image' && (
              <img
                src={normalizeMediaUrl(post.media?.url || post.raw?.post_image)}
                alt="Post thumbnail"
                className="w-12 h-12 rounded-lg object-cover border border-purple-200 dark:border-gray-600 flex-shrink-0"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
        </td>

        {/* Content Preview */}
        <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors max-w-xs">
          <div className="truncate" title={post.content}>
            {truncateText(post.content, 60)}
          </div>
        </td>

        {/* Status */}
        <td className="p-2 transition-colors">
          {getStatusBadge(post.post_status || 'draft')}
          {post.is_featured && (
            <span className="ms-1.5 inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 transition-colors">
              {t('postRow.featuredBadge')}
            </span>
          )}
        </td>

        {/* Stats */}
        <td className="p-2 transition-colors">
          <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1" title={t('postRow.likesTitle')}>
              <Heart
                size={10}
                className={post.stats?.likes > 0 ? 'text-red-500 fill-red-500' : ''}
              />
              <span>{(post.stats?.likes || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title={t('postRow.dislikesTitle')}>
              <ThumbsDown
                size={10}
                className={post.stats?.dislikes > 0 ? 'text-amber-600 fill-amber-600' : ''}
              />
              <span>{(post.stats?.dislikes || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title={t('postRow.commentsTitle')}>
              <MessageCircle size={10} />
              <span>{(post.stats?.comments || 0).toLocaleString()}</span>
            </div>
            <div className="text-[10px]">
              {(post.stats?.views || 0) >= 1000
                ? `${((post.stats?.views || 0) / 1000).toFixed(1)}k`
                : (post.stats?.views || 0).toLocaleString()}{' '}
              {t('postRow.viewsInline')}
            </div>
          </div>
        </td>

        {/* Date */}
        <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {formatDate(post.timestamp || post.created_at)}
        </td>

        {/* Actions */}
        <td className="p-2 text-end transition-colors">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onViewDetails && onViewDetails(post)}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('postRow.viewDetailsTitle')}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => onEdit(post)}
              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
              title={t('postRow.editPostTitle')}
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title={t('postRow.deletePostTitle')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

PostRow.displayName = 'PostRow';
export default PostRow;
