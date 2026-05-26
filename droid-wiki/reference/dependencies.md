# Dependencies

Package dependencies and their purposes.

## Root Dependencies (Data Contract)

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.22.4 | Schema validation with TypeScript inference |
| `uuid` | ^14.0.0 | UUID generation for entities and references |
| `pdf-parse` | ^1.1.1 | PDF text extraction for ingestion |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.3 | TypeScript compiler |
| `ts-node` | ^10.9.2 | TypeScript execution for scripts |
| `jest` | ^29.7.0 | Test framework |
| `ts-jest` | ^29.1.2 | Jest TypeScript support |
| `@types/*` | various | Type definitions |

## Frontend Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.35 | React framework with App Router |
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM renderer |
| `recharts` | ^2.12.7 | Charting library |
| `@tanstack/react-table` | ^8.21.3 | Headless table component |
| `react-markdown` | ^10.1.0 | Markdown rendering |
| `remark-gfm` | ^4.0.1 | GitHub-flavored markdown support |
| `uuid` | ^9.0.1 | UUID generation |
| `clsx` | ^2.1.1 | Conditional class names |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.4.5 | TypeScript compiler |
| `tailwindcss` | ^3.4.4 | Utility-first CSS |
| `postcss` | ^8.4.38 | CSS processing |
| `autoprefixer` | ^10.4.19 | CSS autoprefixing |
| `jest` | ^29.7.0 | Test framework |
| `jest-environment-jsdom` | ^29.7.0 | Browser environment for Jest |
| `jest-axe` | ^9.0.0 | Accessibility testing |
| `@testing-library/*` | various | React testing utilities |
| `eslint` | ^9.39.4 | Linting |
| `eslint-config-next` | ^14.2.35 | Next.js ESLint rules |
| `patch-package` | ^8.0.0 | Post-install patches |

## Dependency Analysis

### Zero Vulnerabilities Target

The project maintains clean dependency trees. No known security vulnerabilities in production dependencies.

### Bundle Size Targets

| Metric | Target | Status |
|--------|--------|--------|
| App JS (gzipped) | <200 KB | ~83 KB ✅ |
| First Load JS | <200 KB | ~87 KB ✅ |

Recharts is the largest dependency but is loaded dynamically on chart pages only.

### Update Cadence

| Category | Frequency |
|----------|-----------|
| Security patches | ASAP |
| Minor updates | Monthly |
| Major updates | Quarterly review |

## Lock Files

- `package-lock.json` — Root dependencies
- `frontend/package-lock.json` — Frontend dependencies

Both are committed to ensure reproducible builds.

## Key Source Files

| File | Purpose |
|------|---------|
| `package.json` | Root dependencies and scripts |
| `frontend/package.json` | Frontend dependencies |
| `package-lock.json` | Locked root dependency versions |
| `frontend/package-lock.json` | Locked frontend dependency versions |
| `frontend/patches/*` | Post-install patches |
