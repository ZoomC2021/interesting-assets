/**
 * Data utilities for metric lookups and transformations
 */

import type {
  Metric,
  MetricType,
  MetricDefinition,
  MetricCategory,
  NormalizedReitData,
  EntityExtended,
} from '@/types/frontend';

// ============================================================================
// Metric Registry
// ============================================================================

export const METRIC_REGISTRY: Record<MetricType, MetricDefinition> = {
  // Portfolio Metrics
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
    isHigherBetter: null
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
    description: 'Concentration in primary region',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null
  },

  // Financial Performance Metrics
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
    displayName: 'Net Property Income',
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
    isHigherBetter: null
  },

  // Per-Share Metrics
  dpu: {
    type: 'dpu',
    category: 'per_share',
    displayName: 'Distribution Per Unit',
    description: 'Annual distribution/dividend per unit',
    unit: 'sen',
    format: 'number',
    isHigherBetter: true
  },
  dpu_growth_yoy: {
    type: 'dpu_growth_yoy',
    category: 'per_share',
    displayName: 'DPU Growth (YoY)',
    description: 'Year-over-year DPU percentage change',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true
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
    displayName: 'Dividend Yield (NAV)',
    description: 'DPU divided by NAV per unit',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true
  },
  payout_ratio: {
    type: 'payout_ratio',
    category: 'per_share',
    displayName: 'Payout Ratio',
    description: 'Distributions as percentage of realised income',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null
  },

  // Leverage Metrics
  gearing_ratio: {
    type: 'gearing_ratio',
    category: 'leverage',
    displayName: 'Gearing Ratio',
    description: 'Total borrowings as percentage of total assets',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false,
    benchmarkRange: { min: 20, typical: 35, max: 60 }
  },
  interest_coverage: {
    type: 'interest_coverage',
    category: 'leverage',
    displayName: 'Interest Coverage',
    description: 'Realised income divided by finance costs',
    unit: 'x',
    format: 'ratio',
    isHigherBetter: true,
    benchmarkRange: { min: 2, typical: 3.5, max: 10 }
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
    isHigherBetter: true
  },
  floating_rate_debt_pct: {
    type: 'floating_rate_debt_pct',
    category: 'leverage',
    displayName: 'Floating-Rate Debt %',
    description: 'Percentage of debt exposed to rate changes',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false
  },
  wacd: {
    type: 'wacd',
    category: 'leverage',
    displayName: 'Weighted Avg Cost of Debt',
    description: 'Blended interest rate on all borrowings',
    unit: '%',
    format: 'percentage',
    isHigherBetter: false
  },

  // Operational Metrics
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
    displayName: 'WALE',
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
    isHigherBetter: false
  },
  rental_reversion: {
    type: 'rental_reversion',
    category: 'operational',
    displayName: 'Rental Reversion',
    description: 'Average percentage change on lease renewals',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true
  },
  lease_renewal_rate: {
    type: 'lease_renewal_rate',
    category: 'operational',
    displayName: 'Lease Renewal Rate',
    description: 'Percentage of expiring leases renewed',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true
  },
  npi_margin: {
    type: 'npi_margin',
    category: 'operational',
    displayName: 'NPI Margin',
    description: 'NPI as percentage of gross revenue',
    unit: '%',
    format: 'percentage',
    isHigherBetter: true
  },

  // Risk Metrics
  tenant_risk_rating: {
    type: 'tenant_risk_rating',
    category: 'risk',
    displayName: 'Tenant Risk Rating',
    description: 'Qualitative assessment of tenant credit risk',
    unit: 'score',
    format: 'number',
    isHigherBetter: false
  },
  interest_rate_sensitivity: {
    type: 'interest_rate_sensitivity',
    category: 'risk',
    displayName: 'Interest Rate Sensitivity',
    description: 'Impact of rate change on finance costs',
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

  // Market Metrics
  price_to_book: {
    type: 'price_to_book',
    category: 'market',
    displayName: 'Price-to-Book',
    description: 'Share price divided by NAV per unit',
    unit: 'x',
    format: 'ratio',
    isHigherBetter: null
  },
  premium_discount_to_nav: {
    type: 'premium_discount_to_nav',
    category: 'market',
    displayName: 'Premium/Discount to NAV',
    description: 'Percentage deviation of price from NAV',
    unit: '%',
    format: 'percentage',
    isHigherBetter: null
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getMetricDefinition(type: MetricType): MetricDefinition | undefined {
  return METRIC_REGISTRY[type];
}

export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(METRIC_REGISTRY).filter(m => m.category === category);
}

export function getMetricValue(data: NormalizedReitData, metricType: MetricType): Metric | undefined {
  return data.metrics.find(m => m.metricType === metricType);
}

export function getMetricValueAsNumber(data: NormalizedReitData, metricType: MetricType): number | null {
  const metric = getMetricValue(data, metricType);
  if (!metric || metric.value === null) return null;
  return typeof metric.value === 'number' ? metric.value : null;
}

export function getAllMetricTypes(): MetricType[] {
  return Object.keys(METRIC_REGISTRY) as MetricType[];
}

export function getCategoryDisplayName(category: MetricCategory): string {
  const names: Record<MetricCategory, string> = {
    portfolio: 'Portfolio',
    financial_performance: 'Financial Performance',
    per_share: 'Per-Share Metrics',
    leverage: 'Leverage',
    operational: 'Operational',
    risk: 'Risk Assessment',
    market: 'Market Valuation',
  };
  return names[category];
}
