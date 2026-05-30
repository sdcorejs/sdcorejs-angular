# query-bar â€” unified Search trigger + compact value editing

**Date:** 2026-05-27
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/`. Two changes: (A) a single deferred Search trigger for both modes, (B) compact value editing in inline mode.

## Problem

1. Inline value editing renders the full-size `sd-input` / `sd-select` directly inside the flat token, which looks cramped/ugly â€” especially for `values` / `date` controls that are taller than the 28px token.
2. The two modes apply differently: inline already defers to a Search button, but popover applies live per chip (`applyChipEdit` + live `queryChange`). There is no single, consistent "press Search to run the query" affordance, and the inline Search button sits awkwardly in the main filter region instead of with the action buttons.

## Goal

- **A.** One deferred trigger model for both modes: editing chips never runs the query; a single Search icon button (next to Clear-all) â€” or pressing Enter in the free-text search input â€” is the only thing that emits `apply` / `queryChange`.
- **B.** Compact inline value editing: text/number stay inline (sized to the token); `values` / `lazy-values` / `date` / `datetime` open a small popover holding the full control.

## A. Unified deferred Search trigger

### Behavior

- **No live emit.** Remove every `#emitQuery()` call from mutation methods (popover + inline): `addFilter`, `changeFilterField`, `updateFilter`, `removeFilter`, `clearAll`, `setLogic`, `setSearch`, and the inline build/edit methods. The `filters` / `logic` / `search` **models still update** (so `[(filters)]` two-way binding and chip rendering stay live), but neither `queryChange` nor `apply` fires mid-edit.
- **Single trigger.** `triggerApply()` is the only emitter. It emits `apply` **and** `queryChange` once (so consumers listening to either get the committed query). It is invoked from:
  - the new Search icon button,
  - `(keydown.enter)` on the free-text search input.
- **Popover commit.** The chip popover's "Ãp dá»¥ng" (`applyChipEdit`) commits the staged operator + value into `filters` and closes the popover, but **does not** emit `apply` / `queryChange` (the Search button does that). It keeps its `editingIndex`/staging cleanup.

### Search button

- Lives in `c-query-bar__actions`, **left of** the Clear-all button.
- Icon-only: `<mat-icon>search</mat-icon>` + `matTooltip="TÃ¬m kiáº¿m"`. Class `c-search-trigger`, styled like the other compact action icons (mirror `.c-clear-all`).
- **Enabled** when `filters().length > 0 || search().trim().length > 0`; otherwise `[disabled]="true"`.
- The `c-query-bar__actions` wrapper now renders **always** (the Search button is always present). Logic toggle / saved-views / Clear-all remain conditionally rendered inside it.
- Remove the inline-only `c-inline-search` `sd-button` (lines ~312-320) from the main region.

### Free-text search input

- `(keydown.enter)="triggerApply()"` added.
- `(ngModelChange)="setSearch($event)"` keeps updating the `search` signal but no longer emits (since `setSearch` drops its `#emitQuery`).

## B. Compact value editing (inline mode)

The reusable `#valueEditor` ng-template stays the dispatch point, but splits by kind:

- **text / number** â€” inline compact control sized to the token: `sd-input` / `sd-input-number` `size="sm"`, constrained width (e.g. `max-width: 140px`), no heavy frame. Used in both the building value step and editing-value. Commit: stash on `sdChange`, finalize on `keyupEnter` (existing draft pattern).
- **values / lazy-values / date / datetime** â€” clicking the value segment opens a small **mat-menu popover** anchored at the segment, containing the full-size `sd-select` (with `multiple` for IN/NOT_IN) / `sd-date` / `sd-datetime`. Selecting a value commits (draft â†’ finalize) and closes the popover. The token itself shows only the value text. During the **building** value step for these kinds, render the segment and auto-open the popover (reuse the `afterNextRender` open pattern, via a `MatMenuTrigger` viewChild or programmatic open).
- **boolean** â€” two compact inline toggle buttons (current behavior, just sized to the token).
- **BETWEEN** â€” out of scope (still deferred; a BETWEEN field in inline mode is not part of this change).

### Styling

- Add a `.c-token-value-edit` inline-control skin: shrink `sd-*` control height to ~26px, remove the default control border inside the token, auto width. Keep borders only inside the value popover panel, where the full control is shown.
- The value popover panel reuses the existing popover panel styling conventions (`c-chip-popover`-like) but minimal â€” just padding + the single control.

## Out of scope

- Operator vocabulary, `Filter` shape, `sd-operator`. Unchanged.
- BETWEEN inline editing. Still deferred.
- Saved-views button. Still a disabled placeholder.

## Testing (TDD)

- **Search trigger:**
  - Search button disabled when `filters` empty and `search` blank; enabled when either is non-empty.
  - Clicking Search emits `apply` once (and `queryChange` once); spy asserts call counts.
  - A popover edit (`applyChipEdit`) alone does NOT emit `apply` / `queryChange`.
  - A mutation (`addFilter` / `removeFilter` / `setLogic`) alone does NOT emit `queryChange`.
  - `keydown.enter` on the free-text search input triggers `triggerApply` (apply emitted).
- **Compact value UI (inline DOM):**
  - text field building value step renders an inline `sd-input` (no popover).
  - `values` field building value step renders the value popover (mat-menu) with an `sd-select`; selecting commits the chip.
  - clicking a completed `date` chip's value opens the value popover with `sd-date`.

## Verification

- `npm run build` passes.
- Targeted karma run of the query-bar spec is green.

