# Core UI Test Coverage â€” Plan 4 Design

**Date**: 2026-05-18
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 4 â€” 4 directives + 9 services

## 1. Problem statement

After Plan 3 (components) completed, the remaining untested primitives are 4 directives (sd-desktop, sd-href, sd-scroll, sd-hover-copy) and 9 services (api, cache, confirm, docx, excel, firebase, license, loading, notify). Storage was tested in Plan 1.

## 2. Scope

### 2.1. Files in Plan 4 (13)

Per File Map in `plans/2026-05-18-core-ui-test-coverage-plan-4.md`.

### 2.2. Out of scope â€” Plan 5+

- **Deferred per user direction**: import-excel (heavy XLSX wrapper)
- **Skipped indefinitely per user direction**: chart, document-builder, editor, workflow, form-generic, history, query-builder

## 3. Approach

Reused Plan 1-3 patterns. Service tests use `TestBed.inject()`; HTTP services use `HttpClientTestingModule`; dialog-based services mock `MatDialog.open`; heavy SDK services (docx, excel) use scope reduction with spies on the orchestration layer.

## 4. Acceptance criteria

1. 13 new spec files (4 directives + 9 services) â€” tests pass.
2. 13 MD files audited per 14-item checklist.
3. No source `.ts` changes (preserve ng-packagr alias).
4. Coverage thresholds adjusted if necessary.
5. Gap report aggregated.

## 5. Reference

- Plan 1 design: `2026-05-15-core-ui-test-coverage-design.md`
- Plan 2 design: `2026-05-17-core-ui-test-coverage-plan-2-design.md`
- Plan 3 design: `2026-05-18-core-ui-test-coverage-plan-3-design.md`
- Plan 4 plan: `plans/2026-05-18-core-ui-test-coverage-plan-4.md`

