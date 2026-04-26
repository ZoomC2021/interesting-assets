## Execution Contract: Al-Salam REIT Implementation - Milestone 1

### Milestone Context
- **Current Milestone**: Milestone 1 - Lock Contract Decisions
- **Depends On**: None (foundation milestone)
- **Mission**: Create memo MD file, references/citations, and adapter for Al-Salam REIT per Atrium pattern

---

### Scope Summary

**Will Do:**
1. Define concrete decisions for canonical ticker, aliases, file naming conventions
2. Define citation prefix strategy that avoids conflicts with existing REITs
3. Determine whether to replace existing `frontend/public/data/alsalam.json` (currently placeholder data with conflicting `A:` citations)
4. Identify all files requiring modification for full Al-Salam integration
5. Document the schema evolution requirements (VALID regex extension)

**Won't Do:**
- No file modifications in Milestone 1 (decision-locking only)
- No actual content writing for memo or references
- No adapter implementation
- No citation migration from existing placeholder

---

### Key Decisions Required

#### 1. Citation Prefix Decision (BLOCKING)

**Conflict Identified:**
- Existing VALID regex: `/^[TAPSUICH]:\d{1,3}[a-z]?$/` (8 prefixes)
- Current allocations:
  - T: Atrium (5130.KL)
  - A: Axis (5106.KL) 
  - S: Sunway (5176.KL)
  - P: Pavilion (5212.KL)
  - I: IGB (5227.KL)
  - U: UOA (5110.KL)
  - C: CMMT (5180.KL)
  - H: Hektar (5121.KL)
- **KLCC** (5235SS) uses `K:` prefix - **NOT in VALID regex** (schema violation)
- **Al-Salam** (5114.KL) placeholder uses `A:` prefix - **CONFLICTS with Axis**

**Options:**
1. **Use 'L' prefix** (aL-salam) - Add 'L' to VALID regex
2. **Use 'M' prefix** (Al-salaM) - Add 'M' to VALID regex  
3. **Use 'B' prefix** (al-salam in Bursa) - Add 'B' to VALID regex
4. **Extend KLCC simultaneously** - Add both 'K' and chosen Al-Salam prefix

**Recommended:** Option 1 ('L' prefix) - maintains single-letter convention, pronounceable association

#### 2. File Naming Decisions

| Component | Pattern (per Atrium) | Al-Salam Decision |
|-----------|---------------------|-------------------|
| Analysis memo | `{REIT}_REIT_Malaysia_Analysis.md` | `Al-Salam_REIT_Malaysia_Analysis.md` |
| References file | `{lowercase}-reit-references.json` | `alsalam-reit-references.json` |
| Adapter | `{lowercase}-adapter.ts` | `alsalam-adapter.ts` |
| Frontend data | `frontend/public/data/{lowercase}.json` | `frontend/public/data/alsalam.json` **(REPLACE)** |

**Decision:** REPLACE existing placeholder `alsalam.json` - it contains fabricated data and citation conflicts

#### 3. Canonical Ticker & Aliases

Per `available-entities.ts` (already defined):
- **Canonical:** `5114.KL`
- **Aliases:** `['5142.KL', 'alsalam', 'al-salam']`
- **Route Aliases:** `['5142.KL']`

**Decision:** KEEP existing definition - no changes needed

#### 4. Schema Evolution Requirements

**Files requiring regex extension:**
| File | Current | Required Change |
|------|---------|-----------------|
| `src/types/reference.ts:44` | `VALID: /^[TAPSUICH]:/` | Add 'L' (and 'K' for KLCC consistency) |
| `src/types/reference.ts:170-210` | Mapping functions | Add Al-Salam entity code mapping |

---

### Files to Modify (Future Milestones)

| File | Change Type | Risk | Depends On |
|------|-------------|------|------------|
| `src/types/reference.ts` | Edit | **High** - Core schema | Citation prefix decision |
| `Al-Salam_REIT_Malaysia_Analysis.md` | Create | Medium | None |
| `alsalam-reit-references.json` | Create | Medium | None |
| `src/adapters/alsalam-adapter.ts` | Create | Medium | Schema update |
| `frontend/public/data/alsalam.json` | **Replace** | Low | Adapter completion |
| `frontend/lib/comparison-model.ts` | Edit | Low | Data file ready |
| `test/samples/alsalam-normalized.json` | Create | Low | For conformance tests |

---

### Risk Flags

| Risk | Level | Mitigation |
|------|-------|------------|
| Citation prefix conflict with Axis | **High** | Must extend VALID regex; cannot share 'A:' prefix |
| KLCC schema violation (K: prefix) | **High** | Must add 'K' to VALID regex for consistency |
| Existing alsalam.json replacement | Medium | File contains placeholder data - safe to replace |
| Schema change blast radius | Medium | Only affects DisplayIdPattern; data files use internal UUIDs |
| Breaking change to citation validation | Medium | Add new prefixes as backward-compatible extension |

---

### Success Criteria

1. ✅ Citation prefix decision documented and approved
2. ✅ Schema evolution requirements identified (VALID regex update)
3. ✅ File naming conventions locked per Atrium pattern
4. ✅ Decision made: existing `alsalam.json` WILL BE REPLACED
5. ✅ All required file touchpoints identified
6. ✅ No conflicting conventions remain unresolved

---

### Estimation

**Small (< 1hr)** - This is a decision-only milestone. No implementation code.

---

### Notes

**Critical Finding:** The existing `alsalam.json` uses `A:1` citations which conflict with Axis REIT's `A:` prefix. This file was likely auto-generated placeholder data and must be completely replaced, not migrated.

**Related Technical Debt:** KLCC REIT uses `K:` prefix but the VALID regex doesn't include 'K'. This should be fixed alongside Al-Salam implementation for schema consistency.

**Blocked Until:** Explicit decision on citation prefix (recommendation: 'L' for aL-salam)
