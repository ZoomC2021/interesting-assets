# System architecture

The REIT Comparison Dashboard follows a layered architecture with clear separation between data transformation (backend) and presentation (frontend).

## High-Level Architecture

```mermaid
graph TD
    subgraph Sources["Data Sources"]
        AR[Annual Reports]
        QF[Quarterly Filings]
        MD[Market Data]
    end
    
    subgraph Backend["Data Contract Layer (Root)"]
        Adapter[REIT Adapters]
        Linker[Citation Linker]
        Schema[Zod Schemas]
        JSON[Normalized JSON]
    end
    
    subgraph Frontend["Next.js Application"]
        Pages[App Router Pages]
        Components[React Components]
        Lib[Data Loaders]
    end
    
    AR --> Adapter
    QF --> Adapter
    MD --> Adapter
    Adapter --> Linker
    Linker --> Schema
    Schema --> JSON
    JSON --> Lib
    Lib --> Pages
    Pages --> Components
```

## Data Flow

1. **Ingestion** — Annual reports and quarterly filings are parsed into reference JSON files (`{slug}-reit-references.json`).

2. **Adapter Processing** — Each REIT has a dedicated adapter (`src/adapters/{slug}-adapter.ts`) that:
   - Registers all display ID references (T:1, A:1, etc.)
   - Builds normalized entities, metrics, time series, observations, and risk assessments
   - Links every fact to its citation via `linkCitation()`

3. **Validation** — Zod schemas enforce type safety at runtime. Schema validation ensures output conforms to `NormalizedReitData`.

4. **Generation** — `scripts/generate-samples.ts` processes all adapters and writes:
   - `test/samples/{slug}-normalized.json` — for contract testing
   - `frontend/public/data/{slug}.json` — for frontend consumption

5. **Frontend Loading** — Dynamic imports in `frontend/lib/comparison-model.ts` load REIT data at runtime.

6. **Rendering** — React components receive normalized data and render tables, charts, and analysis panels.

## Component Relationships

```mermaid
graph LR
    subgraph DataLayer["Data Layer"]
        CM[comparison-model.ts]
        AE[available-entities.ts]
        EU[entity-analysis.ts]
    end
    
    subgraph Components["UI Components"]
        MP[MonitorPage]
        CP[ComparePage]
        EP[EntityPage]
    end
    
    subgraph Shared["Shared Components"]
        ET[EntityTable]
        MG[KpiGrid]
        CP2[CitationPanel]
        RC[RevenueTrendChart]
    end
    
    CM --> MP
    CM --> CP
    AE --> MP
    EU --> EP
    MP --> ET
    MP --> MG
    CP --> MG
    CP --> RC
    EP --> CP2
```

## Citation System Architecture

The citation system is the backbone of data integrity. Every fact is traceable to its source.

```mermaid
sequenceDiagram
    participant Adapter as REIT Adapter
    participant Linker as CitationLinker
    participant Builder as Metric Builder
    participant Output as Normalized Output
    
    Adapter->>Linker: registerReference('5130.KL', 'T:1', {...})
    Adapter->>Linker: registerReference('5130.KL', 'T:2', {...})
    
    Adapter->>Builder: buildMetrics()
    Builder->>Linker: linkCitation('T:1', {context: 'Metric: dpu'})
    Builder->>Linker: linkCitation('T:2', {context: 'Metric: occupancy_rate'})
    
    Adapter->>Linker: linkAllOrphans()
    Linker-->>Adapter: linkedOrphans[]
    
    Adapter->>Output: generateOutput()
```

Key files:
- `src/adapters/citation-linker.ts` — Core linking logic with UUID generation
- `src/types/reference.ts` — Display ID patterns and reference types
- `src/validation/citation-checker.ts` — Coverage validation

## Directory Responsibilities

| Directory | Purpose |
|-----------|---------|
| `src/adapters/` | Transform source references into normalized format |
| `src/types/` | TypeScript interfaces and Zod schemas |
| `src/validation/` | Schema and citation validation scripts |
| `frontend/app/` | Next.js App Router pages |
| `frontend/components/` | React components (pages + shared) |
| `frontend/lib/` | Data loading, formatting, utilities |
| `frontend/__tests__/` | Jest test suites |
| `frontend/public/data/` | Generated REIT JSON files |

## Build Pipeline

```
make build
├── npm run build          (typecheck root contract)
└── cd frontend && npm run build
    ├── npm run prebuild   (verify citations)
    ├── next build         (static export)
    └── npm run postbuild  (copy public/data to dist/)
```

The build fails if citation verification fails, ensuring no broken links reach production.
