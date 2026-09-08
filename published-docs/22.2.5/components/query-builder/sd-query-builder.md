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
New usage should bind only `[option]`, like `sd-table`. Put `autoId`, `fields`, `mode`, `comparisonMode`, `disabled`, seeded `value` / `filters` / `rootLogic`, and callbacks (`onValueChange`, `onFiltersChange`, `onRootLogicChange`) inside `SdQueryBuilderOption`. The split inputs/models below remain as a migration bridge.

```html
<sd-query-builder [option]="queryBuilderOption"></sd-query-builder>
```

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdQueryBuilderOption` | `undefined` | Main option object for new usage. |
| `fields` | `SdQueryBuilderField[]` | `[]` | Filterable fields. Each `type` drives the allowed operators + the value-editor control. **Required** to pick fields / show labels. |
| `mode` | `'edit' \| 'view'` | `'edit'` | `edit` = interactive tree · `view` = read-only highlighted raw-query string (looks like a disabled input). |
| `comparisonMode` | `'value-only' \| 'value-or-field'` | `'value-only'` | `value-only` = mỗi rule nhập giá trị thuần; `value-or-field` = mỗi rule có thể chọn nhập giá trị hoặc so sánh với một field khác cùng type. |
| `disabled` | `boolean` | `false` | Disables every editing control. Bare attribute = `true`. |
| `autoId` | `string` | `undefined` | Prefix for `data-autoid` on inner controls (E2E selectors). |

## Two-way models (output)
| Name | Type | Notes |
| --- | --- | --- |
| `value` | `Filter \| null` | **Canonical** output — the root `FilterAndOr` tree (`null` when empty). `[(value)]`. |
| `filters` | `Filter[]` | Convenience mirror = the root group's direct children. `[(filters)]`. Writing it (with no `value`) seeds an `{ operator: rootLogic, data }` root. |
| `rootLogic` | `'AND' \| 'OR'` | The root group's connector. `[(rootLogic)]`. |

`value` is the source of truth; `filters` is kept in sync. Seeding either rebuilds the internal tree once, then normalizes — no echo loop.

## Outputs
The component uses Angular model outputs for `value`, `filters`, and `rootLogic`:

| Output | Payload | Notes |
| --- | --- | --- |
| `valueChange` | `Filter \| null` | Canonical nested filter tree. |
| `filtersChange` | `Filter[]` | Flat root-level mirror. |
| `rootLogicChange` | `'AND' \| 'OR'` | Root connector mirror. |

When using `[option]`, the equivalent callbacks are `onValueChange`, `onFiltersChange`, and `onRootLogicChange`.

## Visual cues
- Edit mode renders nested groups of rule rows with field picker, operator picker, and value editor.
- Group connectors are AND/OR controls, with nested groups visually indented.
- Value editors reuse Core UI controls according to field type: input, number, select, date, datetime.
- View mode renders a disabled-input-like raw query string with highlighted field/operator/value tokens.
- Incomplete rules are visible while editing but are dropped from emitted `Filter`.

### Type shapes
```ts
type SdQueryBuilderFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'values';

interface SdQueryBuilderField {
  key: string;                 // dot-notation path → Filter.field
  label: string;               // field picker + view-mode field token
  type: SdQueryBuilderFieldType;
  icon?: string;               // leading Material icon in the picker; defaults to SD_QB_TYPE_ICON[type] → 'tune'
  operators?: Operator[];      // override the per-type allowed set
  defaultOperator?: Operator;  // override the starting operator
  values?: { value: any; display: string }[];  // for type 'values'
  trueLabel?: string; falseLabel?: string;       // for type 'boolean'
  min?: number | string; max?: number | string;  // also bound onto the number value editor (sd-input-number)
  compareGroup?: string;                         // optional domain guard for field-to-field comparison
  allowFieldCompare?: boolean;                   // false = hide from field-to-field comparison
}
```
The emitted `value` is a `Filter` (`@sdcorejs/utils/models`): leaf rules become `FilterHasData` / `FilterBetween` / `FilterNoData`; groups become `FilterAndOr { operator, data }`. Incomplete rules (missing field / operator / value) are dropped from the output.

### Field-to-field comparison

By default the builder runs in `comparisonMode="value-only"`: every condition is the classic `field operator literal-value` shape.

When `comparisonMode="value-or-field"`, each eligible rule gets a value-source select:
- **Nhập giá trị** (`literal`) — render the normal value editor for the field type.
- **Chọn trường** (`field`) — render a second field picker and emit a field-reference operand.

Only single-operand operators support field references. `BETWEEN`, `IN`, `NOT_IN`, `NULL`, and `NOT_NULL` stay literal/no-value only. Candidate fields are filtered by exact `type`, exclude the left-hand field itself, and respect `allowFieldCompare: false`. If either side declares `compareGroup`, both fields must have the same `compareGroup`.

The emitted `Filter` uses the canonical `@sdcorejs/utils` shape:

```ts
// price > cost
{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }
```

The internal rule state uses `valueSource: 'literal' | 'field'` and `compareField`, but those are never emitted directly. Seeding `[value]` with `dataType: 'field'` round-trips back into the field selector.

### Relative-date value types

For `date` and `datetime` fields with single-value operators (`EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`), a rule's value may be a **relative date** instead of an absolute date string. As of `@sdcorejs/utils` **1.1.3** the builder **reuses the canonical model from utils** instead of a local one — the offset shape is `DateRelative`, and the emitted `Filter` carries a `dataType` discriminator. Types/helpers are re-exported from `@sdcorejs/angular/components/query-builder`.

```ts
import { DateRelative } from '@sdcorejs/utils/models';

// offset spec (utils) — what 'relative' mode stores
interface DateRelative {
  amount: number;
  direction: 'previous' | 'next';
  unit: 'hour' | 'day' | 'week' | 'month';   // builder UI offers day/week/month
}

type SdQbRelativeUnit      = DateRelative['unit'];       // alias of the utils member type
type SdQbRelativeDirection = DateRelative['direction'];
type SdQbDateMode            = 'absolute' | 'now' | 'relative';
type SdQbToday               = 'TODAY';                    // the date-today sentinel
```

A date rule's internal `value` is exactly one of:
- `null` or a concrete date string → **absolute**
- `'TODAY'` (the `SD_QB_TODAY` sentinel) → **now / today**
- a `DateRelative` object → **relative offset**

Helpers / constants exported:
- `sdQbIsRelativeDate(v): v is DateRelative` — type guard (delegates to `FilterUtilities.isDateRelative`)
- `sdQbIsToday(v): v is 'TODAY'` — narrows the today sentinel
- `sdQbDefaultRelative(): DateRelative` — returns `{ amount: 1, direction: 'previous', unit: 'day' }` (fresh object each call)
- `SD_QB_TODAY` — the `'TODAY'` string sentinel
- `SD_QB_DATE_MODES` — `[{ value:'absolute', labelKey:'core.component.query-builder.date-mode.absolute', icon:'event' }, …]`
- `SD_QB_RELATIVE_UNIT_OPTIONS` — 6 combined `unit:direction` tokens (`'day:previous'` … `'month:next'`), each carrying a `labelKey`
- `SD_QB_VALUE_SOURCE_OPTIONS` — the `literal` / `field` operand sources, each carrying a `labelKey`
- `qbRelativeLabelKey(unit, direction)` — i18n key of the combined offset phrase (also covers `hour`, which the UI does not offer but `DateRelative` allows)

> **BREAKING (option tables):** these tables used to carry a pre-translated `display`. They now carry
> `labelKey` only, and the label is resolved at READ time by the component, so it follows
> `I18nService.setLanguage()`. A `display` baked in at module-eval time could never react to a
> language change. Read the resolved list from the component signals (`dateModes()`,
> `valueSourceOptions()`, `relativeUnitOptions()`), not from the constants.

**Emitted `Filter` shapes for a relative rule** — the discriminator is `dataType` (sibling of `data`):

```ts
// today → date-today
{ field: 'createdAt', operator: 'GREATER_THAN', dataType: 'date-today', data: 'TODAY' }

// N units ago / ahead → date-relative
{ field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-relative',
  data: { amount: 7, direction: 'previous', unit: 'day' } }

// BETWEEN — no relative mode; always emits absolute { from, to }
{ field: 'createdAt', operator: 'BETWEEN', data: { from: '2026-01-01', to: '2026-12-31' } }
```

An incomplete offset (missing `unit` / `direction`, or `amount < 1`) is invalid and **dropped** from the emitted `Filter` (same as a null value).

**Back-compat:** filters persisted before the migration stored `data: { rel: 'now' | 'offset', … }`. `filterToTree` still reads that legacy shape when seeding `[value]` and re-emits the new `dataType` form on the next change, so old saved queries keep working.

## Operator vocabulary
Allowed operators come from `SD_QB_OPERATORS_BY_TYPE[type]` unless `field.operators` overrides. The starting operator is `field.defaultOperator ?? SD_QB_DEFAULT_OPERATOR_BY_TYPE[type]`. The operator selector (`<sd-operator>`) is **hidden** when only one operator is allowed. Helpers exported alongside the component: `sdQbAllowedOperators`, `sdQbDefaultOperator`, `sdQbIsNoDataOperator`, `sdQbIsMultiOperator`, `sdQbSupportsFieldCompareOperator`.

## Date / datetime value editor

For `date` and `datetime` fields, the value editor behaviour depends on the active operator:

- **`BETWEEN`** — always shows two absolute date pickers (`from` / `to`). No mode select; relative dates are not supported for BETWEEN (switching to BETWEEN resets any relative value to `{ from: null, to: null }`).
- **Single-value operators** (`EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `LESS_THAN`) — shows a mode select with three options:
  - **Ngày cụ thể** (`absolute`) — renders an `<sd-date>` / `<sd-datetime>` picker. Emits a date string in `Filter.data`.
  - **Hôm nay** (`now`) — no further input; emits `dataType: 'date-today', data: 'TODAY'`.
  - **Tương đối** (`relative`) — renders a number input for the amount + a combined unit×direction select (`ngày/tuần/tháng × trước/tới`). Emits `dataType: 'date-relative', data: { amount, direction, unit }`.
- **`NULL` / `NOT_NULL`** — no value editor at all (same as other types).

The mode is **derived from the rule's value** — no separate state. The component exposes:
- `dateMode(rule): SdQbDateMode` — reads the current mode (`'absolute'` | `'now'` | `'relative'`)
- `setDateMode(rule, mode)` — reseeds the value per mode
- `relativeAmount(rule): number` — reads the offset amount (default `1`)
- `setRelativeAmount(rule, raw)` — sets amount, clamped to integer `>= 1`
- `relativeUnitDirValue(rule): string` — reads the `'unit:direction'` token (e.g. `'day:previous'`)
- `setRelativeUnitDir(rule, token)` — writes unit + direction from a `'unit:direction'` token
- `dateModes()` — `SD_QB_DATE_MODES` with each `labelKey` resolved to `display` through `I18nService` (for template `[items]`)
- `relativeUnitOptions()` — same treatment for `SD_QB_RELATIVE_UNIT_OPTIONS`
- `valueSourceOptions()` — same treatment for `SD_QB_VALUE_SOURCE_OPTIONS`

All three are `computed()`, so the array reference stays stable across change-detection passes (required by
`sd-select [items]`, which otherwise loops through `toObservable(items)` → `markForCheck()`), yet is rebuilt
when the language changes.

The static template strings (`Chọn trường`, `Giá trị`, `Từ` / `Đến`, `Thêm`, `Điều kiện` / `Nhóm`, `Xoá nhóm` /
`Xoá điều kiện`, `Chưa có điều kiện`) are exposed the same way: `selectFieldLabel()`, `valueLabel()`,
`fromLabel()`, `toLabel()`, `addLabel()`, `addNodeLabel()`, `conditionLabel()`, `groupLabel()`,
`removeGroupLabel()`, `removeConditionLabel()`, `emptyLabel()`. Boolean-field defaults come from
`core.component.query-builder.boolean.true` / `.false` when the field declares no `trueLabel` / `falseLabel`.

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
- relative date values render in the active language: the `core.component.query-builder.date-mode.now` label (for `dataType:'date-today'`) or `{amount} {phrase}` assembled from `core.component.query-builder.relative.*` (for `dataType:'date-relative'`) — the catalogue owns the word order, so `3 ngày trước` / `3 days ago` / `3日前` all come out right
- field-reference operands render as the right-hand field label, e.g. `Giá > Giá vốn` for `dataType:'field'`

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

### 4. Allow comparing with another field
```html
<sd-query-builder
  [fields]="fields"
  comparisonMode="value-or-field"
  [(value)]="filter"
></sd-query-builder>
```
```ts
fields: SdQueryBuilderField[] = [
  { key: 'price', label: 'Giá', type: 'number', compareGroup: 'money' },
  { key: 'cost', label: 'Giá vốn', type: 'number', compareGroup: 'money' },
  { key: 'createdAt', label: 'Ngày tạo', type: 'date' },
  { key: 'updatedAt', label: 'Ngày cập nhật', type: 'date' },
];
```

## Anti-patterns
- ❌ Sharing one `value` object across builder instances — seed a fresh `Filter`/`null` per instance.
- ❌ Expecting a flat `Filter[]` when you used nested groups — nesting lives in `value` (the tree); `filters` only mirrors the root's direct children.
- ❌ Hardcoding operator lists in the template — declare `field.operators` / rely on `SD_QB_OPERATORS_BY_TYPE`.
- ❌ Using `mode="view"` to disable editing while keeping the tree UI — use `[disabled]="true"` for that; `view` swaps to the raw-string renderer.

## Known limitations

- **SQL keywords in view mode are not translated** — `and` / `or` / `like` / `between` / `is null` stay literal SQL syntax by design; only field labels and *values* go through `I18nService`.
- **Relative dates: minute / hour granularity** — only `day`, `week`, `month` units are supported. Hour / minute offsets are intentionally out of scope for this iteration.
- **Field-to-field comparison: compound values** — field references only support single-operand operators. `BETWEEN`, `IN`, and `NOT_IN` stay literal-value editors.
- **Relative dates: BETWEEN** — relative values are not supported as BETWEEN endpoints. Switching from a single-value operator with a relative value to BETWEEN resets the value to `{ from: null, to: null }`.

## Related
- `<sd-query-bar>` — flat chip-based filter bar; same `Filter` output, no nesting
- `<sd-operator>` — operator picker reused for each rule
- `<sd-select>` / `<sd-input>` / `<sd-date>` / `<sd-datetime>` — the per-type value editors
- `Filter` / `Operator` (`@sdcorejs/utils/models`) — output contract
- `filterToTokens(filter, fields, translate?)` / `treeToFilter` / `filterToTree` — serializer helpers (exported). `translate` is a `SdQbTranslate` (`(key, params?) => string`); the component passes `I18nService.t`. Omit it only outside an injection context — the serializer then renders the raw i18n keys so a missing translation is visible instead of silently Vietnamese.

## Accessibility

- The builder container is `role="group"` (a set of controls, not a widget) so it takes no tab stop of its own — Tab goes straight to the buttons and pickers inside.
- "Click empty space to close open dropdowns" is a mouse-only affordance; **Escape** now does the same thing, so keyboard users can dismiss an open add-menu.
- The add-menu dropdown is `role="group"` and swallows Enter as well as click, so activating a button inside it never reaches the container's "close all" handler.
