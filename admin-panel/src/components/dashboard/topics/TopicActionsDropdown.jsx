// src/components/dashboard/topics/TopicActionsDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  Edit,
  BarChart,
  Eye,
  EyeOff,
  Copy,
  Flag,
  Trash2,
  Share2,
  Download,
  Filter,
} from 'lucide-react';

const TopicActionsDropdown = React.memo(
  ({
    topic,
    onEdit,
    onAnalyze,
    onToggleActive,
    onCopy,
    onReport,
    onDelete,
    onShare,
    onExport,
    onFilter,
  }) => {
    const { t } = useTranslation('topics');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action, e) => {
      e?.stopPropagation();
      setIsOpen(false);

      switch (action) {
        case 'edit':
          onEdit(topic);
          break;
        case 'analyze':
          onAnalyze(topic);
          break;
        case 'toggleActive':
          onToggleActive(topic.id, !topic.is_active);
          break;
        case 'copy':
          onCopy(topic);
          break;
        case 'report':
          onReport(topic.id);
          break;
        case 'delete':
          onDelete(topic.id);
          break;
        case 'share':
          onShare(topic);
          break;
        case 'export':
          onExport(topic);
          break;
        case 'filter':
          onFilter(topic);
          break;
        default:
          break;
      }
    };

    const menuItems = [
      {
        id: 'edit',
        label: t('topicActionsDropdown.editTopic'),
        icon: Edit,
        color: 'text-blue-600 hover:bg-blue-50',
        show: true,
      },
      {
        id: 'analyze',
        label: t('topicActionsDropdown.viewAnalytics'),
        icon: BarChart,
        color: 'text-purple-600 hover:bg-purple-50',
        show: true,
      },
      {
        id: 'toggleActive',
        label: topic.is_active
          ? t('topicActionsDropdown.deactivateTopic')
          : t('topicActionsDropdown.activateTopic'),
        icon: topic.is_active ? EyeOff : Eye,
        color: 'text-amber-600 hover:bg-amber-50',
        show: true,
      },
      {
        id: 'copy',
        label: t('topicActionsDropdown.copyTopicLink'),
        icon: Copy,
        color: 'text-gray-600 hover:bg-gray-50',
        show: true,
      },
      {
        id: 'share',
        label: t('topicActionsDropdown.shareTopic'),
        icon: Share2,
        color: 'text-indigo-600 hover:bg-indigo-50',
        show: true,
      },
      {
        id: 'filter',
        label: t('topicActionsDropdown.filterByTopic'),
        icon: Filter,
        color: 'text-cyan-600 hover:bg-cyan-50',
        show: true,
      },
      {
        id: 'export',
        label: t('topicActionsDropdown.exportData'),
        icon: Download,
        color: 'text-emerald-600 hover:bg-emerald-50',
        show: true,
      },
      {
        type: 'divider',
        show: true,
      },
      {
        id: 'report',
        label: t('topicActionsDropdown.reportTopic'),
        icon: Flag,
        color: 'text-orange-600 hover:bg-orange-50',
        show: true,
      },
      {
        id: 'delete',
        label: t('topicActionsDropdown.deleteTopic'),
        icon: Trash2,
        color: 'text-red-600 hover:bg-red-50',
        show: true,
      },
    ];

    return (
      <div className="relative" ref={dropdownRef}>
        {/* Three Dots Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
          aria-label={t('topicActionsDropdown.topicActions')}
        >
          <MoreHorizontal size={18} />
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('topicActionsDropdown.moreActions')}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute end-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-purple-100 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="py-2">
              {/* Menu Header */}
              <div className="px-4 py-2 border-b border-purple-100 dark:border-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                    {topic.topic_name || topic.name || t('topicActionsDropdown.untitledTopic')}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {topic.is_active ? t('common:active') : t('common:inactive')} •{' '}
                  {topic.parent_id && topic.parent_id > 0
                    ? t('topicActionsDropdown.subtopic')
                    : t('topicActionsDropdown.category')}
                </div>
              </div>

              {/* Menu Items */}
              <div className="max-h-80 overflow-y-auto">
                {menuItems
                  .filter((item) => item.show)
                  .map((item, index) => {
                    if (item.type === 'divider') {
                      return (
                        <div
                          key={`divider-${index}`}
                          className="border-t border-purple-100 my-1"
                        ></div>
                      );
                    }

                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={(e) => handleAction(item.id, e)}
                        className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${item.color} dark:hover:bg-gray-700`}
                      >
                        <Icon size={16} className="me-3" />
                        <span>{item.label}</span>
                        {item.id === 'toggleActive' && (
                          <span
                            className={`ms-auto text-xs px-1.5 py-0.5 rounded ${topic.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {topic.is_active ? t('common:active') : t('common:inactive')}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Quick Actions Footer */}
              <div className="border-t border-purple-100 mt-1 pt-2">
                <div className="px-4 py-2">
                  <div className="text-xs text-gray-500 mb-2">
                    {t('topicActionsDropdown.quickActions')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleAction('analyze', e)}
                      className="flex-1 flex items-center justify-center p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs"
                      title={t('topicActionsDropdown.analytics')}
                    >
                      <BarChart size={14} />
                    </button>
                    <button
                      onClick={(e) => handleAction('share', e)}
                      className="flex-1 flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs"
                      title={t('topicActionsDropdown.share')}
                    >
                      <Share2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleAction('export', e)}
                      className="flex-1 flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs"
                      title={t('topicActionsDropdown.export')}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

TopicActionsDropdown.displayName = 'TopicActionsDropdown';
export default TopicActionsDropdown;
