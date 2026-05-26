# How to contribute

Guidelines for working in the REIT Comparison Dashboard codebase.

## Work Pickup

1. Check `AGENTS.md` in the repository root — it contains the canonical editing rules and playbooks
2. Review the [patterns and conventions](./patterns-and-conventions.md) page for coding standards
3. For REIT additions, follow the [Add a New REIT](#adding-a-new-reit) playbook

## Pull Request Process

1. Create a feature branch from `main`
2. Make focused changes that match existing patterns
3. Run the appropriate validation commands (see below)
4. Ensure tests pass
5. Submit PR with clear description of changes

## Validation Commands

Choose based on what you changed:

| Change Type | Commands |
|-------------|----------|
| UI-only | `make lint` + `cd frontend && npm test` |
| Contract/backend | `npm test` + relevant validation targets |
| Cross-cutting | `make ci` (typecheck-all + lint + test) |

### Citation Validation

If touching citation-related logic:

```bash
make audit-citations     # Check direct vs orphan linkage
make check-citations     # Root citation validation
make verify-citations    # Frontend citation verification
```

Treat schema/validation failures as blockers, not warnings.

## Definition of Done

- [ ] TypeScript strictness preserved (no weakened types)
- [ ] Tests pass (`make test`)
- [ ] Lint passes (`make lint`)
- [ ] Citations valid (if applicable)
- [ ] No invented financial data
- [ ] Matches existing patterns

## Adding a New REIT

Follow the [Add a New REIT](../systems/adapters.md#adding-a-new-reit) playbook in the adapters documentation. High-level steps:

1. Lock identifiers (code, name, sector, citation prefix)
2. Create root artifacts (analysis memo, references JSON)
3. Update citation schema (`src/types/reference.ts`)
4. Implement adapter (`src/adapters/{slug}-adapter.ts`)
5. Wire into `scripts/generate-samples.ts`
6. Wire frontend registry + loaders
7. Map analysis markdown
8. Run full validation (`make ci`)
9. Update README data coverage table

## Safety Rules

- Never commit secrets (`.env*`, keys, credentials)
- Do not use destructive git operations
- Do not modify generated artifacts unless specifically required
- Do not invent financial/citation data

## Getting Help

- Review `AGENTS.md` for detailed playbooks
- Check [architecture](../overview/architecture.md) for system overview
- Examine existing adapters for implementation patterns
