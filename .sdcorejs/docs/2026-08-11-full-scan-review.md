# `@sdcorejs/angular` — Full Scan Review (v19 as canonical)

**Date:** 2026-08-08 · **Commit:** `25480b6` (main, clean) · **Reviewed:** `versions/v19/projects/sdcorejs-angular`

**Scope measured:** 649 source `.ts` (58,265 LOC) · 226 spec `.ts` (47,865 LOC) · 163 `.html` · 168 `.scss` · 98 `.md` · 94 published entry points.

**Method:** 10 parallel area audits (forms, heavy components, remaining components, services, auth/security modules, packaging, tests, docs, a11y, theming) + 4 tool gates run locally. Every CRITICAL below was independently re-verified by hand against the file.

---

## 1. Verdict

| Dimension | Grade | One-line |
| --- | --- | --- |
| Architecture & conventions | **A−** | Signals-first, standalone, 94 secondary entry points, OnPush — genuinely modern and consistent |
| Test suite volume | **B+** | 3,950 specs green, 226 spec files, 82% of source LOC mirrored in tests |
| Test suite *trustworthiness* | **D** | Not run by CI, dist-shadowed paths, 19 self-stubbed assertions, 9 silently-skipped |
| Correctness (runtime bugs) | **C** | 3 recurring bug classes still live after being "fixed" once each |
| Packaging / consumability | **D−** | Primary entry point exports nothing; 6 undeclared peer deps; `sideEffects` flag is factually false |
| Security | **C−** | No stored tokens, but bearer-token egress via substring match + an unconditional sanitizer bypass |
| Accessibility | **F** | `aria-hidden="true"` on 10 real `<input>` elements; no focus trap in drawer; ESC can't close modal |
| Documentation | **B** | 98 docs, README in sync, zero mojibake — but a removed base class is still documented in 5 places |
| Bundle discipline | **F** | 16.32 MB tarball; one component is 29% of it; nothing measures size |

**Bottom line:** the *inside* of this library is good — the composition patterns, the signal discipline, the connector abstraction in `forms/models`, the test volume. The *edges* are not shipped-ready: what a consumer installs, what a screen reader hears, what a bundler keeps, and what CI actually verifies are all broken or unverified. None of the 9 release blockers below are architectural; all are bounded fixes.

---

## 2. Tool gates (measured locally, not estimated)

| Gate | Result |
| --- | --- |
| `npm run check:sync` | **PASS** — v20, v21 match v19 |
| `ng build sdcorejs-angular` (v19) | **PASS** — 44.1s, 94 entry points, 0 errors |
| `ng test` (v19, ChromeHeadless) | **PASS** — `TOTAL: 3950 SUCCESS`, 3,959 defined, **9 skipped** |
| `npm run lint` (v19) | **FAIL — exit 1**, 6 errors on a clean `main` |

Lint errors on `main` (5 prettier + 1 real):
```
components/preview/src/preview-pdf/preview-pdf.pdfjs.ts:99   prettier/prettier
components/table/src/services/table-export/table-export.service.ts:53   prettier/prettier
forms/date-range/src/date-range.component.spec.ts:580   prettier/prettier
forms/date-range/src/date-range.component.ts:24   prettier/prettier
forms/date/src/date.component.ts:50   'DATE_DISPLAY_FORMAT' is defined but never used
modules/layout/index.ts:4   prettier/prettier
```
`npm run lint:release` is a documented pre-release step and it is red **right now**. Fix: `ng lint --fix` + delete the unused import.

The 9 skipped specs are all `services/license/src/license.service.spec.ts` — they self-`pending()` because Chrome forbids redefining `window.location`. Karma reports the file as passing. Every non-localhost license enforcement branch is untested.

---

## 3. Release blockers (verified by hand)

### B1 — The primary entry point exports nothing
`src/public-api.ts` is 10 bare side-effect `import` statements and **zero** `export`:
```ts
import '@sdcorejs/angular/configurations';
import '@sdcorejs/angular/utilities';
...
```
Built proof: `dist/sdcorejs-angular/fesm2022/sdcorejs-angular.mjs` is **517 bytes** with no `export` statement. So `import { SdButton } from '@sdcorejs/angular'` resolves to nothing, for every symbol, in every published version since this file was written. Only deep imports work.

**Fix:** change all 10 lines to `export * from '...'`, or delete the primary entry point and make deep-import-only explicit in the README.

### B2 — `@angular/router` and `@angular/animations` are used but declared nowhere
33 non-spec files import `@angular/router`; `components/table/src/table.component.ts:1` imports `@angular/animations`. Neither is in `dependencies` or `peerDependencies`, and neither is a transitive peer of `@angular/core` or `@angular/material`. A clean `npm i @sdcorejs/angular @angular/material` app gets module-not-found on the most-used component in the library.

Also resolving only by accident (transitive peers of `@angular/material`): `rxjs` (131 imports), `@angular/platform-browser` (125), `@angular/forms` (110), `@angular/cdk` (26, across 9 subpaths).

**Fix:** declare all 6 in `peerDependencies` with `^19.0.0 || ^20.0.0 || ^21.0.0`.

### B3 — `"sideEffects": false` is factually false
`package.json:35` claims no side effects. Verified module-scope side effects:
- `Chart.register(...registerables)` at module scope in **4** files (`bar-chart:15`, `doughnut-chart:4`, `line-chart:15`, `pie-chart:4`)
- **5** bare side-effect imports `import 'prismjs/components/prism-*'` (`code-editor.component.ts:20-26`)
- `SdCKEditorStyles` global CSS injection

A bundler is *licensed* to drop these. Failure mode is production-only and silent: `"bar" is not a registered controller`, or every code block downgrading to plain markup. Nothing in the pipeline would catch it.

**Fix:** `"sideEffects": ["**/chart/**", "**/code-editor/**", "**/ckeditor-styles/**"]`, or move registration into the component/a `provideSdChart()`.

### B4 — Bearer token leaks to any host whose URL contains the route substring
`modules/keycloak/keycloak.interceptor.ts:16`:
```ts
const isSecure = config.secureRoutes?.some(route => req.url.includes(route));
```
Unanchored substring, no host allowlist. With the documented example `secureRoutes: ['/api/v1']`, a request to `https://analytics.thirdparty.com/api/v1/collect` receives `Authorization: Bearer <access_token>`.

Same idiom, same class, 8 other sites — `path.includes('http')` used as a scheme check before `window.open` in 6 sidebars, and a dead both-branches-identical ternary at `modules/layout/pipes/menu.pipe.ts:46` where URL validation was clearly intended.

**Fix:** one shared helper doing `new URL(url, origin)` and matching `origin` + pathname prefix against an explicit allowlist; treat relative URLs as same-origin.

### B5 — `sdSafeHtml` is an unconditional sanitizer bypass, and the table feeds it server data
`pipes/src/safe-html.pipe.ts:25` — `return this.sanitizer.bypassSecurityTrustHtml(html);` with no sanitize step, ever.

It is not hypothetical: `components/table/src/components/desktop-cell/view/view.component.html:24,32,50,57,70` pipes row cell values through it. Any attacker-influenced cell value is stored XSS in the consumer's app.

`services/notify` already does this correctly (`DomSanitizer.sanitize(SecurityContext.HTML, …)` + explicit `html: true` opt-in, per CHANGELOG #22). That fix never propagated to the pipe.

**Fix:** sanitize by default; make the bypass an explicit second argument, mirroring the notify pattern.

### B6 — Core form controls are focusable but invisible to screen readers
`aria-hidden="true"` is applied to **13 natively focusable elements**, including **10 real `<input>`s**. Hand-verified at `forms/input/src/input.component.html`:
```html
45:    aria-hidden="true">          <!-- wrapper div, also has (click) -->
63:          aria-hidden="true"     <!-- the actual <input> -->
```
Same at `select:129,269`, `date:73`, `datetime:74`, `date-range:79,94`, `input-number:65`, `autocomplete:75`, `input-color:34`. The wrapper case is worse: it removes the label, the input, `mat-error` and the clear button from the a11y tree in one attribute.

The pattern is being used to silence `click-events-have-key-events` / `interactive-supports-focus` lint rules. It accounts for 22 of 42 keyboard-unreachable controls. This is WCAG 2.1 AA 4.1.2 failure on the library's most-used surface, and it makes the a11y tree *worse* than doing nothing.

**Fix:** delete every `aria-hidden` on a focusable element or a container of one; fix the underlying markup (real `<button>`, real `tabindex` + key handler).

### B7 — Modal can't be closed with ESC, by default
`components/modal/src/modal.component.ts`:
```
68:  disableBackdropClose = input(true, …)              // defaults TRUE
119: disableClose: this.disableBackdropClose() || …     // so always true
190: if (!this.beforeClose() || this.disableBackdropClose()) return;   // ESC fallback bails
```
Both the Material path and the hand-rolled ESC fallback are gated on the same flag that defaults to `true`. Default-configured modals are keyboard-inescapable (WCAG 2.1.2 No Keyboard Trap).

`components/side-drawer/src/side-drawer.component.ts:82` compounds it: portalled to `document.body` with **no focus trap, no focus restore, no `role="dialog"`, no ESC**.

**Fix:** separate the backdrop-click flag from the ESC flag; use CDK `ConfigurableFocusTrap` for the drawer.

### B8 — 4.7 MB (29% of the package) is one PDF viewer
`components/preview/src/preview-pdf/pdf-worker-inline.generated.ts` is a **1,398,249-byte** single string literal, statically imported at `preview-pdf.pdfjs.ts:5`. It triplicates into the bundle, the sourcemap, and a 1,365 KB `.d.ts` that isn't even reachable from `components/preview/index.d.ts`.

Measured `dist/` (951 files, **16.32 MB** total):
```
1,698 KB  components-preview.mjs.map
1,640 KB  components-preview.mjs
1,413 KB  components-upload-file.mjs      ← 86 base64 PNGs inlined via content: url(...)
1,365 KB  pdf-worker-inline.generated.d.ts
  781 KB  components-form-generic.mjs
```
Compounding: `components/preview/index.ts:3` re-exports both the image *and* PDF viewer, so `<sd-preview-image>` users pay all of it. 6.10 MB (37%) of the tarball is `.mjs.map`. All 5 i18n locales (189 KB) load eagerly for anyone importing any of 55 components.

**Fix:** ship the worker as an asset + runtime blob; split `preview-image` / `preview-pdf` entry points; icon font instead of 86 PNGs; add a per-entry-point size assertion to CI.

### B9 — GPL-2.0 code vendored into an MIT package
`services/docx/src/lib/pandoc-core.ts:2-10` — the header states it is "a local copy of the environment-agnostic pandoc core", "adapted from pandoc-wasm/src/core.js", `Source: https://github.com/pandoc/pandoc-wasm (GPL-2.0-or-later)`. `package.json:4` declares `"license": "MIT"`.

Separately, `docx.service.ts:21` fetches `https://pandoc.github.io/pandoc-wasm/pandoc.wasm` at runtime — unpinned, no integrity check — then `WebAssembly.instantiate`s it over user documents. That's a third-party supply-chain RCE path in a UI library.

**Fix (legal, needs a decision):** relicense, depend on the GPL package at runtime rather than vendoring, or drop the `services/docx` entry point. Worth a lawyer's 10 minutes before the next tag.

---

## 4. Systemic bug classes — each fixed once, never swept

This is the most important section. Three defects were found, root-caused, documented in CHANGELOG, and fixed **at the single site that crashed** — while every sibling site was left live.

### C1 — `setValue(v, { emitEvent: false })` freezes the error message under OnPush
CHANGELOG #24/#25/#26 document this three times. The mirrored validation control's async `setErrors` completion is suppressed → `sdFormControlState` never ticks → OnPush never re-renders → red outline with no message.

Still live:
- `forms/input/src/input.component.ts:461` — `clear()`
- `forms/input-number/src/input-number.component.ts:434` — `clear()`, **directly contradicting the `why:` comment at 412-418 in the same file**
- `forms/autocomplete/src/autocomplete.component.ts:554` — `clear()`, contradicting its own comment at 482-486
- `forms/date-range/src/date-range.component.ts:293,356,367` — *every* write, so `errorMessage`, `data-invalid`, `data-value`, `data-empty` are all frozen at first render

The `#onChange` path was fixed. The `clear()` path — the same code, one method over — was not.

### C2 — Fresh array/object allocated per change-detection pass, bound as `[input]`
CHANGELOG #23(c) documents the OOM: `[items]="booleanItems(f)"` → new array each CD → `sd-select`'s `toObservable(items)` calls `markForCheck()` → new CD → infinite loop. Fixed by memoizing `#booleanOptionsByKey`.

**One live reproduction of the exact same crash:** `components/query-builder/src/query-builder.component.html:251` — `[items]="fieldOf(rule)!.values || []"`. `values?` is optional on the field type, so any `type:'values'` field declared without `values` hits the identical loop.

Non-crashing but per-CD-churning: `sdQueryAllowedOperators` default branch (`query-bar.model.ts:228`), `groupContext()` (`table.component.html:277`), `rowStyle()` (`table.component.html:453`), `createContext()` (`org-chart.component.html:17`).

### C3 — Promise APIs that only settle on the happy branch
Same shape, three unrelated services, each pinning the caller's closure for the session:
- `services/confirm/src/lib/confirm.service.ts:45,89,139,191,240,291` — all six methods only settle on a truthy `afterClosed()`; ESC / backdrop / programmatic `close()` leaves the promise **permanently pending**
- `services/docx/src/lib/docx.service.ts:63` — listens only for `change`; cancelling the OS file dialog never settles, and `sd-docx.md:24` explicitly promises it resolves `null`
- `utilities/extensions/src/utility.extension.ts:100` — **hand-verified**: `resolve(files)` sits *inside* the `for` loop (line 101 closes it), so a multi-file upload settles on the first file and later files' extension/size validation is silently swallowed

### C4 — Teardown is per-component convention, not enforced
No shared base, no lint rule. Result is bimodal — `inform` (ResizeObserver via `effect(onCleanup)`), `anchor`, `breadcrumb` (`takeUntilDestroyed`) are exemplary; meanwhile:
- `components/modal/src/modal.component.ts:131` — **no `ngOnDestroy` at all**; the `MatDialogRef` is never closed on destroy → orphaned overlay
- `components/upload-file/src/upload-file.component.ts:278-290` — 4 anonymous drag listeners on a *consumer-supplied* element, never removed; the element outlives the component and keeps it alive
- `services/notify/src/notify.service.ts:34` — root service creates a body `ComponentRef` in its constructor, never destroys it
- 11 uncleared `setTimeout`s across `forms/**`, 2 of which call `detectChanges()` → `ViewDestroyedError` on fast unmount
- `components/modal-resizable`, `components/document-builder` — timers surviving destroy

### C5 — Every optional config token degrades to a permissive default
A consumer who forgets one provider gets a UI that looks correct and enforces nothing:
- `modules/auth/guards/auth.guard.ts:15` + `portal.guard.ts:15` — `canActivate` returns `true` when the guard callback is unset
- `modules/permission/src/services/permission.service.ts:119` — `hasPermission('')` → `true`, and `permission.guard.ts:26` feeds it unchecked route data (a typo'd `data` key grants access)
- `modules/layout/pipes/menu.pipe.ts:80` — a menu entry with a typo'd `permision` key renders for everyone
- `modules/layout/services/layout.service.ts:35` — missing config → mock `demo@example.com` signed-in user behind a `console.warn`
- `modules/auth/services/auth.service.ts:39` — unconfigured → synthetic authenticated `guest@gmail.com` used as `initialValue`

### C6 — Root singletons cache identity/authorization with no reset hook
State survives signout and bleeds into the next user in the same tab:
- `permission.service.ts:19` — `#loadedKeys` short-circuits reload; no `reset()`. Grants also mirrored to sessionStorage under a fixed UUID (`212a51fa-…`) — readable and *writable* by any script on the origin
- `interceptors/unauthorized/unauthorized.interceptor.ts:11` — `#unauthorizedHandled` latch set on first 401, never reset → session-expiry stops forcing signout after a re-login
- `modules/layout/services/storage/storage.service.ts:16` — pinned/recent menus under fixed UUIDs, no user namespace, no clear-on-signout → user B sees user A's navigation history

---

## 5. Test suite: high volume, low trust

3,950 green specs is real work. But:

| Problem | Evidence |
| --- | --- |
| **CI never runs it** | `.github/workflows/publish-npm.yml:42` — publish path is `check:sync` → install → build → publish. Zero test jobs. |
| **Specs test the last *build*, not the source** | `versions/v19/tsconfig.json:19` maps `@sdcorejs/angular/*` to `dist/` **before** source. 59 spec files + 215 source files import that way; 121 symbols load from both copies in one bundle. CLAUDE.md #14 already documents being burned by this. |
| **19 assertions test the spec's own code** | `services/excel/…spec.ts:173` and `services/docx/…spec.ts:47` `spyOn` the SUT method and assert the fake. Two published services, ~19 `it()` blocks, zero library code executed. |
| **9 specs silently skipped** | `services/license/…spec.ts:104` — `pending()` × 9. Karma prints SUCCESS. |
| **Coverage % is measured on 52% of files** | Reported 76.68% statements / 65.45% branches — over 340 of 649 files. 98 executable files never load, so they're invisible rather than 0%. `karma.conf.js:49` thresholds are consequently meaningless; adding a test to an uncovered area *lowers* the number. |
| **OnPush reactivity untested** | 1,967 forced `detectChanges()` vs **3** `autoDetectChanges()`. Forced CD is exactly what masked the `sd-upload-file` bug in #25. |
| **Non-replayable** | Random order, no pinned jasmine seed. |

**Zero-coverage published entry points:** `components/document-builder` (40 files, incl. 14 untrusted-HTML paste filters), `components/chart` (4 components), `components/ckeditor-styles`, `configurations` (`SD_CORE_CONFIGURATION`), `models`.

---

## 6. Public API stability — the trap the versioning scheme sets

The tag format `^\d+\.\d+$` locks the major digit to the Angular line. **Breaking changes cannot be signalled by the version number.** So every deferred rename gets permanently more expensive. Current backlog:

- `MatPaginatorIntlCro` (`table.component.ts:102`) — a **Croatian** locale copy-paste artifact, permanently public
- pipe named `translate` (`i18n/src/i18n.pipe.ts:5`) — head-on collision with `@ngx-translate/core`'s pipe; a consumer using both cannot import them in the same component
- `SidebarV2Component` / selector `sidebar-v2` (+ v3, mobile-v1/2/3) — no `Sd`/`sd-` prefix, will collide in consumer apps
- PascalCase *functions* exported publicly: `GenerateId`, `GetAttributes`, `EvaluateExpression`, … (`form-generic-component.model.ts:49`) — read as constructors
- 20-symbol `qb*`/`QB_*` namespace instead of `sd*`/`SD_*`
- 98 of 325 public runtime exports (30%) break the naming convention
- 40 `@deprecated` shims in `utilities/` awaiting a major that can never arrive
- Output naming drift: 30 `sdChange` / 16 `modelChange` / unprefixed `close`,`remove`,`apply`,`search`; `loadError` and `sdLoadError` coexist for the same event
- 177 generics defaulting to `any`; 619 `any` across 156 of 617 public `.d.ts`. Worst: `table-filter.model.ts` (23 `any` — the table's public filter state is `Record<string, any>` end to end), all 22 `tree.model.ts` types are `<T = any>`, `input-number` exposes `model<any>` on a *numeric* control

Also dead weight in the published surface: `@omer-go/docx-parser-converter-ts` is a hard runtime dependency with **0 imports anywhere** (verified); `services/excel/src/test.ts` is a Karma bootstrap using `zone.js/dist/zone` paths that haven't existed since zone.js 0.11; `modules/generic/` is 15 files / 119 KB of unreferenced code (and carries a real mass-assignment bug at `generic.service.ts:126` — `create` builds a filtered `req` then calls `register.create(entity)` with the *unfiltered* object).

---

## 7. i18n & docs

**i18n is split down the middle.** Key parity is clean — 525 keys × vi/en/ja/ko/zh, no missing, no dupes. But adoption is inconsistent:
- Compliant: `table` (31 uses), `form-generic` (287)
- **Zero adoption:** `query-bar` (0 uses — and it *injects* `I18nService` at `query-bar.component.ts:79` and never calls it), `query-builder` (0), `tree` (1)
- Hardcoded Vietnamese in shipped components: `'Tìm kiếm...'`, `'Thêm filter'`, `'Xóa tất cả'`, `'Ngày cụ thể'`, `'Đã ghim'`, `'Có'/'Không'`
- `window.prompt('Tên bộ lọc:')` at `saved-filters-menu.component.ts:80` — a blocking native dialog in a library component: unstyleable, untestable, no-op in some webviews

**Docs are the best-maintained artifact in the repo** — 0 mojibake across 98 files (codepoint-scanned), `README.npm.md` byte-identical to the workspace copy, snippets verified to compile, no orphan/misnamed docs. Two real drift clusters:

1. **The `SdBaseSecureComponent` removal (CHANGELOG #21) never reached the docs.** 5 sites still assert the inheritance: `sd-table.md:6` and `:434` (a whole "Permission gating" paragraph), `sd-button.md:6`, `sd-tab.md:6`, `sd-stepper.md:6`. Only `sd-view.md:99` is correct. Highest-value fix in the doc set and purely mechanical. *(Related: `components/base` and `services/license` are still live public entry points for code documented as dormant — and `license.service.ts:34` hard-throws on any non-localhost host with no key.)*
2. **The `[bare]` removal was documented file-by-file without a repo-wide grep.** `sd-date`/`sd-datetime`/`sd-date-range` host tables were updated; `sd-select.md:88,156` still presents `[bare]` as API, and `sd-date-range.md:217` retains a "bare and viewed are complementary" block **four lines after** the correction at :214.

Plus: `sd-notify.md` names `SdToastContainerComponent` (real class: `ToastContainerComponent`) at a subpath that doesn't exist, and documents `ToastData`/`ToastType` which `services/notify/index.ts` doesn't export. `sd-input.md:50` documents a `tooltip` input that doesn't exist and omits the real `cleared` output. `sd-button.md:31` lists `accent`/`warn` colors that aren't in the `Color` union. `models.md:20` claims `Size` has `'xs'`.

A cheap CI guard closes this whole class: parse identifiers + import paths out of each `sd-*.md` and assert they resolve from the entry point.

---

## 8. What's genuinely good

Worth protecting during the fixes:

- **`forms/models`** — `ɵsdFormControlConnector`, `sdFormControlState`, `sd-viewed` is the strongest code in the library: correctly `ɵ`-prefixed internals, real composables, and `sd-time`/`sd-time-range` are fully signal-driven, leak-free and timezone-correct with pure round-tripping validation helpers.
- **`query-bar` decomposition** — 750 → 340 LOC orchestrator + 7 focused children, single-emit `triggerApply()` contract. The architecture holds up; only i18n and `track $index` let it down.
- **`table`'s subscription hygiene** — `onCleanup`, `takeUntilDestroyed`, `MutationObserver.disconnect` all done right. The problems are in shared helpers and template bindings, not the shell.
- **`tree`'s lazy-load race guards** — generation counter + per-node load ids, correctly implemented. Genuinely hard to get right.
- **`services/cache`/`storage`/`persistence`/`task`/`loading`/`api` core** — exhaustively defensive: SHA-256 identities, tri-state storage reads, clamped timers, quota-safe writes, `DestroyRef` teardown.
- **`services/notify` XSS hardening** (#22) and **`services/excel`'s `await import('exceljs')`** — both are the correct pattern, already in-repo. The gap is that neither was propagated.
- **Doc discipline** — 89 of 94 entry points carry a correctly selector-named contract doc, zero mojibake, README in sync. Most libraries this size have nothing comparable.
- **v19→v20→v21 sync** — `check:sync` passes, the rollout model works, and it's guarded before publish.
- **Newer components** (`tree`, `splitter`, `breadcrumb`, `data-state`, `inform`) have correct ARIA roles, roving tabindex, arrow keys and live regions — proving the a11y gap is an age-stratified retrofit, not a rewrite.

---

## 9. Prioritized plan

### Before the next tag (1–2 days, all mechanical)
1. `ng lint --fix` + delete the unused `DATE_DISPLAY_FORMAT` import → green `lint:release`
2. **B1** `export * from` in `src/public-api.ts` — one-line-per-line, unblocks every root import
3. **B2** add 6 missing `peerDependencies`
4. **B3** scope `sideEffects` to chart/code-editor/ckeditor-styles
5. **B4** one `isAllowedApiHost()` helper; replace all 9 `.includes()` URL checks
6. **B5** sanitize by default in `sdSafeHtml`, bypass becomes opt-in
7. Remove the dead `@omer-go/docx-parser-converter-ts` dep, `services/excel/src/test.ts`, `modules/generic/`
8. Add a `test` job to `publish-npm.yml` as a `needs:` of publish
9. Fix the 5 `SdBaseSecureComponent` doc sites + the 2 `[bare]` sites

### Sweep the bug classes, don't patch sites (3–5 days)
10. **C1** grep every `emitEvent: false` in `forms/**`; fix `clear()` in input / input-number / autocomplete, and all of date-range
11. **C2** grep every method call inside a `[input]` binding; memoize. Start with `query-builder.component.html:251` — it's a live OOM
12. **C3** make all 6 confirm methods settle on cancel; fix docx `open()`; move `resolve(files)` out of the loop at `utility.extension.ts:100`
13. **C4** add `ngOnDestroy` to `modal`; remove upload-file's listeners; clear the 11 timers; add a lint rule for bare `setTimeout`/`addEventListener`
14. **C5/C6** flip every optional-config default to fail-closed; add `reset()` to `SdPermissionService` + the unauthorized latch + layout storage
15. Fix `tsconfig.spec.json` paths so specs test source, not `dist/`
16. `includeAllSources: true` in karma, then re-floor the thresholds honestly

### Next release cycle
17. **B6/B7** delete every `aria-hidden` on a focusable element (10 inputs first); split modal's ESC flag from the backdrop flag; CDK focus trap in side-drawer; `role="status"` on the toast container
18. **B8** worker as an asset; split `preview-image`/`preview-pdf`; drop the 86 base64 PNGs; add a per-entry-point size budget to CI
19. **B9** get a license decision on the vendored GPL pandoc core; self-host + integrity-check the WASM
20. Do the naming break **once**, in one release, with a `### Changed (BREAKING for consumers)` block: `MatPaginatorIntlCro`, `translate`→`sdTranslate`, `sidebar-v*`→`sd-sidebar-v*`, PascalCase functions, `qb*`→`sdQb*`, output prefixes, and all 40 `@deprecated` shims. Every release this waits, it costs more.
21. i18n sweep: `query-bar`, `query-builder`, `tree`; replace `window.prompt`
22. Type sweep: `<T = any>` → `<T = unknown>` (177 sites), starting with `table-filter.model.ts` and `tree.model.ts`
23. Add the doc-identifier CI guard (parse `sd-*.md`, assert every named export resolves)

---

## 10. The one-sentence version

**The library's internals are stronger than its release engineering:** `check:sync`, build, and 3,950 specs are all green, which is exactly why nobody noticed that the primary entry point exports nothing, that 6 peer deps are undeclared, that the `sideEffects` flag is false, that `aria-hidden` is on 10 real inputs, and that CI never runs the tests — the gates that pass aren't measuring the things that are broken.
