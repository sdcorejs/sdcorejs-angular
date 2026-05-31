# query-bar inline chip â€” viewed-mode default + edit on click + hide internal clear Ã—

**Date:** 2026-05-28
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/src/` â€” completed-chip rendering for `values` / `lazy-values` / `date` / `datetime` in inline mode. No edits to `sd-select` / `sd-date` / `sd-datetime` core.

## Problem

The just-shipped inline chip for `values` / `lazy-values` / `date` / `datetime` always renders the bare picker in edit mode. Two visual problems:

1. The bare picker shows an empty trigger (no selected value text) â€” `mat-select`/`mat-form-field` collapse to a narrow box that doesn't surface the chosen option's label.
2. The picker exposes an internal **clear** button (`.sd-suffix-icon`) right next to the chip's own remove `Ã—`, creating two close affordances per chip.

The chip should DISPLAY the selected value by default and only switch into an editor when the user clicks it.

## Goal

- Completed chip for `values` / `lazy-values` / `date` / `datetime` renders the picker with `[viewed]="true"` by default â†’ uses the picker's existing `<sd-view>` read-only display (clean text, no form-field shell, no clear icon).
- Clicking the chip's value area enters edit mode (`editingValueIndex === i`) â†’ renders the picker editable; existing auto-open keeps the user one click from changing the value.
- Edit exits automatically:
  - **Single** (single `sd-select` / `sd-date` / `sd-datetime`): on `(sdChange)` â†’ `updateFilter` + clear `#editingValueIndex`.
  - **Multi** (IN / NOT_IN `sd-select`): on `(focusout)` of the chip's value wrapper â†’ clear `#editingValueIndex` (per-change commits are already live via `editValueFn`).
- The internal `.sd-suffix-icon` clear `Ã—` is hidden inside `.c-token` for all picker kinds.

## Why `viewed` works

Each form control already has a `viewed` input and renders `<sd-view ...>` when `viewed=true` (`forms/select/src/select.component.html:12`, `forms/date/src/...:12`, `forms/datetime/src/...:13`). `sd-view` is a small text-display component that surfaces the resolved display label (or formatted date) â€” exactly what the chip wants for the "closed" state.

## A. Template changes (`query-bar.component.html`)

In the completed-chip's value-edit fallthrough (around lines 281-285 â€” the catch-all `@else` after the boolean branch and BEFORE the new BETWEEN-date/datetime branch from Task 3), replace the single `*ngTemplateOutlet="valueEditor"` with a per-kind split:

- `boolean`: unchanged.
- `values` / `lazy-values`: render `<sd-select [bare] [viewed]="!isEditingValue(i)" â€¦>` directly (NOT via the shared `#valueEditor` template, because the shared template is also used by the build-step and doesn't take a `viewed` input there).
- `date`: render `<sd-date [bare] [viewed]="!isEditingValue(i)" â€¦>` directly.
- `datetime`: render `<sd-datetime [bare] [viewed]="!isEditingValue(i)" â€¦>` directly.
- `string` / `number` / other â†’ continue to use the shared `valueEditor` outlet (no change â€” those chips are the seamless `inline-value-chip`, not the token branch).

Wrap each picker in `<span class="c-token-value c-token-value-edit" (click)="beginEditValue(i)" (focusout)="onChipValueFocusOut(i, $event)">â€¦</span>` so:

- Clicking the wrapper (when the picker is in `viewed` mode it's a static text â†’ click enters edit).
- `focusout` is the multi-select exit trigger (single/date/datetime exit eagerly via `sdChange` â€” see below).

For single kinds (`!isMultiOperator(_op)`), bind `(sdChange)="onChipSingleCommit(i, $event)"`. For multi (`isMultiOperator(_op)`), bind `(sdChange)="editValueFn(i)($event)"` (existing live-commit) â€” exit happens via `focusout`.

## B. TS changes (`query-bar.component.ts`)

Add two small helpers:

```ts
/** Single-value commit from a completed chip in edit mode â€” write data + exit edit. */
onChipSingleCommit(i: number, v: unknown): void {
  this.updateFilter(i, { data: v } as Partial<Filter>);
  this.#editingValueIndex.set(null);
}

/** Multi-value chip exits edit on real focusout (not when focus moves to a child of the chip). */
onChipValueFocusOut(i: number, ev: FocusEvent): void {
  const next = ev.relatedTarget as Node | null;
  const wrapper = ev.currentTarget as HTMLElement;
  // why: focusout fires on every internal blur (option click, search input, â€¦) â€” only
  // exit when focus actually left the chip's value wrapper subtree.
  if (next && wrapper.contains(next)) return;
  if (this.#editingValueIndex() === i) this.#editingValueIndex.set(null);
}
```

(`beginEditValue(i)` already exists; no change.)

## C. SCSS â€” hide internal clear icon (`query-bar.component.scss`)

Inside the existing `.c-token ::ng-deep` block added in the alignment task, append:

```scss
  // why: sd-select / sd-date render a `.sd-suffix-icon` (mat cancel) for clearing the
  // value. Inside a filter chip the chip's own Ã— handles removal â€” the inner icon is
  // a duplicate affordance and visually misaligned with the chip baseline.
  .sd-suffix-icon { display: none; }
```

## D. Tests (TDD)

Append to `query-bar.component.spec.ts`:

- **viewed default for values:** mount inline mode with a values field + a completed filter whose data matches an option; assert `<sd-select>` under `.c-token` has a `viewed` attribute set (or has the `<sd-view>` element rendered, not a `<mat-form-field>`).
- **viewed default for date:** completed `date` filter renders `<sd-date>` with the `<sd-view>` text path active.
- **Click value â†’ edit mode:** click the chip's `.c-token-value-edit` wrapper; assert `component.editingValueIndex() === i` and the picker is no longer `viewed`.
- **Single commit exits edit:** call `onChipSingleCommit(0, 'b')` â†’ `filters()[0].data === 'b'` AND `editingValueIndex()` is `null`.
- **focusout outside wrapper exits edit:** with `editingValueIndex` set, dispatch a `FocusEvent` with `relatedTarget` outside the wrapper â†’ `editingValueIndex()` clears. With `relatedTarget` inside (option click) â†’ stays.
- **Clear icon hidden:** assert no `.c-token .sd-suffix-icon` element appears in the DOM after the picker renders (a structural query; the display:none rule is the cause, but the absence is also fine if MDC drops the node â€” either passes if not present in queryable form).

## Out of scope

- Modifying `sd-select` / `sd-date` / `sd-datetime` source (no DI changes to `viewed` semantics).
- `boolean` chips (they already render their two toggle buttons; no viewed mode needed).
- Popover mode (uses different controls).
- Seamless string/number chips (the `inline-value-chip` IS the value; no separate view).

## Verification

- `npm run build` passes.
- Targeted karma run of the query-bar spec is green.
- Visual smoke: a `values` chip shows the selected option's label as plain text; a `date` chip shows the formatted date; clicking either swaps to an editable picker; selecting commits and returns to viewed; no clear `Ã—` visible inside the chip.

