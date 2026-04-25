'use client';

import { useRouter } from 'next/navigation';
import { useEntityData, AVAILABLE_ENTITIES } from '../../../hooks/useEntityData';
import { KpiGrid } from '../../../components/KpiGrid';
import { DpuTrendChart } from '../../../components/DpuTrendChart';
import { RiskMatrix } from '../../../components/RiskMatrix';
import { MetricCard } from '../../../components/MetricCard';
import { CitationPanel } from '../../../components/CitationPanel';
import { useAnnouncer } from '../../../hooks/useAnnouncer';
import { useState, useMemo } from 'react';
import { groupReferencesBySource, type SourceGroupType } from '../../../lib/citation-utils';
import { formatPercentage } from '../../../lib/formatters';

interface EntityDetailClientProps {
  entityId: string;
}

export default function EntityDetailClient({ entityId }: EntityDetailClientProps) {
  const router = useRouter();
  
  const { data, isLoading, error } = useEntityData([entityId]);
  const [citationOpen, setCitationOpen] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  const [activeCitationFilter, setActiveCitationFilter] = useState<SourceGroupType | 'all'>('all');
  const { announce, liveRegionProps } = useAnnouncer();

  const entity = data[0];

  // Get all citations grouped by source
  const groupedCitations = useMemo(() => {
    if (!entity) return new Map<SourceGroupType, string[]>();
    
    const allReferences = entity.references;
    const groups = groupReferencesBySource(allReferences);
    
    // Convert to citation IDs
    const citationGroups = new Map<SourceGroupType, string[]>();
    groups.forEach((refs, type) => {
      citationGroups.set(type, refs.map(r => r.displayId));
    });
    
    return citationGroups;
  }, [entity]);

  // Filtered citations based on active filter
  const filteredCitationIds = useMemo(() => {
    if (activeCitationFilter === 'all') {
      return Array.from(new Set(
        Array.from(groupedCitations.values()).flat()
      ));
    }
    return groupedCitations.get(activeCitationFilter) || [];
  }, [groupedCitations, activeCitationFilter]);

  const handleMetricClick = (citationIds: string[]) => {
    setSelectedCitationIds(citationIds);
    setCitationOpen(true);
    announce(`Citation panel opened with ${citationIds.length} sources`, 'polite');
  };

  const handleCloseCitation = () => {
    setCitationOpen(false);
    setSelectedCitationIds([]);
    announce('Citation panel closed', 'polite');
  };

  // Handle source filter change
  const handleFilterChange = (filter: SourceGroupType | 'all') => {
    setActiveCitationFilter(filter);
    const label = filter === 'all' ? 'all sources' : filter;
    announce(`Filtering citations by ${label}`, 'polite');
    
    // Update visible citations
    const newIds = filter === 'all' 
      ? Array.from(new Set(Array.from(groupedCitations.values()).flat()))
      : (groupedCitations.get(filter) || []);
    setSelectedCitationIds(newIds);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-label="Loading" />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Entity not found'}</p>
          <button
            onClick={() => router.push('/compare')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Screen reader announcements */}
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 h-12 min-h-12">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => router.push('/compare')}
                className="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-0.5 shrink-0"
                aria-label="Go back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0 flex flex-col justify-center sm:flex-row sm:items-baseline sm:gap-1.5">
                <h1 className="text-sm font-semibold text-neutral-900 truncate leading-tight">{entity.entity.name}</h1>
                <span className="text-[11px] text-neutral-500 font-mono leading-tight">{entity.entity.code}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                {entity.entity.exchange}
              </span>
              {entity.entity.isShariahCompliant && (
                <span
                  className="text-[10px] px-1.5 py-0.5 bg-success-100 text-success-700 rounded"
                  title="Shariah compliant"
                >
                  Shariah
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5">
        {/* Citation Filter Bar */}
        <div className="mb-4 bg-white rounded-lg shadow-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-600">Filter sources by type:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCitationFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                aria-pressed={activeCitationFilter === 'all'}
              >
                All Sources
              </button>
              {(['AR2025', 'Q42025', 'KLSE', 'OTHER'] as SourceGroupType[]).map(type => {
                const count = groupedCitations.get(type)?.length || 0;
                if (count === 0) return null;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeCitationFilter === type
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    aria-pressed={activeCitationFilter === type}
                    aria-label={`Filter by ${type} (${count} sources)`}
                  >
                    {type === 'AR2025' ? 'Annual Report 2025' : 
                     type === 'Q42025' ? 'Q4 2025' : 
                     type === 'KLSE' ? 'Bursa Malaysia' : 'Other'} ({count})
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-neutral-500 ml-auto">
              {filteredCitationIds.length} source{filteredCitationIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Portfolio Size */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <p className="text-sm text-neutral-500 mb-1">Portfolio Size</p>
            <p className="text-2xl font-bold text-neutral-900">
              {entity.metrics.find(m => m.metricType === 'property_count')?.value || 'N/A'} 
              <span className="text-sm font-normal text-neutral-500 ml-1">properties</span>
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              RM {(entity.metrics.find(m => m.metricType === 'total_assets')?.value as number / 1e6).toFixed(1)}M AUM
            </p>
          </div>

          {/* DPU */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <p className="text-sm text-neutral-500 mb-1">Distribution Per Unit</p>
            <p className="text-2xl font-bold text-neutral-900">
              {entity.metrics.find(m => m.metricType === 'dpu')?.value || 'N/A'}
              <span className="text-sm font-normal text-neutral-500 ml-1">sen</span>
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Yield: {formatPercentage((entity.metrics.find(m => m.metricType === 'dividend_yield_market')?.value as number) / 100)}
            </p>
          </div>

          {/* Gearing */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <p className="text-sm text-neutral-500 mb-1">Gearing Ratio</p>
            <p className="text-2xl font-bold text-neutral-900">
              {formatPercentage((entity.metrics.find(m => m.metricType === 'gearing_ratio')?.value as number) / 100)}
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              IC: {entity.metrics.find(m => m.metricType === 'interest_coverage')?.value || 'N/A'}x
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">DPU Trend</h3>
            <DpuTrendChart entities={data} />
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Risk Profile</h3>
            <RiskMatrix entities={data} onCitationClick={handleMetricClick} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">All Metrics</h3>
          <KpiGrid entities={data} category="all" onMetricClick={handleMetricClick} />
        </div>

        {/* Management Info */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500">REIT Manager</p>
              <p className="font-medium text-neutral-900">{entity.entity.manager.name}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Trustee</p>
              <p className="font-medium text-neutral-900">{entity.entity.trustee}</p>
            </div>
            {entity.entity.manager.ownershipStructure && (
              <div>
                <p className="text-sm text-neutral-500">Ownership Structure</p>
                <p className="font-medium text-neutral-900">{entity.entity.manager.ownershipStructure}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Citation Panel */}
      <CitationPanel
        isOpen={citationOpen}
        onClose={handleCloseCitation}
        citationIds={selectedCitationIds.length > 0 ? selectedCitationIds : filteredCitationIds}
        entities={data}
      />
    </div>
  );
}
