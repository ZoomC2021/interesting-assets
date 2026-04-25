'use client';

interface CitationChipProps {
  id: string;
  className?: string;
  onClick?: () => void;
}

export function CitationChip({ id, className = '', onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`align-super font-data text-[10px] text-ink-muted transition-colors hover:text-accent ${className}`}
      title={`View source ${id}`}
      aria-label={`View source ${id}`}
    >
      [{id}]
    </button>
  );
}
