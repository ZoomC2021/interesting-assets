# Typography Migration Guide

## Mission Milestone 2: Global Typography Alignment (Compact Pass)

This document describes the canonical, **compact** typography scale used by the
dashboard. Version 2 of this migration tightened the scale across the board so
content is visually denser — suitable for a data-rich financial UI.

---

## Canonical Typography Scale (Compact)

| Token            | Size     | rem          | Line-height | Usage                                       |
|------------------|----------|--------------|-------------|---------------------------------------------|
| `text-2xs`       | 9px      | 0.5625rem    | 12px        | Tiny indicator badges, dot counts           |
| `text-micro`     | 10px     | 0.625rem     | 12px        | Captions, timestamps, breadcrumbs, legal    |
| `text-label`     | 10.5px   | 0.65625rem   | 14px        | Form labels, metadata (uppercase + tracking)|
| `text-body-sm`   | 11px     | 0.6875rem    | 14px        | Secondary text, card content                |
| `text-data`      | 12px     | 0.75rem      | 16px        | Table cells, dense data grids               |
| `text-metric-sm` | 13px     | 0.8125rem    | 16px        | Small metrics, compact KPIs (tabular, 600)  |
| `text-body`      | 13px     | 0.8125rem    | 16px        | Body text, paragraphs, default body class   |
| `text-metric`    | 15px     | 0.9375rem    | 20px        | Primary metrics, page titles (tabular, 600) |

**Accessibility floor:** `text-2xs` (9px) should only be used for decorative
indicators where the information is duplicated elsewhere. `text-micro` (10px)
is the recommended minimum for legible informational text.

---

## Tailwind Default Tokens (Also Compacted)

To compact **all** content — including components that still use generic
Tailwind size classes — the default Tailwind `text-*` scale has been
redefined in `tailwind.config.ts`:

| Token       | New size | Tailwind default | Delta | Notes                                 |
|-------------|----------|------------------|-------|---------------------------------------|
| `text-xs`   | 12px     | 12px             |  0    | Kept for form-input legibility        |
| `text-sm`   | 13px     | 14px             | −1px | **Collides with `text-base`** (see below) |
| `text-base` | 13px     | 16px             | −3px | Same size as `text-sm` / `text-body`   |
| `text-lg`   | 15px     | 18px             | −3px |                                       |
| `text-xl`   | 17px     | 20px             | −3px |                                       |
| `text-2xl`  | 20px     | 24px             | −4px |                                       |
| `text-3xl`  | 24px     | 30px             | −6px |                                       |

This means legacy calls like `className="text-xl font-semibold"` automatically
render at 17px instead of 20px — no call-site edits required.

> ⚠️ **Intentional size collision at 13px.** `text-sm`, `text-base`, `text-body`,
> and `text-metric-sm` all resolve to 13px. This is deliberate for the compact
> dashboard aesthetic — 13px is the chosen content baseline and multiple legacy
> aliases collapse onto it. **Don't rely on `text-sm` vs `text-base` to produce
> visual hierarchy.** For real hierarchy, use the semantic tokens
> (`text-data` 12 → `text-body` 13 → `text-metric` 15).

---

## Migration Mapping (for new edits)

### Preferred: use semantic tokens

| Legacy Value                                             | Replace With      |
|----------------------------------------------------------|-------------------|
| `text-[9px]` / `text-[10px]`                             | `text-micro`      |
| `text-[11px]`                                            | `text-label` (if it's an uppercase label) or `text-body-sm` |
| `text-[12px]`                                            | `text-body-sm`    |
| `text-[13px]`                                            | `text-data`       |
| `text-[14px]`                                            | `text-data` or `text-body-sm` (prefer 12px in dense UI) |
| `text-[15px]` / `tabular-nums text-[15px] font-semibold` | `text-metric-sm`  |
| `text-[16px]`                                            | `text-body`       |
| `text-[18px]` / `tabular-nums text-[18px] font-semibold` | `text-metric`     |
| `text-[11px] font-medium uppercase tracking-[0.08em]`    | `text-label`      |
| `text-[13px] leading-5`                                  | `text-data`       |

---

## Single Source of Truth

- **All** typography tokens (size, line-height, weight, letter-spacing) are
  defined in `tailwind.config.ts` under `theme.extend.fontSize`, using
  Tailwind's tuple form `['size', { lineHeight, letterSpacing?, fontWeight? }]`.
- Behaviors that Tailwind's `fontSize` config cannot express
  (`text-transform: uppercase` on `.text-label`; `font-variant-numeric` on
  `.text-metric` / `.text-metric-sm`) are added by the typography plugin in
  the same config file.
- Nothing typography-related lives in `globals.css` except the numeric-style
  `.tabular` helper.

**Colors are never baked into typography tokens.** Apply color separately with
`text-ink`, `text-muted`, `text-accent`, etc. (Previous broken
`hsl(... / <alpha-value>)` declarations inside raw CSS have been removed.)

---

## Backward Compatibility

- ✅ `text-2xs`, `text-micro`, …, `text-metric` resolve to the new compact sizes.
- ✅ Existing `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-xl` /
  `text-2xl` / `text-3xl` usage still works, and automatically renders smaller.
- ⚠ Arbitrary `text-[Npx]` values bypass the scale entirely — avoid them in
  new code; replace with a semantic token.

---

## Component Audit Checklist

When updating components:
- [ ] Replace arbitrary pixel values with semantic tokens
- [ ] Prefer `text-data` / `text-body-sm` / `text-body` over `text-base`
- [ ] Prefer `text-metric` / `text-metric-sm` over `text-lg`/`text-xl` for numbers
- [ ] Don't set `text-transform`, `letter-spacing`, or `font-variant-numeric`
      manually on `text-label` / `text-metric*` — the plugin handles it
- [ ] Apply color with `text-ink` / `text-muted` / `text-accent`, not inline
- [ ] Verify at 200% zoom for accessibility compliance

---

## Related Files

- `frontend/tailwind.config.ts` — canonical scale + typography plugin (single source of truth)
- `frontend/app/globals.css` — base body default + `.tabular` utility only
