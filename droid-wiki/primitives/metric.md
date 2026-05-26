# Metric Primitive

The `Metric` type represents a single quantified fact about a REIT — everything from DPU (Distribution Per Unit) to gearing ratio to occupancy rates. Metrics are strongly typed with units, formats, and semantic meaning.

## Purpose

Metrics provide the numerical foundation for comparison, ranking, and analysis. Each metric links to source citations and carries metadata about its period, quality, and estimation status.

## Type Definition

### Core Metric Schema

**File:** `src/types/schema.ts` (lines 82-165)

```typescript
export const MetricValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.null()
]);

export const MetricSchema = z.object({
  id: z.string().uuid(),
  metricType: z.enum([
    // Portfolio metrics
    'portfolio_size',
    'total_assets',
    'investment_properties',
    'property_count',
    'net_lettable_area',
    'geographic_concentration',
    
    // Financial metrics
    'gross_revenue',
    'net_property_income',
    'realised_income',
    'net_profit',
    'profit_after_tax',
    'nav_per_unit',
    'market_cap',
    'share_price',
    
    // Per-share metrics
    'dpu',
    'dpu_growth_yoy',
    'dividend_yield_market',
    'dividend_yield_nav',
    'payout_ratio',
    'total_distribution',
    
    // Leverage metrics
    'gearing_ratio',
    'interest_coverage',
    'total_borrowings',
    'fixed_rate_debt_pct',
    'floating_rate_debt_pct',
    'wacd',
    
    // Operational metrics
    'occupancy_rate',
    'wale_years',
    'tenant_count',
    'top_tenant_concentration',
    'rental_reversion',
    'lease_renewal_rate',
    'npi_margin',
    
    // Risk metrics
    'tenant_risk_rating',
    'interest_rate_sensitivity',
    'refinancing_risk',
    'gearing_headroom',

    // Geographic revenue breakdown
    'revenue_australia_pct',
    'revenue_malaysia_pct',
    'revenue_japan_pct',
    'revenue_australia',
    'revenue_malaysia',
    'revenue_japan',

    // KLCC-specific metrics
    'reit_segment_revenue',
    'cost_of_debt',
    'occupancy_rate_retail',
    'wale_years_retail',
    'hotel_occupancy',
    'hotel_adr',
    'hotel_revpar',

    // Market metrics
    'price_to_book',
    'premium_discount_to_nav'
  ]),
  value: MetricValueSchema,
  unit: z.string().optional(),
  period: z.object({
    type: z.enum(['point_in_time', 'fiscal_year', 'quarter', 'trailing_twelve_months']),
    fiscalYear: z.number().int().optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),
  isEstimated: z.boolean().default(false),
  isTimeSensitive: z.boolean().default(false),
  sourceDisplayIds: z.array(z.string().regex(/^([TAPSUICHLKRDY]:\d+|KIP:\d+|SE:\d+|AF:\d+|To:\d+)$/))
});

export type Metric = z.infer<typeof MetricSchema>;
export type MetricType = z.infer<typeof MetricSchema.shape.metricType>;
```

## Metric Registry

**File:** `src/types/metric.ts`

The metric registry provides rich metadata for each metric type:

```typescript
export interface MetricDefinition {
  type: MetricType;
  category: MetricCategory;
  displayName: string;
  description: string;
  unit: string;
  format: MetricFormat;
  isHigherBetter: boolean | null;
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
```

## Metric Categories

### Portfolio Metrics (7)

| Metric | Display Name | Unit | Format |
|--------|-------------|------|--------|
| `portfolio_size` | Portfolio Size | properties | count |
| `total_assets` | Total Assets | RM million | currency |
| `investment_properties` | Investment Properties | RM million | currency |
| `property_count` | Property Count | properties | count |
| `net_lettable_area` | Net Lettable Area | sq ft | number |
| `geographic_concentration` | Geographic Concentration | % | percentage |

### Financial Performance Metrics (7)

| Metric | Display Name | Unit | Format |
|--------|-------------|------|--------|
| `gross_revenue` | Gross Revenue | RM million | currency |
| `net_property_income` | Net Property Income (NPI) | RM million | currency |
| `realised_income` | Realised Income | RM million | currency |
| `net_profit` | Net Profit | RM million | currency |
| `profit_after_tax` | Profit After Tax | RM million | currency |
| `nav_per_unit` | NAV per Unit | RM | currency |
| `market_cap` | Market Capitalization | RM million | currency |

### Per-Share Metrics (6)

| Metric | Display Name | Unit | Format |
|--------|-------------|------|--------|
| `dpu` | Distribution Per Unit (DPU) | sen | number |
| `dpu_growth_yoy` | DPU Growth (YoY) | % | percentage |
| `dividend_yield_market` | Dividend Yield (Market) | % | percentage |
| `dividend_yield_nav` | Dividend Yield (NAV-based) | % | percentage |
| `payout_ratio` | Payout Ratio | % | percentage |
| `total_distribution` | Total Distribution | RM million | currency |

### Leverage Metrics (6)

| Metric | Display Name | Unit | Format | isHigherBetter |
|--------|-------------|------|--------|----------------|
| `gearing_ratio` | Gearing Ratio | % | percentage | false |
| `interest_coverage` | Interest Coverage Ratio | x | ratio | true |
| `total_borrowings` | Total Borrowings | RM million | currency | false |
| `fixed_rate_debt_pct` | Fixed-Rate Debt % | % | percentage | true |
| `floating_rate_debt_pct` | Floating-Rate Debt % | % | percentage | false |
| `wacd` | Weighted Average Cost of Debt | % | percentage | false |

### Operational Metrics (7)

| Metric | Display Name | Unit | Format |
|--------|-------------|------|--------|
| `occupancy_rate` | Occupancy Rate | % | percentage |
| `wale_years` | WALE | years | years |
| `tenant_count` | Tenant Count | tenants | count |
| `top_tenant_concentration` | Top Tenant Concentration | % | percentage |
| `rental_reversion` | Rental Reversion | % | percentage |
| `lease_renewal_rate` | Lease Renewal Rate | % | percentage |
| `npi_margin` | NPI Margin | % | percentage |

### Market Metrics (2)

| Metric | Display Name | Unit | Format |
|--------|-------------|------|--------|
| `price_to_book` | Price-to-Book Ratio | x | ratio |
| `premium_discount_to_nav` | Premium/Discount to NAV | % | percentage |

## Usage in Codebase

### Frontend Components

**MetricCard** (`frontend/components/MetricCard.tsx`):

```typescript
interface MetricCardProps {
  metric: Metric;
  entityName: string;
  entityColor: string;
  onClick?: (citationIds: string[]) => void;
  showComparison?: boolean;
  comparisonValue?: number | string | boolean | null;
}
```

The card uses `METRIC_REGISTRY` to look up display names, units, and benchmark ranges:

```typescript
const definition = METRIC_REGISTRY[metric.metricType];
const formattedValue = formatMetricValue(
  metric.value,
  definition?.format || 'number',
  definition?.unit || metric.unit
);
```

### Adapter Pattern

Adapters construct metrics with proper citation linking:

```typescript
// From atrium-adapter.ts
metrics.push({
  id: linker.generateUuid(),
  metricType: 'dpu',
  value: 2.20,
  unit: 'sen',
  period: {
    type: 'fiscal_year',
    fiscalYear: 2024
  },
  sourceDisplayIds: ['T:1']  // Links to reference
});
```

### Registry Helpers

**File:** `src/types/metric.ts` (lines 580-605)

```typescript
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
  // ... type-specific validation
}
```

## Benchmark Ranges

Many metrics define benchmark ranges for percentile calculations:

```typescript
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
}
```

These ranges enable:
- **Percentile bars** in entity cards
- **Color coding** (green/yellow/red based on position in range)
- **Peer comparison** visualizations

## Data Quality Indicators

Metrics carry quality metadata:

| Field | Meaning |
|-------|---------|
| `isEstimated` | Value is derived or approximated |
| `isTimeSensitive` | Value may change rapidly (market data) |
| `sourceDisplayIds` | Citations backing this fact |

The frontend shows visual indicators for these states:

```tsx
{metric.isTimeSensitive && (
  <span className="text-warning-500" title="Time-sensitive data">
    {/* Warning icon */}
  </span>
)}
{metric.isEstimated && (
  <span className="text-body-sm text-neutral-400 italic">
    est.
  </span>
)}
```

## Related Primitives

- [Entity](./entity.md) — Metrics belong to entities
- [References](./references.md) — Metrics cite sources
- [TimeSeries](./entity.md#timeseries) — Historical metric sequences
