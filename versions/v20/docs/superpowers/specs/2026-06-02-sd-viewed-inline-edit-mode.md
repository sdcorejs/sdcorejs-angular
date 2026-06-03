# Design — Tri-state `viewed` (add `'inline'` inline-edit mode) for sd-form-controls

**Date:** 2026-06-02
**Status:** Implemented (pilot: sd-select) — see amendment below
**Scope:** `projects/sdcorejs-angular/forms/*` (14 controls with a `viewed` input) + a shared base; pilot on `forms/select`. Optional follow-up: `components/query-bar` inline/build chips.

> **Amendment (post-review, what actually shipped):** the mechanism is NOT a render-swap. In `'inline'` the editor is **always mounted** and its chrome is hidden via an `opacity:0; pointer-events:none` absolute overlay (`.sd-inline-editor`); the `<sd-view>` text is the visible face and is the click trigger (`enterInlineEdit()` → `open()`). This keeps the view text on screen the whole time the panel is open — it only changes on commit (user requirement: "text giữ lại, khi nào chọn mới mất"). The shared factory therefore exposes just `isInline` / `isViewed` / `enterInlineEdit` (no `inlineEditing` / `onInlineFocusOut` / swap state). Panel min-width floors at `200px` in inline. The "swap-render" wording below is the superseded original plan.

## Problem

Form controls today expose `viewed` as a boolean:

- `viewed=false` → full input/dropdown chrome (edit).
- `viewed=true` → `<sd-view>` plain text, **not editable** (no panel).

For JIRA-style inline edit there is a separate `SdViewDefDirective` (`sdViewDef`, on 10/14 controls): when not focused it renders a **custom template**; on focus it swaps to the real input. It works but (a) forces the consumer to hand-write a display template, and (b) `sd-query-bar`'s inline chip re-implements the same "view text → click → open panel → focusout exits" lifecycle by hand (`inline-chip.component.ts`).

We want a **first-class inline-edit mode** on every control: render like `<sd-view>` (no visible input box), click anywhere on it to reveal the native input/panel inline, exit on focusout — with **zero custom template** required.

## Goal

Promote the inline-chip lifecycle into the base control as a third `viewed` state. The consumer writes `<sd-select [viewed]="'inline'">` and gets: view-text display by default, click-to-edit via the native picker, no input chrome until activated.

## Chosen approach — tri-state `viewed` = `false | true | 'inline'`

Single knob (matches the existing mental model), backward-compatible, swap-render (NOT `display:none`).

### Core component API (every control with `viewed`)

**`viewed` input** — widen the type, keep boolean coercion, intercept `'inline'`:

```ts
type SdViewed = boolean | 'inline';

viewed = input<SdViewed, '' | 'inline' | boolean | null | undefined>(false, {
  // why: bare attr `viewed` → '' → true (back-compat); explicit `viewed="inline"` → 'inline';
  // [viewed]="bool" passes through booleanAttribute. Must intercept 'inline' BEFORE
  // booleanAttribute (which would coerce 'inline' → true).
  transform: v => (v === 'inline' ? 'inline' : booleanAttribute(v)),
});
```

**Two computeds (centralized — names confirmed):**

```ts
/** viewed === 'inline' (the mode flag). */
readonly isInline = computed(() => this.viewed() === 'inline');

/** Whether the view (sd-view / sdViewDef) layer is shown right now.
 *  static view (true) OR inline-but-not-yet-activated. */
readonly isViewed = computed(() =>
  this.viewed() === true || (this.isInline() && !this.#inlineEditing()));
```

`#inlineEditing = signal(false)` — flips true on click into the inline display, false on focusout outside the wrapper.

**Inline lifecycle (centralized):**

- `enterInlineEdit()` — `if (!isInline()) return;` `#inlineEditing.set(true);` `afterNextRender(() => this.open?.())`.
- `onInlineFocusOut(ev)` — exit when `relatedTarget` is outside the wrapper AND not inside `.cdk-overlay-container` (panel/calendar render in `document.body`). Mirrors `inline-chip.component.ts` exactly.

**Template change (per control):** replace `@if (viewed())` with `@if (isViewed())`. In the view branch, when `isInline()`, wrap the display in a clickable element (`role="button"`, `(click)="enterInlineEdit()"`, `(focusout)="onInlineFocusOut($event)"`). The edit branch is reused unchanged; it shows when `!isViewed()` (i.e. `viewed===false` OR inline-activated).

**Compose with `sdViewDef` (confirmed):** the inline display layer prefers the `sdViewDef` template when present, else falls back to `<sd-view>` (same renderer as `viewed=true`). `sdViewDef` is NOT removed.

**`inline` implies bare-on-activation (no separate `[bare]` needed):** when an `'inline'` field swaps to its editor, that editor renders chrome-stripped (the same flattening `[bare]` applies). Rationale: text → click → a heavy `mat-form-field` outline would feel jarring; the JIRA-style feel needs a minimal editor. So `<sd-select [viewed]="'inline'">` **alone** is sufficient — the consumer does NOT also pass `[bare]`. Internally, inline-active reuses the `.sd-bare` flatten path.

**`bare` standalone keeps ONE narrow purpose:** "always-edit, chrome-stripped, NO view layer" — the in-progress build chip (no committed value yet, never shows view text). It is no longer the mechanism for completed/click-to-edit chips; those become `viewed='inline'`. (Full-chrome-on-activate for inline is intentionally NOT supported now — add a flag later only if a real case appears.)

### Centralization (key implementation note)

`'inline'` is **truthy** → any leftover `@if (viewed())` keeps showing the view and never enters edit. To avoid 14× divergence: put the tri-state transform + `isViewed`/`isInline` + `enterInlineEdit`/`onInlineFocusOut` + `#inlineEditing` in a **shared base/mixin**. Plan must confirm the location (a forms base, or reuse `components/base`); if no shared base exists, introduce a small `SdViewedHost` mixin the controls compose.

### Pilot → rollout

Pilot `sd-select` end-to-end (full TDD) to lock the base helper + template recipe, then roll the same recipe across the remaining 13 controls.

## Component boundaries

- **Base/mixin** owns the tri-state semantics, the two computeds, and the inline lifecycle.
- **Each control** wires its template branch + clickable display + its own `open()` (already exists on pickers; trivial/no-op for text inputs which just focus).
- **`sd-view`** stays the default display renderer; `sdViewDef` is the optional override.

## Testing (pilot sd-select, then per control)

- `viewed` defaults `false`; bare attr `<sd-select viewed>` → `true` (back-compat); `viewed="inline"` → `'inline'`; `[viewed]="false|true|'inline'"` pass through.
- `isInline()` / `isViewed()` truth table (false / true / inline-idle / inline-active).
- `viewed=true` → `<sd-view>`, NO click-to-edit (clicking does nothing).
- `viewed='inline'` → `<sd-view>` shown; click → input/panel rendered + `open()` called (`afterNextRender`); focusout outside → back to `<sd-view>`; a real change commits via `sdChange`/model.
- `viewed='inline'` activated editor is **bare** (`.sd-bare` present / no mat-form-field outline / no inline clear-×) WITHOUT the consumer passing `[bare]`.
- focusout INTO `.cdk-overlay-container` does NOT exit (ticking a multi-select option keeps edit open) — same guard as inline-chip.
- `sdViewDef` present + `viewed='inline'` → display uses the custom template, not `<sd-view>`.
- AOT strict-template passes for the widened `viewed` binding.

## Risk

- **Truthy `'inline'` regression:** every `@if (viewed())` must migrate to `isViewed()`; a missed one = uneditable inline field. Mitigate via centralized helper + per-control grep of `viewed()` during rollout.
- **Type widening** `boolean → boolean | 'inline'`: `[viewed]="someBool()"` still assignable; external readers of the value are rare. Search consumers.
- **Swap-render timing:** panel anchor relies on `afterNextRender(() => open())` — already proven in inline-chip.
- **Surface = 14 controls:** de-risk by piloting sd-select first; only roll out after the recipe is green.

## Rollout order

1. Shared base/mixin: tri-state transform + `isViewed`/`isInline` + inline lifecycle (+ unit tests).
2. Pilot `sd-select`: template branch + clickable inline display + `enterInlineEdit`, TDD red→green.
3. Roll the recipe across the other 13 controls (TDD each).
4. Docs: each `forms/<name>/sd-<name>.md` `viewed` row/visual-cue + `CLAUDE.md` recent-work.
5. **Bonus (separate change):** refactor `query-bar` `inline-chip` (completed chip) to use `[viewed]="'inline'"` and delete its hand-rolled `enterEdit`/`onFocusOut`/`#editing` — that lifecycle now lives in the base. `build-chip` (in-progress, always-edit) keeps `[bare]`. Removes the duplication this feature generalizes.

## Out of scope

- `display:none`-keep-in-DOM mechanism — rejected (hidden focusables break tab order / a11y, double render, focus churn); swap-render is the chosen mechanism.
- Changing static `viewed=true` behavior (byte-for-byte unchanged).
- Non-form components (table, etc.).
- Removing `sdViewDef` (kept as the custom-template override within inline mode).
