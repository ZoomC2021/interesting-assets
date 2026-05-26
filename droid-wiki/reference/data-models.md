# Data models

Core data structures and schema definitions.

## Normalized Data Structure

The `NormalizedReitData` interface represents the canonical output format consumed by the frontend.

```typescript
interface NormalizedReitData {
  schemaVersion: string;      // '1.0'
  generatedAt: string;        // ISO timestamp
  entity: Entity;             // REIT metadata
  references: Reference[];    // Citations
  metrics: Metric[];          // Financial metrics
  timeSeries: TimeSeries[];   // Historical data
  riskAssessment: RiskAssessment;
  observations: Observation[];
}
```

Defined in: `src/types/schema.ts` (lines 233-242)

## Core Entities

### Entity

REIT metadata and corporate information.

```typescript
interface Entity {
  id: string;                    // UUID
  code: string;                  // Stock code (e.g., '5130.KL')
  name: string;                  // Full legal name
  exchange: string;              // 'Bursa Malaysia'
  sector: string;                // 'Industrial', 'Retail', etc.
  currency: string;              // 'MYR'
  isShariahCompliant: boolean;
  listingDate?: string;            // YYYY-MM-DD
  manager: {
    name: string;
    ownershipStructure?: string;
    controllingShareholder?: string;
    managementTeam?: { ... };
    boardSize?: number;
    independentDirectors?: number;
  };
  trustee: string;
  fiscalYearEnd: { month: number; day: number };
  references: string[];          // UUIDs of related references
}
```

### Metric

Quantifiable measurements with units and periods.

```typescript
interface Metric {
  id: string;                    // UUID
  metricType: MetricType;        // 40+ enum values
  value: number | string | boolean | null;
  unit?: string;                 // 'RM million', '%', 'sen', etc.
  period: {
    type: 'point_in_time' | 'fiscal_year' | 'quarter' | 'trailing_twelve_months';
    fiscalYear?: number;
    quarter?: number;
    date?: string;               // YYYY-MM-DD
  };
  isEstimated: boolean;
  isTimeSensitive: boolean;
  sourceDisplayIds: string[];    // ['T:1', 'T:2']
}
```

### TimeSeries

Historical metric data points.

```typescript
interface TimeSeries {
  id: string;
  entityId: string;              // UUID
  metricType: MetricType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  unit: string;
  dataPoints: TimeSeriesPoint[];
  sourceDisplayIds: string[];
}

interface TimeSeriesPoint {
  date: string;                  // YYYY-MM-DD
  value: number | string | boolean | null;
  isInterpolated: boolean;
  sourceDisplayId?: string;      // e.g., 'T:1'
}
```

### RiskAssessment

Risk analysis with factors and peer comparison.

```typescript
interface RiskAssessment {
  id: string;
  entityId: string;
  assessmentDate: string;        // YYYY-MM-DD
  overallRiskRating: 'low' | 'moderate' | 'moderate_high' | 'high';
  overallScore?: number;
  riskFactors: RiskFactor[];
  peerComparison?: {
    vsPeerId: string;            // UUID
    relativeRisk: 'lower' | 'similar' | 'higher';
    keyDifferences: string[];
  };
}

interface RiskFactor {
  category: RiskCategory;        // 14 enum values
  severity: 'very_low' | 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  description: string;
  currentScore?: number;
  peerComparison?: 'better' | 'similar' | 'worse';
  quantitativeBacking?: { metricType: string; value: number | string; context: string }[];
  mitigatingFactors: { factor: string; impact: 'significant' | 'moderate' | 'minor' }[];
  aggravatingFactors: { factor: string; impact: 'significant' | 'moderate' | 'minor' }[];
  trend?: 'improving' | 'stable' | 'deteriorating' | 'unknown';
  monitoringTriggers?: string[];
  sourceDisplayIds: string[];
}
```

### Observation

Qualitative insights derived from metrics.

```typescript
interface Observation {
  id: string;
  entityId: string;
  observationType: ObservationType;  // 13 enum values
  content: string;                    // Full text
  summary?: string;
  priority: 'info' | 'positive' | 'warning' | 'critical';
  keyFacts?: { label: string; value: string | number; unit?: string }[];
  indicator?: { icon: string; color: string; badge?: string };
  relatedMetrics?: { metricType: string; value?: string | number; context?: string }[];
  relatedRisks?: { category: string; severity?: string }[];
  primaryCitation?: string;
  sourceDisplayIds: string[];
}
```

### Reference

Citations linking facts to source documents.

```typescript
interface Reference {
  id: string;                    // UUID
  displayId: string;               // 'T:1', 'A:42'
  fact: string;                  // The factual claim
  source: string;                // Source key (e.g., 'AR2025')
  citation: string;              // Full citation text
  url?: string;
  dateAccessed: string;          // YYYY-MM
  timeSensitive: boolean;
  entityId: string;              // UUID
}
```

## Zod Schemas

Runtime validation schemas mirror the TypeScript interfaces.

```typescript
export const EntitySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  // ...
});

export const MetricSchema = z.object({
  id: z.string().uuid(),
  metricType: z.enum([/* 40+ values */]),
  value: z.union([z.number(), z.string(), z.boolean(), z.null()]),
  // ...
});
```

Full schemas: `src/types/schema.ts` (lines 26-180)

## Metric Types Enum

40+ metric types organized by category:

| Category | Types |
|----------|-------|
| Portfolio | `portfolio_size`, `total_assets`, `investment_properties`, `property_count`, `net_lettable_area`, `geographic_concentration` |
| Financial | `gross_revenue`, `net_property_income`, `realised_income`, `nav_per_unit`, `market_cap`, `share_price` |
| Per-Share | `dpu`, `dpu_growth_yoy`, `dividend_yield_market`, `dividend_yield_nav`, `payout_ratio` |
| Leverage | `gearing_ratio`, `interest_coverage`, `total_borrowings`, `fixed_rate_debt_pct`, `floating_rate_debt_pct`, `wacd` |
| Operational | `occupancy_rate`, `wale_years`, `tenant_count`, `top_tenant_concentration`, `rental_reversion`, `lease_renewal_rate`, `npi_margin` |
| Market | `price_to_book`, `premium_discount_to_nav` |
| Geographic Revenue | `revenue_australia_pct`, `revenue_malaysia_pct`, `revenue_japan_pct` |

## Key Source Files

| File | Purpose |
|------|---------|
| `src/types/schema.ts` | Core schemas and types |
| `src/types/reference.ts` | Reference and citation types |
| `src/types/risk.ts` | Risk factor types |
| `src/types/observation.ts` | Observation types |
| `src/types/entity.ts` | Entity extended types |
