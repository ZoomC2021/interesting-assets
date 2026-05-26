# Packages

The `frontend/lib/` directory contains the core data handling and utility packages for the REIT Comparison Dashboard. These modules handle everything from loading REIT data to formatting currency values and managing entity routing.

## Package Overview

| Package | Purpose | Key Files |
|---------|---------|-----------|
| [Data Loading](./data-loading.md) | Load and compare REIT entity data | `comparison-model.ts` |
| [Entity Registry](./entity-registry.md) | Entity definitions, routing, and analysis mapping | `available-entities.ts`, `entity-route-params.ts`, `entity-analysis.ts` |
| [Formatters & Utils](./formatters-and-utils.md) | Display formatting and data utilities | `formatters.ts`, `data-utils.ts`, `citation-utils.ts` |

## Architecture Philosophy

The packages follow a few key principles:

1. **Separation of concerns** — Data loading lives in `comparison-model.ts`, formatting in `formatters.ts`, and entity metadata in `available-entities.ts`. Each module has a clear, narrow responsibility.

2. **Static-first** — The app uses Next.js static export, so entity codes and routes are defined as constants that can be resolved at build time. See `ENTITY_STATIC_ROUTE_CODES` in `entity-route-params.ts`.

3. **Type safety** — Heavy use of TypeScript const assertions and discriminated unions. Entity codes are typed as `AvailableEntityCode`, metric types as `MetricType`, ensuring the compiler catches invalid references.

4. **Citation integrity** — All displayed data must trace back to a source. The `citation-utils.ts` module provides utilities for verifying that every metric has valid citations.

## Quick Reference

### Loading Entity Data

```typescript
import { loadEntityData, loadMultipleEntities } from '@/lib/comparison-model';

// Load a single REIT
const atrium = await loadEntityData('5130.KL');

// Load multiple for comparison
const datasets = await loadMultipleEntities(['5130.KL', '5106.KL', '5176.KL']);
```

### Formatting Values

```typescript
import { formatRM, formatPercentage, formatMetricValue } from '@/lib/formatters';

formatRM(16800);              // "RM 16.80B"
formatPercentage(0.056);      // "5.6%"
formatMetricValue(78, 'percentage', '%');  // "78%"
```

### Entity Lookup

```typescript
import { normalizeEntityCode, getEntityDefinition } from '@/lib/available-entities';

normalizeEntityCode('atrium');     // "5130.KL"
getEntityDefinition('5130.KL');    // { code: '5130.KL', name: 'Atrium REIT', ... }
```

## Cross-Cutting Utilities

Several utility modules support the main packages:

- **`benchmark-calculations.ts`** — Sector benchmarking with median, quartiles, and percentile rankings
- **`grid-utils.ts`** — CSS grid layout helpers for comparison tables

These are documented alongside the packages that use them.

---

See the individual package pages for detailed API documentation and usage patterns.
