// src/components/dashboard/communities/CommunitiesDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, Globe, Lock, Calendar, User, FileText, TrendingUp, Edit, Trash2, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';
import communitiesApi from '../../../api/communitiesApi';

const CommunitiesDetailsModal = ({
  isOpen,
  onClose,
  communityId,
  communityData,
  onUpdateStatus,
  onEdit,
  onDelete,
  initialTab = 'details'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [communityDetails, setCommunityDetails] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const membersLimit = 10;

  useEffect(() => {
    if (isOpen && communityId) {
      setImageError(false);
      setActiveTab(initialTab);
      // Reset members state when community changes
      setMembers([]);
      setMembersPage(1);
      setTotalMembers(0);
      setTotalPages(1);
      fetchCommunityDetails();
      if (initialTab === 'members') {
        fetchMembers(1);
      }
    }
  }, [isOpen, communityId, initialTab]);

  useEffect(() => {
    if (activeTab === 'members' && !membersLoading) {
      fetchMembers(1);
    }
  }, [activeTab, communityId]);

  // Normalize is_active to boolean (handles both string 'active'/'inactive' and boolean)
  const normalizeIsActive = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'active' || value === true || value === 1) return true;
    if (value === 'inactive' || value === false || value === 0) return false;
    return false; // default to false
  };

  const fetchCommunityDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communitiesApi.getCommunity(communityId);
      const communityData = response.data;
      // Normalize is_active to boolean
      setCommunityDetails({
        ...communityData,
        is_active: normalizeIsActive(communityData.is_active)
      });
    } catch (err) {
      console.error('Error fetching community details:', err);
      setError('Failed to load community details');
      // Use provided communityData as fallback
      if (communityData) {
        setCommunityDetails({
          ...communityData.raw || communityData,
          community_name: communityData.name || communityData.community_name,
          community_description: communityData.description || communityData.community_description,
          community_image: communityData.community_image || communityData.raw?.community_image || null,
          is_active: normalizeIsActive(communityData.is_active),
          member_count: communityData.members_count || 0,
          moderator_count: communityData.moderator_count || 0,
          topic_count: communityData.topic_count || 0
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!communityId) return;

    try {
      setUpdatingStatus(true);
      const updateData = { is_active: newStatus };
      await communitiesApi.updateCommunityStatus(communityId, updateData);

      // Update local state
      setCommunityDetails(prev => ({
        ...prev,
        is_active: newStatus // Store as boolean for consistency
      }));

      // Call parent callback if provided
      if (onUpdateStatus) {
        onUpdateStatus(communityId, newStatus);
      }

      // Refresh the modal data
      await fetchCommunityDetails();
    } catch (err) {
      console.error('Error updating community status:', err);
      setError('Failed to update community status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchMembers = async (page = 1) => {
    try {
      setMembersLoading(true);
      const response = await communitiesApi.getCommunityMembers(communityId, {
        page,
        limit: membersLimit
      });

      if (response && response.data) {
        setMembers(response.data.data || []);
        setMembersPage(response.data.meta?.page || 1);
        setTotalMembers(response.data.meta?.total || 0);
        setTotalPages(response.data.meta?.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
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

  const community = communityDetails || communityData;
  // Normalize is_active to boolean for consistent comparison
  const isActive = community ? normalizeIsActive(community.is_active) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {community && (
              <>
                {(community.community_image || communityData?.community_image) && !imageError ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600 flex-shrink-0">
                    <img
                      src={community.community_image || communityData?.community_image}
                      alt={community.community_name || community.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-lg ${community.color || 'bg-blue-500'} flex items-center justify-center text-white flex-shrink-0`}>
                    {community.icon || <Globe size={18} className="text-white" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                    {loading ? 'Loading...' : (community.community_name || community.name || 'Community Details')}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${isActive
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                      : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
                      }`}>
                      <span className={`w-1 h-1 rounded-full mr-1 ${isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-500 dark:bg-gray-400'
                        }`}></span>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">ID: {communityId}</span>
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

        {/* Tabs */}
        <div className="flex px-6 border-b border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-xs font-semibold transition-all border-b-2 ${activeTab === 'details'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'members'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Members
            {community && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'members' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}>
                {community.member_count || community.members_count || 0}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading && !community ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error && !community ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && community && (
                <div className="px-6 py-5 space-y-5">
                  {/* ... existing details ... */}
                  {/* Community Image */}
                  {(community.community_image || communityData?.community_image) && !imageError && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Community Image</h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="relative w-full max-w-md mx-auto">
                          <img
                            src={community.community_image || communityData?.community_image}
                            alt={community.community_name || community.name}
                            className="w-full h-auto rounded-lg object-cover shadow-md"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Description</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {community.community_description || community.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(community.member_count > 0 || community.members_count > 0) && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={18} className="text-purple-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Members</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {community.member_count || community.members_count || 0}
                        </p>
                      </div>
                    )}
                    {community.topic_count > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={18} className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Topics</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {community.topic_count}
                        </p>
                      </div>
                    )}
                    {community.moderator_count > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={18} className="text-green-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Moderators</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {community.moderator_count}
                        </p>
                      </div>
                    )}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={18} className="text-amber-500" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Activity</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {community.posts_per_day ? `${community.posts_per_day}/day` : '0/day'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Category</h3>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="capitalize">{community.category || 'General'}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Created</h3>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar size={18} />
                        <span>{formatDate(community.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  {community.owner && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Owner</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-2 border-purple-200 dark:border-purple-700">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {community.owner.name?.charAt(0) || community.owner.username?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {community.owner.name || community.owner.username || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{community.owner.username || 'user'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    {membersLoading && members.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-purple-600 mb-4" />
                        <p className="text-sm text-gray-500">Loading members...</p>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">No members found</h3>
                        <p className="text-xs text-gray-500 mt-1">This community doesn't have any members yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-purple-100 dark:border-gray-700">
                                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Posts</th>
                                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Joined</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50 dark:divide-gray-700/50">
                              {Array.isArray(members) && members.map((member) => (
                                <tr key={member.id} className="hover:bg-purple-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                  <td className="py-4">
                                    <div className="flex items-center gap-3">
                                      {member.user?.profile_picture ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-100 dark:border-purple-900/30">
                                          <img
                                            src={member.user.profile_picture}
                                            alt={member.user.username}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                                          {member.user?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                      )}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {member.user?.full_name || member.user?.username || 'Unknown User'}
                                          </p>
                                          {member.user?.full_name && member.user?.username && (
                                            <span className="text-[10px] text-gray-400">@{member.user.username}</span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-gray-500">
                                          {member.user?.email || 'No email provided'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${member.role === 'admin'
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                      : member.role === 'moderator'
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                      }`}>
                                      {member.role || 'Member'}
                                    </span>
                                  </td>
                                  <td className="py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                      <FileText size={12} />
                                      <span className="text-xs font-bold">{member.posts_count || 0}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className="flex flex-col items-end">
                                      <p className="text-xs text-gray-700 dark:text-gray-300">
                                        {formatDate(member.created_at).split(' at ')[0]}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {formatDate(member.created_at).split(' at ')[1]}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-purple-100 dark:border-gray-700">
                            <p className="text-[10px] text-gray-500">
                              Showing {(membersPage - 1) * membersLimit + 1} to {Math.min(membersPage * membersLimit, totalMembers)} of {totalMembers} members
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => fetchMembers(membersPage - 1)}
                                disabled={membersPage === 1 || membersLoading}
                                className="px-3 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 transition-colors"
                              >
                                Previous
                              </button>
                              <div className="flex items-center px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                  {membersPage} / {totalPages}
                                </span>
                              </div>
                              <button
                                onClick={() => fetchMembers(membersPage + 1)}
                                disabled={membersPage === totalPages || membersLoading}
                                className="px-3 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(communityId);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(community);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitiesDetailsModal;

