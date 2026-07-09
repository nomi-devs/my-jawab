// src/components/dashboard/polls/PollsDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  BarChart3,
  Calendar,
  User,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  TrendingUp,
  Save,
  Star,
} from 'lucide-react';
import pollsApi from '../../../api/pollsApi';

const PollsDetailsModal = ({
  isOpen,
  onClose,
  pollId,
  pollData,
  onUpdateStatus,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [pollDetails, setPollDetails] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingIsFeatured, setPendingIsFeatured] = useState(null);
  const [error, setError] = useState(null);
  const { t } = useTranslation('polls');

  useEffect(() => {
    if (isOpen && pollId) {
      fetchPollDetails();
    }
  }, [isOpen, pollId]);

  // Normalize poll_status to lowercase string
  const normalizePollStatus = (status) => {
    if (!status) return 'draft';
    return status.toString().toLowerCase();
  };

  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pollsApi.getPoll(pollId);
      const pollData = response.data;
      const normalizedStatus = normalizePollStatus(pollData.poll_status || pollData.status);

      setPollDetails({
        ...pollData,
        poll_status: normalizedStatus,
      });
      setPendingStatus(normalizedStatus);
      setPendingIsFeatured(!!pollData.is_featured);
    } catch (err) {
      console.error('Error fetching poll details:', err);
      setError(t('pollsDetailsModal.loadFailedError'));
      // Use provided pollData as fallback
      if (pollData) {
        const fallbackStatus = normalizePollStatus(
          pollData.poll_status || pollData.status || 'draft',
        );
        setPollDetails({
          ...pollData,
          poll_title: pollData.poll_title || pollData.title,
          poll_description: pollData.poll_description || pollData.description,
          poll_status: fallbackStatus,
          is_featured: pollData.is_featured || false,
          is_expired: pollData.is_expired || false,
        });
        setPendingStatus(fallbackStatus);
        setPendingIsFeatured(!!pollData.is_featured);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setPendingStatus(newStatus);
  };

  const handleSaveChanges = async () => {
    if (!pollId) return;

    try {
      setUpdatingStatus(true);
      const updateData = {};

      const currentStatus = pollDetails?.poll_status;
      const currentIsFeatured = !!pollDetails?.is_featured;

      if (pendingStatus !== currentStatus) {
        updateData.poll_status = pendingStatus;
      }

      if (pendingIsFeatured !== currentIsFeatured) {
        updateData.is_featured = pendingIsFeatured;
      }

      if (Object.keys(updateData).length === 0) return;

      await pollsApi.updatePoll(pollId, updateData);

      // Update local state
      setPollDetails((prev) => ({
        ...prev,
        ...updateData,
        poll_status: updateData.poll_status || prev.poll_status,
        is_featured: updateData.is_featured || prev.is_featured,
      }));

      // Call parent callback if provided
      if (onUpdateStatus) {
        onUpdateStatus(pollId, updateData, true); // true indicates skip redundant API call
      }

      // Refresh the modal data to ensure synchronization
      await fetchPollDetails();
    } catch (err) {
      console.error('Error saving poll changes:', err);
      setError(t('pollsDetailsModal.saveFailedError'));
    } finally {
      setUpdatingStatus(false);
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
      minute: '2-digit',
    });
  };

  const getTotalVotes = () => {
    if (pollDetails?.options && Array.isArray(pollDetails.options)) {
      return pollDetails.options.reduce((sum, option) => sum + (option.vote_count || 0), 0);
    }
    return pollDetails?.vote_count || 0;
  };

  if (!isOpen) return null;

  const poll = pollDetails || pollData;
  const rawStatus = poll
    ? normalizePollStatus(poll.poll_status || poll.status || 'draft')
    : 'draft';
  const isExpired = !!poll?.is_expired;
  const isEnded = isExpired || rawStatus === 'ended';
  const currentStatus = rawStatus || 'draft';
  const uiStatus = isEnded ? 'ended' : currentStatus;

  // Pending UI status
  const pendingUiStatus = isExpired && pendingStatus !== 'ended' ? 'ended' : pendingStatus;

  const tabs = [
    { id: 'details', label: t('pollsDetailsModal.tabDetails'), icon: BarChart3 },
    { id: 'actions', label: t('pollsDetailsModal.tabActions'), icon: Settings },
  ];

  const getStatusBadge = () => {
    if (!poll) return null;

    if (uiStatus === 'ended') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full me-2 bg-gray-500 dark:bg-gray-400"></span>
          {t('pollsDetailsModal.ended')}
        </span>
      );
    }
    if (uiStatus === 'published') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30">
          <span className="w-2 h-2 rounded-full me-2 bg-green-500 dark:bg-green-400"></span>
          {t('pollsDetailsModal.published')}
        </span>
      );
    }
    if (uiStatus === 'draft') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30">
          <span className="w-2 h-2 rounded-full me-2 bg-yellow-500 dark:bg-yellow-400"></span>
          {t('pollsDetailsModal.draft')}
        </span>
      );
    }
    return null;
  };

  const hasChanges = () => {
    const currentStatus = pollDetails?.poll_status;
    const currentIsFeatured = !!pollDetails?.is_featured;
    return pendingStatus !== currentStatus || pendingIsFeatured !== currentIsFeatured;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col overflow-hidden animate-slideInFromTop">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {poll && (
              <>
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                      {loading
                        ? t('common:loading')
                        : poll.poll_title || poll.title || t('pollsDetailsModal.pollDetailsFallback')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getStatusBadge()}
                    {!!poll.is_featured && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
                        <Star size={10} className="me-0.5" />
                        {t('pollsDetailsModal.featured')}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ms-4"
          >
            <X size={24} />
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
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <Icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 start-0 end-0 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          {loading && !poll ? (
            <div className="flex items-center justify-center p-12 text-center">
              <Loader2 size={32} className="animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          ) : error && !poll ? (
            <div className="p-12 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && poll && (
                <div className="px-6 py-5 space-y-6">
                  {/* Description */}
                  {poll.poll_description && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                        {t('common:description')}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {poll.poll_description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Poll Options */}
                  {poll.options && Array.isArray(poll.options) && poll.options.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                        {t('pollsDetailsModal.optionsResults')}
                      </h3>
                      <div className="space-y-3">
                        {poll.options.map((option, index) => {
                          const totalVotes = getTotalVotes();
                          const percentage =
                            totalVotes > 0
                              ? (((option.vote_count || 0) / totalVotes) * 100).toFixed(1)
                              : 0;
                          return (
                            <div
                              key={option.id || index}
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {option.option_text || option.text}
                                </span>
                                {option.vote_count > 0 && (
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('pollsDetailsModal.votesCount', {
                                      count: option.vote_count,
                                      percentage,
                                    })}
                                  </span>
                                )}
                                {(!option.vote_count || option.vote_count === 0) && (
                                  <span className="text-sm text-gray-400 dark:text-gray-500">
                                    {t('pollsDetailsModal.noVotes')}
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getTotalVotes() > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users size={14} className="text-purple-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {t('pollsDetailsModal.totalVotes')}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {getTotalVotes()}
                        </p>
                      </div>
                    )}
                    {poll.view_count !== undefined && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BarChart3 size={14} className="text-blue-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {t('pollsDetailsModal.views')}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {poll.view_count || 0}
                        </p>
                      </div>
                    )}
                    {poll.options?.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BarChart3 size={14} className="text-green-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {t('pollsDetailsModal.options')}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {poll.options.length}
                        </p>
                      </div>
                    )}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar size={14} className="text-amber-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {t('pollsDetailsModal.expires')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {formatDate(poll.poll_expires_at || poll.expires_at)}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                        {t('common:created')}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar size={14} />
                        <span>{formatDate(poll.created_at)}</span>
                      </div>
                    </div>
                    {poll.user && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                          {t('pollsDetailsModal.author')}
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-2 border-purple-200 dark:border-purple-700">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {poll.user?.name?.charAt(0) || poll.user?.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                              {poll.user?.name || poll.user?.username || t('pollsDetailsModal.unknownUser')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{poll.user?.username || 'user'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && poll && (
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      {t('pollsDetailsModal.statusManagement')}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                      {t('pollsDetailsModal.currentStatus')}{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize">
                        {uiStatus === 'ended'
                          ? t('pollsDetailsModal.ended')
                          : t(`pollsDetailsModal.${currentStatus}`, { defaultValue: currentStatus })}
                      </span>
                      {pendingStatus !== currentStatus && (
                        <span className="ms-2 text-purple-600 font-medium">
                          {t('pollsDetailsModal.pendingSave', { status: pendingStatus })}
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() =>
                          pendingUiStatus !== 'ended' && handleStatusChange('published')
                        }
                        disabled={
                          updatingStatus ||
                          pendingUiStatus === 'published' ||
                          pendingUiStatus === 'ended'
                        }
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingUiStatus === 'published'
                            ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold shadow-sm ring-1 ring-green-500/20'
                            : pendingUiStatus === 'ended'
                              ? 'border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'border-2 border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/30 dark:hover:bg-green-900/10 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle size={16} />
                        <span>{t('pollsDetailsModal.publish')}</span>
                      </button>

                      <button
                        onClick={() => pendingUiStatus !== 'ended' && handleStatusChange('draft')}
                        disabled={
                          updatingStatus ||
                          pendingUiStatus === 'draft' ||
                          pendingUiStatus === 'ended'
                        }
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingUiStatus === 'draft'
                            ? 'border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-bold shadow-sm ring-1 ring-yellow-500/20'
                            : pendingUiStatus === 'ended'
                              ? 'border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'border-2 border-gray-100 dark:border-gray-700 hover:border-yellow-200 dark:hover:border-yellow-800 hover:bg-yellow-50/30 dark:hover:bg-yellow-900/10 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <BarChart3 size={16} />
                        <span>{t('pollsDetailsModal.draftAction')}</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange('ended')}
                        disabled={updatingStatus || pendingUiStatus === 'ended'}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${
                          pendingUiStatus === 'ended'
                            ? 'border-2 border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold shadow-sm ring-1 ring-gray-500/20'
                            : 'border-2 border-gray-100 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <XCircle size={16} />
                        <span>{t('pollsDetailsModal.end')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      {t('pollsDetailsModal.featuredStatus')}
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
                          ? t('pollsDetailsModal.removeFeatured')
                          : t('pollsDetailsModal.markAsFeatured')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete?.(pollId);
                onClose();
              }}
              className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>{t('pollsDetailsModal.deletePoll')}</span>
            </button>
            <button
              onClick={() => {
                onEdit?.(pollDetails);
              }}
              className="px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Edit size={14} />
              <span>{t('pollsDetailsModal.editPoll')}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
            >
              {t('common:cancel')}
            </button>
            {hasChanges() && (
              <button
                onClick={handleSaveChanges}
                disabled={updatingStatus}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t('pollsDetailsModal.saving')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>{t('pollsDetailsModal.saveChanges')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollsDetailsModal;
