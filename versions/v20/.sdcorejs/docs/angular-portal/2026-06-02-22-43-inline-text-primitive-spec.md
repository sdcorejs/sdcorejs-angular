# Design — `<sd-inline-text>` seamless primitive + content-hug inline input

**Date:** 2026-06-02
**Status:** Draft (design) — pending review
**Scope:** new `forms/inline-text` secondary entry; `forms/{input,input-number}` inline branch; `components/query-bar/inline-value-chip`; `assets/scss/core/_inline-edit.scss`; showcase; CHANGELOG.
**Builds on:** `2026-06-02-sd-viewed-inline-rollout.md` (the inline variant this refines).

## Problem

`sd-input` / `sd-input-number` with `viewed='inline'` render the borderless field **through `mat-form-field`** styled by the `sd-inline-input` mixin, which sets `.mat-mdc-form-field { width: 100% }` (host `display:block`, wrap `flex:1`). The hover/click band therefore stretches the **full parent width regardless of content length** — it reads as a wide input rather than text, and cannot fit chip contexts (query-bar, future query-builder) where the control must hug its content.

A native `<input>` inside `mat-form-field` does not size to content; `mat-form-field`'s infix carries its own min-width. This is exactly why query-bar did **not** reuse `sd-input` for inline chips and instead built a separate seamless chip (`inline-value-chip`), whose raw `<input [size]>` hugs content. The result today is two divergent inline-input mechanics plus a standalone inline variant that is visually wrong ("bị to").

## Goals

1. Add a shared primitive **`<sd-inline-text>`** (`forms/inline-text` secondary entry): a borderless, content-hugging seamless text input — generalizing `inline-value-chip`'s `[size]`-hug + `[data-state]` styling, with no query-bar field/operator knowledge.
2. `sd-input` + `sd-input-number` `viewed='inline'` render `<sd-inline-text>` instead of `mat-form-field` → content-hug, no `::ng-deep` fighting of Material internals.
3. Refactor query-bar `inline-value-chip` to consume `<sd-inline-text>` (single seamless mechanic, DRY).
4. Net effect: the inline hover/click band hugs content everywhere (fixes the "to" bug) and the same primitive is reusable in query-builder later.

## Approach

### A. The primitive — `SdInlineText` (`forms/inline-text`)

A "dumb" seamless single-value text input. Renders a **raw `<input>`** (no `mat-form-field`).

- **Inputs:** `value` / model (string passthrough), `placeholder`, `disabled`, `clearable` (default `true`), `density` (`'compact' | 'comfortable'`), `autoId`, optional `state` override, optional `align`/`maxWidthCh`.
- **Sizing:** native `[size]` attr = `clamp(len(value || placeholder), min=2, …)`, with `max-width` cap in SCSS → width hugs content, short values don't reserve a trailing gap. Host `display: inline-flex`.
- **States:** `[data-state]` ∈ `pending | active | focus | error`, derived from value/focus/error (mirrors `inline-value-chip`): dashed when empty, value colour when filled, ring on focus, danger on error.
- **Interaction:** Enter commits + blurs; Esc reverts to last committed + blurs; blur commits. Hover clear-× at the end, gated `clearable && hasValue && !disabled`.
- **Outputs:** `valueChange` (on commit), `committed`, `reverted`, `focusChange` (or `focused`/`blurred`), `cleared`.
- **No number parse/format inside** — the primitive is value-agnostic (passes the raw string). Consumers own formatting (input-number keeps vi-VN grouping; inline-value-chip keeps its `#parse`/`#format`).
- **autofocus** input for the "created focused" build-chip use case.

### B. `sd-input` / `sd-input-number` inline branch

Template gains a third branch:
- `@if (isViewed())` → static `<sd-view>` (unchanged).
- `@else if (isInline())` → `<sd-inline-text [value]/(valueChange) … [disabled] [clearable] [autoId]>` bound to `formControl`; input-number formats the value at rest, raw string on focus (existing logic moves to the bind/commit handlers).
- `@else` → normal `mat-form-field` path (unchanged — keeps label / suffix / maxlength counter / mat-error for the editable form field).

Inline mode intentionally **drops** the mat suffix / maxlength counter / inline `mat-error` (those belong to the full field); inline surfaces errors via the primitive's error state + tooltip and keeps the clear-×.

### C. query-bar `inline-value-chip`

- Replace the raw `<input class="c-seamless__field-input">` (single + BETWEEN dual) with `<sd-inline-text>`; BETWEEN composes **two** `<sd-inline-text>` joined by the existing `—`.
- Keep the chip envelope (label / icon / operator / `×`) and all commit/parse/format logic (`#parse`, `#format`, `commitSingle`, `commitRange`, `revertAndBlur`, number vi-VN handling).
- Move the seamless field-input SCSS (`.c-seamless__field-input` sizing/colour) into the primitive; the chip keeps only the envelope/segment styling.

### D. SCSS cleanup — `assets/scss/core/_inline-edit.scss`

- **Remove** the `sd-inline-input` mixin (Material-targeting, now dead — confirmed only `input` + `input-number` consume it).
- **Keep** the `sd-inline-panel` mixin (date/datetime/select/autocomplete still use the hidden-editor overlay pattern — out of scope here).

### E. Showcase + docs

- New **sd-inline-text** demo page + route + nav entry (per CLAUDE.md rule: new component requires a showcase demo).
- `forms/inline-text/sd-inline-text.md` component contract doc.
- `CHANGELOG.md` (Unreleased): new primitive + sd-input/input-number inline now content-hug.

## File structure

**Create**
- `forms/inline-text/ng-package.json` — secondary entry (`entryFile: index.ts`).
- `forms/inline-text/index.ts` — `export * from './src/inline-text.component'`.
- `forms/inline-text/src/inline-text.component.ts` — `SdInlineText`.
- `forms/inline-text/src/inline-text.component.html` — raw input + clear-×.
- `forms/inline-text/src/inline-text.component.scss` — seamless styling (lifted from `.c-seamless__field-input` + the `sd-inline-input` look).
- `forms/inline-text/src/inline-text.component.spec.ts` — unit tests.
- `forms/inline-text/sd-inline-text.md` — contract doc.
- `projects/showcase/.../forms/inline-text/…` demo page (+ route + nav).

**Modify**
- `forms/input/src/input.component.{html,scss,ts,spec.ts}` — inline branch → primitive; drop `sd-inline-input`.
- `forms/input-number/src/input-number.component.{html,scss,ts,spec.ts}` — same + keep format-on-blur.
- `components/query-bar/src/components/inline-value-chip/inline-value-chip.component.{html,scss,ts,spec.ts}` — consume primitive.
- `assets/scss/core/_inline-edit.scss` — remove `sd-inline-input` mixin.
- `CHANGELOG.md` — Unreleased entry.

No `tsconfig.json` change needed — wildcard path `@sdcorejs/angular/* → [dist/sdcorejs-angular/*, projects/sdcorejs-angular/*]` already resolves the new entry.

## Acceptance criteria

1. `<sd-inline-text>` width hugs content: short value → narrow; long value → wider up to the max cap; empty → placeholder-width floor (min 2ch). The hover/click target width equals the rendered width, not the parent width.
2. `sd-input` + `sd-input-number` `viewed='inline'` render the primitive; no full-width stretch; `viewed=true` (static) and `viewed=false` (normal field) unchanged.
3. States render correctly: pending (empty/dashed), active (value), focus (ring), error (danger).
4. Clear-× shows on hover when `clearable` + has value + not disabled; hidden when `clearable=false` / no value / disabled.
5. Enter commits + blurs; Esc reverts to committed value; blur commits. input-number shows vi-VN formatted value at rest, raw on focus; non-numeric rejected as error.
6. `inline-value-chip` uses the primitive; query-bar suite green; BETWEEN dual-input still commits `{from,to}`; the in-progress build chip lands focused.
7. `npm run build` clean; showcase builds and exposes the sd-inline-text demo.
8. No `::ng-deep` `mat-form-field` targeting remains for inline-input sizing; `sd-inline-input` mixin removed with no orphan references.

## Out of scope (deferred)

- **Wiring query-builder** to the primitive — query-builder is still a raw prototype (`*ngIf` + plain `<input>` + hardcoded operators). Defer until query-builder is rebuilt against the field/operator model.
- Other `viewed` controls (checkbox / radio / switch / chip / chip-calendar / textarea / label / input-color).
- Panel-based controls (date / datetime / date-range / autocomplete / select) — keep the hidden-editor overlay pattern.
- Changing `viewed=true` / `viewed=false` behaviour.

## Testing

Primitive (TDD): size hugs value vs placeholder + clamp floor/cap; `[data-state]` transitions; clear-× gating (clearable/value/disabled); Enter/Esc/blur commit-revert; disabled = static; `autoId` data attr; `autofocus`. sd-input / input-number: inline renders primitive (not mat-form-field); content-hug; format-on-blur for number; `viewed=true/false` unchanged. query-bar: inline-value-chip single + BETWEEN via primitive; full query-bar suite green (build the lib first — `dist` resolves before source). `npm run build` clean (the real gate). Showcase builds.

## Risk

- **BETWEEN** needs two inputs; primitive is single-value by design → chip composes two instances + dash. Verify focus/commit ordering across the pair.
- **Number formatting** must stay in the consumer (primitive = string passthrough); ensure input-number's format-on-blur / raw-on-focus still works when the element is the primitive, not `matInput`.
- **inline-value-chip refactor** risks query-bar regressions — keep all parse/commit logic, swap only the input element, re-run the full query-bar suite. dist gotcha applies.
- **Mixin removal** — `sd-inline-input` confirmed used only by input + input-number; remove only after both migrate.
- **a11y** — primitive is a real `<input>` (keyboard-accessible); ensure focus-ring contrast meets the bar.
- **Signal `@let` convention** — new templates must alias signals read 2+ times (`@let _x = x();`) per the repo rule added in the rollout.
