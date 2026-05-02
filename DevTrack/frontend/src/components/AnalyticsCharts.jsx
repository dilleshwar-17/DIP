import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const AnalyticsCharts = ({ data, title }) => {
  const { theme } = useTheme();
  
  if (!data) return null;

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const textColor = isDarkMode ? '#9ca3af' : '#4b5563';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
  const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';

  const { categoryData, historyTrend } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2 mt-6">
      
      {/* Category Breakdown Pie Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Hours by Category ({title})</h3>
        <div className="h-64">
          {categoryData && categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: tooltipBg,
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">No data available for this period</div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {categoryData?.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
              <span>{entry.name} ({entry.value.toFixed(1)}h)</span>
            </div>
          ))}
        </div>
      </div>

      {/* History Trend Bar Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title} Progress History</h3>
        <div className="h-64">
          {historyTrend && historyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyTrend}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: textColor, fontWeight: 'bold' }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  interval={historyTrend.length > 14 ? 4 : 0} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: textColor, fontWeight: 'bold' }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: tooltipBg,
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                  formatter={(value, name) => [name === 'hours' ? `${value.toFixed(1)}h` : value, name === 'hours' ? 'Study Hours' : 'Tasks Done']}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">No history data available</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsCharts;

