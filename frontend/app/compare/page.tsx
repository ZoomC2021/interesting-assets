'use client';

import { useState } from 'react';
import { useUrlState } from '../../hooks/useUrlState';
import { useEntityData, AVAILABLE_ENTITIES } from '../../hooks/useEntityData';
import { EntitySelector } from '../../components/EntitySelector';
import { KpiGrid } from '../../components/KpiGrid';
import { DpuTrendChart } from '../../components/DpuTrendChart';
import { RevenueTrendChart } from '../../components/RevenueTrendChart';
import { RiskMatrix } from '../../components/RiskMatrix';
import { CitationPanel } from '../../components/CitationPanel';
import { useAnnouncer } from '../../hooks/useAnnouncer';
import { analyzeCitationCoverage } from '../../lib/citation-utils';
import { entityColors } from '../../lib/grid-utils';

export default function ComparePage() {
  const { selectedEntities, metricCategory, toggleEntity, setMetricCategory } = useUrlState();
  const { data, isLoading, error } = useEntityData(selectedEntities);
  const [citationOpen, setCitationOpen] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  const [chartsVisible, setChartsVisible] = useState(true);
  const { announce, liveRegionProps } = useAnnouncer();

  // Calculate citation coverage
  const coverageStats = analyzeCitationCoverage(data);

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

  return (
    <div className="min-h-screen bg-canvas">
      {/* Screen reader announcements */}
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      {/* Header: row 1 = title + actions; row 2 = REIT pickers (full width) */}
      <header className="bg-surface border-b border-stroke sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 min-h-12 gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600">
                <span className="text-[10px] font-bold text-white">R</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold leading-tight text-ink">REIT Comparison</h1>
                <nav className="text-[11px] leading-tight text-muted" aria-label="Breadcrumb">
                  <a href="/" className="hover:text-ink">Home</a>
                  <span className="mx-1">/</span>
                  <a href="/monitor" className="hover:text-ink">Monitor</a>
                  <span className="mx-1">/</span>
                  <span className="text-ink">Compare</span>
                </nav>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {data.length > 0 && (
                <div
                  className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium sm:flex ${
                    coverageStats.coveragePercentage >= 100
                      ? 'bg-success-100 text-success-700'
                      : 'bg-warning-100 text-warning-700'
                  }`}
                  title={`${coverageStats.citedMetrics} of ${coverageStats.totalMetrics} metrics have citations`}
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {coverageStats.coveragePercentage >= 100 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                  <span>
                    {coverageStats.coveragePercentage.toFixed(0)}% cited ({coverageStats.citedMetrics}/
                    {coverageStats.totalMetrics})
                  </span>
                </div>
              )}

              <a href="/monitor" className="hidden text-xs text-muted hover:text-ink sm:block">
                ← Monitor
              </a>
            </div>
          </div>

          <div className="border-t border-stroke bg-surfaceAlt/80 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
              <p id="compare-reit-label" className="m-0 text-label shrink-0 sm:pt-1.5">
                REITs
              </p>
              <EntitySelector
                availableEntities={AVAILABLE_ENTITIES}
                selectedEntities={selectedEntities}
                onToggle={toggleEntity}
                labelledBy="compare-reit-label"
                className="min-w-0 w-full sm:flex-1 sm:justify-start"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Category Filter */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {['all', 'portfolio', 'financial_performance', 'per_share', 'leverage', 'operational', 'market'].map((cat) => (
              <button
                key={cat}
                onClick={() => setMetricCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  metricCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface text-muted hover:bg-surface-alt border border-stroke'
                }`}
                aria-pressed={metricCategory === cat}
                aria-label={`Filter by ${cat === 'all' ? 'all categories' : cat.replace(/_/g, ' ')}`}
              >
                {cat === 'all' ? 'All Metrics' : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" aria-label="Loading" />
          </div>
        ) : (
          <>
            {/* Sticky Entity Header */}
            {data.length > 0 && (
              <div className="sticky top-40 z-40 border-b border-stroke bg-surface mb-3">
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${data.length}, minmax(120px, 1fr))` }}>
                  <div className="py-2 px-3 text-label font-medium text-muted">Metric</div>
                  {data.map((entityData, idx) => (
                    <div key={entityData.entity.id} className="py-2 px-3 border-l border-stroke text-[12.5px] leading-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entityColors[idx % entityColors.length] }} />
                        <span className="font-semibold text-ink truncate">{entityData.entity.name}</span>
                      </div>
                      <div className="text-[11px] text-muted truncate">{entityData.entity.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Grid */}
            <div className="mb-4">
              <KpiGrid
                entities={data}
                category={metricCategory}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Charts Toggle */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Charts & Risk Assessment</h3>
              <button
                onClick={() => setChartsVisible(!chartsVisible)}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                aria-expanded={chartsVisible}
                aria-controls="charts-section"
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${chartsVisible ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {chartsVisible ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Charts Section */}
            {chartsVisible && (
              <div id="charts-section" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex min-h-0 flex-col rounded-lg border border-stroke bg-surface p-4 shadow-card">
                    <h3 className="mb-2 text-sm font-semibold text-ink">DPU trend (5 years)</h3>
                    <div className="min-h-0 flex-1">
                      <DpuTrendChart entities={data} />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col rounded-lg border border-stroke bg-surface p-4 shadow-card">
                    <h3 className="mb-2 text-sm font-semibold text-ink">Quarterly revenue</h3>
                    <div className="min-h-0 flex-1">
                      <RevenueTrendChart entities={data} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-stroke bg-surface p-4 shadow-card">
                  <h3 className="mb-2 text-sm font-semibold text-ink">Risk assessment</h3>
                  <RiskMatrix entities={data} onCitationClick={handleMetricClick} embedInPanel />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Citation Panel */}
      <CitationPanel
        isOpen={citationOpen}
        onClose={handleCloseCitation}
        citationIds={selectedCitationIds}
        entities={data}
      />
    </div>
  );
}
