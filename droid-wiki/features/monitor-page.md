# Monitor Page

**Active contributors:** Monitor page is maintained alongside the core data layer.

## Purpose

The Monitor page is the dashboard's home screen — a fast, information-dense view of all Malaysian REITs in a single sortable table. Users can scan dozens of REITs at once, filter by sector or shariah compliance, set range filters for market cap and yield, and select up to 6 REITs to compare side-by-side.

## Key Components

| Component | File | Role |
|-----------|------|------|
| `MonitorPage` | `frontend/components/reit-research/pages/MonitorPage.tsx` | Main page component with table, filters, and selection state |
| `FilterSidebar` | `frontend/components/reit-research/FilterSidebar.tsx` | Left sidebar with search, sectors, shariah toggle, and range sliders |
| `CompareTray` | `frontend/components/reit-research/CompareTray.tsx` | Floating bottom tray showing selected REITs with comparison CTA |
| `Sparkline` | `frontend/components/Sparkline.tsx` | Tiny 5-year DPU trend charts rendered in table cells |
| `RiskChip` | `frontend/components/RiskChip.tsx` | Compact risk level badges (low/moderate/high) |

## Data Flow

1. `useEntityData()` loads all entity codes from `AVAILABLE_ENTITIES`
2. `adaptReitsData()` transforms normalized data into REIT view models
3. Local state manages filters (search, sectors, shariah, ranges) and sorting
4. `filteredAndSortedData` computed via `useMemo` applies all active filters

```typescript
// From MonitorPage.tsx
const entityCodes = useMemo(() => AVAILABLE_ENTITIES.map(({ code }) => code), []);
const { data: entityData, isLoading, error } = useEntityData(entityCodes);
const reitsData = useMemo(() => adaptReitsData(entityData), [entityData]);
```

## User Interactions

### Sorting
- Click any column header to sort ascending → descending → reset
- 13 sortable columns including market cap, yield, gearing, WALE, risk level

### Filtering
| Filter | Control | Notes |
|--------|---------|-------|
| Search | Text input | Matches name or ticker |
| Sectors | Checkbox group | Dynamic based on loaded data |
| Shariah compliant | Toggle | Filters to S-badge REITs only |
| Market cap | Range slider | Min/max computed from data |
| Yield | Range slider | Min/max computed from data |

### Selection
- Checkboxes on each row toggle selection (max 6 REITs)
| CompareTray appears with selected count and "Compare" button |

### Range Filter State
```typescript
const [marketCapRange, setMarketCapRange] = useState<RangeFilter>(DEFAULT_MARKET_CAP_RANGE);
const [yieldRange, setYieldRange] = useState<RangeFilter>(DEFAULT_YIELD_RANGE);
```

## Table Columns

| Column | Data | Format |
|--------|------|--------|
| Select | Checkbox | 48px wide sticky |
| Name + Ticker | `name`, `ticker` | Sticky left column |
| Sector | `sector` | With Shariah badge |
| Market Cap | `marketCap` | RM M, right-aligned |
| Share Price | `sharePrice` | RM, right-aligned |
| DPU | `dpu` | sen, right-aligned |
| Yield | `yield` | %, right-aligned |
| P/B | `priceToBook` | x, right-aligned |
| Gearing | `gearing` | %, right-aligned |
| Occupancy | `occupancy` | %, right-aligned |
| WALE | `wale` | years, right-aligned |
| 5Y DPU Trend | `dpuHistory` | Sparkline chart |
| Risk | `overallRisk` | RiskChip component |
| Citations | `citationCount` | Badge count |
| Actions | Link | "Memo →" link to entity page |

## Key Source Files

| File | Purpose |
|------|---------|
| `frontend/app/monitor/page.tsx` | Route entry, delegates to MonitorPage |
| `frontend/components/reit-research/pages/MonitorPage.tsx` | 400+ line main component |
| `frontend/components/reit-research/FilterSidebar.tsx` | Sidebar filter UI |
| `frontend/components/reit-research/CompareTray.tsx` | Bottom selection tray |
| `frontend/lib/available-entities.ts` | Entity registry for loading all REITs |
| `frontend/data/reits.ts` | `adaptReitsData()` transformation |
| `frontend/hooks/useEntityData.ts` | Data fetching hook |

## Design Notes

- Zebra striping in compact mode for readability
- Sticky header (top offset `h-10` header bar)
- Sticky first column (name/ticker) on horizontal scroll
- Minimum table width 1300px ensures no column wrapping
- Selection highlight uses `bg-highlight/30`

## Related

- [Compare Page](./compare-page.md) — Destination after selecting REITs
- [Entity Page](./entity-page.md) — Linked via "Memo →" column
