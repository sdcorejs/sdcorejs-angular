# WHY — `<sd-query-builder>` design decisions

> Companion brief for the rebuilt query-builder. Captures the non-obvious design choices that span `query-builder.model.ts`, `query-builder.serializer.ts`, and `query-builder.component.ts`. Inline `// why:` comments cover line-level rationale; this doc covers the cross-file decisions.

## Context

The prototype `<sd-query-builder>` used ad-hoc `QueryRule` / `QueryGroup` types, hardcoded `Equal`/`Not Equal`, plain text inputs, and never emitted the project's canonical `Filter`. The rebuild had to: derive operators from each field's type, output the same `Filter` shape `<sd-query-bar>` emits, support nested AND/OR groups, and add a read-only highlighted "view" mode — without depending on the query-bar package.

## Decision

### 1. Two data layers, not one
The component keeps an **internal tree** (`QbGroup` / `QbRule` with stable `id` + UI `open` flag) separate from the **public `Filter`**. The tree carries UI state that must never leak to consumers; the serializer (`treeToFilter` / `filterToTree`) is the only bridge. This keeps `@for` tracking + dropdown state out of the emitted payload and makes the mapping independently unit-testable (25 pure-function specs, no TestBed).

### 2. `Filter` is the source of truth; `filters` mirrors it
`value` (a nested `FilterAndOr`) is canonical. `filters` (`Filter[]`) is a convenience mirror of the root group's direct children, for parity with `<sd-query-bar>`'s flat `[(filters)]`. The component derives both from the tree on every mutation; it never treats them as independent inputs.

### 3. Echo-guard for two-way sync (the subtle part)
`[(value)]` / `[(filters)]` are two-way **and** the component emits on every edit, so a naive `effect` that rebuilds the tree whenever `value` changes would loop (our own emit → effect → rebuild → emit …) and would also wipe UI state (ids, open menus) on every keystroke. The fix: an `effect` that compares the incoming filter against `#lastEmitted` (set on each emit) and **returns early when they match** — so our own echo is ignored and only genuinely external writes rebuild the tree. Inbound rebuilds then re-commit once to normalize, after which the compare-guard settles. (Angular 19 allows signal writes inside effects, so no `allowSignalWrites` flag is needed.)

### 4. View mode emits tokens, not a string
`filterToTokens` returns a `QbToken[]` (each tagged `field|op|value|logic|paren|plain`) instead of a finished string, so the template can wrap each piece in a highlight `<span>`. Operators map to SQL syntax (`like '%v%'`, `between a and b`, `is null`); the field token shows the field **label** (per the chosen UX), `and`/`or` are lowercase, nested multi-child groups get parentheses.

### 5. Self-contained, but borrows the shared vocabulary
The field config (`SdQueryBuilderField`, `QB_OPERATORS_BY_TYPE`) is defined locally — query-builder does **not** import query-bar internals — but it reuses `Operator` / `Filter` from `@sdcorejs/utils` and the `<sd-operator>` picker, so the two components stay consistent without coupling.

## Consequences

- Adding a field type means updating `QB_OPERATORS_BY_TYPE` + `QB_DEFAULT_OPERATOR_BY_TYPE` + a value-editor `@case` in the template — three places, all local.
- Incomplete rules (missing field/operator/value) are silently dropped from `value`; the tree keeps them so the user can finish editing. This asymmetry is intentional (always-valid output, forgiving editor).
- The compare-guard uses `JSON.stringify` equality. Filters are built with stable key order, so this is reliable; an externally-supplied object with different key order triggers one extra normalize pass, then settles.
- `form-generic` was **not** migrated this round — it runs a different model (`SdFormGenericExpression`, `${field}` templates, `dayInfo` relative dates, JS `===` eval). Swapping it is a deferred follow-up.

## Files involved

- `projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts` — field config, internal tree types, operator tables, helpers, node factories.
- `projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts` — `treeToFilter` / `filterToTree` / `filterToTokens` (pure, TDD-covered).
- `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts` — signal-first OnPush component: inputs/models, echo-guarded sync effect, tree mutations.
- `.../query-builder.component.html` + `.scss` — recursive group/rule template, view-mode token render, primary-color theming.
