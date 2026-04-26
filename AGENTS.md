# AGENTS.md

Guidance for AI coding agents working in this repository.

## Scope

- This file applies to the entire repository (`interesting-assets/`).
- Prefer small, targeted changes that match existing patterns.

## Project Overview

- Monorepo with two main parts:
  - Root: TypeScript data contract, schema validation, citation checks, root Jest tests.
  - `frontend/`: Next.js 14 (App Router), TypeScript, Tailwind CSS, Jest + Testing Library.
- Domain: Malaysian REIT monitoring/comparison with citation-backed metrics.

## Canonical Commands

Run from repo root unless noted.

- Install: `make install`
- Dev server: `make dev` (serves frontend on `http://localhost:3000`)
- Build all: `make build`
- Typecheck all: `make typecheck-all`
- Lint frontend: `make lint`
- Test all: `make test`
- Full local gate: `make ci`

Equivalent direct commands exist in `package.json` and `frontend/package.json`, but prefer `make` targets for consistency.

## Editing Rules

- Keep TypeScript strictness intact; do not weaken types to silence errors.
- Follow existing import style and alias usage (`@/*` inside `frontend/`).
- Reuse existing design tokens/classes (`bg-success`, `text-ink-muted`, etc.) rather than adding ad hoc color values.
- Keep components accessible:
  - semantic HTML where possible,
  - keyboard-focus visibility,
  - avoid color-only status signaling.
- Avoid broad refactors unless explicitly requested.

## Frontend Conventions

- Favor composable React function components with explicit prop interfaces.
- Keep render-path allocations low for frequently rendered UI (hoist static maps/config when appropriate).
- Preserve responsive behavior on desktop/tablet/mobile.
- Maintain reduced-motion friendliness (`prefers-reduced-motion` patterns already exist in global styles).

## Data and Citation Integrity

- Do not invent financial/citation data.
- If touching citation-related logic or data wiring, run:
  - root check: `make check-citations`
  - frontend check: `make verify-citations`
- Treat schema/validation failures as blockers, not warnings.

## Validation Before Handoff

Choose the smallest sufficient set:

- UI-only change (frontend): `make lint` and `cd frontend && npm test`
- Contract/backend change (root): `npm test` and relevant validation targets
- Cross-cutting change: `make ci`

If you cannot run a command, state what was not run and why.

## Safety

- Never commit secrets (`.env*`, keys, credentials).
- Do not use destructive git operations.
- Do not modify generated/build artifacts unless the task specifically requires it.

## Playbook: Add a New REIT (Backend + Frontend)

Use this when adding a brand-new company/REIT end-to-end.

### 1) Lock identifiers first (blocking)

- Define canonical code (example: `####.KL`), display name, sector, and aliases.
- Assign a unique citation prefix letter (example: `R:`) not used by other entities.
- Decide file slug (lowercase, no spaces; example: `newreit`).

### 2) Create root source artifacts

- Add analysis memo markdown in repo root:
  - `{Name}_REIT_Malaysia_Analysis.md` (example: `New_REIT_Malaysia_Analysis.md`).
- Add references JSON in repo root:
  - `{slug}-reit-references.json` (example: `newreit-reit-references.json`).
- Follow existing references shape with `metadata`, `sources`, and `references` keyed by display IDs (`R:1`, `R:2`, ...).
- Ensure every referenced display ID exists and every ID format matches schema pattern.

### 2a) Analysis memo requirements (must follow Atrium structure)

- Use `Atrium_REIT_Malaysia_Analysis.md` as the canonical benchmark for structure, section depth, and citation density.
- Every new `{Name}_REIT_Malaysia_Analysis.md` must include these areas (in this order unless there is a strong reason to deviate):
  - Front-matter facts: stock code, research date, data coverage period, report status.
  - Executive summary with key FY/TTM highlights (occupancy, gearing, interest cover, DPU, NAV, revenue/NPI).
  - Company overview: manager/trustee, structure, portfolio composition, and property list.
  - Asset quality analysis: occupancy, tenant quality/concentration, lease profile/WALE, AEI/capex, valuation context, geographic concentration.
  - Debt sustainability analysis: gearing trend, debt mix (fixed/floating), maturity profile, interest coverage, refinancing and rate-sensitivity commentary.
  - Dividend sustainability analysis: historical DPU, payout coverage, yield context, and distribution reliability.
  - Financial performance summary: revenue, NPI, realized income/profit, key margins, and period-over-period trend commentary.
  - Valuation and peer context: price/NAV, premium-discount framing, and comparison against relevant Malaysian REIT peers.
  - Risk assessment: explicit risk factors (with severity rationale) and mitigating/aggravating factors.
  - Investment thesis and monitoring plan: base-case view, key catalysts, watch items/triggers, and conclusion.
- Do not leave placeholder sections like "TBD" for required areas; if data is unavailable, state the limitation explicitly and cite the source/disclosure gap.

### 3) Update citation schema + prefix mappings (root)

- Edit `src/types/reference.ts`:
  - Add entity-specific display pattern constant in `DisplayIdPattern`.
  - Extend `DisplayIdPattern.VALID` to include new prefix.
  - Extend `parseDisplayId` prefix union + regex.
  - Extend `generateDisplayId` prefix union.
  - Extend `entityCodeFromPrefix` mapping.
  - Extend `prefixFromEntityCode` mapping and return union.
- Keep this backward-compatible; never break existing prefixes.

### 4) Implement adapter (root)

- Create `src/adapters/{slug}-adapter.ts` modeled on existing adapters.
- Required methods/flow:
  - `processReferences(...)`
  - `buildEntity()`
  - `buildMetrics()`
  - `buildTimeSeries()`
  - `buildRiskAssessment()`
  - `buildObservations()`
  - `generateOutput()`
- Use `CitationLinker.generateEntityUuid('<canonical-code>')`.
- Register references with the canonical code and link citations for all emitted facts.
- Keep citation coverage at 100% (`linkAllOrphans(...)` pattern used in existing adapters).

### 5) Wire the adapter into `scripts/generate-samples.ts`

Edit `scripts/generate-samples.ts` to include the new REIT in the generation pipeline:

**a) Add import at the top:**
```typescript
import { createNewreitAdapter } from '../src/adapters/newreit-adapter';
```

**b) Add generator function (model after existing functions):**
```typescript
function generateNewreitSample(): void {
  console.log('Generating New REIT sample...');

  const linker = createCitationLinker();
  
  // Load references
  const newreitRefs = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'newreit-reit-references.json'), 'utf-8'
  ));
  
  // Process through adapter
  const adapter = createNewreitAdapter(linker);
  adapter.processReferences(newreitRefs);
  const output = adapter.generateOutput();
  
  // Write output files
  writeOutputFiles('newreit', output);
  
  console.log(`   📊 ${output.references.length} references`);
  console.log(`   📊 ${output.metrics.length} metrics`);
  console.log(`   📊 ${output.timeSeries.length} time series`);
  console.log(`   📊 ${output.observations.length} observations`);
  console.log(`   📊 ${output.riskAssessment.riskFactors.length} risk factors`);
}
```

**c) Add function call to the run section at bottom:**
```typescript
// Run generation
generateAtriumSample();
// ... other samples ...
generateNewreitSample();  // Add this line
console.log('\n✅ Sample generation complete');
```

**d) Run the script to regenerate JSON files:**
```bash
npx ts-node scripts/generate-samples.ts
```

This will create:
- `test/samples/{slug}-normalized.json`
- `frontend/public/data/{slug}.json`

### 6) Wire frontend entity registry + loaders

### 6) Wire frontend entity registry + loaders

- Update `frontend/lib/available-entities.ts`:
  - Add canonical entity entry (`code`, `name`, `sector`, `aliases`, optional `routeAliases`).
- Update `frontend/lib/entity-route-params.ts`:
  - Add canonical code and any route aliases to `ENTITY_STATIC_ROUTE_CODES`.
  - Decide whether default compare set should change.
- Update `frontend/lib/comparison-model.ts`:
  - Add canonical code -> `@/public/data/{slug}.json` dynamic import mapping.
- Update `frontend/data/reits.ts` (legacy adapter layer still used by pages):
  - `DEFAULT_ENTITY_CODES`
  - `ENTITY_CODE_ALIASES`
  - `SECTOR_OVERRIDES`
  - Keep defaults consistent with available-entities behavior.

### 7) Wire analysis markdown mapping

- Update `frontend/lib/entity-analysis.ts`:
  - Map canonical code (and route aliases) to root memo file name.
  - Do not leave placeholder comments for entities that now have real memo files.

### 8) Validation + tests before handoff

- Minimum for this cross-cutting change:
  - `make typecheck-all`
  - `make lint`
  - `make test`
  - `make check-citations`
  - `make verify-citations`
- If any tests contain hardcoded prefix expectations (example regex like `^[TAC]:...`), update them to align with current supported prefixes and keep assertions meaningful.

### 9) Optional consistency updates (when in scope)

- `README.md` data coverage tables/counts and docs that mention total tracked REITs.
- `CHANGELOG.md` entry describing the new entity integration.

### Definition of done for a new REIT

- Root artifacts exist: memo + references JSON + adapter.
- Schema accepts new display ID prefix.
- Adapter wired into `scripts/generate-samples.ts` and JSON files regenerated.
- Normalized JSON generated in both `test/samples/` and `frontend/public/data/`.
- Frontend can load the entity by canonical code and aliases.
- Entity page analysis markdown resolves correctly.
- Citation verification and tests pass without weakening checks.
