'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from './icons';

interface FilterSidebarProps {
  sectors: string[];
  selectedSectors: string[];
  onSectorChange: (sector: string) => void;
  shariahOnly: boolean;
  onShariahChange: (value: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stroke py-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted group-hover:text-ink" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted group-hover:text-ink" />
        )}
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  sectors,
  selectedSectors,
  onSectorChange,
  shariahOnly,
  onShariahChange,
  searchQuery,
  onSearchChange,
}: FilterSidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-stroke bg-canvas p-4 md:sticky md:top-12 md:h-[calc(100vh-48px)] md:w-60 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Filter by name or ticker..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-sm border border-stroke bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <FilterSection title="Sector">
        <div className="space-y-2">
          {sectors.map((sector) => (
            <label key={sector} className="group flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSectors.includes(sector)}
                onChange={() => onSectorChange(sector)}
                className="h-3.5 w-3.5 cursor-pointer rounded-sm border-stroke bg-surface text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">{sector}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Compliance">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={shariahOnly}
            onChange={(event) => onShariahChange(event.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer rounded-sm border-stroke bg-surface text-accent focus:ring-accent focus:ring-offset-0"
          />
          <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">
            Shariah Compliant Only
          </span>
        </label>
      </FilterSection>

      <FilterSection title="Market Cap (RM M)" defaultOpen={false}>
        <div className="px-1 pb-4 pt-2">
          <input type="range" className="w-full accent-accent" min="0" max="15000" />
          <div className="mt-1 flex justify-between font-data text-xs text-ink-muted">
            <span>0</span>
            <span>15k+</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Yield (%)" defaultOpen={false}>
        <div className="px-1 pb-4 pt-2">
          <input type="range" className="w-full accent-accent" min="0" max="10" />
          <div className="mt-1 flex justify-between font-data text-xs text-ink-muted">
            <span>0%</span>
            <span>10%+</span>
          </div>
        </div>
      </FilterSection>
    </aside>
  );
}
