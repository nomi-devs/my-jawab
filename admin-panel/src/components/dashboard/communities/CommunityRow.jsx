// src/components/dashboard/communities/CommunityRow.jsx
import React, { useState } from 'react';
import { Users, Globe, Lock, Edit, Trash2, Eye } from 'lucide-react';

const CommunityRow = React.memo(({
  community,
  onEdit,
  onDelete,
  onViewDetails,
  onViewMembers,
  onToggleStatus,
  index = 0,
  serialNumber = 0
}) => {
  const [imageError, setImageError] = useState(false);

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
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <tr
      className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200"
      style={{
        animation: `fadeIn 0.3s ease-in-out ${index * 20}ms both`
      }}
    >
      <td className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
        {serialNumber}
      </td>
      {/* Community Name & Icon */}
      <td className="p-2 transition-colors">
        <div className="flex items-center space-x-2">
          {community.community_image && !imageError ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600 flex-shrink-0">
              <img
                src={community.community_image}
                alt={community.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-lg ${community.color || 'bg-blue-500'} flex items-center justify-center text-white flex-shrink-0`}>
              {community.icon || <Globe size={14} />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors truncate">
              {community.name}
            </div>
            {community.topics && community.topics.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {community.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic.id || topic.topic_id}
                    className="inline-flex items-center w-fit px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[9px]"
                  >
                    {topic.topic_name || topic.name}
                  </span>
                ))}
                {community.topics.length > 3 && (
                  <span className="text-gray-400 dark:text-gray-500 text-[9px]">
                    +{community.topics.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 text-[10px] transition-colors">
                No topics
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors max-w-xs">
        <div className="truncate" title={community.description}>
          {truncateText(community.description, 50)}
        </div>
      </td>

      {/* Status & Privacy */}
      <td className="p-2 transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${community.is_active
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
            : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
            }`}>
            <span className={`w-1 h-1 rounded-full mr-1 ${community.is_active ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-500 dark:bg-gray-400'
              }`}></span>
            {community.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>

      {/* Stats */}
      <td className="p-2 transition-colors">
        <button
          onClick={() => onViewMembers && onViewMembers(community)}
          className="flex flex-col gap-1 text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group/members font-medium"
        >
          {(community.members_count > 0) && (
            <div className="flex items-center space-x-1 border-b border-purple-100 dark:border-purple-900/40 pb-0.5">
              <Users size={10} />
              <span className="group-hover/members:underline">{community.members_count} members</span>
            </div>
          )}
          {(!community.members_count || community.members_count === 0) && (
            <span className="text-gray-400">No members</span>
          )}
        </button>
      </td>

      {/* Activity */}
      <td className="p-2 transition-colors">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${(community.posts_per_day || 0) >= 2
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : (community.posts_per_day || 0) >= 0.5
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
            }`}>
            {(community.posts_per_day || 0) >= 2 ? 'High' : (community.posts_per_day || 0) >= 0.5 ? 'Medium' : 'Low'}
          </span>
          <span className="ml-1.5 text-[10px] text-gray-400 font-medium">
            ({(community.posts_per_day || 0).toFixed(1)}/d)
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="p-2 text-right transition-colors">
        <div className="flex items-center justify-end space-x-1">
          {/* Active / Inactive Switch */}
          {onToggleStatus && (
            <label
              className="relative inline-flex items-center cursor-pointer mr-1"
              title={community.is_active ? 'Deactivate community' : 'Activate community'}
            >
              <input
                type="checkbox"
                checked={!!community.is_active}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleStatus(community.id, !community.is_active);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          )}
          <button
            onClick={() => onViewDetails && onViewDetails(community)}
            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit && onEdit(community)}
            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
            title="Edit Community"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete && onDelete(community.id)}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete Community"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

CommunityRow.displayName = 'CommunityRow';
export default CommunityRow;

