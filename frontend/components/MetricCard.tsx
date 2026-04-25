'use client';

/**
 * MetricCard - Metric display card with citation badge and hover tooltip
 */

import { useState } from 'react';
import type { Metric, MetricType } from '@/types/frontend';
import { METRIC_REGISTRY } from '@/lib/data-utils';
import { formatMetricValue } from '@/lib/formatters';

interface MetricCardProps {
  metric: Metric;
  entityName: string;
  entityColor: string;
  onClick?: (citationIds: string[]) => void;
  showComparison?: boolean;
  comparisonValue?: number | string | boolean | null;
}

export function MetricCard({
  metric,
  entityName,
  entityColor,
  onClick,
  showComparison,
  comparisonValue,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const definition = METRIC_REGISTRY[metric.metricType];
  const citationCount = metric.sourceDisplayIds?.length || 0;
  const hasCitations = citationCount > 0;
  
  const formattedValue = formatMetricValue(
    metric.value,
    definition?.format || 'number',
    definition?.unit || metric.unit
  );
  
  const formattedComparison = comparisonValue !== undefined
    ? formatMetricValue(
        comparisonValue,
        definition?.format || 'number',
        definition?.unit || metric.unit
      )
    : null;

  return (
    <div
      onClick={() => hasCitations && onClick?.(metric.sourceDisplayIds)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={hasCitations ? 'button' : undefined}
      tabIndex={hasCitations ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasCitations && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(metric.sourceDisplayIds);
        }
      }}
      aria-label={hasCitations 
        ? `${definition?.displayName || metric.metricType}: ${formattedValue}. ${citationCount} citation${citationCount !== 1 ? 's' : ''} available. Press Enter to view.`
        : undefined
      }
      className={`bg-white rounded-lg p-4 border border-neutral-200 transition-all relative ${
        hasCitations 
          ? 'cursor-pointer hover:shadow-card-hover hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1' 
          : ''
      }`}
    >
      {/* Citation Count Badge */}
      {hasCitations && (
        <div 
          className="absolute top-2 right-2 z-10"
          aria-hidden="true"
        >
          <span 
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium transition-colors ${
              isHovered 
                ? 'bg-primary-600 text-white' 
                : 'bg-primary-100 text-primary-700'
            }`}
            title={`${citationCount} citation${citationCount !== 1 ? 's' : ''}`}
          >
            {citationCount}
          </span>
        </div>
      )}

      {/* Entity indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: entityColor }}
        />
        <span className="text-xs text-neutral-500 uppercase tracking-wide">
          {entityName}
        </span>
      </div>
      
      {/* Metric name */}
      <p className="text-sm text-neutral-600 mb-1">
        {definition?.displayName || metric.metricType}
      </p>
      
      {/* Metric value with quality indicators */}
      <div className="flex items-center gap-2">
        <p className="text-xl font-bold text-neutral-900">
          {formattedValue}
        </p>
        
        {/* Data quality indicators */}
        <div className="flex items-center gap-1">
          {metric.isTimeSensitive && (
            <span 
              className="text-warning-500" 
              title="Time-sensitive data"
              aria-label="Warning: Time-sensitive data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          )}
          {metric.isEstimated && (
            <span 
              className="text-xs text-neutral-400 italic"
              title="Estimated value"
            >
              est.
            </span>
          )}
        </div>
      </div>
      
      {/* Comparison value */}
      {showComparison && formattedComparison && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">vs {formattedComparison}</p>
        </div>
      )}
      
      {/* Benchmark bar */}
      {definition?.benchmarkRange && typeof metric.value === 'number' && metric.value !== null && (
        <div className="mt-3">
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, 
                  (metric.value / (definition.benchmarkRange.max || metric.value * 1.5)) * 100
                ))}%`,
                backgroundColor: entityColor,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>0</span>
            <span>{definition.benchmarkRange.max || metric.value}</span>
          </div>
        </div>
      )}
      
      {/* Citation hint */}
      {hasCitations && (
        <p className="text-xs text-primary-600 mt-2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click for {citationCount} source{citationCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Hover preview tooltip */}
      {isHovered && hasCitations && (
        <div 
          className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-neutral-900 text-white text-xs rounded-lg shadow-lg z-20 opacity-0 animate-fade-in pointer-events-none"
          style={{ animation: 'fadeIn 0.15s ease-out forwards' }}
          role="tooltip"
        >
          <p className="font-medium mb-1">{citationCount} citation{citationCount !== 1 ? 's' : ''} available</p>
          <p className="text-neutral-300">Click to view sources</p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-neutral-900" />
        </div>
      )}
    </div>
  );
}

export default MetricCard;
