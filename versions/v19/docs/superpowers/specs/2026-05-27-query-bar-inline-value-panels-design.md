# query-bar inline mode — direct value panels (no nested dropdown)

**Date:** 2026-05-27
**Status:** Approved (design)
**Branch:** query-bar
**Scope:** `projects/sdcorejs-angular/components/query-bar/` — **inline mode value popover only**. Popover mode (chip popover) is unchanged.

## Problem

Inline value editing routes `values` / `lazy-values` / `date` / `datetime` to a small popover (mat-menu) that contains a *collapsed* `sd-select` / `sd-date`. The user must click the trigger to open the popover, then click the inner control to open ITS dropdown/calendar — a double-open that looks and feels clumsy. Text/number already edit inline and are fine.

## Goal

When the inline value popover opens, show the **selection panel directly** — no nested dropdown:

- **values / lazy-values** → a direct option list (click to pick for single; checkboxes for multi IN/NOT_IN), with a client-side search box.
- **date** → a `mat-calendar` shown directly.
- **input / number / boolean** → unchanged (edit inline in the token).
- **datetime** → keeps the existing `sd-datetime` control in the popover (documented exception — an inline datetime+time panel is out of scope this round).

## Current state to build on

- The inline value popover already exists: a shared `#valuePopover` mat-menu with `matMenuContent let-field="field"`, opened from `.c-token-value-trigger` for popover-kinds (`usesValuePopover(kind)`).
- Commit plumbing exists: `#valueCtx` (`{ mode: 'build' | 'edit', index, field }`), `openEditValuePopover` / `openBuildValuePopover` (set ctx), `commitValuePopover(value)` (routes to `commitBuildValue` / `commitEditValue`, clears ctx), `valuePopoverMulti()`, plus draft signals (`#editDraft`, `building().value`) and `optionsFor(key)`.

## Design

### A. Option list panel (values / lazy-values)

Replace the `sd-select` in the popover with a direct list rendered from `optionsFor(field.key)`:

- A search `<input>` at the top filters the options client-side by their `displayField` (case-insensitive substring). Held in a `#valuePopoverSearch = signal('')`; a `valuePopoverOptions()` computed returns `optionsFor(field.key)` filtered by the search term.
- Each option is a row showing its `displayField` text and a selected indicator:
  - **single** (operator not IN/NOT_IN): clicking a row commits that option's `valueField` value via `commitValuePopover(value)` and closes the popover (programmatic close via a `MatMenuTrigger` viewChild on the open trigger).
  - **multi** (`valuePopoverMulti()` true): each row is a checkbox/toggle. Clicking toggles the option's value in/out of a working array (seeded from the current draft); it updates the draft (`setBuildDraftFn()` / `setEditDraftFn()` depending on `#valueCtx.mode`) but does NOT close. The popover's `(closed)` event commits the accumulated draft via `commitValuePopover(draft)`.
- A helper `isOptionSelected(field, opt)` drives the row's selected styling/checkbox state by comparing the option's value against the current draft (scalar for single, array membership for multi).

### B. Calendar panel (date)

- Render `<mat-calendar>` (from `@angular/material/datepicker`, already a dependency via `sd-date`) directly in the popover for `date`.
- `(selectedChange)="commitValuePopover($event)"` then close the popover. Seed `[selected]` from the current draft/value so the open calendar highlights the current date.

### C. Commit-on-close wiring

- Add `(closed)="onValuePopoverClosed()"` to the `#valuePopover` mat-menu. `onValuePopoverClosed()` commits the current draft for the **multi** case (where rows only update the draft), then clears `#valueCtx` / search. Single-select and date commit eagerly on the click/selectedChange and close, so the close handler is a no-op once ctx is already cleared (guard on `#valueCtx()` non-null + multi).
- Programmatic close: a `valuePopoverTrigger` (`MatMenuTrigger`) viewChild on whichever trigger opened the popover; single-select row click and calendar select call `valuePopoverTrigger()?.closeMenu()` after committing. (Because custom rows are not `mat-menu-item`, the menu does not auto-close on click.)

### D. Styling

- `.c-value-popover-body`: keep compact padding; constrain the option list to a scrollable max-height (e.g. `max-height: 240px; overflow:auto`).
- Option rows: full-width clickable rows, hover highlight, selected state (checkmark or checkbox), `align-items:center`. Search input: small, full width, sticky at top.
- `mat-calendar`: constrain width to fit the popover (Material default ~296px is fine).

## Out of scope

- Popover-mode (chip popover) value controls — unchanged (still `sd-select` / `sd-date`).
- `datetime` direct panel (keeps `sd-datetime`).
- input / number / boolean inline editing — unchanged.
- Operator vocabulary, `Filter` shape, `sd-operator`.

## Testing (TDD)

- `valuePopoverOptions()` filters `optionsFor` by the search term (case-insensitive) and returns all when blank.
- `isOptionSelected` is true for the current scalar value (single) and for each array member (multi), false otherwise.
- **Single select:** invoking the row-pick handler commits the option's value to the chip (build → new chip; edit → data changed) and clears ctx.
- **Multi select:** toggling options updates the draft without committing; `onValuePopoverClosed()` commits the accumulated array.
- **Date:** the calendar `selectedChange` handler commits the picked date.
- **DOM:** opening the value popover for a `values` field renders the option list + search input (not an `sd-select`); for a `date` field renders a `mat-calendar` (not an `sd-date`).

## Verification

- `npm run build` passes.
- Targeted karma run of the query-bar spec is green.
