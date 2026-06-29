// src/components/dashboard/overview/UserGrowthChart.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

const UserGrowthChart = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Growth</CardTitle>
        <select className="bg-background border text-sm rounded-lg p-2 outline-none">
          <option>Last 7 Days</option>
          <option>Last Month</option>
          <option>Last Year</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end space-x-2 justify-between px-2">
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
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;