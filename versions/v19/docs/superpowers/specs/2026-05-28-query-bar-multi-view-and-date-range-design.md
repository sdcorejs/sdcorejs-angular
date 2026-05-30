�# query-bar � multi "head +N" view + sd-date-range for BETWEEN

**Date:** 2026-05-28
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/forms/date-range/` (add `[bare]` + `[viewed]` + `open()`) and `projects/sdcorejs-angular/components/query-bar/src/` (chip sd-select `#sdValue` template + replace dual pickers with sd-date-range). NO changes to sd-select / sd-date / sd-datetime core. Update related `*.md` docs.

## Problem

Two UX gaps in the inline chip:

1. **sd-select multi view too wide.** When IN/NOT_IN selects multiple values, the chip's viewed-mode text renders ALL selected display labels comma-joined (default sd-view). For 2+ values the chip stretches and overlaps neighbors. The popover-mode chip already uses a tidier "head +N" pattern (`chipValueText`); inline should match.
2. **BETWEEN renders two pickers.** date / datetime BETWEEN currently shows 2 bare pickers (Từ + Đến) plus a dash. The library already ships `sd-date-range` (single range component with one open panel + two-end model). Switching to it simplifies the chip + matches the date-range pattern used elsewhere.

## Goal

- **A.** Chip sd-select multi view shows the first selected item's `displayField` + ` +N` (N = remaining count) � single line, ellipsizable. 1 selected �  just the label. 0 �  empty.
- **B.** BETWEEN on `date` AND `datetime` renders a single `<sd-date-range bare>` in chip (build + edit). `[model]="{from,to}"` two-way; `(sdChange)` emits `{from,to}` once user commits. Datetime BETWEEN downgrades to date-only precision (user-accepted simplification).

## A. sd-select multi "head +N" view

### Mechanism

`sd-select` already exposes `sdValueTemplate = contentChild<TemplateRef<any>>('sdValue')` and forwards it to `<sd-view [valueTemplate]>`. Consumers project a `<ng-template #sdValue let-value="value" let-selectedItems="selectedItems">` inside the `<sd-select>` to override the viewed display.

### Template

Inside every chip `<sd-select>` that may run multi (completed-chip line ~312, build-chip line ~386, shared `#valueEditor` lines 228/231), nest:

```html
<sd-select [bare] ... [multiple]="op === 'IN' || op === 'NOT_IN'" ...>
  <ng-template #sdValue let-selectedItems="selectedItems">
    @if ((selectedItems?.length ?? 0) > 1) {
      {{ $any(selectedItems[0])[displayFieldKey] }} +{{ selectedItems.length - 1 }}
    } @else if ((selectedItems?.length ?? 0) === 1) {
      {{ $any(selectedItems[0])[displayFieldKey] }}
    }
  </ng-template>
</sd-select>
```

`displayFieldKey` is the field's `option.displayField` (e.g. `'name'`). It's already available as `_opt.displayField` in the chip's template scope.

### Out

- Popover-mode sd-select still renders its default display (unchanged) � it uses `chipValueText` on the closed chip.
- Single-select chip already shows one label correctly via default sd-view; template still handles `length === 1` for consistency.

## B. sd-date-range bare + viewed + open() + chip integration

### B.1 Add `bare` / `viewed` / `open()` to sd-date-range

Mirror the pattern from `sd-date` / `sd-datetime` (already shipped, well-tested):

- TS: new inputs
  ```ts
  bare = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });
  ```
- `@Component({ host: { '[class.sd-bare]': 'bare()', '[class.sd-viewed]': 'viewed()' } })`.
- Template: `@if (viewed()) { <sd-view [value]=... [display]="formatted()" /> } @else { <existing form-field> }`. `formatted()` returns a `"dd/MM/yyyy �  dd/MM/yyyy"` string (or empty).
- SCSS: replicate the `:host(.sd-bare)` block (same MDC bóc-khung rules) and `:host(.sd-viewed) { padding-top: 0 }`. Reuse the documented WHY comments from sd-date so the rationale is consistent.
- Public `open = () => ⬦` calling the internal `MatDateRangePicker`'s open via a `viewChild` (`MatDateRangePicker` exposes `.open()`).

### B.2 Replace dual pickers in chip

In `query-bar.component.html`, the BETWEEN date / BETWEEN datetime branches (both build chip and completed-chip edit) collapse to:

```html
<sd-date-range bare size="sm"
  [autoId]="..."
  [viewed]="!isEditingValue(i)"    <!-- chip edit case; build always editable -->
  [model]="$any(_data)"
  (sdChange)="setFilterRangeBoth(i, $event)"></sd-date-range>
```

For build chip:

```html
<sd-date-range #bPicker bare size="sm"
  [autoId]="'qb-build-value'"
  [model]="$any(_b.value)"
  (sdChange)="commitBuildValue($event)"></sd-date-range>
```

(no `[viewed]` � build is always editable. `#bPicker` keeps the auto-open viewChild target.)

For chip edit (completed BETWEEN chip), replace `setFilterRangeFrom` + `setFilterRangeTo` pair with a single `setFilterRange(i, ev)` that writes the full `{from,to}` via `updateFilter`:

```ts
setFilterRange(i: number, ev: { from: unknown; to: unknown } | null): void {
  this.updateFilter(i, { data: ev ?? { from: null, to: null } } as Partial<Filter>);
}
```

(Existing `setFilterRangeFrom` / `setFilterRangeTo` and `setBuildRangeFrom` / `setBuildRangeTo` become unused once dual pickers go � remove after grep confirms zero references.)

### Datetime downgrade

Datetime BETWEEN uses the same `sd-date-range` (no time precision). The committed `{from,to}` values are dates; the consuming API should accept date strings or interpret as start/end-of-day. Documented as a deliberate simplification.

## Docs to update

After implementation, refresh:

- `projects/sdcorejs-angular/forms/date-range/sd-date-range.md` � document the new `bare`, `viewed` inputs + the public `open()` method, when each is used.
- `projects/sdcorejs-angular/components/query-bar/sd-query-bar.md` (or `HANDOFF.md` if that's the kept doc) � note the chip multi "head +N" rendering rule and the BETWEEN-via-sd-date-range pattern (including the datetime downgrade).
- `CLAUDE.md` (root vn-angular) � refresh the "Recent work" / open follow-ups bullet for query-bar with this iteration's bullet.

## Testing (TDD)

- **Multi view:** mount a chip with `kind: 'values'`, operator `IN`, data `['a','b','c']`. Assert `.c-token sd-select` text content matches the displayField label of `a` + ` +2`. Edge: data length 1 �  just label, no `+0`. Empty array �  empty text.
- **Single chip unaffected:** EQUAL operator with one value still shows that value's label normally (no `+`).
- **sd-date-range bare:** mount `<sd-date-range bare>` �  host has `.sd-bare` class; the form-field strips outline (assert `.mdc-notched-outline` invisible via display:none or absence).
- **sd-date-range viewed:** mount with viewed=true �  renders `<sd-view>` (no form-field).
- **sd-date-range open():** calling `component.open()` invokes the internal `MatDateRangePicker.open()` (spy).
- **Chip BETWEEN date:** completed chip with `BETWEEN` + `{from,to}` �  renders ONE `<sd-date-range>` (not two `<sd-date>`).
- **Chip BETWEEN datetime:** same as date �  ONE `<sd-date-range>` (datetime downgraded).
- **Range commit:** `setFilterRange(i, {from:'A', to:'B'})` writes the chip's data to `{from:'A',to:'B'}`.

## Out of scope

- Modifying `sd-select` / `sd-date` / `sd-datetime` source.
- Popover mode (its BETWEEN uses 2 controls inside a panel � leave as-is).
- A datetime-range variant with time precision (defer; date-only is acceptable per user).

## Verification

- `npm run build` passes.
- Targeted Karma run of `query-bar` + `forms/date-range` specs is green.

