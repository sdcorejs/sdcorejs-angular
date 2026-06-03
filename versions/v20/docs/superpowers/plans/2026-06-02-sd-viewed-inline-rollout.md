# `viewed='inline'` rollout + remove `bare` — implementation plan

> **For agentic workers:** TDD required. Each code task: failing test → red → implement → green → (rebuild dist when a downstream/query-bar/showcase spec depends on the changed control). Steps use `- [ ]`.

**Goal:** Apply the sd-select inline pilot to date / datetime / date-range / autocomplete (panel pattern) + input / input-number (borderless variant); migrate query-bar `inline-chip` + `build-chip` off `bare`; remove the `bare` input from select / date / datetime / date-range; expand the showcase. Spec: `docs/superpowers/specs/2026-06-02-sd-viewed-inline-rollout.md`.

**Working dir (prefix every command):** `cd /c/Users/nghiatt15_onemount/Documents/mh/lib-core-angular/vn-angular`

**⚠️ dist gotcha:** `@sdcorejs/angular/* → ["dist/sdcorejs-angular/*", …]` (dist wins). A control's OWN spec imports source (`./x.component`) → sees source immediately. But query-bar `inline-chip`/`build-chip` + showcase resolve controls from `dist/` → run `npm run build` before those specs reflect control source changes.

**Test cmd:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec>' 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS|Expected" | head`

**Commit footer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`, prefix `SM-00:`.

**Reference pattern (sd-select pilot):** widen `viewed` → `sdViewedTransform`; `#v = sdViewedInline(this.viewed, () => this.open())` → expose `isInline`/`isViewed`/`enterInlineEdit`; host `.sd-bare = isInline()` (post-bare-removal) / `.sd-viewed = isViewed() || isInline()`; template `@if (isViewed()) static <sd-view> @else { @if(isInline()) .sd-inline-view face + clear-× ; <editor with [class.sd-inline-editor]="isInline()"> }`; `clearable` input gates the inline ×; `viewTemplate = computed(sdViewDef?.templateRef ?? sdValueTemplate())` fed to `<sd-view>`; `updatePanelWidth` floors 200 in inline.

---

## Task 0: Shared inline SCSS partial

Extract the pilot's inline rules so 5 controls don't duplicate ~40 lines.

- [ ] **Step 1:** Create `projects/sdcorejs-angular/assets/scss/core/_inline-edit.scss` exporting two mixins:
  - `@mixin sd-inline-panel` — `:host(.sd-bare){position:relative}` + `.sd-inline-view` (cursor, flex, padding, radius, hover bg, `.sd-inline-clear` hover-gated) + `.sd-inline-editor` (absolute, inset 0, opacity 0, `pointer-events:none` incl. `::ng-deep *`).
  - `@mixin sd-inline-input` — `.sd-inline-input` (transparent bg, no border, padding 0, hover bg, focus ring) + `.sd-inline-clear` hover-gated.
- [ ] **Step 2:** Refactor `select.component.scss` to `@use '...core/inline-edit' as inline;` + `@include inline.sd-inline-panel;`, deleting the inline-specific block now in the partial. Verify the `@use` path resolves (check how `color`/`map` are `@use`d at the top of select.scss; mirror that relative depth).
- [ ] **Step 3:** Run select spec — `--include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts'` → green (no behaviour change). Build lib → clean.
- [ ] **Step 4:** Commit — `SM-00: refactor(forms): extract shared inline-edit SCSS mixins`.

> If `@use` of an assets partial from a component scss is awkward in this workspace, fall back to duplicating the ~40-line block per control (note that in the task).

---

## Task 1: sd-date — `viewed='inline'`

**Files:** `forms/date/src/date.component.{ts,html,scss,spec.ts}` + `sd-date.md`.

- [ ] **Step 1: Failing tests** (append a `describe('SdDate viewed inline')`): `viewed='inline'` → `isInline()` true / `isViewed()` false, `.sd-inline-view` present + the datepicker editor present (hidden); click face → `open()` called (spy) + face retained; `viewed=true` static (no `.sd-inline-view`); clear-× present (clearable+value) / absent (required). Mirror the sd-select inline describe.
- [ ] **Step 2:** Run date spec → red.
- [ ] **Step 3: Implement** — apply the reference pattern to `date.component.ts` (widen `viewed`, `sdViewedInline` with `() => this.open()`, expose computeds + `clearable` input, `viewTemplate`), `date.component.html` (isViewed/else face+editor, `[class.sd-inline-editor]`, clear-×, `viewTemplate` into `<sd-view>`, drop the old `sdViewDef` focus-swap if present), `date.component.scss` (`@include inline.sd-inline-panel`). Keep `bare` for now (removed in Task 8).
- [ ] **Step 4:** Run date spec → green. Update `sd-date.md` (viewed tri-state + clearable + sdViewDef-as-valueTemplate).
- [ ] **Step 5:** Commit — `SM-00: feat(date): viewed='inline' click-to-edit`.

## Task 2: sd-datetime — `viewed='inline'`
Same recipe as Task 1, files `forms/datetime/src/*` + `sd-datetime.md`. `open()` exists (`pickerOpened()`). Commit `SM-00: feat(datetime): viewed='inline' click-to-edit`.

## Task 3: sd-date-range — `viewed='inline'`
Same recipe, files `forms/date-range/src/*` + `sd-date-range.md`. Picker-open method = `onOpenPicker($event)` — wrap a no-arg `open()` or pass a synthetic event; verify name first. `sdViewDef` may be absent → `viewTemplate` falls back to `sdValueTemplate()` only. Commit `SM-00: feat(date-range): viewed='inline' click-to-edit`.

## Task 4: sd-autocomplete — `viewed='inline'`
Same recipe, files `forms/autocomplete/src/*` + `sd-autocomplete.md`. Confirm its panel-open method; wire `enterInlineEdit` to it. Commit `SM-00: feat(autocomplete): viewed='inline' click-to-edit`.

---

## Task 5: sd-input + sd-input-number — borderless inline variant

Different pattern: NO hidden-editor overlay — the real `<input>` is the face.

**Files:** `forms/input/src/*` + `forms/input-number/src/*` + their `.md`.

- [ ] **Step 1: Failing tests** (each): `viewed='inline'` → `isInline()` true; the editable `<input>` renders with `.sd-inline-input` (transparent/borderless) and keeps its attributes (type/pattern/etc.); `viewed=true` → static `<sd-view>`; clear-× present (clearable+value) / absent (required); typing still updates the model; input-number still formats on blur.
- [ ] **Step 2:** Run → red.
- [ ] **Step 3: Implement** — `viewed` tri-state + `sdViewedInline` (here `enterInlineEdit` = focus the input, or omit and rely on native focus); template: `@if (isViewed()) <sd-view> @else { <input [class.sd-inline-input]="isInline()" …existing… > + clear-× }`; scss `@include inline.sd-inline-input`. No `.sd-inline-editor` overlay.
- [ ] **Step 4:** Run → green. Update `sd-input.md` / `sd-input-number.md`.
- [ ] **Step 5:** Commit — `SM-00: feat(input,input-number): viewed='inline' borderless edit`.

---

## Task 6: Rebuild lib + migrate query-bar `inline-chip` (date/datetime/BETWEEN → inline)

- [ ] **Step 1:** `npm run build` (dist now has inline on all controls).
- [ ] **Step 2: Adjust tests** — `inline-chip.component.spec.ts`: date/datetime/BETWEEN tests assert pickers use `[viewed]="'inline'"` + `[clearable]="false"`; drop assertions on `#editing`/`enterEdit`/`onFocusOut`/`.c-token-editing` for those branches.
- [ ] **Step 3: Implement** — `inline-chip.component.html`: date / datetime / BETWEEN branches → `[viewed]="'inline'"` + `[clearable]="false"`, remove `bare` + `(click)`/`(focusout)` wrappers. `inline-chip.component.ts`: delete `enterEdit` / `onFocusOut` / `onFocusOutForTest` / `#editing` / `editing` / `chipPicker` (all branches now self-manage); keep `emitSingleCommit`/`emitRange`/`emitLive`/`emitBoolean` (the commit outputs). Boolean branch keeps its toggle (no picker) — verify it doesn't depend on `#editing`.
- [ ] **Step 4:** Run inline-chip + query-bar parent specs → green.
- [ ] **Step 5:** Commit — `SM-00: refactor(query-bar): inline-chip all branches use viewed='inline'`.

## Task 7: Migrate `build-chip` → `viewed='inline'` + auto-open

- [ ] **Step 1: Adjust tests** — `build-chip.component.spec.ts`: pickers render with `[viewed]="'inline'"` (not `bare`); the value step auto-opens (`open()` called on mount).
- [ ] **Step 2:** Run → red.
- [ ] **Step 3: Implement** — `build-chip.component.html`: every `bare` picker → `[viewed]="'inline'"` + `[clearable]="false"`. `build-chip.component.ts`: on entering the value step, `afterNextRender(() => bPicker()?.open())` so the panel opens immediately for a fresh chip.
- [ ] **Step 4:** Run build-chip + query-bar specs → green.
- [ ] **Step 5:** Commit — `SM-00: refactor(query-bar): build-chip uses viewed='inline' + auto-open`.

## Task 8: Remove `bare` from select / date / datetime / date-range

No consumer references `bare` after Tasks 6–7. Verify, then remove.

- [ ] **Step 1: Verify no usage** — `grep -rnE "\[bare\]|\bbare\b" projects/sdcorejs-angular --include=*.html | grep -v node_modules | grep -iE "sd-select|sd-date|sd-datetime|sd-date-range|<sd-"` → only the controls' own internal refs (which Step 2 removes). Also grep showcase.
- [ ] **Step 2: Remove** — in each of the 4 controls: delete the `bare = input(...)` declaration; replace `bare() || isInline()` → `isInline()` (host), `bare() || _isInline` → `_isInline` (template `_bare`). Keep the `:host(.sd-bare)` SCSS (now driven by `isInline()`). Delete `bare`-only tests; keep/adjust the rest.
- [ ] **Step 3:** Run all 4 control specs → green. `npm run build` → clean.
- [ ] **Step 4: Docs** — remove `[bare]` rows from the 4 `sd-*.md`; add a CHANGELOG note (breaking: `[bare]` → `[viewed]="'inline'"`).
- [ ] **Step 5:** Commit — `SM-00: refactor(forms)!: remove [bare]; superseded by viewed='inline'`.

## Task 9: Showcase — inline-edit catalog

- [ ] **Step 1:** Extend each control's demo page (`pages/forms/{date,datetime,date-range,autocomplete,input,input-number}` + select already done) with an "Inline edit" section: value / empty / required / multi (where applicable) + clear-×. (Routes/sidebar already exist.)
- [ ] **Step 2:** `npx ng build showcase --configuration=development` → built, no errors.
- [ ] **Step 3:** Commit — `SM-00: docs(showcase): inline-edit examples across controls`.

## Task 10: Full verification + docs

- [ ] **Step 1:** Full suite `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless` → `TOTAL: N SUCCESS`, 0 FAILED (ignore known-flaky permission async).
- [ ] **Step 2:** `npm run build` clean.
- [ ] **Step 3:** `CLAUDE.md` — new "Recent work" bullet: rollout complete, `bare` removed, input borderless variant, showcase. `sd-query-bar.md` / `HANDOFF.md` — inline-chip + build-chip now fully on `viewed='inline'`, no `bare`.
- [ ] **Step 4:** Manual verify (UI): showcase inline for each control — text retained on open, clear-× on hover, panel min 200, input borderless.

---

## Self-Review notes
- Pattern proven in pilot → each panel control is a mechanical apply; inputs are simpler (no overlay).
- Sequence respects deps: controls → inline-chip → build-chip → remove bare (last).
- dist rebuild before query-bar/showcase specs (Task 6 Step 1, Task 9).
- `bare` removal is breaking (pre-1.0) — documented in CHANGELOG + md (Task 8 Step 4).
- Out of scope: 8 non-named `viewed` controls.
