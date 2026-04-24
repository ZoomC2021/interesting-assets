'use client';

/**
 * KpiGrid - Key Performance Indicator grid with citation badges
 */

import { useState } from 'react';
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
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  
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
    <div className="space-y-6">
      {Object.entries(groupedByCategory).map(([cat, types]) => (
        <div key={cat}>
          <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3">
            {getCategoryDisplayName(cat as MetricCategory)}
          </h4>
          
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {types.map((metricType, idx) => {
              const definition = METRIC_REGISTRY[metricType as keyof typeof METRIC_REGISTRY];
              const hasAnyCitations = entities.some(e => {
                const m = e.metrics.find(m => m.metricType === metricType);
                return m?.sourceDisplayIds && m.sourceDisplayIds.length > 0;
              });
              
              return (
                <div
                  key={metricType}
                  className={`flex items-center justify-between p-4 ${
                    idx > 0 ? 'border-t border-neutral-100' : ''
                  } ${hasAnyCitations ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
                  onClick={() => {
                    if (!hasAnyCitations) return;
                    const citationIds = entities
                      .map(e => e.metrics.find(m => m.metricType === metricType))
                      .filter(Boolean)
                      .flatMap(m => m?.sourceDisplayIds || []);
                    if (citationIds.length > 0) onMetricClick?.(citationIds);
                  }}
                  onMouseEnter={() => setHoveredMetric(metricType)}
                  onMouseLeave={() => setHoveredMetric(null)}
                  role={hasAnyCitations ? 'button' : undefined}
                  tabIndex={hasAnyCitations ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (hasAnyCitations && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      const citationIds = entities
                        .map(e => e.metrics.find(m => m.metricType === metricType))
                        .filter(Boolean)
                        .flatMap(m => m?.sourceDisplayIds || []);
                      if (citationIds.length > 0) onMetricClick?.(citationIds);
                    }
                  }}
                  aria-label={hasAnyCitations ? `View citations for ${definition?.displayName || metricType}` : undefined}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900">
                        {definition?.displayName || metricType}
                      </p>
                      {hasAnyCitations && hoveredMetric === metricType && (
                        <span className="text-xs text-primary-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          View sources
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {definition?.unit}
                    </p>
                  </div>
                  
                  <div className="flex gap-6">
                    {entities.map((entity, entityIdx) => {
                      const metric = entity.metrics.find(m => m.metricType === metricType);
                      const value = metric?.value;
                      const indicators = metric ? getDataQualityIndicators(metric) : null;
                      const isHovered = hoveredEntity === `${entity.entity.id}-${metricType}`;
                      
                      return (
                        <div 
                          key={entity.entity.id} 
                          className="text-right min-w-[100px]"
                          onMouseEnter={() => setHoveredEntity(`${entity.entity.id}-${metricType}`)}
                          onMouseLeave={() => setHoveredEntity(null)}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entityColors[entityIdx % entityColors.length] }}
                            />
                            <span className="font-semibold text-neutral-900">
                              {formatMetricValue(
                                value,
                                definition?.format || 'number',
                                definition?.unit
                              )}
                            </span>
                            
                            {/* Citation badge on hover or when has citations */}
                            {indicators && indicators.citationCount > 0 && (
                              <span 
                                className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium transition-all ${
                                  isHovered 
                                    ? 'bg-primary-600 text-white scale-110' 
                                    : 'bg-primary-100 text-primary-700'
                                }`}
                                title={`${indicators.citationCount} citation${indicators.citationCount !== 1 ? 's' : ''}`}
                                aria-label={`${indicators.citationCount} citation${indicators.citationCount !== 1 ? 's' : ''}`}
                              >
                                {indicators.citationCount}
                              </span>
                            )}
                          </div>
                          
                          {/* Data quality indicators */}
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {indicators?.isEstimated && (
                              <span className="text-xs text-neutral-400 italic" title="Estimated value">est.</span>
                            )}
                            {indicators?.isTimeSensitive && (
                              <span className="text-warning-500" title="⚠️ Time-sensitive data">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {metricTypes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-card">
          <p className="text-neutral-500">No metrics available for this category</p>
        </div>
      )}
    </div>
  );
}

export default KpiGrid;
