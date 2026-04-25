'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { NormalizedReitData } from '@/types/frontend';
import { DASHBOARD_CHART_OUTER_CLASS } from '@/lib/chart-layout';
import clsx from 'clsx';

interface DpuTrendChartProps {
  entities: NormalizedReitData[];
  /** Defaults to the shared dashboard height for alignment with other charts. */
  chartAreaClassName?: string;
}

export function DpuTrendChart({ entities, chartAreaClassName }: DpuTrendChartProps) {
  const areaClass = chartAreaClassName ?? DASHBOARD_CHART_OUTER_CLASS;
  // Find DPU time series for each entity
  const entityDpuData = entities.map(entity => {
    const dpuSeries = entity.timeSeries.find(ts => ts.metricType === 'dpu');
    return {
      entity: entity.entity,
      series: dpuSeries,
    };
  });

  // Build chart data - merge all data points
  const allDates = new Set<string>();
  entityDpuData.forEach(({ series }) => {
    series?.dataPoints.forEach(dp => allDates.add(dp.date));
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  const chartData = sortedDates.map(date => {
    const point: Record<string, string | number | undefined> = { date };
    entityDpuData.forEach(({ entity, series }) => {
      const dp = series?.dataPoints.find(p => p.date === date);
      point[entity.code] = typeof dp?.value === 'number' ? dp.value : undefined;
    });
    return point;
  });

  const colors = ['#2563eb', '#16a34a', '#ea580c'];

  if (chartData.length === 0) {
    return (
      <div
        className={clsx(
          areaClass,
          'flex items-center justify-center',
        )}
      >
        <p className="text-sm text-neutral-400">No DPU trend data available</p>
      </div>
    );
  }

  return (
    <div className={areaClass}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getFullYear()}`;
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'sen', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)} sen`, '']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short' });
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          {entityDpuData.map(({ entity }, idx) => (
            <Line
              key={entity.id}
              type="monotone"
              dataKey={entity.code}
              name={entity.code}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
