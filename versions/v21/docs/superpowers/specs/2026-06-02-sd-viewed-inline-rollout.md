# Design — `viewed='inline'` rollout + remove `bare` + input variant + showcase

**Date:** 2026-06-02
**Status:** Draft (design) — pending review
**Scope:** `forms/{date,datetime,date-range,autocomplete,input,input-number}`, `components/query-bar/{inline-chip,build-chip}`, remove `bare` from `forms/{select,date,datetime,date-range}`, `projects/showcase`. Builds on the sd-select pilot (`2026-06-02-sd-viewed-inline-edit-mode.md`).

## Problem

The pilot shipped tri-state `viewed` (`false | true | 'inline'`) on **sd-select** only. The rest of the form controls still expose the old boolean `viewed` + a separate `bare` input. `bare` now overlaps confusingly with `viewed='inline'` (inline already implies bare-on-activate). We want: one inline-edit model across the common controls, `bare` removed, and a showcase that demonstrates it.

## Goals

1. Add `viewed='inline'` to **date, datetime, date-range, autocomplete** (panel-based — reuse the pilot pattern).
2. Add `viewed='inline'` to **input, input-number** (NO panel — a different, simpler variant).
3. Migrate **query-bar** chips off `bare` (`inline-chip` remaining branches + `build-chip`).
4. **Remove the `bare` input** from `select, date, datetime, date-range` (the only controls that have it).
5. Expand the **showcase** with a dedicated inline-edit catalog.

## Approach

### A. Panel-based controls (date / datetime / date-range / autocomplete)

Identical to the sd-select pilot:
- `viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform })`.
- `const v = sdViewedInline(this.viewed, () => this.open())` → expose `isInline` / `isViewed` / `enterInlineEdit`.
- Template: `@if (isViewed())` static `<sd-view>` · `@else` → `@if (isInline())` text-face `<span.sd-inline-view>` (click → `enterInlineEdit()`, hover clear-× gated by `clearable() && hasValue && !required && !disabled`) **plus** the editor always rendered with `.sd-inline-editor` (absolute, `opacity:0`, `pointer-events:none` incl. descendants).
- Host: `.sd-bare = isInline()` (after `bare` removed), `.sd-viewed = isViewed() || isInline()`.
- Panel min-width floors at 200px in inline (where the control supports a panel width).
- `clearable` input (default `true`) gates the inline clear-×.
- SCSS: shared `.sd-inline-view` / `.sd-inline-editor` / `.sd-inline-clear` rules (lift the sd-select block into each, or a shared partial).
- Unify `sdViewDef` → `viewTemplate = computed(sdViewDef()?.templateRef ?? sdValueTemplate())`, fed into `<sd-view>` `valueTemplate`; drop the old `.sd-view` focus-swap. (autocomplete/date/datetime have `sdViewDef`; date-range may not — skip where absent.)
- Each control already has an `open()` / picker-open method (`sd-date.open`, `sd-datetime.open`, `sd-date-range.onOpenPicker`, autocomplete panel open) — wire `enterInlineEdit` to it.

### B. Input-based controls (input / input-number) — transparent borderless variant

No panel → no hidden-editor overlay. The input value IS the face:
- `viewed='inline'` → render the REAL `<input>` always, styled `.sd-inline-input`: transparent background, no border, sized like text; keep ALL attributes (type / pattern / maxlength / validators / formatting).
- Hover → light background (affordance); focus → subtle border/background ring (signals editing).
- input-number keeps format-on-blur / raw-on-focus (already implemented) — the borderless input shows the formatted value at rest.
- `viewed=true` → static `<sd-view>` (unchanged). `viewed=false` → normal field (unchanged).
- `clearable` hover clear-× at the end (same pattern) when value present + not required/disabled.
- Reuse `sdViewedInline` for `isInline`/`isViewed`; `enterInlineEdit` for inputs = focus the input (no panel). (May not even need `enterInlineEdit` since the input is directly focusable — clicking it focuses natively. Keep for API symmetry / programmatic focus.)

### C. query-bar migration

- **inline-chip**: migrate the `date` / `datetime` / BETWEEN branches from `bare [viewed]="!_editing"` → `[viewed]="'inline'"` + `[clearable]="false"`; delete the hand-rolled `enterEdit` / `onFocusOut` / `#editing` / `chipPicker` open wiring entirely (all branches now self-manage). The chip keeps its own `.c-token-remove`.
- **build-chip**: chip being created (always-edit, no value). Migrate every `bare` picker → `[viewed]="'inline'"` + auto-open on mount (`afterNextRender(() => picker.open())`) so the panel opens immediately for selection. Drop `bare`.

### D. Remove `bare`

After C, no consumer uses `bare`. Remove the `bare` input from `select, date, datetime, date-range`:
- Replace `bare() || isInline()` → `isInline()` in host bindings; `_bare = bare() || _isInline` → `_bare = _isInline` in templates.
- Keep the `:host(.sd-bare)` SCSS flatten rules (now driven by `isInline()`).
- **Breaking (pre-1.0):** consumers using `[bare]` migrate to `[viewed]="'inline'"`. Document in `CHANGELOG` + each `sd-*.md`.

### E. Showcase

New **"Inline edit"** demos (extend existing per-control demo pages + a combined section): select / date / datetime / date-range / autocomplete / input / input-number — each with value / empty / required / (multi where applicable) + the clear-× behaviour. Update the query-bar inline demo caption already present.

## Out of scope

- The other `viewed` controls not named (checkbox, radio, switch, chip, chip-calendar, textarea, label, input-color) — inline-edit doesn't fit their UX; defer.
- Changing `viewed=true` static behaviour anywhere.

## Testing

Per control (TDD): tri-state transform + `isInline`/`isViewed`; inline renders face + (panel controls) hidden editor / (inputs) borderless input; click/focus → edit; text retained; clear-× present when clearable+value, absent when required/clearable=false; `sdViewDef` overrides view (panel controls). query-bar: inline-chip all branches `viewed='inline'`; build-chip auto-opens; no `bare` anywhere; suite green. Full `npm run build` clean (the real gate). Showcase builds.

## Risk

- **Surface = 6 controls + 2 query-bar + bare removal.** Pilot de-risked the pattern; each control is a mechanical apply + TDD. Sequence: panel controls → migrate inline-chip → build-chip → remove bare (last, once no consumer references it).
- **dist gotcha:** `npm run build` before any query-bar / showcase spec that resolves a changed control from `dist`.
- input borderless: ensure focus ring/contrast meets a11y; native input remains keyboard-accessible (it's a real input).
- date-range without `sdViewDef`/`open()` symmetry — verify its picker-open method name before wiring.
