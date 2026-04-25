'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import type { MetricType } from '@/types/frontend';
import {
  adaptReitsData,
  getDefaultEntityCodes,
  getReitMetricSourceIds,
  normalizeEntityCodes,
  REIT,
} from '@/data/reits';
import { useEntityData } from '@/hooks/useEntityData';
import { CitationPanel } from '../CitationPanel';
import { RiskChip } from '../RiskChip';
import { Sparkline } from '../Sparkline';
import { ArrowLeft, Info, Settings2, X } from '../icons';

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
  const { data: entityData, isLoading, error } = useEntityData(selectedIds);

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

  const filteredMetrics =
    activeCategory === 'All' ? metrics : metrics.filter((metric) => metric.category === activeCategory);

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
            className="flex items-center gap-1.5 rounded-sm border border-stroke bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Settings2 className="h-4 w-4" />
            Customize View
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
    </div>
  );
}
