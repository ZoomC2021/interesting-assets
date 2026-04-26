## Execution Contract: Milestone 3 - Paradigm REIT Financial Data Population

### Milestone Context
- **Current Milestone**: M3 - Financial Performance, Debt & Dividend Population
- **Depends On**: M1 (Research & Citations), M2 (Company & Portfolio Sections)
- **Leads To**: M4 (Risk & Investment Thesis), M5 (Final Review & Completion)

### Scope Summary
- **Will Do**:
  - Populate Section 3 (Asset Quality Analysis) with tenant, WALE, expiry, and AEI data
  - Expand Section 4 (Debt Sustainability Analysis) to full Pavilion-depth with maturity profile, rate analysis, and verdict
  - Expand Section 5 (Dividend Sustainability Analysis) to full depth with DPU trends, coverage analysis, yield analysis, and verdict
  - Expand Section 6 (Financial Performance Summary) with complete income statement and quarterly breakdown
  - Add citations D:101-D:150 for all new financial data points
  - Update metadata to reflect 150 total citations
  - Clearly label all limited history data (post-IPO only)
  - Ensure internal consistency: revenue → NPI → realised income → DPU flows correctly

- **Won't Do**:
  - Fabricate pre-IPO historical data (e.g., 2024, 2021-2023 DPU trends)
  - Add Sections 7+ content (Industry Context, Risk Assessment, Investment Thesis - these are M4)
  - Add forward-looking projections beyond disclosed guidance
  - Modify existing D:1-D:100 citations or their associated content
  - Add subjective forward-looking investment recommendations

### Files to Modify
| File | Change Type | Risk |
|------|-------------|------|
| /home/zoomcharts/Repos/interesting-assets/Paradigm_REIT_Malaysia_Analysis.md | Edit | High |

### Risk Flags
| Risk | Level | Mitigation |
|------|-------|------------|
| Financial data inconsistency | High | Verify Q2 vs Q3 filing figures before integration; STOP if discrepancies exceed 10% |
| Pre-IPO data fabrication | Medium | Explicitly label all data as "post-IPO only" with June 10, 2025 reference |
| Citation numbering errors | Medium | Use automated numbering; verify D:101-D:150 range integrity |
| Internal math inconsistency | High | Verify: Revenue → NPI (67-68% margin) → Realised Income (~90% payout) → DPU calculations |
| Limited history misrepresentation | Medium | Add explicit notes: "Data available from June 10, 2025 IPO only" |
| Pavilion depth mismatch | Medium | Match sub-section count (3.1-3.5, 4.1-4.6, 5.1-5.5, 6.1-6.3) |

### Success Criteria
1. **Section 3 Expansion**: Asset Quality Analysis contains subsections 3.1-3.5 (Occupancy by Property, Tenant Quality, WALE Analysis, Lease Expiry Profile, Asset Enhancement Initiatives) with verified data and [D:101-D:115] citations

2. **Section 4 Expansion**: Debt Sustainability Analysis contains subsections 4.1-4.6 (Capital Structure, Gearing Analysis, Interest Coverage, Debt Maturity Profile, Financing & Rate Profile, Verdict) matching Pavilion depth with [D:116-D:130] citations

3. **Section 5 Expansion**: Dividend Sustainability Analysis contains subsections 5.1-5.5 (2025 Distributions, Historical DPU, Coverage Analysis, Yield Analysis, Verdict) with explicit "post-IPO only" labeling and [D:131-D:145] citations

4. **Section 6 Expansion**: Financial Performance Summary contains subsections 6.1-6.3 (Full Year Income Statement, Quarterly Breakdown, Key Drivers) with consistent NPI margin (67-68%) and [D:146-D:150] citations

5. **Citation Integrity**: Exactly 50 new citations added (D:101-D:150), metadata updated to "Total Citations: D:1 - D:150"

6. **Internal Consistency Verified**:
   - Gross Revenue ~RM 120-130M (6 months) → annualized ~RM 240-260M [D:101]
   - NPI ~RM 80-85M (6 months) at 67-68% margin [D:102, D:103]
   - Realised Income ~RM 75-80M → ~90% payout ratio [D:104, D:114]
   - DPU ~4.5-5.0 sen interim → annualized ~9.0-10.0 sen [D:112, D:113]

7. **Limited History Labeling**: All financial data explicitly marked as "post-IPO only" with June 10, 2025 reference date

8. **Document Line Count**: ~312 → ~500+ lines (matching Pavilion structure depth)

### Estimation
Large (> 4hrs)

### Notes
**Data Source Hierarchy (for M3 implementation):**
1. Primary: Q2 2025 and Q3 2025 quarterly filings (verified post-IPO data)
2. Secondary: IPO Prospectus (for debt structure and distribution policy)
3. Tertiary: Bursa Malaysia announcements (for interim distribution confirmation)

**Pavilion Depth Benchmarks to Match:**
- Asset Quality: 5 subsections with property-level occupancy tables, tenant lists, WALE metrics, expiry profile, AEI table
- Debt Sustainability: 6 subsections with capital structure table, gearing analysis table, interest coverage, maturity schedule, rate sensitivity analysis, verdict table
- Dividend Sustainability: 5 subsections with distribution table, DPU trend table (limited to 2025 for Paradigm), coverage analysis, yield calculation with premium/discount to NAV, verdict table
- Financial Performance: 3 subsections with full income statement, quarterly breakdown, and key drivers

**Critical STOP Condition:**
If Q2 2025 and Q3 2025 financial figures show inconsistencies >10% (e.g., Q3 standalone vs cumulative YTD), halt implementation and flag for data verification before proceeding.

**Citation Allocation:**
- D:101-D:115: Asset Quality (15 citations)
- D:116-D:130: Debt Sustainability (15 citations)
- D:131-D:145: Dividend Sustainability (15 citations)
- D:146-D:150: Financial Performance (5 citations)
- Reserve capacity: Can extend to D:150+ if needed for data tables

**Post-IPO Date Reference:**
All historical data must reference June 10, 2025 as the IPO/completion date. No pre-IPO DPU, revenue, or NPI data should be fabricated or implied to exist.
