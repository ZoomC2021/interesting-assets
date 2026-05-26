# Lore

The history and evolution of the REIT Comparison Dashboard.

## Eras

### Foundation Era (2025)

The project began as a data contract experiment — designing a schema that could normalize REIT financial data across different disclosure standards while preserving source citations. The core abstractions (Entity, Metric, TimeSeries, RiskAssessment, Observation) were established during this period.

Key developments:
- Schema design with Zod runtime validation
- Citation system with display IDs (T:XXX, A:XXX pattern)
- First adapters: Atrium and Axis REITs

### Expansion Era (Early 2026)

The platform expanded from 2 REITs to 10, then to 15. Each new REIT required:
- Analysis memo (markdown research document)
- References JSON (citation database)
- Adapter implementation
- Frontend wiring

Key additions in chronological order:
- Sunway REIT (5176.KL) — Diversified sector
- Pavilion REIT (5212.KL) — Retail sector
- IGB REIT (5227.KL) — Retail sector
- KLCC REIT (5235SS) — Diversified with hotel exposure
- CMMT (5180.KL) — Retail sector
- Al-Salam REIT (5269.KL) — Diversified
- Hektar REIT (5121.KL) — Retail sector
- UOA REIT (5110.KL) — Commercial sector
- KIP REIT (5280.KL) — Retail sector (Apr 2026)
- Paradigm REIT (5338.KL) — Retail sector (Apr 2026)
- Sentral REIT (5123.KL) — Commercial sector
- AmFIRST REIT (5120.KL) — Commercial sector
- Tower REIT (5111.KL) — Commercial sector

### Refinement Era (Apr 2026)

Focus shifted to data quality and citation integrity:
- Added `audit-citations` target to measure direct vs orphan linkage
- Implemented comprehensive risk factor modeling
- Added time series support for historical trends
- Enhanced frontend with sector benchmarks and sparklines

## Longest-Standing Features

| Feature | Introduced | Status |
|---------|------------|--------|
| Citation linking system | Foundation era | Core, unchanged |
| Zod schema validation | Foundation era | Core, extended |
| Adapter pattern | Foundation era | Core, replicated across REIT adapters |
| Display ID prefixes | Foundation era | Extended to 16 prefixes |
| Makefile task system | Foundation era | Active |

## Major Rewrites

None significant — the architecture has remained stable since foundation. The adapter pattern proved resilient to new REIT additions without requiring structural changes.

## Growth Trajectory

```
REIT Count Over Time:
2025 Q4: 2 (Atrium, Axis)
2026 Q1: 10 (+8 REITs)
2026 Q2: 15 (+5 REITs)

Reference Growth:
2025 Q4: ~600 references
2026 Q1: ~800 references  
2026 Q2: 4,700+ references across generated data packs
```

## Deprecated Features

No major features have been deprecated. The codebase has been strictly additive.

## Conventions That Emerged

1. **Citation prefixes** evolved from single letters (T, A) to multi-letter codes (KIP, SE, AF, To) as the 26-letter alphabet became insufficient.

2. **Adapter structure** solidified around 6 methods: `processReferences`, `buildEntity`, `buildMetrics`, `buildTimeSeries`, `buildRiskAssessment`, `buildObservations`.

3. **Quality gates** expanded from basic tests to include `audit-citations`, `check-citations`, and `verify-citations`.
