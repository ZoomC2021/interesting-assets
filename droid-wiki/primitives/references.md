# References and Citations

The reference system provides end-to-end provenance for every fact in the dashboard. Every metric, observation, and risk assessment links back to original sources via human-readable display IDs like `T:1`, `A:42`, or `K:15`.

## Purpose

- **Auditability**: Every fact traces to an annual report, filing, or market data source
- **Trust**: Users can verify claims against original documents
- **Maintenance**: Data quality issues can be traced to specific sources
- **Compliance**: Meets research standards for financial analysis

## Type Definitions

### Core Reference Schema

**File:** `src/types/schema.ts` (lines 30-40)

```typescript
export const ReferenceSchema = z.object({
  id: z.string().uuid(),
  displayId: z.string().regex(/^([TAPSUICHLKRDY]:\d+|KIP:\d+|SE:\d+|AF:\d+|To:\d+)$/),
  fact: z.string().min(1),
  source: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url().optional(),
  dateAccessed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  timeSensitive: z.boolean().default(false),
  entityId: z.string().uuid()
});

export type Reference = z.infer<typeof ReferenceSchema>;
```

### Extended Reference Schema

**File:** `src/types/reference.ts` (lines 59-103)

```typescript
export const ReferenceExtendedSchema = z.object({
  // Primary identifiers
  id: z.string().uuid(),
  displayId: z.string().regex(DisplayIdPattern.VALID),
  
  // Entity linkage
  entityId: z.string().uuid(),
  entityCode: z.string().min(1),
  
  // Source information
  source: z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    type: SourceTypeSchema,
    url: z.string().url().optional(),
    date: z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/).optional(),
    reference: z.string().optional()
  }),
  
  // Content
  fact: z.string().min(1),
  citation: z.string().min(1),
  
  // Quality metadata
  quality: z.object({
    dateAccessed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
    timeSensitive: z.boolean().default(false),
    isDerived: z.boolean().default(false),
    confidenceLevel: z.enum(['high', 'medium', 'low']).default('high'),
    verificationStatus: z.enum(['verified', 'sampled', 'unverified']).default('unverified')
  }),
  
  // Cross-references
  relatedReferences: z.array(z.string().regex(DisplayIdPattern.VALID)).default([]),
  
  // Usage tracking
  usage: z.object({
    metricTypes: z.array(z.string()).default([]),
    observationTypes: z.array(z.string()).default([]),
    riskCategories: z.array(z.string()).default([])
  }).default({ metricTypes: [], observationTypes: [], riskCategories: [] })
});
```

## Display ID System

Display IDs encode the entity prefix and sequence number:

| Prefix | Entity | Example |
|--------|--------|---------|
| `T:` | Atrium REIT (5130.KL) | `T:1` |
| `A:` | Axis REIT (5106.KL) | `A:42` |
| `S:` | Sunway REIT (5176.KL) | `S:15` |
| `P:` | Pavilion REIT (5212.KL) | `P:7` |
| `I:` | IGB REIT (5227.KL) | `I:23` |
| `U:` | UOA REIT (5110.KL) | `U:8` |
| `C:` | CMMT REIT (5180.KL) | `C:31` |
| `H:` | Hektar REIT (5121.KL) | `H:19` |
| `L:` | Al-Salam REIT (5269.KL) | `L:4` |
| `K:` | KLCC REIT (5235SS) | `K:12` |
| `R:` | Pavilion REIT (alternate) | `R:3` |
| `D:` | Paradigm REIT (5338.KL) | `D:9` |
| `Y:` | YTL REIT (5109.KL) | `Y:16` |
| `KIP:` | KIP REIT | `KIP:5` |
| `SE:` | Sentral REIT | `SE:7` |
| `AF:` | AmFIRST REIT | `AF:11` |
| `To:` | Tower REIT | `To:2` |

### Display ID Patterns

**File:** `src/types/reference.ts` (lines 35-57)

```typescript
export const DisplayIdPattern = {
  ATRIUM: /^T:\d{1,3}[a-z]?$/,
  AXIS: /^A:\d{1,3}[a-z]?$/,
  SUNWAY: /^S:\d{1,3}[a-z]?$/,
  PAVILION: /^P:\d{1,3}[a-z]?$/,
  IGB: /^I:\d{1,3}[a-z]?$/,
  UOA: /^U:\d{1,3}[a-z]?$/,
  CMMT: /^C:\d{1,3}[a-z]?$/,
  HEKTAR: /^H:\d{1,3}[a-z]?$/,
  ALSALAM: /^L:\d{1,3}[a-z]?$/,
  KLCC: /^K:\d{1,3}[a-z]?$/,
  KIP: /^KIP:\d{1,3}[a-z]?$/,
  SENTRAL: /^SE:\d{1,3}[a-z]?$/,
  AMFIRST: /^AF:\d{1,3}[a-z]?$/,
  TOWER: /^To:\d{1,3}[a-z]?$/,
  PARADIGM: /^D:\d{1,3}[a-z]?$/,
  YTL: /^Y:\d{1,3}[a-z]?$/,
  VALID: /^([TAPSUICHLKRDY]:\d{1,3}[a-z]?|KIP:\d{1,3}[a-z]?|SE:\d{1,3}[a-z]?|AF:\d{1,3}[a-z]?|To:\d{1,3}[a-z]?)$/
};
```

## Helper Functions

**File:** `src/types/reference.ts` (lines 174-238)

### Validation

```typescript
export function isValidDisplayId(displayId: string): boolean {
  return DisplayIdPattern.VALID.test(displayId);
}
```

### Parsing

```typescript
export function parseDisplayId(displayId: string): { 
  prefix: 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'KIP' | 'SE' | 'AF' | 'To'; 
  number: number; 
  suffix?: string 
} | null {
  if (!isValidDisplayId(displayId)) return null;
  const match = displayId.match(/^([TAPSUICHLKRDHY]):(\d+)([a-z]?)$/) || 
                displayId.match(/^(KIP|SE|AF|To):(\d+)([a-z]?)$/);
  if (!match) return null;
  return {
    prefix: match[1] as 'T' | 'A' | ...,
    number: parseInt(match[2], 10),
    suffix: match[3] || undefined
  };
}
```

### Generation

```typescript
export function generateDisplayId(
  prefix: 'T' | 'A' | 'S' | ... | 'KIP' | 'SE' | 'AF' | 'To', 
  number: number
): string {
  return `${prefix}:${number}`;
}
```

### Prefix ↔ Entity Code Mapping

```typescript
export function entityCodeFromPrefix(
  prefix: 'T' | 'A' | 'S' | ... | 'SE' | 'AF' | 'To'
): string {
  const mapping: Record<string, string> = {
    'T': '5130.KL',
    'A': '5106.KL',
    'S': '5176.KL',
    // ... etc
  };
  return mapping[prefix];
}

export function prefixFromEntityCode(
  code: string
): 'T' | 'A' | ... | 'SE' | 'AF' | 'To' {
  const mapping: Record<string, 'T' | 'A' | ...> = {
    '5130.KL': 'T',
    '5106.KL': 'A',
    // ... etc
  };
  return mapping[code];
}
```

## Citation Linking

The `CitationLinker` class (`src/adapters/citation-linker.ts`) manages the relationship between display IDs and internal UUIDs:

```typescript
export class CitationLinker {
  generateEntityUuid(code: string): string { ... }
  registerReference(displayId: string, fact: string, source: string, ...): Reference { ... }
  linkCitation(displayId: string, target: { id: string; type: string }): void { ... }
  getReferenceByDisplayId(displayId: string): Reference | undefined { ... }
  getOrphanReferences(): Reference[] { ... }
}
```

### Link Types

**File:** `src/types/reference.ts` (lines 106-125)

```typescript
export const CitationLinkSchema = z.object({
  displayId: z.string().regex(DisplayIdPattern.VALID),
  internalId: z.string().uuid(),
  linkType: z.enum([
    'primary',      // Direct citation
    'derived',      // Calculated from this reference
    'supporting',   // Additional support
    'contrast'      // Contrasting view
  ]),
  linkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  linkedBy: z.string().min(1),
  context: z.string().min(1)
});
```

## Source Types

**File:** `src/types/reference.ts` (lines 14-31)

```typescript
export const SourceTypeSchema = z.enum([
  'annual_report',
  'quarterly_filing',
  'market_data',
  'financial_data',
  'news_analysis',
  'property_news',
  'regulatory_filing',
  'research',
  'industry_research',
  'company_data',
  'credit_rating',
  'central_bank',
  'calculated',
  'document_metadata'
]);
```

## Citation Coverage

The system tracks citation coverage across all facts:

**File:** `src/types/reference.ts` (lines 156-170)

```typescript
export interface CitationCoverage {
  totalFacts: number;
  totalCitations: number;
  orphanReferences: string[];
  coverageByCategory: Record<string, {
    total: number;
    cited: number;
    coveragePct: number;
  }>;
  unreferencedMetrics: string[];
  unreferencedObservations: string[];
  unreferencedRiskFactors: string[];
}
```

### Verification Commands

Per `AGENTS.md`, citation integrity is verified via:

```bash
make audit-citations    # Detects weakly linked references
make check-citations    # Root citation check
make verify-citations   # Frontend verification
```

Target: >90% direct linkage for all entities; 100% for critical financial metrics.

## Usage in Codebase

### Frontend Citation Panel

**File:** `frontend/components/CitationPanel.tsx`

```typescript
interface CitationPanelProps {
  citations: Reference[];
  onClose: () => void;
}
```

### Metric Citations

**File:** `frontend/components/MetricCard.tsx`

```typescript
const citationCount = metric.sourceDisplayIds?.length || 0;
const hasCitations = citationCount > 0;

// Click to show citations
onClick={() => hasCitations && onClick?.(metric.sourceDisplayIds)}
```

### Adapter Registration

**File:** `src/adapters/atrium-adapter.ts` (pattern used across all 16 adapters)

```typescript
// 1. Register all references from JSON
processReferences(data: ReferenceRegistry): void {
  for (const [displayId, ref] of Object.entries(data.references)) {
    this.linker.registerReference(
      displayId,
      ref.fact,
      ref.source.name,
      ref.citation,
      ref.source.url,
      ref.quality.dateAccessed,
      ref.quality.timeSensitive
    );
  }
}

// 2. Link citations when building metrics
buildMetrics(): Metric[] {
  return this.metrics.map(m => ({
    ...m,
    sourceDisplayIds: this.linker.linkCitations(m.id, ['T:1', 'T:2'])
  }));
}
```

## Related Primitives

- [Entity](./entity.md) — References belong to entities
- [Metric](./metric.md) — Metrics cite references
- [Observation](./entity.md#observation) — Observations cite references
- [RiskAssessment](./entity.md#riskassessment) — Risk factors cite references
