// src/components/dashboard/overview/UserGrowthChart.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const UserGrowthChart = () => {
  const { t } = useTranslation('overview');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('userGrowthChart.title')}</CardTitle>
        <select className="bg-background border text-sm rounded-lg p-2 outline-none">
          <option>{t('userGrowthChart.range.last7Days')}</option>
          <option>{t('userGrowthChart.range.lastMonth')}</option>
          <option>{t('userGrowthChart.range.lastYear')}</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-2 justify-between px-2">
          {[40, 65, 45, 80, 55, 90, 75, 60, 85, 95, 70, 80].map((h, i) => (
            <div key={i} className="w-full bg-primary/10 rounded-t-lg relative group">
              <div
                className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500 group-hover:bg-primary/90"
                style={{ height: `${h}%` }}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
          {MONTH_KEYS.map((monthKey) => (
            <span key={monthKey}>{t(`userGrowthChart.months.${monthKey}`)}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;
