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

const entityColors = ['#2563eb', '#16a34a', '#ea580c']; // blue, green, orange

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

      {/* Header */}
      <header className="bg-surface border-b border-stroke sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-ink">REIT Comparison</h1>
                <nav className="text-xs text-muted" aria-label="Breadcrumb">
                  <a href="/" className="hover:text-ink">Home</a>
                  <span className="mx-1">/</span>
                  <a href="/monitor" className="hover:text-ink">Monitor</a>
                  <span className="mx-1">/</span>
                  <span className="text-ink">Compare</span>
                </nav>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Citation Coverage Badge */}
              {data.length > 0 && (
                <div 
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    coverageStats.coveragePercentage >= 100
                      ? 'bg-success-100 text-success-700'
                      : 'bg-warning-100 text-warning-700'
                  }`}
                  title={`${coverageStats.citedMetrics} of ${coverageStats.totalMetrics} metrics have citations`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {coverageStats.coveragePercentage >= 100 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                  <span>
                    {coverageStats.coveragePercentage.toFixed(0)}% cited
                    ({coverageStats.citedMetrics}/{coverageStats.totalMetrics})
                  </span>
                </div>
              )}
              
              <a
                href="/monitor"
                className="text-sm text-muted hover:text-ink hidden sm:block"
              >
                ← Back to Monitor
              </a>
              <EntitySelector
                availableEntities={AVAILABLE_ENTITIES}
                selectedEntities={selectedEntities}
                onToggle={toggleEntity}
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
              <div className="sticky top-14 z-40 bg-surface border-b border-stroke mb-3">
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${data.length}, minmax(120px, 1fr))` }}>
                  <div className="py-2 px-3 text-label text-sm font-medium text-muted">Metric</div>
                  {data.map((entityData, idx) => (
                    <div key={entityData.entity.id} className="py-2 px-3 border-l border-stroke">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entityColors[idx % entityColors.length] }} />
                        <span className="font-semibold text-sm text-ink truncate">{entityData.entity.name}</span>
                      </div>
                      <div className="text-xs text-muted truncate">{entityData.entity.code}</div>
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
              <div id="charts-section" className="space-y-3">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* DPU Trend */}
                  <div className="bg-surface rounded-lg shadow-card p-3">
                    <h3 className="text-sm font-semibold text-ink mb-2">DPU Trend (5-Year)</h3>
                    <DpuTrendChart entities={data} />
                  </div>

                  {/* Revenue Trend */}
                  <div className="bg-surface rounded-lg shadow-card p-3">
                    <h3 className="text-sm font-semibold text-ink mb-2">Quarterly Revenue</h3>
                    <RevenueTrendChart entities={data} />
                  </div>
                </div>

                {/* Risk Matrix */}
                <div className="bg-surface rounded-lg shadow-card p-3">
                  <h3 className="text-sm font-semibold text-ink mb-2">Risk Assessment</h3>
                  <RiskMatrix entities={data} onCitationClick={handleMetricClick} />
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
