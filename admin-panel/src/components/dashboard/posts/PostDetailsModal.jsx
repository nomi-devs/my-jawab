// src/components/dashboard/posts/PostDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileText,
  MessageCircle,
  Heart,
  ThumbsDown,
  Eye,
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Video,
  Music,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Star,
  TrendingUp,
} from 'lucide-react';
import postsApi from '../../../api/postsApi';
import commentsApi from '../../../api/commentsApi';

const PostDetailsModal = ({
  isOpen,
  onClose,
  postId,
  postData,
  onUpdateStatus,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation('posts');
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [postDetails, setPostDetails] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingIsFeatured, setPendingIsFeatured] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
      fetchPostComments();
    }
  }, [isOpen, postId]);

  // Normalize post_status to lowercase string
  const normalizePostStatus = (status) => {
    if (!status) return 'draft';
    return status.toString().toLowerCase();
  };

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsApi.getPost(postId);
      const postData = response.data;
      // Normalize post_status and store raw data
      const normalizedPost = {
        ...postData,
        post_status: normalizePostStatus(postData.post_status),
        raw: postData,
      };
      setPostDetails(normalizedPost);
      setPendingStatus(normalizedPost.post_status);
      setPendingIsFeatured(!!postData.is_featured);
    } catch (err) {
      console.error('Error fetching post details:', err);
      setError(t('postDetailsModal.failedToLoadDetails'));
      // Use provided postData as fallback
      if (postData) {
        const normalizedStatus = normalizePostStatus(postData.post_status || 'draft');
        const isFeatured = postData.is_featured || false;
        setPostDetails({
          ...postData,
          post_content: postData.content || postData.post_content,
          post_title: postData.title || postData.post_title,
          post_status: normalizedStatus,
          is_featured: isFeatured,
          like_count: postData.stats?.likes || 0,
          comment_count: postData.stats?.comments || 0,
          view_count: postData.stats?.views || 0,
        });
        setPendingStatus(normalizedStatus);
        setPendingIsFeatured(!!isFeatured);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPostComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await commentsApi.getComments({
        page: 1,
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'DESC',
      });

      // Filter comments client-side by post_id if API doesn't support it
      const allComments = response.data.data || [];
      const filteredComments = allComments.filter(
        (comment) => comment.post_id === postId || comment.post?.id === postId,
      );

      setPostComments(filteredComments);
    } catch (err) {
      console.error('Error fetching post comments:', err);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!postId) return;

    try {
      setUpdatingStatus(true);
      const updateData = {};

      const currentStatus = postDetails?.post_status;
      const currentIsFeatured = !!postDetails?.is_featured;

      if (pendingStatus !== currentStatus) {
        updateData.post_status = pendingStatus;
      }

      if (pendingIsFeatured !== currentIsFeatured) {
        updateData.is_featured = pendingIsFeatured;
      }

      if (Object.keys(updateData).length === 0) return;

      await postsApi.updatePostStatus(postId, updateData);

      // Update local state
      setPostDetails((prev) => ({
        ...prev,
        ...updateData,
        post_status: updateData.post_status
          ? normalizePostStatus(updateData.post_status)
          : prev.post_status,
        is_featured: updateData.is_featured || prev.is_featured,
      }));

      // Call parent callback if provided
      if (onUpdateStatus) {
        onUpdateStatus(postId, updateData);
      }

      // Refresh comments if status changed
      if (updateData.post_status) {
        fetchPostComments();
      }
    } catch (err) {
      console.error('Error saving post changes:', err);
      setError(t('postDetailsModal.failedToSaveChanges'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const hasChanges = () => {
    const currentStatus = postDetails?.post_status;
    const currentIsFeatured = !!postDetails?.is_featured;
    return pendingStatus !== currentStatus || pendingIsFeatured !== currentIsFeatured;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('postDetailsModal.notAvailable');
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return t('postDetailsModal.notAvailable');
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return t('postDetailsModal.time.minutesAgo', { count: minutes });
    if (hours < 24) return t('postDetailsModal.time.hoursAgo', { count: hours });
    if (days < 7) return t('postDetailsModal.time.daysAgo', { count: days });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  const post = postDetails || postData;
  // Normalize post_status for consistent comparison
  const postStatus = post ? normalizePostStatus(post.post_status || 'draft') : 'draft';
  const tags = post?.post_tags
    ? typeof post.post_tags === 'string'
      ? post.post_tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : post.post_tags
    : [];

  const tabs = [
    { id: 'details', label: t('postDetailsModal.tabs.details'), icon: FileText },
    {
      id: 'comments',
      label: t('postDetailsModal.tabs.comments'),
      icon: MessageCircle,
      count: postComments.length,
    },
    { id: 'actions', label: t('postDetailsModal.tabs.actions'), icon: Edit },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        label: t('postDetailsModal.status.published'),
        className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
        dot: 'bg-green-500 dark:bg-green-400',
      },
      draft: {
        label: t('postDetailsModal.status.draft'),
        className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
        dot: 'bg-yellow-500 dark:bg-yellow-400',
      },
      archived: {
        label: t('postDetailsModal.status.archived'),
        className: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
        dot: 'bg-gray-500 dark:bg-gray-400',
      },
    };

    const config = statusConfig[status] || statusConfig['draft'];

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${config.className}`}
      >
        <span className={`w-1 h-1 rounded-full me-1 ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {post && (
              <>
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                    {loading
                      ? t('common:loading')
                      : post.post_title || post.title || t('postDetailsModal.defaultTitle')}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {getStatusBadge(postStatus || 'draft')}
                    {!!post.is_featured && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
                        <Star size={10} className="me-0.5" />
                        {t('postDetailsModal.featuredBadge')}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ms-3"
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
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ms-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px]">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 start-0 end-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading && !post ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error && !post ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && post && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Main Content Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Post Content Area */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-purple-50 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {t('postDetailsModal.postContentHeading')}
                        </h3>
                      </div>

                      {post.post_title && (
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {post.post_title}
                        </h1>
                      )}

                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {post.post_content ||
                            post.content ||
                            t('postDetailsModal.noContentAvailable')}
                        </p>
                      </div>
                    </div>

                    {/* Media Display */}
                    {(post.post_image || post.post_video || post.post_audio) && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            {t('postDetailsModal.attachedMediaHeading')}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {post.post_image && (
                            <div className="group relative rounded-xl overflow-hidden border border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-hover">
                              <div className="absolute top-3 start-3 z-10">
                                <span className="px-2 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-lg">
                                  <ImageIcon size={10} /> {t('postDetailsModal.imageBadge')}
                                </span>
                              </div>
                              <img
                                src={post.post_image}
                                alt={t('postDetailsModal.postVisualAlt')}
                                className="w-full h-auto max-h-[500px] object-contain mx-auto"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center p-12 text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-xs">
                                  {t('postDetailsModal.failedToLoadMedia')}
                                </span>
                              </div>
                            </div>
                          )}

                          {post.post_video && (
                            <div className="rounded-xl overflow-hidden border border-purple-100 dark:border-gray-700 bg-black shadow-sm">
                              <div className="px-4 py-2 bg-gray-900 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                  <Video size={12} /> {t('postDetailsModal.videoBadge')}
                                </span>
                              </div>
                              <video
                                src={post.post_video}
                                controls
                                className="w-full h-auto max-h-[500px]"
                              />
                            </div>
                          )}

                          {post.post_audio && (
                            <div className="rounded-xl p-4 border border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Music size={14} className="text-green-600" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                  {t('postDetailsModal.audioPreviewLabel')}
                                </span>
                              </div>
                              <audio
                                src={post.post_audio}
                                controls
                                className="w-full custom-audio"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Column */}
                  <div className="space-y-6">
                    {/* Author Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden shadow-sm">
                      <div className="h-12 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                      <div className="px-5 pb-5 -mt-6">
                        <div className="relative mb-3">
                          <img
                            src={
                              post.user?.profile_picture ||
                              post.author?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username || 'user'}`
                            }
                            alt={t('postDetailsModal.authorAlt')}
                            className="w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-800 shadow-md object-cover"
                          />
                        </div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                          {post.user?.username ||
                            post.author?.name ||
                            t('postDetailsModal.anonymousUser')}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                          @
                          {post.user?.username ||
                            post.author?.username ||
                            t('postDetailsModal.userFallback')}
                        </p>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 dark:text-gray-400">
                              {t('postDetailsModal.postIdLabel')}
                            </span>
                            <span className="font-mono text-gray-700 dark:text-gray-300">
                              #{post.id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-2">
                            <span className="text-gray-500 dark:text-gray-400">
                              {t('postDetailsModal.createdAtLabel')}
                            </span>
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Calendar size={10} />
                              <span>{formatDate(post.created_at || post.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        {t('postDetailsModal.statisticsHeading')}
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <Heart size={14} className="text-red-500 fill-red-500" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {t('postDetailsModal.likesLabel')}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {(post.like_count || post.stats?.likes || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                              <ThumbsDown size={14} className="text-amber-600 fill-amber-600" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {t('postDetailsModal.dislikesLabel')}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {(post.dislike_count || post.stats?.dislikes || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <MessageCircle size={14} className="text-blue-500" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {t('postDetailsModal.commentsLabel')}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {(post.comment_count || post.stats?.comments || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <Eye size={14} className="text-green-500" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {t('postDetailsModal.totalViewsLabel')}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {(post.view_count || post.stats?.views || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp
                                size={14}
                                className="text-indigo-600 dark:text-indigo-400"
                              />
                              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                {t('postDetailsModal.engagementLabel')}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                              {(
                                (post.like_count || post.stats?.likes || 0) +
                                (post.comment_count || post.stats?.comments || 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Tags */}
                    {tags.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-5 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                          {t('postDetailsModal.postTagsHeading')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-100/50 dark:border-purple-800/50"
                            >
                              <Tag size={10} className="me-1.5" />
                              {tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="px-6 py-5">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2
                        size={32}
                        className="animate-spin text-purple-600 dark:text-purple-400"
                      />
                    </div>
                  ) : postComments.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle
                        size={48}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
                      />
                      <p className="text-gray-500 dark:text-gray-400">
                        {t('postDetailsModal.noCommentsYet')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {postComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-purple-100 dark:border-gray-600"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={
                                comment.user?.profile_picture ||
                                comment.user?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username || 'user'}`
                              }
                              alt={comment.user?.username || comment.user?.name}
                              className="w-10 h-10 rounded-full border-2 border-purple-200 dark:border-purple-700 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                  {comment.user?.username ||
                                    comment.user?.name ||
                                    t('postDetailsModal.anonymousCommentAuthor')}
                                </span>
                                {comment.is_approved ? (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                    {t('postDetailsModal.approvedBadge')}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                                    {t('postDetailsModal.pendingBadge')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                                {comment.comment_content || comment.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatTimeAgo(comment.created_at)}</span>
                                {comment.like_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Heart size={12} />
                                    {comment.like_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && post && (
                <div className="px-6 py-5 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      {t('postDetailsModal.statusManagementHeading')}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                      {t('postDetailsModal.currentStatusLabel')}{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize">
                        {t(`postDetailsModal.status.${postStatus}`, { defaultValue: postStatus })}
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setPendingStatus('published')}
                        disabled={updatingStatus}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingStatus === 'published'
                            ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold shadow-sm ring-1 ring-green-500/20'
                            : 'border-2 border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/30 dark:hover:bg-green-900/10 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle size={16} />
                        <span>{t('postDetailsModal.publishButton')}</span>
                      </button>

                      <button
                        onClick={() => setPendingStatus('draft')}
                        disabled={updatingStatus}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingStatus === 'draft'
                            ? 'border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-bold shadow-sm ring-1 ring-yellow-500/20'
                            : 'border-2 border-gray-100 dark:border-gray-700 hover:border-yellow-200 dark:hover:border-yellow-800 hover:bg-yellow-50/30 dark:hover:bg-yellow-900/10 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FileText size={16} />
                        <span>{t('postDetailsModal.draftButton')}</span>
                      </button>

                      <button
                        onClick={() => setPendingStatus('archived')}
                        disabled={updatingStatus}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingStatus === 'archived'
                            ? 'border-2 border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold shadow-sm ring-1 ring-gray-500/20'
                            : 'border-2 border-gray-100 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <XCircle size={16} />
                        <span>{t('postDetailsModal.archiveButton')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      {t('postDetailsModal.featuredStatusHeading')}
                    </h3>
                    <button
                      onClick={() => setPendingIsFeatured(!pendingIsFeatured)}
                      disabled={updatingStatus}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-xs font-medium ${
                        pendingIsFeatured
                          ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold shadow-sm ring-1 ring-purple-500/20'
                          : 'border-2 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 text-gray-600 dark:text-gray-400'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Star size={16} className={pendingIsFeatured ? 'fill-purple-500' : ''} />
                      <span>
                        {pendingIsFeatured
                          ? t('postDetailsModal.removeFeaturedButton')
                          : t('postDetailsModal.markAsFeaturedButton')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(post.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-medium"
              >
                <Trash2 size={16} />
                <span>{t('postDetailsModal.deleteButton')}</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(post);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
              >
                <Edit size={16} />
                <span>{t('postDetailsModal.editButton')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
            >
              {t('common:cancel')}
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
                  <span>{t('postDetailsModal.savingButton')}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>{t('postDetailsModal.saveChangesButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;
