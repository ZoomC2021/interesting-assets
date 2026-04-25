'use client';

/**
 * EntityTable - Sortable table with 33 columns for desktop
 * Milestone 3: TanStack Table Migration Complete
 *
 * Architecture:
 * This component is now a thin wrapper over EntityTableTanStack, maintaining the same
 * props interface for backward compatibility while delegating to the full-featured
 * TanStack Table implementation.
 *
 * TanStack Integration Approach:
 * - EntityTableTanStack.tsx contains the full TanStack Table implementation
 * - This file provides a stable public API and re-exports types
 * - All features (sorting, selection, column groups) are handled by TanStack
 * - Zero breaking changes for consumers of this component
 *
 * Migration Benefits:
 * - Improved performance via memoization and optimized re-renders
 * - Better accessibility (ARIA attributes, keyboard navigation)
 * - Cleaner code architecture with clear separation of concerns
 * - Foundation for future features (virtualization, advanced filtering)
 */

import React from 'react';
import { EntityTableTanStack, type SortField } from './EntityTableTanStack';
import type { NormalizedReitData, MetricType } from '@/types/frontend';
import type { EntityBenchmarkComparison } from '@/lib/benchmark-calculations';

// ============================================================================
// Types (re-exported for backward compatibility)
// ============================================================================

export type { SortField };
export type SortDirection = 'asc' | 'desc';

export interface SortState {
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
  /** className for `thead` `sticky` `top` (default stacks below Monitor header + FilterBar) */
  stickyHeaderTopClassName?: string;
  onCitationClick?: (entityId: string, citationIds: string[]) => void;
}

/** Sticky thead offset: app bar (`h-12`) + FilterBar — see FilterBar. */
const TABLE_HEAD_STICKY_TOP = 'top-28';

// ============================================================================
// Main Component
// ============================================================================

/**
 * EntityTable - Full-featured table with all 33 columns
 *
 * Features (delegated to EntityTableTanStack):
 * - All 33 columns with proper formatting and data quality indicators
 * - Column group selector (All, Essentials, Valuation, Dividend, Income, Portfolio, Leverage, Risk)
 * - Sorting with click-to-sort and visual indicators (▲▼)
 * - Row selection with checkboxes and keyboard navigation
 * - Citation count buttons with hover effects
 * - Sparkline charts in DPU column
 * - Risk badges
 * - Sticky headers with responsive behavior
 * - Hover states (bg-surfaceAlt, bg-primary-50 when selected)
 * - Full ARIA support (aria-sort, aria-selected, aria-pressed)
 * - Keyboard navigation (Arrow keys, Enter/Space, Tab)
 */
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
  stickyHeaderTopClassName = TABLE_HEAD_STICKY_TOP,
  onCitationClick,
}: EntityTableProps) {
  // Delegate to the full-featured TanStack implementation
  return (
    <EntityTableTanStack
      data={data}
      comparisons={comparisons}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      sort={sort}
      onSort={onSort}
      dpuHistories={dpuHistories}
      className={className}
      stickyHeaderTopClassName={stickyHeaderTopClassName}
      onCitationClick={onCitationClick}
    />
  );
}

// Export column count for verification (data columns + select + actions)
export const ENTITY_TABLE_COLUMN_COUNT = 33 + 2;

export default EntityTable;
