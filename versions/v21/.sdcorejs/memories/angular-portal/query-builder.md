---
name: query-builder
description: <sd-query-builder> rebuilt (signal-first) — emits nested Filter tree; form-generic still on the OLD expression model (swap pending).
track: angular-portal
updatedAt: 2026-06-05
---

# `<sd-query-builder>` — durable facts

- **Two Filter-emitting components now coexist.** `<sd-query-bar>` emits a **flat** `Filter[]` (`SdQuery{filters,logic,search}`); `<sd-query-builder>` emits a **nested** `Filter` tree (root `FilterAndOr`) via `[(value)]`, plus a flat `[(filters)]` mirror (= root.data) for parity. Pick query-bar for chip-row filtering, query-builder for grouped boolean logic.
- **query-builder is self-contained.** It defines its own field config (`SdQueryBuilderField` + `QB_OPERATORS_BY_TYPE`), NOT query-bar's `SdQueryField`. It only borrows `Operator`/`Filter` from `@sdcorejs/utils` and the `<sd-operator>` picker. Don't merge the two field models.
- **Serializer is the bridge + is pure/testable.** `treeToFilter` / `filterToTree` / `filterToTokens` in `query-builder.serializer.ts` (exported). View-mode = `filterToTokens` → `QbToken[]` (SQL-ish, field=label, highlight). Reuse `filterToTokens` if you need a read-only raw-query render anywhere.
- **Two-way sync uses a `#lastEmitted` JSON compare-guard inside an `effect`** to avoid the echo loop (Angular 19 allows signal writes in effects). Mirror this pattern for other two-way `[(value)]` signal components; a naive rebuild-on-change effect loops and wipes UI state.
- **`form-generic` was NOT migrated.** `expression-builder` / `BuildQueries` still run the OLD model (`SdFormGenericExpression`, `${field}` templates, `dayInfo` relative dates, JS `===` eval for runtime). Swapping it to `<sd-query-builder>` is a **pending follow-up** that must map dayInfo + JS-eval + `${field}` — do not assume form-generic already uses the new component.

Related: [[inline-text-primitive]] (optional future: wire query-builder value editor to `<sd-inline-text>`).
