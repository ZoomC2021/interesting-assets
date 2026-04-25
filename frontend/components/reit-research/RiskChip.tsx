'use client';

import { RiskLevel } from '@/data/reits';

interface RiskChipProps {
  level: RiskLevel;
  className?: string;
}

export function RiskChip({ level, className = '' }: RiskChipProps) {
  const config = {
    low: { bg: 'bg-success', label: 'Low' },
    moderate: { bg: 'bg-warning', label: 'Mod' },
    'moderate-high': { bg: 'bg-[hsl(28,80%,52%)]', label: 'Mod-High' },
    high: { bg: 'bg-danger', label: 'High' },
  };

  const { bg, label } = config[level];

  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white ${bg} ${className}`}
    >
      {label}
    </span>
  );
}
