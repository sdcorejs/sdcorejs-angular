# sd-operator — Reusable operator picker

**Date:** 2026-05-27
**Status:** Approved (design)
**Branch:** query-bar

## Problem

Filter operator selection is currently implemented two different ways:

- **sd-table** `column-filter` — a hand-rolled `<sd-button>` trigger + `<mat-menu>` that
  renders each operator's SVG icon (logic: `inlineIcon` / `operatorIcon` / `#svg` + scss).
- **query-bar** — an `<sd-select>` with an `sdItemDef` template that re-implements the same
  icon rendering, plus an `icon` field injected into the operator items.

This duplicates the icon-wrapping logic, the i18n label lookup, and the SVG sanitization in
two places. `sd-select` is also heavier than needed for a small, fixed operator list and does
not collapse to a single icon.

## Goal

A single reusable component `sd-operator` that:

- Collapses to **just the operator icon** (with a tooltip) when not open — more compact than a
  select.
- Opens a `matMenu` listing the allowed operators (icon + Vietnamese label + raw operator code),
  matching the approved mockup.
- Exposes a two-way `[(model)]` binding of type `Operator | undefined`, mirroring the inline
  operator model already used in `column-filter`.
- Centralizes the icon + i18n + sanitization logic so `column-filter` and `query-bar` stop
  duplicating it.

## Component

**Location / entry point:** `projects/sdcorejs-angular/components/operator/`
→ `@sdcorejs/angular/components/operator`

Resolves automatically via the wildcard tsconfig path
(`@sdcorejs/angular/*` → `projects/sdcorejs-angular/*`) + a per-folder `ng-package.json`; no tsconfig
or path-array edits required (same pattern as `components/button`).

Files:

- `index.ts` — `export * from './src/operator.component';`
- `ng-package.json` — `{ "lib": { "entryFile": "index.ts" } }`
- `src/operator.component.ts` / `.html` / `.scss`
- `src/operator.component.spec.ts`
- `sd-operator.md` — usage doc

### Public API

```ts
@Component({ selector: 'sd-operator', /* standalone, OnPush */ })
export class SdOperator {
  /** Two-way bound current operator. */
  model = model<Operator | undefined>();

  /** Allowed operators, in display order. Each is mapped to its OPERATORS entry. */
  operators = input<Operator[]>([]);

  /** Disable the trigger (menu cannot open). */
  disabled = input(false, { transform: booleanAttribute });

  /** Optional data-autoId for e2e selectors. */
  autoId = input<string>();
}
```

### Behavior

- **Collapsed:** a flat icon button showing the SVG icon of the current `model` operator. When
  `model` is `undefined`, show a neutral funnel fallback icon. `matTooltip` = the i18n label of
  the current operator.
- **Open (click):** `matMenu` lists every operator in `operators()`, in order. Each row:
  `[icon] [Vietnamese label] [operator code, muted, right-aligned]`. The row matching the
  current `model` is highlighted.
- **Select:** sets `model` (emits `modelChange`) and closes the menu.
- **Disabled:** trigger is disabled; menu does not open.

### Internals

- `#items = computed(() => operators().map(value => { OPERATORS entry → { value, icon: SafeHtml, display: i18n.t(entry.display) } }))`.
  Operators not present in `OPERATORS` are skipped (defensive).
- `DomSanitizer.bypassSecurityTrustHtml` wraps each operator's inner SVG markup in a
  `<svg viewBox="0 0 24 24" …>` shell (source is the internal `OPERATORS` constant, not user
  input). Rendered via `[innerHTML]`.
- `I18nService.t(entry.display)` resolves labels.
- Funnel fallback icon is a component static constant.

## Consumers

### sd-table `column-filter`

- Replace the hand-rolled `<sd-button>` + `<mat-menu>` block with:
  ```html
  <sd-operator [(model)]="operator" [operators]="operatorValues()" />
  ```
- `operators` computed stays (allowed list) but a small `operatorValues = computed(() => operators().map(o => o.value))` feeds the new component.
- Remove from `column-filter`: `inlineIcon`, `operatorIcon`, `#svg`, `FALLBACK_ICON`,
  `onChangeOperator`, the `DomSanitizer`/`SafeHtml` imports, and the `.c-op-*` scss.
- `column-filter` keeps its 2-way `operator` model and just forwards it.

### query-bar

- Replace **both** operator `<sd-select>` instances with `<sd-operator>`:
  - **Popover edit mode:** `<sd-operator [model]="_editOp" (modelChange)="onEditingOperatorChange($event)" [operators]="editingAllowedOperators()">`.
  - **Inline mode:** `<sd-operator [model]="_op" (modelChange)="setFilterOperator(i, $event)" [operators]="allowedOperatorsFor(_field)">`.
- Operator items now only need `Operator[]` (the allowed list), which already exists via
  `sdQueryAllowedOperators` / `editingAllowedOperators`. Remove:
  - the `icon` field added to `editingOperatorItems` and `#operatorItemsByKey`,
  - `operatorIcon` + `#svg` + the `DomSanitizer`/`SafeHtml` imports,
  - the `sdItemDef` icon templates in the HTML,
  - `SdItemDefDefDirective` import.
  - Keep `SdSelect` — still used by the value editors for `values` / `lazy-values` fields.
  - `editingOperatorItems` / `#operatorItemsByKey` / `operatorItemsFor` can be dropped if nothing
    else consumes them after the switch; verify with a usage check before removing.
- Keep `SD_QUERY_OPERATOR_LABEL` fix (NOT_START_WITH / NOT_END_WITH) — unrelated to this refactor
  but required for the wider `Operator` type.

## Testing (TDD, Red → Green → Refactor)

### `operator.component.spec.ts` (new)

- Renders the icon of the current `model`; tooltip = i18n label.
- `model` undefined → funnel fallback icon rendered.
- Menu lists exactly `operators()` in order, each with icon + label + operator code.
- The row matching `model` is marked active.
- Selecting a menu row emits `modelChange` and updates `model`.
- `disabled` → trigger disabled, menu does not open.

### `column-filter.component.spec.ts` (update)

- Remove the `inlineIcon` / `operatorIcon` tests (logic moved to `sd-operator`).
- Assert `<sd-operator>` is rendered when operators exist, receives the allowed operator values,
  and is two-way bound to `operator`.

### `query-bar.component.spec.ts` (update)

- Replace the operator-icon tests with: operator selection uses `<sd-operator>` (not
  `<sd-select>`), and the allowed operators are passed through.

## Out of scope

- No change to operator vocabulary, filter data shapes, or `Filter` model.
- No change to value editors or non-operator selects in query-bar.
- The local `@sdcorejs/utils` tarball bridge and the npm publish of 1.1.1 are tracked separately;
  this work assumes `OPERATORS[].icon` is available.

## Verification

- `npm run build` (lib typecheck) passes.
- Targeted karma run of `operator`, `column-filter`, `query-bar` specs is green.
