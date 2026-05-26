# Primitives Overview

The REIT Comparison Dashboard is built on a strongly-typed data contract that defines the core domain entities. These primitives form the foundation of the entire system, from backend data adapters to the frontend UI components.

## Core Primitive Types

| Primitive | File | Description |
|-----------|------|-------------|
| [Entity](./entity.md) | `src/types/schema.ts` | A REIT entity with code, name, exchange, and management details |
| [Metric](./metric.md) | `src/types/schema.ts` | Individual data points like DPU, gearing ratio, occupancy rate |
| [Reference](./references.md) | `src/types/reference.ts` | Citations linking facts to sources (annual reports, filings) |
| [TimeSeries](./entity.md#timeseries) | `src/types/schema.ts` | Historical data sequences with data points |
| [RiskAssessment](./entity.md#riskassessment) | `src/types/schema.ts` | Risk factor evaluations and peer comparisons |
| [Observation](./entity.md#observation) | `src/types/schema.ts` | Structured insights extracted from analysis documents |

## Type Organization

The codebase organizes types across multiple files:

```
src/types/
├── schema.ts       # Core 6 entities (Entity, Metric, TimeSeries, etc.)
├── reference.ts    # Citation system and display IDs
├── risk.ts         # Risk assessment extended types
├── observation.ts  # Observation extended types
├── entity.ts       # Entity extended types (Property, Management)
├── metric.ts       # Metric registry and definitions
└── timeseries.ts   # Time series specialized types
```

## Zod Validation

All core primitives use [Zod](https://zod.dev) schemas for runtime validation:

```typescript
import { z } from 'zod';

export const EntitySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  // ... more fields
});

// Derive TypeScript type from schema
export type Entity = z.infer<typeof EntitySchema>;
```

This approach gives us:
- **Compile-time safety** via TypeScript
- **Runtime validation** via Zod parsing
- **Single source of truth** — types and validators stay in sync

## Normalized Data Output

All 17 adapters produce a consistent `NormalizedReitData` structure:

```typescript
export interface NormalizedReitData {
  schemaVersion: string;
  generatedAt: string;
  entity: Entity;
  references: Reference[];
  metrics: Metric[];
  timeSeries: TimeSeries[];
  riskAssessment: RiskAssessment;
  observations: Observation[];
}
```

This normalized structure is consumed by:
- Frontend comparison pages
- Entity detail views
- Citation panels
- Risk matrices

## Citation System

Every fact in the system traces back to a source via **display IDs** like `T:1`, `A:42`, `K:15`. These are:
- Human-readable (prefix maps to entity)
- Machine-processable (validated by regex)
- Stable across schema versions

See [References](./references.md) for the full citation architecture.

## Related Documentation

- [API Reference](../api/index.md) — API endpoints returning these types
- [Systems](../systems/index.md) — Systems using these primitives
- [Features](../features/index.md) — Features built on these types
