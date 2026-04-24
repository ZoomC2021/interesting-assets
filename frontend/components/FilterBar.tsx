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
    <div className={`bg-white border-b border-gray-200 sticky top-0 z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top row - Search and View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search REITs by name or code..."
                value={localSearch}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Table view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Card view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="yes">Shariah Compliant</option>
            <option value="no">Non-Shariah</option>
          </select>
          
          {/* Sort options */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'market_cap', label: 'Market Cap' },
              { key: 'dpu', label: 'DPU' },
              { key: 'yield', label: 'Yield' },
              { key: 'gearing', label: 'Gearing' },
            ].map(sort => (
              <button
                key={sort.key}
                onClick={() => handleSortChange(sort.key)}
                className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  filters.sortBy === sort.key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
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
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          )}
          
          {/* Results count */}
          <span className="text-sm text-gray-500">
            {totalCount} REITs
          </span>
        </div>
      </div>
    </div>
  );
}
