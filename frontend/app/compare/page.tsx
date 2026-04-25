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
                <span className="text-micro font-semibold text-white">R</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-body-sm font-semibold leading-tight text-ink">REIT Comparison</h1>
                <nav className="text-micro leading-tight text-muted" aria-label="Breadcrumb">
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
                  className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium sm:flex ${
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

              <a href="/monitor" className="hidden text-label text-muted hover:text-ink sm:block">
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
        <div className="mb-4 rounded-[1.25rem] border border-stroke bg-gradient-to-br from-surface to-surfaceAlt/80 p-3 shadow-card sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-label text-muted">Compare Workspace</p>
              <h2 className="mt-1 text-metric text-ink">Fixed-width columns, faster scanning</h2>
              <p className="mt-1 max-w-2xl text-body-sm text-muted">
                The comparison grid stays compact on wide screens and turns into a clean horizontal scroll surface on smaller ones.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'portfolio', 'financial_performance', 'per_share', 'leverage', 'operational', 'market'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMetricCategory(cat)}
                  className={`rounded-full border px-2.5 py-1 text-label font-medium transition-colors ${
                    metricCategory === cat
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-stroke bg-surface text-muted hover:bg-surfaceAlt'
                  }`}
                  aria-pressed={metricCategory === cat}
                  aria-label={`Filter by ${cat === 'all' ? 'all categories' : cat.replace(/_/g, ' ')}`}
                >
                  {cat === 'all' ? 'All Metrics' : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-3 p-3 bg-danger-50 border border-danger-200 rounded-lg" role="alert">
            <p className="text-danger-700 text-body-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" aria-label="Loading" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="mb-4">
              <KpiGrid
                entities={data}
                category={metricCategory}
                onMetricClick={handleMetricClick}
                showEntityHeader
                stickyHeaderTopClassName="top-14"
              />
            </div>

            {/* Charts Toggle */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body-sm font-semibold text-ink">Charts & Risk Assessment</h3>
              <button
                onClick={() => setChartsVisible(!chartsVisible)}
                className="text-label text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
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
                    <h3 className="mb-2 text-body-sm font-semibold text-ink">DPU trend (5 years)</h3>
                    <div className="min-h-0 flex-1">
                      <DpuTrendChart entities={data} />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col rounded-lg border border-stroke bg-surface p-4 shadow-card">
                    <h3 className="mb-2 text-body-sm font-semibold text-ink">Quarterly revenue</h3>
                    <div className="min-h-0 flex-1">
                      <RevenueTrendChart entities={data} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-stroke bg-surface p-4 shadow-card">
                  <h3 className="mb-2 text-body-sm font-semibold text-ink">Risk assessment</h3>
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
