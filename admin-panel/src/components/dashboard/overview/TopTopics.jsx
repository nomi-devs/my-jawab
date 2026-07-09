// src/components/dashboard/overview/TopTopics.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

const TopTopics = () => {
  const { t } = useTranslation('overview');
  const topics = [
    { name: '#Technology', count: '450k', percentage: 75 },
    { name: '#Design', count: '320k', percentage: 67 },
    { name: '#Minimalism', count: '210k', percentage: 50 },
    { name: '#Coding', count: '180k', percentage: 33 },
    { name: '#Nature', count: '120k', percentage: 25 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('topTopics.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{topic.name}</span>
              <span className="text-muted-foreground">{topic.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${topic.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopTopics;
