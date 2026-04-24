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
import { MetricCard } from '../../components/MetricCard';
import { useAnnouncer } from '../../hooks/useAnnouncer';
import { analyzeCitationCoverage } from '../../lib/citation-utils';

export default function ComparePage() {
  const { selectedEntities, metricCategory, toggleEntity, setMetricCategory } = useUrlState();
  const { data, isLoading, error } = useEntityData(selectedEntities);
  const [citationOpen, setCitationOpen] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
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
    <div className="min-h-screen bg-neutral-50">
      {/* Screen reader announcements */}
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">REIT Comparison</h1>
                <nav className="text-xs text-neutral-500" aria-label="Breadcrumb">
                  <a href="/" className="hover:text-neutral-700">Home</a>
                  <span className="mx-1">/</span>
                  <a href="/monitor" className="hover:text-neutral-700">Monitor</a>
                  <span className="mx-1">/</span>
                  <span className="text-neutral-900">Compare</span>
                </nav>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Citation Coverage Badge */}
              {data.length > 0 && (
                <div 
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    coverageStats.coveragePercentage >= 100
                      ? 'bg-success-100 text-success-700'
                      : 'bg-warning-100 text-warning-700'
                  }`}
                  title={`${coverageStats.citedMetrics} of ${coverageStats.totalMetrics} metrics have citations`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="text-sm text-neutral-600 hover:text-neutral-900 hidden sm:block"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'portfolio', 'financial_performance', 'per_share', 'leverage', 'operational', 'market'].map((cat) => (
              <button
                key={cat}
                onClick={() => setMetricCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  metricCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-label="Loading" />
          </div>
        ) : (
          <>
            {/* Entity Headers */}
            <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
              {data.map((entityData) => (
                <div key={entityData.entity.id} className="bg-white rounded-xl shadow-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">{entityData.entity.name}</h2>
                      <p className="text-sm text-neutral-500 mt-1">{entityData.entity.code}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-neutral-100 rounded text-neutral-600">
                          {entityData.entity.exchange}
                        </span>
                        {entityData.entity.isShariahCompliant && (
                          <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded">
                            Shariah
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KPI Grid */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Key Metrics</h3>
              <KpiGrid
                entities={data}
                category={metricCategory}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* DPU Trend */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">DPU Trend (5-Year)</h3>
                <DpuTrendChart entities={data} />
              </div>

              {/* Revenue Trend */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quarterly Revenue</h3>
                <RevenueTrendChart entities={data} />
              </div>
            </div>

            {/* Risk Matrix */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Risk Assessment</h3>
              <RiskMatrix entities={data} onCitationClick={handleMetricClick} />
            </div>
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
