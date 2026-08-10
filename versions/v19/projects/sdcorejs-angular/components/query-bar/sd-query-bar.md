# `<sd-query-bar>`

**Type**: Component
**Selector**: `sd-query-bar`
**Import path**: `@sdcorejs/angular/components/query-bar`
**Class**: `SdQueryBar`
**Standalone**: yes
**Change detection**: `OnPush`

> Status: **v1.1 — full decomposition (7/7 sub-components extracted)**. Inline + popover modes, build flow, saved-filters, multi-select head+N display, BETWEEN date-range unified. Design source: `refs/design_handoff_sd_query_bar/`.

## One-line purpose

Unified filter chip row (Jira / Linear / Notion / GitLab style) — replaces inline / external table filters when callers want a compact single-row UI. Emits `SdQuery` (filters + global AND/OR logic + optional search) consumable by `sd-table` and any list endpoint.

## When to use

- Page-level filter strip above an `sd-table` (or any list view).
- "Quick query" panel where users add filter chips dynamically.
- As an alternative to `sd-table`'s inline column filters when ≥3 filters are typical.

## When NOT to use

- ❌ Per-row filter (use the inline column filter on `sd-table`).
- ❌ Form-style multi-field input (use `<sd-input>` + `<sd-select>` directly).
- ❌ Single-filter UI (overkill — use one form control).

## Modes

Pick via `[mode]`:

- **`'popover'`** (default) — compact chips. Click a chip → opens a `mat-menu` editor (`<sd-query-chip-popover>`) for operator + value. Staged edits commit when the popover closes (no per-chip "Apply" button). One global Search action.
- **`'inline'`** — GitLab-style token builder. Each filter's operator + value controls render directly on the bar. Edits write `filters` live; one Search button (or Enter in the search input) fires `(apply)`.

`canSearch()` gates the Search action — true when there's at least one filter OR a non-blank search string.

## Models

Reuses `Filter` and `Operator` from `@sdcorejs/utils/models` (re-exported by `@sdcorejs/angular/utilities/models`). No new operator vocabulary.

```ts
// Field config — discriminated union by `type` (mirrors sd-table column.type)
type SdQueryFieldType =
  | 'string' | 'number' | 'boolean'
  | 'date' | 'datetime'
  | 'values' | 'lazy-values';

type SdQueryField<T = any> =
  | SdQueryFieldString<T>
  | SdQueryFieldNumber<T>
  | SdQueryFieldBoolean<T>
  | SdQueryFieldDate<T>
  | SdQueryFieldValues<T, K>
  | SdQueryFieldLazyValues<T, K>;

// Composite output
interface SdQuery<T = any> {
  filters: Filter<T>[];
  logic?: 'AND' | 'OR';
  search?: string;
}

// Persisted snapshot — managed by `[savedFiltersKey]`
interface SdSavedFilter<T = any> {
  id: string;
  name: string;
  query: SdQuery<T>;
}

// In-progress chip (inline mode only) — exposed via `building()`
interface BuildingChip {
  field: SdQueryField;
  operator?: Operator;
  step: 'operator' | 'value';
  value?: unknown;
}
```

Per-type options match `sd-table` column options:

| type | extra options |
|---|---|
| `string` | (none) |
| `number` | `min`, `max`, `step` |
| `boolean` | `trueLabel`, `falseLabel` |
| `date` / `datetime` | `min`, `max` (range bounds) |
| `values` | `option.items` (array \| signal \| `() => Promise<K[]>`), `valueField`, `displayField` |
| `lazy-values` | `option.search: SdSearch<K>` (unified `{type:'SEARCH'\|'VALUE', searchText?, value?}`), `valueField`, `displayField` |

The `operators` field knob is a tri-state:

| `operators` value | Effect |
|---|---|
| omitted / `false` | **Simple mode** — no operator dropdown, fixed default per type |
| `true` | Full operator set for the type (see `SD_QUERY_OPERATORS_BY_TYPE`) |
| `Operator[]` | Exact subset (caller's order preserved) |

Per-type defaults: `string→CONTAIN`, `number→EQUAL`, `boolean→EQUAL`, `date/datetime→BETWEEN`, `values/lazy-values→IN`. Override via `field.defaultOperator`.

Multi-select is **derived from the operator** (`IN` / `NOT_IN`), not a field flag.

Constants & helpers exported alongside the models:

- `SD_QUERY_OPERATORS_BY_TYPE` — full operator set per type
- `SD_QUERY_DEFAULT_OPERATOR_BY_TYPE` — initial operator per type
- `SD_QUERY_TYPE_ICON` — Material icon fallback per type
- `SD_QUERY_NO_DATA_OPERATORS` (`NULL`, `NOT_NULL`) — operators that hide the value control
- `SD_QUERY_MULTI_OPERATORS` (`IN`, `NOT_IN`) — operators that switch the value to an array
- `sdQueryFieldIcon(field)` — `field.icon ?? SD_QUERY_TYPE_ICON[type] ?? 'tune'`
- `sdQueryAllowedOperators(field)` — resolves the tri-state to an `Operator[]`
- `sdQueryDefaultOperator(field)` — picks the initial operator
- `sdQueryShowOperatorSelector(field)` — true when the field exposes >1 operator

Operator labels + icons live in `@sdcorejs/utils` `OPERATORS` table (v1.1.2 adds `BETWEEN`). They are NOT redefined in this component.

## Inputs

New usage should bind only `[option]`, like `sd-table`. Put `autoId`, `fields`, initial `filters` / `logic` / `search`, display flags, and callbacks (`onQueryChange`, `onApply`) inside `SdQueryBarOption`. The split inputs and model outputs below remain as a migration bridge.

```html
<sd-query-bar [option]="queryBarOption"></sd-query-bar>
```

| Name | Type | Default | Notes |
|---|---|---|---|
| `option` | `SdQueryBarOption` | `undefined` | Main option object for new usage. |
| `autoId` | `string` | `undefined` | Prefix for `data-autoid` on inner controls. |
| `fields` | `SdQueryField[]` | `[]` | Available fields. null/undefined coerced to `[]`. |
| `filters` | `Filter[]` (model) | `[]` | Two-way: `[(filters)]`. |
| `logic` | `'AND' \| 'OR'` (model) | `'AND'` | Two-way: `[(logic)]`. |
| `search` | `string` (model) | `''` | Two-way: `[(search)]`. |
| `mode` | `'popover' \| 'inline'` | `'popover'` | Editing UX (see Modes). |
| `density` | `'compact' \| 'comfortable'` | `'compact'` | Chip / control height. |
| `showSearch` | `boolean` | `false` | Render the free-text search input on the left. |
| `showSavedFilters` | `boolean` | `false` | Render the bookmark dropdown. Disabled unless `savedFiltersKey` is set. |
| `savedFiltersKey` | `string \| undefined` | `undefined` | Namespace for `localStorage` persistence (`sd-query-bar:savedFilters:<key>`). |
| `showLogicToggle` | `boolean` | `false` | Render AND/OR segmented toggle (only when ≥2 filters). |
| `showClearAll` | `boolean` | `true` | Show "Xóa tất cả (N)" when ≥1 filter. |
| `showOperatorOnChip` | `boolean` | `false` | Render the operator icon on the chip face (else hidden — operator only visible in popover). |

All `boolean` inputs go through `booleanAttribute` (bare attribute = true). All other inputs accept `null | undefined` and transform to the canonical shape.

## Outputs

| Name | Payload | When |
|---|---|---|
| `filtersChange` | `Filter[]` | Auto-paired with `filters` model. |
| `logicChange` | `'AND' \| 'OR'` | Auto-paired with `logic` model. |
| `searchChange` | `string` | Auto-paired with `search` model. |
| `queryChange` | `SdQuery` | Emitted by `triggerApply()` only (mutations no longer auto-emit). |
| `apply` | `SdQuery` | User pressed the Search button or Enter in the search input. |

> **Trigger model:** mutations (`addFilter`, `updateFilter`, …) ONLY mutate `filters` / `logic` / `search` models. The composite `(queryChange)` + `(apply)` outputs fire exactly once per Search action.

## Visual cues
- One horizontal filter bar with optional free-text search input on the left and actions on the right.
- Popover mode renders compact chips; chip click opens a Material menu editor for operator/value.
- Inline mode renders GitLab-style tokens where operator/value controls sit directly in the chip row.
- Active chips show field label, value summary, optional operator, and a remove `×`.
- Saved filters appear as bookmark controls near the Search action when enabled.
- AND/OR toggle appears only when enabled and there are at least two filters.

## Public API

| Method | Purpose |
|---|---|
| `addFilter(field)` | Popover mode: create a chip with default operator + open its popover. |
| `beginBuild(field)` | Inline mode: start the build flow (field → operator → value). |
| `pickBuildOperator(op)` | Inline mode: advance the build chip from operator step → value step. |
| `commitBuildValue(value)` | Inline mode: finalize the build chip into a completed filter. |
| `cancelBuild()` | Inline mode: abandon the in-progress chip. |
| `changeFilterField(index, field)` | Swap the field of an existing chip (resets operator + value to new defaults). |
| `updateFilter(index, patch)` | Replace chip at index. |
| `removeFilter(index)` | Drop chip at index. |
| `clearAll()` | Reset filters to `[]`. |
| `setLogic(value)` | Toggle AND ↔ OR. |
| `setSearch(value)` | Update free-text search. |
| `triggerApply()` | Emit `(queryChange)` + `(apply)` with the current composite query. |
| `onApplyFilter(saved)` | Install a `SdSavedFilter` (filters + logic + search) + trigger apply. |
| `isFilterActive(filter)` | Helper — true if filter has non-empty data or NULL/NOT_NULL operator. |
| `chipValueText(filter)` | Helper — value string shown on chip (handles BETWEEN range + multi-value `+N` summary). |
| `allowedOperatorsFor(field)` | Helper — operators offered for `field`. The array is referentially stable per field object, so it is safe in a template binding. |
| `rowId(filter)` | Template helper — stable synthetic id of a filter row, used as the `@for ... track` key. Not part of the emitted payload. |

### Chip identity

Chips track by `rowId(filter)`, **not** by index. Each `Filter` object gets a synthetic id on first render, held in an internal `WeakMap` so the emitted `SdQuery.filters` payload stays a clean `Filter[]` (no injected id property). Editing a chip (`updateFilter` / popover commit) carries the id onto the replacement object, so the chip is patched in place; removing a chip destroys exactly that chip instead of shifting every later chip up one slot. This is what keeps per-chip local state (`inline-value-chip` draft, `inline-chip` boolean edit toggle) attached to the filter it belongs to.

`removeFilter(index)` also keeps `editingIndex` aligned: removing the chip being edited closes its popover and clears the index; removing a chip **before** it shifts the index down by one so a later popover commit still lands on the same filter.

#### Two constraints on the `filters` array

Both are consumer contracts, and both follow from the id being keyed on object identity:

1. **The same `Filter` object must not appear twice.** Two positions produce the same track key and Angular raises `NG0955`. Disambiguating with an `$index` suffix was tried and is not viable: Angular evaluates the `track` expression against the *previous* collection too while diffing, so a just-removed filter resolves differently, its key changes, and every chip is destroyed and rebuilt. Letting `NG0955` surface is the correct behaviour — its message already names the problem.
2. **The objects must be stable across change detection.** Building the array inline (`[option]="{ filters: buildFilters() }"`, or a getter that maps fresh objects) hands every chip a new identity on every pass, so every chip is destroyed and rebuilt — worse than the `track $index` this replaced. Hold `filters` in a field or a signal.

## Sub-component decomposition (7/7 done)

`<sd-query-bar>` is an orchestrator. State surface: `filters` / `logic` / `search` models, `editingIndex` (which popover-chip is open), `building` (inline in-progress chip). All UI lives in children:

| Child selector | File (under `src/`) | Responsibility |
|---|---|---|
| `<sd-query-saved-filters-menu>` | `saved-filters-menu.component.*` | Bookmark dropdown + `localStorage` persistence (CRUD on `SdSavedFilter[]`). |
| `<sd-query-field-picker>` | `field-picker.component.*` | Both "Add filter" (`[usedKeys]`) and "Swap field" (`[currentKey]`) mat-menus — one component, two modes. |
| `<sd-query-actions-bar>` | `actions-bar.component.*` | Right-pinned toolbar — divider, AND/OR toggle, saved-filters dropdown, clear-all, "Lưu bộ lọc" shortcut (calls `SdQuerySavedFiltersMenu.promptSave()` via viewChild), Search trigger. |
| `<sd-query-popover-chip>` | `popover-chip.component.*` | Popover-mode chip face — `div[role=button]` host + nested `<sd-operator>` (button-in-button is invalid HTML) + × remove. Hosts the `[menu]` from `<sd-query-chip-popover>`. |
| `<sd-query-chip-popover>` | `chip-popover.component.*` | Popover-mode editor (the `mat-menu` body). Owns operator + value staging signals, async option loading, range mutators, multi toggle. Emits `(commit)` on menu close → parent splices. `seed(filter, field)` reseeds before each open. |
| `<sd-query-inline-value-chip>` | `inline-value-chip.component.*` | Seamless string / number chip — the pill IS the input. vi-VN number format, BETWEEN dual input, Enter commits / Esc reverts. Used by both completed and build chips. |
| `<sd-query-inline-chip>` | `inline-chip.component.*` | Inline-mode completed chip for non-string/number types (boolean / date / datetime / values / lazy-values + BETWEEN). Owns its own click-to-edit / focusout-to-exit lifecycle and `#chipPicker` viewChild. |
| `<sd-query-build-chip>` | `build-chip.component.*` | In-progress chip rendered while `building()` is non-null. Renders both seamless (string/number) and `.c-token-building` (operator step menu / value step picker) branches. Exposes `openOperator()` / `openPicker()` for the parent's auto-open `afterNextRender` flow. |

`<sd-operator>` (`components/operator`) is shared with `sd-table` column-filter — operator picker (icon + label + SVG via `OPERATORS` table).

### Where to look when…

| Symptom | File |
|---|---|
| Chip face wrong (popover mode) | `popover-chip.component.*` |
| Popover editor branch wrong | `chip-popover.component.html` |
| Inline chip in edit mode broken | `inline-chip.component.*` (focusout, picker open) |
| Build flow broken | `build-chip.component.*` + parent `beginBuild` / `pickBuildOperator` |
| Seamless string/number input | `inline-value-chip.component.*` |
| Saved-filters menu | `saved-filters-menu.component.*` |
| AND/OR / Search / Clear | `actions-bar.component.*` |
| Field picker (add or swap) | `field-picker.component.*` |

## Inline chip rendering rules

- **Multi sd-select (`IN` / `NOT_IN`):** the chip projects a `<ng-template #sdValue>` so the viewed display renders `"<first label> +<N-1>"` instead of the comma-joined default. Same pattern in build chip + completed chip + chip popover.
- **`BETWEEN` (date / datetime):** uses one `<sd-date-range [viewed]="'inline'">` for both the build chip and the completed-chip edit. The `datetime` type downgrades to date precision (no time picker on the range panel) — committed `{from, to}` carries date values only.
- **`values` / `lazy-values` — `sd-select [viewed]="'inline'"` (self-managed):** the completed chip delegates the entire edit lifecycle to `sd-select`'s inline mode — the `<sd-view>` text is the visible face, the real picker is mounted invisibly underneath to host the panel, click the text opens the panel (min 200px), and the text only changes when a value is committed. The chip no longer wires `enterEdit` / `onFocusOut` / `#editing` for this branch. (See `sd-select`'s tri-state `viewed`.)
- **All non-string/number branches delegate to `[viewed]="'inline'"`:** `values` / `lazy-values` (sd-select), `date` (sd-date), `datetime` (sd-datetime), and BETWEEN (sd-date-range) all render with `[viewed]="'inline'" [clearable]="false"` — the control owns click-to-edit + the panel; the chip no longer wires `enterEdit` / `onFocusOut` / `#editing`. Only the **boolean** branch keeps the chip-managed `#editing` toggle (boolean has no `viewed`-aware control). The **build chip** uses the same `[viewed]="'inline'"` pickers and auto-opens the panel via the parent's `openPicker()` when the value step renders. (The old `[bare]` input on those controls has been removed.)
- **No inline clear-× in chip pickers:** the chip pickers never render their own `.sd-clear-btn` — `sd-select` inline-active is bare (gated on `bare() || inlineEditing()`); `sd-date` / `sd-datetime` / `sd-date-range` are gated on `!bare()`. The chip already owns removal via `.c-token-remove`; a second × next to the trigger was easy to hit while dismissing the panel and would clear the value (commit empty `data`), making the chip look like it "lost its display on close without change".
- **Operator on chip:** only rendered when `[showOperatorOnChip]=true`; else a `:` separator sits between label and value. Operator picker (`<sd-operator>`) gets the SVG icon + i18n label from `OPERATORS`.
- **Inline build flow — date / datetime skip operator step:** when `beginBuild(field)` runs for a `date` / `datetime` field whose default operator (BETWEEN) is in `allowedOperators`, the operator step is skipped and the build chip lands on the value step with BETWEEN pre-selected. Reasoning: BETWEEN is overwhelmingly the common case for date filters; skipping one click matters. Other types keep the operator step when `allowed.length > 1`.
- **Chip popover value controls** carry `hideInlineError` so the value editor stays compact (no reserved error-subscript row under each input).

## Saved filters (`[savedFiltersKey]` + `[showSavedFilters]`)

When both are set, the toolbar exposes two adjacent buttons next to Search:

- The **bookmark dropdown** lists `SdSavedFilter[]` from `localStorage` under `sd-query-bar:savedFilters:<key>` — pick to apply, click `×` to delete. Empty state: "Chưa có bộ lọc nào." Leading icon is `filter_alt` (matches the saved-filter intent — not a generic "play").
- A separate **"Lưu bộ lọc hiện tại"** icon button (`bookmark_add`) sits immediately before the Search trigger. Clicking it prompts for a name and snapshots the current `{filters, logic, search}` into a new entry. The save action is intentionally adjacent to Search so the "name → save → search" flow stays in one toolbar zone.

Without a key both buttons stay disabled / hidden. `<sd-query-saved-filters-menu>` owns persistence — the host only reacts to `(applyFilter)`.

## Examples

### 1. Popover query bar with explicit apply

```html
<sd-query-bar
  [fields]="fields"
  [showSearch]="true"
  (apply)="reload($event)">
</sd-query-bar>
```

```ts
fields: SdQueryField<Order>[] = [
  { key: 'code', label: 'Mã đơn', type: 'string' },
  { key: 'status', label: 'Trạng thái', type: 'values',
    option: { items: STATUSES, valueField: 'value', displayField: 'label' } },
  { key: 'createdAt', label: 'Ngày tạo', type: 'date' },
];

reload(query: SdQuery<Order>): void {
  this.query.set(query);
  this.table.reload();
}
```

### 2. Inline mode with saved filters

```html
<sd-query-bar
  mode="inline"
  [fields]="fields"
  [showSearch]="true"
  [showSavedFilters]="true"
  savedFiltersKey="orders.list"
  [showLogicToggle]="true"
  (apply)="onApplyQuery($event)">
</sd-query-bar>
```

### 3. Drive an `<sd-table>` server request

```html
<sd-query-bar
  [fields]="fields"
  [showSearch]="true"
  (apply)="query.set($event); tableRef.reload()">
</sd-query-bar>

<sd-table
  #tableRef
  [option]="tableOption">
</sd-table>
```

```ts
query = signal<SdQuery<Order>>({ filters: [], logic: 'AND', search: '' });

tableOption: SdTableOption<Order> = {
  type: 'server',
  items: (_filterReq, pagingReq) => this.api.searchOrders({
    ...pagingReq,
    filters: this.query().filters,
    logic: this.query().logic ?? 'AND',
    search: this.query().search,
  }),
  columns: [
    { field: 'code', title: 'Mã đơn', type: 'string' },
  ],
};
```

`SdQuery.filters` is already the canonical `Filter[]` payload. Do not try to stuff it into `sd-table`'s `filter.externalFilters`; that config describes built-in toolbar controls, not query-bar chip state.

## Dependencies

Internal: `@sdcorejs/angular/components/{operator, button}`, `@sdcorejs/angular/forms/{input, input-number, select, date, datetime, date-range}`, `@sdcorejs/angular/i18n`.
External: `@sdcorejs/utils` `^1.1.2` (`OPERATORS` table + `BETWEEN` icon).

## Test status

- query-bar suite: **158 SUCCESS** (Karma + ChromeHeadless). Run:
  ```
  npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
    --include='projects/sdcorejs-angular/components/query-bar/**/*.spec.ts'
  ```
- Each sub-component has its own spec (`<name>.component.spec.ts`) covering its public surface + the rendering branches it owns.

## Known limitations / next iterations

- E2E / integration specs not yet written — only unit specs per sub-component.
- Operator picker dropdown doesn't support keyboard arrow navigation yet (planned).
- No `Esc` shortcut to cancel an in-progress build chip (planned).
- `(values | lazy-values).option.items` async-function variant is loaded once per popover open — no caching across opens. Acceptable for the current usage; revisit if a heavy endpoint hurts UX.

## Anti-patterns
- ❌ Using query-bar for a single simple filter — one form control is lighter.
- ❌ Passing `SdQuery.filters` into `sd-table.filter.externalFilters` — those are different contracts.
- ❌ Recreating `fields` inline in the template — keep field config stable so chips/pickers do not churn.
- ❌ Enabling saved filters without `savedFiltersKey` — the UI cannot persist anything without a namespace.
- ❌ Using `mode="inline"` for very complex fields if the row becomes crowded — prefer `popover` mode or `<sd-query-builder>`.

## Related
- `<sd-query-builder>` — nested AND/OR rule builder for advanced filters.
- `<sd-table>` — common consumer of the query via server `items()`.
- `<sd-operator>` — operator picker reused inside chips.
- `<sd-select>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>`, `<sd-input>` — value editors used by query fields.

## Accessibility

- **Chip popover** (`<sd-query-chip-popover>`): the header and body wrappers are `role="group"`. They exist only to stop clicks from closing the `mat-menu`, so they must not become tab stops — Tab goes straight to the operator picker and value editors. They now also stop Enter for the same reason; Escape and arrow keys still bubble so the menu closes / navigates normally.
- **Inline value chip** (`<sd-query-inline-value-chip>`): the pill shell is `role="group"` labelled with the field name. Its click-to-focus affordance is mirrored on Enter through the same handler, which already skips events originating from the inner `<input>` or from the remove `×` button.
