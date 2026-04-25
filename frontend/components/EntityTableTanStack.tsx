'use client';

/**
 * EntityTableTanStack - Full-featured TanStack Table implementation
 * Milestone 3: Hardening + Rollout - Performance optimized, accessibility complete
 *
 * Architecture:
 * - Uses TanStack Table v8 for state management, sorting, and column virtualization
 * - 33 data columns organized into logical groups (identity, valuation, dividend, etc.)
 * - Column group selector for quick context switching
 * - TWO-TABLE ARCHITECTURE: Separate sticky header table + scrollable body table
 * - Full keyboard navigation support (Arrow keys, Enter/Space, Tab)
 * - Comprehensive ARIA attributes (aria-sort, aria-selected, aria-pressed, scope)
 * - Memoized columns and event handlers for performance
 * - Synchronized horizontal scrolling between header and body
 *
 * Performance Features:
 * - useMemo for column definitions (only rebuilds when dependencies change)
 * - useMemo for visible column filtering
 * - useMemo for sorting state conversion
 * - useCallback for all event handlers
 * - React.memo could be added to row components if needed
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { NormalizedReitData, MetricType, Metric } from '@/types/frontend';
import type { EntityBenchmarkComparison } from '@/lib/benchmark-calculations';
import { RiskBadge } from './RiskBadge';
import { SparklineChart } from './SparklineChart';
import { formatRM, formatRatio, formatNumber } from '@/lib/formatters';
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

interface EntityTableTanStackProps {
  data: NormalizedReitData[];
  comparisons: Map<string, Map<MetricType, EntityBenchmarkComparison | undefined>>;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  sort: SortState;
  onSort: (field: SortField) => void;
  dpuHistories: Map<string, number[]>;
  className?: string;
  /** className for header sticky positioning (default stacks below Monitor header + FilterBar) */
  stickyHeaderTopClassName?: string;
  onCitationClick?: (entityId: string, citationIds: string[]) => void;
}

interface ColumnMeta {
  width?: string;
  align?: 'left' | 'center' | 'right';
  group?: 'identity' | 'valuation' | 'dividend' | 'portfolio' | 'income' | 'leverage' | 'risk' | 'actions';
}

// Width constants for consistent column sizing
const SELECTION_COL_WIDTH = 40;
const ACTIONS_COL_WIDTH = 96;

/** Sticky thead offset: app bar (`h-12`) + FilterBar — see FilterBar. */
const TABLE_HEAD_STICKY_TOP = 'top-28';

// ============================================================================
// Column Helper
// ============================================================================

const columnHelper = createColumnHelper<NormalizedReitData>();

// ============================================================================
// All 33 Column Definitions
// ============================================================================

type CreateColumnsParams = {
  dpuHistories: Map<string, number[]>;
  onCitationClick: ((entityId: string, citationIds: string[]) => void) | undefined;
  hoveredCitation: string | null;
  setHoveredCitation: (id: string | null) => void;
};

/**
 * Creates all 33 column definitions for the TanStack table.
 *
 * This function defines the complete column schema including:
 * - Identity columns (name, code) with links to entity pages
 * - Valuation metrics (market cap, NAV, price, P/B, premium/discount)
 * - Dividend metrics (DPU, yield, growth, payout ratio)
 * - Portfolio metrics (property count, occupancy, WALE, tenants)
 * - Income metrics (revenue, NPI, margins)
 * - Leverage metrics (gearing, ICR, debt breakdown, WACD)
 * - Risk columns (risk badge, citations, DPU sparkline)
 *
 * Each column includes:
 * - Proper formatting via helper functions (currency, percentage, ratio)
 * - Metadata for alignment, width, and grouping
 * - Data quality indicators (time-sensitive, estimated flags)
 *
 * @param params - Configuration object containing DPU histories, citation click handler, and hover state
 * @returns Array of TanStack ColumnDef objects ready for useReactTable
 */
function createAllColumns(params: CreateColumnsParams): ColumnDef<NormalizedReitData, any>[] {
  const { dpuHistories, onCitationClick, hoveredCitation, setHoveredCitation } = params;

  /**
   * Retrieves the raw value of a specific metric from a row.
   * @param row - The REIT data row
   * @param metricType - The type of metric to retrieve
   * @returns The metric value or undefined if not found
   */
  const getMetricValue = (row: NormalizedReitData, metricType: MetricType): number | string | boolean | null | undefined => {
    return row.metrics.find(m => m.metricType === metricType)?.value;
  };

  /**
   * Retrieves the full metric object (including metadata) from a row.
   * @param row - The REIT data row
   * @param metricType - The type of metric to retrieve
   * @returns The Metric object or undefined if not found
   */
  const getMetric = (row: NormalizedReitData, metricType: MetricType): Metric | undefined => {
    return row.metrics.find(m => m.metricType === metricType);
  };

  // Data stores currency values already in millions (e.g., market_cap: 340 = RM340M)
  const fmtRMMillions = (mil: number): string => {
    if (mil >= 1000) {
      return `RM ${(mil / 1000).toLocaleString('en-MY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
    }
    return `RM ${mil.toLocaleString('en-MY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  };

  const formatCurrency = (value: number | string | boolean | null | undefined): string => {
    if (value === null || value === undefined || typeof value === 'boolean') return '—';
    return fmtRMMillions(Number(value));
  };

  const formatCurrencyFromMetric = (metric: Metric | undefined): string => {
    if (!metric || metric.value === null || metric.value === undefined || typeof metric.value === 'boolean') {
      return '—';
    }
    return fmtRMMillions(Number(metric.value));
  };

  // Data stores percentages as whole numbers (43.5 = 43.5%), not decimals
  const formatPct = (value: number | string | boolean | null | undefined): string => {
    if (value === null || value === undefined || typeof value === 'boolean') return '—';
    const num = Number(value);
    return `${num.toLocaleString('en-MY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  /**
   * Formats a value as a ratio with 1 decimal place.
   * @param value - The raw ratio value
   * @returns Formatted ratio string or '—' for invalid values
   */
  const formatRat = (value: number | string | boolean | null | undefined): string => {
    if (value === null || value === undefined || typeof value === 'boolean') return '—';
    return formatRatio(Number(value), 1);
  };

  /**
   * Formats a numeric value with intelligent decimal places.
   * Uses 0 decimals for integers, 2 decimals for floats.
   * @param value - The raw numeric value
   * @returns Formatted number string or '—' for invalid values
   */
  const formatNum = (value: number | string | boolean | null | undefined): string => {
    if (value === null || value === undefined || typeof value === 'boolean') return '—';
    const num = Number(value);
    return formatNumber(num, num % 1 === 0 ? 0 : 2);
  };

  /**
   * Formats a value as raw currency without millions conversion.
   * @param value - The raw currency value
   * @param decimals - Number of decimal places (default 2)
   * @returns Formatted currency string or '—' for invalid values
   */
  const formatRawCurrency = (value: number | string | boolean | null | undefined, decimals = 2): string => {
    if (value === null || value === undefined || typeof value === 'boolean') return '—';
    return formatRM(Number(value), decimals);
  };

  /**
   * Renders a metric cell with optional data quality indicators.
   *
   * Displays the formatted value along with visual indicators for:
   * - Time-sensitive data (warning icon) - data that may change frequently
   * - Estimated values (asterisk) - calculated or projected values
   *
   * @param value - The raw metric value (number, string, boolean, or null/undefined)
   * @param formatter - Function to format the value for display (e.g., formatCurrency, formatPct)
   * @param metric - Optional metric object containing isTimeSensitive and isEstimated flags
   * @returns JSX element with formatted value and indicators
   */
  const renderMetricCell = (
    value: number | string | boolean | null | undefined,
    formatter: (v: number | string | boolean | null | undefined) => string,
    metric?: Metric
  ) => {
    return (
      <span className="inline-flex items-center gap-1">
        {formatter(value)}
        {metric?.isTimeSensitive && (
          <span className="text-warning-500" title="Time-sensitive data">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
        )}
        {metric?.isEstimated && (
          <span className="text-gray-400 text-body-sm italic" title="Estimated value">*</span>
        )}
      </span>
    );
  };

  return [
    // =========================================================================
    // Identity Columns
    // =========================================================================
    columnHelper.accessor(row => row.entity.name, {
      id: 'name',
      header: 'REIT Name',
      meta: { width: '200px', align: 'left', group: 'identity' } as ColumnMeta,
      cell: ({ row }) => {
        const entity = row.original.entity;
        return (
          <Link href={`/entity/${entity.code}`} className="font-medium text-gray-900 hover:text-blue-600">
            {entity.name}
          </Link>
        );
      },
    }),

    columnHelper.accessor(row => row.entity.code, {
      id: 'code',
      header: 'Code',
      meta: { width: '80px', align: 'left', group: 'identity' } as ColumnMeta,
      cell: ({ getValue }) => (
        <span className="text-gray-500 font-mono text-body-sm">{getValue()}</span>
      ),
    }),

    // =========================================================================
    // Valuation Metrics
    // =========================================================================
    columnHelper.accessor(
      row => getMetricValue(row, 'market_cap'),
      {
        id: 'market_cap',
        header: 'Market Cap',
        meta: { width: '100px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'market_cap');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'total_assets'),
      {
        id: 'total_assets',
        header: 'Total Assets',
        meta: { width: '100px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'total_assets');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'nav_per_unit'),
      {
        id: 'nav_per_unit',
        header: 'NAV/Unit',
        meta: { width: '80px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'nav_per_unit');
          return renderMetricCell(value, (v) => formatRawCurrency(v, 2), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'share_price'),
      {
        id: 'share_price',
        header: 'Price',
        meta: { width: '80px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'share_price');
          return renderMetricCell(value, (v) => formatRawCurrency(v, 2), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'premium_discount_to_nav'),
      {
        id: 'premium_discount_to_nav',
        header: 'P/Disc',
        meta: { width: '70px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'premium_discount_to_nav');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'price_to_book'),
      {
        id: 'price_to_book',
        header: 'P/B',
        meta: { width: '60px', align: 'right', group: 'valuation' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'price_to_book');
          return renderMetricCell(value, formatRat, metric);
        },
      }
    ),

    // =========================================================================
    // Dividend Metrics
    // =========================================================================
    columnHelper.accessor(
      row => getMetricValue(row, 'dpu'),
      {
        id: 'dpu',
        header: 'DPU',
        meta: { width: '70px', align: 'right', group: 'dividend' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'dpu');
          return renderMetricCell(value, formatNum, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'dividend_yield_market'),
      {
        id: 'dividend_yield_market',
        header: 'Yield',
        meta: { width: '70px', align: 'right', group: 'dividend' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'dividend_yield_market');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'dpu_growth_yoy'),
      {
        id: 'dpu_growth_yoy',
        header: 'DPU Grw',
        meta: { width: '70px', align: 'right', group: 'dividend' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'dpu_growth_yoy');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'payout_ratio'),
      {
        id: 'payout_ratio',
        header: 'Payout',
        meta: { width: '70px', align: 'right', group: 'dividend' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'payout_ratio');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'dividend_yield_nav'),
      {
        id: 'dividend_yield_nav',
        header: 'Yld NAV',
        meta: { width: '70px', align: 'right', group: 'dividend' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'dividend_yield_nav');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    // =========================================================================
    // Portfolio Metrics
    // =========================================================================
    columnHelper.accessor(
      row => getMetricValue(row, 'property_count'),
      {
        id: 'property_count',
        header: 'Props',
        meta: { width: '60px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'property_count');
          return renderMetricCell(value, formatNum, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'net_lettable_area'),
      {
        id: 'net_lettable_area',
        header: 'NLA',
        meta: { width: '90px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'net_lettable_area');
          return renderMetricCell(value, formatNum, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'investment_properties'),
      {
        id: 'investment_properties',
        header: 'Inv Prop',
        meta: { width: '100px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'investment_properties');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'occupancy_rate'),
      {
        id: 'occupancy_rate',
        header: 'Occ%',
        meta: { width: '70px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'occupancy_rate');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'wale_years'),
      {
        id: 'wale_years',
        header: 'WALE',
        meta: { width: '60px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'wale_years');
          return renderMetricCell(value, formatRat, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'tenant_count'),
      {
        id: 'tenant_count',
        header: 'Tenants',
        meta: { width: '70px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'tenant_count');
          return renderMetricCell(value, formatNum, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'top_tenant_concentration'),
      {
        id: 'top_tenant_concentration',
        header: 'Top 10%',
        meta: { width: '70px', align: 'right', group: 'portfolio' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'top_tenant_concentration');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    // =========================================================================
    // Income Metrics
    // =========================================================================
    columnHelper.accessor(
      row => getMetricValue(row, 'gross_revenue'),
      {
        id: 'gross_revenue',
        header: 'Revenue',
        meta: { width: '100px', align: 'right', group: 'income' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'gross_revenue');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'net_property_income'),
      {
        id: 'net_property_income',
        header: 'NPI',
        meta: { width: '100px', align: 'right', group: 'income' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'net_property_income');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'npi_margin'),
      {
        id: 'npi_margin',
        header: 'NPI %',
        meta: { width: '65px', align: 'right', group: 'income' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'npi_margin');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'realised_income'),
      {
        id: 'realised_income',
        header: 'Real Inc',
        meta: { width: '100px', align: 'right', group: 'income' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'realised_income');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    // =========================================================================
    // Leverage Metrics
    // =========================================================================
    columnHelper.accessor(
      row => getMetricValue(row, 'gearing_ratio'),
      {
        id: 'gearing_ratio',
        header: 'Gearing',
        meta: { width: '70px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'gearing_ratio');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'interest_coverage'),
      {
        id: 'interest_coverage',
        header: 'ICR',
        meta: { width: '60px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'interest_coverage');
          return renderMetricCell(value, formatRat, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'total_borrowings'),
      {
        id: 'total_borrowings',
        header: 'Debt',
        meta: { width: '100px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'total_borrowings');
          return renderMetricCell(value, () => formatCurrencyFromMetric(metric), metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'fixed_rate_debt_pct'),
      {
        id: 'fixed_rate_debt_pct',
        header: 'Fixed%',
        meta: { width: '65px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'fixed_rate_debt_pct');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'floating_rate_debt_pct'),
      {
        id: 'floating_rate_debt_pct',
        header: 'Float%',
        meta: { width: '65px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'floating_rate_debt_pct');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    columnHelper.accessor(
      row => getMetricValue(row, 'wacd'),
      {
        id: 'wacd',
        header: 'WACD',
        meta: { width: '65px', align: 'right', group: 'leverage' } as ColumnMeta,
        cell: ({ getValue, row }) => {
          const value = getValue();
          const metric = getMetric(row.original, 'wacd');
          return renderMetricCell(value, formatPct, metric);
        },
      }
    ),

    // =========================================================================
    // Risk, Citation Count & DPU Trend
    // =========================================================================
    columnHelper.accessor(
      row => row.riskAssessment.overallRiskRating,
      {
        id: 'risk',
        header: 'Risk',
        meta: { width: '60px', align: 'center', group: 'risk' } as ColumnMeta,
        cell: ({ getValue }) => {
          const rating = getValue();
          const severity = rating === 'high' ? 'critical'
            : rating === 'moderate_high' ? 'high'
            : rating === 'moderate' ? 'medium'
            : 'low';
          return <RiskBadge severity={severity} size="sm" />;
        },
      }
    ),

    columnHelper.display({
      id: 'citation_count',
      header: 'Sources',
      meta: { width: '70px', align: 'center', group: 'risk' } as ColumnMeta,
      cell: ({ row }) => {
        const entityData = row.original;
        const entity = entityData.entity;
        const citationCount = getEntityCitationCount(entityData);
        const isHovered = hoveredCitation === entity.id;

        const handleCitationClick = () => {
          const allCitationIds = new Set<string>();
          
          entityData.metrics.forEach(metric => {
            metric.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
          });
          
          entityData.riskAssessment.riskFactors.forEach(factor => {
            factor.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
          });
          
          entityData.observations.forEach(obs => {
            obs.sourceDisplayIds?.forEach(id => allCitationIds.add(id));
          });
          
          if (allCitationIds.size > 0 && onCitationClick) {
            onCitationClick(entity.id, Array.from(allCitationIds));
          }
        };

        return (
          <button
            onClick={handleCitationClick}
            onMouseEnter={() => setHoveredCitation(entity.id)}
            onMouseLeave={() => setHoveredCitation(null)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-body-sm font-medium transition-all ${
              isHovered
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
      },
    }),

    columnHelper.display({
      id: 'dpu_sparkline',
      header: '5Y DPU',
      meta: { width: '80px', align: 'center', group: 'risk' } as ColumnMeta,
      cell: ({ row }) => {
        const entity = row.original.entity;
        const history = dpuHistories.get(entity.id) || [];
        return history.length > 0 ? (
          <SparklineChart data={history} width={70} height={20} />
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
    }),
  ];
}

// ============================================================================
// Column Groups Configuration
// ============================================================================

type ColumnGroupKey = 'all' | 'essentials' | 'valuation' | 'dividend' | 'income' | 'portfolio' | 'leverage' | 'risk';

const COLUMN_GROUPS: Record<ColumnGroupKey, string[]> = {
  all: [
    'name', 'code', 'market_cap', 'total_assets', 'nav_per_unit', 'share_price', 'premium_discount_to_nav', 'price_to_book',
    'dpu', 'dividend_yield_market', 'dpu_growth_yoy', 'payout_ratio', 'dividend_yield_nav',
    'property_count', 'net_lettable_area', 'investment_properties', 'occupancy_rate', 'wale_years', 'tenant_count', 'top_tenant_concentration',
    'gross_revenue', 'net_property_income', 'npi_margin', 'realised_income',
    'gearing_ratio', 'interest_coverage', 'total_borrowings', 'fixed_rate_debt_pct', 'floating_rate_debt_pct', 'wacd',
    'risk', 'citation_count', 'dpu_sparkline'
  ],
  essentials: ['name', 'code', 'market_cap', 'nav_per_unit', 'dividend_yield_market', 'gearing_ratio', 'occupancy_rate', 'risk', 'citation_count', 'dpu_sparkline'],
  valuation: ['name', 'code', 'market_cap', 'total_assets', 'nav_per_unit', 'share_price', 'premium_discount_to_nav', 'price_to_book', 'risk'],
  dividend: ['name', 'code', 'dpu', 'dividend_yield_market', 'dpu_growth_yoy', 'payout_ratio', 'dividend_yield_nav', 'risk'],
  income: ['name', 'code', 'gross_revenue', 'net_property_income', 'npi_margin', 'realised_income', 'risk'],
  portfolio: ['name', 'code', 'property_count', 'net_lettable_area', 'investment_properties', 'occupancy_rate', 'wale_years', 'tenant_count', 'top_tenant_concentration', 'risk'],
  leverage: ['name', 'code', 'gearing_ratio', 'interest_coverage', 'total_borrowings', 'fixed_rate_debt_pct', 'floating_rate_debt_pct', 'wacd', 'risk'],
  risk: ['name', 'code', 'risk', 'citation_count', 'dpu_sparkline'],
};

// ============================================================================
// Main Component
// ============================================================================

export function EntityTableTanStack({
  data,
  comparisons,
  selectedIds,
  onSelect,
  onSelectAll,
  sort,
  onSort,
  dpuHistories,
  className = '',
  stickyHeaderTopClassName = TABLE_HEAD_STICKY_TOP,
  onCitationClick,
}: EntityTableTanStackProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<ColumnGroupKey>('essentials');

  // Memoized callback for setting hovered citation (stable reference)
  const setHoveredCitationCb = useCallback((id: string | null) => {
    setHoveredCitation(id);
  }, []);

  // Create all columns (memoized - only rebuilds when dependencies change)
  const allColumns = useMemo(
    () => createAllColumns({
      dpuHistories,
      onCitationClick,
      hoveredCitation,
      setHoveredCitation: setHoveredCitationCb,
    }),
    [dpuHistories, onCitationClick, hoveredCitation, setHoveredCitationCb]
  );

  // Filter columns based on active group (memoized)
  const visibleColumnIds = useMemo(() => COLUMN_GROUPS[activeGroup], [activeGroup]);
  const columns = useMemo(
    () => allColumns.filter(col => visibleColumnIds.includes(col.id as string)),
    [allColumns, visibleColumnIds]
  );

  // TanStack sorting state (synced with external sort state)
  const sortingState: SortingState = useMemo(() => {
    if (!sort.field) return [];
    return [{ id: sort.field, desc: sort.direction === 'desc' }];
  }, [sort]);

  // Memoized sorting change handler
  const handleSortingChange = useCallback((updater: any) => {
    // Convert TanStack sorting change to external onSort callback
    const newSorting = typeof updater === 'function'
      ? updater(sortingState)
      : updater;

    if (newSorting.length === 0) {
      // Sort cleared - cycle back to none (external handler will handle)
      onSort(sort.field); // Trigger sort on current field to cycle
    } else {
      const firstSort = newSorting[0];
      onSort(firstSort.id as SortField);
    }
  }, [onSort, sort.field, sortingState]);

  // Memoized row selection handler
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  // Memoized select all handler
  const handleSelectAll = useCallback(() => {
    if (!onSelectAll) return;
    onSelectAll(
      selectedIds.length === data.length ? [] : data.map(d => d.entity.id)
    );
  }, [onSelectAll, selectedIds.length, data]);

  // Memoized column group change handler
  const handleGroupChange = useCallback((group: ColumnGroupKey) => {
    setActiveGroup(group);
  }, []);

  // TanStack table instance with sorting
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Get column meta helper
  const getColumnMeta = (columnId: string): ColumnMeta => {
    const column = allColumns.find(c => c.id === columnId);
    return (column?.meta as ColumnMeta) || { align: 'left' };
  };

  // Refs for keyboard navigation in column group buttons
  const groupButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupKeys = (Object.keys(COLUMN_GROUPS) as Array<ColumnGroupKey>);

  /**
   * Handles keyboard navigation for column group buttons.
   * - ArrowRight/ArrowDown: Move to next button
   * - ArrowLeft/ArrowUp: Move to previous button
   * - Home: Move to first button
   * - End: Move to last button
   */
  const handleGroupKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (index + 1) % groupKeys.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (index - 1 + groupKeys.length) % groupKeys.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = groupKeys.length - 1;
        break;
    }

    if (nextIndex !== null) {
      const nextButton = groupButtonRefs.current[nextIndex];
      if (nextButton) {
        nextButton.focus();
        handleGroupChange(groupKeys[nextIndex]);
      }
    }
  }, [groupKeys, handleGroupChange]);

  // ============================================================================
  // Two-Table Architecture: Scroll Sync
  // ============================================================================
  const isSyncing = useRef(false);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback((source: HTMLElement, target: HTMLElement | null) => {
    if (!target || isSyncing.current) return;
    isSyncing.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => { isSyncing.current = false; });
  }, []);

  const handleBodyScroll = useCallback(() => {
    if (bodyScrollRef.current && headerScrollRef.current) {
      syncScroll(bodyScrollRef.current, headerScrollRef.current);
    }
  }, [syncScroll]);

  const handleHeaderScroll = useCallback(() => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      syncScroll(headerScrollRef.current, bodyScrollRef.current);
    }
  }, [syncScroll]);

  // ============================================================================
  // Two-Table Architecture: Shared Colgroup Generator
  // ============================================================================
  const renderColgroup = useCallback(() => {
    return (
      <colgroup>
        {/* Selection column */}
        <col style={{ width: `${SELECTION_COL_WIDTH}px`, minWidth: `${SELECTION_COL_WIDTH}px` }} />
        {/* Data columns */}
        {columns.map(col => {
          const meta = col.meta as ColumnMeta | undefined;
          const width = meta?.width || 'auto';
          return <col key={col.id} style={{ width, minWidth: width }} />;
        })}
        {/* Actions column */}
        <col style={{ width: `${ACTIONS_COL_WIDTH}px`, minWidth: `${ACTIONS_COL_WIDTH}px` }} />
      </colgroup>
    );
  }, [columns]);

  // ============================================================================
  // Render: Two-Table Architecture
  // ============================================================================
  return (
    <div className={`rounded-xl ${className}`}>
      {/* Column group selector - role="tablist" for accessibility */}
      <div
        className="flex items-center gap-1 rounded-lg border border-stroke bg-surfaceAlt p-1 mb-3"
        role="tablist"
        aria-label="Column group selector"
      >
        {groupKeys.map((group, index) => (
          <button
            key={group}
            ref={el => { groupButtonRefs.current[index] = el; }}
            onClick={() => handleGroupChange(group)}
            onKeyDown={(e) => handleGroupKeyDown(e, index)}
            className={activeGroup === group
              ? 'rounded-md bg-surface px-3 py-1.5 text-body-sm font-medium text-ink shadow-sm'
              : 'rounded-md px-3 py-1.5 text-body-sm text-muted hover:text-ink'}
            role="tab"
            aria-selected={activeGroup === group}
            aria-pressed={activeGroup === group}
            tabIndex={activeGroup === group ? 0 : -1}
          >
            {group.charAt(0).toUpperCase() + group.slice(1)}
          </button>
        ))}
      </div>

      {/* TABLE 1: Sticky Header Table */}
      <div className={`sticky ${stickyHeaderTopClassName} z-20 bg-surface/95 backdrop-blur border-b border-stroke`}>
        <div
          ref={headerScrollRef}
          className="overflow-x-auto scrollbar-hide"
          onScroll={handleHeaderScroll}
        >
          <table className="w-full text-data leading-4" aria-hidden="true">
            {renderColgroup()}
            <thead className="border-b border-stroke">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {/* Selection header (visual only - checkbox disabled in header table) */}
                  <th
                    className="px-2.5 py-2 text-left"
                    style={{ width: SELECTION_COL_WIDTH, minWidth: SELECTION_COL_WIDTH }}
                    scope="col"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.length && data.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                      aria-label="Select all REITs"
                    />
                  </th>

                  {/* Column headers with sort indicators */}
                  {headerGroup.headers.map(header => {
                    const meta = getColumnMeta(header.column.id);
                    const isSorted = sort.field === header.column.id;
                    const sortHandler = header.column.getToggleSortingHandler();

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={`px-2.5 py-2 font-semibold text-ink cursor-pointer hover:bg-surfaceAlt transition-colors ${
                          meta.align === 'right' ? 'text-right' : meta.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                        style={{ width: meta.width, minWidth: meta.width }}
                        onClick={sortHandler}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && sortHandler) {
                            e.preventDefault();
                            sortHandler(e);
                          }
                        }}
                        tabIndex={0}
                        aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <div
                          className="flex items-center gap-1"
                          style={{ justifyContent: meta.align === 'right' ? 'flex-end' : meta.align === 'center' ? 'center' : 'flex-start' }}
                        >
                          <span className="whitespace-nowrap">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {/* Sort indicator */}
                          {isSorted && (
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
                    );
                  })}

                  {/* Actions header */}
                  <th
                    className="px-2.5 py-2 text-center"
                    style={{ width: ACTIONS_COL_WIDTH, minWidth: ACTIONS_COL_WIDTH }}
                    scope="col"
                  >
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
          </table>
        </div>
      </div>

      {/* TABLE 2: Scrollable Body Table */}
      <div
        ref={bodyScrollRef}
        className="overflow-x-auto"
        onScroll={handleBodyScroll}
      >
        <table className="w-full text-data leading-4" role="grid" aria-label="REIT data table">
          {renderColgroup()}
          {/* Visually hidden thead for accessibility */}
          <thead className="sr-only">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <th scope="col">Select</th>
                {headerGroup.headers.map(header => (
                  <th key={header.id} scope="col">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th scope="col">Actions</th>
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stroke [&_td]:px-2.5 [&_td]:py-2 [&_th]:px-2.5 [&_th]:py-2">
            {table.getRowModel().rows.map(row => {
              const entityData = row.original;
              const entity = entityData.entity;
              const isSelected = selectedIds.includes(entity.id);
              const isHovered = hoveredRow === entity.id;

              return (
                <tr
                  key={entity.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-primary-50' : isHovered ? 'bg-surfaceAlt' : 'bg-surface'
                  }`}
                  onMouseEnter={() => setHoveredRow(entity.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  role="row"
                  aria-selected={isSelected}
                >
                  {/* Selection cell */}
                  <td className="px-2.5 py-2" role="gridcell">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelect(entity.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(entity.id);
                        }
                      }}
                      className="rounded border-gray-300"
                      aria-label={`Select ${entity.name}`}
                    />
                  </td>

                  {/* Data cells */}
                  {row.getVisibleCells().map(cell => {
                    const meta = getColumnMeta(cell.column.id);
                    return (
                      <td
                        key={cell.id}
                        className={`px-2.5 py-2 ${
                          meta.align === 'right' ? 'text-right' : meta.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                        role="gridcell"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}

                  {/* Actions cell */}
                  <td className="px-2.5 py-2" role="gridcell">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/entity/${entity.code}`}
                        className="text-primary-600 hover:text-primary-800 text-body-sm font-medium"
                      >
                        View
                      </Link>
                      <span className="text-muted">|</span>
                      <Link
                        href={`/compare?entities=${entity.code}`}
                        className="text-muted hover:text-ink text-body-sm font-medium"
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
      </div>

      {data.length === 0 && (
        <div className="p-8 text-center text-muted">
          No REITs match the current filters.
        </div>
      )}
    </div>
  );
}

// Export column count for verification (data columns + select + actions)
export const ENTITY_TABLE_TANSTACK_COLUMN_COUNT = 33 + 2;

export default EntityTableTanStack;
