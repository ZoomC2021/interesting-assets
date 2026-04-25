'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from './icons';

export interface RangeFilter {
  min: number;
  max: number;
}

export const DEFAULT_MARKET_CAP_RANGE: RangeFilter = { min: 0, max: 15000 };
export const DEFAULT_YIELD_RANGE: RangeFilter = { min: 0, max: 10 };

interface FilterSidebarProps {
  sectors: string[];
  selectedSectors: string[];
  onSectorChange: (sector: string) => void;
  shariahOnly: boolean;
  onShariahChange: (value: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  marketCapRange: RangeFilter;
  onMarketCapRangeChange: (range: RangeFilter) => void;
  yieldRange: RangeFilter;
  onYieldRangeChange: (range: RangeFilter) => void;
  marketCapMinMax: { min: number; max: number };
  yieldMinMax: { min: number; max: number };
  onReset?: () => void;
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

function DualRangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  unit = '',
  step = 1,
}: {
  label: string;
  min: number;
  max: number;
  value: RangeFilter;
  onChange: (range: RangeFilter) => void;
  unit?: string;
  step?: number;
}) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), value.max);
    onChange({ ...value, min: newMin });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), value.min);
    onChange({ ...value, max: newMax });
  };

  const formatValue = (val: number) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    }
    return val.toString();
  };

  return (
    <div className="px-1 pb-4 pt-2">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-muted">Min:</span>
          <span className="font-data text-xs font-medium text-ink">
            {formatValue(value.min)}{unit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-muted">Max:</span>
          <span className="font-data text-xs font-medium text-ink">
            {formatValue(value.max)}{unit}
          </span>
        </div>
      </div>
      
      <div className="relative h-6">
        {/* Track background */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface-alt" />
        {/* Active track */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{
            left: `${((value.min - min) / (max - min)) * 100}%`,
            right: `${100 - ((value.max - min) / (max - min)) * 100}%`,
          }}
        />
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={handleMinChange}
          aria-label={`${label} minimum`}
          className="absolute top-1/2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent accent-accent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0"
        />
        
        {/* Max slider - visual only (no pointer events) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          tabIndex={-1}
          className="absolute top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent accent-accent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0"
          style={{ pointerEvents: 'none' }}
          readOnly
        />
        {/* Max slider - interactive (transparent) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={handleMaxChange}
          aria-label={`${label} maximum`}
          className="absolute top-1/2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-0"
        />
      </div>
      
      <div className="mt-1 flex justify-between font-data text-xs text-ink-muted">
        <span>{formatValue(min)}{unit}</span>
        <span>{formatValue(max)}{unit}+</span>
      </div>
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
  marketCapRange,
  onMarketCapRangeChange,
  yieldRange,
  onYieldRangeChange,
  marketCapMinMax,
  yieldMinMax,
  onReset,
}: FilterSidebarProps) {
  // Check if any filters are active
  const hasActiveFilters = 
    searchQuery ||
    selectedSectors.length > 0 ||
    shariahOnly ||
    marketCapRange.min > marketCapMinMax.min ||
    marketCapRange.max < marketCapMinMax.max ||
    yieldRange.min > yieldMinMax.min ||
    yieldRange.max < yieldMinMax.max;

  return (
    <aside className="w-full shrink-0 border-b border-stroke bg-canvas p-4 md:sticky md:top-12 md:h-[calc(100vh-48px)] md:w-60 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Filters</h2>
        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-accent hover:text-accent-hover hover:underline"
          >
            Reset all
          </button>
        )}
      </div>
      
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
            <label key={sector} className="group flex cursor-pointer items-center gap-2 py-1.5">
              <span className="flex h-11 w-11 items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedSectors.includes(sector)}
                  onChange={() => onSectorChange(sector)}
                  className="h-3.5 w-3.5 cursor-pointer rounded-sm border-stroke bg-surface text-accent focus:ring-accent focus:ring-offset-0"
                />
              </span>
              <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">{sector}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Compliance">
        <label className="group flex cursor-pointer items-center gap-2 py-1.5">
          <span className="flex h-11 w-11 items-center justify-center">
            <input
              type="checkbox"
              checked={shariahOnly}
              onChange={(event) => onShariahChange(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded-sm border-stroke bg-surface text-accent focus:ring-accent focus:ring-offset-0"
            />
          </span>
          <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">
            Shariah Compliant Only
          </span>
        </label>
      </FilterSection>

      <FilterSection title="Market Cap (RM M)" defaultOpen={false}>
        <DualRangeSlider
          label="Market Cap"
          min={marketCapMinMax.min}
          max={marketCapMinMax.max}
          value={marketCapRange}
          onChange={onMarketCapRangeChange}
        />
      </FilterSection>

      <FilterSection title="Yield (%)" defaultOpen={false}>
        <DualRangeSlider
          label="Yield"
          min={yieldMinMax.min}
          max={yieldMinMax.max}
          value={yieldRange}
          onChange={onYieldRangeChange}
          unit="%"
          step={0.1}
        />
      </FilterSection>
    </aside>
  );
}
