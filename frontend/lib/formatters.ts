/**
 * Formatting utilities for financial data display
 */

import type { MetricDefinition, MetricFormat } from '@/types/frontend';

// ============================================================================
// Currency Formatting
// ============================================================================

export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'MYR',
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const absValue = Math.abs(value);
  let displayValue = value;
  let suffix = '';
  
  if (absValue >= 1e9) {
    displayValue = value / 1e9;
    suffix = 'B';
  } else if (absValue >= 1e6) {
    displayValue = value / 1e6;
    suffix = 'M';
  } else if (absValue >= 1e3) {
    displayValue = value / 1e3;
    suffix = 'K';
  }
  
  const formatted = displayValue.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${currency} ${formatted}${suffix}`;
}

export function formatRM(value: number | null | undefined, decimals: number = 2): string {
  return formatCurrency(value, 'RM', decimals);
}

export function formatRMShort(value: number | null | undefined): string {
  return formatCurrency(value, 'RM', 1);
}

// ============================================================================
// Percentage Formatting
// ============================================================================

export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  includeSign: boolean = false
): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const formatted = (value * 100).toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  if (includeSign && value > 0) {
    return `+${formatted}%`;
  }
  
  return `${formatted}%`;
}

// ============================================================================
// Ratio Formatting
// ============================================================================

export function formatRatio(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return `${value.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}x`;
}

// ============================================================================
// Number Formatting
// ============================================================================

export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return value.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toLocaleString('en-MY');
}

// ============================================================================
// Area Formatting
// ============================================================================

export function formatSqFt(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const absValue = Math.abs(value);
  if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M sq ft`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K sq ft`;
  }
  
  return `${value.toLocaleString('en-MY')} sq ft`;
}

// ============================================================================
// DPU Formatting (sen)
// ============================================================================

export function formatSen(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${value.toFixed(2)} sen`;
}

// ============================================================================
// Years Formatting
// ============================================================================

export function formatYears(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${value.toFixed(decimals)} years`;
}

// ============================================================================
// Generic Metric Formatter
// ============================================================================

export function formatMetricValue(
  value: number | string | boolean | null | undefined,
  format: MetricFormat,
  unit: string = ''
): string {
  if (value === null || value === undefined) return 'N/A';
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  switch (format) {
    case 'currency':
      // Metrics with unit 'RM million' / 'MYR million' are stored in millions
      // (e.g. total_assets = 16800 represents RM 16.8B). Scale to base units so
      // the auto K/M/B suffix in formatCurrency produces correct output.
      if (unit === 'RM million' || unit === 'MYR million') {
        return formatCurrency(value * 1e6, 'RM');
      }
      return formatCurrency(value, unit || 'RM');
    case 'percentage':
      // Percentage metrics are stored in percent units (e.g. 78 means 78%),
      // but formatPercentage multiplies by 100 (it expects a ratio). Normalize
      // here so callers passing metric values display correctly.
      return formatPercentage(value / 100);
    case 'ratio':
      return formatRatio(value);
    case 'years':
      return formatYears(value);
    case 'count':
      return formatCount(value);
    case 'number':
      if (unit === 'sq ft' || unit === 'sqft') {
        return formatSqFt(value);
      }
      if (unit === 'sen') {
        return formatSen(value);
      }
      return formatNumber(value, 1);
    default:
      return String(value);
  }
}

// ============================================================================
// Date Formatting
// ============================================================================

export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
  });
}

// ============================================================================
// Change Indicator Formatting
// ============================================================================

export function formatChange(
  current: number | null | undefined,
  previous: number | null | undefined,
  format: MetricFormat = 'percentage'
): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return { text: 'N/A', isPositive: false, isNeutral: true };
  }
  
  const change = current - previous;
  const changePct = previous !== 0 ? (change / previous) : 0;
  
  let text: string;
  
  if (format === 'percentage') {
    text = formatPercentage(changePct, 1, true);
  } else if (format === 'currency') {
    const sign = change >= 0 ? '+' : '';
    text = `${sign}${formatRM(change)}`;
  } else {
    const sign = change >= 0 ? '+' : '';
    text = `${sign}${formatNumber(change, 2)}`;
  }
  
  return {
    text,
    isPositive: change > 0,
    isNeutral: change === 0,
  };
}
