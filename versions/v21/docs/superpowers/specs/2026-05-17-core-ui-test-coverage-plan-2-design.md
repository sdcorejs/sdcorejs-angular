# Core UI Test Coverage â€” Plan 2 Design

**Date**: 2026-05-17
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 2 â€” 10 remaining forms + 3 follow-ups from Plan 1 review

## 1. Problem statement

After Plan 1 completed, 10 form primitives still needed test coverage (autocomplete, chip, chip-calendar, date, date-range, datetime, input-number, radio, select, textarea). Plan 1 final review also identified 3 follow-up items: coverage threshold enforcement, scroll-spy test for SdAnchor, and import convention normalization.

## 2. Scope

### 2.1. File in Plan 2 (10 forms + 3 follow-ups)

10 form components covered per File Map in `plans/2026-05-17-core-ui-test-coverage-plan-2.md`.

Follow-ups:
- Task 11: Normalize spec import convention (relative paths consistently)
- Task 12: Add scroll-spy test for SdAnchor (lift coverage from 68% to ~85%)
- Task 13: Enforce coverage thresholds in karma.conf

### 2.2. Out of scope

- Plan 3 components (modal, side-drawer, section, tab-router, quick-action, view, anchor-v2, history, preview, upload-file, mini-editor)
- **Skipped per user direction**: anchor-v2, workflow, query-builder, document-builder, history, modules/generic (none of these are forms anyway)
- Services, modules, handlers, interceptors (Plan 5+)
- Heavy components (Plan 6): chart, code-editor, document-builder, editor, import-excel, query-builder, table sub-components, workflow â€” **skipped per user direction until those features are finalized**

## 3. Approach

Reused Plan 1 approach (TestBed-driven, FormGroup/NgForm in separate top-level describes, signal pre-seeding for NG0100, relative imports). See plan doc for per-task details.

## 4. Tooling

Same as Plan 1 + coverage threshold enforcement added in Task 13.

## 5. Acceptance criteria

1. 10 new spec files created + tests pass.
2. 10 MD files audited per 14-item checklist.
3. SdAnchor coverage lifted from 68% lines / 38% branches.
4. Import convention normalized across all `*.spec.ts`.
5. Coverage thresholds enforced in karma.conf (global only â€” each deferred to later plans when more files are tested).
6. Gap report aggregated.
7. Source `.ts` changes limited to import-path normalization (no behavioral changes).
8. Single branch (`feature/plan-2-forms-tests`) â€” merge after final review.

## 6. Reference

- Plan 1 design: `2026-05-15-core-ui-test-coverage-design.md`
- Plan 1 plan: `plans/2026-05-15-core-ui-test-coverage-plan-1.md`
- Plan 2 plan: `plans/2026-05-17-core-ui-test-coverage-plan-2.md`

