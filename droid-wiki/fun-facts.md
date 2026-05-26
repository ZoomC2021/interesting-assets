# Fun facts

Trivia and discoveries about the REIT Comparison Dashboard codebase.

## Oldest Surviving Code

The core data contract abstractions have remained unchanged since the foundation era. The `NormalizedReitData` interface and the six core types (`Entity`, `Metric`, `TimeSeries`, `RiskAssessment`, `Observation`, `Reference`) in `src/types/schema.ts` have survived many REIT additions without structural changes — a testament to solid initial design.

## Citation Prefix Evolution

The display ID prefix system started simple with single letters:
- `T` for Atrium (5130.KL)
- `A` for Axis (5106.KL)

As more REITs were added, the system ran out of intuitive single letters. The current 16 prefixes include multi-letter codes:
- `KIP` — KIP REIT (3 letters)
- `SE` — Sentral REIT (2 letters)
- `AF` — AmFIRST REIT (2 letters)
- `To` — Tower REIT (2 letters with lowercase 'o' to avoid conflict)

The regex in `DisplayIdPattern.VALID` grew from `^[TA]:\d+$` to support all these variations.

## Reference Count Milestones

| Date | References | Event |
|------|------------|-------|
| 2025 Q4 | ~600 | First 2 REITs (Atrium + Axis) |
| 2026 Q1 | ~800 | Expanded to 10 REITs |
| 2026 Q2 | 4,700+ | Expanded generated data packs to 16 REITs |

The citation count comes from detailed analysis memos where each financial claim is sourced. Atrium REIT alone has 618 individual citations.

## Strict TypeScript From Day One

The project has maintained `strict: true` in TypeScript configuration throughout its history. No weakening of type constraints has been needed despite significant growth.

## Makefile Longevity

The Makefile task system has remained the canonical way to run commands since the foundation era. Every developer and AI agent uses `make ci`, `make build`, `make test` — no npm script drift.

## Zero Runtime Dependencies in Root

The data contract layer (`src/`) has minimal runtime dependencies:
- `zod` — schema validation
- `uuid` — UUID generation
- `pdf-parse` — PDF text extraction

Everything else is devDependencies for TypeScript, Jest, and tooling.

## Static Export Only

The frontend has always been a static export. No server-side rendering, no API routes, no database. Just Next.js building to HTML/CSS/JS and loading JSON data at runtime.

## Accessibility-First Testing

The test suite includes dedicated accessibility tests using jest-axe. The project has maintained 0 axe-core violations through 153 tests.
