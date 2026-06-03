---
name: inline-text-primitive
description: Extract <sd-inline-text> seamless content-hug primitive; sd-input/input-number inline renders it (no mat-form-field); refactor query-bar inline-value-chip to consume it.
approvedAt: 2026-06-02T22:43+07:00
approvedBy: anh.hoang10@onemount.com
track: angular-portal
module: forms
entity: inline-text
sourceSpecPath: .sdcorejs/docs/angular-portal/2026-06-02-22-43-inline-text-primitive-spec.md
---

# `<sd-inline-text>` seamless primitive + content-hug inline input — Approved Spec

> Snapshot of the spec the user approved at the `04-review-spec` gate. The body below is the exact contract `05-plan` consumed. Do not edit by hand — re-author via `03-write-spec` + `04-review-spec` if the contract changes.

## Goals

1. Add a shared primitive **`<sd-inline-text>`** (`forms/inline-text` secondary entry): borderless, content-hugging seamless text input — generalizing `inline-value-chip`'s `[size]`-hug + `[data-state]` styling, with no query-bar field/operator knowledge.
2. `sd-input` + `sd-input-number` `viewed='inline'` render `<sd-inline-text>` instead of `mat-form-field` → content-hug, no `::ng-deep` fighting of Material internals.
3. Refactor query-bar `inline-value-chip` to consume `<sd-inline-text>` (single seamless mechanic, DRY).
4. Net effect: inline hover/click band hugs content everywhere (fixes the "to" bug); same primitive reusable in query-builder later.

## Non-goals

- Wiring query-builder to the primitive — still a raw prototype (`*ngIf` + plain `<input>` + hardcoded operators); defer until rebuilt against field/operator model.
- Other `viewed` controls (checkbox / radio / switch / chip / chip-calendar / textarea / label / input-color).
- Panel-based controls (date / datetime / date-range / autocomplete / select) — keep the hidden-editor overlay pattern.
- Changing `viewed=true` / `viewed=false` behaviour.

## Architecture

`<sd-inline-text>` = dumb seamless single-value input rendering a raw `<input>` (no mat-form-field). Inputs: value/model (string passthrough), placeholder, disabled, clearable (default true), density (compact|comfortable), autoId, optional state override, autofocus. Sizing via native `[size]` = clamp(len(value || placeholder), min 2, …) + SCSS max-width cap; host `display:inline-flex`. States `[data-state]` ∈ pending|active|focus|error. Enter commits+blurs, Esc reverts+blurs, blur commits; hover clear-× gated `clearable && hasValue && !disabled`. No number parse/format inside (consumer owns formatting).

sd-input/input-number gain a third template branch: `@if(isViewed())` static sd-view · `@else if(isInline())` `<sd-inline-text>` bound to formControl (input-number keeps format-on-blur/raw-on-focus in the bind/commit handlers; inline drops mat suffix/maxlength/mat-error) · `@else` normal mat-form-field. query-bar inline-value-chip swaps its raw input(s) for `<sd-inline-text>` (BETWEEN = two instances + dash), keeping envelope + parse/commit/format. `_inline-edit.scss`: remove dead `sd-inline-input` mixin (only input + input-number consumed it — confirmed); keep `sd-inline-panel`. No tsconfig change — wildcard path covers the new entry.

## Acceptance criteria

1. `<sd-inline-text>` width hugs content: short → narrow; long → wider up to max cap; empty → placeholder-width floor (min 2ch). Hover/click target width == rendered width, not parent width.
2. sd-input + sd-input-number `viewed='inline'` render the primitive; no full-width stretch; `viewed=true`/`false` unchanged.
3. States render: pending (empty/dashed), active (value), focus (ring), error (danger).
4. Clear-× shows on hover when clearable + has value + not disabled; hidden when clearable=false / no value / disabled.
5. Enter commits+blurs; Esc reverts; blur commits. input-number shows vi-VN formatted value at rest, raw on focus; non-numeric rejected as error.
6. inline-value-chip uses the primitive; query-bar suite green; BETWEEN dual-input still commits {from,to}; build chip lands focused.
7. `npm run build` clean; showcase builds and exposes the sd-inline-text demo.
8. No `::ng-deep` mat-form-field targeting remains for inline-input sizing; `sd-inline-input` mixin removed with no orphan references.

## Decisions captured during review

(approved as drafted — attempt 1, no edits)

Key design decisions locked during brainstorm/clarify (the deltas that shaped this contract):
- Chose **Approach B** (extract seamless primitive) over A (content-hug sd-input in-place via ::ng-deep) or C (inlineWidth flag) — rationale: mat-form-field can't hug content cleanly, which is why query-bar already built a separate seamless chip; reusing the proven raw-input mechanic avoids fighting Material internals.
- Inline mode **renders the primitive** (raw input) rather than keeping mat-form-field + CSS hug — accepts dropping mat suffix/maxlength-counter/mat-error in inline mode.
- Primitive lives at **`forms/inline-text` secondary entry** (`<sd-inline-text>`), not a shared internal.
- **inline-value-chip refactored** to consume the primitive (DRY) rather than leaving two parallel seamless mechanics.
- Spec authored in **English** to mirror the existing `docs/superpowers/specs/*` corpus (all EN); code labels/messages stay VI.

## Skill provenance

01-brainstorm → 02-clarify (3 design Qs) → 03-write-spec → 04-review-spec (approved on attempt 1 / 3)
