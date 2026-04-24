# REIT Comparison Dashboard

A comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts (REITs) with 970+ verified references, 30+ metrics, and 10 REITs tracked.

## Features

- **Monitor Page**: Browse 10 Malaysian REITs with 30+ metrics, sparklines, and sector benchmarks
- **Compare Page**: Side-by-side comparison with KPIs, charts, and risk matrices  
- **Citation System**: Every metric linked to source documents with 970+ references
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Build**: Static export for deployment

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd interesting-assets

# Install dependencies
npm install
cd frontend && npm install
```

### Development

```bash
# Start development server
cd frontend
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Production build
cd frontend
npm run build

# Output will be in frontend/dist/
```

### Testing

```bash
# Run all tests
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## Project Structure

```
interesting-assets/
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
| Sunway REIT | 5176.KL | - | Diversified |
| Pavilion REIT | 5212.KL | - | Retail |
| IGB REIT | 5227.KL | - | Retail |
| KLCC REIT | 5235.KL | - | Diversified |
| CMMT | 5180.KL | - | Retail |
| Al-Salam REIT | 5142.KL | - | Industrial |
| Hektar REIT | 5121.KL | - | Retail |
| UOA REIT | 5200.KL | - | Commercial |

**Total References**: 970+ (618 Atrium + 352 Axis)

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
4. Run tests: `npm test`
5. Build verification: `npm run build`
6. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
