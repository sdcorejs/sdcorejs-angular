�# Core UI Test Coverage Plan 5 � Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Test coverage cho 1 global error handler + 2 HTTP interceptors + 10 module service/guard/directive files (permission, auth, authom, keycloak) của `@sdcorejs/angular`.

**Architecture:** Reuse Plan 1-4 pattern. Services/handlers/interceptors test bằng `TestBed.inject()`. HTTP interceptors test bằng `HttpClientTestingModule` + provider interceptor. Guards test bằng `TestBed.runInInjectionContext()` + mocked Router.

**Tech Stack:** Plan 1-4 stack + `@angular/common/http/testing` cho interceptors.

**References:** 
- Plan 1-4 plans + designs
- Plan 4 API service spec (SdApiService) � interceptor + HTTP test pattern reference

**Branch:** `feature/plan-5-modules-handlers-interceptors-tests` (already created).

---

## Conventions (apply to ALL tasks)

**File location:**
- Handler spec: `projects/sdcorejs-angular/handlers/<name>.handler.spec.ts`
- Interceptor specs: `projects/sdcorejs-angular/interceptors/<name>/<name>.interceptor.spec.ts`
- Module service/guard/directive specs: cạnh source `.ts` file (e.g., `modules/permission/src/services/permission.service.spec.ts`)

**Import paths:** alias `@sdcorejs/angular/*` for cross-entry imports (preserve ng-packagr).

**Service test pattern:**
```typescript
import { TestBed } from '@angular/core/testing';
import { ServiceName } from './service-name';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    localStorage.setItem('sd-core.language', 'vi'); // if i18n-dependent
    TestBed.configureTestingModule({ providers: [/* mocks */] });
    service = TestBed.inject(ServiceName);
  });
});
```

**Guard test pattern:**
```typescript
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('AuthGuard', () => {
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerMock }],
    });
  });

  it('allows access when authenticated', () => {
    const result = TestBed.runInInjectionContext(() => 
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });
});
```

**Interceptor test pattern:**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('redirects on 401', () => {
    http.get('/api/users').subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/users');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
    // assert redirect behavior
  });
});
```

---

## File Map

| Task | File | Source LoC | Tier |
|---|---|---|---|
| 1 | `handlers/global-error.handler.spec.ts` | 66 | Simple |
| 2 | `interceptors/unauthorized/unauthorized.interceptor.spec.ts` | 25 | Trivial |
| 3 | `interceptors/no-internet/no-internet.interceptor.spec.ts` | 158 | Medium |
| 4 | `modules/auth/guards/auth.guard.spec.ts` | 19 | Trivial |
| 5 | `modules/auth/guards/portal.guard.spec.ts` | 19 | Trivial |
| 6 | `modules/auth/services/auth.service.spec.ts` | 68 | Simple |
| 7 | `modules/permission/src/directives/permission.directive.spec.ts` | 35 | Simple |
| 8 | `modules/permission/src/guards/permission.guard.spec.ts` | 43 | Simple |
| 9 | `modules/permission/src/services/permission.service.spec.ts` | 166 | Medium |
| 10 | `modules/authom/authom.interceptor.spec.ts` | 26 | Trivial |
| 11 | `modules/authom/authom.service.spec.ts` | 274 | Complex |
| 12 | `modules/keycloak/keycloak.interceptor.spec.ts` | 29 | Trivial |
| 13 | `modules/keycloak/keycloak.service.spec.ts` | 41 | Simple |
| 14 | Plan 5 design doc + gap report aggregate | � | � |

---

## Pre-flight

- [ ] **Step 0: Verify baseline + build**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
git status
git branch --show-current
npm run test:ci 2>&1 | grep -E "TOTAL" | tail -1
```

Expected: on `feature/plan-5-modules-handlers-interceptors-tests`, 1332 tests pass.

---

## Tasks 1-13 (per-file)

For each file, the implementer follows the same flow:
1. Read source `.ts` + corresponding `.md` (if exists)
2. Create spec file using appropriate pattern (service/guard/interceptor)
3. Run focused test: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/<name>.spec.ts"`
4. Audit `.md` per 14-mục checklist if MD exists
5. Commit with format: `SM-00: add <Name> spec + audit <name>.md`

Each task should target ~5-20 specs depending on tier:
- Trivial files: 3-8 specs
- Simple files: 8-15 specs
- Medium files: 15-25 specs
- Complex files: 25-35 specs

---

## Task 14: Plan 5 design doc + gap report

**Files:**
- Create: `docs/superpowers/specs/2026-05-18-core-ui-test-coverage-plan-5-design.md`
- Modify: `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` (append §6.5 gap report)

Same finalize pattern as Plan 1-4.

---

## Done criteria

- [ ] 13 new spec files.
- [ ] `npm run test:ci` pass with coverage threshold met.
- [ ] MD files audited (if exist; some interceptor/guard files may have no MD � note in gap report).
- [ ] No source `.ts` changes (preserve ng-packagr alias).
- [ ] Build pass.
- [ ] Gap report aggregated.

---

## Out of scope

- `modules/layout/` � heavy UI components (page, sidebar-mobile, sidebar-v1, layout-main); deferred to Plan 6.
- `modules/generic/` � skipped permanently per user direction (unfinished form-generic).
- `modules/auth/configurations/`, `modules/permission/src/configurations/` � pure config interface files (no logic to test).

---

## Troubleshooting

**Guard tests need RouterTestingModule or Router mock**: prefer `jasmine.createSpyObj` mock for `Router` to avoid full routing setup.

**HTTP interceptor tests**: use `provideHttpClient(withInterceptors([fn]))` to register the functional interceptor explicitly.

**Auth service depends on token storage**: stub localStorage / SdStorageService as needed.

**Authom/Keycloak service** may depend on external SDKs (keycloak-js): mock or stub the SDK before TestBed.inject.

**i18n strings**: add `localStorage.setItem('sd-core.language', 'vi')` in beforeEach if test asserts translated strings.

