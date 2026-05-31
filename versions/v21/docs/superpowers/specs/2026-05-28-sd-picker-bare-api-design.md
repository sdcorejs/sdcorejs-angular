# Design — Bare picker API for sd-select / sd-date / sd-datetime

**Date:** 2026-05-28
**Status:** Approved (design)
**Scope:** `projects/sdcorejs-angular/forms/{select,date,datetime}` + `projects/sdcorejs-angular/components/query-bar`

## Problem

`sd-query-bar` inline mode edits `values` / `lazy-values` / `date` / `datetime`
filters through a bespoke popover (`valuePopover` mat-menu + `.c-valpop` option
list / `mat-calendar`). It looks inconsistent with the rest of the app and
duplicates option-loading logic the core form controls already own. We want the
chips to open the **native pickers** of `sd-select` / `sd-date` / `sd-datetime`
instead, and to expose those pickers as reusable API on the core components.

`string` / `number` chips already use the seamless `SdQueryInlineValueChip` and
are out of scope here.

## Goal

Expose each picker as a reusable, polished overlay that any host (starting with
`sd-query-bar`) can render compactly and open, replacing the bespoke panel.

## Chosen approach — `[bare]` render mode + public `open()`

Additive, default-off API on each control. No impact on existing consumers.

### Core component API (sd-select, sd-date, sd-datetime)

**`bare` input** — `input(false, { transform: booleanAttribute })`.
- `true` → strip the `mat-form-field` chrome (outline / label / helper / error /
  suffix clutter); render just the value text + caret, sized to fit inside a chip.
- Implemented as a `.sd-bare` host class that flattens the field via CSS
  (transparent background, no border/padding, hide the dropdown arrow where it
  duplicates the chip's own affordance). Picker/overlay markup unchanged.
- Default `false` → existing render is byte-for-byte unchanged.

**`open()` method** — public, opens the control's picker anchored to its own host
(which, inside a chip, anchors the panel to the chip):
- `sd-datetime` — already has `open()` (CDK overlay `flexibleConnectedTo(host)`); keep.
- `sd-date` — add `open()` → `datePicker()?.open()` (mat-datepicker, anchors to its input).
- `sd-select` — add `open()` → `selectRef()?.open()` (mat-select panel; already used by `focus()`).
- Native click on the bare control still opens the panel; `open()` exists so the
  host can auto-open when a chip is added or enters edit.

**Bonus:** `sd-select` already accepts an `SdSearch` function for `[items]` and
owns search / lazy / cache / multiple. Passing the lazy field's search through
lets `sd-query-bar` delete its own inline option machinery.

### sd-query-bar refactor (inline mode)

**Remove**
- `valuePopover` mat-menu + all `.c-value-popover*` / `.c-valpop*` styles.
- Value-popover methods: `openEditValuePopover`, `openBuildValuePopover`,
  `commitValuePopover`, `valuePopoverMulti`, `currentDraftValue`,
  `valuePopoverOptions`, `isOptionSelected`, `pickValueOption`,
  `toggleValueOption`, `commitValuePopoverDate`, `onValuePopoverClosed`,
  `#valueCtx`, `#valuePopoverSearch`, `#activeValueTrigger`.
- Inline-only option machinery: `#optionsCache`, `optionsFor`, `#loadedOptionKeys`,
  `#ensureOptions`, `#setOptions`, the constructor preload effect.
  (Popover-mode `editingOptions` / `#loadValuesOptions` / `#loadLazyOptions` stay.)

**Add / change** — inline value renderer for `values` / `lazy-values` / `date` / `datetime`:
- Chip layout becomes `label + <bare sd-*> + ×`. The `c-token-value-trigger`
  button is replaced by the bare control.
  - `values` / `lazy-values` → `<sd-select bare [items] [valueField] [displayField]
    [multiple]="isMulti(op)" [model]="data" (sdChange)="updateFilter(i,{data})">`.
  - `date` → `<sd-date bare [model] (sdChange)>`, `datetime` → `<sd-datetime bare [model] (sdChange)>`.
- **Lazy adapter**: build an `SdSearch` function from `field.option.search` / `views`
  and pass it as `sd-select [items]`, so `sd-select` owns search / lazy / cache.
- Build chip value step uses the same bare controls; auto-opens via
  `afterNextRender(() => ctrl.open())`; commits on `sdChange` (empty → `cancelBuild`).
- `usesValuePopover` is repurposed to "render bare control" (vs seamless
  string/number, vs boolean buttons).

`string` / `number` (seamless `SdQueryInlineValueChip`) and `boolean` (sd-button
toggle) inline paths are untouched.

## Component boundaries

- **Core controls** own their picker overlay + behavior; `bare` only changes the
  trigger's visual footprint, never the picker. `open()` is a thin, well-defined
  entry point.
- **sd-query-bar** composes the bare controls; it no longer owns any option
  list / search / overlay logic for the inline path.

## Testing

**Core (per component)**
- `bare=true` renders the flat trigger (`.sd-bare` present, no mat-form-field
  outline); `bare=false` (default) renders unchanged.
- `open()` opens the panel — `sd-select` `selectRef().panelOpen` true; `sd-date`
  `datePicker().opened` true; `sd-datetime` `pickerOpened()` true.

**sd-query-bar**
- Remove / rewrite specs referencing `.c-valpop`, `valuePopover`,
  `c-token-value-trigger`, `openEditValuePopover`, `valuePopoverOptions`, etc.
- New: inline completed chip for `values` / `date` / `datetime` renders the bare
  `sd-select` / `sd-date` / `sd-datetime`; build step renders the bare control;
  `sdChange` updates `filters`. Lazy `SdSearch` adapter unit-tested.
- Keep popover-mode (chipPopover) specs untouched.

## Risk

- `bare` + `open()` are additive (default off) → zero impact on existing
  sd-select / sd-date / sd-datetime consumers. Bare CSS scoped to `.sd-bare`.
- Lazy adapter must map `SdSearch` (`{ type, searchText, value }`) ↔
  `field.option.search` (`{ search, size }`) / `views(values)`; covered by a unit test.
- AOT strict-template must pass for the new bare bindings.

## Rollout order

1. Core: `bare` + `open()` + tests on sd-select, sd-date, sd-datetime.
2. sd-query-bar inline refactor (remove bespoke panel, render bare controls, lazy adapter).
3. Gates: build `query-bar` entry ✓, full sd-angular suite green ✓, demo verify.

## Out of scope

- Truly detached standalone `Sd*Picker` overlay components (would require
  rebuilding the mat-select panel) — revisit only if an external host needs a
  picker without rendering the control.
- Popover-mode chip editor (chipPopover) — unchanged.
- `string` / `number` seamless chip and `boolean` toggle — unchanged.
