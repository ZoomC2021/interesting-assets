'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetricType } from '@/types/frontend';
import {
  adaptReitsData,
  getDefaultEntityCodes,
  getReitMetricSourceIds,
  normalizeEntityCodes,
  REIT,
} from '@/data/reits';
import { useEntityData } from '@/hooks/useEntityData';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { CitationPanel } from '../CitationPanel';
import { RiskChip } from '../RiskChip';
import { Sparkline } from '../Sparkline';
import { AddReitModal } from '../AddReitModal';
import { ArrowLeft, Info, Settings2, X, Eye, EyeOff, Check, Plus } from '../icons';

const CATEGORIES = ['All', 'Portfolio', 'Financial', 'Per-Share', 'Leverage', 'Operational', 'Risk', 'Market'];

interface CompareMetric {
  id: 'mcap' | 'price' | 'dpu' | 'yield' | 'gearing' | 'icr' | 'occ' | 'wale' | 'pb';
  name: string;
  unit: string;
  category: string;
  format: 'number' | 'percent';
  sourceMetricType: MetricType;
  invertBest?: boolean;
  sourceOptions?: {
    excludeUnitIncludes?: string[];
  };
}

const metrics: CompareMetric[] = [
  { id: 'mcap', name: 'Market Cap', unit: 'RM M', category: 'Market', format: 'number', sourceMetricType: 'market_cap' },
  { id: 'price', name: 'Share Price', unit: 'RM', category: 'Market', format: 'number', sourceMetricType: 'share_price' },
  { id: 'dpu', name: 'DPU', unit: 'sen', category: 'Per-Share', format: 'number', sourceMetricType: 'dpu' },
  { id: 'yield', name: 'Yield', unit: '%', category: 'Financial', format: 'percent', sourceMetricType: 'dividend_yield_market' },
  {
    id: 'gearing',
    name: 'Gearing',
    unit: '%',
    category: 'Leverage',
    format: 'percent',
    invertBest: true,
    sourceMetricType: 'gearing_ratio',
    sourceOptions: { excludeUnitIncludes: ['unencumbered'] },
  },
  { id: 'icr', name: 'Interest Cover', unit: 'x', category: 'Leverage', format: 'number', sourceMetricType: 'interest_coverage' },
  { id: 'occ', name: 'Occupancy', unit: '%', category: 'Operational', format: 'percent', sourceMetricType: 'occupancy_rate' },
  { id: 'wale', name: 'WALE', unit: 'yrs', category: 'Operational', format: 'number', sourceMetricType: 'wale_years' },
  { id: 'pb', name: 'Price/Book', unit: 'x', category: 'Market', format: 'number', invertBest: true, sourceMetricType: 'price_to_book' },
];

type MetricId = CompareMetric['id'];
const EMPTY_INITIAL_IDS: string[] = [];

interface ComparePageProps {
  initialIds?: string[];
}

// All metrics are visible by default
const DEFAULT_VISIBLE_METRICS: MetricId[] = ['mcap', 'price', 'dpu', 'yield', 'gearing', 'icr', 'occ', 'wale', 'pb'];
const STORAGE_KEY = 'reit-compare-visible-metrics';

export function ComparePage({ initialIds = EMPTY_INITIAL_IDS }: ComparePageProps) {
  const initialIdsKey = initialIds.join('|');
  const seedIds = useMemo(() => {
    const normalizedInitialIds = normalizeEntityCodes(initialIds);
    return normalizedInitialIds.length > 0 ? normalizedInitialIds : getDefaultEntityCodes();
  }, [initialIdsKey]);
  const seedIdsKey = seedIds.join('|');

  const [selectedIds, setSelectedIds] = useState<string[]>(seedIds);
  const [activeCategory, setActiveCategory] = useState('All');
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isAddReitOpen, setIsAddReitOpen] = useState(false);
  const [visibleMetricIds, setVisibleMetricIds] = useState<MetricId[]>(DEFAULT_VISIBLE_METRICS);
  const { data: entityData, isLoading, error } = useEntityData(selectedIds);

  // Load visible metrics from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as MetricId[];
          // Validate that saved metrics are valid
          const validMetrics = parsed.filter((id) => metrics.some((m) => m.id === id));
          if (validMetrics.length > 0) {
            setVisibleMetricIds(validMetrics);
          }
        }
      } catch {
        // Ignore localStorage errors, use defaults
      }
    }
  }, []);

  // Save visible metrics to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleMetricIds));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [visibleMetricIds]);

  useEffect(() => {
    setSelectedIds((current) => (current.join('|') === seedIdsKey ? current : seedIds));
  }, [seedIds, seedIdsKey]);

  const loadedReits = useMemo(() => adaptReitsData(entityData), [entityData]);

  const selectedReits = useMemo(
    () => {
      const reitsByTicker = new Map(loadedReits.map((reit) => [reit.ticker, reit]));
      return selectedIds
        .map((ticker) => reitsByTicker.get(ticker))
        .filter((reit): reit is REIT => Boolean(reit));
    },
    [loadedReits, selectedIds],
  );

  const compareCitations = useMemo(() => {
    const seen = new Set<string>();

    return selectedReits.flatMap((reit) =>
      reit.citations.filter((citation) => {
        if (seen.has(citation.id)) {
          return false;
        }

        seen.add(citation.id);
        return true;
      }),
    );
  }, [selectedReits]);

  const getMetricValue = (reit: REIT, metricId: MetricId) => {
    switch (metricId) {
      case 'mcap':
        return reit.marketCap;
      case 'price':
        return reit.sharePrice;
      case 'dpu':
        return reit.dpu;
      case 'yield':
        return reit.yield;
      case 'gearing':
        return reit.gearing;
      case 'icr':
        return reit.interestCover;
      case 'occ':
        return reit.occupancy;
      case 'wale':
        return reit.wale;
      case 'pb':
        return reit.priceToBook;
      default:
        return 0;
    }
  };

  const getMetricCitationCount = (metric: CompareMetric) => {
    return new Set(
      selectedReits.flatMap((reit) => getReitMetricSourceIds(reit, metric.sourceMetricType, metric.sourceOptions)),
    ).size;
  };

  const formatValue = (value: number, format: string) => {
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    if (value > 100) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  };

  const getBestWorst = (metricId: MetricId, invertBest = false) => {
    const values = selectedReits.map((reit) => getMetricValue(reit, metricId));
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      best: invertBest ? min : max,
      worst: invertBest ? max : min,
    };
  };

  // Toggle metric visibility
  const toggleMetricVisibility = useCallback((metricId: MetricId) => {
    setVisibleMetricIds((current) => {
      if (current.includes(metricId)) {
        // Don't allow hiding all metrics
        if (current.length <= 1) return current;
        return current.filter((id) => id !== metricId);
      }
      return [...current, metricId];
    });
  }, []);

  // Show all metrics
  const showAllMetrics = useCallback(() => {
    setVisibleMetricIds(DEFAULT_VISIBLE_METRICS);
  }, []);

  // Hide all metrics (except keep at least one)
  const hideAllMetrics = useCallback(() => {
    setVisibleMetricIds([metrics[0].id]);
  }, []);

  // Handle adding a REIT to comparison with 6-REIT limit enforcement
  const handleAddReit = useCallback((entityCode: string) => {
    setSelectedIds((current) => {
      // Don't add if already exists
      if (current.includes(entityCode)) {
        return current;
      }
      // Don't exceed 6-REIT limit
      if (current.length >= 6) {
        return current;
      }
      return [...current, entityCode];
    });
  }, []);

  // Filter metrics by category and visibility
  const filteredMetrics = useMemo(() => {
    let filtered = metrics.filter((metric) => visibleMetricIds.includes(metric.id));
    if (activeCategory !== 'All') {
      filtered = filtered.filter((metric) => metric.category === activeCategory);
    }
    return filtered;
  }, [activeCategory, visibleMetricIds]);

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <div className="sticky top-12 z-30 border-b border-stroke bg-surface/95 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-stroke px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-ink-muted transition-colors hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-semibold text-ink">Compare Workspace</h1>
            <span className="rounded-sm border border-stroke bg-surface-alt px-2 py-0.5 font-data text-xs text-ink-muted">
              {selectedReits.length} REITs
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            className="flex items-center gap-1.5 rounded-sm border border-stroke bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            aria-label="Customize visible metrics"
            aria-expanded={isCustomizeOpen}
            aria-haspopup="dialog"
          >
            <Settings2 className="h-4 w-4" />
            Customize View
            <span className="ml-1 rounded-sm bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
              {visibleMetricIds.length}
            </span>
          </button>
        </div>

        <div className="no-scrollbar flex items-center gap-4 overflow-x-auto px-4 py-3 md:px-6">
          <div className="w-[140px] shrink-0 text-sm font-medium uppercase tracking-wider text-ink-muted md:w-[240px]">
            Entities
          </div>
          {selectedReits.map((reit) => (
            <div
              key={reit.id}
              className="group flex min-w-[160px] max-w-[240px] flex-1 items-center justify-between rounded-sm border border-stroke bg-surface-alt px-3 py-2"
            >
              <div>
                <Link href={`/entity/${reit.ticker}`} className="truncate text-sm font-semibold text-ink">
                  {reit.ticker.split('.')[0]}
                </Link>
                <div className="truncate text-xs text-ink-muted">{reit.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIds((current) => current.filter((id) => id !== reit.ticker))}
                className="opacity-0 transition-all group-hover:opacity-100 hover:text-danger"
                aria-label={`Remove ${reit.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add REIT button - shown when less than 6 REITs */}
          {selectedReits.length < 6 && (
            <button
              type="button"
              onClick={() => setIsAddReitOpen(true)}
              className="flex min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-sm border border-stroke bg-surface px-4 py-2 text-sm text-ink-muted transition-all hover:border-accent hover:text-accent"
              aria-label="Add REIT to comparison"
            >
              <Plus className="h-4 w-4" />
              Add REIT
            </button>
          )}
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto bg-surface-alt/50 px-4 py-2 md:px-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-ink text-surface shadow-sm'
                  : 'border border-transparent text-ink-muted hover:border-stroke hover:bg-surface-alt hover:text-ink'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1440px] px-4 md:px-6">
        {isLoading && selectedReits.length === 0 ? (
          <div className="rounded-sm border border-stroke bg-surface p-8 text-center text-ink-muted">
            Loading comparison data...
          </div>
        ) : selectedReits.length === 0 ? (
          <div className="rounded-sm border border-stroke bg-surface p-8 text-center text-ink-muted">
            No REITs selected. Go back to Monitor to build a comparison set.
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 rounded-sm border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="mb-12 overflow-auto rounded-sm border border-stroke bg-surface">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <tbody className="divide-y divide-stroke">
                  {filteredMetrics.map((metric) => {
                    const { best, worst } = getBestWorst(metric.id, metric.invertBest);
                    return (
                      <tr key={metric.id} className="group transition-colors hover:bg-surface-alt/30">
                        <td className="w-[220px] border-r border-stroke bg-surface px-4 py-3 md:w-[240px]">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-ink">{metric.name}</span>
                              <Info className="h-3.5 w-3.5 cursor-help text-ink-faint" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-ink-muted">{metric.unit}</span>
                              <button
                                type="button"
                                onClick={() => setCitationPanelOpen(true)}
                                className="cursor-pointer rounded-sm border border-stroke bg-surface-alt px-1 font-data text-[10px] text-ink-muted transition-colors hover:border-accent hover:text-accent"
                              >
                                {getMetricCitationCount(metric)}
                              </button>
                            </div>
                          </div>
                        </td>

                        {selectedReits.map((reit) => {
                          const value = getMetricValue(reit, metric.id);
                          const isBest = value === best;
                          const isWorst = value === worst;

                          return (
                            <td
                              key={`${metric.id}-${reit.id}`}
                              className={`min-w-[160px] border-r border-stroke px-4 py-3 text-right font-data text-sm last:border-r-0 ${
                                isBest
                                  ? 'bg-highlight/30 font-medium text-ink'
                                  : isWorst
                                    ? 'text-ink-muted'
                                    : 'text-ink'
                              }`}
                            >
                              {formatValue(value, metric.format)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mb-12">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-muted">Trend Analysis</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-sm border border-stroke bg-surface p-4">
                  <div className="mb-4 text-sm font-medium text-ink">5Y DPU Trend (sen)</div>
                  <div className="flex h-40 items-end justify-between gap-3">
                    {selectedReits.map((reit, index) => (
                      <div key={reit.id} className="relative flex h-full flex-1 flex-col items-center justify-end">
                        <Sparkline
                          data={reit.dpuHistory}
                          width={80}
                          height={100}
                          className="w-full"
                          style={{ opacity: Math.max(0.35, 1 - index * 0.18) }}
                        />
                        <div className="mt-2 w-full truncate text-center font-data text-[10px] text-ink-muted">
                          {reit.ticker.split('.')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-sm border border-stroke bg-surface p-4">
                  <div className="mb-4 text-sm font-medium text-ink">Yield vs Gearing</div>
                  <div className="relative h-40 border-b border-l border-stroke">
                    {selectedReits.map((reit) => (
                      <div
                        key={reit.id}
                        className="group absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full border-2 border-surface bg-accent"
                        style={{
                          left: `${((reit.gearing - 18) / 32) * 100}%`,
                          bottom: `${((reit.yield - 4) / 5) * 100}%`,
                        }}
                      >
                        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-1.5 py-0.5 text-[10px] text-surface opacity-0 transition-opacity group-hover:opacity-100">
                          {reit.ticker.split('.')[0]}
                        </div>
                      </div>
                    ))}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-ink-muted">
                      Gearing %
                    </div>
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-wider text-ink-muted">
                      Yield %
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-stroke bg-surface p-4">
                  <div className="mb-4 text-sm font-medium text-ink">Overall Risk Profile</div>
                  <div className="mt-6 space-y-3">
                    {selectedReits.map((reit) => (
                      <div key={reit.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">{reit.ticker.split('.')[0]}</span>
                        <RiskChip level={reit.overallRisk} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <CitationPanel
        isOpen={citationPanelOpen}
        onClose={() => setCitationPanelOpen(false)}
        citations={compareCitations}
      />

      <CustomizePanel
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        metrics={metrics}
        visibleMetricIds={visibleMetricIds}
        onToggleMetric={toggleMetricVisibility}
        onShowAll={showAllMetrics}
        onHideAll={hideAllMetrics}
      />

      <AddReitModal
        isOpen={isAddReitOpen}
        onClose={() => setIsAddReitOpen(false)}
        selectedIds={selectedIds}
        onAdd={handleAddReit}
      />
    </div>
  );
}

// =============================================================================
// CustomizePanel Component
// =============================================================================

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CompareMetric[];
  visibleMetricIds: MetricId[];
  onToggleMetric: (metricId: MetricId) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

function CustomizePanel({
  isOpen,
  onClose,
  metrics,
  visibleMetricIds,
  onToggleMetric,
  onShowAll,
  onHideAll,
}: CustomizePanelProps) {
  const { announce, liveRegionProps } = useAnnouncer();
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusOnDeactivate: true,
  });

  // Group metrics by category
  const metricsByCategory = useMemo(() => {
    const grouped = new Map<string, CompareMetric[]>();
    for (const metric of metrics) {
      const list = grouped.get(metric.category) ?? [];
      list.push(metric);
      grouped.set(metric.category, list);
    }
    return grouped;
  }, [metrics]);

  // Announce changes
  const handleToggle = useCallback((metricId: MetricId) => {
    const metric = metrics.find((m) => m.id === metricId);
    const willBeVisible = !visibleMetricIds.includes(metricId);
    announce(`${metric?.name} ${willBeVisible ? 'visible' : 'hidden'}`, 'polite');
    onToggleMetric(metricId);
  }, [metrics, visibleMetricIds, onToggleMetric, announce]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-canvas/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customize visible metrics"
        className="fixed right-0 top-12 bottom-0 z-[70] w-full max-w-[360px] border-l border-stroke bg-surface shadow-popover"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Customize View</h2>
            <p className="text-xs text-ink-muted">
              {visibleMetricIds.length} of {metrics.length} metrics visible
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
            aria-label="Close customize panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2 border-b border-stroke px-4 py-2">
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-sm border border-stroke bg-surface-alt px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-stroke-strong"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={onHideAll}
            className="rounded-sm border border-stroke bg-surface-alt px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-stroke-strong hover:text-ink"
          >
            Show Minimal
          </button>
        </div>

        {/* Metrics List */}
        <div className="divide-y divide-stroke overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {Array.from(metricsByCategory.entries()).map(([category, categoryMetrics]) => (
            <div key={category} className="px-4 py-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {category}
              </h3>
              <div className="space-y-1">
                {categoryMetrics.map((metric) => {
                  const isVisible = visibleMetricIds.includes(metric.id);
                  const isDisabled = isVisible && visibleMetricIds.length <= 1;

                  return (
                    <button
                      key={metric.id}
                      type="button"
                      onClick={() => handleToggle(metric.id)}
                      disabled={isDisabled}
                      className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left transition-colors ${
                        isDisabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-surface-alt'
                      }`}
                      aria-pressed={isVisible}
                      aria-label={`${metric.name} (${isVisible ? 'visible' : 'hidden'})`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink">{metric.name}</span>
                        <span className="text-[10px] text-ink-muted">({metric.unit})</span>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${
                        isVisible
                          ? 'border-accent bg-accent text-white'
                          : 'border-stroke bg-surface-alt'
                      }`}>
                        {isVisible ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-ink-muted" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-stroke bg-surface-alt/50 px-4 py-3">
          <p className="text-xs text-ink-muted">
            Changes are saved automatically and persist across sessions.
          </p>
        </div>

        {/* Screen reader announcements */}
        <div {...liveRegionProps.polite} />
        <div {...liveRegionProps.assertive} />
      </div>
    </>
  );
}
