'use client';

/**
 * Monitor Page - Main monitoring dashboard for Malaysian REITs
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useEntityData } from '@/hooks/useEntityData';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { FilterBar, FilterState } from '@/components/FilterBar';
import { EntityTable, ENTITY_TABLE_COLUMN_COUNT, SortField } from '@/components/EntityTable';
import { EntityCard, EntityCardSkeleton, FilterBottomSheet } from '@/components/EntityCard';
import { VirtualizedList } from '@/components/VirtualizedTable';
import { BenchmarkIndicator } from '@/components/BenchmarkIndicator';
import { CitationPanel } from '@/components/CitationPanel';
import type { MetricType, NormalizedReitData } from '@/types/frontend';

// Sort field mapping from FilterBar to EntityTable
const SORT_FIELD_MAP: Record<string, SortField> = {
  'market_cap': 'market_cap',
  'dpu': 'dpu',
  'yield': 'dividend_yield_market',
  'gearing': 'gearing_ratio'
};

type ViewMode = 'table' | 'cards';
type SortDirection = 'asc' | 'desc';

const ALL_ENTITY_CODES = [
  '5130.KL', '5106.KL', // Atrium, Axis (existing)
  '5176.KL', '5204.KL', '5227.KL', '5235.KL', // Sunway, Pavilion, IGB, KLCC
  '5180.KL', '5114.KL', '5121.KL', '5200.KL', // CMMT, Al-Salam, Hektar, UOA
];

const AVAILABLE_SECTORS = ['Retail', 'Office', 'Industrial', 'Healthcare', 'Mixed'];

export default function MonitorPage() {
  const { data: entities, isLoading, error } = useEntityData(ALL_ENTITY_CODES);
  const { benchmarks, getComparison } = useBenchmarkData(entities);
  const { announce, liveRegionProps } = useAnnouncer();
  
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'market_cap',
    sortOrder: 'desc',
    sector: 'all',
    shariah: 'all',
    minMarketCap: null,
    maxMarketCap: null,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'market_cap',
    direction: 'desc',
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync FilterBar sort controls to table sort state
  React.useEffect(() => {
    const newField = SORT_FIELD_MAP[filters.sortBy];
    if (newField) {
      setSort(prev => ({
        field: newField,
        direction: filters.sortOrder
      }));
    }
  }, [filters.sortBy, filters.sortOrder]);

  // Citation panel state
  const [citationOpen, setCitationOpen] = useState(false);
  const [selectedEntityForCitation, setSelectedEntityForCitation] = useState<string | null>(null);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  
  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = [...entities];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(e => 
        e.entity.name.toLowerCase().includes(searchLower) ||
        e.entity.code.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply shariah filter
    if (filters.shariah !== 'all') {
      result = result.filter(e => 
        filters.shariah === 'yes' ? e.entity.isShariahCompliant : !e.entity.isShariahCompliant
      );
    }
    
    // Apply sector filter
    if (filters.sector && filters.sector !== 'all') {
      result = result.filter(e => e.entity.sector === filters.sector);
    }
    
    return result;
  }, [entities, filters]);
  
  // Sort entities
  const sortedEntities = useMemo(() => {
    return [...filteredEntities].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      if (sort.field === 'name') {
        aVal = a.entity.name;
        bVal = b.entity.name;
      } else if (sort.field === 'code') {
        aVal = a.entity.code;
        bVal = b.entity.code;
      } else if (sort.field === 'citation_count') {
        // Handle citation count sorting
        aVal = a.metrics.reduce((acc, m) => acc + (m.sourceDisplayIds?.length || 0), 0);
        bVal = b.metrics.reduce((acc, m) => acc + (m.sourceDisplayIds?.length || 0), 0);
      } else {
        const aMetric = a.metrics.find(m => m.metricType === sort.field);
        const bMetric = b.metrics.find(m => m.metricType === sort.field);
        aVal = (aMetric?.value as number) ?? 0;
        bVal = (bMetric?.value as number) ?? 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sort.direction === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredEntities, sort]);
  
  // Handle sort
  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    announce(`Sorted by ${field} in ${sort.direction === 'desc' ? 'ascending' : 'descending'} order`, 'polite');
  };
  
  // Handle selection
  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id];
      
      announce(`${newSelection.length} REIT${newSelection.length !== 1 ? 's' : ''} selected`, 'polite');
      return newSelection;
    });
  };
  
  // Handle citation click from table
  const handleCitationClick = (entityId: string, citationIds: string[]) => {
    setSelectedEntityForCitation(entityId);
    setSelectedCitationIds(citationIds);
    setCitationOpen(true);
    
    const entity = entities.find(e => e.entity.id === entityId);
    announce(`Viewing ${citationIds.length} citations for ${entity?.entity.name || entityId}`, 'polite');
  };
  
  // Handle citation panel close
  const handleCloseCitation = () => {
    setCitationOpen(false);
    setSelectedEntityForCitation(null);
    setSelectedCitationIds([]);
    announce('Citation panel closed', 'polite');
  };
  
  // Get DPU history for sparklines
  const getDpuHistory = (entityId: string): number[] => {
    const entity = entities.find(e => e.entity.id === entityId);
    if (!entity) return [];
    const dpuSeries = entity.timeSeries.find(ts => ts.metricType === 'dpu');
    return dpuSeries?.dataPoints.map(dp => dp.value as number) || [];
  };
  
  // Build comparisons map
  const comparisonsMap = useMemo(() => {
    const map = new Map<string, Map<MetricType, ReturnType<typeof getComparison>>>();
    for (const entity of entities) {
      const entityMap = new Map();
      const metricTypes: MetricType[] = ['market_cap', 'dpu', 'dividend_yield_market', 'gearing_ratio', 'occupancy_rate'];
      for (const mt of metricTypes) {
        entityMap.set(mt, getComparison(entity.entity.id, mt));
      }
      map.set(entity.entity.id, entityMap);
    }
    return map;
  }, [entities, benchmarks, getComparison]);
  
  // Get comparison for entity
  const getEntityComparison = (entityId: string, metricType: MetricType) => {
    return comparisonsMap.get(entityId)?.get(metricType);
  };
  
  // Prepare citation data for the panel
  const citationEntities = useMemo(() => {
    if (!selectedEntityForCitation) return entities;
    return entities.filter(e => e.entity.id === selectedEntityForCitation);
  }, [entities, selectedEntityForCitation]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen reader announcements */}
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 min-h-12">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 shrink-0 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">M</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 leading-tight">Monitor</h1>
                <nav className="text-[11px] text-gray-500 leading-tight" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-gray-700">Home</Link>
                  <span className="mx-1">/</span>
                  <span className="text-gray-900">Monitor</span>
                </nav>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {selectedIds.length > 0 && (
                <Link
                  href={`/compare?entities=${selectedIds.map(id => {
                    const e = entities.find(en => en.entity.id === id);
                    return e?.entity.code || id;
                  }).join(',')}`}
                  className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Compare ({selectedIds.length})
                </Link>
              )}
              <Link
                href="/compare"
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
              >
                Comparison
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableSectors={AVAILABLE_SECTORS}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedIds.length}
        totalCount={filteredEntities.length}
        onClearSelection={() => {
          setSelectedIds([]);
          announce('Selection cleared', 'polite');
        }}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs text-gray-600">
          <span>
            Showing <strong className="text-gray-800">{sortedEntities.length}</strong> of <strong className="text-gray-800">{entities.length}</strong> REITs
          </span>
          <span className="text-gray-300" aria-hidden>|</span>
          <span>
            <strong className="text-gray-800">{ENTITY_TABLE_COLUMN_COUNT}</strong> columns
          </span>
          <span className="text-gray-300" aria-hidden>|</span>
          <span>
            <strong className="text-gray-800">{Object.keys(benchmarks).length}</strong> benchmark metrics
          </span>
        </div>
        
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <EntityCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Table View (Desktop) */}
            {viewMode === 'table' && (
              <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm">
                <EntityTable
                  data={sortedEntities}
                  comparisons={comparisonsMap}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  sort={sort}
                  onSort={handleSort}
                  dpuHistories={new Map(sortedEntities.map(e => [e.entity.id, getDpuHistory(e.entity.id)]))}
                  onCitationClick={handleCitationClick}
                />
              </div>
            )}
            
            {/* Card View (Mobile + Desktop) */}
            {(viewMode === 'cards' || typeof window !== 'undefined' && window.innerWidth < 1024) && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedEntities.map(entity => (
                  <EntityCard
                    key={entity.entity.id}
                    data={entity}
                    comparison={getEntityComparison(entity.entity.id, 'market_cap')}
                    isSelected={selectedIds.includes(entity.entity.id)}
                    onSelect={handleSelect}
                    dpuHistory={getDpuHistory(entity.entity.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Empty State */}
        {!isLoading && sortedEntities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No REITs match your filters.</p>
            <button
              onClick={() => setFilters({
                search: '',
                sortBy: 'market_cap',
                sortOrder: 'desc',
                sector: 'all',
                shariah: 'all',
                minMarketCap: null,
                maxMarketCap: null,
              })}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
      
      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={{ sector: filters.sector, shariah: filters.shariah }}
        availableSectors={AVAILABLE_SECTORS}
        onFilterChange={({ sector, shariah }) => setFilters(prev => ({ ...prev, sector, shariah }))}
      />

      {/* Citation Panel */}
      <CitationPanel
        isOpen={citationOpen}
        onClose={handleCloseCitation}
        citationIds={selectedCitationIds}
        entities={citationEntities}
      />
    </div>
  );
}
