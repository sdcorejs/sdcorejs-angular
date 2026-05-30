# query-bar â€” compact popover + auto-apply + Search button placement

**Date:** 2026-05-27
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/`. Popover-mode UI redesign (A) plus a Search-button position/style tweak that affects both modes (B).

## Problem

1. The chip popover is tall: a header row (icon + field), then a separate **"Äiá»u kiá»‡n"** labelled row for the operator, then a separate **"GiÃ¡ trá»‹"** labelled row for the value, then an **"Ãp dá»¥ng"** footer button. Lots of vertical space and an explicit apply step.
2. The Search action button sits to the LEFT of the other toolbar actions and is filled primary â€” visually heavy and not at the far-right where a "run" affordance is expected.

## Goal

- **A.** Compact popover: operator moves onto the header row (right-aligned, vertically centered, no "Äiá»u kiá»‡n" label); drop the "GiÃ¡ trá»‹" label; remove the "Ãp dá»¥ng" button and auto-apply staged edits when the popover closes (commit only â€” the Search button still runs the query).
- **B.** Move the Search button to the far right (last toolbar action) and restyle it neutral (like Clear-all), not filled primary.

## A. Compact popover

### Header â€” single centered row

```
[fieldIcon] Field name â–¾ ......................... [operatorPicker]
```

- Left: the field icon + the existing field-name button (`c-pop-header-field`, opens `fieldSwitchPicker`). Unchanged.
- Right: the `sd-operator` operator picker, pushed right with `margin-left: auto`, shown only when `editingShowOperatorSelector()` is true (field exposes >1 operator). The **"Äiá»u kiá»‡n"** section label is removed.
- `.c-pop-header { display:flex; align-items:center; gap:8px; }` so icon / field / operator sit centered on one row.

### Body â€” value only, no labels

- Remove the **"Äiá»u kiá»‡n"** and **"GiÃ¡ trá»‹"** `c-pop-section-label` rows.
- Render only the per-kind value control (existing ladder), skipped entirely for no-data operators (`NULL` / `NOT_NULL`) â€” in that case the popover is just the header row.
- Add a placeholder so the control is self-explanatory (no label needed):
  - text / number / `sd-input` â†’ `placeholder="Nháº­p giÃ¡ trá»‹"`.
  - `values` / `lazy-values` `sd-select`, `date`, `datetime` â†’ `placeholder="Chá»n giÃ¡ trá»‹"`.
  - `BETWEEN` keeps the existing `"Tá»«"` / `"Äáº¿n"` placeholders.
  - `boolean` â†’ unchanged (two toggle buttons, self-evident).

### Footer â€” removed

- Delete the `c-pop-footer` block and its **"Ãp dá»¥ng"** `sd-button`.

### Auto-apply on close

- The chip popover trigger currently binds `(menuClosed)="cancelChipEdit()"` (discards staged edits). Change it to commit: on close, write the staged `editingOperator` + `editingValue` into the chip's filter (the existing `applyChipEdit` commit logic, minus the menu-close call), then clear `editingIndex`. **No emit** (the Search button is the sole query trigger â€” consistent with the deferred model). Keep `openChipPopover` on `(menuOpened)`.
- `applyChipEdit` is no longer invoked by a button; repurpose its commit body into the close handler (e.g. rename to `commitChipEditOnClose()` or keep `applyChipEdit` and call it from `menuClosed`). The closed chip then shows the committed value via `chipValueText` (chip face unchanged).

## B. Search button â€” far right, neutral style

- Move the `.c-search-trigger` button to be the **last** child of `.c-query-bar__actions` (after the Clear-all button), so it sits flush at the far-right end of the bar.
- Restyle it to match `.c-clear-all` (neutral / dark, bordered icon button) instead of filled primary: same density-responsive sizing, neutral `color: $qb-text-secondary`, subtle hover â€” drop the `color: $qb-primary`. Keep the `search` mat-icon and the `[disabled]="!canSearch()"` gating + tooltip.

## Out of scope

- Inline mode value editing (already shipped), operator vocabulary, `Filter` shape, `sd-operator`. Unchanged.
- The deferred-trigger emit model (Search-only) stays as-is; this spec only repositions/restyles the button.

## Testing (TDD)

- **Popover header:** when a chip with a multi-operator field is open, `sd-operator` renders inside `.c-pop-header`; no `.c-pop-section-label` with "Äiá»u kiá»‡n"/"GiÃ¡ trá»‹" exists in the popover.
- **No Ãp dá»¥ng:** the popover has no `c-pop-footer` / apply button (`chipAutoId('apply')` element absent).
- **Auto-apply on close:** opening a chip popover, changing the staged value, then closing the menu commits the new value into `filters` (operator + data) and does NOT emit `queryChange` / `apply`.
- **No-data operator:** with `NULL` selected, the popover body renders no value control.
- **Search button:** is the **last** child of `.c-query-bar__actions` (after Clear-all) â€” assert DOM order (e.g. the last `.c-query-bar__actions > button` is `.c-search-trigger`); still disabled when `!canSearch()` and fires `apply` on click. (Neutral vs primary is a CSS-only change, verified visually, not unit-tested.)

## Verification

- `npm run build` passes.
- Targeted karma run of the query-bar spec is green.

