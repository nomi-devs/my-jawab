// src/components/dashboard/topics/TopicsGrid.jsx
import React from 'react';
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
    if (viewMode === 'list') {
      return (
        <>
          <table className="w-full text-left border-collapse transition-opacity duration-300">
            <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
              <tr>
                <th className="p-4 w-16">#</th>
                <th className="p-4">Topic</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4">Parent</th>
                <th className="p-4">Sub-Topics</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
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
