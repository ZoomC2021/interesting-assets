'use client';

/**
 * KpiGrid - Key Performance Indicator grid with citation badges (high-density table format)
 */

import { useState, useCallback } from 'react';
import type { NormalizedReitData, MetricCategory } from '@/types/frontend';
import { METRIC_REGISTRY, getCategoryDisplayName } from '@/lib/data-utils';
import { formatMetricValue } from '@/lib/formatters';
import { getDataQualityIndicators } from '@/lib/citation-utils';

interface KpiGridProps {
  entities: NormalizedReitData[];
  category: string;
  onMetricClick?: (citationIds: string[]) => void;
}

export function KpiGrid({ entities, category, onMetricClick }: KpiGridProps) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  // Deduplicated handler for activating metric citations
  const handleActivate = useCallback((metricType: string, hasAny: boolean) => {
    if (!hasAny || !onMetricClick) return;
    const ids = Array.from(new Set(
      entities
        .map(e => e.metrics.find(m => m.metricType === metricType))
        .flatMap(m => m?.sourceDisplayIds ?? [])
    ));
    if (ids.length > 0) onMetricClick(ids);
  }, [entities, onMetricClick]);
   
  // Get all unique metric types across entities
  const allMetricTypes = new Set<string>();
  entities.forEach(entity => {
    entity.metrics.forEach(m => allMetricTypes.add(m.metricType));
  });
  
  // Filter by category if specified
  const metricTypes = Array.from(allMetricTypes).filter(type => {
    if (category === 'all') return true;
    const def = METRIC_REGISTRY[type as keyof typeof METRIC_REGISTRY];
    return def?.category === category;
  });
  
  // Group by category for display
  const groupedByCategory: Record<string, string[]> = {};
  metricTypes.forEach(type => {
    const def = METRIC_REGISTRY[type as keyof typeof METRIC_REGISTRY];
    const cat = def?.category || 'Other';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(type);
  });

  const entityColors = ['#2563eb', '#16a34a', '#ea580c']; // blue, green, orange

  return (
    <div className="space-y-2">
      {Object.entries(groupedByCategory).map(([cat, types]) => (
        <div key={cat}>
          <div className="flex items-center gap-2 py-1 border-b border-stroke">
            <span className="text-label font-medium text-ink">{getCategoryDisplayName(cat as MetricCategory)}</span>
            <span className="text-xs text-muted">({types.length})</span>
          </div>
          
          <div className="bg-surface">
            {types.map((metricType, idx) => {
              const definition = METRIC_REGISTRY[metricType as keyof typeof METRIC_REGISTRY];
              const hasAnyCitations = entities.some(e => {
                const m = e.metrics.find(m => m.metricType === metricType);
                return m?.sourceDisplayIds && m.sourceDisplayIds.length > 0;
              });
              const isActive = activeMetric === metricType;
              
              return (
                <div
                  key={metricType}
                  className={`grid items-center py-1 text-[12.5px] leading-4 ${hasAnyCitations ? 'cursor-pointer hover:bg-surface-alt' : ''} ${isActive ? 'bg-surface-alt' : ''} ${idx > 0 ? 'border-t border-stroke' : ''}`}
                  style={{ gridTemplateColumns: `200px repeat(${entities.length}, minmax(120px, 1fr))` }}
                  onClick={() => handleActivate(metricType, hasAnyCitations)}
                  onMouseEnter={() => setActiveMetric(metricType)}
                  onMouseLeave={() => setActiveMetric(null)}
                  role={hasAnyCitations ? 'button' : undefined}
                  tabIndex={hasAnyCitations ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (hasAnyCitations && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleActivate(metricType, hasAnyCitations);
                    }
                  }}
                  aria-label={hasAnyCitations ? `View citations for ${definition?.displayName || metricType}` : undefined}
                >
                  {/* Metric name column */}
                  <div className="px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-ink font-medium">{definition?.displayName || metricType}</span>
                      {hasAnyCitations && (
                        <span className="text-[10px] text-accent">●</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">{definition?.unit}</span>
                  </div>
                  
                  {/* Entity value columns */}
                  {entities.map((entity, entityIdx) => {
                    const metric = entity.metrics.find(m => m.metricType === metricType);
                    const value = metric?.value;
                    const indicators = metric ? getDataQualityIndicators(metric) : null;
                    
                    return (
                      <div key={entity.entity.id} className="px-3 border-l border-stroke text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="tabular font-semibold text-ink">
                            {formatMetricValue(value, definition?.format || 'number', definition?.unit)}
                          </span>
                          {indicators && indicators.citationCount > 0 && (
                            <span className="text-[9px] text-accent">{indicators.citationCount}</span>
                          )}
                        </div>
                        <div className="flex justify-end gap-1">
                          {indicators?.isEstimated && <span className="text-[9px] text-muted">est</span>}
                          {indicators?.isTimeSensitive && <span className="text-warning text-[9px]">!</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {metricTypes.length === 0 && (
        <div className="text-center py-8 bg-surface rounded-lg shadow-card">
          <p className="text-muted text-sm">No metrics available for this category</p>
        </div>
      )}
    </div>
  );
}

export default KpiGrid;
