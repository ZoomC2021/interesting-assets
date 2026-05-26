# Dead Ends

This page tracks unused exports, orphaned code, and potentially dead code paths that may be candidates for removal or consolidation.

## Search Methodology

**Scope:** `/src` and `/frontend` directories
**Tools:** ripgrep for pattern matching, manual review for context

## Findings Summary

| Finding | Location | Severity | Action |
|---------|----------|----------|--------|
| Unused `DisplayIdRegex` | `src/types/schema.ts:21` | Low | Verify and potentially remove |

## Detailed Findings

### 1. DisplayIdRegex — Potentially Unused

**File:** `src/types/schema.ts`  
**Lines:** 21-24

```typescript
export const DisplayIdRegex = {
  ATRIUM: /^T:\d+$/,
  AXIS: /^A:\d+$/
};
```

**Analysis:**

This export appears to be an **early/incomplete version** of display ID validation. The comprehensive implementation exists in:

**File:** `src/types/reference.ts`  
**Lines:** 35-57

```typescript
export const DisplayIdPattern = {
  ATRIUM: /^T:\d{1,3}[a-z]?$/,
  AXIS: /^A:\d{1,3}[a-z]?$/,
  SUNWAY: /^S:\d{1,3}[a-z]?$/,
  PAVILION: /^P:\d{1,3}[a-z]?$/,
  // ... 13 more entities
  VALID: /^([TAPSUICHLKRDY]:\d{1,3}[a-z]?|KIP:\d{1,3}[a-z]?|SE:\d{1,3}[a-z]?|AF:\d{1,3}[a-z]?|To:\d{1,3}[a-z]?)$/
};
```

**Evidence of Disuse:**

1. Only defines 2 patterns (Atrium, Axis) vs 17 entities
2. No suffix support (`[a-z]?` missing)
3. No `VALID` combined pattern
4. Not imported in any adapter (verified via ripgrep)
5. All validation uses `DisplayIdPattern.VALID` instead

**Usage Comparison:**

```bash
# DisplayIdRegex usage
$ rg "DisplayIdRegex" /Users/zmang/Repos/interesting-assets/src
./src/types/schema.ts:21:export const DisplayIdRegex = {

# DisplayIdPattern usage (extensive)
$ rg "DisplayIdPattern" /Users/zmang/Repos/interesting-assets/src
./src/types/reference.ts:35:export const DisplayIdPattern = {
./src/types/reference.ts:106:  displayId: z.string().regex(DisplayIdPattern.VALID),
./src/types/reference.ts:128:  orphanReferences: z.array(z.string().regex(DisplayIdPattern.VALID)),
# ... etc
```

**Recommendation:**

```typescript
// REMOVE from src/types/schema.ts:
export const DisplayIdRegex = {
  ATRIUM: /^T:\d+$/,
  AXIS: /^A:\d+$/
};
```

**Risk:** Very low — if not imported anywhere, removal has no impact.

**Verification Steps:**
1. Confirm no imports of `DisplayIdRegex`
2. Run full test suite after removal
3. Run typecheck: `make typecheck-all`

---

## Exports Confirmed Active

The following exports are confirmed used across the codebase:

### Core Types (`src/types/schema.ts`)

| Export | Usage | Location |
|--------|-------|----------|
| `UUID_REGEX` | Used in validation | `validation/schema-validator.ts` |
| `ReferenceSchema` | Zod validation | Adapters, validators |
| `EntitySchema` | Zod validation | Adapters |
| `MetricSchema` | Zod validation | Adapters, frontend |
| `TimeSeriesSchema` | Zod validation | Adapters |
| `RiskAssessmentSchema` | Zod validation | Adapters |
| `ObservationSchema` | Zod validation | Adapters |
| `NormalizedReitData` | Primary output type | All adapters, frontend |
| All type exports (`Entity`, `Metric`, etc.) | TypeScript types | Throughout codebase |

### Extended Types

| Export | Usage | Location |
|--------|-------|----------|
| `DisplayIdPattern` | Validation | `reference.ts`, adapters |
| `CitationLinkSchema` | Type definition | `reference.ts` |
| `ObservationExtended` | Adapter outputs | All adapters |
| `RiskFactorDetail` | Adapter outputs | All adapters |
| `METRIC_REGISTRY` | Frontend display | `frontend/lib/data-utils.ts` |

### Adapter Pattern

All adapters export:
- `XxxAdapter` class — Used by `generate-samples.ts`
- `createXxxAdapter()` — Factory function used in generation pipeline

### Validation Utilities

| Export | Usage | Location |
|--------|-------|----------|
| `createCitationLinker()` | Adapter instantiation | All adapters |
| `CitationChecker` | Citation verification | `make audit-citations` |
| `SchemaValidator` | Data validation | CI pipeline |

---

## No Orphaned Code Detected

Beyond the `DisplayIdRegex` finding, the codebase shows **no signs of orphaned code**:

- ✅ Adapter exports are consumed by generation and audit scripts
- ✅ All type exports used in either adapters or frontend
- ✅ All validation utilities used in CI/test pipeline
- ✅ No unused imports detected in scanned files

---

## Recommendations

### Immediate (Low Risk)
1. **Remove `DisplayIdRegex`** from `schema.ts` after confirming zero imports

### Ongoing Maintenance
1. **Add dead code detection** to CI (e.g., `knip` or `ts-prune`)
2. **Review exports periodically** when adding new types
3. **Mark intentional exports** with `@public` JSDoc to distinguish from internal

---

## Conclusion

The codebase is **remarkably clean** with minimal dead code. The single finding (`DisplayIdRegex`) appears to be vestigial from early development and safe to remove. All other exports are actively consumed across the 17-adapter pipeline and frontend components.
