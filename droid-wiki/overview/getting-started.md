# Getting started

Set up the REIT Comparison Dashboard for local development.

## Prerequisites

- Node.js 18+
- npm 9+
- GNU Make (optional, for `make` targets)

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd interesting-assets
make install
```

Without Make:

```bash
npm install
cd frontend && npm install
```

## Development

Start the Next.js dev server:

```bash
make dev
```

The application is available at `http://localhost:3000`.

Without Make:

```bash
cd frontend && npm run dev
```

## Build

Typecheck the data contract and build the frontend:

```bash
make build
```

This runs:
1. Root TypeScript check (`npm run build` — contract validation)
2. Frontend build (`cd frontend && npm run build`)
   - Pre-build citation verification
   - Next.js static export
   - Post-build data copy

Output goes to `frontend/dist/`.

## Testing

Run all test suites:

```bash
make test
```

This executes:
- Root Jest tests (contract/validation tests)
- Frontend Jest tests (React component tests)

With coverage:

```bash
make test-coverage
```

## Code Quality

Run the full local quality gate:

```bash
make ci
```

This runs:
- `make typecheck-all` — TypeScript check for root + frontend
- `make lint` — ESLint in frontend
- `make test` — All test suites

### Type Checking

```bash
make typecheck-all    # Root + frontend
make typecheck        # Root only
make typecheck-frontend  # Frontend only
```

### Linting

```bash
make lint
```

### Citation Checks

```bash
make audit-citations     # Coverage audit (direct vs orphan linkage)
make check-citations     # Root citation validation
make verify-citations    # Frontend citation verification
```

## Useful Make Targets

| Target | Description |
|--------|-------------|
| `make install` | Install root and frontend dependencies |
| `make dev` | Start Next.js dev server |
| `make build` | Typecheck contract + build frontend |
| `make start` | Run production server (build first) |
| `make test` | Run all test suites |
| `make ci` | Full local quality gate |
| `make clean` | Remove build artifacts |

Run `make` or `make help` to list all targets.

## Project Structure

After installation, your workspace looks like:

```
interesting-assets/
├── Makefile              # Common tasks
├── package.json          # Root dependencies
├── src/                  # Data contract
│   ├── adapters/        # 17 REIT adapters
│   ├── types/           # Schemas
│   └── validation/      # Validators
├── frontend/            # Next.js app
│   ├── app/            # Pages
│   ├── components/     # React components
│   ├── lib/            # Utilities
│   ├── __tests__/      # Tests
│   └── package.json    # Frontend deps
└── droid-wiki/         # This documentation
```

## Troubleshooting

### Port already in use

If `make dev` fails with a port conflict:

```bash
cd frontend
npx next dev -p 3001
```

### Citation verification fails

The build requires all citations to be valid. Run the audit to find issues:

```bash
make audit-citations
```

Orphan references (citations not directly linked to metrics/observations/risks) are automatically linked at the end of adapter processing. If you see failures, check the adapter's `linkCitation()` calls.

### Type errors after changes

If you modified shared types, run typecheck on both root and frontend:

```bash
make typecheck-all
```

Frontend-only changes:

```bash
cd frontend && npm run type-check
```
