import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../utils/useTheme';

export const PerformanceChart = ({ data, type = 'bar' }) => {
  const theme = useTheme();
  const isLight = theme === 'light';

  const tooltipStyle = isLight
    ? { backgroundColor: '#ffffff', border: '1px solid #d4d4d8', borderRadius: 8, color: '#27272a' }
    : { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' };

  const axisColor  = isLight ? '#71717a' : '#71717a';
  const gridColor  = isLight ? '#e8e8eb' : '#3f3f46';

  if (type === 'bar') {
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return null;
};
