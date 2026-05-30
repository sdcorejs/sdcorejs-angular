�# query-bar inline � alignment + BETWEEN dual + selected display fixes

**Date:** 2026-05-28
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/src/` ONLY � chip-level CSS + `::ng-deep` overrides + a small inline-build BETWEEN dual-render branch. NO changes to `sd-select` / `sd-date` / `sd-datetime` core.

## Problem

The home-machine refactor (bare-picker mode + extracted `sd-query-inline-value-chip`) introduced visual regressions in inline mode:

1. `sd-select [bare]` does not display the currently selected value inside the chip.
2. `sd-date [bare]` after a selection: the rendered date is vertically misaligned in the chip.
3. `sd-datetime [bare]` after a selection: same vertical misalignment.
4. `BETWEEN` operator (now available in `OPERATORS` via `@sdcorejs/utils@1.1.2`) renders only a single bare picker for `date` / `datetime` instead of two (Từ / Đến).
5. **CRITICAL:** inside the `.c-token` chip, the title, operator icon, value (text or editor), and � button are not on the same baseline / not vertically centered consistently. The "seamless" chip (string/number) is the visual reference � every other chip variant should match it.

## Goal

- Every inline chip variant (seamless string/number, token with select/date/datetime/boolean) sits on a single 28px (compact) / 32px (comfortable) row with all children (icon, label, operator, value editor, �) vertically centered on the same baseline.
- Bare pickers display the selected value clearly (primary color, ellipsized at a sensible width).
- `BETWEEN` on `date` / `datetime` fields renders two bare pickers (Từ / Đến) with a `�` separator, mirroring the seamless string/number BETWEEN pattern. (BETWEEN on `values` / `lazy-values` stays N/A.)
- Fix is chip-scoped (`::ng-deep` from query-bar SCSS), not in the shared form controls.

## A. Chip alignment (critical)

In `query-bar.component.scss`, add `::ng-deep` overrides scoped under `.c-token` (and mirrored under `.c-seamless` where applicable). Target the MDC internals that push baseline:

- `.mat-mdc-form-field-infix { padding: 0; min-height: 0; }`
- `.mat-mdc-text-field-wrapper, .mat-mdc-form-field-flex { padding: 0; min-height: 0; }`
- `.mat-mdc-select-value, .mat-mdc-input-element { line-height: 1; font-size: 13px; color: inherit; padding: 0; height: auto; }`
- `input { line-height: 1; height: auto; padding: 0; }` (native input inside `sd-input-number` / `sd-date` text field)
- Ensure no child exceeds the chip's 28px / 32px row height; the existing `.c-token { display: inline-flex; align-items: center; height: 28|32px; }` then keeps every segment centered.

Reuse the same overrides under `.c-seamless` if the seamless chip's bare-picker baseline is also affected (none currently � its inputs are plain `<input>`). Place rules adjacent to the existing chip styles.

## B. sd-select bare displays the selected value

In the same `::ng-deep` block under `.c-token`:

- `.mat-mdc-select-value { display: inline-flex; align-items: center; min-width: 0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; color: $qb-primary; font-weight: 500; }`

The `min-width: 0` lets it shrink within the flex chip; the explicit color + weight matches `.c-token-value` (primary on faint primary bg).

If the value still does not appear, the bug is options-not-loaded (lazy-values) � `lazyItemsFor(field)` memoizes the search results; ensure the chip's `[items]` is fed the resolved array (not a function) so the select can resolve the selected value's display label. This is verified by reading `lazyItemsFor` in `query-bar.component.ts` during implementation.

## C. BETWEEN dual for date / datetime

Two code sites in `query-bar.component.html`:

### C.1 Inline build value step (in the `.c-token-building` branch)

Where `_b.field.kind === 'date'` or `'datetime'`, gate on `_b.operator === 'BETWEEN'`:

```html
@if (_b.operator === 'BETWEEN') {
  <sd-date bare size="sm" #bPicker placeholder="Từ"
    [model]="$any(_b.value)?.from" (sdChange)="setBuildRangeFrom($event)"></sd-date>
  <span class="c-token-dash" aria-hidden="true">�</span>
  <sd-date bare size="sm" placeholder="Đến"
    [model]="$any(_b.value)?.to" (sdChange)="setBuildRangeTo($event)"></sd-date>
} @else {
  <sd-date bare size="sm" #bPicker [model]="_b.value" (sdChange)="commitBuildValue($event)"></sd-date>
}
```

(Mirror the same `@if BETWEEN { 2� <sd-datetime bare> }` branch for `datetime`.)

`#bPicker` stays on the FIRST (Từ) picker so `buildPicker()?.open()` auto-opens it.

### C.2 Inline edit value editor (in the completed-chip `.c-token` branch)

Where the user clicks a completed BETWEEN chip's value to edit, render the same dual pattern bound to the filter's current `data.from` / `data.to`, with `(sdChange)` wired to `setFilterRangeFrom(i, $event)` / `setFilterRangeTo(i, $event)` (already exist in TS for popover mode).

### C.3 TS helpers

Add to `query-bar.component.ts`:

```ts
/** Update the `from` end of the build chip's BETWEEN range without committing. */
setBuildRangeFrom(v: unknown): void {
  const b = this.#building();
  if (!b) return;
  const cur = (b.value && typeof b.value === 'object') ? (b.value as any) : {};
  this.#building.set({ ...b, value: { ...cur, from: v } });
}

/** Update the `to` end of the build chip's BETWEEN range. Commit if both ends are set. */
setBuildRangeTo(v: unknown): void {
  const b = this.#building();
  if (!b) return;
  const cur = (b.value && typeof b.value === 'object') ? (b.value as any) : {};
  const next = { ...cur, to: v };
  this.#building.set({ ...b, value: next });
  // why: 'to' is conventionally the last input � once both ends are filled, commit so the
  // chip completes without the user having to blur or press an extra apply.
  if (next.from != null && next.to != null) this.commitBuildValue(next);
}
```

BETWEEN on `values` / `lazy-values` is explicitly out of scope (not in `SD_QUERY_OPERATORS_BY_KIND` for `values`).

## D. Testing (TDD)

Karma + Jasmine, query-bar spec.

- **Alignment (smoke):** mount a chip with `kind: 'values'`, opened build value step �  `.c-token` has `.c-token-value-edit sd-select.sd-bare`; assert the `.mat-mdc-select-value` element exists with a non-empty `textContent` when a value is bound. (Real pixel alignment is verified visually; the test guards the structural contract.)
- **BETWEEN date:** build a date field at `BETWEEN` step �  exactly two `<sd-date>` elements with placeholders `"Từ"` and `"Đến"`; the first carries the `#bPicker` template ref (or check it via the auto-open viewChild).
- **BETWEEN datetime:** same shape with two `<sd-datetime>`.
- **`setBuildRangeFrom` / `setBuildRangeTo`:** unit-test the helpers � `setBuildRangeFrom('2024-01-01')` sets `building().value.from`; setting both then triggers commit and `building()` becomes `null` with the filter committed as `{from, to}`.
- **No regression:** existing inline build tests (text/number, single-value commit) still pass; the build picker auto-open still fires for non-BETWEEN single pickers.

## Out of scope

- Modifying `sd-select` / `sd-date` / `sd-datetime` source.
- Popover mode (uses existing controls; unaffected).
- BETWEEN on `values` / `lazy-values` fields.
- Operator vocabulary; `Filter` shape.

## Verification

- `npm run build` passes.
- Targeted karma run of the query-bar spec is green.
- Visual smoke: a chip mix (text, values, date, date BETWEEN) all sit on the same row, value text legible, BETWEEN shows both Từ and Đến.

