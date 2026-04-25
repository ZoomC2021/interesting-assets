'use client';

import Link from 'next/link';
import { REIT } from '@/data/reits';
import { ArrowRight, X } from './icons';

interface CompareTrayProps {
  selectedReits: REIT[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareTray({ selectedReits, onRemove, onClear }: CompareTrayProps) {
  if (selectedReits.length === 0) {
    return null;
  }

  const compareHref = `/compare/${selectedReits.map((reit) => reit.ticker).join(',')}`;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 flex-wrap items-center gap-4 rounded-sm border border-stroke-strong bg-surface px-4 py-3 shadow-popover md:bottom-6 md:flex-nowrap md:gap-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">Comparing</span>
        <span className="rounded-sm border border-stroke bg-surface-alt px-1.5 py-0.5 font-data text-xs text-ink-muted">
          {selectedReits.length}/6
        </span>
      </div>

      <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
        {selectedReits.map((reit) => (
          <div
            key={reit.id}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-stroke bg-surface-alt py-1 pl-2 pr-1 text-sm"
          >
            <span className="font-medium">{reit.ticker.split('.')[0]}</span>
            <button
              type="button"
              onClick={() => onRemove(reit.id)}
              className="rounded-sm p-0.5 text-ink-muted transition-colors hover:bg-stroke hover:text-ink"
              aria-label={`Remove ${reit.name} from comparison`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-l border-stroke pl-0 md:pl-6">
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          Clear
        </button>
        <Link
          href={compareHref}
          className="flex items-center gap-1.5 rounded-sm bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Compare {selectedReits.length} {selectedReits.length === 1 ? 'REIT' : 'REITs'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
