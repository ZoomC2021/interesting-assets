'use client';

import type { Metric } from '@/types/frontend';

interface BulletChartProps {
  value: number;
  target: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}

export function BulletChart({ value, target, max, label, unit, color }: BulletChartProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const targetPercentage = Math.min(100, Math.max(0, (target / max) * 100));
  
  // Determine status color
  const getStatusColor = () => {
    if (value <= target * 1.1) return '#22c55e'; // green - good
    if (value <= target * 1.3) return '#eab308'; // yellow - warning
    return '#ef4444'; // red - danger
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-body font-medium text-neutral-900">{label}</span>
        <span className="text-metric-sm" style={{ color }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      
      {/* Bullet chart */}
      <div className="relative h-6 bg-neutral-100 rounded-full overflow-hidden">
        {/* Background zones */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-success-100" /> {/* Good zone */}
          <div className="w-1/4 bg-warning-100" /> {/* Warning zone */}
          <div className="w-1/6 bg-red-100" /> {/* Danger zone */}
        </div>
        
        {/* Value bar */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
          style={{
            left: 0,
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
        
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-neutral-800"
          style={{ left: `${targetPercentage}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2">
            <svg className="w-3 h-3 text-neutral-800" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="6,0 0,12 12,12" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-body-sm text-neutral-500">
        <span>0</span>
        <span>Target: {target}{unit}</span>
        <span>Max: {max}{unit}</span>
      </div>
    </div>
  );
}
