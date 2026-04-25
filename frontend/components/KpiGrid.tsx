'use client';

/**
 * KpiGrid - Key Performance Indicator grid with citation badges (high-density table format)
 */

import { useCallback, useMemo } from 'react';
import type { NormalizedReitData, MetricCategory } from '@/types/frontend';
import { METRIC_REGISTRY, getCategoryDisplayName } from '@/lib/data-utils';
import { formatMetricValue } from '@/lib/formatters';
import { getDataQualityIndicators } from '@/lib/citation-utils';
import { entityColors, getCompareGridTemplate, getCompareTableMinWidth } from '@/lib/grid-utils';

interface KpiGridProps {
  entities: NormalizedReitData[];
  category: string;
  onMetricClick?: (citationIds: string[]) => void;
  showEntityHeader?: boolean;
  stickyHeaderTopClassName?: string;
}

function getFormatLabel(format?: string): string {
  switch (format) {
    case 'percentage':
      return 'Percentage';
    case 'currency':
      return 'Currency';
    case 'ratio':
      return 'Ratio';
    case 'years':
      return 'Years';
    case 'count':
      return 'Count';
    case 'boolean':
      return 'Flag';
    default:
      return 'Metric';
  }
}

export function KpiGrid({
  entities,
  category,
  onMetricClick,
  showEntityHeader = false,
  stickyHeaderTopClassName = 'top-14',
}: KpiGridProps) {
  const handleActivate = useCallback((metricType: string, hasAny: boolean) => {
    if (!hasAny || !onMetricClick) return;

    const ids = Array.from(new Set(
      entities
        .map(entity => entity.metrics.find(metric => metric.metricType === metricType))
        .flatMap(metric => metric?.sourceDisplayIds ?? [])
    ));

    if (ids.length > 0) onMetricClick(ids);
  }, [entities, onMetricClick]);

  const metricTypes = useMemo(() => {
    const allMetricTypes = new Set<string>();

    entities.forEach(entity => {
      entity.metrics.forEach(metric => allMetricTypes.add(metric.metricType));
    });

    return Array.from(allMetricTypes).filter(type => {
      if (category === 'all') return true;
      const definition = METRIC_REGISTRY[type as keyof typeof METRIC_REGISTRY];
      return definition?.category === category;
    });
  }, [category, entities]);

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    metricTypes.forEach(type => {
      const definition = METRIC_REGISTRY[type as keyof typeof METRIC_REGISTRY];
      const group = definition?.category || 'Other';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(type);
    });

    return grouped;
  }, [metricTypes]);

  const gridTemplateColumns = useMemo(() => getCompareGridTemplate(entities.length), [entities.length]);
  const minTableWidth = useMemo(() => getCompareTableMinWidth(entities.length), [entities.length]);

  return (
    <div className="space-y-2">
      {metricTypes.length > 0 && (
        <div className="overflow-hidden rounded-[1.25rem] border border-stroke bg-surface shadow-card">
          <div className="flex flex-col gap-3 border-b border-stroke bg-gradient-to-r from-surface to-primary-50/70 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-label text-muted">Comparison Table</p>
              <h2 className="mt-1 text-metric text-ink">Metric-by-metric snapshot</h2>
              <p className="mt-1 text-body-sm text-muted">
                Built with fixed column widths so the table stays dense on large screens and scrolls cleanly when space gets tight.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-stroke bg-surface px-3 py-1 text-label text-muted">
                {entities.length} selected
              </span>
              <span className="rounded-full border border-stroke bg-surface px-3 py-1 text-label text-muted">
                {metricTypes.length} metrics
              </span>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
            <div className="mx-auto w-fit" style={{ minWidth: `${minTableWidth}px` }}>
              {showEntityHeader && entities.length > 0 && (
                <div className={`sticky ${stickyHeaderTopClassName} z-30 mb-3`}>
                  <div className="overflow-hidden rounded-2xl border border-stroke bg-surface/95 shadow-card backdrop-blur supports-[backdrop-filter]:bg-surface/90">
                    <div className="grid" style={{ gridTemplateColumns }}>
                      <div className="border-r border-stroke bg-surface px-4 py-3">
                        <p className="text-label text-muted">Metric</p>
                        <p className="mt-1 text-body-sm text-ink">Click any sourced row to open its citations.</p>
                      </div>

                      {entities.map((entityData, idx) => (
                        <div
                          key={entityData.entity.id}
                          className="border-l border-stroke bg-gradient-to-b from-surface to-surfaceAlt/70 px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: entityColors[idx % entityColors.length] }}
                            />
                            <span className="truncate font-semibold text-ink">{entityData.entity.name}</span>
                          </div>
                          <div className="mt-1 text-micro text-muted">{entityData.entity.code}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(groupedByCategory).map(([group, types]) => (
                  <section key={group} className="overflow-hidden rounded-2xl border border-stroke bg-surface shadow-card">
                    <div className="flex items-center justify-between gap-3 border-b border-stroke bg-surfaceAlt/70 px-4 py-2.5">
                      <div>
                        <div className="font-medium text-ink">{getCategoryDisplayName(group as MetricCategory)}</div>
                        <div className="mt-0.5 text-body-sm text-muted">{types.length} metrics in this section</div>
                      </div>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-label text-muted">
                        {types.length}
                      </span>
                    </div>

                    <div className="bg-surface">
                      {types.map((metricType, idx) => {
                        const definition = METRIC_REGISTRY[metricType as keyof typeof METRIC_REGISTRY];
                        const hasAnyCitations = entities.some(entity => {
                          const metric = entity.metrics.find(item => item.metricType === metricType);
                          return Boolean(metric?.sourceDisplayIds?.length);
                        });
                        const totalCitationCount = entities.reduce((sum, entity) => {
                          const metric = entity.metrics.find(item => item.metricType === metricType);
                          return sum + (metric?.sourceDisplayIds.length ?? 0);
                        }, 0);
                        const rowTone = idx % 2 === 0 ? 'bg-surface' : 'bg-surfaceAlt/45';

                        return (
                          <div
                            key={metricType}
                            className={`group grid items-stretch text-data leading-4 transition-colors ${rowTone} ${
                              hasAnyCitations ? 'cursor-pointer hover:bg-primary-50/80 focus-within:bg-primary-50/80' : ''
                            } ${idx > 0 ? 'border-t border-stroke/70' : ''}`}
                            style={{ gridTemplateColumns }}
                            onClick={() => handleActivate(metricType, hasAnyCitations)}
                            role={hasAnyCitations ? 'button' : undefined}
                            tabIndex={hasAnyCitations ? 0 : undefined}
                            onKeyDown={(event) => {
                              if (hasAnyCitations && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                handleActivate(metricType, hasAnyCitations);
                              }
                            }}
                            aria-label={hasAnyCitations ? `View citations for ${definition?.displayName || metricType}` : undefined}
                          >
                            <div
                              className={`sticky left-0 z-10 border-r border-stroke/70 px-4 py-3 ${rowTone} ${
                                hasAnyCitations ? 'group-hover:bg-primary-50/80 group-focus-within:bg-primary-50/80' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-ink">{definition?.displayName || metricType}</span>
                                    {hasAnyCitations && totalCitationCount > 0 && (
                                      <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-700">
                                        {totalCitationCount} src
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted">
                                    <span>{definition?.unit || 'Value'}</span>
                                    <span className="text-neutral-300">•</span>
                                    <span>{getFormatLabel(definition?.format)}</span>
                                  </div>
                                </div>

                                {hasAnyCitations && (
                                  <svg
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h4m0 0v4m0-4L10 14" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {entities.map((entity) => {
                              const metric = entity.metrics.find(item => item.metricType === metricType);
                              const value = metric?.value;
                              const indicators = metric ? getDataQualityIndicators(metric) : null;

                              return (
                                <div key={entity.entity.id} className="border-l border-stroke/70 px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="tabular text-metric-sm text-ink">
                                      {formatMetricValue(value, definition?.format || 'number', definition?.unit)}
                                    </span>
                                    {indicators && indicators.citationCount > 0 && (
                                      <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-700">
                                        {indicators.citationCount}
                                      </span>
                                    )}
                                  </div>

                                  {(indicators?.isEstimated || indicators?.isTimeSensitive) && (
                                    <div className="mt-1 flex justify-end gap-1.5">
                                      {indicators?.isEstimated && (
                                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-2xs text-muted">
                                          Est.
                                        </span>
                                      )}
                                      {indicators?.isTimeSensitive && (
                                        <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-2xs text-warning-600">
                                          Live
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {metricTypes.length === 0 && (
        <div className="rounded-lg bg-surface py-8 text-center shadow-card">
          <p className="text-body text-muted">No metrics available for this category</p>
        </div>
      )}
    </div>
  );
}

export default KpiGrid;
