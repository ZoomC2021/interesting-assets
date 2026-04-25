'use client';

/**
 * FilterBar - Search, filter, and selection toolbar
 */

import React, { useState, useCallback } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export interface FilterState {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  sector: string;
  shariah: 'all' | 'yes' | 'no';
  minMarketCap: number | null;
  maxMarketCap: number | null;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableSectors: string[];
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  className?: string;
}

export function FilterBar({
  filters,
  onFilterChange,
  availableSectors,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onClearSelection,
  className = '',
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(localSearch, 300);
  
  // Update parent when debounced search changes
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFilterChange]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };
  
  const handleSortChange = (sortBy: string) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFilterChange({ ...filters, sortBy, sortOrder: newOrder });
  };
  
  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sector: e.target.value });
  };
  
  const handleShariahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, shariah: e.target.value as FilterState['shariah'] });
  };
  
  const clearAllFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      sortBy: 'market_cap',
      sortOrder: 'desc',
      sector: 'all',
      shariah: 'all',
      minMarketCap: null,
      maxMarketCap: null,
    });
  };
  
  const hasActiveFilters = 
    filters.search || 
    filters.sector !== 'all' || 
    filters.shariah !== 'all' ||
    filters.sortBy !== 'market_cap';
  
  return (
    <div className={`bg-canvas border-b border-stroke sticky top-12 z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-1.5">
        {/* Top row - Search and View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
          {/* Search */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search REITs by name or code..."
                value={localSearch}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-1 text-xs border border-stroke rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2.5 top-1.5 text-muted hover:text-ink"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              title="Table view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sector filter */}
          <select
            value={filters.sector}
            onChange={handleSectorChange}
            className="px-2 py-0.5 text-xs border border-stroke rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-canvas"
          >
            <option value="all">All Sectors</option>
            {availableSectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          
          {/* Shariah filter */}
          <select
            value={filters.shariah}
            onChange={handleShariahChange}
            className="px-2 py-0.5 text-xs border border-stroke rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-canvas"
          >
            <option value="all">All Types</option>
            <option value="yes">Shariah Compliant</option>
            <option value="no">Non-Shariah</option>
          </select>
          
          {/* Sort options */}
          <div className="flex items-center flex-wrap gap-0.5 bg-gray-100 rounded-md p-0.5">
            {[
              { key: 'market_cap', label: 'Market Cap' },
              { key: 'dpu', label: 'DPU' },
              { key: 'yield', label: 'Yield' },
              { key: 'gearing', label: 'Gearing' },
            ].map(sort => (
              <button
                key={sort.key}
                onClick={() => handleSortChange(sort.key)}
                className={`px-2 py-0.5 text-data rounded transition-colors flex items-center gap-0.5 ${
                  filters.sortBy === sort.key
                    ? 'bg-canvas text-blue-700 shadow-sm'
                    : 'text-muted hover:bg-gray-200'
                }`}
              >
                {sort.label}
                {filters.sortBy === sort.key && (
                  <svg 
                    className={`w-3 h-3 transition-transform ${filters.sortOrder === 'asc' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-data text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Selection count */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-muted">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-data text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          )}

          <span className="text-body-sm text-muted">
            {totalCount} REITs
          </span>
        </div>
      </div>
    </div>
  );
}
