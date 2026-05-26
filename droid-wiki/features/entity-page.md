# Entity Page

**Active contributors:** Entity page is the main research interface, maintained with the memo system.

## Purpose

The Entity page is the deep-dive view for a single REIT. It combines a written research memo (when available) with a comprehensive data room of all metrics. Users can read analyst commentary, view trend charts, check geographic distribution, and drill into any metric's source citations. The page is statically generated for all entity codes and their aliases.

## Key Components

| Component | File | Role |
|-----------|------|------|
| `EntityPage` | `frontend/components/reit-research/pages/EntityPage.tsx` | Main page with memo/data-room tabs |
| `MemoMarkdown` | `frontend/components/MemoMarkdown.tsx` | Renders markdown memos with citation links |
| `KpiGrid` | `frontend/components/KpiGrid.tsx` | Dense metric table (data room view) |
| `CitationPanel` | `frontend/components/CitationPanel.tsx` | Source reference slide-out |
| `Sparkline` | `frontend/components/Sparkline.tsx` | 5-year DPU trend chart |
| `RiskChip` | `frontend/components/RiskChip.tsx` | Overall risk indicator |
| `Figure` | `frontend/components/Figure.tsx` | Captioned chart containers |
| `Callout` | `frontend/components/Callout.tsx` | Info/thesis boxes |

## Data Flow

1. `generateStaticParams()` pre-builds routes for all entity codes + aliases
2. `loadEntityAnalysisMarkdown()` fetches the research memo at build time
3. `useEntityData()` loads normalized JSON for the ticker
4. `adaptReitData()` transforms to a single REIT view model
5. `extractMemoOutline()` parses markdown headings for document navigation

```typescript
// From entity/[id]/page.tsx
export function generateStaticParams() {
  return ENTITY_STATIC_ROUTE_CODES.map((id) => ({ id }));
}

const analysisMarkdown = await loadEntityAnalysisMarkdown(params.id);
return <EntityPage ticker={params.id} analysisMarkdown={analysisMarkdown} />;
```

## Page Layout

Three-column responsive layout (lg breakpoint):

```
┌─────────────────────────────────────────────────────────────┐
│  Header (sticky)                                            │
│  ← Back | Name (TICKER) | Sector [Shariah?] | Manager | Date │
│  [Memo] [Data Room] tabs                                     │
├────────────┬─────────────────────────────┬──────────────────┤
│            │                             │                  │
│  Document  │      Main Content           │    Fact Sheet    │
│  Outline   │                             │    (sticky)      │
│  (sticky)  │  ─────────────────────────  │                  │
│            │  Executive Summary          │  RM X.XX         │
│  • Exec    │  [Written analysis or       │  [Price change]  │
│    Summary │   auto-generated summary]   │                  │
│  • Company │                             │  Risk: [chip]    │
│    Overview│  ─────────────────────────  │                  │
│  • etc.    │  [Figures, Callouts]        │  Key metrics...  │
│            │                             │                  │
│            │  ─────────────────────────  │  5Y DPU Trend    │
│            │  Next section...            │  [Sparkline]     │
│            │                             │                  │
│            │                             │  Last assessed   │
│            │                             │  X citations →   │
└────────────┴─────────────────────────────┴──────────────────┘
```

## Memo Tab

### Full Memo Mode
When `analysisMarkdown` is provided:
- `MemoMarkdown` renders with citation chip interactions
- Document outline extracted from markdown headings
- Click outline items → smooth scroll to section

### Fallback Mode
When no memo exists:
- Auto-generated summary using template strings with actual data
- Fallback sections: Executive Summary, Company Overview, Financials, Debt, Thesis
- Geographic distribution bar chart (if data available)
- DPU history bar chart
- `Callout` component explaining memo is pending

```typescript
const FALLBACK_SECTIONS: MemoOutlineEntry[] = [
  { id: 'executive-summary', label: 'Executive Summary' },
  { id: 'company-overview', label: 'Company Overview' },
  { id: 'financials', label: 'Financial Performance' },
  { id: 'debt', label: 'Debt Sustainability' },
  { id: 'thesis', label: 'Outlook & Thesis' },
];
```

## Data Room Tab

Switches to `KpiGrid` component showing:
- All metrics from `METRIC_REGISTRY`
- Grouped by category (Portfolio, Financial, Per-Share, etc.)
- Citation counts per metric
- Click any row to open citations for that metric

## Fact Sheet (Right Sidebar)

Sticky card showing:
| Item | Data |
|------|------|
| Share price | RM with price change indicator |
| Risk level | `RiskChip` badge |
| Key metrics | Yield, P/B, Gearing, Interest Cover, WALE |
| 5Y DPU trend | Full-width sparkline |
| Metadata | Last assessed date, citation count |

### Share Button
- Web Share API (if available)
- Falls back to clipboard copy
- Feedback animation on success

### Download Button
Exports full entity snapshot as JSON:
```json
{
  "exportedAt": "2026-04-30T...",
  "entity": { "ticker": "...", "name": "..." },
  "metrics": { "sharePrice": ..., "yield": ... },
  "raw": { /* full NormalizedReitData */ }
}
```

## User Interactions

| Action | How | Result |
|--------|-----|--------|
| Switch tab | Click "Memo" / "Data Room" | Content swaps |
| Navigate outline | Click section link | Smooth scroll to heading |
| View citations | Click citation chip `[R:1]` | Opens `CitationPanel` to that source |
| View all citations | Click "X citations →" in sidebar | Opens panel with all refs |
| Back to top | Click button or outline link | Scroll to top |
| Share page | Click share icon | Copies URL or uses native share |
| Download data | Click download icon | JSON export of entity data |
| View metric sources | Click metric row in Data Room | Opens citations for that metric |

## ScrollSpy Behavior

Active outline section updates as user scrolls:

```typescript
const handleScroll = () => {
  const scrollPosition = window.scrollY + 140;
  for (let index = sectionElements.length - 1; index >= 0; index--) {
    const element = sectionElements[index];
    const offsetTop = element.getBoundingClientRect().top + window.scrollY;
    if (element && offsetTop <= scrollPosition) {
      setActiveSection(outlineSections[index].id);
      break;
    }
  }
};
```

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/app/entity/[id]/page.tsx` | Route with static params, memo loading |
| `frontend/components/reit-research/pages/EntityPage.tsx` | 700+ line main component |
| `frontend/components/MemoMarkdown.tsx` | Markdown rendering with citations |
| `frontend/components/KpiGrid.tsx` | Data room metric table |
| `frontend/lib/entity-analysis.ts` | `loadEntityAnalysisMarkdown()` mapping |
| `frontend/lib/memo-outline.ts` | `extractMemoOutline()` parser |
| `frontend/lib/entity-route-params.ts` | `ENTITY_STATIC_ROUTE_CODES` for SSG |

## Markdown Memo Format

Research memos in repo root follow this pattern:
```markdown
# {Name} REIT Malaysia Analysis

## Executive Summary
Key points [R:1] with citations inline.

## Company Overview
Manager details [T:1], portfolio [A:1].

## Financial Performance
DPU trends...
```

Citation format in text: `[R:1]`, `[T:1]`, `[A:1]` — maps to `references.json` entries.

## Static Generation

All entity pages pre-built at build time:

```typescript
export function generateStaticParams() {
  return ENTITY_STATIC_ROUTE_CODES.map((id) => ({ id }));
  // Returns ~20 codes including aliases like '5235.KL' → KLCC
}
```

This enables:
- Fast page loads (no client data fetch on first render)
- SEO-friendly HTML
- Working deploys to static hosts

## Related

- [Monitor Page](./monitor-page.md) — Entry point, links here via "Memo →"
- [Compare Page](./compare-page.md) — Compare workspace, links here from entity names
