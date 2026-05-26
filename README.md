# REIT Comparison Dashboard

A comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts (REITs) with 4,400+ verified references, 30+ metrics, and 15 app-wired REITs tracked.

## Features

- **Monitor Page**: Browse 15 Malaysian REITs with 30+ metrics, sparklines, and sector benchmarks
- **Compare Page**: Side-by-side comparison with KPIs, charts, and risk matrices  
- **Citation System**: Every metric linked to source documents with 4,400+ references across app-wired entities
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Build**: Static export for deployment
- **Tasks**: [Makefile](Makefile) at the repo root (wraps common npm commands)

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- GNU Make (optional, for `make` targets)

### Installation

```bash
git clone <repository-url>
cd interesting-assets
make install
```

To install without Make: `npm install` in the repository root, then `npm install` in `frontend/`.

### Development

```bash
make dev
# http://localhost:3000
```

Without Make: `cd frontend && npm run dev`.

### Build

```bash
# Typecheck the data contract, then build the Next app (output: frontend/dist/)
make build
```

Frontend only: `make build-frontend` or `cd frontend && npm run build`.

### Testing

```bash
make test
make test-coverage   # coverage (frontend)
```

Without Make: `npm test` at the repo root (contract), and `cd frontend && npm test` (frontend). Typecheck: `make typecheck-all` or `cd frontend && npm run type-check`.

### Full local check

After installing dependencies, run typecheck, lint, and both test suites:

```bash
make ci
```

## Makefile

Run `make` or `make help` to list all targets. Common ones:

| Target | Description |
|--------|-------------|
| `install` | Install root and `frontend/` dependencies |
| `dev` | Next.js dev server |
| `start` | Production server (`next start`; build first) |
| `build` | Contract typecheck + frontend production build |
| `build-contract` / `build-frontend` | Only one part of `build` |
| `typecheck-all` | TypeScript: root + frontend |
| `lint` | `next lint` in `frontend/` |
| `test` | Root Jest + frontend Jest |
| `validate-atrium` / `validate-axis` | Schema validation on sample JSON |
| `check-citations` / `verify-citations` | Citation checks (root / frontend) |
| `clean` | Remove `dist`, `.next`, and coverage output |
| `ci` | `typecheck-all`, `lint`, and `test` |

## Project Structure

```
interesting-assets/
├── Makefile                  # make install, dev, build, test, ci, …
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App router pages
│   │   ├── page.tsx          # Home page
│   │   ├── monitor/page.tsx  # Monitor page
│   │   ├── compare/page.tsx  # Compare page
│   │   └── entity/[id]/      # Entity detail pages
│   ├── components/           # React components
│   │   ├── EntityTable.tsx   # Data table with sorting
│   │   ├── MetricCard.tsx    # Metric display card
│   │   ├── CitationPanel.tsx # Source citation panel
│   │   ├── KpiGrid.tsx       # KPI grid layout
│   │   └── ...
│   ├── lib/                  # Utility functions
│   ├── types/                # TypeScript types
│   ├── public/data/          # REIT data files (JSON)
│   └── __tests__/            # Test files
├── src/                      # Backend/adapters
│   ├── adapters/             # Data adapters
│   ├── types/                # Shared types
│   └── validation/           # Schema validation
└── test/                     # Conformance tests
```

## Data Coverage

| REIT | Code | References | Sector |
|------|------|------------|--------|
| Atrium REIT | 5130.KL | 618 | Industrial |
| Axis REIT | 5106.KL | 352 | Industrial |
| Sunway REIT | 5176.KL | 448 | Diversified |
| Pavilion REIT | 5212.KL | 386 | Retail |
| IGB REIT | 5227.KL | 672 | Retail |
| KLCC REIT | 5235SS | 260 | Diversified |
| CMMT | 5180.KL | 193 | Retail |
| Al-Salam REIT | 5269.KL | 201 | Diversified |
| Hektar REIT | 5121.KL | 211 | Retail |
| UOA REIT | 5110.KL | 345 | Commercial |
| KIP REIT | 5280.KL | 204 | Retail |
| Paradigm REIT | 5338.KL | 220 | Retail |
| Sentral REIT | 5123.KL | 109 | Commercial |
| AmFIRST REIT | 5120.KL | 151 | Commercial |
| Tower REIT | 5111.KL | 118 | Commercial |

**Total References**: 4,488 across app-wired entities.

## Metrics Tracked

- Financial: Market Cap, NAV, Total Assets, Revenue, NPI
- Performance: DPU, Yield, DPU Growth
- Risk: Gearing Ratio, Interest Cover, Occupancy
- Portfolio: Property Count, NLA, WALE
- Governance: Manager Info, Board Structure, Fees

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG AA compliant
- Keyboard navigation support
- Screen reader optimized
- Focus indicators visible
- Color contrast verified

## Performance Targets

- Lighthouse Performance: ≥80
- Lighthouse Accessibility: ≥90
- Lighthouse Best Practices: ≥90
- Lighthouse SEO: ≥80
- First Contentful Paint: <2s
- Time to Interactive: <3s
- Bundle Size: <200KB (gzipped)

## License

MIT License - see LICENSE file

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test` (or `npm test` in the root and in `frontend/`)
5. Build verification: `make build` and `make ci` before opening a pull request
6. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
