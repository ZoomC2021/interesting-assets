import React from 'react';

interface SectionHeaderProps {
  label: string;
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  label,
  title,
  count,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div>
          <div className="mb-1 text-label">{label}</div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {count !== undefined && (
              <span className="inline-flex items-center justify-center rounded-sm border border-stroke bg-surface-alt px-1.5 py-0.5 font-data text-xs text-ink-muted">
                {count}
              </span>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="h-px w-full bg-stroke" />
    </div>
  );
}
