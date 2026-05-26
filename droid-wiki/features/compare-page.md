# Compare Page

**Active contributors:** Compare page shares components with Monitor and Entity pages.

## Purpose

The Compare page is the workspace for side-by-side REIT analysis. Users can compare up to 6 REITs across 33+ metrics, with best/worst highlighting, trend visualizations, and risk matrix breakdowns. The page supports both a default comparison set and dynamic URL-based selections (`/compare/[entityIds]`).

## Key Components

| Component | File | Role |
|-----------|------|------|
| `ComparePage` | `frontend/components/reit-research/pages/ComparePage.tsx` | Main comparison workspace |
| `RiskMatrix` | `frontend/components/RiskMatrix.tsx` | Risk factor grid showing severity per entity |
| `Sparkline` | `frontend/components/Sparkline.tsx` | DPU trend charts per entity |
| `CitationPanel` | `frontend/components/CitationPanel.tsx` | Source reference slide-out |
| `CustomizePanel` | (inline in ComparePage.tsx) | Metric visibility settings drawer |
| `AddReitModal` | `frontend/components/reit-research/AddReitModal.tsx` | Entity picker for adding to comparison |

## Data Flow

1. **Route params** parsed from `/compare/[entityIds]` or fall back to defaults
2. `useEntityData()` loads normalized data for selected entity codes
3. `adaptReitsData()` transforms to REIT view models
4. `METRIC_REGISTRY` drives dynamic metric generation
5. Best/worst values computed per metric for visual highlighting

```typescript
// Metrics generated dynamically from registry
const metrics: CompareMetric[] = Object.values(METRIC_REGISTRY).map((def) => ({
  id: def.type,
  name: def.displayName,
  unit: def.unit,
  category: REGISTRY_TO_COMPARE_CATEGORY[def.category],
  format: REGISTRY_TO_COMPARE_FORMAT[def.format],
  sourceMetricType: def.type,
  invertBest: def.isHigherBetter === false,
}));
```

## User Interactions

### Entity Management
| Action | Control | Limit |
|--------|---------|-------|
| Remove entity | X button in header card | Must keep at least 1 |
| Add entity | "Add REIT" button | Max 6 total |
| Add via modal | `AddReitModal` | Filters already-selected |

### Metric Categories
Filter bar with 8 categories: All, Portfolio, Financial, Per-Share, Leverage, Operational, Risk, Market

### Customize Panel
- Toggle individual metrics on/off
- "Show All" / "Show Minimal" bulk actions
- Changes persist to `localStorage`

```typescript
const STORAGE_KEY = 'reit-compare-visible-metrics';
```

### Citation Access
- Click citation count badge on any metric row
- Opens `CitationPanel` with filtered sources for that metric
- Supports "Copy All" to clipboard

## Comparison Table

| Feature | Implementation |
|---------|----------------|
| Row per metric | 33+ metrics from registry |
| Column per entity | Dynamic width (160-240px) |
| Best highlighting | `bg-highlight/30` for best value per metric |
| Worst dimming | `text-ink-muted` for worst value |
| Sticky entity header | Top offset with shadow |
| Unit display | Subscript labels under metric names |

## Visualizations

### 1. 5Y DPU Trend Chart
```
┌─────────────────────────────┐
│  5Y DPU Trend (sen)         │
│  ┌────┐                      │
│  │/\/│  ← Sparkline per REIT │
│  └────┘                      │
│  [REIT1] [REIT2] [REIT3]    │
└─────────────────────────────┘
```

### 2. Yield vs Gearing Scatter
- X-axis: Gearing % (18-50%)
- Y-axis: Yield % (4-9%)
- Dots positioned relatively, tooltips on hover

### 3. Risk Profile
- Vertical list of selected REITs
- `RiskChip` + numeric score (`3.5/5.0`)

### 4. Risk Matrix
Full grid with:
- Rows: Risk categories (concentration, gearing, interest rate, tenant rollover, liquidity, governance)
- Columns: Selected entities
- Cells: Severity badges (low/moderate/high/critical)

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/app/compare/page.tsx` | Default compare route (no IDs) |
| `frontend/app/compare/[entityIds]/page.tsx` | Dynamic route with entity list |
| `frontend/components/reit-research/pages/ComparePage.tsx` | 600+ line main component |
| `frontend/components/RiskMatrix.tsx` | Risk breakdown grid |
| `frontend/components/CitationPanel.tsx` | Source panel (shared) |
| `frontend/lib/comparison-model.ts` | Entity loading, comparison building |
| `frontend/lib/data-utils.ts` | `METRIC_REGISTRY`, formatting |
| `frontend/lib/entity-route-params.ts` | Route param parsing |

## URL Patterns

| URL | Behavior |
|-----|----------|
| `/compare` | Loads default 4 REITs (first in registry) |
| `/compare/5130.KL,5106.KL` | Compares Atrium + Axis |
| `/compare/amfirst,axis,atrium` | Aliases resolved via `normalizeEntityCodes` |

## Local State Persistence

Visible metrics saved to localStorage for returning users:

```typescript
// Load on mount
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) setVisibleMetricIds(JSON.parse(saved));

// Save on change
localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleMetricIds));
```

## Related

- [Monitor Page](./monitor-page.md) — Source of selected REITs via CompareTray
- [Entity Page](./entity-page.md) — Linked from entity names in header
