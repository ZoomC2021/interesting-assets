'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AVAILABLE_ENTITIES, type AvailableEntity } from '@/lib/available-entities';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { Search, X, Plus } from './icons';

interface AddReitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onAdd: (entityCode: string) => void;
}

const MAX_REITS = 6;

export function AddReitModal({ isOpen, onClose, selectedIds, onAdd }: AddReitModalProps) {
  const { announce, liveRegionProps } = useAnnouncer();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create a set of selected IDs for efficient lookup
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Check if we've reached the limit
  const isAtLimit = selectedIds.length >= MAX_REITS;

  // Filter entities based on search query and exclude already selected
  const filteredEntities = useMemo(() => {
    // Filter out already selected entities
    const availableEntities = AVAILABLE_ENTITIES.filter(
      (entity) => !selectedIdsSet.has(entity.code)
    );

    if (!query.trim()) return availableEntities.slice(0, 6); // Show first 6 available by default

    const normalizedQuery = query.toLowerCase().trim();
    return availableEntities.filter((entity) => {
      const nameMatch = entity.name.toLowerCase().includes(normalizedQuery);
      const codeMatch = entity.code.toLowerCase().includes(normalizedQuery);
      const aliasMatch = entity.aliases?.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery)
      );
      return nameMatch || codeMatch || aliasMatch;
    });
  }, [query, selectedIdsSet]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredEntities.length, query]);

  // Announce results to screen readers
  useEffect(() => {
    if (isOpen && query.trim()) {
      const count = filteredEntities.length;
      announce(`${count} result${count === 1 ? '' : 's'} found`, 'polite');
    }
  }, [filteredEntities.length, query, isOpen, announce]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = useCallback((entity: AvailableEntity) => {
    if (isAtLimit) {
      announce(`Cannot add ${entity.name}. Maximum of ${MAX_REITS} REITs reached.`, 'assertive');
      return;
    }
    onAdd(entity.code);
    announce(`${entity.name} added to comparison`, 'polite');
    onClose();
  }, [isAtLimit, onAdd, onClose, announce]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredEntities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredEntities[selectedIndex] && !isAtLimit) {
          handleSelect(filteredEntities[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Trap focus within modal
        e.preventDefault();
        break;
    }
  }, [filteredEntities, selectedIndex, handleSelect, onClose, isAtLimit]);

  // Focus trap for the modal
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusOnDeactivate: true,
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add REIT to comparison"
        className="fixed left-1/2 top-[15vh] z-[70] w-[90vw] max-w-lg -translate-x-1/2 rounded-lg border border-stroke bg-surface shadow-popover"
        onKeyDown={handleKeyDown}
      >
        {/* Header with limit indicator */}
        <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Add REIT to Compare</h2>
          <span
            className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
              isAtLimit
                ? 'bg-danger/10 text-danger'
                : 'bg-surface-alt text-ink-muted'
            }`}
          >
            {selectedIds.length} / {MAX_REITS} REITs
          </span>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-stroke px-4 py-3">
          <Search className="h-5 w-5 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search REITs by name or ticker..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            aria-label="Search REITs"
            autoComplete="off"
            spellCheck={false}
            disabled={isAtLimit}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded-sm p-1 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded-[2px] border border-stroke bg-canvas px-1.5 py-0.5 font-sans text-[10px] text-ink-muted sm:block">
            ESC
          </kbd>
        </div>

        {/* Limit Warning */}
        {isAtLimit && (
          <div className="border-b border-stroke bg-danger/5 px-4 py-2 text-xs text-danger">
            Maximum of {MAX_REITS} REITs reached. Remove a REIT to add another.
          </div>
        )}

        {/* Results */}
        <div
          className="max-h-[50vh] overflow-y-auto py-2"
          role="listbox"
          aria-label="Search results"
        >
          {filteredEntities.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-ink-muted">
              {isAtLimit ? (
                <p>Remove a REIT to add more to comparison</p>
              ) : (
                <>
                  <p>No REITs found</p>
                  <p className="mt-1 text-xs">Try searching by name, ticker, or alias</p>
                </>
              )}
            </div>
          ) : (
            filteredEntities.map((entity, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={entity.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(entity)}
                  disabled={isAtLimit}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    isAtLimit
                      ? 'cursor-not-allowed opacity-50'
                      : isSelected
                        ? 'bg-accent/10 text-accent'
                        : 'text-ink hover:bg-surface-alt'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-stroke bg-canvas font-mono text-xs font-medium text-ink-muted">
                      {entity.code.split('.')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{entity.name}</p>
                      <p className="text-xs text-ink-muted">
                        {entity.code} • {entity.sector}
                      </p>
                    </div>
                  </div>
                  {!isAtLimit && isSelected && (
                    <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stroke px-4 py-2 text-xs text-ink-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded-[2px] border border-stroke bg-canvas px-1 py-0.5 font-sans">↑</kbd>
              <kbd className="rounded-[2px] border border-stroke bg-canvas px-1 py-0.5 font-sans">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-[2px] border border-stroke bg-canvas px-1.5 py-0.5 font-sans">↵</kbd>
              <span>to add</span>
            </span>
          </div>
          <span>{filteredEntities.length} available</span>
        </div>

        {/* Screen reader announcements */}
        <div {...liveRegionProps.polite} />
        <div {...liveRegionProps.assertive} />
      </div>
    </>
  );
}
