# Core UI Test Coverage Plan 3 â€” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Má»Ÿ rá»™ng test coverage cho 10 component primitives cá»§a `@sdcorejs/angular` (quick-action, view, section, preview, modal, code-editor, side-drawer, mini-editor, tab-router, upload-file).

**Architecture:** TÃ¡i sá»­ dá»¥ng pattern Plan 1+2 (TestBed-driven integration + HostComponent wrapper). Components Plan 3 khÃ´ng pháº£i form-input â†’ KHÃ”NG cáº§n FgHost/NgFormHost lifecycle describes. Táº­p trung vÃ o: rendering, inputs, output events, content projection (náº¿u cÃ³ slot), behavior states (open/close cho modal/drawer, navigation cho tab-router, etc.).

**Tech Stack:** Angular 19.2.x, Karma 6.4.x, Jasmine 5.5.x, `@angular/material` (MatDialog, MatSidenav, MatTabsModule, MatButtonToggle), `@angular/cdk/portal`, `prismjs` (code-editor highlighter).

**Branch**: `feature/plan-3-components-tests` (Ä‘Ã£ checkout tá»« `feature/plan-2-forms-tests` â€” Plan 2 chÆ°a merge nhÆ°ng cÃ³ trÃªn branch nÃ y).

**Skipped per user direction**: chart, document-builder, editor, workflow, form-generic, history, query-builder, import-excel. (`code-editor` Ä‘Æ°á»£c include).

---

## Conventions (carry-over tá»« Plan 1+2)

**Import paths trong spec**:
- Test utilities: `import { queryByCss, setInput } from '<RELATIVE>/testing/test-utils';` (Ä‘áº¿m sá»‘ `../` tá»« vá»‹ trÃ­ spec)
- Source ná»™i bá»™ trong cÃ¹ng entry point: relative path OK
- Cross-entry-point: `@sdcorejs/angular/*` alias (ng-packagr yÃªu cáº§u)

**Pattern test cho component thÆ°á»ng (non-form)**:

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Sd<Name> } from './<name>.component';

@Component({
  standalone: true,
  imports: [Sd<Name>],
  template: `<sd-<name> [<inputs>] (<outputs)></sd-<name>>`,
})
class HostComponent { /* inputs */ }

describe('Sd<Name>', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: Sd<Name>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(el => el.componentInstance instanceof Sd<Name>)
      ?.componentInstance as Sd<Name>;
    if (!component) throw new Error('Sd<Name> not found');
  });

  describe('creation & rendering', () => { /* ... */ });
  describe('inputs', () => { /* ... */ });
  describe('outputs', () => { /* ... */ });
  describe('<specific-behavior>', () => { /* ... */ });
});
```

**Output subscription hygiene**: `const sub = comp.<output>.subscribe(...)` + `sub.unsubscribe()` at end of test, hoáº·c push-to-array trÃªn host.

**Coverage target**: má»—i file â‰¥ 70% lines / â‰¥ 50% branches (global gate hiá»‡n táº¡i 74/55).

---

## File Map

| Task | File | Source LoC | Complexity |
|---|---|---|---|
| 1 | `components/quick-action/src/quick-action.component.spec.ts` | 24 | Trivial |
| 2 | `components/view/src/view.component.spec.ts` | 49 | Trivial |
| 3 | `components/section/src/section.component.spec.ts` (+ section-item) | 60 | Trivial |
| 4 | `components/preview/src/preview-image/preview-image.component.spec.ts` | 113 | Simple |
| 5 | `components/modal/src/modal.component.spec.ts` | 118 | Simple |
| 6 | `components/code-editor/src/code-editor.component.spec.ts` | 146 | Simple |
| 7 | `components/side-drawer/src/side-drawer.component.spec.ts` | 156 | Simple |
| 8 | `components/mini-editor/src/mini-editor.component.spec.ts` | 360 | Medium |
| 9 | `components/tab-router/src/components/*.spec.ts` (3 files for nav, item, outlet) | 479 | Complex |
| 10 | `components/upload-file/src/upload-file.component.spec.ts` (+ preview sub-component) | 827 | Complex |
| 11 | Gap report + Plan 3 design doc | â€” | â€” |

Plus per-task MD audit + update of corresponding `sd-<name>.md`.

---

## Pre-flight

- [ ] **Step 0.1: Verify branch & clean state**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
git status
git branch --show-current
```

Expected: on `feature/plan-3-components-tests`, working tree clean.

- [ ] **Step 0.2: Verify baseline tests pass + build pass**

```bash
npm run test:ci 2>&1 | grep -E "TOTAL|Coverage" | tail -5
npx ng build sdcorejs-angular 2>&1 | tail -3
```

Expected: 820 tests pass, "Built Angular Package" success.

---

## Task 1: SdQuickAction spec + md audit (Trivial)

**Files:**
- Create: `projects/sdcorejs-angular/components/quick-action/src/quick-action.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/quick-action/sd-quick-action.md`

**Source notes** (read first to verify):
- Icon-only action button trigger that opens a popover menu. Very small component (24 LoC).
- Likely inputs: `icon`, `tooltip`, `disabled`, `items` (array of menu options), `color`/`size`.
- Likely outputs: `select` or `(itemClick)` when user picks item.
- Wraps `MatMenu` or CDK overlay.

**Test scope** (~8-12 specs):
- creation & rendering (2): create, render icon button
- inputs (3-4): icon, tooltip, disabled coerce
- output events (1-2): emit when menu item clicked
- visual states (2): default, disabled

**Steps:**
- [ ] **Step 1: Read source + html + md** at `projects/sdcorejs-angular/components/quick-action/`

- [ ] **Step 2: Create spec file** following Plan 2 pattern. Use HostComponent (no FgHost/NgFormHost since this is not a form).

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/quick-action.component.spec.ts" 2>&1 | tail -10
```

Expected: 8-12 specs pass.

- [ ] **Step 4: Audit `sd-quick-action.md`** per 14-má»¥c checklist.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/quick-action/
git commit -m "SM-00: add SdQuickAction spec + audit sd-quick-action.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: SdView spec + md audit (Trivial)

**Files:**
- Create: `projects/sdcorejs-angular/components/view/src/view.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/view/sd-view.md`

**Source notes**:
- "Read-only view" wrapper that renders a value with optional template override (49 LoC).
- Used inside forms with `viewed=true` to show a label-only display.
- Likely inputs: `value`, `templateRef`, `placeholder` (for empty value), `label`.
- May use `ng-template` content projection.

**Test scope** (~8-10 specs):
- creation & rendering (2)
- value display (3): renders text value, renders placeholder for null/empty, custom template via TemplateRef
- inputs (2-3): label, value type variants

**Steps**: same pattern as Task 1.

- [ ] **Step 1: Read source + html + md**
- [ ] **Step 2: Create spec file**
- [ ] **Step 3: Run test** â€” expect 8-10 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/view/
git commit -m "SM-00: add SdView spec + audit sd-view.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SdSection spec + md audit (Trivial)

**Files:**
- Create: `projects/sdcorejs-angular/components/section/src/section.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/section/sd-section.md`

**Source notes**:
- Section wrapper component with title + content area. Has child SectionItem (60 LoC total).
- Likely inputs: `title`, `description`, `collapsible`, `expanded`.
- Content projection slots: section content, optional header right.

**Test scope** (~10-12 specs):
- creation & rendering (2): section element, section-item child
- inputs (3-4): title, description, collapsible
- collapse/expand behavior (2-3): toggle expand, default state, animation off
- content projection (1-2): ng-content renders child

Tests can cover both `SdSection` and `SdSectionItem` in single file (per existing pattern in repo for parent/child components).

- [ ] **Step 1: Read source + html + md** â€” both `section.component.ts` and `section-item/section-item.component.ts`

- [ ] **Step 2: Create spec file** with parent + child host

- [ ] **Step 3: Run test** â€” expect 10-12 specs pass

- [ ] **Step 4: Audit md**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/section/
git commit -m "SM-00: add SdSection spec (parent + item) + audit sd-section.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: SdPreviewImage spec + md audit (Simple)

**Files:**
- Create: `projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/preview/sd-preview.md`

**Source notes**:
- Image preview component with zoom/rotate controls likely (113 LoC).
- Inputs: `src` (image URL), `alt`, possibly zoom controls.
- May use CDK overlay for fullscreen preview.

**Test scope** (~12-15 specs):
- creation & rendering (2)
- src input (3): renders img with correct src, fallback for null/undefined, error handling
- zoom/rotate behavior (3-4): if implemented
- close/open state (2-3)
- output events (1-2)

- [ ] **Step 1: Read source + html + md**
- [ ] **Step 2: Create spec file**
- [ ] **Step 3: Run test** â€” expect 12-15 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/preview/
git commit -m "SM-00: add SdPreviewImage spec + audit sd-preview.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: SdModal spec + md audit (Simple)

**Files:**
- Create: `projects/sdcorejs-angular/components/modal/src/modal.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/modal/sd-modal.md`

**Source notes**:
- Wraps `MatDialog`. Service-based API (e.g., `SdModalService.open(...)`) likely (118 LoC).
- Inputs: title, content template, action buttons, size variants.
- Outputs: `confirm`, `cancel`, `close`.

**Test scope** (~12-18 specs):
- creation & rendering (2)
- open/close behavior (3-4): open via service, close on confirm, close on cancel
- inputs (3): title, content, action labels
- output events (3): confirm emit, cancel emit, close emit
- size variants (2): small/medium/large

**Material dialog testing**: use `MatDialogRef` mocking OR test via `TestBed.inject(MatDialog).open()`. Spec may need extra setup.

- [ ] **Step 1: Read source + html + md**
- [ ] **Step 2: Create spec file** â€” likely needs `NoopAnimationsModule` + Material dialog harness
- [ ] **Step 3: Run test** â€” expect 12-18 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/modal/
git commit -m "SM-00: add SdModal spec + audit sd-modal.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: SdCodeEditor spec + md audit (Simple)

**Files:**
- Create: `projects/sdcorejs-angular/components/code-editor/src/code-editor.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/code-editor/sd-code-editor.md`

**Source notes**:
- Code-block display with syntax highlighting via PrismJS (146 LoC).
- Inputs: `code` (string), `language` (js/ts/json/html/css/...), `lineNumbers` (bool), `theme`.
- Outputs: `(copy)` event when user clicks copy button.

**Test scope** (~15-18 specs):
- creation & rendering (2)
- code input (3): renders `<pre><code>`, language class applied, line numbers conditional
- language variants (3): typescript/javascript/json highlighting
- copy button (2): click triggers copy event + emits
- inputs (3): theme, lineNumbers toggle, code update

**PrismJS note**: Tests may need to verify class names applied (e.g., `language-typescript`) without asserting on actual highlighted output (DOM tokens). PrismJS runs in `ngOnInit` or `ngAfterViewInit`.

- [ ] **Step 1: Read source + html + md**
- [ ] **Step 2: Create spec file**
- [ ] **Step 3: Run test** â€” expect 15-18 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/code-editor/
git commit -m "SM-00: add SdCodeEditor spec + audit sd-code-editor.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: SdSideDrawer spec + md audit (Simple)

**Files:**
- Create: `projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md`

**Source notes**:
- Side drawer/panel â€” slides in from side (left/right). Likely wraps `MatSidenav` or custom CDK overlay (156 LoC).
- Inputs: `open` (signal/setter), `position` (left/right), `width`, `title`, `closable`.
- Outputs: `openChange`, `close`.

**Test scope** (~15-18 specs):
- creation & rendering (2)
- open state (3): default closed, opens via input, closes via input
- position (2): left, right
- width input (1)
- closable + close button (2): renders close button, click emits close + closes drawer
- output events (2): openChange emit
- content projection (1-2): ng-content renders inside

- [ ] **Step 1: Read source + html + md**
- [ ] **Step 2: Create spec file**
- [ ] **Step 3: Run test** â€” expect 15-18 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/side-drawer/
git commit -m "SM-00: add SdSideDrawer spec + audit sd-side-drawer.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: SdMiniEditor spec + md audit (Medium)

**Files:**
- Create: `projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/mini-editor/sd-mini-editor.md`

**Source notes** (360 LoC):
- Lightweight WYSIWYG editor. Likely uses `[contenteditable]` + custom toolbar OR TinyMCE-mini.
- Inputs: `value`/`model`, `placeholder`, `disabled`, `toolbar` (array of enabled buttons), `maxLength`.
- Outputs: `valueChange`, `sdChange`, `(focus)`, `(blur)`.
- May have ToolbarItem children (bold/italic/list/etc.).

**Test scope** (~18-22 specs):
- creation & rendering (2)
- value two-way (3): downward, upward, html sanitization
- placeholder (1-2)
- disabled (2): readonly behavior
- toolbar buttons (3-4): formatting commands work programmatically
- focus tracking (2)
- maxLength constraint (1-2)
- output events (2-3)

**Scope reduction acceptable**: actual rich-text formatting via `document.execCommand` is browser-dependent and may not work reliably in headless. Focus on input/output contracts + state transitions.

- [ ] **Step 1: Read source + html + md** â€” verify if uses TinyMCE wrapper or custom
- [ ] **Step 2: Create spec file**
- [ ] **Step 3: Run test** â€” expect 18-22 specs pass
- [ ] **Step 4: Audit md**
- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/mini-editor/
git commit -m "SM-00: add SdMiniEditor spec + audit sd-mini-editor.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: SdTabRouter specs + md audit (Complex)

**Files:**
- Create: `projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.spec.ts`
- Create: `projects/sdcorejs-angular/components/tab-router/src/components/tab-router-item/tab-router-item.component.spec.ts`
- Create: `projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/tab-router/sd-tab-router.md`

**Source notes** (479 LoC across 3 components):
- Router-driven tabs. Each tab maps to a route.
- `SdTabRouterNav`: renders the tab buttons; integrates with Angular Router.
- `SdTabRouterItem`: declarative tab definition (title, route, icon).
- `SdTabRouterOutlet`: where tab content renders (likely thin wrapper around `<router-outlet>`).

**Test scope per file** (~10-15 specs each):

**TabRouterNav** (~12-15):
- creation & rendering (2)
- tab items rendering from contentChildren (2)
- active tab detection from current route (3)
- click navigates to route (2)
- disabled tab (1-2)
- icon rendering (1-2)

**TabRouterItem** (~6-8):
- creation & rendering (2)
- inputs (3): title, route, icon, disabled

**TabRouterOutlet** (~5-8):
- creation & rendering (2)
- renders router-outlet (1)
- transitions between routes (2-3)

**Router testing**: use `RouterTestingHarness` from `@angular/router/testing` or `provideRouter([...])` with test routes.

**Scope reduction**: if active-route detection requires real router state, simplify with mock `ActivatedRoute`/`Router`.

- [ ] **Step 1: Read source + html + md** for all 3 sub-components
- [ ] **Step 2: Create 3 spec files**
- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/tab-router-*.component.spec.ts" 2>&1 | tail -15
```

Expected: ~25-35 specs across 3 files pass.

- [ ] **Step 4: Audit `sd-tab-router.md`** per checklist

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/tab-router/
git commit -m "SM-00: add SdTabRouter (nav+item+outlet) spec + audit sd-tab-router.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: SdUploadFile spec + md audit (Complex)

**Files:**
- Create: `projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts`
- Create: `projects/sdcorejs-angular/components/upload-file/src/components/preview/preview.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/upload-file/sd-upload-file.md`

**Source notes** (827 LoC â€” largest in Plan 3):
- File upload with preview, multi-file, drag & drop, validation (type/size).
- Inputs: `model` (File[] or value), `multiple`, `accept` (mime), `maxSize`, `maxFiles`, `disabled`, `placeholder`.
- Outputs: `(filesAdded)`, `(fileRemoved)`, `(error)` (invalid file).
- Has `SdUploadFilePreview` sub-component (thumbnail/icon per file).

**Test scope** (~25-30 specs):

**Main upload-file** (~20-25):
- creation & rendering (2)
- file selection via input element (2-3): single, multiple
- drag & drop (2-3): dragover, drop file
- file validation (4): type accept, max size, max files, error event
- preview rendering (2): renders preview component per file
- remove file (2): click remove, model updates
- model two-way (3)
- disabled (2)
- output events (2-3)

**Preview sub-component** (~5-8):
- creation & rendering (2)
- image vs file icon (2-3): renders thumb for image, icon for other
- file metadata (name, size) (2)

**File API testing**: use `new File(['content'], 'name.png', { type: 'image/png' })` and `new DataTransfer()` for drop events.

**Scope reduction**: if drag/drop hard in headless, simulate via `change` event on hidden input.

- [ ] **Step 1: Read source + sub-component + html + md**
- [ ] **Step 2: Create 2 spec files**
- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/upload-file*.component.spec.ts" 2>&1 | tail -15
```

Expected: ~25-30 specs pass.

- [ ] **Step 4: Audit `sd-upload-file.md`** per checklist

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/upload-file/
git commit -m "SM-00: add SdUploadFile (main+preview) spec + audit sd-upload-file.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Gap report + Plan 3 design doc

**Files:**
- Create: `docs/superpowers/specs/2026-05-17-core-ui-test-coverage-plan-3-design.md`
- Modify: `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` (append Â§6.3)

**Plan 3 spec doc** (brief â€” same structure as Plan 2 design):

```markdown
# Core UI Test Coverage â€” Plan 3 Design

**Date**: 2026-05-17
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 3 â€” 10 component primitives

## 1. Problem statement

After Plans 1+2 (20 spec files), 10 component primitives remain. Plan 3 covers non-form components (modal, side-drawer, etc.).

## 2. Scope

### 2.1. File in Plan 3 (10 components)

- quick-action, view, section, preview, modal, code-editor, side-drawer, mini-editor, tab-router (3 sub-components), upload-file (+ preview)

### 2.2. Out of scope (per user direction)

- chart, document-builder, editor, workflow, form-generic, history, query-builder, import-excel (deferred â€” unfinished components or large enough for own plan)

## 3. Approach

Same as Plan 1+2. Plan 3 components are non-form â†’ no FgHost/NgFormHost. Focus on rendering + behavior states + outputs.

## 4. Acceptance criteria

1. 10+ new spec files created (12 if counting tab-router x3 and upload-file x2).
2. All tests pass.
3. Per-file coverage â‰¥ 70% lines / â‰¥ 50% branches.
4. 10 MD files audited.
5. No source `.ts` changes (except trivial typos).
```

**Gap report append to Plan 1 design doc Â§6.3** (template â€” fill commit SHAs + test counts during execution):

```markdown
## 6.3 Gap report â€” Plan 3 implementation results

**Implementation completed**: 2026-MM-DD
**Branch**: `feature/plan-3-components-tests`
**Test counts**: Plan 2 final (820) â†’ After Plan 3: ~XXX

### Per-file summary

| File | New specs | MD audit | Commit |
|---|---|---|---|
| quick-action.component.ts | X | (fill) | (fill) |
| view.component.ts | X | (fill) | (fill) |
| section.component.ts (+item) | X | (fill) | (fill) |
| preview-image.component.ts | X | (fill) | (fill) |
| modal.component.ts | X | (fill) | (fill) |
| code-editor.component.ts | X | (fill) | (fill) |
| side-drawer.component.ts | X | (fill) | (fill) |
| mini-editor.component.ts | X | (fill) | (fill) |
| tab-router-nav.component.ts | X | (fill) | (fill) |
| tab-router-item.component.ts | X | (fill) | (fill) |
| tab-router-outlet.component.ts | X | (fill) | (fill) |
| upload-file.component.ts (+preview) | X | (fill) | (fill) |

### Coverage actual (Plan 3 files)

(Fill from `npm run test:ci` output)

### Plan 4+ deferred items

- Plan 4: 4 directives (sd-desktop, sd-href, sd-hover-copy, sd-scroll)
- Plan 5: 9 services (api, cache, confirm, docx, excel, firebase, license, loading, notify)
- Plan 6 deferred: import-excel, table sub-components beyond Plan 1 coverage
- Permanently skipped (user direction): chart, document-builder, editor, workflow, form-generic, history, query-builder
```

**Steps:**

- [ ] **Step 1: Create Plan 3 spec doc** at `docs/superpowers/specs/2026-05-17-core-ui-test-coverage-plan-3-design.md` (content above)

- [ ] **Step 2: Append Â§6.3 to Plan 1 design doc** with actual commit SHAs and test counts (fill in template above with real data from Tasks 1-10)

- [ ] **Step 3: Final verification**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
npm run test:ci 2>&1 | grep -E "TOTAL|Coverage" | tail -10
npx ng build sdcorejs-angular 2>&1 | tail -3
```

Expected: all tests pass, build pass.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/
git commit -m "SM-00: Plan 3 finalize â€” design doc + gap report aggregate

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Done criteria

- [ ] 10 component spec sets created (12 spec files counting sub-components).
- [ ] All tests pass (Plan 1+2+3 â‰ˆ 950-1000+ tests total).
- [ ] Coverage global gates still met after Plan 3.
- [ ] 10 MD files audited per 14-má»¥c checklist.
- [ ] No source `.ts` changes (lesson learned from Plan 2 Task 11 â€” alias is required for ng-packagr).
- [ ] Plan 3 design doc + Â§6.3 gap report committed.
- [ ] Branch pushable.

---

## Troubleshooting (carry-over)

**Module identity issue**: NEVER change source `.ts` import paths. Source must use `@sdcorejs/angular/*` alias for ng-packagr to compile FESM bundles correctly. Specs use the same alias for consistency.

**Material harness**: for MatDialog, MatSidenav, MatTabs â€” prefer programmatic API (`dialog.open()`, `sidenav.open()`) over simulating clicks on overlay backdrops.

**Router testing**: use `provideRouter([])` in TestBed providers + `RouterTestingHarness` for navigation specs. Mock `ActivatedRoute` with `BehaviorSubject` for params.

**File API**: `new File([...], 'name', { type })` creates a real File object. `new DataTransfer().items.add(file)` simulates drag/drop.

**PrismJS / contenteditable**: prefer asserting on input/output rather than internal highlight tokens or DOM mutations from `execCommand` â€” those are browser-dependent.

**Coverage gate failures**: if a complex file (mini-editor, tab-router, upload-file) falls below 70% lines, document the trade-off in the spec commit message and adjust global gate if needed (currently 74% lines).

