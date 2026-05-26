# Patterns and conventions

Coding standards and architectural patterns used in this codebase.

## TypeScript Conventions

### Strictness

Keep TypeScript strictness intact. Do not weaken types to silence errors.

Preferred:
```typescript
// Explicit return type
function buildMetrics(): Metric[] { ... }

// Discriminated union
interface Metric { metricType: MetricType; ... }
```

Avoid:
```typescript
// Implicit any
function process(data) { ... }

// Type assertions to silence errors
const x = data as any;
```

### Import Style

Inside `frontend/`, use the `@/*` alias:

```typescript
import { AppShell } from '@/components/reit-research/AppShell';
import { formatPercentage } from '@/lib/formatters';
```

Outside `frontend/`, use relative imports:

```typescript
import { CitationLinker } from './citation-linker';
import { Metric } from '../types/schema';
```

## Frontend Conventions

### Component Structure

Favor composable React function components with explicit prop interfaces:

```typescript
interface MetricCardProps {
  metric: Metric;
  showSparkline?: boolean;
}

export function MetricCard({ metric, showSparkline = false }: MetricCardProps) {
  // Implementation
}
```

### Design Tokens

Reuse existing design tokens rather than ad hoc colors:

```typescript
// Good — uses design tokens
<div className="bg-success text-ink-muted">

// Avoid — arbitrary values
<div className="bg-green-500 text-gray-400">
```

Common tokens:
- `bg-canvas`, `bg-surface`, `bg-success`, `bg-warning`, `bg-error`
- `text-ink`, `text-ink-muted`, `text-on-success`
- `border-hairline`, `border-divider`

### Accessibility

Keep components accessible:
- Semantic HTML where possible (`<button>` not `<div onClick>`)
- Keyboard focus visibility
- Avoid color-only status signaling (add icons or text)
- Skip links for keyboard navigation

## Adapter Patterns

### Adapter Structure

Every REIT adapter follows this pattern:

```typescript
export class {Reit}Adapter {
  constructor(private linker: CitationLinker) {}
  
  processReferences(sourceData: Record<string, any>): void { ... }
  buildEntity(): Entity { ... }
  buildMetrics(): Metric[] { ... }
  buildTimeSeries(): TimeSeries[] { ... }
  buildRiskAssessment(): RiskAssessment { ... }
  buildObservations(): Observation[] { ... }
  generateOutput(): NormalizedReitData { ... }
}
```

### Citation Wiring

Always link citations explicitly:

```typescript
// In metric builder
this.linker.linkCitation('T:1', {
  linkType: 'primary',
  linkedBy: 'metric-builder',
  context: 'Metric: dpu',
  metricType: 'dpu'
});

// In risk builder
this.linker.linkCitation('T:2', {
  linkType: 'primary',
  linkedBy: 'risk-builder',
  context: 'Risk: interest_rate',
  riskCategory: 'interest_rate'
});
```

Call `linkAllOrphans()` at the end of processing to ensure 100% coverage:

```typescript
const linkedOrphans = this.linker.linkAllOrphans('Source reference - Atrium REIT');
```

## Error Handling

### Schema Validation

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

const MetricSchema = z.object({
  id: z.string().uuid(),
  metricType: z.enum([...]),
  value: z.union([z.number(), z.string(), z.boolean()]),
  // ...
});

// Validate
try {
  const metric = MetricSchema.parse(rawData);
} catch (error) {
  // Handle validation error
}
```

### Defensive Coding

Handle missing data gracefully:

```typescript
// Skip metrics that aren't disclosed (asymmetric disclosure)
// Note: WALE NOT DISCLOSED - skip (asymmetric)

// Use optional chaining for potentially undefined values
const ref = this.linker.lookup(displayId);
if (ref) {
  refUuids.push(ref.id);
}
```

## Testing Patterns

### Test Structure

```typescript
describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName prop={value} />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
  
  it('handles interaction', async () => {
    render(<ComponentName />);
    await userEvent.click(screen.getByRole('button'));
    // Assert result
  });
});
```

### Accessibility Testing

```typescript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  expect(await axe(container)).toHaveNoViolations();
});
```

## File Organization

### Naming Conventions

- Components: PascalCase (`MetricCard.tsx`, `EntityTable.tsx`)
- Utilities: camelCase (`formatters.ts`, `data-utils.ts`)
- Adapters: kebab-case (`{slug}-adapter.ts`)
- Tests: Same name as file under test + `.test.ts`

### Directory Structure

Group by feature, not file type:

```
frontend/
├── app/              # Next.js pages
├── components/       # React components
│   ├── reit-research/  # Page-level components
│   └── ...             # Shared components
├── lib/              # Utilities and data loading
├── types/            # TypeScript types
└── __tests__/        # Test files
```

## Performance Guidelines

### Render-Path Optimizations

Keep render-path allocations low for frequently rendered UI:

```typescript
// Hoist static maps/config
const METRIC_LABELS: Record<MetricType, string> = {
  dpu: 'Distribution Per Unit',
  // ...
};

// Use memoization for expensive calculations
const processedData = useMemo(() => {
  return expensiveTransform(data);
}, [data]);
```

### Responsive Design

Preserve responsive behavior across devices:

```typescript
// Tailwind responsive prefixes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
