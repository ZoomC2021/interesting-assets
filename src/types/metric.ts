/**
 * Metric Registry and Definitions
 * 
 * Central registry of all 30+ identifiable metrics that can be represented
 * in the normalized schema, including:
 * - Portfolio metrics
 * - Financial performance metrics
 * - Per-share metrics
 * - Leverage and debt metrics
 * - Operational metrics
 * - Risk assessment metrics
 * - Market valuation metrics
 */

import { MetricType } from './schema';

// ============================================================================
// Metric Metadata
// ============================================================================

export interface MetricDefinition {
  type: MetricType;
  category: MetricCategory;
  displayName: string;
  description: string;
  unit: string;
  format: MetricFormat;
  isHigherBetter: boolean | null; // null for neutral metrics
  benchmarkRange?: {
    min?: number;
    max?: number;
    typical?: number;
  };
  relatedMetricTypes?: MetricType[];
}

export type MetricCategory =
  | 'portfolio'
  | 'financial_performance'
  | 'per_share'
  | 'leverage'
  | 'operational'
  | 'risk'
  | 'market';

export type MetricFormat =
  | 'number'
  | 'percentage'
  | 'currency'
  | 'ratio'
  | 'years'
  | 'count'
  | 'boolean'
  | 'string';

// ============================================================================
// Metric Registry (30+ Metrics)
// ============================================================================

export const METRIC_REGISTRY: Record<MetricType, MetricDefinition> = {
  // Portfolio Metrics (7)
  portfolio_size: {
    type: 'portfolio_size',
    category: 'portfolio',
    displayName: 'Portfolio Size',
    description: 'Total number of properties in the REIT portfolio',
    unit: 'properties',
    format: 'count',
    isHigherBetter: null,
    benchmarkRange: { min: 5, typical: 50, max: 200 }
  },
  total_assets: {
    type: 'total_assets',
    category: 'portfolio',
    displayName: 'Total Assets',
    description: 'Total assets under management',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: null
  },
  investment_properties: {
    type: 'investment_properties',
    category: 'portfolio',
    displayName: 'Investment Properties',
    description: 'Value of income-generating investment properties',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: true
  },
  property_count: {
    type: 'property_count',
    category: 'portfolio',
    displayName: 'Property Count',
    description: 'Number of individual properties',
    unit: 'properties',
    format: 'count',
    isHigherBetter: null,
    benchmarkRange: { min: 5, typical: 50, max: 200 }
  },
  net_lettable_area: {
    type: 'net_lettable_area',
    category: 'portfolio',
    displayName: 'Net Lettable Area',
    description: 'Total rentable square footage',
    unit: 'sq ft',
    format: 'number',
    isHigherBetter: true
  },
  geographic_concentration: {
    type: 'geographic_concentration',
    category: 'portfolio',
    displayName: 'Geographic Concentration',
    description: 'Concentration in primary region (e.g., Klang Valley %)',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null,
    benchmarkRange: { min: 30, typical: 60, max: 100 }
  },

  // Financial Performance Metrics (7)
  gross_revenue: {
    type: 'gross_revenue',
    category: 'financial_performance',
    displayName: 'Gross Revenue',
    description: 'Total rental and other income',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: true
  },
  net_property_income: {
    type: 'net_property_income',
    category: 'financial_performance',
    displayName: 'Net Property Income (NPI)',
    description: 'Revenue minus property operating expenses',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: true
  },
  realised_income: {
    type: 'realised_income',
    category: 'financial_performance',
    displayName: 'Realised Income',
    description: 'Income available for distribution',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: true
  },
  net_profit: {
    type: 'net_profit',
    category: 'financial_performance',
    displayName: 'Net Profit',
    description: 'Accounting net profit after all expenses',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: true
  },
  nav_per_unit: {
    type: 'nav_per_unit',
    category: 'financial_performance',
    displayName: 'NAV per Unit',
    description: 'Net asset value divided by units outstanding',
    unit: 'RM',
    format: 'currency',
    isHigherBetter: true
  },
  market_cap: {
    type: 'market_cap',
    category: 'financial_performance',
    displayName: 'Market Capitalization',
    description: 'Market value of equity',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: null
  },
  share_price: {
    type: 'share_price',
    category: 'financial_performance',
    displayName: 'Share Price',
    description: 'Current trading price per unit',
    unit: 'RM',
    format: 'currency',
    isHigherBetter: null,
    relatedMetricTypes: ['price_to_book', 'dividend_yield_market']
  },

  // Per-Share Metrics (5)
  dpu: {
    type: 'dpu',
    category: 'per_share',
    displayName: 'Distribution Per Unit (DPU)',
    description: 'Annual distribution/dividend per unit',
    unit: 'sen',
    format: 'number',
    isHigherBetter: true,
    relatedMetricTypes: ['dividend_yield_market', 'dividend_yield_nav']
  },
  dpu_growth_yoy: {
    type: 'dpu_growth_yoy',
    category: 'per_share',
    displayName: 'DPU Growth (YoY)',
    description: 'Year-over-year DPU percentage change',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: -20, typical: 5, max: 30 }
  },
  dividend_yield_market: {
    type: 'dividend_yield_market',
    category: 'per_share',
    displayName: 'Dividend Yield (Market)',
    description: 'DPU divided by current share price',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 3, typical: 6, max: 10 }
  },
  dividend_yield_nav: {
    type: 'dividend_yield_nav',
    category: 'per_share',
    displayName: 'Dividend Yield (NAV-based)',
    description: 'DPU divided by NAV per unit',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 3, typical: 6, max: 10 }
  },
  payout_ratio: {
    type: 'payout_ratio',
    category: 'per_share',
    displayName: 'Payout Ratio',
    description: 'Distributions as percentage of realised income',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null,
    benchmarkRange: { min: 50, typical: 90, max: 100 }
  },

  // Leverage Metrics (6)
  gearing_ratio: {
    type: 'gearing_ratio',
    category: 'leverage',
    displayName: 'Gearing Ratio',
    description: 'Total borrowings as percentage of total assets',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false,
    benchmarkRange: { min: 20, typical: 35, max: 60 },
    relatedMetricTypes: ['interest_coverage']
  },
  interest_coverage: {
    type: 'interest_coverage',
    category: 'leverage',
    displayName: 'Interest Coverage Ratio',
    description: 'Realised income divided by finance costs',
    unit: 'x',
    format: 'ratio',
    isHigherBetter: true,
    benchmarkRange: { min: 2, typical: 3.5, max: 10 },
    relatedMetricTypes: ['gearing_ratio']
  },
  total_borrowings: {
    type: 'total_borrowings',
    category: 'leverage',
    displayName: 'Total Borrowings',
    description: 'Total debt outstanding',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: false
  },
  fixed_rate_debt_pct: {
    type: 'fixed_rate_debt_pct',
    category: 'leverage',
    displayName: 'Fixed-Rate Debt %',
    description: 'Percentage of debt at fixed interest rates',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 0, typical: 50, max: 100 }
  },
  floating_rate_debt_pct: {
    type: 'floating_rate_debt_pct',
    category: 'leverage',
    displayName: 'Floating-Rate Debt %',
    description: 'Percentage of debt exposed to rate changes',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false,
    benchmarkRange: { min: 0, typical: 50, max: 100 }
  },
  wacd: {
    type: 'wacd',
    category: 'leverage',
    displayName: 'Weighted Average Cost of Debt',
    description: 'Blended interest rate on all borrowings',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false,
    benchmarkRange: { min: 2, typical: 4, max: 8 }
  },

  // Operational Metrics (7)
  occupancy_rate: {
    type: 'occupancy_rate',
    category: 'operational',
    displayName: 'Occupancy Rate',
    description: 'Percentage of NLA leased and paying rent',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 85, typical: 95, max: 100 }
  },
  wale_years: {
    type: 'wale_years',
    category: 'operational',
    displayName: 'WALE (Weighted Avg Lease Expiry)',
    description: 'Average lease duration weighted by rental income',
    unit: 'years',
    format: 'years',
    isHigherBetter: true,
    benchmarkRange: { min: 2, typical: 4, max: 10 }
  },
  tenant_count: {
    type: 'tenant_count',
    category: 'operational',
    displayName: 'Tenant Count',
    description: 'Number of tenants in portfolio',
    unit: 'tenants',
    format: 'count',
    isHigherBetter: true
  },
  top_tenant_concentration: {
    type: 'top_tenant_concentration',
    category: 'operational',
    displayName: 'Top Tenant Concentration',
    description: 'Revenue percentage from top tenant(s)',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false,
    benchmarkRange: { min: 5, typical: 20, max: 50 }
  },
  rental_reversion: {
    type: 'rental_reversion',
    category: 'operational',
    displayName: 'Rental Reversion',
    description: 'Average percentage change on lease renewals',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: -10, typical: 5, max: 20 }
  },
  lease_renewal_rate: {
    type: 'lease_renewal_rate',
    category: 'operational',
    displayName: 'Lease Renewal Rate',
    description: 'Percentage of expiring leases renewed',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 50, typical: 75, max: 100 }
  },
  npi_margin: {
    type: 'npi_margin',
    category: 'operational',
    displayName: 'NPI Margin',
    description: 'NPI as percentage of gross revenue',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true,
    benchmarkRange: { min: 70, typical: 87, max: 95 }
  },

  // Risk Metrics (3)
  tenant_risk_rating: {
    type: 'tenant_risk_rating',
    category: 'risk',
    displayName: 'Tenant Risk Rating',
    description: 'Qualitative assessment of tenant credit risk',
    unit: 'score',
    format: 'number',
    isHigherBetter: false,
    benchmarkRange: { min: 1, typical: 3, max: 5 }
  },
  interest_rate_sensitivity: {
    type: 'interest_rate_sensitivity',
    category: 'risk',
    displayName: 'Interest Rate Sensitivity',
    description: 'Impact of +25bps rate change on finance costs',
    unit: 'RM million',
    format: 'currency',
    isHigherBetter: false
  },
  refinancing_risk: {
    type: 'refinancing_risk',
    category: 'risk',
    displayName: 'Refinancing Risk',
    description: 'Assessment of near-term refinancing needs',
    unit: 'score',
    format: 'string',
    isHigherBetter: false
  },

  // Market Metrics (2)
  price_to_book: {
    type: 'price_to_book',
    category: 'market',
    displayName: 'Price-to-Book Ratio',
    description: 'Share price divided by NAV per unit',
    unit: 'x',
    format: 'ratio',
    isHigherBetter: null,
    benchmarkRange: { min: 0.5, typical: 1.0, max: 1.5 }
  },
  premium_discount_to_nav: {
    type: 'premium_discount_to_nav',
    category: 'market',
    displayName: 'Premium/Discount to NAV',
    description: 'Percentage deviation of price from NAV',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null,
    benchmarkRange: { min: -30, typical: 0, max: 30 }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getMetricDefinition(type: MetricType): MetricDefinition {
  return METRIC_REGISTRY[type];
}

export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(METRIC_REGISTRY).filter(m => m.category === category);
}

export function getAllMetricTypes(): MetricType[] {
  return Object.keys(METRIC_REGISTRY) as MetricType[];
}

export function validateMetricValue(type: MetricType, value: unknown): boolean {
  const definition = METRIC_REGISTRY[type];
  if (!definition) return false;

  switch (definition.format) {
    case 'number':
    case 'currency':
    case 'ratio':
    case 'years':
    case 'count':
      return typeof value === 'number' && !isNaN(value);
    case 'percentage':
      return typeof value === 'number' && !isNaN(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}
