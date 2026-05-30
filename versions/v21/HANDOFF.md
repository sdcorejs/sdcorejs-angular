�# Handoff � `release/0.0.1` (sessions: 2026-05-29, 2026-05-30)

Resume on another machine � current branch `release/0.0.1`. Working tree may have unrelated WIP (sd-tab, showcase) � coverage commits below are isolated. Coverage commits NOT yet pushed (`992f8792`, `e0ab7ba2` local on `release/0.0.1`).

Latest version: `@sdcorejs/angular` **`19.0.0-beta.104`** (last bump in `c96c1b31`).

## Resume quickly

```bash
git fetch origin
git checkout release/0.0.1
git pull
npm install                # if node_modules missing

npm run build                                                                # full lib (clean as of HEAD)
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless               # full suite
npx ng serve demo                                                            # open /sd-query-bar, /sd-checkbox, etc.
```

> Windows PowerShell host. Run `ng` commands from `vn-angular/`. Don't run `ng build` + `ng test` concurrently (race on `dist/`).
> Demo resolves `@sdcorejs/angular/*` from `dist/sdcorejs-angular` first (root `tsconfig.json` paths). After editing a lib component, rebuild the lib entry before the demo picks it up.

---

## What this session shipped (chronological, ~20 commits on `release/0.0.1`)

### query-bar � UX polish + structure refactor

| Commit | Scope |
|---|---|
| `9eeff778` | `core.operator.between.display` i18n key across en/vi/ja/ko/zh + datetime auto-skip operator step (default BETWEEN) + multi-select panel close guard (cdk-overlay-container check) + popover `hideInlineError` on value controls. |
| `5444ae86` | `saved-views` �  `saved-filters` rename: API (`showSavedFilters`, `savedFiltersKey`, `SdSavedFilter`, `(applyFilter)`, `onApplyFilter`), class, selector, storage key, wording (vi: "B�" lọc �ã lưu", "Lưu b�" lọc hi�!n tại", "Chưa có b�" lọc nào"), icon `play_arrow` �  `filter_alt`. **BREAKING for hosts**. |
| `ccba17e5` | Inline BETWEEN viewed-text race fix (exit edit sync when both range ends present + microtask CD reschedule) + boolean badge overflow (smaller padding + rounded + height fit). |
| `27b545e3` | Boolean toggle native button (drops `<sd-button>` � height 18/20px vừa chip; outline state + active fill via `.c-bool-true` / `.c-bool-false` / `.c-bool-active`). |
| `b7356a38` | Saved-filters layout reorder: `[AND/OR, clear-all, savedFilters, search]` � dropdown sát Search. Standalone `.c-save-filter` xóa; footer "Lưu b�" lọc hi�!n tại" về trong mat-menu (sau `.c-sf-divider`). Row alignment fix: `gap:8px`, `min-height:40px`, `padding:0 12px 0 16px`. |
| `d9ffc2cb` | � button flush right: force `display:flex` vào `.mat-mdc-menu-item-text` span (Material 19 default ch�0 có `flex:1`, không `display:flex` �  `margin-left:auto` không hi�!u lực). Padding-right row 12px �  4px. 28�28 hit target. |
| `746464b2` | � icon centered inside hover circle: kill leaked `margin-right: 12px` từ `.mat-mdc-menu-item .mat-icon` base rule. Scoped `margin: 0 !important` + 16�16 box + `line-height: 16px` + `text-align: center`. |
| `f974b3ba` | Unify label� value gap trên inline string/number chip: label `padding-right: 0`, input `padding-left` = single source of gap (4/6px). Bỏ double-padding (8px) �  spacing ��ng nhất v�:i gap n�"i b�" label. |
| `e0c13cc2` | **Structural refactor:** m�i sub-component của query-bar �ược nest vào `src/components/<name>/` (8 children: actions-bar, build-chip, chip-popover, field-picker, inline-chip, inline-value-chip, popover-chip, saved-filters-menu). Parent `query-bar.component.*` �x root vẫn vậy. |

### forms � color binding + viewed mode + tooltip cleanup

| Commit | Scope |
|---|---|
| `4abb1f73` / `58bb1eab` | `viewed` mode cho switch/checkbox (i18n `core.form.switch.{on,off}` + `core.form.checkbox.{checked,unchecked}`) + `sd-has-label` host class gating `padding-top: 4px` + sd-input `[tooltip]` cleanup (suffix-icon + `.sd-form-tooltip` shell xóa). |
| `87782874` | Color binding via host class `.sd-c-<x>` (switch, checkbox, radio): thay `[attr.data-sd-color]` proxy bằng `[class.sd-c-primary]` etc. + single `--sd-c` var + default fallback primary. Fix bug "luôn Ēn màu success". |
| `c1f8023c` | Override BOTH `--mat-*-selected-*` AND `--mdc-*-selected-*` token tiers cho switch/checkbox/radio v�:i `!important`. Material 19 dùng song song 2 b�" token; theme set `.mat-accent` �x (0,2,0) �è qua tier `mat-*`. |
| `2b89de20` | Radio specific token names (theme set `--mat-radio-selected-icon-color` family, không phải `--mat-radio-checked-state-layer-color`). Override 5 mat-radio tokens + 1 mdc dual. |

### button + upload-file

| Commit | Scope |
|---|---|
| `87a22fa5` | sd-button: `white-space: nowrap` + `text-overflow: ellipsis` trên `.c-title` + `min-width: 0` trên flex wrapper. Long text �  1 dòng + `⬦` thay vì xu�ng dòng cắt height. |
| `35db098a` | sd-upload-file required validator wire via `effect()` (was commented out). `Validators.required` nhận empty array là invalid. |

### release + coverage

| Commit | Scope |
|---|---|
| `c96c1b31` | Version bump `@sdcorejs/angular` beta.103 �  beta.104. |
| `146be8c5` | Test coverage batch 1+2: 12 spec files / 120 tests cho utilities (color, detect-incognito), forms/models (sd-form-control, sd-custom-validator), components/history (view-date pipe, history component), services (api-interceptor, toast, toast-container, dialog-confirm, pandoc-core), anchor-item. |
| `992f8792` | Test coverage **batch 3+4**: 7 new specs (anchor-nav, base-secure, section-item, 4 form-def directives) + extend avatar/badge/view branches (+26 tests). |
| `e0ab7ba2` | **fix(test)**: anchor IntersectionObserver mock rewrite � replace `jasmine.createSpy` with real constructor function. Removes "target is not a constructor" flaky in 5 SdAnchor specs. |

Whole-lib coverage after `e0ab7ba2`:
   - Statements: **68.19%** (�  from 67.92%)
   - Branches: **52.02%** (�  from 51.69% � **now crosses 52% global gate**)
   - Functions: **70.10%** (�  from 69.72%)
   - Lines: **69.32%** (�  from 69.07%)
   - Suite: **2531 SUCCESS / 0 FAILED** (was 2494 SUCCESS / 5 FAILED).

---

## Open follow-ups (resume here)

### 1. Test coverage � batch 3+4 SHIPPED, what's next

**DONE (this session):**
- �S& anchor-nav, base-secure, section-item, 4 form-def directives (batch 3, `992f8792`)
- �S& Extended avatar/badge/view to push branch gate over 52% (batch 4, `992f8792`)
- �S& Fixed 5 SdAnchor flakies via IO mock rewrite (`e0ab7ba2`)
- �S& `forms/label/src/label.component.ts` � spec already existed with good cov, skipped

**Skipped � already complete:**
- `quick-action` � source <10 lines, existing spec already exhaustive.

**Candidates if pushing further (none blocking):**
- `components/<x>/<x>.component.ts` files still showing <80% in `coverage/sd-angular/index.html`.
- Currently-deferred dirs (still off-limits per heavy/complex): `query-bar/*`, `table/*`, `chart/*`, `editor/*`, `mini-editor/*`, `code-editor/*`, `modal/*`, `side-drawer/*`, `upload-file/*`, `splitter/*`, `tab-router/*`, `import-excel/*`, `document-builder/*`, `form-generic/*`, `query-builder/*`, `autoid-inspector/*`, `operator/*`.
- `preview/*` no longer flaky (111/111 SUCCESS isolated) � earlier handoff note about ~55 preview failures was stale; current state clean.

### 2. Flakies � RESOLVED

- �S& `SdAnchor` (~5) � fixed by `e0ab7ba2` (jasmine spy �  plain constructor).
- �S& `SdPreviewPdf` (~55) � no longer reproducing in current commit. Earlier handoff note from `146be8c5` may have referenced a stale baseline; the suite is 111/111 SUCCESS now both isolated and in full-suite.

### 3. Visual verification of session UX changes � pending in demo

Run `ng serve demo` and check:
- `/sd-query-bar` inline mode: BETWEEN viewed text updates on first focusout, boolean chip toggles vừa height, savedFilters dropdown sát Search, `�` flush right + centered in hover circle, label� value gap ��ng nhất.
- `/sd-checkbox`, `/sd-switch`, `/sd-radio`: change `[color]` input �  render reflects (not stuck on green).
- `/sd-button`: long text �  1 line + `⬦`.
- `/sd-upload-file`: `[required]=true` �  error message renders on touch.

### 4. Known limitations (NOT bugs � by design)

- `detect-incognito.ts` test only covers Chrome branch (Safari/Firefox/MSIE branches gate on `eval.toString().length` per-engine constant � unreachable from ChromeHeadless without prototype patching).
- `pandoc-core.spec.ts` stubs `WebAssembly.instantiate` � covers wrapper contract only, not actual pandoc conversion (needs real WASM blob).

---

## Project layout (current state � `projects/sdcorejs-angular/`)

### Stack & conventions

- Angular 19, standalone, signals-first (`input()` / `model()` / `output()` / `computed()` / `signal()` / `viewChild()` / `afterNextRender()`). No NgModules. OnPush.
- Native control flow in templates: `@if` / `@for` (with `track`) / `@let`. No `*ngIf`/`*ngFor`.
- Each component is its own secondary entry point (`ng-package.json` + `index.ts`). Wildcard tsconfig path: `@sdcorejs/angular/* �  projects/sdcorejs-angular/*`.
- i18n: all user-facing strings through `inject(I18nService).t('core.<scope>.<key>')`. Locale files: `i18n/src/{en,vi,ja,ko,zh}.ts`.
- Comments: Vietnamese `// why:` for tricky logic (team preference).
- TDD required for components under `components/` and `forms/` (full unit + integration, not happy-path only). Red �  Green �  Refactor.
- **Doc rule (codified in `CLAUDE.md`)**: per-component `.md` + relevant `HANDOFF.md` MUST update in the same commit as code changes. Strict.

### Commands

- Build (real gate): `npm run build` (~60�160s).
- Test (single spec): `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>'`.
- Test (coverage): `npm run test:ci`.
- i18n parity: `npm run check:i18n-parity`.

### Where to look when⬦

| Symptom | File |
|---|---|
| Query-bar chip face wrong (popover mode) | `components/query-bar/src/components/popover-chip/popover-chip.component.*` |
| Query-bar popover editor branch wrong | `components/query-bar/src/components/chip-popover/chip-popover.component.html` |
| Query-bar inline chip edit mode broken | `components/query-bar/src/components/inline-chip/inline-chip.component.*` |
| Query-bar build flow broken | `components/query-bar/src/components/build-chip/build-chip.component.*` + parent `beginBuild` / `pickBuildOperator` |
| Seamless string/number input | `components/query-bar/src/components/inline-value-chip/inline-value-chip.component.*` |
| Saved-filters menu | `components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.*` |
| AND/OR / Search / Clear / Save-filter trigger | `components/query-bar/src/components/actions-bar/actions-bar.component.*` |
| Field picker (add or swap) | `components/query-bar/src/components/field-picker/field-picker.component.*` |
| switch/checkbox/radio color stuck on accent | `forms/<name>/src/<name>.component.scss` � both `--mat-*` AND `--mdc-*` token tiers |
| sd-input tooltip suffix-icon | removed (`58bb1eab`); use native `[matTooltip]` on wrapper |
| sd-button long text wrapping | `components/button/src/button.component.scss` `.c-title` |
| sd-upload-file required not firing | `components/upload-file/src/upload-file.component.ts` � validator effect |

---

## Suggested next-session prompt (test coverage batch 3)

If next session is "continue test coverage push", spawn an agent with:

```
Add .spec.ts files for the following (write SPECS ONLY, never touch source). Each spec �0�80% line coverage:

1. components/anchor/src/components/anchor-nav/anchor-nav.component.ts
2. components/base/src/base-secure.component.ts
3. components/section/src/section-item/section-item.component.ts
4. forms/label/src/label.component.ts
5. forms/directives/src/{item-def,label-def,suffix-def,view-def}.directive.ts � smoke specs

Use `setInput()` from projects/sdcorejs-angular/testing/test-utils.ts.
Convention reference: components/operator/src/operator.component.spec.ts.

Verify with:
  npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/{components,forms}/**/*.spec.ts'

Skip files with pure types / no runtime.
Do NOT modify source. Do NOT commit.
```

Then orchestrator commits with `SM-00: test(coverage): batch 3 � ⬦`.

---

## Status

Branch: **`release/0.0.1`** (tracks `origin/release/0.0.1`).
Latest local HEAD: `e0ab7ba2` (NOT YET PUSHED � coverage batch 3+4 + IO fix).
Latest pushed: `146be8c5` (batch 1+2).
Latest version: `@sdcorejs/angular` `19.0.0-beta.104`.

Build clean. Full suite **2531 SUCCESS / 0 FAILED**. Coverage branch gate **52.02% �0� 52%** �S&.

Working tree may contain unrelated WIP (sd-tab component scaffold, showcase project, .sdcorejs/ specs+plans) untouched by this session � verify before pushing.

---

## Session 2026-05-29 � new components + showcase scaffold

Branch base: `release/0.0.1` (continued after `e0ab7ba2`). Latest local HEAD when this section was written: see `git log -1`.

### New library entries

| Entry | Purpose | Tests |
|---|---|---|
| `@sdcorejs/angular/components/tab` | `<sd-tab-group>` + `<sd-tab>` � declarative tabs wrapping mat-tab-group. Inputs: `selectedIndex` (model), `variant` (`'line' \| 'pills' \| 'segmented'`), `color` (SdColor), `stretchTabs`, `alignTabs`, `headerPosition`, `animationDuration`, `disableRipple`, `dynamicHeight`, `autoId`. Per-tab: `label` (required), `icon`, `badge`, `disabled`, `closable`. Lazy content via `matTabContent` + `ngTemplateOutlet`. Bounds clamp effect. | **58 specs** |
| `@sdcorejs/angular/components/stepper` | `<sd-stepper>` + `<sd-step>` wrapping mat-stepper / CdkStepper. Inputs: `selectedIndex` (model), `linear`, `orientation` (h/v), `labelPosition`, `headerPosition`, `animationDuration`, `disableRipple`, `color`, `autoId`. Per-step: `label` (required), `icon`, `optional`, `editable`, `stepControl`, `state`, `errorMessage`. Methods: `next/previous/reset/goTo`. Bounds clamp. | **26 specs** |
| `@sdcorejs/angular/components/ckeditor-styles` | `<sd-ckeditor-styles>` � empty-render component owning the global CKEditor 5 CSS. ViewEncapsulation.None scoped to this wrapper; embed inside any component that hosts CKEditor (currently only `<sd-editor>`). Lazy: CSS travels with the consuming component's chunk, not global. | � |
| `@sdcorejs/angular/forms/input-color` | `<sd-input-color>` � hex color field composing `<sd-input>` + suffix swatch + hidden native `<input type="color">`. Inputs forward sd-input set + `placeholder` default `'#RRGGBB'`. Hex pattern validator built-in; exports `SD_INPUT_COLOR_HEX_PATTERN`. Two computed: `pickerSafeValue` (canonicalize for picker), `swatchColor`, `canClear`. Clear button (X) renders when value exists + not required + editable. | **30 specs** |

### Editor wired to ckeditor-styles wrapper

`projects/sdcorejs-angular/components/editor/src/editor.component.{ts,html}` � added `<sd-ckeditor-styles />` at top of template + `SdCKEditorStyles` to component `imports[]`. Consumers no longer need `@sdcorejs/angular/assets/scss/ckeditor5.scss` in their `angular.json` `styles[]` for the editor to render correctly. **mini-editor + document-builder NOT yet migrated** � they still rely on the global import path. Showcase has a local SCSS shim (`projects/showcase/src/app/shared/ckeditor-styles.scss`) bridging mini-editor + document-builder via per-demo `styleUrl` + `ViewEncapsulation.None` until they're migrated.

### Showcase project (new)

Directory: `projects/showcase/`. Standalone Angular 19 app for visually exercising every component in `@sdcorejs/angular`. Run with `npm run showcase`.

- Shell with sidebar: 3 groups (Components / Forms / Services), collapsible, search filter
- Landing: hero + grid card per group
- 47 demo pages, all lazy-loaded routes
- Each demo wrapped in `<demo-page title=... description=...>` + `<demo-section heading=...>` (shared at `projects/showcase/src/app/shared/demo-page.component.ts`)
- Demos focus visual capability � no property tables / code blocks (intentionally different from `portal-template`)
- angular.json target `showcase` with budgets 1.5MB/3MB initial; `stylePreprocessorOptions.includePaths: ["dist", "node_modules"]` to resolve the temporary CKEditor SCSS shim until mini-editor + document-builder embed `<sd-ckeditor-styles>` themselves
- `package.json` adds `npm run showcase` script

### Spec + plan snapshots (`.sdcorejs/`)

- `.sdcorejs/specs/angular-portal/2026-05-29-14-00-sd-tab.md` � approved sd-tab spec (also kept at `docs/superpowers/specs/2026-05-29-sd-tab-design.md` per existing convention)
- `.sdcorejs/plans/angular-portal/2026-05-29-14-30-sd-tab.md` � approved sd-tab implementation plan

### Outstanding follow-ups

- Migrate **mini-editor** + **document-builder** to embed `<sd-ckeditor-styles>` (same single-line edit as editor); then delete `projects/showcase/src/app/shared/ckeditor-styles.scss` + remove `styleUrls`/`encapsulation` from mini-editor-demo + document-builder-demo + drop `stylePreprocessorOptions.includePaths` from showcase target
- Write docs: `projects/sdcorejs-angular/components/stepper/sd-stepper.md` (parallel to `sd-tab.md`)
- Wider portal/demo migration: drop `@sdcorejs/angular/assets/scss/ckeditor5.scss` from consumer `angular.json` `styles[]` once all 3 editor components self-host their CSS � coordinate via CHANGELOG entry as a breaking change for downstream
- Showcase: existing demos generated by parallel agents may have rough edges in heavier components (chart, document-builder, query-bar) � verify each visually

### Build state

- `npm run build` � clean (53s)
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/components/tab/**/*.spec.ts'` �  58/58
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/components/stepper/**/*.spec.ts'` �  26/26
- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/forms/input-color/**/*.spec.ts'` �  30/30
- `npx ng build showcase --configuration=development` � clean (~7s after lib built); 100+ lazy chunks


