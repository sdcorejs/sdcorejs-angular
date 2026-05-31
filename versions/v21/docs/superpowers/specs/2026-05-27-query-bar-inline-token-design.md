# query-bar inline mode — GitLab-style token builder

**Date:** 2026-05-27
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/` — **inline mode only**. Popover mode is unchanged.

## Problem

The current inline mode renders every editor (field button, operator picker, value control) live and simultaneously for each filter, each wrapped in its own bordered control (`c-inline-filter` / `c-inline-field` / `c-inline-operator` / `c-inline-value` + the control-skin in `query-bar.controls.scss`). The result is visually noisy — every sub-part is "đóng khung" (boxed), which looks cluttered.

## Goal

Rework inline mode into a GitLab filtered-search-style **progressive token builder**:

- A completed filter is a single flat chip (no per-segment borders): `fieldLabel · operatorIcon · valueText · ×`.
- Adding a filter builds the chip step by step: pick field → (pick operator if the field exposes more than one) → enter/pick value → chip completes.
- Clicking a completed chip edits **only its value** inline (operator + field are locked; to change the operator the user deletes the chip and recreates it).
- The query is emitted only when the user presses **Search** — building/editing/removing chips does not fire `queryChange`.

## Current data model (unchanged contracts)

- `filters = model<Filter[]>([])` — two-way; the list of chips.
- `logic = model<SdQueryLogic>('AND')`, `search = model<string>('')`.
- `queryChange = output<SdQuery>()` — currently emitted on every mutation via `#emitQuery()`.
- `apply = output<SdQuery>()` — emitted on Search via `triggerApply()` → `#buildQuery()`.
- `mode = input<'popover' | 'inline'>('popover')`.

`#buildQuery()` returns `{ filters, logic, search? }`.

## Design

### Chip states (inline mode)

A filter chip is rendered in one of three states:

1. **complete** — flat token: `fieldLabel` (text) · `operatorIcon` (via `sd-operator`'s icon, read-only) · `valueText` · remove `×`.
   - `valueText` is produced by the existing `chipValueText(filter)` helper (already handles single, multi `"A +N"`, and BETWEEN `"from — to"`). Reuse it; adjust the separator to `→` for BETWEEN if desired.
2. **building** — the single in-progress chip shown at the end of the bar, held in a new signal `#building` (NOT pushed into `filters` until complete, so the `filters` model never contains a half-built filter):
   - sub-step `operator`: render `fieldLabel` + auto-open the `sd-operator` menu. If the field exposes exactly one operator, skip this sub-step: set the operator to the field default and go straight to `value` (the operator icon still shows).
   - sub-step `value`: render `fieldLabel · operatorIcon` + the inline value editor for the field kind, auto-focused. Committing the value (Enter for text/number, selection for select/date/boolean) pushes a complete `Filter` into `filters` and clears `#building`.
   - no-data operators (`NULL` / `NOT_NULL`): completing the operator step finishes the chip immediately (no value sub-step).
3. **editing-value** — clicking a complete chip sets `#editingValueIndex = i`; that chip's value segment becomes the inline editor for the field kind. Committing (Enter / blur / selection) writes the new data back via `updateFilter(i, { data })`. Operator and field are not editable in this state.

Only one of `#building` / `#editingValueIndex` is active at a time; starting one cancels the other.

### New state (signals)

```ts
interface BuildingChip {
  field: SdQueryField;
  operator?: Operator;          // undefined until operator step done
  step: 'operator' | 'value';
}
readonly #building = signal<BuildingChip | null>(null);
readonly #editingValueIndex = signal<number | null>(null);
```

Expose read accessors for the template (`building()`, `editingValueIndex()`), plus per-chip helpers (`isEditingValue(i)`).

### Methods (inline mode)

- `beginBuild(field)` — entry from the field picker. Compute allowed operators. If `> 1` → `#building = { field, step: 'operator' }` and auto-open the operator menu next render. Else set `operator = sdQueryDefaultOperator(field)`; if it is a no-data operator, finish immediately (push complete chip); otherwise `#building = { field, operator, step: 'value' }` and focus the value editor.
- `pickBuildOperator(op)` — set `#building.operator = op`. If no-data operator → finish (push complete chip, clear `#building`). Else `step = 'value'`, focus value editor.
- `commitBuildValue(value)` — build the `Filter` (`{ field, operator, data }`, reshaping data for multi/between like `setFilterOperator` does), push into `filters`, clear `#building`. **No `#emitQuery`.**
- `cancelBuild()` — clear `#building` (e.g. Escape / blur with empty value / picking nothing).
- `beginEditValue(i)` — set `#editingValueIndex = i`, clear `#building`, focus that chip's value editor.
- `commitEditValue(i, value)` — `updateFilterNoEmit(i, { data: value })`, clear `#editingValueIndex`. **No `#emitQuery`.**
- `removeFilter(i)` — splice from `filters`. **In inline mode, do NOT `#emitQuery`** (only Search emits). (Popover mode keeps its current emitting `removeFilter`; gate on `mode()` or add an inline variant.)
- Search button → `triggerApply()` (unchanged) — the only place inline mode emits.

`updateFilterNoEmit` is `updateFilter` without the trailing `#emitQuery()` call. Refactor `updateFilter` to take an optional `emit = true` flag, or add a sibling; inline callers pass `emit = false`.

### Value editors per kind (build + edit reuse the same markup)

- `string` → `sd-input` (Enter commits).
- `number` → `sd-input-number` (Enter commits).
- `date` / `datetime` → `sd-date` / `sd-datetime` (selection commits).
- `boolean` → two `sd-button` toggles.
- `values` / `lazy-values` → `sd-select` (`multiple` when operator is IN/NOT_IN); selection commits.
- `BETWEEN` → two range inputs (`sd-date` / `sd-datetime` / `sd-input-number` by kind).

In **complete** state these render as plain text (`chipValueText`); the editor markup appears only while that chip is `building` (value step) or `editing-value`.

### Emit semantics

Inline mode mutations (`beginBuild`, `pickBuildOperator`, `commitBuildValue`, `commitEditValue`, inline `removeFilter`) update the `filters` model so chips render, but **do not** call `#emitQuery()`. The `queryChange` output therefore does not fire during inline editing. `apply` fires only from the Search button. Popover mode is unchanged (still emits live).

### Markup / styling

- Replace the `c-inline-filter` block (currently renders all editors live, each boxed) with a state-driven render:
  - completed chips (`@for` over `filters`, excluding nothing — `#building` is separate),
  - the in-progress `#building` chip (if any) at the end,
  - the "Thêm filter" button + Search button.
- The completed chip is a flat token: one rounded container, inline `fieldLabel`, the operator icon, the value text, and a `×`. No border on individual segments.
- The control-skin borders apply only to the active inline editor (building value step / editing-value), not to completed chips.
- Keep the `OR`/`AND` connector rendering between chips.

### Out of scope

- Popover mode (default) — untouched.
- Operator vocabulary, `Filter` shape, `sd-operator` component — untouched.
- Changing field of a completed chip inline (the design intentionally requires delete + recreate).

## Testing (TDD)

Karma/Jasmine, component spec. Cover:

- **Build flow:** `beginBuild` with a multi-operator field → `#building.step === 'operator'`; picking operator → `step === 'value'`; committing value → chip pushed to `filters`, `#building` cleared.
- **Single-operator field:** `beginBuild` skips the operator step → `step === 'value'`, operator = default.
- **No-data operator:** picking NULL/NOT_NULL finishes the chip immediately (no value step), chip in `filters`.
- **Edit value:** `beginEditValue(i)` sets `#editingValueIndex`; `commitEditValue(i, v)` updates only `data` (operator/field unchanged), clears editing index.
- **Remove:** `removeFilter(i)` drops the chip.
- **Emit gating:** build/edit/remove do NOT emit `queryChange`; pressing Search emits `apply` once with the current filters. (Spy on both outputs.)
- **Multi/range display:** completed chip value text shows `"A +N"` for IN and `"from → to"` for BETWEEN.
- **DOM:** completed chip renders flat (field text + operator icon + value text + remove); the building chip renders the correct editor for its step.

## Verification

- `npm run build` (lib typecheck) passes.
- Targeted karma run of the query-bar spec is green.
