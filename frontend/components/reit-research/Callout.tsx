'use client';

import React from 'react';

interface CalloutProps {
  type: 'fact' | 'risk' | 'thesis';
  children: React.ReactNode;
  className?: string;
}

export function Callout({ type, children, className = '' }: CalloutProps) {
  const config = {
    fact: {
      border: 'border-accent',
      bg: 'bg-accent/5',
      label: 'Key Fact',
      labelColor: 'text-accent',
    },
    risk: {
      border: 'border-danger',
      bg: 'bg-danger/5',
      label: 'Risk Factor',
      labelColor: 'text-danger',
    },
    thesis: {
      border: 'border-success',
      bg: 'bg-success/5',
      label: 'Thesis Point',
      labelColor: 'text-success',
    },
  };

  const { border, bg, label, labelColor } = config[type];

  return (
    <div className={`my-6 border-l-4 py-3 pl-4 ${border} ${bg} ${className}`}>
      <div className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>{label}</div>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}
