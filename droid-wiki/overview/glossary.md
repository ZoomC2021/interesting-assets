# Glossary

REIT-specific and project-specific terminology.

## REIT Terms

| Term | Definition |
|------|------------|
| **REIT** | Real Estate Investment Trust — a company that owns, operates, or finances income-producing real estate |
| **DPU** | Distribution Per Unit — the dividend paid to unitholders per unit held |
| **NAV** | Net Asset Value — total assets minus liabilities, divided by units outstanding |
| **NPI** | Net Property Income — gross rental income minus property operating expenses |
| **WALE** | Weighted Average Lease Expiry — average time until tenant leases expire, weighted by rent |
| **NLA** | Net Lettable Area — the total floor area available for lease |
| **AEI** | Asset Enhancement Initiative — improvements to existing properties to increase value |
| **Gearing Ratio** | Total borrowings divided by total assets — a leverage metric |
| **Interest Cover** | Net property income divided by finance costs — ability to pay interest |
| **WACD** | Weighted Average Cost of Debt — average interest rate on all borrowings |
| **Shariah Compliant** | Investment that adheres to Islamic law principles |
| **Stapled Security** | A security combining a REIT unit and a share in a related company |

## Project Terms

| Term | Definition |
|------|------------|
| **Adapter** | A TypeScript class that transforms source reference data into normalized format |
| **Citation** | A reference linking a fact to its source document (annual report, filing, etc.) |
| **Display ID** | Human-readable citation ID (e.g., `T:1`, `A:42`) — unique per REIT |
| **Entity** | A REIT entity with metadata (code, name, sector, manager, etc.) |
| **Metric** | A quantifiable measurement (DPU, gearing, occupancy, etc.) |
| **Observation** | A qualitative insight derived from metrics (risk assessment, executive summary, etc.) |
| **Risk Factor** | A categorized risk with severity, description, and mitigation factors |
| **Time Series** | Historical data points for a metric over time |
| **Orphan Reference** | A citation not directly linked to any metric, observation, or risk factor |
| **Direct Linkage** | A citation explicitly linked via `linkCitation()` in a builder |
| **Normalized Data** | The canonical JSON output format consumed by the frontend |

## Citation Prefixes

Each REIT has a unique single-letter or multi-letter prefix for its display IDs:

| REIT | Code | Prefix | Example |
|------|------|--------|---------|
| Atrium | 5130.KL | `T` | `T:1`, `T:42` |
| Axis | 5106.KL | `A` | `A:1`, `A:99` |
| Sunway | 5176.KL | `S` | `S:1` |
| Pavilion | 5212.KL | `P` | `P:1` |
| IGB | 5227.KL | `I` | `I:1` |
| UOA | 5110.KL | `U` | `U:1` |
| CMMT | 5180.KL | `C` | `C:1` |
| Hektar | 5121.KL | `H` | `H:1` |
| Al-Salam | 5269.KL | `L` | `L:1` |
| KLCC | 5235SS | `K` | `K:1` |
| KIP | 5280.KL | `KIP` | `KIP:1` |
| Sentral | 5123.KL | `SE` | `SE:1` |
| AmFIRST | 5120.KL | `AF` | `AF:1` |
| Paradigm | 5338.KL | `D` | `D:1` |
| Tower | 5111.KL | `To` | `To:1` |
| YTL | 5109.KL | `Y` | `Y:1` |

## Metric Types

The system tracks these metric categories:

### Portfolio
- `portfolio_size` — Number of properties
- `total_assets` — Total asset value
- `investment_properties` — Investment property value
- `property_count` — Property count
- `net_lettable_area` — Total leasable area
- `geographic_concentration` — Geographic concentration percentage

### Financial
- `gross_revenue` — Total revenue
- `net_property_income` — NPI
- `realised_income` — Realized income
- `nav_per_unit` — NAV per unit
- `market_cap` — Market capitalization
- `share_price` — Current share price

### Per-Share
- `dpu` — Distribution per unit
- `dpu_growth_yoy` — Year-over-year DPU growth
- `dividend_yield_market` — Yield based on market price
- `dividend_yield_nav` — Yield based on NAV
- `payout_ratio` — Distribution payout ratio

### Leverage
- `gearing_ratio` — Debt to assets ratio
- `interest_coverage` — Interest coverage ratio
- `total_borrowings` — Total debt
- `fixed_rate_debt_pct` — Fixed-rate debt percentage
- `floating_rate_debt_pct` — Floating-rate debt percentage
- `wacd` — Weighted average cost of debt

### Operational
- `occupancy_rate` — Portfolio occupancy
- `wale_years` — Weighted average lease expiry
- `tenant_count` — Number of tenants
- `top_tenant_concentration` — Largest tenant revenue share
- `rental_reversion` — Rent change on renewals
- `lease_renewal_rate` — Successful renewal percentage
- `npi_margin` — NPI as percentage of revenue

### Market
- `price_to_book` — Price to NAV ratio
- `premium_discount_to_nav` — Premium or discount to NAV

## Risk Categories

- `concentration` — Portfolio or tenant concentration risk
- `gearing` — Debt leverage risk
- `interest_rate` — Interest rate sensitivity
- `tenant_rollover` — Lease expiry/renewal risk
- `liquidity` — Trading liquidity risk
- `transparency` — Disclosure quality risk
- `geographic` — Geographic concentration risk
- `counterparty` — Tenant credit risk
- `governance` — Management structure risk
- `market` — Market price risk
- `operational` — Property operations risk
- `retail_cyclicality` — Retail sector cyclical risk
- `hospitality_volatility` — Hotel sector volatility
