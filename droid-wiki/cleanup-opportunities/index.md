# Cleanup Opportunities

This section tracks potential codebase improvements — from TODO comments to unused exports to orphaned code that may need removal or consolidation.

## Current Assessment

After scanning the entire `/src` directory and frontend codebase:

| Category | Status | Details |
|----------|--------|---------|
| **TODO/FIXME Comments** | ✅ Clean | No TODO or FIXME comments found |
| **Unused Exports** | ⚠️ Minor | `DisplayIdRegex` in `schema.ts` appears unused |
| **Orphaned Code** | ✅ Clean | All exports appear to be consumed |
| **Duplicated Logic** | ✅ Clean | Patterns are consistent across 17 adapters |

## Minor Findings

### 1. Potentially Unused Export: `DisplayIdRegex`

**Location:** `src/types/schema.ts` (line 21)

```typescript
export const DisplayIdRegex = {
  ATRIUM: /^T:\d+$/,
  AXIS: /^A:\d+$/
};
```

**Issue:** This constant appears to be an early, incomplete version of the display ID patterns. The comprehensive `DisplayIdPattern` object in `src/types/reference.ts` (line 35) is the actual implementation used throughout the codebase.

**Recommendation:** Verify `DisplayIdRegex` is truly unused, then remove it in favor of the complete `DisplayIdPattern`.

## Code Quality Positives

The codebase demonstrates excellent maintenance practices:

### Consistent Adapter Patterns

All 17 REIT adapters follow an identical structure:

```typescript
export class XxxAdapter {
  processReferences(data: ReferenceRegistry): void
  buildEntity(): Entity
  buildMetrics(): Metric[]
  buildTimeSeries(): TimeSeries[]
  buildRiskAssessment(): RiskAssessmentExtended
  buildObservations(): ObservationExtended[]
  generateOutput(): NormalizedReitData
}

export function createXxxAdapter(linker: CitationLinker): XxxAdapter
```

### Comprehensive Type Coverage

Every type has corresponding Zod validation:
- Core schema types: 7 Zod schemas
- Reference types: 4 Zod schemas  
- Risk types: 6 Zod schemas
- Observation types: 3 Zod schemas
- Entity types: 7 Zod schemas
- Metric types: Full registry with 40+ metric definitions

### Citation Integrity

All adapters implement proper citation wiring:
- Reference registration in `processReferences()`
- Citation linking via `linkCitation()` in builders
- Orphan linking for coverage

## Sections

- [TODOs and FIXMEs](./todos-and-fixmes.md) — Detailed search results
- [Dead Ends](./dead-ends.md) — Unused exports and orphaned code

## When to Update This Section

Update when:
- Adding new TODO comments during development
- Refactoring reveals unused code
- Code reviews identify cleanup opportunities
- Dependencies are removed

