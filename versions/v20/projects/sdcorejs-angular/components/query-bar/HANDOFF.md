# Handoff — branch `query-bar`

Full snapshot of in-progress work on `@sdcorejs/angular` so it can be resumed on another machine.
Last updated: 2026-06-02.

## ⏩ Resume here (2026-06-02) — `viewed='inline'` rollout (on branch `release/0.0.1`)

> The inline-edit feature below was committed on **`release/0.0.1`** (NOT `query-bar`). On the next machine:
> `git fetch origin && git checkout release/0.0.1 && git pull && npm install && npm run build`

**Shipped (committed + pushed):**
- Tri-state `viewed` (`boolean | 'inline'`) on `select`, `date`, `datetime`, `date-range`, `autocomplete`, `input`, `input-number`.
  - Panel controls: text-face (`<sd-view>`) + always-mounted hidden editor (`.sd-inline-editor`); click → `open()` panel; text retained until commit; min panel 200px.
  - `input` / `input-number`: borderless transparent `<input>` (no overlay); focus to edit, blur reformats.
  - Disabled `'inline'` ⇒ static view. `clearable` input (default true) → hover clear-× on the face.
- Shared primitive `forms/models/src/sd-viewed.ts` (`SdViewed`, `sdViewedTransform`, `sdViewedInline(viewed, open?, disabled?)`) + SCSS `assets/scss/core/_inline-edit.scss` (`@mixin sd-inline-panel` / `sd-inline-input`).
- `[bare]` input **removed** from select/date/datetime/date-range (BREAKING) → `.sd-bare` now driven by `isInline()`.
- `sdViewDef` unified → fed into `<sd-view>` `[valueTemplate]`; `<sd-view>` context gained `selectedItem`.
- query-bar `inline-chip` + `build-chip` fully on `[viewed]="'inline'" [clearable]="false"` (boolean branch keeps `#editing`).
- Showcase: inline example in all 7 form demos.
- Spec/plan: `docs/superpowers/{specs,plans}/2026-06-02-sd-viewed-inline-rollout.md` (+ `-pilot` / `-edit-mode`).
- Status: full `sd-angular` suite **2770 green / 0 FAILED**; `npm run build` clean; showcase builds.

**Pending follow-ups (do next):**
1. **Signal `@let` convention sweep** — CLAUDE.md now requires: a signal read 2+ times in a template MUST be cached via `@let _x = x();`. Applied to the rollout files; the **rest of the repo is NOT swept yet** (table, other components, the 8 untouched `viewed` controls). This is the main pending task.
2. **Remaining `viewed` controls** — checkbox / radio / switch / chip / chip-calendar / textarea / label / input-color have NOT been given `'inline'` (inline may not fit all; evaluate per control).
3. **Visual verification** — automated tests can't assert the inline UX. `npx ng serve showcase` → `/forms/*` "Inline edit" sections + `/components/query-bar` inline: confirm text retained on open, hover clear-×, panel ≥200px, borderless inputs.

**Gotchas:** the chip/showcase resolve form controls from `dist/` (tsconfig `@sdcorejs/angular/* → ["dist/sdcorejs-angular/*", …]`, dist wins) → run `npm run build` before any query-bar/showcase spec reflects form-control source edits. Karma output uses `\r` → pipe `tr '\r' '\n'`.

## Resume quickly

```bash
git fetch origin
git checkout query-bar
git pull
npm install                      # if node_modules missing
npx lefthook install             # if hooks not set up

# rebuild the lib entries you touch, then the demo
npm run build                                                                   # full lib (clean as of 2026-05-29)
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/query-bar/**/*.spec.ts'             # 131 SUCCESS
npx ng serve demo                                                               # open /sd-query-bar
```

> **cwd / Karma gotchas (Windows):** Karma progress output uses `\r`; pipe through `tr '\r' '\n'` then grep `TOTAL|FAILED|error TS` to read results. Run `ng` commands from the `vn-angular` root. Do NOT run `ng build` + `ng test` concurrently — both write/read `dist/` and race.
>
> The demo resolves `@sdcorejs/angular/*` from `dist/sdcorejs-angular` first (root `tsconfig.json` paths). After editing a lib component you MUST rebuild that lib entry (`ng build sdcorejs-angular`) before the demo picks it up.

## Design / plan docs (this branch)

- Per-component reference: `projects/sdcorejs-angular/components/query-bar/sd-query-bar.md` (current state — read this first)
- Spec:  `docs/superpowers/specs/2026-05-28-sd-picker-bare-api-design.md`
- Plan:  `docs/superpowers/plans/2026-05-28-sd-bare-picker.md`
- Visual ref for the whole component: `refs/design_handoff_sd_query_bar/README.md`

---

## What this branch contains

### 1. `<sd-query-bar>` component — fully decomposed (7/7)

Orchestrator + 7 children. See `sd-query-bar.md` for the full child map + responsibilities. Parent (`src/query-bar.component.ts`) is now ~340 LOC of pure state + mode switch — every UI branch lives in a dedicated sub-component spec'd in isolation.

**Modes** via `[mode]`:
- `popover` (default) — compact chip face (`<sd-query-popover-chip>`) opens an editor mat-menu (`<sd-query-chip-popover>`). Commit-on-close.
- `inline` — GitLab-style. Completed chips render via `<sd-query-inline-chip>` (or `<sd-query-inline-value-chip>` for string/number); in-progress chip via `<sd-query-build-chip>`. One Search button is the single apply trigger.

**Operator** rendered via `<sd-operator>` (SVG icon from `OPERATORS` table) in both modes — shown on chip face only when `[showOperatorOnChip]=true`.

**Saved filters**: `[showSavedFilters]` + `[savedFiltersKey]` enable a bookmark dropdown backed by `localStorage` (`sd-query-bar:savedFilters:<key>`).

### 2. Seamless string/number chip (`inline-value-chip.component.*`)

`SdQueryInlineValueChip` — for inline `string`/`number`, **the pill IS the input** (one border, no nested rectangle). States via `[data-state]`: pending (dashed) / active (primaryFaint) / focus (ring) / error. Number formats vi-VN (`25.000.000`) + parses (rejects non-numeric → error). `BETWEEN` = two inputs joined by `—`. Enter commits + blur, Esc reverts + blur. `autofocus` makes the in-progress build chip land focused.

### 3. Bare picker API on core form controls

`sd-select`, `sd-date`, `sd-datetime`, `sd-date-range` each gained (additive, **default off**):
- **`[bare]`** → host class `.sd-bare`; `::ng-deep` flattens the `mat-form-field` chrome to a chip-friendly value+caret. `::ng-deep` is required — field internals live in MatFormField's own view, so emulated-scoped child selectors would miss them.
- **`[viewed]`** → renders the read-only `sd-view` text path. Click flips to editable.
- **public `open()`** → opens the control's native picker anchored to its own host.

Used everywhere chips embed a picker (inline completed chips, build chips, chip popover BETWEEN ranges).

### 4. `<sd-operator>` (`components/operator/`)

Reusable operator picker. Collapsed = SVG icon + i18n tooltip; click opens a `matMenu` (icon + label). Two-way `[(model)]` of `Operator`, `operators: Operator[]` input, `disabled`, `autoId`, public `open()`. Adopted in `column-filter` (sd-table) and across query-bar's children.

The shared `OPERATORS` table (with `BETWEEN`) ships in `@sdcorejs/utils` `^1.1.2` — `vn-angular` `package.json` is bumped accordingly. The previous local `SUPPLEMENT` patch in `sd-operator` is removed.

---

## API + naming changes (2026-05-29)

Breaking renames + small API tweaks landed earlier in the branch (`d29a1974`):

- **`SdQueryField.kind` → `SdQueryField.type`** (matches `SdTableColumn.type`). Cascades through `SdQueryFieldKind` → `SdQueryFieldType`, `SD_QUERY_OPERATORS_BY_KIND` → `..._BY_TYPE`, `SD_QUERY_DEFAULT_OPERATOR_BY_KIND` → `..._BY_TYPE`, `SD_QUERY_KIND_ICON` → `SD_QUERY_TYPE_ICON`, plus the `c-field-item-kind` CSS class.
- **Removed `SD_QUERY_OPERATOR_LABEL`** — `<sd-operator>` owns operator labels (i18n via `OPERATORS[].display`).
- **`SdQueryFieldLazyValues.option.search`** typed as `SdSearch<K>` (unified `{type:'SEARCH'|'VALUE', searchText?, value?}` callback). `option.views` deleted.
- **`multiple(op)`** is now arg-required on the parent (no zero-arg form). The child popover owns its own `multiple()` keyed off its staging operator.
- **Saved filters**: `<sd-query-bar [savedFiltersKey]>` persists to `localStorage`.
- **Boolean toggle** uses semantic colours (`success` / `warning`) and a pill-rounded `.c-bool-toggle`.
- **`sd-select` per-option `matTooltip` removed** (`ced3f136`) — option-overlay tooltip swallowed clicks and the panel read it as click-outside.

## Sub-component decomposition (7/7 done — 2026-05-29)

`query-bar.component.ts` started at ~750 LOC; after extraction the parent is ~340 LOC of pure orchestration. Every UI branch lives in a dedicated child with its own spec.

| File | Selector | Responsibility | Commit |
|---|---|---|---|
| `saved-filters-menu.component.*` | `<sd-query-saved-filters-menu>` | Bookmark dropdown + localStorage persistence | `ccd55ecc` |
| `field-picker.component.*` | `<sd-query-field-picker>` | "Add filter" + "Swap field" mat-menus (one component, two modes) | `5de2938a` |
| `popover-chip.component.*` | `<sd-query-popover-chip>` | Popover-mode chip face — `div[role=button]` + nested sd-operator + × | `c8f8c542` |
| `actions-bar.component.*` | `<sd-query-actions-bar>` | Right-pinned toolbar: AND/OR, saved-filters, clear-all, Search | `498d1ffb` |
| `build-chip.component.*` | `<sd-query-build-chip>` | In-progress chip — operator step menu + value step picker, seamless + token branches | `697ef31c` |
| `inline-chip.component.*` | `<sd-query-inline-chip>` | Inline completed chip (non string/number) — owns its own click-to-edit + focusout-to-exit + chipPicker | `2f11ecfd` |
| `chip-popover.component.*` | `<sd-query-chip-popover>` | Popover editor mat-menu — owns operator+value staging + async option loading + commit-on-close | `33d6b21d` |

## Test / build status

- **query-bar suite green** (Karma + ChromeHeadless); full sd-angular suite **2770 SUCCESS / 0 FAILED**. inline-chip + build-chip now delegate ALL non-string/number branches to `[viewed]="'inline'"` (values/lazy/date/datetime/BETWEEN); boolean keeps the chip `#editing` toggle. inline-chip dropped `enterEdit`/`onFocusOut`/`#editing`(values/date/...)/`#cdr`.
- Full `npm run build` runs **clean** (~60-75s); the previous pre-existing `form-generic` error mentioned in earlier handoffs no longer reproduces.
- Entries that build clean: every entry point, including all the new query-bar children.

## Known issues / next steps

- ✅ **`viewed='inline'` rollout complete** — date / datetime / date-range / autocomplete (panel pattern) + input / input-number (borderless variant) all support `[viewed]="'inline'"`. `[bare]` input REMOVED from select/date/datetime/date-range (breaking; `.sd-bare` now driven by `isInline()`). Disabled `'inline'` = static view. Shared `assets/scss/core/_inline-edit.scss` mixins. inline-chip + build-chip fully migrated. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-02-sd-viewed-inline-rollout.md`.
- ✅ **Fixed — inline `values` chip "lost display on close without change":** the bare `sd-select` (and `sd-date`/`sd-datetime`/`sd-date-range`) rendered their own `.sd-clear-btn` ×, which sat next to the trigger and was easy to hit while dismissing the panel → `clear()` committed empty `data` → chip value vanished and stuck (recoverable only by re-selecting). Root cause was the slim clear-button (`06eebb29`). Fix: gate `.sd-clear-btn` on `!bare()` in all four form controls — bare = "value + caret only"; the chip's own `.c-token-remove` owns removal. NOTE: the inline-chip spec resolves `sd-select` from `dist/` (tsconfig `@sdcorejs/angular/* → ["dist/sdcorejs-angular/*", …]`, dist wins), so `npm run build` must run before the inline-chip test sees form-control source changes.
- 🔍 **Visual verification pending** — automated tests cannot assert the UI. Run `ng serve demo` → `/sd-query-bar`, switch to inline, and confirm: values/lazy chips open the native sd-select panel (search + checkboxes), date opens mat-calendar, datetime opens the datetime overlay; bare controls sit flush in the chip; toolbar stays anchored; grey-label/primary-value reads correctly in both modes; saved-filters dropdown saves/applies/deletes; BETWEEN renders one sd-date-range.
- 📋 **E2E / integration specs** not written. Only per-child unit specs exist. Wire e2e against an external host (the `demo` app under `/sd-query-bar`) when scope expands.
- ⌨️ **Keyboard polish**: no `Esc` shortcut to cancel the in-progress build chip; no `/` to focus the search input. Both are nice-to-haves.
- 🔄 **Async items caching**: `values.option.items` async-function variant is loaded once per popover open. Acceptable for current usage; revisit only if a heavy endpoint hurts UX.

## Status

Branch `query-bar`, working tree clean. Decomposition 7/7 complete. Utils 1.1.2 dep + SUPPLEMENT cleanup done. All changes pushed to `origin/query-bar`.
