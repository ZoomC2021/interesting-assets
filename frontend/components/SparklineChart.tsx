'use client';

/**
 * SparklineChart - Mini line chart component for trends
 */

import React from 'react';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showFill?: boolean;
  fillOpacity?: number;
  className?: string;
}

export function SparklineChart({
  data,
  width = 80,
  height = 24,
  color = '#2563eb',
  strokeWidth = 1.5,
  showFill = true,
  fillOpacity = 0.2,
  className = '',
}: SparklineChartProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className={className}>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-label" fill="#94a3b8">
          -
        </text>
      </svg>
    );
  }
  
  // Calculate scales
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Generate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  // Generate fill path (close the area)
  const fillPath = showFill
    ? `${points} ${padding + chartWidth},${padding + chartHeight} ${padding},${padding + chartHeight}`
    : '';
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Fill area */}
      {showFill && (
        <polygon
          points={fillPath}
          fill={color}
          fillOpacity={fillOpacity}
        />
      )}
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End point dot */}
      <circle
        cx={padding + chartWidth}
        cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
        r={2}
        fill={color}
      />
    </svg>
  );
}

// Variant with trend indicator
interface SparklineWithTrendProps extends SparklineChartProps {
  showTrend?: boolean;
}

export function SparklineWithTrend({
  data,
  showTrend = true,
  ...sparklineProps
}: SparklineWithTrendProps) {
  const trend = data.length >= 2 
    ? data[data.length - 1] - data[0]
    : 0;
  
  const trendColor = trend > 0 
    ? '#22c55e'  // green for positive
    : trend < 0 
      ? '#ef4444'  // red for negative
      : '#64748b'; // gray for neutral
  
  const trendIcon = trend > 0 
    ? '↑' 
    : trend < 0 
      ? '↓' 
      : '→';
  
  return (
    <div className="flex items-center gap-2">
      <SparklineChart {...sparklineProps} data={data} color={trendColor} />
      {showTrend && trend !== 0 && (
        <span 
          className="text-body-sm font-medium"
          style={{ color: trendColor }}
        >
          {trendIcon}
        </span>
      )}
    </div>
  );
}

// Multi-series sparkline for comparisons
interface MultiSparklineProps {
  series: Array<{
    data: number[];
    color: string;
    name: string;
  }>;
  width?: number;
  height?: number;
  className?: string;
}

export function MultiSparkline({
  series,
  width = 100,
  height = 30,
  className = '',
}: MultiSparklineProps) {
  const allValues = series.flatMap(s => s.data);
  if (allValues.length === 0) return null;

  // Find global min/max across all series
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  
  const padding = 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {series.map((s, index) => {
        const points = s.data.map((value, i) => {
          const x = padding + (i / (s.data.length - 1 || 1)) * chartWidth;
          const y = padding + chartHeight - ((value - min) / range) * chartHeight;
          return `${x},${y}`;
        }).join(' ');
        
        return (
          <polyline
            key={index}
            points={points}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.8}
          />
        );
      })}
    </svg>
  );
}
