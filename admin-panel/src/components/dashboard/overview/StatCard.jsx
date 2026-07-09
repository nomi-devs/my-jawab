// src/components/dashboard/overview/StatCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, trend, description }) => {
  // Parse trend value to determine if positive or negative
  const isPositiveTrend = trend && !trend.startsWith('-');
  const trendValue = trend ? parseFloat(trend.replace(/[+%]/g, '')) : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 transition-colors">
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
              isPositiveTrend && trendValue > 0
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                : trendValue < 0
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
            }`}
          >
            {trendValue !== null &&
              trendValue !== 0 &&
              (isPositiveTrend && trendValue > 0 ? (
                <TrendingUp size={12} className="me-1" />
              ) : (
                <TrendingDown size={12} className="me-1" />
              ))}
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1 transition-colors">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors mb-1">
        {count}
      </p>
      {description && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
