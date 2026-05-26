# REIT Comparison Dashboard

A comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts (REITs). The application tracks 15 app-wired REITs with 4,400+ verified citations, 30+ financial metrics, and sophisticated risk assessment capabilities.

## What This Project Does

This monorepo powers a research-led REIT analysis platform with two main capabilities:

1. **Monitor Page** — Browse all tracked REITs with sortable tables, sparklines, and sector benchmarks. Each metric links to its source document via a citation system.

2. **Compare Page** — Side-by-side comparison of up to 4 REITs with KPI grids, trend charts, and risk matrices.

The platform emphasizes data integrity through a rigorous citation system where every financial metric traces back to annual reports, quarterly filings, or market data sources.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, CSS custom properties |
| Charts | Recharts |
| Tables | TanStack Table |
| Testing | Jest, React Testing Library, jest-axe |
| Data Contract | Zod schemas, TypeScript interfaces |
| Validation | ts-node scripts for citation and schema checks |

## Repository Structure

```
interesting-assets/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and data loaders
│   ├── __tests__/        # Test suites
│   └── public/data/      # REIT JSON files
├── src/                   # Data contract and adapters
│   ├── adapters/         # 16 REIT-specific adapters
│   ├── types/            # Schema definitions
│   ├── validation/       # Schema validators
│   └── utils/            # Helper functions
├── test/                  # Conformance tests
├── scripts/               # Generation and audit scripts
└── *.json                 # Reference data (4,700+ citations across data packs)
```

## Quick Links

- [System architecture](./architecture.md) — Data flow and component relationships
- [Getting started](./getting-started.md) — Installation, build, and test commands
- [Glossary](./glossary.md) — REIT-specific and project-specific terminology
- [Adapters](../systems/adapters.md) — How REIT data is transformed
- [Citation system](../systems/citation-system.md) — Reference linking and validation

## Data Coverage

| REIT | Code | Sector | References |
|------|------|--------|------------|
| Atrium REIT | 5130.KL | Industrial | 618 |
| Axis REIT | 5106.KL | Industrial | 352 |
| Sunway REIT | 5176.KL | Diversified | 448 |
| Pavilion REIT | 5212.KL | Retail | 386 |
| IGB REIT | 5227.KL | Retail | 672 |
| KLCC REIT | 5235SS | Diversified | 260 |
| CMMT | 5180.KL | Retail | 193 |
| Al-Salam REIT | 5269.KL | Diversified | 201 |
| Hektar REIT | 5121.KL | Retail | 211 |
| UOA REIT | 5110.KL | Commercial | 345 |
| KIP REIT | 5280.KL | Retail | 204 |
| Paradigm REIT | 5338.KL | Retail | 220 |
| Sentral REIT | 5123.KL | Commercial | 109 |
| AmFIRST REIT | 5120.KL | Commercial | 151 |
| Tower REIT | 5111.KL | Commercial | 118 |

**Total tracked REITs**: 15  
**Total references**: 4,488 across app-wired entities

## Key Design Principles

1. **Citation-backed metrics** — Every number has a source. No invented data.
2. **Type safety** — Full TypeScript coverage with Zod runtime validation.
3. **Static export** — Next.js builds to static HTML for simple deployment.
4. **Accessibility** — WCAG AA compliant with keyboard navigation and screen reader support.
