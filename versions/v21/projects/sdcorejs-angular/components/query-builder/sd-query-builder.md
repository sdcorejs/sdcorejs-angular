# `<sd-query-builder>`

**Type**: Component
**Selector**: `sd-query-builder`
**Import path**: `@sdcorejs/angular/components/query-builder` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdQueryBuilder`
**Standalone**: yes
**Change detection**: `OnPush` (signal-first)

## One-line purpose
Visual filter / rule builder — compose nested AND/OR groups of `field operator value` conditions through a tree UI. Operators are derived from each field's `type`; the output is the canonical `Filter` from `@sdcorejs/utils` (a nested `FilterAndOr` tree), so it drops straight into the same query endpoints `<sd-query-bar>` feeds. A `mode="view"` renders the rules as a read-only, highlighted SQL-ish raw string.

## When to use
- "Tìm kiếm nâng cao" / advanced-search panels where the user builds grouped boolean logic
- Saved-filter / segment / eligibility-rule editors persisted to a backend as `Filter`
- Anywhere a flat `<sd-query-bar>` chip row isn't enough and you need nested `(... and ...) or ...`
- A read-only audit/display of an existing `Filter` (via `mode="view"`)

## When NOT to use
- Simple keyword search → `<sd-input>` with a search icon
- A flat, single-level chip filter bar → `<sd-query-bar>`
- Single-field dropdown filter → `<sd-select>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `fields` | `SdQueryBuilderField[]` | `[]` | Filterable fields. Each `type` drives the allowed operators + the value-editor control. **Required** to pick fields / show labels. |
| `mode` | `'edit' \| 'view'` | `'edit'` | `edit` = interactive tree · `view` = read-only highlighted raw-query string (looks like a disabled input). |
| `disabled` | `boolean` | `false` | Disables every editing control. Bare attribute = `true`. |
| `autoId` | `string` | `undefined` | Prefix for `data-autoid` on inner controls (E2E selectors). |

## Two-way models (output)
| Name | Type | Notes |
| --- | --- | --- |
| `value` | `Filter \| null` | **Canonical** output — the root `FilterAndOr` tree (`null` when empty). `[(value)]`. |
| `filters` | `Filter[]` | Convenience mirror = the root group's direct children. `[(filters)]`. Writing it (with no `value`) seeds an `{ operator: rootLogic, data }` root. |
| `rootLogic` | `'AND' \| 'OR'` | The root group's connector. `[(rootLogic)]`. |

`value` is the source of truth; `filters` is kept in sync. Seeding either rebuilds the internal tree once, then normalizes — no echo loop.

### Type shapes
```ts
type SdQueryBuilderFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'values';

interface SdQueryBuilderField {
  key: string;                 // dot-notation path → Filter.field
  label: string;               // field picker + view-mode field token
  type: SdQueryBuilderFieldType;
  operators?: Operator[];      // override the per-type allowed set
  defaultOperator?: Operator;  // override the starting operator
  values?: { value: any; display: string }[];  // for type 'values'
  trueLabel?: string; falseLabel?: string;       // for type 'boolean'
  min?: number | string; max?: number | string;
}
```
The emitted `value` is a `Filter` (`@sdcorejs/utils/models`): leaf rules become `FilterHasData` / `FilterBetween` / `FilterNoData`; groups become `FilterAndOr { operator, data }`. Incomplete rules (missing field / operator / value) are dropped from the output.

### Relative-date value types

For `date` and `datetime` fields with single-value operators (`EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `LESS_THAN`), a rule's value may be a structured relative-date object instead of an absolute date string. These types are all exported from `@sdcorejs/angular/components/query-builder`.

```ts
type SdQbRelativeUnit      = 'day' | 'week' | 'month';
type SdQbRelativeDirection = 'previous' | 'next';
type QbDateMode            = 'absolute' | 'now' | 'relative';

interface SdQbRelativeDate {
  rel: 'now' | 'offset';
  unit?:      SdQbRelativeUnit;       // only for rel:'offset'
  amount?:    number;                 // >= 1; only for rel:'offset'
  direction?: SdQbRelativeDirection;  // only for rel:'offset'
}
```

Helper functions also exported:
- `qbIsRelativeDate(v): v is SdQbRelativeDate` — type guard
- `qbDefaultRelative(): SdQbRelativeDate` — returns `{ rel:'offset', unit:'day', amount:1, direction:'previous' }` (fresh object each call)

Constants (stable module references — safe to pass as `[items]`):
- `QB_DATE_MODES` — `[{ value:'absolute', display:'Ngày cụ thể' }, { value:'now', display:'Hôm nay' }, { value:'relative', display:'Tương đối' }]`
- `QB_RELATIVE_UNIT_OPTIONS` — 6 combined `unit:direction` tokens (`'day:previous'` … `'month:next'`) with Vietnamese display labels

**Emitted `Filter.data` shapes for a relative rule:**

```ts
// rel:'now' — current moment / today
{ field: 'createdAt', operator: 'GREATER_THAN', data: { rel: 'now' } }

// rel:'offset' — N units ago or ahead
{ field: 'createdAt', operator: 'LESS_THAN', data: { rel: 'offset', unit: 'day', amount: 7, direction: 'previous' } }

// BETWEEN — no relative mode; always emits absolute { from, to }
{ field: 'createdAt', operator: 'BETWEEN', data: { from: '2026-01-01', to: '2026-12-31' } }
```

An incomplete offset rule (missing `unit`, `direction`, or `amount < 1`) is treated as invalid and **dropped** from the emitted `Filter` (same as a null value).

## Operator vocabulary
Allowed operators come from `QB_OPERATORS_BY_TYPE[type]` unless `field.operators` overrides. The starting operator is `field.defaultOperator ?? QB_DEFAULT_OPERATOR_BY_TYPE[type]`. The operator selector (`<sd-operator>`) is **hidden** when only one operator is allowed. Helpers exported alongside the component: `qbAllowedOperators`, `qbDefaultOperator`, `qbIsNoDataOperator`, `qbIsMultiOperator`.

## Date / datetime value editor

For `date` and `datetime` fields, the value editor behaviour depends on the active operator:

- **`BETWEEN`** — always shows two absolute date pickers (`from` / `to`). No mode select; relative dates are not supported for BETWEEN (switching to BETWEEN resets any relative value to `{ from: null, to: null }`).
- **Single-value operators** (`EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `LESS_THAN`) — shows a mode select with three options:
  - **Ngày cụ thể** (`absolute`) — renders an `<sd-date>` / `<sd-datetime>` picker. Emits a date string in `Filter.data`.
  - **Hôm nay** (`now`) — no further input; emits `{ rel: 'now' }` in `Filter.data`.
  - **Tương đối** (`relative`) — renders a number input for the amount + a combined unit×direction select (`ngày/tuần/tháng × trước/tới`). Emits `{ rel: 'offset', unit, amount, direction }` in `Filter.data`.
- **`NULL` / `NOT_NULL`** — no value editor at all (same as other types).

The mode is **derived from the rule's value** — no separate state. The component exposes:
- `dateMode(rule): QbDateMode` — reads the current mode (`'absolute'` | `'now'` | `'relative'`)
- `setDateMode(rule, mode)` — reseeds the value per mode
- `relativeAmount(rule): number` — reads the offset amount (default `1`)
- `setRelativeAmount(rule, raw)` — sets amount, clamped to integer `>= 1`
- `relativeUnitDirValue(rule): string` — reads the `'unit:direction'` token (e.g. `'day:previous'`)
- `setRelativeUnitDir(rule, token)` — writes unit + direction from a `'unit:direction'` token
- `dateModes` — stable ref to `QB_DATE_MODES` (for template `[items]`)
- `relativeUnitOptions` — stable ref to `QB_RELATIVE_UNIT_OPTIONS` (for template `[items]`)

## Field picker behaviour

The field picker within each rule is **swap-only**: `[clearable]="false"` is set on the underlying `<sd-select>`, and `setField` ignores a `null` / `undefined` key (no-op). The only way to remove a rule is via its ✕ button (`removeNode`). This prevents accidentally clearing a field and leaving the rule in an indeterminate state.

## Compact value rows

Every value editor and the field picker use `hideInlineError`. Validation errors are suppressed inline (they appear via tooltip instead), keeping each rule row compact and preventing row-height jumps when a field is empty.

## View mode (`mode="view"`)
Renders a `<div class="qb-view">` (disabled-input look) containing the rules as a SQL-ish string built by `filterToTokens`:
- field token = the field's **label**
- `EQUAL =`, `NOT_EQUAL !=`, `> < >= <=`, `CONTAIN → like '%v%'`, `START_WITH → like 'v%'`, `END_WITH → like '%v'` (NOT_* → `not like`), `IN → in (…)`, `BETWEEN → between a and b`, `NULL → is null`, `NOT_NULL → is not null`
- `and` / `or` lowercase; nested multi-child groups wrapped in `( … )`; string values single-quoted (`'` escaped to `''`); `values` shown via their display label; boolean shown via `trueLabel`/`falseLabel`
- each piece is a `<span class="qb-tok qb-tok-<kind>">` so operators (`qb-tok-op`) and values (`qb-tok-value`) are highlighted distinctly from field/logic/paren
- relative date values render as readable Vietnamese: `hôm nay` (for `rel:'now'`) or `N ngày|tuần|tháng trước|tới` (for `rel:'offset'`)

Example output: `(Mã = 'ABC' and Tên like '%abc%') or Giá > 100`
Relative example: `Ngày tạo > 7 ngày trước`

## Examples

### 1. Advanced-search builder + apply
```html
<sd-query-builder [fields]="fields" [(value)]="filter"></sd-query-builder>
<sd-button title="Áp dụng" type="fill" color="primary" (click)="search(filter)"></sd-button>
```
```ts
fields: SdQueryBuilderField[] = [
  { key: 'code', label: 'Mã', type: 'string' },
  { key: 'price', label: 'Giá', type: 'number', operators: ['EQUAL', 'BETWEEN', 'GREATER_THAN'] },
  { key: 'status', label: 'Trạng thái', type: 'values',
    values: [{ value: 'active', display: 'Hoạt động' }, { value: 'inactive', display: 'Ngừng' }] },
];
filter: Filter | null = null;
```

### 2. Read-only display of a saved filter
```html
<sd-query-builder [fields]="fields" [value]="savedFilter" mode="view"></sd-query-builder>
```

### 3. Flat mirror for a query endpoint
```html
<sd-query-builder [fields]="fields" [(filters)]="filters"></sd-query-builder>
<!-- `filters` is Filter[] (root group's children) — pass to a list/table query -->
```

## Anti-patterns
- ❌ Sharing one `value` object across builder instances — seed a fresh `Filter`/`null` per instance.
- ❌ Expecting a flat `Filter[]` when you used nested groups — nesting lives in `value` (the tree); `filters` only mirrors the root's direct children.
- ❌ Hardcoding operator lists in the template — declare `field.operators` / rely on `QB_OPERATORS_BY_TYPE`.
- ❌ Using `mode="view"` to disable editing while keeping the tree UI — use `[disabled]="true"` for that; `view` swaps to the raw-string renderer.

## Known limitations

- **Hard-coded Vietnamese strings** — display labels for the date-mode select (`'Ngày cụ thể'`, `'Hôm nay'`, `'Tương đối'`), relative unit options (`'ngày trước'`, `'tháng tới'`, …), and the view-mode relative tokens (`'hôm nay'`, `'ngày trước'`, `'tới'`) are baked into the component and serializer. Migration through `I18nService` is deferred tech debt.
- **Relative dates: minute / hour granularity** — only `day`, `week`, `month` units are supported. Hour / minute offsets are intentionally out of scope for this iteration.
- **Relative dates: field-to-field comparison** — comparing two fields (e.g. `createdAt > updatedAt`) is intentionally out of scope. The value of a rule is always a scalar / array / range / relative spec.
- **Relative dates: BETWEEN** — relative values are not supported as BETWEEN endpoints. Switching from a single-value operator with a relative value to BETWEEN resets the value to `{ from: null, to: null }`.

## Related
- `<sd-query-bar>` — flat chip-based filter bar; same `Filter` output, no nesting
- `<sd-operator>` — operator picker reused for each rule
- `<sd-select>` / `<sd-input>` / `<sd-date>` / `<sd-datetime>` — the per-type value editors
- `Filter` / `Operator` (`@sdcorejs/utils/models`) — output contract
- `filterToTokens` / `treeToFilter` / `filterToTree` — serializer helpers (exported)
