'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AVAILABLE_ENTITIES, type AvailableEntity } from '@/lib/available-entities';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { AlignJustify, AlignLeft, Moon, Search, Sun, X, ArrowRight } from './icons';

interface GlobalNavProps {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

export function GlobalNav({
  isCompact,
  setIsCompact,
  isDark,
  setIsDark,
}: GlobalNavProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { name: 'Monitor', path: '/' },
    { name: 'Compare', path: '/compare' },
    { name: 'Coverage', path: '/coverage' },
    { name: 'Methodology', path: '/methodology' },
  ];

  // Keyboard shortcut: Cmd/Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-stroke bg-canvas px-3 md:px-4">
        <div className="flex h-full items-center gap-3 md:gap-6">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-accent transition-colors group-hover:bg-accent-hover">
              <div className="h-2 w-2 rounded-[1px] bg-canvas" />
            </div>
            <span className="text-label hidden tracking-widest text-ink sm:inline-block">REIT RESEARCH</span>
          </Link>

          <nav className="ml-1 flex h-full items-center gap-1 md:ml-4" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.path ||
                (link.path === '/' && pathname === '/monitor') ||
                (link.path !== '/' && pathname?.startsWith(link.path));

              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative flex h-full items-center px-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {link.name}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            ref={searchTriggerRef}
            onClick={() => setIsSearchOpen(true)}
            className="hidden cursor-text items-center gap-2 rounded-sm border border-stroke bg-surface-alt px-2 py-1 text-xs text-ink-muted transition-colors hover:border-stroke-strong hover:text-ink lg:flex"
            aria-label="Open search (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="w-24 text-left xl:w-32">Search...</span>
            <kbd className="rounded-[2px] border border-stroke bg-canvas px-1 font-sans text-[10px]">
              <span className="sr-only">Keyboard shortcut:</span>⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-1 border-l border-stroke pl-3 md:pl-4">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
              title={isCompact ? 'Switch to comfortable density' : 'Switch to compact density'}
              aria-label={isCompact ? 'Switch to comfortable density' : 'Switch to compact density'}
            >
              {isCompact ? <AlignJustify className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="hidden border-l border-stroke pl-4 text-xs text-ink-faint xl:block">
            Last updated 24 Apr 2025
          </div>
        </div>
      </header>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        triggerRef={searchTriggerRef}
      />
    </>
  );
}

// =============================================================================
// SearchModal Component
// =============================================================================

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

function SearchModal({ isOpen, onClose, triggerRef }: SearchModalProps) {
  const router = useRouter();
  const { announce, liveRegionProps } = useAnnouncer();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter entities based on search query
  const filteredEntities = useMemo(() => {
    if (!query.trim()) return AVAILABLE_ENTITIES.slice(0, 6); // Show first 6 by default
    
    const normalizedQuery = query.toLowerCase().trim();
    return AVAILABLE_ENTITIES.filter((entity) => {
      const nameMatch = entity.name.toLowerCase().includes(normalizedQuery);
      const codeMatch = entity.code.toLowerCase().includes(normalizedQuery);
      const aliasMatch = entity.aliases?.some((alias) => 
        alias.toLowerCase().includes(normalizedQuery)
      );
      return nameMatch || codeMatch || aliasMatch;
    });
  }, [query]);

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
    onClose();
    router.push(`/entity/${entity.code}`);
  }, [onClose, router]);

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
        if (filteredEntities[selectedIndex]) {
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
  }, [filteredEntities, selectedIndex, handleSelect, onClose]);

  // Focus trap for the modal
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusOnDeactivate: true,
  });

  // Return focus to trigger when closing
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

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
        aria-label="Search entities"
        className="fixed left-1/2 top-[15vh] z-[70] w-[90vw] max-w-lg -translate-x-1/2 rounded-lg border border-stroke bg-surface shadow-popover"
        onKeyDown={handleKeyDown}
      >
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
            aria-label="Search entities"
            autoComplete="off"
            spellCheck={false}
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

        {/* Results */}
        <div 
          className="max-h-[50vh] overflow-y-auto py-2"
          role="listbox"
          aria-label="Search results"
        >
          {filteredEntities.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-ink-muted">
              <p>No entities found</p>
              <p className="mt-1 text-xs">Try searching by name, ticker, or alias</p>
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
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    isSelected
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
                  {isSelected && (
                    <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />
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
              <span>to select</span>
            </span>
          </div>
          <span>{filteredEntities.length} entities</span>
        </div>

        {/* Screen reader announcements */}
        <div {...liveRegionProps.polite} />
        <div {...liveRegionProps.assertive} />
      </div>
    </>
  );
}
