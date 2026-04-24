'use client';

import { AVAILABLE_ENTITIES } from '@/hooks/useEntityData';

interface EntitySelectorProps {
  availableEntities: typeof AVAILABLE_ENTITIES;
  selectedEntities: string[];
  onToggle: (entityCode: string) => void;
}

export function EntitySelector({ availableEntities, selectedEntities, onToggle }: EntitySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {availableEntities.map((entity) => {
        const isSelected = selectedEntities.includes(entity.code);
        return (
          <button
            key={entity.code}
            onClick={() => onToggle(entity.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                : 'bg-white text-neutral-600 border-2 border-transparent hover:bg-neutral-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              entity.code === '5130.KL' ? 'bg-primary-500' : 'bg-success-500'
            }`} />
            <span>{entity.name}</span>
            {isSelected && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
