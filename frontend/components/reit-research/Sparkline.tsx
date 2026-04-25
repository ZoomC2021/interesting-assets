'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Sparkline({
  data,
  width = 60,
  height = 16,
  className = '',
  style,
}: SparklineProps) {
  if (!data.length) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 2;
  const usableHeight = height - paddingY * 2;

  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = height - paddingY - ((value - min) / range) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      style={style}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-accent"
      />
    </svg>
  );
}
