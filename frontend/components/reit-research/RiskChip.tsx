'use client';

import { RiskLevel } from '@/data/reits';

interface RiskChipProps {
  level: RiskLevel;
  className?: string;
}

// Hoisted config to avoid recreating on every render
const config: Record<RiskLevel, { bg: string; label: string }> = {
  low: { bg: 'bg-success', label: 'Low' },
  moderate: { bg: 'bg-warning', label: 'Mod' },
  'moderate-high': { bg: 'bg-accent-orange', label: 'Mod-High' },
  high: { bg: 'bg-danger', label: 'High' },
  unknown: { bg: 'bg-ink-muted', label: 'N/A' },
};

export function RiskChip({ level, className = '' }: RiskChipProps) {
  // Guard against unknown levels
  const { bg, label } = config[level] ?? config.unknown;

  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white ${bg} ${className}`}
    >
      {label}
    </span>
  );
}
