# Core UI Test Coverage â€” Plan 5 Design

**Date**: 2026-05-19
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 5 â€” 1 handler + 2 interceptors + 8 module files (auth/permission/keycloak)

## 1. Problem statement

After Plan 4 (4 directives + 9 services) completed, the remaining untested
foundation primitives are 1 global error handler, 2 HTTP interceptors
(unauthorized, no-internet), and module-level guards/services/directives
for auth, permission, and keycloak.

## 2. Scope

### 2.1. Files in Plan 5 (11)

Per File Map in `plans/2026-05-18-core-ui-test-coverage-plan-5.md`.

### 2.2. Out of scope

- **Skipped per user direction**: `modules/authom/` (authom.service + authom.interceptor) â€” features not finalized.
- **Layout module** â€” UI-heavy components, Plan 6 candidate.
- **Skipped indefinitely per user direction (carried from prior plans)**: chart, document-builder, editor, workflow, form-generic, anchor-v2, history, query-builder.
- **Deferred (carried)**: import-excel.

## 3. Approach

Reused Plan 1-4 patterns: TestBed.inject for services, HostComponent for
directives, HttpClientTestingModule for interceptors. Guards (class-based
canActivate) tested via TestBed.inject + direct .canActivate() call.
keycloak-js ESM-only SDK mocked at public-property level (no constructor
mocking).

## 4. Acceptance criteria

1. 11 new spec files (1 handler + 2 interceptors + 8 module files) â€” tests pass.
2. MD files audited per 14-má»¥c checklist.
3. No source `.ts` changes (preserve ng-packagr alias).
4. Coverage thresholds met or re-floored if denominator growth.
5. Gap report aggregated.

## 5. Reference

- Plan 1 design: `2026-05-15-core-ui-test-coverage-design.md`
- Plan 2 design: `2026-05-17-core-ui-test-coverage-plan-2-design.md`
- Plan 3 design: `2026-05-18-core-ui-test-coverage-plan-3-design.md`
- Plan 4 design: `2026-05-18-core-ui-test-coverage-plan-4-design.md`
- Plan 5 plan: `plans/2026-05-18-core-ui-test-coverage-plan-5.md`

