# Testing

Testing frameworks, patterns, and how to run tests.

## Test Frameworks

The project uses **Jest** with the following configurations:

### Root (Data Contract)

- Framework: Jest 29
- Environment: Node.js
- Config: `jest.config.js`

### Frontend

- Framework: Jest 29
- Environment: jsdom (browser simulation)
- Utilities: React Testing Library, jest-axe (accessibility)
- Config: `frontend/jest.config.js`

## Running Tests

### All Tests

```bash
make test
```

This runs root tests followed by frontend tests.

### Root Tests Only

```bash
npm test
```

Or with watch mode:

```bash
npm run test:watch
```

### Frontend Tests Only

```bash
cd frontend && npm test
```

Or with coverage:

```bash
cd frontend && npm run test:coverage
```

### Coverage

```bash
make test-coverage  # Frontend coverage only
```

Coverage reports are written to `frontend/coverage/`.

## Test Types

### Unit Tests

Test individual functions and utilities:

```typescript
// lib/__tests__/formatters.test.ts
describe('formatPercentage', () => {
  it('formats positive percentages', () => {
    expect(formatPercentage(7.5)).toBe('+7.5%');
  });
  
  it('formats negative percentages', () => {
    expect(formatPercentage(-2.3)).toBe('-2.3%');
  });
});
```

### Component Tests

Test React components with React Testing Library:

```typescript
// __tests__/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders metric value', () => {
    render(<MetricCard metric={mockMetric} />);
    expect(screen.getByText('9.30 sen')).toBeInTheDocument();
  });
  
  it('shows trend indicator for time-sensitive metrics', () => {
    render(<MetricCard metric={marketCapMetric} />);
    expect(screen.getByLabelText('Time sensitive data')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

Use jest-axe for automated accessibility checks:

```typescript
// __tests__/a11y/axe-core.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MonitorPage } from '@/components/reit-research/pages/MonitorPage';

describe('MonitorPage accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<MonitorPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Responsive Tests

Test behavior across breakpoints:

```typescript
// __tests__/a11y/responsive.test.tsx
describe('EntityTable responsive', () => {
  it('renders all columns on desktop', () => {
    window.innerWidth = 1280;
    render(<EntityTable data={mockData} />);
    expect(screen.getByText('WALE')).toBeInTheDocument();
  });
  
  it('hides less critical columns on mobile', () => {
    window.innerWidth = 375;
    render(<EntityTable data={mockData} />);
    expect(screen.queryByText('WALE')).not.toBeVisible();
  });
});
```

### E2E Workflow Tests

Test user journeys:

```typescript
// __tests__/e2e/workflow.test.tsx
describe('REIT comparison workflow', () => {
  it('allows selecting REITs for comparison', async () => {
    render(<MonitorPage />);
    
    // Select two REITs
    await userEvent.click(screen.getByLabelText('Select Atrium REIT'));
    await userEvent.click(screen.getByLabelText('Select Axis REIT'));
    
    // Navigate to compare
    await userEvent.click(screen.getByRole('link', { name: 'Compare' }));
    
    // Verify both REITs shown
    expect(screen.getByText('Atrium REIT')).toBeInTheDocument();
    expect(screen.getByText('Axis REIT')).toBeInTheDocument();
  });
});
```

## Testing Utilities

### Mock Data

Use mocks from `__mocks__/`:

```typescript
import { mockReitData } from '@/__mocks__/reit-data';
```

### Custom Render

Wrap components with necessary providers:

```typescript
// test-utils.tsx
import { render as rtlRender } from '@testing-library/react';

function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AppShell>{children}</AppShell>
    ),
    ...options,
  });
}

export * from '@testing-library/react';
export { render };
```

## Test Patterns

### Async Testing

Use `waitFor` for async assertions:

```typescript
import { waitFor } from '@testing-library/react';

it('loads data asynchronously', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### User Events

Use `@testing-library/user-event` for realistic interactions:

```typescript
import userEvent from '@testing-library/user-event';

it('handles user input', async () => {
  render(<SearchInput />);
  
  const input = screen.getByRole('searchbox');
  await userEvent.type(input, 'Atrium');
  
  expect(input).toHaveValue('Atrium');
});
```

## Schema Validation Tests

Test that adapters produce valid output:

```typescript
// Root tests
import { NormalizedReitDataSchema } from './src/types/schema';

describe('Atrium adapter output', () => {
  it('validates against schema', () => {
    const output = generateAtriumSample();
    expect(() => {
      NormalizedReitDataSchema.parse(output);
    }).not.toThrow();
  });
});
```

## Common Issues

### "Unable to find element"

Check that you're querying correctly:

```typescript
// ❌ May fail if element not immediately present
screen.getByText('Loading');

// ✅ Wait for element
await screen.findByText('Loading');
```

### "act() warnings"

Wrap state updates:

```typescript
await act(async () => {
  await userEvent.click(button);
});
```

## Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Components | 80%+ |
| Utilities | 90%+ |
| Adapters | 70%+ (schema validation covers correctness) |
