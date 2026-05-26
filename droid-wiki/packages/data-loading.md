# Data Loading

**Active contributors:** zmang

The data loading package handles fetching, merging, and comparing REIT entity data. It's the primary interface between the static JSON data files and the React components that display them.

## Purpose

This package solves three core problems:

1. **Static data loading** — Maps canonical entity codes to dynamic imports of JSON data files
2. **Entity comparison** — Merges multiple REIT datasets side-by-side for comparison views
3. **Portfolio extension** — Enriches raw entity data with calculated portfolio metrics

## Key Exports

### `frontend/lib/comparison-model.ts`

#### Entity Loading

```typescript
async function loadEntityData(entityCode: string): Promise<NormalizedReitData | null>
```

Loads a single REIT's data by its canonical code (e.g., `'5130.KL'`). Returns `null` if the code is unknown or the file fails to load.

The function uses a hardcoded `fileMap` that associates each canonical code with a dynamic import:

```typescript
const fileMap: Record<string, () => Promise<unknown>> = {
  '5130.KL': () => import('@/public/data/atrium.json'),
  '5106.KL': () => import('@/public/data/axis.json'),
  // ... etc
};
```

**Important:** When adding a new REIT, you must update this map alongside `available-entities.ts`.

---

```typescript
async function loadMultipleEntities(entityCodes: string[]): Promise<NormalizedReitData[]>
```

Loads multiple entities in parallel. Filters out any that fail to load. Useful for comparison pages that need several REITs at once.

---

#### Entity Extension

```typescript
function extendEntity(
  entity: NormalizedReitData['entity'], 
  data: NormalizedReitData
): EntityExtended
```

Enriches the base entity with portfolio-level metrics calculated from its metrics array:

- `totalAssetsRM` — from `total_assets` metric
- `investmentPropertiesRM` — from `investment_properties` metric
- `totalProperties` — from `property_count` metric
- `netLettableAreaSqFt` — from `net_lettable_area` metric
- `geographicDistribution` — default Klang Valley / Other split

---

#### Comparison Building

```typescript
function buildEntityComparison(data: NormalizedReitData): EntityComparison
```

Wraps a dataset in a comparison-ready structure with the extended entity and all metrics/timeseries/risk data.

---

```typescript
function buildSideBySideComparison(datasets: NormalizedReitData[]): SideBySideComparison
```

The main comparison engine. Takes multiple REIT datasets and produces:

- **Metric comparisons** — Every metric type across all entities, with "winner" highlighting
- **Categorized metrics** — Grouped into Distributions, Financial Performance, Leverage & Debt, Operational, Valuation, Portfolio
- **Risk comparison** — Severity levels across risk categories
- **Overall summary** — Total metrics count, entities with data, timestamp

Winner determination logic:
- For most metrics, highest value wins
- For `gearing_ratio`, `floating_rate_debt_pct`, `top_tenant_concentration`, lowest wins

---

#### Risk Helpers

```typescript
function getRiskSeverityColor(severity: RiskSeverity): string
function getRiskSeverityEmoji(severity: RiskSeverity): string
function getRiskSeverityLabel(severity: RiskSeverity): string
```

Visual helpers for risk display:

| Severity | Color | Emoji |
|----------|-------|-------|
| low | `#22c55e` (green) | 🟢 |
| medium | `#eab308` (yellow) | 🟡 |
| high | `#f97316` (orange) | 🟠 |
| critical | `#ef4444` (red) | 🔴 |

## Usage Patterns

### Loading for a Detail Page

```typescript
import { loadEntityData, buildEntityComparison } from '@/lib/comparison-model';

const data = await loadEntityData(params.code);
if (!data) return notFound();

const comparison = buildEntityComparison(data);
```

### Loading for Comparison

```typescript
import { loadMultipleEntities, buildSideBySideComparison } from '@/lib/comparison-model';

const datasets = await loadMultipleEntities(['5130.KL', '5106.KL', '5176.KL']);
const comparison = buildSideBySideComparison(datasets);

// Access categorized metrics
for (const category of comparison.metricCategories) {
  console.log(category.category); // "Distributions", "Leverage & Debt", etc.
  for (const metric of category.metrics) {
    console.log(metric.metricType, metric.values);
  }
}
```

### Using with Benchmark Calculations

```typescript
import { buildSideBySideComparison } from '@/lib/comparison-model';
import { buildAllBenchmarks } from '@/lib/benchmark-calculations';

const comparison = buildSideBySideComparison(datasets);
const benchmarks = buildAllBenchmarks(datasets, metricTypes);

// Now each entity can be compared against sector median
```

## Integration Points

| Module | Connection |
|--------|------------|
| `available-entities.ts` | Uses `normalizeEntityCode()` to resolve aliases before looking up in `fileMap` |
| `benchmark-calculations.ts` | Consumes `NormalizedReitData[]` from `loadMultipleEntities()` |
| `entity-analysis.ts` | Parallel data loading for analysis markdown alongside comparison data |
| Components (`MetricCard`, `EntityTable`) | Consume `EntityComparison` and `SideBySideComparison` structures |

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/lib/comparison-model.ts` | Main data loading and comparison logic |
| `frontend/lib/benchmark-calculations.ts` | Sector benchmarking on top of loaded data |
