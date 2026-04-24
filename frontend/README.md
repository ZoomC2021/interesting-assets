# REIT Monitor Frontend

Next.js frontend for the Malaysian REIT Comparison Dashboard.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run type-check` | Run TypeScript type checker |
| `npm run verify:citations` | Verify citation links |

## Project Structure

```
app/                    # Next.js App Router
├── page.tsx           # Home page
├── layout.tsx         # Root layout
├── monitor/page.tsx   # REIT monitor page
├── compare/page.tsx   # Compare page
└── entity/[id]/       # Entity detail pages

components/            # React components
├── EntityTable.tsx    # Data table
├── MetricCard.tsx     # Metric card
├── CitationPanel.tsx  # Citation panel
├── KpiGrid.tsx        # KPI grid
└── ...

lib/                   # Utilities
├── formatters.ts      # Data formatting
├── data-utils.ts      # Data processing
└── citation-utils.ts  # Citation handling

types/                 # TypeScript types
public/data/           # Static data files
__tests__/             # Test files
```

## Environment Variables

None required for static build.

## Build Output

Static export is configured. Build output goes to `dist/` directory.

## Testing

Tests are co-located in `__tests__/` directory:

- Component tests
- Accessibility tests
- E2E workflow tests
- Utility function tests
