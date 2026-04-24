'use client';

/**
 * EntityTable - Sortable table with 30+ columns for desktop
 * Enhanced with citation counts column
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { NormalizedReitData, MetricType, Metric } from '@/types/frontend';
import type { EntityBenchmarkComparison } from '@/lib/benchmark-calculations';
import { RiskBadge } from './RiskBadge';
import { SparklineChart } from './SparklineChart';
import { formatRM, formatPercentage, formatRatio, formatNumber } from '@/lib/formatters';
import { getEntityCitationCount } from '@/lib/citation-utils';

// ============================================================================
// Types
// ============================================================================

export type SortField = MetricType | 'name' | 'code' | 'risk' | 'dpu_sparkline' | 'citation_count';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface EntityTableProps {
  data: NormalizedReitData[];
  comparisons: Map<string, Map<MetricType, EntityBenchmarkComparison | undefined>>;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  sort: SortState;
  onSort: (field: SortField) => void;
  dpuHistories: Map<string, number[]>;
  className?: string;
  onCitationClick?: (entityId: string, citationIds: string[]) => void;
}

// ============================================================================
// Column Definitions (30+ columns)
// ============================================================================

interface ColumnDef {
  key: SortField;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'percentage' | 'ratio' | 'number' | 'sparkline';
  metricType?: MetricType;
}

const columns: ColumnDef[] = [
  // Identity columns
  { key: 'name', header: 'REIT Name', width: '200px', align: 'left' },
  { key: 'code', header: 'Code', width: '80px', align: 'left' },
  
  // Key financial metrics
  { key: 'market_cap', header: 'Market Cap', width: '100px', align: 'right', format: 'currency', metricType: 'market_cap' },
  { key: 'total_assets', header: 'Total Assets', width: '100px', align: 'right', format: 'currency', metricType: 'total_assets' },
  { key: 'nav_per_unit', header: 'NAV/Unit', width: '80px', align: 'right', format: 'currency', metricType: 'nav_per_unit' },
  { key: 'share_price', header: 'Price', width: '80px', align: 'right', format: 'currency', metricType: 'share_price' },
  { key: 'premium_discount_to_nav', header: 'P/Disc', width: '70px', align: 'right', format: 'percentage', metricType: 'premium_discount_to_nav' },
  { key: 'price_to_book', header: 'P/B', width: '60px', align: 'right', format: 'ratio', metricType: 'price_to_book' },
  
  // Dividend metrics
  { key: 'dpu', header: 'DPU', width: '70px', align: 'right', format: 'number', metricType: 'dpu' },
  { key: 'dividend_yield_market', header: 'Yield', width: '70px', align: 'right', format: 'percentage', metricType: 'dividend_yield_market' },
  { key: 'dpu_growth_yoy', header: 'DPU Grw', width: '70px', align: 'right', format: 'percentage', metricType: 'dpu_growth_yoy' },
  { key: 'payout_ratio', header: 'Payout', width: '70px', align: 'right', format: 'percentage', metricType: 'payout_ratio' },
  { key: 'dividend_yield_nav', header: 'Yld NAV', width: '70px', align: 'right', format: 'percentage', metricType: 'dividend_yield_nav' },
  
  // Portfolio metrics
  { key: 'property_count', header: 'Props', width: '60px', align: 'right', format: 'number', metricType: 'property_count' },
  { key: 'net_lettable_area', header: 'NLA', width: '90px', align: 'right', format: 'number', metricType: 'net_lettable_area' },
  { key: 'investment_properties', header: 'Inv Prop', width: '100px', align: 'right', format: 'currency', metricType: 'investment_properties' },
  { key: 'occupancy_rate', header: 'Occ%', width: '70px', align: 'right', format: 'percentage', metricType: 'occupancy_rate' },
  { key: 'wale_years', header: 'WALE', width: '60px', align: 'right', format: 'ratio', metricType: 'wale_years' },
  { key: 'tenant_count', header: 'Tenants', width: '70px', align: 'right', format: 'number', metricType: 'tenant_count' },
  { key: 'top_tenant_concentration', header: 'Top 10%', width: '70px', align: 'right', format: 'percentage', metricType: 'top_tenant_concentration' },
  
  // Income metrics
  { key: 'gross_revenue', header: 'Revenue', width: '100px', align: 'right', format: 'currency', metricType: 'gross_revenue' },
  { key: 'net_property_income', header: 'NPI', width: '100px', align: 'right', format: 'currency', metricType: 'net_property_income' },
  { key: 'npi_margin', header: 'NPI %', width: '65px', align: 'right', format: 'percentage', metricType: 'npi_margin' },
  { key: 'realised_income', header: 'Real Inc', width: '100px', align: 'right', format: 'currency', metricType: 'realised_income' },
  
  // Leverage metrics
  { key: 'gearing_ratio', header: 'Gearing', width: '70px', align: 'right', format: 'percentage', metricType: 'gearing_ratio' },
  { key: 'interest_coverage', header: 'ICR', width: '60px', align: 'right', format: 'ratio', metricType: 'interest_coverage' },
  { key: 'total_borrowings', header: 'Debt', width: '100px', align: 'right', format: 'currency', metricType: 'total_borrowings' },
  { key: 'fixed_rate_debt_pct', header: 'Fixed%', width: '65px', align: 'right', format: 'percentage', metricType: 'fixed_rate_debt_pct' },
  { key: 'floating_rate_debt_pct', header: 'Float%', width: '65px', align: 'right', format: 'percentage', metricType: 'floating_rate_debt_pct' },
  { key: 'wacd', header: 'WACD', width: '65px', align: 'right', format: 'percentage', metricType: 'wacd' },
  
  // Risk, Citation Count & DPU Trend
  { key: 'risk', header: 'Risk', width: '60px', align: 'center' },
  { key: 'citation_count', header: 'Sources', width: '70px', align: 'center' },
  { key: 'dpu_sparkline' as SortField, header: '5Y DPU', width: '80px', align: 'center', format: 'sparkline' },
];

// ============================================================================
// Main Component
// ============================================================================

export function EntityTable({
  data,
  comparisons,
  selectedIds,
  onSelect,
  onSelectAll,
  sort,
  onSort,
  dpuHistories,
  className = '',
  onCitationClick,
}: EntityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  
  // Get metric value helper
  const getMetric = (entityData: NormalizedReitData, metricType: MetricType): Metric | undefined => {
    return entityData.metrics.find(m => m.metricType === metricType);
  };
  
  // Format value helper
  const formatValue = (value: number | string | boolean | null | undefined, format?: string): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value !== 'number') return String(value);
    
    switch (format) {
      case 'currency':
        return formatRM(value / 1e6, 1); // Show in millions
      case 'percentage':
        return formatPercentage(value);
      case 'ratio':
        return formatRatio(value, 1);
      case 'number':
        return formatNumber(value, value % 1 === 0 ? 0 : 2);
      default:
        return String(value);
    }
  };
  
  // Risk severity helper
  const getRiskSeverity = (entityData: NormalizedReitData) => {
    const rating = entityData.riskAssessment.overallRiskRating;
    return rating === 'high' ? 'critical' 
      : rating === 'moderate_high' ? 'high'
      : rating === 'moderate' ? 'medium'
      : 'low';
  };

  // Handle citation click
  const handleCitationClick = (entityData: NormalizedReitData) => {
    const allCitationIds = new Set<string>();
    
    // Collect all citation IDs from metrics
    entityData.metrics.forEach(metric => {
      metric.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
    });
    
    // Collect from risk factors
    entityData.riskAssessment.riskFactors.forEach(factor => {
      factor.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
    });
    
    // Collect from observations
    entityData.observations.forEach(obs => {
      obs.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
    });
    
    if (allCitationIds.size > 0 && onCitationClick) {
      onCitationClick(entityData.entity.id, Array.from(allCitationIds));
    }
  };
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm" role="grid" aria-label="REIT data table">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {/* Selection header */}
            <th className="px-3 py-3 text-left w-10" scope="col">
              <input
                type="checkbox"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={() => {
                  if (!onSelectAll) return;
                  // Use atomic selection update to avoid stale-closure bug
                  onSelectAll(
                    selectedIds.length === data.length ? [] : data.map(d => d.entity.id)
                  );
                }}
                className="rounded border-gray-300"
                aria-label="Select all REITs"
              />
            </th>
            
            {/* Column headers */}
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                className={`px-3 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
                style={{ width: col.width, minWidth: col.width }}
                onClick={() => onSort(col.key)}
                aria-sort={sort.field === col.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                  <span className="whitespace-nowrap">{col.header}</span>
                  {sort.field === col.key && (
                    <svg 
                      className={`w-3 h-3 ${sort.direction === 'asc' ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
            
            {/* Actions header */}
            <th className="px-3 py-3 text-center w-24" scope="col">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-100">
          {data.map((entityData, index) => {
            const entity = entityData.entity;
            const isSelected = selectedIds.includes(entity.id);
            const isHovered = hoveredRow === entity.id;
            const riskSeverity = getRiskSeverity(entityData);
            const citationCount = getEntityCitationCount(entityData);
            const isHoveredCitation = hoveredCitation === entity.id;
            
            return (
              <tr
                key={entity.id}
                className={`transition-colors ${
                  isSelected ? 'bg-blue-50' : isHovered ? 'bg-gray-50' : 'bg-white'
                }`}
                onMouseEnter={() => setHoveredRow(entity.id)}
                onMouseLeave={() => setHoveredRow(null)}
                role="row"
                aria-selected={isSelected}
              >
                {/* Selection cell */}
                <td className="px-3 py-3" role="gridcell">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(entity.id)}
                    className="rounded border-gray-300"
                    aria-label={`Select ${entity.name}`}
                  />
                </td>
                
                {/* Data cells */}
                {columns.map(col => {
                  let content: React.ReactNode;
                  
                  // Handle special columns
                  if (col.key === 'name') {
                    content = (
                      <Link href={`/entity/${entity.code}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {entity.name}
                      </Link>
                    );
                  } else if (col.key === 'code') {
                    content = (
                      <span className="text-gray-500 font-mono text-xs">{entity.code}</span>
                    );
                  } else if (col.key === 'risk') {
                    content = <RiskBadge severity={riskSeverity} size="sm" />;
                  } else if (col.key === 'citation_count') {
                    content = (
                      <button
                        onClick={() => handleCitationClick(entityData)}
                        onMouseEnter={() => setHoveredCitation(entity.id)}
                        onMouseLeave={() => setHoveredCitation(null)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                          isHoveredCitation
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        } ${citationCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={citationCount === 0}
                        aria-label={citationCount > 0 ? `${citationCount} citations for ${entity.name}` : 'No citations'}
                        title={citationCount > 0 ? `View ${citationCount} sources` : 'No citations available'}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {citationCount}
                      </button>
                    );
                  } else if (col.key === 'dpu_sparkline') {
                    const history = dpuHistories.get(entity.id) || [];
                    content = history.length > 0 ? (
                      <SparklineChart data={history} width={70} height={20} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    );
                  } else if (col.metricType) {
                    const metric = getMetric(entityData, col.metricType);
                    const value = metric?.value;
                    
                    // Add data quality indicators
                    const hasTimeSensitive = metric?.isTimeSensitive;
                    const isEstimated = metric?.isEstimated;
                    
                    content = (
                      <span className="inline-flex items-center gap-1">
                        {formatValue(value, col.format)}
                        {hasTimeSensitive && (
                          <span className="text-warning-500" title="Time-sensitive data">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                        )}
                        {isEstimated && (
                          <span className="text-gray-400 text-xs italic" title="Estimated value">*</span>
                        )}
                      </span>
                    );
                  } else {
                    content = '—';
                  }
                  
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-3 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                      role="gridcell"
                    >
                      {content}
                    </td>
                  );
                })}
                
                {/* Actions cell */}
                <td className="px-3 py-3" role="gridcell">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/entity/${entity.code}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/compare?entities=${entity.code}`}
                      className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                    >
                      Compare
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No REITs match the current filters.
        </div>
      )}
    </div>
  );
}

// Export column count for verification (data columns + select + actions)
export const ENTITY_TABLE_COLUMN_COUNT = columns.length + 2;

export default EntityTable;
