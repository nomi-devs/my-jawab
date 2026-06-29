// src/components/dashboard/communities/CommunitiesGrid.jsx
import React, { useState } from 'react';
import CommunityRow from './CommunityRow';
import {
  Globe,
  Settings,
  Eye,
  Users,
  TrendingUp,
  Lock,
  Unlock,
  Edit,
  Trash2
} from 'lucide-react';

const CommunityCard = React.memo(({ community, index, onViewCommunity, onViewMembers, onEditCommunity, onDeleteCommunity, onToggleStatus, getStatusBadge, getMemberCountDisplay, getActivityLevel }) => {
  const [headerImageError, setHeaderImageError] = useState(false);
  const [thumbnailImageError, setThumbnailImageError] = useState(false);

  return (
    <div
      key={community.id}
      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden group transition-all hover:shadow-lg animate-fadeIn ${community.is_active
        ? 'border-green-200 dark:border-green-800'
        : 'border-gray-200 dark:border-gray-700'
        }`}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Header with image or color */}
      <div className={`h-24 ${community.community_image && !headerImageError ? 'bg-gray-100 dark:bg-gray-700' : (community.color || 'bg-blue-500')} relative overflow-hidden`}>
        {community.community_image && !headerImageError ? (
          <img
            src={community.community_image}
            alt={community.name}
            className="w-full h-full object-cover"
            onError={() => setHeaderImageError(true)}
          />
        ) : null}
        <div className="absolute -bottom-8 left-6">
          <div className="w-16 h-16 rounded-xl bg-white p-1 border border-purple-100 shadow-sm">
            {community.community_image && !thumbnailImageError ? (
              <img
                src={community.community_image}
                alt={community.name}
                className="w-full h-full rounded-lg object-cover"
                onError={() => setThumbnailImageError(true)}
              />
            ) : (
              <div className={`w-full h-full rounded-lg ${community.color || 'bg-blue-500'} opacity-80 flex items-center justify-center text-white`}>
                {community.icon || <Globe size={24} />}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          {getStatusBadge(community.is_active)}
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 px-6 pb-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
            {community.name}
          </h3>
        </div>

        {community.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 transition-colors">
            {community.description}
          </p>
        )}

        {/* Topics */}
        {community.topics && community.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {community.topics.slice(0, 3).map((topic) => (
              <span
                key={topic.id || topic.topic_id}
                className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full"
              >
                {topic.topic_name || topic.name}
              </span>
            ))}
            {community.topics.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">
                +{community.topics.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between mt-4 text-sm">
          <button
            onClick={() => onViewMembers && onViewMembers(community)}
            className="group/stats flex flex-col text-left items-start transition-colors"
          >
            <span className="text-purple-600 dark:text-purple-400 text-[10px] uppercase font-bold flex items-center transition-colors mb-1">
              <Users size={12} className="mr-1" />
              Members
            </span>
            {(community.members_count > 0) && (
              <span className="font-bold text-purple-700 dark:text-purple-300 text-sm border-b border-purple-200 dark:border-purple-800 hover:border-purple-600 transition-all">
                {getMemberCountDisplay(community.members_count)}
              </span>
            )}
            {(!community.members_count || community.members_count === 0) && (
              <span className="font-semibold text-gray-400 dark:text-gray-500 mt-1 transition-colors text-xs">
                No members
              </span>
            )}
          </button>
          <div className="flex flex-col text-right">
            <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-medium flex items-center justify-end transition-colors">
              <TrendingUp size={12} className="mr-1" />
              Activity
            </span>
            <span className={`font-semibold mt-1 transition-colors ${community.posts_per_day >= 2 ? 'text-green-600 dark:text-green-400' :
              community.posts_per_day >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
              {getActivityLevel(community.posts_per_day || 0)}
            </span>
          </div>
        </div>

        {/* Admin/Owner Info */}
        {community.owner && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400 mr-2 transition-colors">
                {community.owner.name?.charAt(0) || 'A'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors">
                <span className="font-medium">Owner: </span>
                {community.owner.name || 'Admin'}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Active / Inactive Switch */}
          {onToggleStatus && (
            <label
              className="relative inline-flex items-center cursor-pointer"
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
              <div className="w-8 h-4 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          )}
          <button
            onClick={() => onViewCommunity && onViewCommunity(community)}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEditCommunity && onEditCommunity(community)}
            className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            title="Edit Community"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDeleteCommunity && onDeleteCommunity(community.id)}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Community"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

CommunityCard.displayName = 'CommunityCard';

const CommunitiesGrid = React.memo(({
  communities = [],
  viewMode = 'grid',
  loading = false,
  onViewCommunity,
  onViewMembers,
  onEditCommunity,
  onDeleteCommunity,
  onToggleStatus,
  currentPage = 1,
  itemsPerPage = 10
}) => {

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
        Inactive
      </span>
    );
  };

  const getMemberCountDisplay = (membersCount) => {
    if (membersCount >= 1000000) {
      return `${(membersCount / 1000000).toFixed(1)}M`;
    } else if (membersCount >= 1000) {
      return `${(membersCount / 1000).toFixed(1)}k`;
    }
    return membersCount.toString();
  };

  const getActivityLevel = (postsPerDay) => {
    if (postsPerDay >= 2) return 'High';
    if (postsPerDay >= 0.5) return 'Medium';
    return 'Low';
  };






  if (communities.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No communities found</h3>
        <p className="text-gray-500 dark:text-gray-400">Try changing your search or filters</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <>
        <table className="w-full text-left border-collapse transition-opacity duration-300">
          <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
            <tr>
              <th className="p-4 w-16">#</th>
              <th className="p-4">Community</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4">Members</th>
              <th className="p-4">Activity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
            {communities.map((community, index) => {
              const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <CommunityRow
                  key={community.id}
                  community={community}
                  onEdit={onEditCommunity}
                  onDelete={onDeleteCommunity}
                  onViewDetails={onViewCommunity}
                  onViewMembers={onViewMembers}
                  onToggleStatus={onToggleStatus}
                  index={index}
                  serialNumber={serialNumber}
                />
              );
            })}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {communities.map((community, index) => (
        <CommunityCard
          key={community.id}
          community={community}
          index={index}
          onViewCommunity={onViewCommunity}
          onViewMembers={onViewMembers}
          onEditCommunity={onEditCommunity}
          onDeleteCommunity={onDeleteCommunity}
          onToggleStatus={onToggleStatus}
          getStatusBadge={getStatusBadge}
          getMemberCountDisplay={getMemberCountDisplay}
          getActivityLevel={getActivityLevel}
        />
      ))}
    </div>
  );
});

CommunitiesGrid.displayName = 'CommunitiesGrid';
export default CommunitiesGrid;