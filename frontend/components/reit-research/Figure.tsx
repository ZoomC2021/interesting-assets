'use client';

import React from 'react';

interface FigureProps {
  caption: React.ReactNode;
  source?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Figure({ caption, source, children, className = '' }: FigureProps) {
  return (
    <figure className={`my-8 ${className}`}>
      <div className="mb-3 rounded-sm border border-stroke bg-surface-alt p-4">{children}</div>
      <figcaption className="text-sm leading-snug text-ink-muted">
        <span className="mr-2 font-medium text-ink">{caption}</span>
        {source && (
          <span className="ml-1 text-xs font-medium uppercase tracking-wider text-ink-faint">
            Source: {source}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
