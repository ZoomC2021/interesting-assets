'use client';

/**
 * BenchmarkIndicator - Shows rank/percentile against sector
 */

import React from 'react';
import type { MetricType } from '@/types/frontend';
import type { EntityBenchmarkComparison } from '@/lib/benchmark-calculations';
import { getMetricDefinition } from '@/lib/data-utils';
import { formatPercentile, getPercentileColor, getRankBadge } from '@/lib/benchmark-calculations';

interface BenchmarkIndicatorProps {
  comparison: EntityBenchmarkComparison | undefined;
  showRank?: boolean;
  showPercentile?: boolean;
  showVsMedian?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BenchmarkIndicator({
  comparison,
  showRank = true,
  showPercentile = true,
  showVsMedian = false,
  size = 'sm',
  className = '',
}: BenchmarkIndicatorProps) {
  if (!comparison) {
    return (
      <span className={`text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}>
        —
      </span>
    );
  }
  
  const { value, percentile, rank, vsMedian, metricType } = comparison;
  const total = comparison.rank; // This is approximate
  
  const metricDef = getMetricDefinition(metricType);
  const isHigherBetter = metricDef?.isHigherBetter ?? true;
  
  const badge = getRankBadge(rank, total);
  const percentileColor = getPercentileColor(percentile, isHigherBetter);
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Rank badge */}
      {showRank && (
        <span
          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded font-semibold ${sizeClasses[size]}`}
          style={{ 
            backgroundColor: `${badge.color}20`,
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
      )}
      
      {/* Percentile */}
      {showPercentile && (
        <span
          className={`font-medium ${sizeClasses[size]}`}
          style={{ color: percentileColor }}
        >
          {formatPercentile(percentile)}
        </span>
      )}
      
      {/* vs Median */}
      {showVsMedian && (
        <span
          className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        >
          {vsMedian > 0 ? '+' : ''}{vsMedian.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// Compact version with just percentile bar
interface PercentileBarProps {
  percentile: number;
  isHigherBetter?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function PercentileBar({
  percentile,
  isHigherBetter = true,
  showValue = true,
  size = 'sm',
  className = '',
}: PercentileBarProps) {
  const color = getPercentileColor(percentile, isHigherBetter);
  
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 ${height} bg-gray-200 rounded-full overflow-hidden min-w-[40px]`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${percentile}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showValue && (
        <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium w-8 text-right`}>
          {Math.round(percentile)}
        </span>
      )}
    </div>
  );
}

// Rank number with medal for top 3
interface RankBadgeProps {
  rank: number;
  total: number;
  showTotal?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RankBadge({ rank, total, showTotal = false, size = 'sm', className = '' }: RankBadgeProps) {
  const badge = getRankBadge(rank, total);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1',
  };
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold ${sizeClasses[size]} ${className}`}
      style={{ 
        backgroundColor: `${badge.color}20`,
        color: badge.color,
      }}
    >
      {rank <= 3 && <span>🏆</span>}
      {badge.text}
      {showTotal && <span className="opacity-60">/ {total}</span>}
    </span>
  );
}

// Full benchmark card
interface BenchmarkCardProps {
  comparison: EntityBenchmarkComparison;
  className?: string;
}

export function BenchmarkCard({ comparison, className = '' }: BenchmarkCardProps) {
  const { value, percentile, rank, vsMedian, metricType } = comparison;
  const metricDef = getMetricDefinition(metricType);
  const isHigherBetter = metricDef?.isHigherBetter ?? true;
  
  return (
    <div className={`p-3 bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{metricDef?.displayName || metricType}</span>
        <RankBadge rank={rank} total={rank * 2} size="sm" />
      </div>
      
      <div className="mb-2">
        <PercentileBar 
          percentile={percentile} 
          isHigherBetter={isHigherBetter}
          size="md"
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatPercentile(percentile)}</span>
        <span className={vsMedian > 0 ? 'text-emerald-600' : vsMedian < 0 ? 'text-red-600' : ''}>
          {vsMedian > 0 ? '+' : ''}{vsMedian.toFixed(1)}% vs median
        </span>
      </div>
    </div>
  );
}
