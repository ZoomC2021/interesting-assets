# Adapter Specification Document

## Overview

This document specifies the mapping from existing Atrium/Axis MD+JSON structure to the normalized schema. It establishes the contract for transforming raw source data into the canonical normalized format while preserving citation integrity.

## Source Data Structure

### Atrium REIT (5130.KL)

**Source Files:**
- `Atrium_REIT_Malaysia_Analysis.md` - Primary analysis document
- `atrium-reit-references.json` - 618 citations (T:1 to T:618)

**Document Structure:**
```
1. Executive Summary
2. Company Overview
   2.1 Corporate Structure
   2.2 Portfolio Composition
   2.3 REIT Manager Deep Dive
3. Asset Quality Analysis
   3.1 Occupancy Performance
   3.2 Tenant Quality
   3.3 Property Enhancements
   ...
4. Debt Sustainability Analysis
5. Dividend Sustainability Analysis
6. Financial Performance Summary
7. Industry Context & Benchmark Analysis
8. Malaysian Peer Comparison
```

### Axis REIT (5106.KL)

**Source Files:**
- `Axis_REIT_Malaysia_Analysis.md` - Primary analysis document
- `axis-reit-references.json` - 352 citations (A:1 to A:352)

**Document Structure:**
```
1. Executive Summary
2. Company Overview
   2.1 Corporate Structure
   2.2 REIT Manager Deep Dive
3. Asset Quality Analysis
4. Debt Sustainability Analysis
5. Dividend Sustainability Analysis
6. Financial Performance Summary
7. 2025 Portfolio Activity
8. Industry Context & Benchmark Analysis
9. Peer Comparison
```

## Mapping Specification

### 1. Entity Mapping

| Schema Field | Atrium Source | Axis Source | Transform Rule |
|--------------|---------------|-------------|----------------|
| `code` | "5130.KL" [T:1] | "5106.KL" [A:1] | Direct |
| `name` | "Atrium REIT" [T:5] | "Axis REIT" [A:6] | Extract from title |
| `exchange` | "Bursa Malaysia" [T:23] | "Bursa Malaysia" [A:30] | Direct |
| `isShariahCompliant` | false | true [A:11] | Boolean |
| `listingDate` | 2007-04-02 [T:112] | 2005 [A:35] | Parse from text |
| `manager.name` | "Atrium REIT Managers Sdn Bhd" [T:20] | "Axis REIT Managers Berhad" [A:31] | Direct |
| `manager.ownershipStructure` | "Chan Kam Tuck 59%" [T:32] | "Dispersed institutional" [A:38] | Parse from text |

**Field Semantics Clarification:**

| Spec Field | Schema Mapping | Notes |
|------------|----------------|-------|
| `portfolio.totalProperties` | Metric `portfolio_size` | Number of properties in portfolio (9 Atrium, 69 Axis) |
| `portfolio.totalAssetsRM` | Metric `total_assets` | Total asset value in RM millions (723.24 Atrium, 5360 Axis) |

The normalized schema stores portfolio data as metrics rather than entity fields to maintain consistency with time-series tracking capabilities.

**Asymmetric Disclosure Handling:**
- Atrium does NOT disclose WALE → Metric omitted entirely (no placeholder)
- Atrium does NOT disclose tenant count → Metric omitted entirely
- Atrium does NOT disclose top tenant % → Metric omitted entirely (partial data via `top_tenant_concentration` = 21% for Lumileds)
- Axis discloses all above → All metrics populated normally

**Data Gap Semantics:**
- Missing data → Omit metric entirely (don't include null/undefined)
- `expectedDate` → Not currently implemented in schema v1.0
- Data quality flags: Use `isEstimated`, `isTimeSensitive`, `isDerived` in references

### 2. Metric Mapping (30+ Identifiable Metrics)

#### Portfolio Metrics

| Metric Type | Atrium Source | Axis Source | Notes |
|-------------|---------------|-------------|-------|
| `portfolio_size` | T:8 (9 properties) | A:8 (69 properties) | Direct |
| `total_assets` | T:9 (RM 723.24m) | A:9 (RM 5.36b) | Normalized to millions |
| `investment_properties` | T:27 (RM 684.97m) | A:9 (implied) | From balance sheet |
| `property_count` | T:8 (9) | A:8 (69) | Direct |
| `net_lettable_area` | Not disclosed | A:10 (~15m sq ft) | Asymmetric |
| `geographic_concentration` | T:109 (78% Klang Valley) | Calculated from A:12 | Parse from text |

#### Financial Performance Metrics

| Metric Type | Atrium Source | Axis Source | Notes |
|-------------|---------------|-------------|-------|
| `gross_revenue` | T:18 (RM 51.05m) | A:23 (RM 364.2m) | Direct |
| `net_property_income` | T:19 (RM 45.98m) | A:25 (RM 316.2m) | Direct |
| `realised_income` | T:366 (RM 46.61m) | Calculated | From distribution note |
| `nav_per_unit` | T:17 (RM 1.3874) | A:221 (RM 1.6907) | Direct |
| `share_price` | T:371 (RM 1.280) | A:219 (RM 2.050) | Time-sensitive |

#### Per-Share Metrics

| Metric Type | Atrium Source | Axis Source | Notes |
|-------------|---------------|-------------|-------|
| `dpu` | T:15 (9.30 sen) | A:21 (10.55 sen) | Direct |
| `dpu_growth_yoy` | T:364 (+22.4%) | A:22 (+13.8%) | Parse percentage |
| `dividend_yield_market` | T:375 (7.27%) | A:223 (5.15%) | Calculated |
| `dividend_yield_nav` | T:380 (~6.7%) | A:229 (~6.2%) | Calculated |
| `payout_ratio` | T:368 (~29.9%) | A:216 (~75-76%) | Direct |

#### Leverage Metrics

| Metric Type | Atrium Source | Axis Source | Notes |
|-------------|---------------|-------------|-------|
| `gearing_ratio` | T:12 (~43.5%) | A:16 (~33%) | Direct |
| `interest_coverage` | T:14 (~2.09x) | A:18 (3.8-4.0x) | Parse range |
| `total_borrowings` | T:250 (RM 314.79m) | A:179 (~RM 1.77b) | Direct |
| `fixed_rate_debt_pct` | ~7% (derived) [T:464] | A:19 (65%) | Derived vs direct |
| `floating_rate_debt_pct` | T:312 (~93%) | A:20 (~35%) | Direct |
| `wacd` | T:328 (~3.5-4.0%) | Implied from sukuk | Estimated |

#### Operational Metrics

| Metric Type | Atrium Source | Axis Source | Notes |
|-------------|---------------|-------------|-------|
| `occupancy_rate` | T:10 (100%) | A:14 (94%) | Direct |
| `wale_years` | NOT DISCLOSED | A:15 (4.4 years) | Asymmetric gap |
| `tenant_count` | NOT DISCLOSED | A:239 (182) | Asymmetric gap |
| `top_tenant_concentration` | T:207 (~21% Lumileds) | A:275 (46.7%) | Partial vs full |
| `rental_reversion` | T:204 (positive) | A:121 (>5%) | Qualitative vs quantitative |
| `lease_renewal_rate` | T:203 (100%) | A:118 (73%) | Direct |
| `npi_margin` | ~90% (calculated) | A:324 (~87%) | Calculated |

### 3. Reference/Citation Mapping

**Display ID Format:**
- Atrium: `T:XXX` where XXX is 1-618
- Axis: `A:XXX` where XXX is 1-352

**Citation Linking Contract:**

1. **Preserve Display IDs**: All T:XXX and A:XXX references are maintained
2. **Generate Stable UUIDs**: Each display ID maps to a v5 UUID based on:
   - Namespace: `6ba7b810-9dad-11d1-80b4-00c04fd430c8` (DNS)
   - Name: `atrium-reit:T:123` or `axis-reit:A:123`
3. **Link All Facts**: Every metric, observation, and risk factor links to ≥1 citation
4. **Orphan Prevention**: All 970 references must have at least one linkage

**Reference Quality Flags:**
- `timeSensitive`: True for share prices, yields (marked in source JSON)
- `isDerived`: True for calculated values (e.g., yields from DPU/price)
- `confidenceLevel`: High for annual report data, medium for industry sources

### 4. TimeSeries Mapping

#### Quarterly Revenue Series
- **Atrium**: Q1-Q4 2025 [T:411-T:414]
- **Axis**: Q1-Q4 2025 [A:248, A:249]

#### Historical DPU Series
- **Atrium**: 2021-2025 [T:356-T:363]
- **Axis**: 2021-2025 [A:208-A:214]

#### Debt Maturity Profile
- **Atrium**: Detailed breakdown [T:278-T:298]
- **Axis**: Less granular [A:179-A:181]

#### Lease Expiry Profile
- **Atrium**: NOT DISCLOSED → Mark as data gap
- **Axis**: WALE 4.4 years, no detailed ladder

### 5. Risk Assessment Mapping

**Risk Categories and Sources:**

| Risk Category | Atrium Evidence | Axis Evidence |
|---------------|-----------------|---------------|
| Concentration | 9 properties [T:168], Lumileds ~21% [T:207] | 69 properties [A:8], top 10 at 46.7% [A:275] |
| Gearing | 43.5% vs 60% limit [T:12] | 33% vs 50% limit [A:16] |
| Interest Rate | ~93% floating [T:312], no hedging [T:315] | 65% fixed [A:19], active hedging [A:184] |
| Tenant Rollover | No WALE disclosed | 4.4 years WALE [A:15] |
| Liquidity | RM 340M market cap [T:378] | RM 4.15B market cap [A:227] |
| Transparency | WALE/gaps [T:458] | Full disclosure [A:15, A:275] |
| Geographic | 78% Klang Valley [T:109] | 6-state diversification [A:12] |
| Counterparty | Lumileds SD rating [T:226] | Diversified MNC base [A:276] |
| Governance | 59% family control [T:32], CEO retired [T:47] | Professional structure [A:38], stable [A:64] |

### 6. Observation Mapping

**Priority Assignment Rules:**
- `positive`: New tenancy commencement, record DPU, successful renewals
- `info`: Standard operational metrics, disclosures
- `warning`: Below-benchmark coverage, family control, data gaps
- `critical`: Selective default tenant, high gearing, management disruption

**Observation Types:**
- `executive_summary`: From document introduction
- `portfolio_analysis`: Section 2/3 content
- `debt_sustainability`: Section 4 content
- `dividend_sustainability`: Section 5 content
- `peer_comparison`: Cross-REIT comparison sections

## Transformation Rules

### Currency Normalization
- All monetary values stored in RM (MYR)
- Large values in millions (e.g., 723.24 = RM 723.24 million)
- Per-unit values in sen for DPU, RM for NAV/share price

### Percentage Handling
- Store as decimal (e.g., 43.5% → 43.5)
- Distinguish calculated vs reported percentages

### Date Normalization
- All dates in ISO 8601 format: YYYY-MM-DD
- Fiscal year references: FY2025 = Jan 1 - Dec 31, 2025
- Time-sensitive data flagged with `timeSensitive: true`

### Null/Undefined Handling
- Asymmetric disclosures: Set to `undefined`, flag with `dataGap: true`
- Not applicable: Set to `null`
- Pending disclosure: Set to `undefined`, flag with `expectedDate` if known

## Validation Rules

### Schema Conformance
1. All UUIDs must be valid v4 or v5 format
2. All display IDs must match T:XXX or A:XXX pattern
3. All dates must be valid ISO 8601
4. All enum values must be from defined sets

### Citation Coverage
1. Every metric must have ≥1 sourceDisplayId
2. Every observation must have ≥1 sourceDisplayId
3. Every risk factor must have ≥1 sourceDisplayId
4. All 970 references must be linked to at least one fact
5. Orphan references (unlinked) = 0 target

### Data Quality
1. Time-sensitive data must have `timeSensitive: true`
2. Calculated values must have `isDerived: true` in reference
3. Estimated values must have `confidenceLevel` < 'high'
4. Data gaps must have explanatory note

## Implementation Notes

### Asymmetric Disclosure Support
The schema explicitly supports asymmetric disclosure patterns:
- Missing WALE for Atrium: No error, marked as gap
- Missing tenant count for Atrium: No error, marked as gap
- Different metrics available per REIT: Normal and expected

### Citation Linking Strategy
1. Parse reference JSON files first
2. Build lookup map: displayId → Reference object
3. During metric/observation extraction, capture all cited display IDs
4. Validate all referenced display IDs exist in lookup
5. Generate UUID-to-UUID linkage graph
6. Verify 100% coverage in final validation pass

### Performance Considerations
- Pre-parse reference files and cache lookup maps
- Use streaming JSON parsing for large documents
- Validate incrementally: structure → types → citations
