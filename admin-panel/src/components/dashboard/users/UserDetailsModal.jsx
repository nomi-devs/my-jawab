// src/components/dashboard/users/UserDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Eye,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import userApi from '../../../api/userApi';
import postsApi from '../../../api/postsApi';
import communitiesApi from '../../../api/communitiesApi';
import subscriptionsApi from '../../../api/subscriptionsApi';
import paymentsApi from '../../../api/paymentsApi';
import AlertModal from '../../common/AlertModal';

const UserDetailsModal = ({ isOpen, onClose, userId, userData, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pending changes state
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  const [pendingIsVerified, setPendingIsVerified] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchUserPosts();
      fetchUserCommunities();
      fetchUserSubscriptions();
      fetchUserPayments();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getUser(userId);
      console.log('User details response:', response.data); // Debug log
      setUserDetails(response.data);
      // Reset pending state when user details are loaded
      if (response.data) {
        setPendingStatus(response.data.is_active ? 'Active' : 'Inactive');
        setPendingRole(response.data.role || 'user');
        setPendingIsVerified(response.data.is_verified || false);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
      // Use provided userData as fallback
      if (userData) {
        setUserDetails({
          ...userData.raw,
          profile: userData.raw?.profile || {},
          follower_count: 0,
          following_count: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await userApi.getUserPosts(userId, {
        page: 1,
        limit: 50,
      });
      setUserPosts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      setCommunitiesLoading(true);
      const response = await userApi.getUserCommunities(userId, {
        page: 1,
        limit: 50,
      });
      setUserCommunities(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user communities:', err);
      setUserCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  if (!isOpen) return null;

  const user = userDetails || userData?.raw;
  // Try multiple ways to access profile data - backend returns profile as a property
  const profile = userDetails?.profile || user?.profile || userData?.raw?.profile || null;

  const fetchUserSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      const response = await subscriptionsApi.getUserSubscriptions({
        page: 1,
        limit: 50,
        user_id: userId,
      });
      setUserSubscriptions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
      setUserSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchUserPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await paymentsApi.getPayments({
        page: 1,
        limit: 50,
        user_id: userId,
      });
      setUserPayments(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user payments:', err);
      setUserPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: User },
    { id: 'posts', label: 'Posts', icon: FileText, count: userPosts.length },
    { id: 'communities', label: 'Communities', icon: Users, count: userCommunities.length },
    { id: 'subscriptions', label: 'Subscriptions', icon: Package, count: userSubscriptions.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: userPayments.length },
    { id: 'stats', label: 'Statistics', icon: Heart },
    { id: 'actions', label: 'Actions', icon: Shield },
  ];

  const hasChanges = () => {
    if (!user) return false;
    const currentStatus = user.is_active ? 'Active' : 'Inactive';
    const currentRole = user.role || 'user';
    const currentIsVerified = user.is_verified || false;

    return (
      pendingStatus !== currentStatus ||
      pendingRole !== currentRole ||
      pendingIsVerified !== currentIsVerified
    );
  };

  const handleSaveChanges = async () => {
    try {
      setUpdatingStatus(true);
      setActionError(null);

      const updateData = {
        is_active: pendingStatus === 'Active',
        role: pendingRole,
        is_verified: pendingIsVerified,
      };

      await userApi.updateUserStatus(userId, updateData);

      // Refresh user details after update
      await fetchUserDetails();

      // Invalidate users list query to update the grid/table
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Optional: Add success notification here
      setSuccessMessage('User status updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating user status:', err);
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message;

      if (status === 404) {
        setActionError('User not found. It may have been deleted.');
      } else if (status === 403) {
        setActionError('You do not have permission to update this user.');
      } else if (errorMessage) {
        setActionError(errorMessage);
      } else {
        setActionError('Failed to update user status. Please try again.');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {user && (
              <img
                src={
                  profile?.profile_picture ||
                  userData?.img ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={profile?.full_name || user.username}
                className="w-12 h-12 rounded-full border-2 border-purple-200 dark:border-purple-700"
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {loading ? 'Loading...' : profile?.full_name || user?.username || 'User Details'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{user?.username || 'username'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-gray-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === tab.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading && activeTab === 'details' ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && user && (
                <div className="space-y-5">
                  {/* Basic Information */}
                  <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
                      <User size={14} className="text-purple-600 dark:text-purple-400" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Mail className="text-gray-400 dark:text-gray-500 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="text-gray-400 dark:text-gray-500 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Role</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                            {user.role?.replace('_', ' ') || 'user'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="text-gray-400 dark:text-gray-500 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Joined</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-gray-400 dark:text-gray-500 mt-0.5">
                          {user.is_verified ? (
                            <CheckCircle className="text-blue-500" size={14} />
                          ) : (
                            <XCircle className="text-gray-400" size={14} />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Verification
                          </p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {user.is_verified ? 'Verified' : 'Not Verified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-gray-400 dark:text-gray-500 mt-0.5">
                          <div
                            className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Status</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {user.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <LinkIcon className="text-gray-400 dark:text-gray-500 mt-0.5" size={14} />
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Auth Type</p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                            {user.auth_type || 'email'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5">
                      <User size={14} className="text-purple-600 dark:text-purple-400" />
                      Profile Information
                    </h3>
                    {profile && typeof profile === 'object' && Object.keys(profile).length > 0 ? (
                      <div className="space-y-4">
                        {/* Profile Images */}
                        {(profile.profile_picture || profile.profile_background) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.profile_picture && (
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                                  Profile Picture
                                </p>
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600">
                                  <img
                                    src={profile.profile_picture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`;
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            {profile.profile_background && (
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                                  Profile Background
                                </p>
                                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600">
                                  <img
                                    src={profile.profile_background}
                                    alt="Background"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Profile Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profile.full_name && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                Full Name
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {profile.full_name}
                              </p>
                            </div>
                          )}
                          {profile.tagline && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                Tagline
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {profile.tagline}
                              </p>
                            </div>
                          )}
                          {profile.profile_gender && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                Gender
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                                {profile.profile_gender}
                              </p>
                            </div>
                          )}
                          {profile.profile_birthday && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                Birthday
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {new Date(profile.profile_birthday).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                          {profile.profile_location && (
                            <div className="flex items-start gap-2">
                              <MapPin
                                className="text-gray-400 dark:text-gray-500 mt-0.5"
                                size={14}
                              />
                              <div className="flex-1">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                  Location
                                </p>
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  {profile.profile_location}
                                </p>
                              </div>
                            </div>
                          )}
                          {profile.profile_website && (
                            <div className="flex items-start gap-2">
                              <LinkIcon
                                className="text-gray-400 dark:text-gray-500 mt-0.5"
                                size={14}
                              />
                              <div className="flex-1">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                  Website
                                </p>
                                <a
                                  href={profile.profile_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline break-all"
                                >
                                  {profile.profile_website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bio - Full width */}
                        {profile.profile_bio && (
                          <div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Bio</p>
                            <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {profile.profile_bio}
                            </p>
                          </div>
                        )}

                        {/* Profile Metadata */}
                        {(profile.created_at || profile.updated_at) && (
                          <div className="pt-3 border-t border-purple-200 dark:border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.created_at && (
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                  Profile Created
                                </p>
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            )}
                            {profile.updated_at && (
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                  Last Updated
                                </p>
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                  {new Date(profile.updated_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No profile information available
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          This user hasn't set up their profile yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-5">
                  {postsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No posts found</p>
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-purple-50 dark:bg-gray-700/50 rounded-lg px-5 py-4 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start gap-4 mb-3">
                          {post.post_image ? (
                            <img
                              src={post.post_image}
                              alt={post.post_title}
                              className="w-16 h-16 rounded-lg object-cover border border-purple-200 dark:border-gray-600 shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                                e.target.parentElement.innerHTML =
                                  '<div class="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-gray-600 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-gray-600 shrink-0">
                              <FileText size={24} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm line-clamp-1">
                                {post.post_title || 'Untitled Post'}
                              </h4>
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  post.post_status === 'published'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {post.post_status}
                              </span>
                            </div>
                            {post.post_content && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {post.post_content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {post.like_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart size={14} />
                              {post.like_count}
                            </span>
                          )}
                          {post.comment_count > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle size={14} />
                              {post.comment_count}
                            </span>
                          )}
                          {post.view_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye size={14} />
                              {post.view_count}
                            </span>
                          )}
                          <span className="ml-auto">
                            {post.created_at
                              ? new Date(post.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Communities Tab */}
              {activeTab === 'communities' && (
                <div className="space-y-4">
                  {communitiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : userCommunities.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No communities found</p>
                    </div>
                  ) : (
                    userCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          {community.community_image ? (
                            <img
                              src={community.community_image}
                              alt={community.community_name}
                              className="w-12 h-12 rounded-lg object-cover border border-purple-200 dark:border-gray-600 shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                                e.target.parentElement.innerHTML =
                                  '<div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-gray-600 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-gray-600 shrink-0">
                              <Users size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {community.community_name || community.name || 'Unnamed Community'}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  community.is_active
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {community.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 capitalize">
                              {community.role || 'Member'}
                            </p>
                          </div>
                        </div>
                        {(community.community_description || community.description) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {community.community_description || community.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {community.members_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {community.members_count} members
                            </span>
                          )}
                          {community.is_private && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-5">
                  {subscriptionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : userSubscriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No subscriptions found</p>
                    </div>
                  ) : (
                    userSubscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {subscription.subscription?.subscription_name || 'Unknown Plan'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {subscription.subscription?.subscription_type || 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              subscription.subscription_status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : subscription.subscription_status === 'expired'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {subscription.subscription_status || 'N/A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {subscription.subscription_start_date && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Start Date
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {new Date(
                                  subscription.subscription_start_date,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {subscription.subscription_end_date && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                End Date
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {new Date(subscription.subscription_end_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {subscription.subscription?.subscription_price && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Price
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                ${subscription.subscription.subscription_price}
                              </p>
                            </div>
                          )}
                          {subscription.subscription_renewal_type && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Renewal
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                                {subscription.subscription_renewal_type}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-5">
                  {paymentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : userPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                    </div>
                  ) : (
                    userPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {payment.payment_transaction_id || `Payment #${payment.id}`}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {payment.payment_method?.replace('_', ' ') || 'N/A'} •{' '}
                              {payment.payment_gateway || 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.payment_status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : payment.payment_status === 'failed'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {payment.payment_status || 'N/A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                              Amount
                            </p>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: payment.payment_currency || 'USD',
                              }).format(payment.payment_amount || 0)}
                            </p>
                          </div>
                          {payment.created_at && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Date
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {payment.user_subscription?.subscription?.subscription_name && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Subscription
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {payment.user_subscription.subscription.subscription_name}
                              </p>
                            </div>
                          )}
                          {payment.payment_currency && (
                            <div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                Currency
                              </p>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {payment.payment_currency}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && user && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {userDetails?.follower_count || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Followers</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {userDetails?.following_count || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Following</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                      <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {userDetails?.posts_count || userPosts.length || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Posts</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                      <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {userDetails?.comments_count || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Comments</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {userDetails?.communities_count || userCommunities.length || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Communities</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && user && (
                <div className="space-y-8 max-w-2xl mx-auto py-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                      Account Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPendingStatus('Active')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                          pendingStatus === 'Active'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-purple-200'
                        }`}
                      >
                        <CheckCircle
                          size={18}
                          className={pendingStatus === 'Active' ? 'text-purple-600' : ''}
                        />
                        <span className="font-semibold text-sm">Active</span>
                      </button>
                      <button
                        onClick={() => setPendingStatus('Inactive')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                          pendingStatus === 'Inactive'
                            ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-red-200'
                        }`}
                      >
                        <XCircle
                          size={18}
                          className={pendingStatus === 'Inactive' ? 'text-red-600' : ''}
                        />
                        <span className="font-semibold text-sm">Inactive</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                      User Role
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['user', 'pro_user', 'admin'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setPendingRole(role)}
                          className={`px-3 py-2.5 rounded-lg border-2 text-xs font-medium capitalize transition-all ${
                            pendingRole === role
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-purple-200'
                          }`}
                        >
                          {role.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                      Verification
                    </h3>
                    <button
                      onClick={() => setPendingIsVerified(!pendingIsVerified)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        pendingIsVerified
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-blue-200'
                      }`}
                    >
                      <CheckCircle size={18} className={pendingIsVerified ? 'text-blue-600' : ''} />
                      <span className="font-semibold text-sm">
                        {pendingIsVerified ? 'Verified' : 'Mark as Verified'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(userId);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium"
              >
                <XCircle size={16} />
                <span>Delete</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(userData);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
              >
                <User size={16} />
                <span>Edit</span>
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
            <button
              onClick={handleSaveChanges}
              disabled={updatingStatus || !hasChanges()}
              className={`flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold shadow-md active:scale-95 ${
                updatingStatus ? 'px-4' : ''
              }`}
            >
              {updatingStatus ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Error Alert */}
      <AlertModal
        isOpen={!!actionError}
        onClose={() => setActionError(null)}
        type="error"
        title="Action Failed"
        message={actionError}
      />

      {/* Success Alert */}
      <AlertModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        type="success"
        title="Success"
        message={successMessage}
      />
    </div>
  );
};

export default UserDetailsModal;
