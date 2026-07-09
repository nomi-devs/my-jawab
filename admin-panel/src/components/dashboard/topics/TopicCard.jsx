// src/components/dashboard/topics/TopicCard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Hash,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  BarChart,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { normalizeMediaUrl } from '../../../utils/mediaUtils';

const TopicCard = React.memo(
  ({ topic: propTopic, onEdit, onDelete, onViewDetails, onToggleActive }) => {
    const { t } = useTranslation('topics');
    // State for mock data - this will be used when no prop is provided
    const [mockData, setMockData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use propTopic if provided, otherwise use mockData
    const topic = propTopic || mockData;

    // Mock data configuration - Replace this with real API call when integrating
    const mockTopic = {
      id: 'mock-1',
      name: 'Artificial Intelligence',
      description:
        'Discussions about AI advancements, machine learning models, and their impact on society and technology.',
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      trend: 24.5,
      engagedUsers: 15420,
      totalPosts: 83250,
      tags: ['ai', 'machinelearning', 'tech', 'innovation', 'future'],
      trendingDuration: '3 days',
      createdAt: '2024-01-15T10:30:00Z',
      pinned: true,
      hidden: false,
      category: 'Technology',
    };

    // Simulate loading mock data
    useEffect(() => {
      if (!propTopic) {
        // Only use mock data if no prop is provided
        const timer = setTimeout(() => {
          setMockData(mockTopic);
          setIsLoading(false);
        }, 300); // Simulate network delay

        return () => clearTimeout(timer);
      } else {
        setIsLoading(false);
      }
    }, [propTopic]);

    const getTrendColor = (trend) => {
      if (trend === undefined || trend === null) return 'text-gray-600 bg-gray-50';
      return trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    };

    const getTrendIcon = (trend) => {
      if (trend === undefined || trend === null) return null;
      return trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    };

    const formatNumber = (num) => {
      if (num === undefined || num === null) return '0';
      const numValue = typeof num === 'number' ? num : parseInt(num, 10);
      if (isNaN(numValue)) return '0';
      if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
      if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
      return numValue.toString();
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const handleCardClick = () => {
      if (!topic) return;
      onViewDetails?.(topic);
    };

    // Small Pin Icon for topic heading
    const SmallPinIcon = () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500"
      >
        <path d="M12 17v5" />
        <path d="M9 10v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12" />
        <path d="M15 9.34V6h1a2 2 0 0 0 0-4H7.89" />
        <path d="M9 6v4.66" />
      </svg>
    );

    // Loading state
    if (isLoading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-4 sm:p-6 animate-pulse overflow-hidden transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700 relative w-10 h-10 sm:w-12 sm:h-12"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-16 sm:w-24"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 h-16 sm:h-20"></div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 h-16 sm:h-20"></div>
          </div>
        </div>
      );
    }

    // Error state or no data
    if (!topic) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-4 sm:p-6 overflow-hidden transition-colors">
          <div className="text-center text-gray-500 dark:text-gray-400 transition-colors">
            <p>{t('topicCard.noTopicData')}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-4 sm:p-6 cursor-pointer transition-all relative overflow-hidden ${!topic.is_active ? 'opacity-70' : ''}`}
        onClick={handleCardClick}
        data-mock={!propTopic ? 'true' : 'false'}
      >
        {/* Topic Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            {topic.topic_image && (!topic.parent_id || topic.parent_id === 0) ? (
              <img
                src={normalizeMediaUrl(topic.topic_image)}
                alt={topic.topic_name || topic.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-purple-200 dark:border-gray-600 flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`p-2 sm:p-3 rounded-xl bg-purple-500 relative flex-shrink-0 ${topic.topic_image && (!topic.parent_id || topic.parent_id === 0) ? 'hidden' : 'flex items-center justify-center'}`}
            >
              <Hash size={18} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-sm sm:text-base">
                    {topic.topic_name || topic.name || t('topicCard.untitledTopic')}
                  </h3>
                </div>
                {/* Status badges - shown inline with topic name */}
                <div className="flex items-center gap-1 flex-shrink-0 mt-1 sm:mt-0">
                  {!propTopic && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full whitespace-nowrap">
                      {t('topicCard.mockData')}
                    </span>
                  )}
                  {topic.is_active === false && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium rounded-full whitespace-nowrap">
                      {t('common:inactive')}
                    </span>
                  )}
                  {typeof topic.parent_id !== 'undefined' &&
                    topic.parent_id !== null &&
                    Number(topic.parent_id) !== 0 && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                        {t('topicCard.subtopic')}
                      </span>
                    )}
                </div>
              </div>
              {topic.parent_name && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">
                    {t('topicCard.parent')}: {topic.parent_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Topic Description */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 line-clamp-2 break-words">
          {topic.topic_description || topic.description || t('topicCard.noDescription')}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 sm:p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <Hash size={14} className="text-purple-500 dark:text-purple-400 sm:w-4 sm:h-4" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('common:status')}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              {topic.is_active ? t('common:active') : t('common:inactive')}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 truncate">
              {topic.parent_id && topic.parent_id > 0
                ? t('topicCard.subtopic')
                : t('topicCard.category')}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 sm:p-3 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <MessageSquare
                size={14}
                className="text-green-500 dark:text-green-400 sm:w-4 sm:h-4"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('topicCard.slug')}
              </span>
            </div>
            <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
              {topic.topic_slug || t('topicCard.notAvailable')}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">
              {topic.parent_id && topic.parent_id > 0
                ? t('topicCard.subtopic')
                : t('topicCard.category')}
            </div>
          </div>
        </div>

        {/* Time and Date Information - Now on same line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 space-y-2 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 me-1.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs whitespace-nowrap truncate">
                {t('common:created')}:{' '}
                {formatDate(topic.created_at || topic.createdAt || new Date().toISOString())}
              </span>
            </div>
            {topic.updated_at && (
              <div className="flex items-center">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 me-1.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-xs whitespace-nowrap truncate">
                  {t('common:updated')}: {formatDate(topic.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Separator and Action Buttons */}
        <div
          className="border-t border-purple-100 dark:border-gray-700 pt-3 sm:pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-2">
            {/* Toggle Active/Inactive Switch */}
            {onToggleActive && (
              <label
                className="relative inline-flex items-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                title={
                  topic.is_active ? t('topicCard.deactivateTopic') : t('topicCard.activateTopic')
                }
              >
                <input
                  type="checkbox"
                  checked={topic.is_active}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleActive(topic.id, !topic.is_active);
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600 rtl:peer-checked:after:-translate-x-full"></div>
              </label>
            )}
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(topic);
                }}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('topicCard.viewDetails')}
              >
                <Eye size={16} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(topic);
                }}
                className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                title={t('topicCard.editTopic')}
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(topic.id);
                }}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title={t('topicCard.deleteTopic')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

TopicCard.displayName = 'TopicCard';
export default TopicCard;
