// src/components/dashboard/polls/PollsList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import PollCard from './PollCard';
import PollRow from './PollRow';
import { BarChart3 } from 'lucide-react';

const PollsList = React.memo(
  ({
    polls,
    viewMode,
    loading,
    onEdit,
    onDelete,
    onViewDetails,
    currentPage = 1,
    itemsPerPage = 10,
  }) => {
    const { t } = useTranslation('polls');
    if (loading && polls.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('pollsList.loadingPolls')}</p>
        </div>
      );
    }

    if (polls.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <BarChart3 className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors">
            {t('pollsList.noPollsFound')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 transition-colors">
            {t('pollsList.createFirstPoll')}
          </p>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        <table className="w-full text-start border-collapse transition-opacity duration-300">
          <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
            <tr>
              <th className="p-4 w-16">#</th>
              <th className="p-4">{t('pollsList.columnPoll')}</th>
              <th className="p-4">{t('common:description')}</th>
              <th className="p-4">{t('common:status')}</th>
              <th className="p-4">{t('pollsList.columnStats')}</th>
              <th className="p-4">{t('pollsList.columnExpires')}</th>
              <th className="p-4 text-end">{t('common:actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
            {polls.map((poll, index) => {
              const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <PollRow
                  key={poll.id}
                  poll={poll}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                  index={index}
                  serialNumber={serialNumber}
                />
              );
            })}
          </tbody>
        </table>
      </>
    );
  },
);

PollsList.displayName = 'PollsList';
export default PollsList;
