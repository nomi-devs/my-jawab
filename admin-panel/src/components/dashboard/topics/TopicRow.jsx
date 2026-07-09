// src/components/dashboard/topics/TopicRow.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Edit, Trash2, Eye } from 'lucide-react';
import { normalizeMediaUrl } from '../../../utils/mediaUtils';

const TopicRow = React.memo(
  ({ topic, onEdit, onDelete, onViewDetails, onToggleActive, index = 0, serialNumber = 0 }) => {
    const { t } = useTranslation('topics');
    const formatDate = (timestamp) => {
      if (!timestamp) return t('topicRow.notAvailable');
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const truncateText = (text, maxLength = 60) => {
      if (!text) return t('topicRow.noDescription');
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
        {/* Topic Name & Icon */}
        <td className="p-2 transition-colors">
          <div className="flex items-center gap-2">
            {topic.topic_image && (!topic.parent_id || topic.parent_id === 0) ? (
              <img
                src={normalizeMediaUrl(topic.topic_image)}
                alt={topic.topic_name || topic.name}
                className="w-8 h-8 rounded-lg object-cover border border-purple-200 dark:border-gray-600 flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0 ${topic.topic_image && (!topic.parent_id || topic.parent_id === 0) ? 'hidden' : ''}`}
            >
              <Hash size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors truncate">
                {topic.topic_name || topic.name}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-[10px] transition-colors truncate">
                {topic.topic_slug || topic.slug || t('topicRow.noSlug')}
              </div>
            </div>
          </div>
        </td>

        {/* Description */}
        <td className="p-2 text-xs text-gray-600 dark:text-gray-300 transition-colors max-w-xs">
          <div className="truncate" title={topic.topic_description || topic.description}>
            {truncateText(topic.topic_description || topic.description, 50)}
          </div>
        </td>

        {/* Type & Status */}
        <td className="p-2 transition-colors">
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                topic.is_active
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full me-1 ${
                  topic.is_active
                    ? 'bg-green-500 dark:text-green-400'
                    : 'bg-gray-500 dark:bg-gray-400'
                }`}
              ></span>
              {topic.is_active ? t('common:active') : t('common:inactive')}
            </span>
            <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30">
              {topic.parent_id && topic.parent_id > 0
                ? t('topicRow.subtopic')
                : t('topicRow.category')}
            </span>
          </div>
        </td>

        {/* Parent Topic */}
        <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {topic.parent_name ? (
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {topic.parent_name}
            </span>
          ) : topic.parent_id && topic.parent_id > 0 ? (
            <span className="text-gray-400 dark:text-gray-500">{t('topicRow.hasParent')}</span>
          ) : (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {t('topicRow.rootCategory')}
            </span>
          )}
        </td>

        {/* Sub-Topics */}
        <td className="p-2 transition-colors">
          {!topic.parent_id || topic.parent_id === 0 ? (
            topic.children && Array.isArray(topic.children) && topic.children.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-w-xs">
                {topic.children.map((child, idx) => (
                  <span
                    key={child.id || idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    title={child.topic_name || child.name}
                  >
                    {child.topic_name || child.name}
                  </span>
                ))}
              </div>
            ) : topic.children_count && topic.children_count > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                {t('topicRow.subtopicsCount', { count: topic.children_count })}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {t('topicRow.noSubtopics')}
              </span>
            )
          ) : (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>

        {/* Date */}
        <td className="p-2 text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {formatDate(topic.created_at)}
        </td>

        {/* Actions */}
        <td className="p-2 text-end transition-colors">
          <div className="flex items-center justify-end gap-1">
            {/* Toggle Active/Inactive Switch */}
            {onToggleActive && (
              <label
                className="relative inline-flex items-center cursor-pointer me-1"
                title={
                  topic.is_active ? t('topicRow.deactivateTopic') : t('topicRow.activateTopic')
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
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 rtl:peer-checked:after:-translate-x-full"></div>
              </label>
            )}
            <button
              onClick={() => onViewDetails && onViewDetails(topic)}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
              title={t('topicRow.viewDetails')}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => onEdit && onEdit(topic)}
              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
              title={t('topicRow.editTopic')}
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete && onDelete(topic.id)}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title={t('topicRow.deleteTopic')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

TopicRow.displayName = 'TopicRow';
export default TopicRow;
