# Entity Registry

**Active contributors:** zmang

The entity registry package defines what REITs exist in the system, how they're identified, and where to find their associated data. It's the single source of truth for entity metadata across the application.

## Purpose

This package answers three questions:

1. **What entities exist?** — `AVAILABLE_ENTITIES` const array with codes, names, sectors
2. **How do I route to them?** — `ENTITY_STATIC_ROUTE_CODES` for static generation, alias handling
3. **Where is their analysis?** — `ANALYSIS_FILE_BY_ENTITY_CODE` mapping codes to markdown files

## Key Exports

### `frontend/lib/available-entities.ts`

#### Entity Definitions

```typescript
export const AVAILABLE_ENTITIES = [
  {
    code: '5130.KL' as const,
    name: 'Atrium REIT',
    sector: 'Industrial',
    aliases: ['atrium'],
  },
  // ... more entities
] as const;
```

Each entity has:
- `code` — Canonical Bursa Malaysia stock code (e.g., `'5130.KL'`)
- `name` — Display name for UI
- `sector` — Classification (Industrial, Retail, Commercial, Diversified)
- `aliases` — Alternative strings that resolve to this entity (lowercase)
- `routeAliases` — Optional additional URL routes that should generate the same page

Exported types:
- `AvailableEntity` — Individual entity type
- `AvailableEntityCode` — Union of all canonical codes

---

#### Entity Resolution

```typescript
function normalizeEntityCode(code?: string | null): AvailableEntityCode | null
```

Resolves any alias or canonical code to its canonical form. Returns `null` if unrecognized.

```typescript
normalizeEntityCode('atrium');     // "5130.KL"
normalizeEntityCode('5130.KL');    // "5130.KL"
normalizeEntityCode('ATRIUM');     // "5130.KL" (case-insensitive)
normalizeEntityCode('unknown');    // null
```

---

```typescript
function normalizeEntityCodes(codes: string[]): AvailableEntityCode[]
```

Batch version with deduplication. Preserves order of first appearance.

---

```typescript
function getEntityDefinition(code?: string | null): AvailableEntity | undefined
```

Returns the full entity object including name, sector, and aliases.

---

#### Default Sets

```typescript
export const DEFAULT_COMPARE_ENTITY_CODES = AVAILABLE_ENTITIES.slice(0, 4).map(({ code }) => code);
```

The first four entities shown in comparison by default (currently Atrium, Axis, Sunway, Pavilion).

---

```typescript
export const ENTITY_STATIC_ROUTE_CODES = AVAILABLE_ENTITIES.flatMap((entity) => [
  entity.code,
  ...(('routeAliases' in entity && entity.routeAliases) ? entity.routeAliases : []),
]);
```

All route segments that should generate static pages. Includes canonical codes and route aliases (e.g., both `5212.KL` and legacy `5204.KL` for Pavilion).

---

### `frontend/lib/entity-route-params.ts`

This file duplicates the route codes for static generation isolation. Keeping it separate from the client-side registry prevents Fast Refresh from falling back to full reload when editing entity data.

```typescript
export const ENTITY_STATIC_ROUTE_CODES = [
  '5130.KL', '5106.KL', '5176.KL', '5212.KL', '5204.KL',
  // ... etc
] as const;

export const DEFAULT_COMPARE_ENTITY_CODES = [
  '5130.KL', '5106.KL', '5176.KL', '5212.KL',
] as const;
```

**Note:** These must stay in sync with `available-entities.ts`.

---

### `frontend/lib/entity-analysis.ts`

#### Analysis Markdown Loading

```typescript
async function loadEntityAnalysisMarkdown(entityCode: string): Promise<string | null>
```

Loads the analysis memo markdown file for an entity. Maps codes (including route aliases) to filenames in the repo root.

```typescript
const ANALYSIS_FILE_BY_ENTITY_CODE: Record<string, string> = {
  '5130.KL': 'Atrium_REIT_Malaysia_Analysis.md',
  '5212.KL': 'Pavilion_REIT_Malaysia_Analysis.md',
  '5204.KL': 'Pavilion_REIT_Malaysia_Analysis.md', // alias
  // ... etc
};
```

The function reads from `process.cwd()/..` (repo root) using Node's `fs/promises`.

## Usage Patterns

### Resolving URL Parameters

```typescript
import { normalizeEntityCode, getEntityDefinition } from '@/lib/available-entities';

// In a Next.js page component
const normalizedCode = normalizeEntityCode(params.code);
if (!normalizedCode) return notFound();

const entity = getEntityDefinition(normalizedCode);
// entity.name, entity.sector, etc.
```

### Static Generation

```typescript
import { ENTITY_STATIC_ROUTE_CODES } from '@/lib/entity-route-params';

// In generateStaticParams()
return ENTITY_STATIC_ROUTE_CODES.map(code => ({ code }));
```

### Loading Analysis Content

```typescript
import { loadEntityAnalysisMarkdown } from '@/lib/entity-analysis';

const markdown = await loadEntityAnalysisMarkdown('5130.KL');
if (markdown) {
  // Render markdown content
}
```

### Building Comparison Sets

```typescript
import { normalizeEntityCodes, DEFAULT_COMPARE_ENTITY_CODES } from '@/lib/available-entities';

// From URL query params
const codes = normalizeEntityCodes(searchParams.compare?.split(',') || []);
const finalCodes = codes.length > 0 ? codes : DEFAULT_COMPARE_ENTITY_CODES;
```

## Integration Points

| Module | Connection |
|--------|------------|
| `comparison-model.ts` | Uses `normalizeEntityCode()` before looking up in data file map |
| `frontend/app/entity/[code]/page.tsx` | Uses `ENTITY_STATIC_ROUTE_CODES` for `generateStaticParams()` |
| `frontend/app/compare/page.tsx` | Uses `DEFAULT_COMPARE_ENTITY_CODES` as fallback |
| `frontend/app/entity/[code]/analysis/page.tsx` | Uses `loadEntityAnalysisMarkdown()` to fetch content |

## Adding a New REIT

When adding a new entity, update all three files:

1. **`available-entities.ts`** — Add to `AVAILABLE_ENTITIES` with code, name, sector, aliases
2. **`entity-route-params.ts`** — Add canonical code (and any route aliases) to both exports
3. **`entity-analysis.ts`** — Add code-to-filename mapping in `ANALYSIS_FILE_BY_ENTITY_CODE`

Then update `comparison-model.ts` fileMap and regenerate static JSON files.

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/lib/available-entities.ts` | Entity definitions, lookup, and normalization |
| `frontend/lib/entity-route-params.ts` | Static route generation constants |
| `frontend/lib/entity-analysis.ts` | Markdown analysis file mapping and loading |
