# Features

This section documents the main features of the REIT Comparison Dashboard — the pages users interact with to browse, compare, and analyze Malaysian REITs.

## Overview

The dashboard has three primary entry points for users:

| Page | Route | Purpose |
|------|-------|---------|
| **Monitor** | `/monitor` | Browse all REITs in a sortable table with filtering and selection |
| **Compare** | `/compare` | Side-by-side comparison of up to 6 REITs with charts and risk matrices |
| **Entity** | `/entity/[id]` | Deep dive into a single REIT with research memo and full metrics |

## Architecture

All three pages are built on the same foundation:

- **Next.js App Router** with static generation (`generateStaticParams`)
- **Shared data layer** through `comparison-model.ts` and `useEntityData` hook
- **Citation-backed data** — every metric links to source references
- **Consistent styling** via Tailwind CSS with custom design tokens

## Data Flow

```
available-entities.ts    →   comparison-model.ts    →   useEntityData hook
(entity registry)           (JSON loaders)             (React state)
       ↓                          ↓                          ↓
Static params →    Page components    →    Data adapters    →    UI render
```

## Navigation

- [Monitor Page](./monitor-page.md) — Browse and filter all REITs
- [Compare Page](./compare-page.md) — Multi-entity comparison workspace
- [Entity Page](./entity-page.md) — Single REIT analysis and research memos

## Shared Components

These components are used across multiple pages:

| Component | Location | Purpose |
|-----------|----------|---------|
| `Sparkline` | `frontend/components/Sparkline.tsx` | Mini trend charts for DPU history |
| `RiskChip` | `frontend/components/RiskChip.tsx` | Visual risk level indicators |
| `CitationPanel` | `frontend/components/CitationPanel.tsx` | Slide-out panel showing source references |
| `CompareTray` | `frontend/components/reit-research/CompareTray.tsx` | Floating selection tray for comparison |
