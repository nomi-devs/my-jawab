// src/components/dashboard/topics/TopicTrendsChart.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

const TopicTrendsChart = React.memo(() => {
  const { t } = useTranslation('topics');
  const trends = [
    { name: '#Technology', value: 85, change: '+12%', color: 'bg-purple-500' },
    { name: '#Design', value: 72, change: '+8%', color: 'bg-blue-500' },
    { name: '#Minimalism', value: 65, change: '+15%', color: 'bg-green-500' },
    { name: '#Coding', value: 58, change: '+5%', color: 'bg-amber-500' },
    { name: '#AI', value: 52, change: '+23%', color: 'bg-red-500' },
    { name: '#Nature', value: 45, change: '+3%', color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{t('topicTrendsChart.title')}</h3>
          <p className="text-sm text-gray-500">{t('topicTrendsChart.subtitle')}</p>
        </div>
        <div className="flex items-center text-green-600">
          <TrendingUp size={16} className="me-1" />
          <span className="text-sm font-medium">
            {t('topicTrendsChart.overallGrowth', { percent: '+14%' })}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {trends.map((trend, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{trend.name}</span>
              <span
                className={`font-medium ${trend.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend.change}
              </span>
            </div>
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${trend.color}`}
                style={{ width: `${trend.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-purple-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('topicTrendsChart.showingTop', { count: 6 })}</span>
          <button className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
            <span>{t('topicTrendsChart.viewAllTrends')}</span>
            <span className="rtl:rotate-180">→</span>
          </button>
        </div>
      </div>
    </div>
  );
});

TopicTrendsChart.displayName = 'TopicTrendsChart';
export default TopicTrendsChart;
