// src/components/dashboard/topics/TopicsGrid.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import TopicCard from './TopicCard';
import TopicRow from './TopicRow';
import { Hash, Eye } from 'lucide-react';

const TopicsGrid = React.memo(
  ({
    topics,
    viewMode = 'grid',
    onEdit,
    onDelete,
    onViewDetails,
    onToggleActive,
    currentPage = 1,
    itemsPerPage = 10,
  }) => {
    const { t } = useTranslation('topics');
    if (viewMode === 'list') {
      return (
        <>
          <table className="w-full text-start border-collapse transition-opacity duration-300">
            <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
              <tr>
                <th className="p-4 w-16">#</th>
                <th className="p-4">{t('topicsGrid.topic')}</th>
                <th className="p-4">{t('common:description')}</th>
                <th className="p-4">{t('common:status')}</th>
                <th className="p-4">{t('topicsGrid.parent')}</th>
                <th className="p-4">{t('topicsGrid.subTopics')}</th>
                <th className="p-4">{t('common:created')}</th>
                <th className="p-4 text-end">{t('common:actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
              {topics.map((topic, index) => {
                const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewDetails={onViewDetails}
                    onToggleActive={onToggleActive}
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
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className="animate-fadeIn"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <TopicCard
              topic={topic}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onToggleActive={onToggleActive}
            />
          </div>
        ))}
      </div>
    );
  },
);

TopicsGrid.displayName = 'TopicsGrid';
export default TopicsGrid;
