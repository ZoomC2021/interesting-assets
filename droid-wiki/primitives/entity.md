# Entity Primitive

The `Entity` type represents a Real Estate Investment Trust (REIT) in the Malaysian market. It combines structural metadata, management details, and regulatory information.

## Purpose

Entities are the root object in the data model. Every metric, time series, observation, and risk assessment links back to an entity via its UUID. The entity code (e.g., `5130.KL`) provides a stable external identifier.

## Type Definition

### Core Entity Schema

**File:** `src/types/schema.ts` (lines 42-73)

```typescript
export const EntitySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),           // e.g., "5130.KL"
  name: z.string().min(1),         // e.g., "Atrium Real Estate Investment Trust"
  exchange: z.string().min(1),     // e.g., "Bursa Malaysia"
  sector: z.string().min(1),         // e.g., "Industrial REIT"
  currency: z.string().default('MYR'),
  isShariahCompliant: z.boolean(),
  isStapledSecurity: z.boolean().optional(),
  listingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  manager: z.object({
    name: z.string().min(1),
    ownershipStructure: z.string().optional(),
    controllingShareholder: z.string().optional(),
    managementTeam: z.object({
      chairman: z.string().optional(),
      managingDirector: z.string().optional(),
      ceo: z.string().optional(),
      cfo: z.string().optional()
    }).optional(),
    boardSize: z.number().optional(),
    independentDirectors: z.number().optional(),
    baseManagementFee: z.number().optional(),
    performanceFee: z.number().optional()
  }),
  
  trustee: z.string().min(1),
  
  fiscalYearEnd: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31)
  }),
  
  references: z.array(z.string().uuid())
});

export type Entity = z.infer<typeof EntitySchema>;
```

### Extended Entity Schema

**File:** `src/types/entity.ts` (lines 98-145)

The extended schema adds portfolio and management depth:

```typescript
export const EntityExtendedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  exchange: z.string().min(1),
  sector: z.string().min(1),
  currency: z.string().default('MYR'),
  isShariahCompliant: z.boolean(),
  listingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  yearsListed: z.number().int().min(0).optional(),
  
  // Enhanced management structure
  manager: z.object({
    name: z.string().min(1),
    ownershipStructure: z.string().optional(),
    controllingShareholder: z.string().optional(),
    controllingOwnershipPct: z.number().min(0).max(100).optional(),
    executives: z.array(ExecutiveSchema),
    boardSize: z.number().int().positive(),
    independentDirectors: z.number().int().nonnegative(),
    independentDirectorPct: z.number().min(0).max(100),
    committees: z.array(BoardCommitteeSchema),
    feeStructure: FeeStructureSchema
  }),
  
  trustee: z.string().min(1),
  
  fiscalYearEnd: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31)
  }),
  
  // Portfolio composition
  portfolio: z.object({
    totalProperties: z.number().int().nonnegative(),
    totalAssetsRM: z.number().positive(),
    investmentPropertiesRM: z.number().positive(),
    netLettableAreaSqFt: z.number().positive().optional(),
    geographicDistribution: z.array(GeographicDistributionSchema),
    properties: z.array(PropertySchema)
  }),
  
  references: z.array(z.string().uuid())
});
```

## Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Internal stable identifier |
| `code` | string | Stock ticker (e.g., `5130.KL`) |
| `name` | string | Full legal name |
| `exchange` | string | Exchange where listed |
| `sector` | string | REIT category (Retail, Industrial, etc.) |
| `isShariahCompliant` | boolean | Shariah compliance status |
| `manager` | object | REIT manager details and fees |
| `trustee` | string | Trustee entity name |
| `fiscalYearEnd` | object | Month/day of fiscal year end |
| `references` | UUID[] | Linked citation references |

## Related Types

### Property

**File:** `src/types/entity.ts` (lines 27-57)

Individual properties in the REIT portfolio:

```typescript
export const PropertySchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  name: z.string().min(1),
  shortCode: z.string().optional(),
  location: z.object({
    city: z.string().min(1),
    state: z.string().min(1),
    region: z.enum(['klang_valley', 'johor', 'penang', 'kedah', 'pahang', 'other'])
  }),
  propertyType: PropertyTypeSchema,
  netLettableAreaSqFt: z.number().positive().optional(),
  landAreaSqFt: z.number().positive().optional(),
  valuationRM: z.number().positive().optional(),
  acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  acquisitionPriceRM: z.number().positive().optional(),
  yearBuilt: z.number().int().min(1900).max(2100).optional(),
  effectiveAge: z.number().int().min(0).optional(),
  majorTenant: z.string().optional(),
  leaseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasUndergoneAEI: z.boolean().default(false),
  aeiDetails: z.object({...}).optional()
});
```

### GeographicDistribution

**File:** `src/types/entity.ts` (lines 59-68)

Portfolio allocation by region:

```typescript
export const GeographicDistributionSchema = z.object({
  region: z.string().min(1),
  propertyCount: z.number().int().nonnegative(),
  percentageOfPortfolio: z.number().min(0).max(100),
  totalValuationRM: z.number().positive().optional(),
  totalNlaSqFt: z.number().positive().optional()
});
```

## Usage in Codebase

### Frontend Components

The `EntityCard` component (`frontend/components/EntityCard.tsx`) renders entity summaries:

```typescript
interface EntityCardProps {
  data: NormalizedReitData;  // Contains entity
  comparison?: EntityBenchmarkComparison;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

### Adapter Generation

Adapters create entities using the canonical entity code:

```typescript
// From atrium-adapter.ts
const entityId = linker.generateEntityUuid('5130.KL');

entity = {
  id: entityId,
  code: '5130.KL',
  name: 'Atrium Real Estate Investment Trust',
  exchange: 'Bursa Malaysia',
  sector: 'Industrial REIT',
  // ...
};
```

### Entity Registry

**File:** `frontend/lib/available-entities.ts`

Frontend maintains a registry of trackable entities:

```typescript
export const AVAILABLE_ENTITIES: EntityMetadata[] = [
  {
    code: '5130.KL',
    name: 'Atrium REIT',
    sector: 'Industrial REIT',
    aliases: ['atrium', '5130'],
    routeAliases: ['5130']
  },
  // ... 14 more REITs
];
```

## Related Primitives

- [Metric](./metric.md) — Entity performance metrics
- [References](./references.md) — Citations linked to entities
- [RiskAssessment](#riskassessment) — Risk profile per entity
- [Observation](#observation) — Analysis insights per entity

---

## TimeSeries

**File:** `src/types/schema.ts` (lines 168-188)

Historical sequences of metric values:

```typescript
export const TimeSeriesSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  metricType: MetricSchema.shape.metricType,  // Links to metric definition
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  unit: z.string(),
  dataPoints: z.array(TimeSeriesPointSchema).min(1),
  sourceDisplayIds: z.array(z.string().regex(/.../)),
  metadata: z.object({
    startDate: z.string(),
    endDate: z.string(),
    pointCount: z.number()
  }).optional()
});

export const TimeSeriesPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: MetricValueSchema,
  isInterpolated: z.boolean().default(false),
  sourceDisplayId: z.string().regex(/.../).optional()
});
```

Used for DPU history charts, occupancy trends, and price charts.

---

## RiskAssessment

**File:** `src/types/schema.ts` (lines 233-244)

Top-level risk evaluation container:

```typescript
export const RiskAssessmentSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallRiskRating: z.enum(['low', 'moderate', 'moderate_high', 'high']),
  overallScore: z.number().optional(),
  riskFactors: z.array(RiskFactorSchema).min(1),
  peerComparison: z.object({
    vsPeerId: z.string().uuid(),
    relativeRisk: z.enum(['lower', 'similar', 'higher']),
    keyDifferences: z.array(z.string())
  }).optional()
});
```

For detailed risk factor types, see [RiskAssessmentExtended](../systems/risk-system.md) in `src/types/risk.ts`.

---

## Observation

**File:** `src/types/schema.ts` (lines 247-292)

Structured insights from analysis documents:

```typescript
export const ObservationSchema = z.object({
  id: z.string().uuid(),
  observationType: z.enum([
    'executive_summary',
    'portfolio_analysis',
    'financial_performance',
    'debt_sustainability',
    'dividend_sustainability',
    'risk_assessment',
    'peer_comparison',
    'market_context',
    'management_assessment',
    'industry_benchmark',
    'governance',
    'tenant_analysis'
  ]),
  content: z.string().min(1),
  summary: z.string().min(1).optional(),
  priority: z.enum(['info', 'positive', 'warning', 'critical']).default('info'),
  keyFacts: z.array(...).optional(),
  indicator: z.object({
    icon: z.string(),
    color: z.string(),
    badge: z.string().optional()
  }).optional(),
  relatedMetrics: z.array(...).optional(),
  relatedRisks: z.array(...).optional(),
  primaryCitation: z.string().optional(),
  relatedMetricTypes: z.array(MetricSchema.shape.metricType).optional(),
  sourceDisplayIds: z.array(z.string().regex(/.../)).min(1)
});
```

Observations power the analysis panels and executive summaries in the frontend.

For extended observation types, see `src/types/observation.ts`.
