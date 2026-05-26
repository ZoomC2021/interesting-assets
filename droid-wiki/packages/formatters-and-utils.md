# Formatters and Utilities

**Active contributors:** zmang

This package covers display formatting (currency, percentages, dates) and data utilities (metric registry, citation handling). It's the presentation layer between raw numeric data and what users see on screen.

## Purpose

Three distinct concerns:

1. **Formatting** — Convert numbers to human-readable strings (RM 16.8B, 5.6%, 2.5 years)
2. **Metric metadata** — Registry of all metric types with display names, units, and benchmarks
3. **Citation management** — Source grouping, coverage verification, and copy-to-clipboard

## Key Exports

### `frontend/lib/formatters.ts`

#### Currency Formatting

```typescript
function formatCurrency(
  value: number | null | undefined,
  currency: string = 'MYR',
  decimals: number = 2
): string
```

Auto-scales with K/M/B suffixes:

```typescript
formatCurrency(16800000000);     // "MYR 16.80B"
formatCurrency(4500000);         // "MYR 4.50M"
formatCurrency(1200);            // "MYR 1.20K"
```

Convenience wrappers:

```typescript
formatRM(16800000000);           // "RM 16.80B"
formatRMShort(4500000);          // "RM 4.5M" (1 decimal)
```

---

#### Percentage and Ratio

```typescript
function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  includeSign: boolean = false
): string

function formatRatio(
  value: number | null | undefined,
  decimals: number = 2
): string
```

```typescript
formatPercentage(0.056);         // "5.6%"
formatPercentage(0.056, 1, true); // "+5.6%"
formatRatio(1.23);               // "1.23x"
```

---

#### Numbers and Dates

```typescript
formatNumber(1234.56, 1);        // "1,234.6"
formatCount(1500);               // "1,500"
formatDate('2025-06-30');        // "30 Jun 2025"
formatMonthYear('2025-06-30');   // "Jun 2025"
```

---

#### Specialized Formats

```typescript
formatSqFt(1500000);             // "1.50M sq ft"
formatSen(8.5);                  // "8.50 sen"
formatYears(4.5);                // "4.5 years"
```

---

#### Generic Metric Formatter

```typescript
function formatMetricValue(
  value: number | string | boolean | null | undefined,
  format: MetricFormat,
  unit: string = ''
): string
```

The main entry point used by components. Handles all metric types uniformly:

```typescript
formatMetricValue(16800, 'currency', 'RM million');  // "RM 16.80B"
formatMetricValue(78, 'percentage', '%');            // "78%"
formatMetricValue(4.5, 'years', 'years');              // "4.5 years"
formatMetricValue(true, 'boolean', '');               // "Yes"
```

Special handling:
- Currency metrics with `unit === 'RM million'` are scaled (value * 1e6) before formatting
- Percentage metrics are divided by 100 (since stored values are already in percent units)

---

#### Change Indicators

```typescript
function formatChange(
  current: number | null | undefined,
  previous: number | null | undefined,
  format: MetricFormat = 'percentage'
): { text: string; isPositive: boolean; isNeutral: boolean }
```

For YoY comparisons:

```typescript
const change = formatChange(8.5, 7.2, 'number');
// { text: "+1.30", isPositive: true, isNeutral: false }
```

---

### `frontend/lib/data-utils.ts`

#### Metric Registry

```typescript
export const METRIC_REGISTRY: Record<MetricType, MetricDefinition>
```

Central registry of all ~40 metric types with metadata:

```typescript
dpu: {
  type: 'dpu',
  category: 'per_share',
  displayName: 'Distribution Per Unit',
  description: 'Annual distribution/dividend per unit',
  unit: 'sen',
  format: 'number',
  isHigherBetter: true
},
gearing_ratio: {
  type: 'gearing_ratio',
  category: 'leverage',
  displayName: 'Gearing Ratio',
  unit: '%',
  format: 'percentage',
  isHigherBetter: false,
  benchmarkRange: { min: 20, typical: 35, max: 60 }
}
```

Categories: `portfolio`, `financial_performance`, `per_share`, `leverage`, `operational`, `risk`, `market`

---

#### Registry Queries

```typescript
function getMetricDefinition(type: MetricType): MetricDefinition | undefined
function getMetricsByCategory(category: MetricCategory): MetricDefinition[]
function getAllMetricTypes(): MetricType[]
function getCategoryDisplayName(category: MetricCategory): string
```

---

#### Data Access

```typescript
function getMetricValue(data: NormalizedReitData, metricType: MetricType): Metric | undefined
function getMetricValueAsNumber(data: NormalizedReitData, metricType: MetricType): number | null
```

Used by components to safely extract values:

```typescript
const metric = getMetricValue(data, 'dpu');
const dpuValue = getMetricValueAsNumber(data, 'dpu'); // number | null
```

---

### `frontend/lib/citation-utils.ts`

#### Source Grouping

```typescript
type SourceGroupType = 'AR2025' | 'Q42025' | 'KLSE' | 'OTHER';

export const SOURCE_GROUPS: Record<SourceGroupType, SourceGroup>
```

Classifies references by source type for visual grouping:

| Type | Label | Color Class |
|------|-------|-------------|
| AR2025 | Annual Report 2025 | `bg-blue-100 text-blue-700` |
| Q42025 | Q4 2025 Report | `bg-teal-100 text-teal-700` |
| KLSE | Bursa Malaysia | `bg-purple-100 text-purple-700` |
| OTHER | Other Sources | `bg-neutral-100 text-neutral-700` |

```typescript
function getSourceGroupType(reference: Reference): SourceGroupType
function groupReferencesBySource(references: Reference[]): Map<SourceGroupType, Reference[]>
```

---

#### Citation Counting

```typescript
function getMetricCitationCount(metric: Metric): number
function getEntityCitationCount(entity: NormalizedReitData): number
function getTotalCitationCount(entities: NormalizedReitData[]): number
```

---

#### Coverage Verification

```typescript
function analyzeCitationCoverage(entities: NormalizedReitData[]): CoverageStats

interface CoverageStats {
  totalMetrics: number;
  citedMetrics: number;
  coveragePercentage: number;
  uncitedMetrics: string[];
  orphanCitations: string[];
}
```

Finds metrics without valid citations and references that point to non-existent sources.

---

```typescript
function verifyCitationCoverage(entities: NormalizedReitData[]): {
  passed: boolean;
  stats: CoverageStats;
  errors: string[];
}
```

Strict verification used in build processes. Returns `passed: false` if coverage < 100% or orphans exist.

---

#### Clipboard Operations

```typescript
async function copyCitationToClipboard(reference: Reference): Promise<boolean>
async function copyCitationsToClipboard(references: Reference[]): Promise<boolean>
```

Formats as: `R:1: RM 450M revenue (Annual Report 2025) - Page 45, Financial Statements`

---

#### Visual Indicators

```typescript
function getDataQualityIndicators(metric: Metric): DataQualityIndicators
function getSourceGroupColorClass(groupType: SourceGroupType): string
```

---

### `frontend/lib/grid-utils.ts`

Table layout utilities for the comparison grid.

```typescript
export const entityColors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0891b2'];
export const compareMetricColumnWidth = 240;
export const compareEntityColumnWidth = 176;

function getCompareGridTemplate(entityCount: number, options?): string
// Returns: "240px repeat(3, 176px)"

function getCompareTableMinWidth(entityCount: number, options?): number
// Returns: 240 + 3 * 176 = 768
```

## Usage Patterns

### MetricCard Component Pattern

```typescript
import { METRIC_REGISTRY } from '@/lib/data-utils';
import { formatMetricValue } from '@/lib/formatters';

const definition = METRIC_REGISTRY[metric.metricType];
const formattedValue = formatMetricValue(
  metric.value,
  definition?.format || 'number',
  definition?.unit || metric.unit
);
```

### Citation Badge Display

```typescript
import { getSourceGroupType, SOURCE_GROUPS } from '@/lib/citation-utils';

const groupType = getSourceGroupType(reference);
const colorClass = SOURCE_GROUPS[groupType].colorClass;
// Apply as badge styling
```

### Coverage Report

```typescript
import { verifyCitationCoverage } from '@/lib/citation-utils';

const result = verifyCitationCoverage(entities);
if (!result.passed) {
  console.error('Coverage issues:', result.errors);
}
```

## Integration Points

| Module | Connection |
|--------|------------|
| Components (`MetricCard`, `EntityTable`) | Primary consumers of `formatMetricValue()` and `METRIC_REGISTRY` |
| `comparison-model.ts` | Uses `getRiskSeverityColor()` for risk comparison display |
| Build/CI | Uses `verifyCitationCoverage()` for quality gates |

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/lib/formatters.ts` | Number, currency, date formatting |
| `frontend/lib/data-utils.ts` | Metric registry and data access helpers |
| `frontend/lib/citation-utils.ts` | Source grouping, coverage verification |
| `frontend/lib/grid-utils.ts` | CSS grid layout for comparison tables |
