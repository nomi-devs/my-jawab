// src/components/dashboard/posts/PostCard.jsx
import React from 'react';
import {
  MessageCircle,
  Heart,
  ThumbsDown,
  Share2,
  Globe,
  Image as ImageIcon,
  Video,
  Lock,
  Clock,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

const PostCard = React.memo(
  ({ post, onEdit, onDelete, onAnalytics, onUpdateStatus, onViewDetails }) => {
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getVisibilityIcon = (visibility) => {
      switch (visibility) {
        case 'private':
          return <Lock size={14} className="text-gray-400 dark:text-gray-500" />;
        case 'followers':
          return <Globe size={14} className="text-blue-400" />;
        default:
          return <Globe size={14} className="text-green-400" />;
      }
    };

    const truncateContent = (content, maxLength = 150) => {
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + '...';
    };

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all ${post.hidden ? 'opacity-60' : ''}`}
      >
        {/* Card Header */}
        <div className="p-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Author Avatar */}
              <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-900/30 flex-shrink-0 overflow-hidden border-2 border-white dark:border-gray-700">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Author Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate transition-colors">
                    {post.author.name}
                  </h4>
                  {getVisibilityIcon(post.visibility)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                    @{post.author.username}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                    {formatTime(post.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(post)}
                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(post)}
                  className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Edit Post"
                >
                  <Edit size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(post.id)}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Post"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 transition-colors">
            {truncateContent(post.content)}
          </p>

          {/* Media Preview */}
          {post.media && (
            <div className="mb-3 rounded-lg overflow-hidden bg-purple-50 dark:bg-gray-700/50">
              {post.media.type === 'image' ? (
                <img
                  src={post.media.url || 'https://via.placeholder.com/400x300'}
                  alt="Post media"
                  className="w-full h-48 object-cover"
                />
              ) : post.media.type === 'video' ? (
                <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center">
                  <Video size={48} className="text-white opacity-75" />
                </div>
              ) : null}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-purple-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 transition-colors">
              <div className="flex items-center gap-1.5" title="Likes">
                <Heart
                  size={14}
                  className={post.stats.likes > 0 ? 'text-red-500 fill-red-500' : ''}
                />
                <span>{(post.stats.likes || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Dislikes">
                <ThumbsDown
                  size={14}
                  className={post.stats.dislikes > 0 ? 'text-amber-600 fill-amber-600' : ''}
                />
                <span>{(post.stats.dislikes || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Comments">
                <MessageCircle size={14} />
                <span>{(post.stats.comments || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {post.post_status && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    post.post_status === 'published'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : post.post_status === 'draft'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } transition-colors`}
                >
                  {post.post_status}
                </span>
              )}
              {post.scheduled && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Clock size={12} />
                  <span>Scheduled</span>
                </div>
              )}
              {post.hidden && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full transition-colors">
                  Hidden
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PostCard.displayName = 'PostCard';
export default PostCard;
