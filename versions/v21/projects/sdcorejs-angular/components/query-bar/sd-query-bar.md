# `<sd-query-bar>`

**Type**: Component
**Selector**: `sd-query-bar`
**Import path**: `@sdcorejs/angular/components/query-bar`
**Class**: `SdQueryBar`
**Standalone**: yes
**Change detection**: `OnPush`

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

- **`'popover'`** (default) — compact chips. Click a chip → opens the chip popover (`<sd-query-chip-popover>`, a dialog panel) for operator + value. Staged edits commit when the popover closes (no per-chip "Apply" button). The **+** button opens the field picker. One global Search action.
- **`'inline'`** — GitLab-style token builder. Each filter's operator + value controls render directly on the bar. Edits write `filters` live; one Search button (or Enter in the search input) fires `(apply)`. Conditions are added from the **Add condition** box at the end of the chips instead of a **+** button (see [Add condition](#add-condition-inline-mode)).

`canSearch()` gates the Search action — true when there's at least one filter OR a non-blank search string, and no `required` field is empty.

### When edits apply (`option.applyOn`)

| `applyOn` | Fires `(apply)` | Search button |
|---|---|---|
| `'search'` (default) | Search button, Enter in the search box, a saved filter. Chip edits stay a draft. | shown |
| `'commit'` | Also: a popover that closes with a changed operator or value, an inline chip commit that changes it, a completed inline build chip with a value, removing a chip that had a value. A popover that closes unchanged, or removing an empty chip, does not apply. | hidden |

With `'commit'`, an added (unpinned) chip whose popover closes empty is dropped; it applies only when the chip had a value before. A chip change applies the search text applied last: the text still being typed is applied by Enter, like the quick search of sd-table. Enter in the search box applies, also with an unchanged term, unless a `required` field is empty (like the disabled Search button).

## Models

Reuses `Filter` and `Operator` from `@sdcorejs/utils/models`. No new operator vocabulary.

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
| `lazy-values` | `option.search: SdSearch<K>` (unified `{type:'SEARCH'\|'VALUE', searchText?, value?}`), `valueField`, `displayField`, optional `views(values)` |

Knobs shared by every type, for a host that owns the chip list (for example `sd-table` in `filter.mode: 'query-bar'`):

| Field option | Effect |
|---|---|
| `pinned` | The chip is always on the bar: no remove button, `removeFilter` does nothing, left out of the field picker, never dropped when it closes empty. An empty pinned chip reads `core.component.query-bar.all`. When `filters` has no chip for the field, the bar adds an empty one (default operator), first and in `fields` order, without emitting `(apply)`. `clearAll()` keeps pinned chips and empties them. |
| `required` | Implies `pinned` (everything above applies). An empty chip gets the error look, `aria-invalid="true"` and `aria-describedby` = `option.invalidHintId`; it reads `core.component.query-bar.placeholder.select-value`. `canSearch()` is false while `invalidFields()` is not empty. The bar renders no message itself — the host does. Once it has a value, the value cannot be emptied, and `clearAll()` keeps it — see [Required fields](#required-fields). Chips carry `aria-required="true"`. |
| `group` | Field-picker heading. Groups keep the order in which they first appear; a single group shows no heading. |
| `disabled` | The chip is read-only: no popover, no remove button, `aria-disabled="true"`. In inline mode it renders as that read-only chip too, instead of an editable inline chip. |

The field picker is a listbox panel (rows 40px, 14px text). In popover mode it gets a find box (`sd-search-field` sm, a combobox, `core.component.query-bar.find-field`, "Tìm kiếm") when it lists ten fields or more; in inline mode the **Add condition** box outside the panel plays that role. Both match labels ignoring case and Vietnamese accents (`don` finds "Mã đơn" and "Đơn vị"). Keyboard: ↑ ↓ Home End over the enabled options, Enter picks; with the find box, focus stays in it and the arrows move `aria-activedescendant`. No typeahead. Fields already on the bar are `aria-disabled` with a check.

**Chip text.** `date` / `datetime` values show as `dd/MM/yyyy` / `dd/MM/yyyy HH:mm` through `SdDateTimeService`, never the model string. A `BETWEEN` range inside one year shortens to `01/10 – 31/10/2026`; a range with one end shows `core.component.query-bar.range.from` / `.range.to` (`Từ 01/10/2026`). A `BETWEEN` with both ends empty counts as empty (`isFilterActive()` is false).

**Labels of restored values.** A `lazy-values` chip whose value is not among loaded options asks `option.views(values)` when the field has it, else `option.search({ type: 'VALUE', value })` — once per value, same shape as `sd-select`. A `values` field whose `items` is a function loads it once. Until the answer arrives, or when it fails, the chip shows the raw value.

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
- `sdQueryAllowedOperators(field)` — resolves the tri-state to an `Operator[]`; a `required` field never offers `NULL` / `NOT_NULL`
- `sdQueryDefaultOperator(field)` — picks the initial operator
- `sdQueryShowOperatorSelector(field)` — true when the field exposes >1 operator

Operator labels + icons live in the `@sdcorejs/utils` `OPERATORS` table (`BETWEEN` included). They are NOT redefined in this component.

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
| `showSavedFilters` | `boolean` | `false` | Render the saved-filters button and panel. Disabled unless `savedFiltersKey` is set. |
| `savedFiltersKey` | `string \| undefined` | `undefined` | Namespace for `localStorage` persistence (`sd-query-bar:savedFilters:<key>`). |
| `showLogicToggle` | `boolean` | `false` | Render AND/OR segmented toggle (only when ≥2 filters). |
| `showClearAll` | `boolean` | `true` | Show the clear-all button when ≥1 filter. Its label counts the chips **with a value** that clear would empty — required chips keep their value, so they do not count ("Xóa tất cả (N)"); with none, or with `clearDisabled`, it reads "Xóa tất cả". With the built-in `clearAll()` the button is disabled while that count is 0. |
| `showOperatorOnChip` | `boolean \| 'auto'` | `false` | Render the operator icon on the chip face (else hidden — operator only visible in popover). `'auto'`: only on chips whose field offers more than one operator, or whose operator is not `SD_QUERY_DEFAULT_OPERATOR_BY_TYPE[type]`. |

All `boolean` inputs go through `booleanAttribute` (bare attribute = true). All other inputs accept `null | undefined` and transform to the canonical shape.

Options without a split input (set them in `[option]`):

| Option | Type | Default | Notes |
|---|---|---|---|
| `applyOn` | `'search' \| 'commit'` | `'search'` | See [When edits apply](#when-edits-apply-optionapplyon). |
| `appearance` | `'default' \| 'flush'` | `'default'` | `'flush'` drops the bar's border, radius, shadow and background (padding `8px 12px`) to sit inside a host card. |
| `onClearAll` | `() => void` | `undefined` | Replaces the built-in `clearAll()` on the clear button. The host should keep required values like `clearAll()` does (`sd-table` does). |
| `clearDisabled` | `boolean` | `false` | Disables the clear button. |
| `searchPlaceholder` | `string` | i18n | Overrides `core.component.query-bar.search-placeholder`, and is the `aria-label` of the search input (else `core.component.query-bar.search`). |
| `invalidHintId` | `string` | `undefined` | Id set as `aria-describedby` on empty required chips. |

Content projection: `<ng-content select="[sdQueryBarEnd]">` renders after the action toolbar, inside the bar.

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
- One horizontal filter bar with optional free-text search input (`sd-search-field`) on the left and actions on the right.
- Popover mode renders compact chips; chip click opens the chip popover for operator/value. All three panels (field picker, chip popover, saved filters) share the frame of the `sd-button` Action Popover.
- Inline mode renders GitLab-style tokens where operator/value controls sit directly in the chip row, followed by the borderless **Add condition** box.
- Active chips show field label, value summary, optional operator glyph (read-only, with its name as tooltip), and a remove `×`.
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
| `removeFilter(index)` | Drop chip at index. No-op for a pinned or required chip. With `applyOn: 'commit'`, applies when the chip had a value. |
| `clearAll()` | Required chips stay as they are (operator and value), pinned chips stay with no value, the rest go. |
| `openField(key, returnFocusTo?)` | Open the editor of a field from outside the bar (e.g. a table header icon). Popover mode opens the chip's popover, adding the chip first; called again while that popover is open, it closes it. Inline mode focuses the chip or starts building one. `returnFocusTo` gets focus when the popover closes. |
| `invalidFields()` | Signal — required fields without a value. |
| `onInlineCommit(index, data)` / `onInlineRange(index, range)` | Template handlers of completed inline chips: `updateFilterData` / `setFilterRange` plus the `applyOn: 'commit'` check. |
| `setLogic(value)` | Toggle AND ↔ OR. |
| `setSearch(value)` | Update free-text search. |
| `triggerApply()` | Emit `(queryChange)` + `(apply)` with the current composite query. |
| `onApplyFilter(saved)` | Install a `SdSavedFilter` (filters + logic + search) + trigger apply. Entries of fields the bar no longer has, or of disabled fields, are dropped; a required or pinned field keeps its current chip unless the saved filter has a value for it. |
| `canSaveFilter()` | Signal — "Save current filter" is enabled: a chip has a value (required chips included) or the search box has text. |
| `isLocked(field)` | Helper — the field is `pinned` or `required`, so its chip is always on the bar. |
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
| `ɵSdQueryPanelDirective` / `ɵSdQueryPanelTriggerDirective` / `ɵSdQueryPanelGroup` | `components/panel/query-panel.ts` | Internal CDK Overlay frame of the three panels — see [Panels](#panels). |
| `<sd-query-saved-filters-menu>` | `saved-filters-menu.component.*` | Saved-filters button + menu panel + `localStorage` persistence (`saved-filters-storage.ts`: reader, `Date` reviver). |
| `<sd-query-field-picker>` | `field-picker.component.*` | "Add filter" listbox panel (`[usedKeys]` render disabled with a check). Popover mode: optional find box; inline mode: driven by the Add condition box (`setQuery`, `move`, `pickActive`). |
| `<sd-query-actions-bar>` | `actions-bar.component.*` | Right-pinned toolbar — divider, AND/OR toggle, clear-all, saved-filters button (its panel holds "Lưu bộ lọc hiện tại"), Search trigger. |
| `<sd-query-popover-chip>` | `popover-chip.component.*` | Popover-mode chip face — `div[role=button]` host + nested `<sd-operator>` (button-in-button is invalid HTML) + × remove. Triggers the `[panel]` of `<sd-query-chip-popover>`. |
| `<sd-query-chip-popover>` | `chip-popover.component.*` | Popover-mode editor (a dialog panel). Owns operator + value staging signals, async option loading, range mutators, multi toggle. Emits `(commit)` whenever the panel closes → parent splices. `seed(filter, field, index)` reseeds before each open, before the panel renders. |
| `<sd-query-inline-value-chip>` | `inline-value-chip.component.*` | Seamless string / number chip — the pill IS the input. Numbers are grouped with the thousands separator of `I18nService.locale()` (vi `25.000.000`, en `25,000,000`) and parsed back with the same separator, BETWEEN dual input, Enter commits / Esc reverts. Used by both completed and build chips. |
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
| Field picker | `field-picker.component.*` |
| A panel opens in the wrong place, closes too early or loses focus | `components/panel/query-panel.ts` |

## Inline chip rendering rules

- **Multi sd-select (`IN` / `NOT_IN`):** the chip projects a `<ng-template #sdValue>` so the viewed display renders `"<first label> +<N-1>"` instead of the comma-joined default. Same pattern in build chip + completed chip + chip popover.
- **`BETWEEN` (date / datetime):** uses one `<sd-date-range [viewed]="'inline'">` for both the build chip and the completed-chip edit. The `datetime` type downgrades to date precision (no time picker on the range panel) — committed `{from, to}` carries date values only.
- **`values` / `lazy-values` — `sd-select [viewed]="'inline'"` (self-managed):** the completed chip delegates the entire edit lifecycle to `sd-select`'s inline mode — the `<sd-view>` text is the visible face, the real picker is mounted invisibly underneath to host the panel, click the text opens the panel (min 200px), and the text only changes when a value is committed. The chip no longer wires `enterEdit` / `onFocusOut` / `#editing` for this branch. (See `sd-select`'s tri-state `viewed`.)
- **All non-string/number branches delegate to `[viewed]="'inline'"`:** `values` / `lazy-values` (sd-select), `date` (sd-date), `datetime` (sd-datetime), and BETWEEN (sd-date-range) all render with `[viewed]="'inline'" [clearable]="false"` — the control owns click-to-edit + the panel; the chip no longer wires `enterEdit` / `onFocusOut` / `#editing`. Only the **boolean** branch keeps the chip-managed `#editing` toggle (boolean has no `viewed`-aware control). The **build chip** uses the same `[viewed]="'inline'"` pickers and auto-opens the panel via the parent's `openPicker()` when the value step renders. (The old `[bare]` input on those controls has been removed.)
- **No inline clear-× in chip pickers:** the chip pickers never render their own `.sd-clear-btn` — `sd-select` inline-active is bare (gated on `bare() || inlineEditing()`); `sd-date` / `sd-datetime` / `sd-date-range` are gated on `!bare()`. The chip already owns removal via `.c-token-remove`; a second × next to the trigger was easy to hit while dismissing the panel and would clear the value (commit empty `data`), making the chip look like it "lost its display on close without change".
- **Operator on chip:** only rendered when `[showOperatorOnChip]=true`; else a `:` separator sits between label and value. Finished chips (inline, inline-value, popover chips and the value step of the build chip) render `<sd-operator size="xs" readonly>`: a 14px glyph in the chip colour, named after the operator (`role="img"`, `aria-label`, tooltip), not a disabled button. The operator step of the build chip is the interactive `size="xs"` glyph with a 24px hit area; the popover header uses the `size="sm"` chip. Icons and labels come from `OPERATORS`; the chips no longer restyle `.c-op-*` with `::ng-deep`.
- **Inline build flow — date / datetime skip operator step:** when `beginBuild(field)` runs for a `date` / `datetime` field whose default operator (BETWEEN) is in `allowedOperators`, the operator step is skipped and the build chip lands on the value step with BETWEEN pre-selected. Reasoning: BETWEEN is overwhelmingly the common case for date filters; skipping one click matters. Other types keep the operator step when `allowed.length > 1`.
- **Chip popover value controls** carry `hideInlineError` so the value editor stays compact (no reserved error-subscript row under each input).

## Panels

The field picker (listbox), the chip popover (dialog) and saved filters (menu) open in a CDK Overlay with the frame of the `sd-button` Action Popover (`assets/scss/core/_popover-panel.scss`: border, 8px radius, shadow, 40px rows with 14px text, 12px headings). No Material menu is involved.

- **Position:** below the trigger, 4px away, start-aligned (saved filters end-aligned); flips above when there is no room; follows scrolling. Widths: field picker 200–260px, chip popover 280–320px, saved filters 220–320px. Panels are at most 360px high (less on a short screen); the chip popover then scrolls its body and keeps its header.
- **Open:** click, Enter or Space on the trigger (`aria-haspopup`, `aria-expanded`, `aria-controls`). From the keyboard a list lands on its find box or first option and a form on its first value control; from the mouse a list without a find box keeps focus on the panel.
- **Close:** Escape, a click outside, Tab out of the panel (a list on any Tab, a form past its first / last control), picking an item, `closeMenu()`. Focus returns to the trigger, or to `returnFocusTo` of `openField()`; a click outside on another focusable element keeps focus there. The chip popover commits its value on every one of these. Escape is left to a control whose own popup (sd-select panel, date picker, sd-operator menu) is open above the panel; a click or focus inside such a popup does not close the panel.
- **One at a time:** opening a panel closes the other panel of the same bar.

## Saved filters (`[savedFiltersKey]` + `[showSavedFilters]`)

When both are set, the toolbar shows the saved-filters button (`bookmark_border`, `aria-haspopup="menu"`) before Search. Its panel holds:

- A heading (`saved-filters.heading`), one row per `SdSavedFilter` stored in `localStorage` under `sd-query-bar:savedFilters:<key>` — an **apply** button (`filter_alt` + name, `role="menuitem"`) and, beside it, a **delete** button (`delete`, `aria-label` = `saved-filters.delete` with `{name}`) — a divider, and **"Lưu bộ lọc hiện tại"** (`bookmark_add`).
- The delete button is hidden until its row is hovered or has focus, always shown (40px) on a coarse pointer.
- **Keyboard:** ↑ ↓ Home End move over the apply buttons and "Lưu bộ lọc hiện tại"; → or Tab reach the delete button of the row, ← or Shift+Tab come back; Delete on an apply button deletes. After a delete, focus moves to the next row, else to "Lưu bộ lọc hiện tại".
- **Apply** closes the panel and calls `onApplyFilter(saved)`.
- **Delete** asks nothing: the list is written at once and an `info` toast (`saved-filters.deleted`, the name, action `saved-filters.undo`) offers Undo, which puts the filter back at its old index (clamped to the current length).
- **Save** is disabled while no chip has a value (required chips count) and the search box is empty (`canSaveFilter()`). **Naming a saved filter uses `SdConfirmService.withInput`**, not `window.prompt`: `promptSave()` is `async` and resolves after the dialog settles (it returns without saving when the dialog is cancelled or the name is blank). The bar does not change after a save.
- **States:** empty (`saved-filters.empty`); unreadable storage — broken JSON or not an array — shows `saved-filters.read-error` with an `error` icon, and saving replaces the broken list; entries without `id`, `name` or `query` are dropped one by one. A failing write (quota, blocked storage) on save, delete or Undo puts the previous list back and shows an `error` toast (`saved-filters.write-error`), never the exception text.
- Dates come back as `Date`: strings in `Date#toJSON` form are revived when the list is read.

Without a key the button stays disabled. `<sd-query-saved-filters-menu>` owns persistence — the host only reacts to `(applyFilter)`.

## Required fields

A `required` field is always on the bar (it implies `pinned`), and once its chip has a value, the value cannot be emptied:

- Its operators never include `NULL` / `NOT_NULL`.
- A single-value select is `required` and not clearable; picking the selected item again does not clear it.
- A multi-value select keeps its previous values when a change would empty it, and shows `required-min-one` (`aria-live="polite"`) under the control in the popover, beside the chip in inline mode. It is referenced by the `aria-describedby` of the popover body or of the inline chip — `sd-select` takes no `aria-describedby` of its own.
- Text, number, date, datetime and `BETWEEN` values that are cleared get their previous value back when the popover closes or the inline chip loses focus (`BETWEEN` needs one end).
- With `applyOn: 'commit'`, a required chip is never dropped.
- `clearAll()` keeps the chip as it is; `onApplyFilter()` keeps it unless the saved filter has a value for it.
- The only empty state is the first one, when there is no default: the chip is invalid and Search / Enter are blocked.

The bar enforces this in its mutators too (`onInlineCommit`, `onInlineRange`, `commitBuildValue`), so a host calling them directly cannot empty a required chip.

## Search box

With `showSearch`, the search box is `sd-search-field` — size `xs` (28px) at `density: 'compact'`, `sm` (32px) at `'comfortable'` — at least 220px wide. The input is named by `option.searchPlaceholder`, else `core.component.query-bar.search`; it has `enterkeyhint="search"` and `autocomplete="off"`. Enter applies (`applySearch()`, blocked while a required field is empty). The clear button (`search-clear`) and Escape with text empty the box and apply once; Escape on an empty box does nothing.

## Add condition (inline mode)

In inline mode the last item of the chip row is a borderless **Add condition** box (`add-condition`, `role="combobox"`) that drives the field picker listbox (`aria-expanded`, `aria-controls`, `aria-activedescendant`); focus stays in the box.

- **Opens** on a click in the box, a click on the empty part of the chip row, typing, ↓ or Alt+↓ — not when the box only receives focus from Tab.
- **Typing** filters the list (accents ignored) and points at the first enabled match; ↑ ↓ move; Enter picks it (`beginBuild(field)`) and empties the box.
- **Enter** on an empty box with the list closed applies, like Search (blocked while a required field is empty).
- **Escape** closes the list and empties the box; focus stays.
- **Backspace** on an empty box moves focus to the last chip; a second Backspace (or Delete) removes it — never a required or pinned chip.
- When a chip is finished (value committed, build cancelled), focus returns to the box and the list stays closed.
- With nothing left to add the box is disabled; its tooltip keeps the "+" label.

Popover mode keeps the **+** button, which opens the field picker with its own find box.

## E2E (`data-autoid`)

With an `autoId` (`<A>`):

| Element | `data-autoid` |
| --- | --- |
| Search input / clear button | `<A>-search` / `<A>-search-clear` |
| Add condition box (inline) | `<A>-add-condition` |
| Panels | `<A>-panel-field-picker`, `<A>-panel-chip`, `<A>-panel-saved-filters` |
| Saved-filters button | `<A>-saved-filters` |
| Apply / delete of saved filter `<i>` | `<A>-saved-filter-<i>` / `<A>-saved-filter-<i>-delete` |
| "Lưu bộ lọc hiện tại" | `<A>-saved-filters-save` |
| Chip controls | `<A>-chip<i>-<role>` (popover), `<A>-inline<i>-value` (inline) |

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

`SdQuery.filters` is already the canonical `Filter[]` payload. Do not try to stuff it into `sd-table`'s `filter.externalFilters`; that config describes built-in toolbar controls, not query-bar chip state. To filter a table with a query bar over its own quick search, external and column filters, use `sd-table`'s `filter.mode: 'query-bar'` (see `sd-table.md`) instead of wiring a separate bar.

## Dependencies

Internal: `@sdcorejs/angular/components/{operator, button}`, `@sdcorejs/angular/forms/{input, input-number, select, date, datetime, date-range}`, `@sdcorejs/angular/i18n`.
External: `@sdcorejs/utils` `1.2.4` (`OPERATORS` table + `BETWEEN` icon).

## Tests

Each sub-component has its own spec (`<name>.component.spec.ts`) covering its public surface and the rendering branches it owns. Run the whole group with:

```
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/query-bar/**/*.spec.ts'
```

## Known limitations / next iterations

- Operator picker dropdown doesn't support keyboard arrow navigation yet (planned).
- The field picker's find box appears from ten fields only (popover mode).
- Saved filters live in this browser only (`localStorage`); there is no loading state, sharing, renaming or "active filter" marker.
- No `Esc` shortcut to cancel an in-progress build chip (planned).
- `(values | lazy-values).option.items` async-function variant is loaded once per popover open — no caching across opens. Acceptable for the current usage; revisit if a heavy endpoint hurts UX. (Chip labels are resolved separately, once — see "Labels of restored values".)

## Time zone — backend contract

`ISdCoreConfiguration.timeZone` changes only what the chips **show** (date chips use the read-only text of `sd-date-range`, which follows the zone). The emitted `SdQuery` is unchanged: date values stay zone-less (`'yyyy/MM/dd'`), and `TODAY` / relative-date tokens are sent as tokens. The backend must resolve them in the **same zone** the app configures. See [`SdDateTimeService`](../../services/date-time/sd-date-time.md).

## Anti-patterns
- ❌ Using query-bar for a single simple filter — one form control is lighter.
- ❌ Passing `SdQuery.filters` into `sd-table.filter.externalFilters` — those are different contracts. For a table's own filters use `filter.mode: 'query-bar'`.
- ❌ Recreating `fields` inline in the template — keep field config stable so chips/pickers do not churn.
- ❌ Enabling saved filters without `savedFiltersKey` — the UI cannot persist anything without a namespace.
- ❌ Using `mode="inline"` for very complex fields if the row becomes crowded — prefer `popover` mode or `<sd-query-builder>`.

## Related
- `<sd-query-builder>` — nested AND/OR rule builder for advanced filters.
- `<sd-table>` — common consumer of the query via server `items()`.
- `<sd-operator>` — operator picker reused inside chips.
- `<sd-select>`, `<sd-date>`, `<sd-date-range>`, `<sd-datetime>`, `<sd-input>` — value editors used by query fields.

## Accessibility

- **Panels:** field picker `role="listbox"` named by what opens it (`add-filter` in popover mode, `add-condition` inline; options `role="option"`, used fields `aria-disabled="true"`, the active option through `aria-activedescendant` of the find box or the Add condition box); chip popover `role="dialog"` named by the field label (`aria-labelledby`); saved filters `role="menu"` whose apply, delete and save buttons are all `menuitem` (a menu owns menu items only), the delete button beside its apply button, not nested in it; the arrow keys skip the delete buttons. Triggers carry `aria-haspopup`, `aria-expanded` and, while open, `aria-controls`.
- **Chip popover** (`<sd-query-chip-popover>`): the header and body wrappers are `role="group"` and are not tab stops — Tab goes straight to the operator picker and value editors.
- **Required chips** carry `aria-required="true"`; the `required-min-one` line is `aria-live="polite"` and referenced by `aria-describedby`.
- **Inline value chip** (`<sd-query-inline-value-chip>`): the pill shell is `role="group"` labelled with the field name. Its click-to-focus affordance is mirrored on Enter through the same handler, which already skips events originating from the inner `<input>` or from the remove `×` button.
- **Required chips** carry `aria-invalid="true"` while empty and point `aria-describedby` at `option.invalidHintId`, so the host's explanation is read with the chip.
- **`openField(key, returnFocusTo)`** returns focus to `returnFocusTo` when the popover closes — the chip it opened may be dropped on close (`applyOn: 'commit'`), and the user started from the host control.
- **Clear button** is icon-only; its `aria-label` and tooltip carry the same text.

## i18n

Every string the bar renders itself resolves through `I18nService`. The bar and its children expose the labels
as `computed()` signals (not the `sdTranslate` pipe) because the pipe is pure and would not refresh on a runtime
`setLanguage()`:

| What                                        | Key                                             | Owner                     |
| ------------------------------------------- | ----------------------------------------------- | ------------------------- |
| Free-text search placeholder                | `core.component.query-bar.search-placeholder`   | `searchPlaceholder()`     |
| Add-filter tooltip, no fields configured    | `core.component.query-bar.no-fields`            | `noFieldsLabel()`         |
| Add-filter tooltip, normal state            | `core.component.query-bar.add-filter`           | `addFilterLabel()`        |
| Clear-all tooltip + `aria-label` (interpolates `{count}`) | `core.component.query-bar.clear-all` | `clearAllLabel()` (actions bar) |
| Clear-all label with no count (disabled, or nothing has a value) | `core.component.query-bar.clear` | `clearAllLabel()` (actions bar) |
| Empty pinned chip                           | `core.component.query-bar.all`                  | `allLabel()` |
| Empty required chip                         | `core.component.query-bar.placeholder.select-value` | `selectValueLabel()` |
| Open-ended range on a chip (`{value}`)      | `core.component.query-bar.range.from` / `.range.to` | `chipValueText()` |
| Field-picker find box                       | `core.component.query-bar.find-field`           | field picker `findLabel()` |
| Required hint rendered by a host (`{label}`) | `core.component.query-bar.required`            | host (e.g. `sd-table`) |
| Search trigger tooltip                      | `core.component.query-bar.search`               | `searchLabel()` (actions bar)   |
| AND/OR group `aria-label`                   | `core.component.query-bar.logic-operator`       | `logicGroupLabel()` (actions bar) |
| Boolean chip value, default true / false    | `core.component.query-bar.boolean.true` / `.false` | `chipValueText()`, plus the build chip and inline chip toggle buttons (same keys, so one field never shows two languages) |
| Seamless value placeholder (number / text)  | `core.component.query-bar.placeholder.value` / `.text` | inline value chip `ph()` |
| BETWEEN from / to placeholders              | `core.component.query-bar.placeholder.from-number` / `.to-number` / `.from-text` / `.to-text` | inline value chip `phFrom()` / `phTo()`; popover editor `fromPlaceholder()` / `toPlaceholder()` |
| Popover: value placeholders (select / text)  | `core.component.query-bar.placeholder.select-value` / `.enter-value` | chip popover `selectValuePlaceholder()` / `enterValuePlaceholder()` |
| Popover: lazy-values loading text           | `core.component.query-bar.loading-values`       | chip popover `loadingValuesLabel()` |
| Field picker empty state                    | `core.component.query-bar.field-empty`          | field picker `emptyLabel()` |
| Saved filters: tooltip / disabled tooltip   | `core.component.query-bar.saved-filters.tooltip` / `.tooltip-disabled` | saved-filters menu |
| Saved filters: delete (`{name}`) / empty / save | `core.component.query-bar.saved-filters.delete` / `.empty` / `.save` | saved-filters menu |
| Saved filters: heading                      | `core.component.query-bar.saved-filters.heading` | saved-filters menu |
| Saved filters: delete toast title / Undo    | `core.component.query-bar.saved-filters.deleted` / `.undo` | saved-filters menu `remove()` |
| Saved filters: read / write error           | `core.component.query-bar.saved-filters.read-error` / `.write-error` | saved-filters menu |
| Saved filters: name prompt label            | `core.component.query-bar.saved-filters.name-label` | saved-filters menu `promptSave()` |
| Search input `aria-label` (no `searchPlaceholder`) | `core.component.query-bar.search`         | `searchLabel()`           |
| Search clear button                         | `core.component.query-bar.search-clear`         | `searchClearLabel()`      |
| Add condition box (inline)                  | `core.component.query-bar.add-condition`        | `addConditionLabel()`     |
| Required multi-value hint                   | `core.component.query-bar.required-min-one`     | chip popover / inline chip `minOneLabel()` |

`SdQueryField.trueLabel` / `falseLabel` still override the boolean defaults when a field supplies them.
