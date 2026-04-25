'use client';

import clsx from 'clsx';
import { AVAILABLE_ENTITIES } from '@/hooks/useEntityData';

interface EntitySelectorProps {
  availableEntities: typeof AVAILABLE_ENTITIES;
  selectedEntities: string[];
  onToggle: (entityCode: string) => void;
  /** e.g. full-width toolbar: "w-full min-w-0 justify-start" */
  className?: string;
  /** `id` of a visible label element (e.g. "REITs" heading) for accessibility */
  labelledBy?: string;
}

export function EntitySelector({
  availableEntities,
  selectedEntities,
  onToggle,
  className,
  labelledBy,
}: EntitySelectorProps) {
  return (
    <div
      className={clsx('flex items-center flex-wrap gap-1.5', className)}
      role="group"
      aria-label={labelledBy ? undefined : 'Select REITs to compare'}
      aria-labelledby={labelledBy}
    >
      {availableEntities.map((entity) => {
        const isSelected = selectedEntities.includes(entity.code);
        return (
          <button
            key={entity.code}
            type="button"
            onClick={() => onToggle(entity.code)}
            aria-pressed={isSelected}
            className={clsx(
              'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-left text-xs font-medium transition-colors sm:max-w-[14rem]',
              isSelected
                ? 'border-primary-500 bg-primary-100 text-primary-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100',
            )}
          >
            <span
              className={clsx(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                entity.code === '5130.KL' ? 'bg-primary-500' : 'bg-success-500',
              )}
            />
            <span className="min-w-0 flex-1 truncate sm:whitespace-normal sm:break-words">
              {entity.name}
            </span>
            {isSelected && (
              <svg
                className="h-3.5 w-3.5 shrink-0 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
