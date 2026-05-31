�# Core UI Test Coverage Plan 4 � Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Test coverage cho 4 directives còn lại + 9 services chưa test của `@sdcorejs/angular` (sd-desktop, sd-href, sd-scroll, sd-hover-copy + license, loading, firebase, notify, cache, api, confirm, docx, excel).

**Architecture:** Reuse Plan 1-3 pattern. Directives test qua HostComponent; services test bằng `TestBed.inject()` + Angular DI. HttpClient-based services dùng `HttpClientTestingModule` + `HttpTestingController`. Firebase service test bằng cách stub external SDK. 

**Tech Stack:** Same Plan 1-3 stack + `@angular/common/http/testing`, optional `firebase` SDK stub.

**References:** 
- Plan 1 plan: `docs/superpowers/plans/2026-05-15-core-ui-test-coverage-plan-1.md`
- Plan 2 plan: `docs/superpowers/plans/2026-05-17-core-ui-test-coverage-plan-2.md`
- Plan 3 plan: `docs/superpowers/plans/2026-05-17-core-ui-test-coverage-plan-3.md`
- Storage service pattern (Plan 1): `projects/sdcorejs-angular/services/storage/src/storage.service.spec.ts`

**Branch:** `feature/plan-4-directives-services-tests` (already created).

---

## Conventions (apply to ALL tasks)

**File location:**
- Directive specs: `projects/sdcorejs-angular/directives/src/<name>.directive.spec.ts`
- Service specs:
  - api, cache, firebase, license, loading, notify, storage: `projects/sdcorejs-angular/services/<name>/src/<name>.service.spec.ts`
  - confirm, docx, excel: `projects/sdcorejs-angular/services/<name>/src/lib/<name>.service.spec.ts`

**Import paths:**
- `@sdcorejs/angular/*` alias for in-library imports (required for ng-packagr � never change source)
- Relative path for `testing/test-utils` if needed (from directives/src/ use `../../testing/test-utils` (2 levels up); from services/<name>/src/ use `../../../testing/test-utils` (3 levels up))
- Most service tests won't need test-utils

**Directive test pattern:**
```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdXDirective } from './sd-x.directive';

@Component({
  standalone: true,
  imports: [SdXDirective],
  template: `<button sdX>Click me</button>`,
})
class HostComponent {}

describe('SdXDirective', () => {
  // creation, behaviors, cleanup
});
```

**Service test pattern (simple):**
```typescript
import { TestBed } from '@angular/core/testing';
import { SdXService } from './x.service';

describe('SdXService', () => {
  let service: SdXService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdXService);
  });

  // methods, state, lifecycle
});
```

**Service test pattern (HTTP-based):**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SdApiService } from './api.service';

describe('SdApiService', () => {
  let service: SdApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SdApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // GET/POST/PUT/DELETE + interceptor behavior
});
```

---

## File Map

| Task | File | Source LoC | Tier |
|---|---|---|---|
| 1 | `directives/src/sd-desktop.directive.spec.ts` | 16 | Trivial |
| 2 | `directives/src/sd-href.directive.spec.ts` | 36 | Simple |
| 3 | `directives/src/sd-scroll.directive.spec.ts` | 41 | Simple |
| 4 | `directives/src/sd-hover-copy.directive.spec.ts` | 147 | Medium |
| 5 | `services/firebase/src/firebase.service.spec.ts` | 20 | Trivial |
| 6 | `services/loading/src/loading.service.spec.ts` | 90 | Simple |
| 7 | `services/license/src/license.service.spec.ts` | 101 | Simple |
| 8 | `services/notify/src/notify.service.spec.ts` | 148 | Medium |
| 9 | `services/confirm/src/lib/confirm.service.spec.ts` | ? | Medium |
| 10 | `services/cache/src/cache.service.spec.ts` | 169 | Medium |
| 11 | `services/api/src/api.service.spec.ts` | 191 | Complex |
| 12 | `services/docx/src/lib/docx.service.spec.ts` | ? | Complex |
| 13 | `services/excel/src/lib/excel.service.spec.ts` | ? | Complex |
| 14 | Plan 4 design doc + gap report aggregate | � | � |

Plus MD audit for each via `sd-<name>.md` files.

---

## Pre-flight

- [ ] **Step 0: Baseline verify**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
git status
git branch --show-current
npm run test:ci 2>&1 | grep -E "TOTAL" | tail -1
```

Expected: on `feature/plan-4-directives-services-tests`, 1123 tests pass.

---

## Task 1: SdDesktopDirective (~16 LoC trivial)

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-desktop.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-desktop.md`

**Behavior**: Mirror of sd-mobile � renders template only when NOT mobile (i.e., desktop).

**Test scope (~3-5 specs):**
- Renders template when `SdUtilities.isMobile()` returns false (desktop)
- Does NOT render when `isMobile()` returns true
- Constructor evaluates once (not reactive)

**Pattern**: copy sd-mobile.directive.spec.ts, flip the assertion.

**Steps**: read source, create spec, run, audit md, commit.

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/sd-desktop.directive.spec.ts" 2>&1 | tail -5
git add projects/sdcorejs-angular/directives/src/sd-desktop.directive.spec.ts projects/sdcorejs-angular/directives/src/sd-desktop.md
git commit -m "$(cat <<'EOF'
SM-00: add SdDesktopDirective spec + audit sd-desktop.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: SdHrefDirective (~36 LoC simple)

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-href.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-href.md`

**Behavior** (read source first): Likely attaches `href` attribute with security/navigation handling � internal links use Angular Router, external open in new tab.

**Test scope (~8-12 specs):**
- creation
- inputs (href, target)
- internal URL �  router navigation simulated
- external URL (http://) �  opens new tab with rel="noopener"
- empty href �  no-op
- click handler stops propagation

Use HostComponent + RouterTestingModule if needed for navigation. Mock `Router.navigateByUrl`.

---

## Task 3: SdScrollDirective (~41 LoC simple)

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-scroll.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-scroll.md`

**Behavior** (read source first): Likely scroll-related (e.g., scroll-into-view, scroll-spy, or scroll-restoration).

**Test scope (~8-10 specs)**:
- creation
- inputs / outputs
- scroll event triggers
- cleanup on destroy

---

## Task 4: SdHoverCopyDirective (~147 LoC medium)

**Files:**
- Create: `projects/sdcorejs-angular/directives/src/sd-hover-copy.directive.spec.ts`
- Modify: `projects/sdcorejs-angular/directives/src/sd-hover-copy.md`

**Behavior** (read source): Likely adds copy-to-clipboard button on hover with tooltip feedback.

**Test scope (~12-15 specs)**:
- creation
- inputs (copyValue, position)
- mouseenter shows copy icon
- click copies to clipboard (mock `navigator.clipboard`)
- success/error states
- cleanup

Mock `navigator.clipboard.writeText` using `spyOn(navigator.clipboard, 'writeText').and.resolveTo()`.

---

## Task 5: SdFirebaseService (~20 LoC trivial)

**Files:**
- Create: `projects/sdcorejs-angular/services/firebase/src/firebase.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/firebase/sd-firebase.md`

**Behavior** (read source first): Likely thin wrapper / token holder for Firebase config. May be no-op stub if Firebase SDK isn't initialized in test env.

**Test scope (~5-8 specs)**:
- create service
- inject config token
- public methods if any

---

## Task 6: SdLoadingService (~90 LoC simple)

**Files:**
- Create: `projects/sdcorejs-angular/services/loading/src/loading.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/loading/sd-loading.md`

**Behavior**: Manages global loading state, likely with show/hide methods + counter (multiple concurrent loads).

**Test scope (~10-12 specs)**:
- create
- show() / hide() toggle state
- counter behavior (show 2x �  hide once still loading)
- subscribers receive state changes
- reset method (if exists)

---

## Task 7: SdLicenseService (~101 LoC simple)

**Files:**
- Create: `projects/sdcorejs-angular/services/license/src/license.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/license/sd-license.md`

**Behavior**: Already partially understood from Plan 1 (Karma localhost auto-passes). Validates domain against configured key, throws on mismatch.

**Test scope (~10-12 specs)**:
- localhost bypass (`window.location.hostname === 'localhost'`)
- exact match with `SD_CORE_CONFIGURATION` licenseKey hash
- wildcard match (`*.subdomain.com`)
- no config �  throw
- non-matching �  throw
- enforceLicense() throws when invalid

Use `TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { licenseKey: '<hash>' } }] })` for valid case.

---

## Task 8: SdNotifyService (~148 LoC medium)

**Files:**
- Create: `projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/notify/sd-notify.md`

**Behavior**: Toast / snackbar notifications. Likely wraps `MatSnackBar`.

**Test scope (~15 specs)**:
- success / error / warning / info methods
- custom duration
- dismiss
- queue behavior (if implemented)
- output / observable

May need `provideNoopAnimations()` + spy on `MatSnackBar.open`.

---

## Task 9: SdConfirmService (medium)

**Files:**
- Create: `projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/confirm/sd-confirm.md`

**Behavior**: Confirmation dialogs. Likely opens MatDialog with a confirm component.

**Test scope (~12 specs)**:
- confirm() returns Observable/Promise
- result on accept / cancel / close
- title / message inputs
- variant (warning, danger, info)

Mock `MatDialog.open` to return a fake `MatDialogRef.afterClosed()`.

---

## Task 10: SdCacheService (~169 LoC medium)

**Files:**
- Create: `projects/sdcorejs-angular/services/cache/src/cache.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/cache/sd-cache.md`

**Behavior**: In-memory or storage-backed cache with TTL.

**Test scope (~15 specs)**:
- set/get
- TTL expiration
- delete / clear
- key namespace
- has() check
- max size eviction (if implemented)

---

## Task 11: SdApiService (~191 LoC complex)

**Files:**
- Create: `projects/sdcorejs-angular/services/api/src/api.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/api/sd-api.md`

**Behavior**: HTTP wrapper. Likely GET/POST/PUT/DELETE/PATCH with auth interceptor integration.

**Test scope (~20-25 specs)**:
- create
- GET / POST / PUT / DELETE / PATCH happy path
- query params handling
- body serialization
- error path (404, 500)
- response unwrapping
- request cancellation

Use `HttpClientTestingModule` + `HttpTestingController.expectOne()`.

---

## Task 12: SdDocxService (complex)

**Files:**
- Create: `projects/sdcorejs-angular/services/docx/src/lib/docx.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/docx/sd-docx.md`

**Behavior**: Word document generation / parsing. Read source to understand API.

**Test scope (~10-15 specs)**:
- create
- public methods
- error cases

Heavy dependencies (pandoc-core) � may need scope reduction.

---

## Task 13: SdExcelService (complex)

**Files:**
- Create: `projects/sdcorejs-angular/services/excel/src/lib/excel.service.spec.ts`
- Modify: `projects/sdcorejs-angular/services/excel/sd-excel.md`

**Behavior**: Excel import/export using `exceljs`. There's already a `test.ts` file in this dir � may be unrelated to spec.

**Test scope (~15-20 specs)**:
- create
- export (build workbook from data)
- import (parse workbook to data)
- format helpers
- error cases

Heavy `exceljs` dependency � may need scope reduction or mock layer.

---

## Task 14: Plan 4 design doc + gap report aggregate

**Files:**
- Create: `docs/superpowers/specs/2026-05-18-core-ui-test-coverage-plan-4-design.md`
- Modify: `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` (append §6.4 gap report)

Same pattern as Plan 1-3 finalize tasks. Capture:
- Per-file spec counts + commits
- Coverage actual numbers
- Observations / quirks
- Plan 5+ deferred items (storage service is already tested; what remains?)

---

## Done criteria

- [ ] 13 new spec files (4 directives + 9 services).
- [ ] `npm run test:ci` pass with coverage threshold met.
- [ ] 13 MD files audited.
- [ ] No source `.ts` changes (preserve ng-packagr alias).
- [ ] Build pass (`npx ng build sdcorejs-angular`).
- [ ] Gap report aggregated.
- [ ] Branch ready for merge.

---

## Troubleshooting

**Service injects Router or HttpClient**: use `provideRouter([])` and `provideHttpClient() + provideHttpClientTesting()`.

**Service depends on `SD_CORE_CONFIGURATION`**: provide via `{ provide: SD_CORE_CONFIGURATION, useValue: { ... } }`.

**External SDK (Firebase, exceljs)**: stub the global / module via `spyOn(window, 'fetch')` or `jest.mock` equivalent in Jasmine via `spyOn(...).and.callFake(...)`.

**Coverage threshold dips**: Plan 4 adds 13 service/directive sources. Lines % may shift; adjust karma.conf threshold in finalize task if needed.

