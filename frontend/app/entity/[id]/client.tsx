'use client';

import { useRouter } from 'next/navigation';
import { useEntityData, AVAILABLE_ENTITIES } from '../../../hooks/useEntityData';
import { KpiGrid } from '../../../components/KpiGrid';
import { DpuTrendChart } from '../../../components/DpuTrendChart';
import { RiskMatrix } from '../../../components/RiskMatrix';
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
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-label="Loading" />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger-600 mb-4">{error || 'Entity not found'}</p>
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

  const cardShell =
    'rounded-lg border border-stroke bg-surface p-4 shadow-card';
  const cardTitle = 'text-body-sm font-semibold text-ink mb-2';
  const metricLabel = 'text-label text-muted mb-1';
  const metricValue = 'text-metric-sm text-ink';
  const metricSub = 'text-label text-muted mt-2';

  return (
    <div className="min-h-screen bg-canvas">
      {/* Screen reader announcements */}
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      {/* Header */}
      <header className="bg-surface border-b border-stroke sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 h-12 min-h-12">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => router.push('/compare')}
                className="text-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-0.5 shrink-0"
                aria-label="Go back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0 flex flex-col justify-center sm:flex-row sm:items-baseline sm:gap-1.5">
                <h1 className="text-body-sm font-semibold text-ink truncate leading-tight">{entity.entity.name}</h1>
                <span className="text-micro text-muted font-mono leading-tight">{entity.entity.code}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-micro px-1.5 py-0.5 bg-surfaceAlt rounded text-muted">
                {entity.entity.exchange}
              </span>
              {entity.entity.isShariahCompliant && (
                <span
                  className="text-micro px-1.5 py-0.5 bg-success-100 text-success-700 rounded"
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
        <div className={cardShell + ' mb-4'}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label text-muted">Filter sources by type:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-full text-label font-medium transition-colors ${
                  activeCitationFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-surfaceAlt text-muted hover:bg-surface'
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
                    className={`px-3 py-1.5 rounded-full text-label font-medium transition-colors ${
                      activeCitationFilter === type
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-surfaceAlt text-muted hover:bg-surface'
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
            <span className="text-label text-muted ml-auto">
              {filteredCitationIds.length} source{filteredCitationIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          <div className={cardShell + ' flex min-h-0 flex-col justify-between'}>
            <div>
              <p className={metricLabel}>Portfolio Size</p>
              <p className={metricValue}>
                {entity.metrics.find(m => m.metricType === 'property_count')?.value || 'N/A'}
                <span className="ml-1 text-label font-normal text-muted">properties</span>
              </p>
            </div>
            <p className={metricSub}>
              RM {((entity.metrics.find(m => m.metricType === 'total_assets')?.value as number) / 1e6).toFixed(1)}M
              AUM
            </p>
          </div>

          <div className={cardShell + ' flex min-h-0 flex-col justify-between'}>
            <div>
              <p className={metricLabel}>Distribution per unit</p>
              <p className={metricValue}>
                {entity.metrics.find(m => m.metricType === 'dpu')?.value || 'N/A'}
                <span className="ml-1 text-label font-normal text-muted">sen</span>
              </p>
            </div>
            <p className={metricSub}>
              Yield: {(() => {
                const val = entity.metrics.find(m => m.metricType === 'dividend_yield_market')?.value;
                return (val == null || typeof val !== 'number') ? 'N/A' : formatPercentage(val / 100);
              })()}
            </p>
          </div>

          <div className={cardShell + ' flex min-h-0 flex-col justify-between'}>
            <div>
              <p className={metricLabel}>Gearing ratio</p>
              <p className={metricValue}>
                {formatPercentage(
                  (entity.metrics.find(m => m.metricType === 'gearing_ratio')?.value as number) / 100,
                )}
              </p>
            </div>
            <p className={metricSub}>
              IC: {entity.metrics.find(m => m.metricType === 'interest_coverage')?.value || 'N/A'}×
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className={cardShell + ' flex min-h-0 flex-col'}>
            <h3 className={cardTitle}>DPU trend (5 years)</h3>
            <div className="min-h-0 flex-1">
              <DpuTrendChart entities={data} />
            </div>
          </div>

          <div className={cardShell + ' flex min-h-0 flex-col'}>
            <h3 className={cardTitle}>Risk profile</h3>
            <div className="min-h-0 flex-1">
              <RiskMatrix entities={data} onCitationClick={handleMetricClick} embedInPanel />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-body-sm font-semibold text-ink">All metrics</h3>
          <KpiGrid entities={data} category="all" onMetricClick={handleMetricClick} />
        </div>

        <div className={cardShell + ' mb-6'}>
          <h3 className={cardTitle}>Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-body-sm text-muted">REIT Manager</p>
              <p className="font-medium text-ink">{entity.entity.manager.name}</p>
            </div>
            <div>
              <p className="text-body-sm text-muted">Trustee</p>
              <p className="font-medium text-ink">{entity.entity.trustee}</p>
            </div>
            {entity.entity.manager.ownershipStructure && (
              <div>
                <p className="text-body-sm text-muted">Ownership Structure</p>
                <p className="font-medium text-ink">{entity.entity.manager.ownershipStructure}</p>
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
