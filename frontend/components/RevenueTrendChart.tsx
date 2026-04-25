'use client';

import {
  BarChart,
  Bar,
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

interface RevenueTrendChartProps {
  entities: NormalizedReitData[];
  chartAreaClassName?: string;
}

export function RevenueTrendChart({ entities, chartAreaClassName }: RevenueTrendChartProps) {
  const areaClass = chartAreaClassName ?? DASHBOARD_CHART_OUTER_CLASS;
  // Find quarterly revenue data from metrics
  const revenueData = entities.map(entity => {
    const quarterlyMetrics = entity.metrics.filter(m => 
      m.metricType === 'gross_revenue' && 
      m.period.type === 'quarter' &&
      m.period.quarter !== undefined
    );
    
    return {
      entity: entity.entity,
      quarters: quarterlyMetrics.sort((a, b) => {
        const yearDiff = (a.period.fiscalYear || 0) - (b.period.fiscalYear || 0);
        if (yearDiff !== 0) return yearDiff;
        return (a.period.quarter || 0) - (b.period.quarter || 0);
      }),
    };
  });

  // Build chart data
  const allQuarters = new Set<string>();
  revenueData.forEach(({ quarters }) => {
    quarters.forEach(q => {
      if (q.period.quarter && q.period.fiscalYear) {
        allQuarters.add(`${q.period.fiscalYear}-Q${q.period.quarter}`);
      }
    });
  });
  
  const sortedQuarters = Array.from(allQuarters).sort();
  const recentQuarters = sortedQuarters.slice(-8); // Last 8 quarters
  
  const chartData = recentQuarters.map(qKey => {
    const [year, q] = qKey.split('-');
    const quarterNum = parseInt(q.replace('Q', ''));
    
    const point: Record<string, string | number> = { 
      quarter: qKey,
      label: `${year} ${q}`,
    };
    
    revenueData.forEach(({ entity, quarters }) => {
      const match = quarters.find(
        m => m.period.fiscalYear === parseInt(year) && m.period.quarter === quarterNum
      );
      point[entity.code] = typeof match?.value === 'number' ? match.value / 1e6 : 0; // Convert to millions
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
        <p className="text-sm text-neutral-400">No quarterly revenue data available</p>
      </div>
    );
  }

  return (
    <div className={areaClass}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'RM Million', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            formatter={(value: number) => [`RM ${value.toFixed(1)}M`, '']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          {revenueData.map(({ entity }, idx) => (
            <Bar
              key={entity.id}
              dataKey={entity.code}
              name={entity.code}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
