# Core UI Test Coverage — Plan 3 Design

**Date**: 2026-05-18
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 3 — 10 component primitives

## 1. Problem statement

After Plan 2 (forms) completed, 10 component primitives still needed test coverage: quick-action, view, section (+item), preview-image, modal, code-editor, side-drawer, mini-editor, tab-router (nav + item + outlet), upload-file (+preview).

## 2. Scope

### 2.1. File in Plan 3 (10 components, multiple sub-components)

10 component specs covering 14 component classes total:
- quick-action (1 component)
- view (1 component)
- section (parent + item, 2 components)
- preview-image (1 component)
- modal (1 component)
- code-editor (1 component)
- side-drawer (1 component)
- mini-editor (1 component)
- tab-router (nav + item + outlet, 3 components)
- upload-file (parent + preview, 2 components)

### 2.2. Out of scope — Plan 4+

- **Deferred per user direction**: import-excel (Plan 4 candidate)
- **Skipped indefinitely per user direction**: chart, document-builder, editor, workflow, form-generic, history, query-builder

These features are unfinished / heavy / under reconstruction. Tests will be revisited after the source is finalized.

- **Plan 4 candidates**: 6 directives (sd-desktop, sd-href, sd-hover-copy, sd-scroll, plus what's deferred)
- **Plan 5 candidates**: 9 services (api, cache, confirm, docx, excel, firebase, license, loading, notify)

## 3. Approach

Reused Plan 1+2 approach (TestBed-driven, HostComponent wrapper, separate top-level describes where applicable). All source `.ts` files left untouched (alias imports preserved for ng-packagr).

## 4. Tooling

Same as Plan 1+2. Coverage thresholds remain at global 73/55/71/74.

## 5. Acceptance criteria

1. 10 new spec files created (+ sub-component coverage within) — tests pass.
2. 10+ MD files audited per 14-item checklist.
3. Total tests pass.
4. No source `.ts` changes (preserves ng-packagr alias convention from Plan 2 fix).
5. Gap report aggregated.
6. Single branch ready for merge.

## 6. Reference

- Plan 1 design: `2026-05-15-core-ui-test-coverage-design.md`
- Plan 2 design: `2026-05-17-core-ui-test-coverage-plan-2-design.md`
- Plan 3 plan: `plans/2026-05-17-core-ui-test-coverage-plan-3.md`
