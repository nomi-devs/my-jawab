// src/components/dashboard/banners/BannersTable.jsx
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import BannerRow from './BannerRow';

const BannersTable = React.memo(
  ({
    banners = [],
    isRefreshing = false,
    currentPage = 1,
    itemsPerPage = 10,
    onEdit,
    onDelete,
    onViewDetails,
    onToggleActive,
    onAddClick,
    hasFilters = false,
  }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Refreshing overlay */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${isRefreshing ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
            </div>
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No banners found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {hasFilters
                ? 'Try changing your search or filters'
                : 'Start by adding your first banner'}
            </p>
            {!hasFilters && (
              <button
                onClick={onAddClick}
                className="px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                Add First Banner
              </button>
            )}
          </div>
        ) : (
          <div
            className="overflow-x-auto transition-all duration-300 ease-in-out"
            style={{ opacity: isRefreshing ? 0.6 : 1, scrollbarGutter: 'stable' }}
          >
            <table className="w-full text-left border-collapse">
              <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Banner</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Link</th>
                  <th className="p-3">Targeting</th>
                  <th className="p-3 text-center">Order</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Validity</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
                {banners.map((banner, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <BannerRow
                      key={banner.id}
                      banner={banner}
                      serialNumber={serialNumber}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewDetails={onViewDetails}
                      onToggleActive={onToggleActive}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  },
);

export default BannersTable;
