# Changelog

All notable changes to the REIT Comparison Dashboard project.

## [1.0.0] - 2026-04-25

### Milestone 5: Quality Gate & Production Readiness

#### Quality Assurance
- **Responsive Testing**: Verified all breakpoints (320px, 375px, 768px, 1024px, 1440px)
- **Accessibility Pass**: Axe-core automated tests, WCAG AA color contrast compliance
- **Keyboard Workflow**: Full keyboard navigation support across all pages
- **Screen Reader**: Optimized announcements and ARIA labels
- **Performance**: Lighthouse scores meet all thresholds

#### Testing
- 153 tests passing
- E2E workflow tests (Home → Monitor → Compare → Citations)
- Keyboard navigation tests for all pages
- Responsive tests (320px, 375px, 768px, 1024px, 1440px)
- Direct URL access tests
- State preservation tests
- Axe-core accessibility tests with jest-axe (0 violations)

#### Documentation
- Complete README.md with setup instructions
- Frontend-specific README.md
- This CHANGELOG.md
- Deployment notes

#### Content Verification
- 970 references verified (618 Atrium + 352 Axis)
- 30+ metrics across 10 REITs
- All citation links validated

#### Build Verification
- Clean build from fresh state
- TypeScript compilation passes
- No build errors or warnings
- Static export configured

---

## [0.4.0] - 2026-04-24

### Milestone 4: Data Integration & Citation System

#### Features
- Citation panel with accessibility features
- Source filtering and grouping
- Copy-to-clipboard functionality
- Focus trapping and keyboard navigation
- Screen reader announcements

#### Data
- 618 Atrium REIT references
- 352 Axis REIT references
- 970 total verified references

---

## [0.3.0] - 2026-04-20

### Milestone 3: Monitor Page & Data Tables

#### Features
- Entity table with 30+ sortable columns
- Sparkline charts for trend visualization
- Risk badges and benchmark indicators
- Filter bar with search functionality
- Virtualized table for performance
- Mobile-responsive card view

#### Components
- EntityTable with sorting and filtering
- EntityCard for mobile view
- SparklineChart for mini-trends
- RiskBadge component
- BenchmarkIndicator component
- FilterBar component

---

## [0.2.0] - 2026-04-15

### Milestone 2: Compare Page & Visualization

#### Features
- Multi-entity comparison page
- KPI grid layout
- Revenue trend charts
- DPU trend charts
- Risk matrix visualization
- Bullet charts for benchmark comparison

#### Components
- KpiGrid for metric display
- RevenueTrendChart
- DpuTrendChart
- RiskMatrix
- BulletChart
- EntitySelector

---

## [0.1.0] - 2026-04-10

### Milestone 1: Foundation & Entity Pages

#### Features
- Project scaffolding with Next.js 14
- TypeScript configuration
- Tailwind CSS setup
- Data contract and schema definition
- Adapter pattern for data normalization
- Home page with navigation
- Basic entity detail pages

#### Components
- MetricCard
- CitationPanel (basic)
- Layout components

#### Data
- Atrium REIT data integration
- Axis REIT data integration
- Reference schema definition

---

## Pre-Milestone

### Initial Setup
- Repository creation
- Documentation framework
- Data analysis and research
- Schema design
- Technology selection
