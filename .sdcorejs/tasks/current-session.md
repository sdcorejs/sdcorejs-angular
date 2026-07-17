---
updated_at: 2026-07-17T17:08:00+07:00
status: complete
track: angular
active_skill: sdcorejs-angular
branch: refactor/type-only-barrel-exports
---

# Current Session Checkpoint

## User Request

Audit and improve type-only re-exports in the `@sdcorejs/angular` barrel files.

## Tasks

- [x] Confirm workspace context and version-sync conventions
- [x] Audit all barrel files with the TypeScript checker
- [x] Normalize type-only re-exports in v19 and sync v20/v21
- [x] Run builds, lint, version sync, and public API checks
- [x] Review the final diff, repair findings, and complete delivery gates

## Current State

- Last completed: verify-before-done passed with no remaining review findings.
- In progress: none.
- Blocked/skipped: none.

## Artifacts Touched

- EDIT `.sdcorejs/tasks/current-session.md` - local session checkpoint.
- ADD `.sdcorejs/docs/angular/2026-07-17-16-42-normalize-type-only-barrel-exports.md` - automatic implementation note.
- EDIT `versions/v19/projects/sdcorejs-angular/**/index.ts` and `services/excel/src/public-api.ts` - convert 46 type-only wildcard re-exports.
- EDIT matching barrel files under `versions/v20` and `versions/v21` - rollout from v19.
- EDIT `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, and `versions/v21/SYNC-STATUS.md` - rollout metadata.

## Verification

- TypeScript AST audit - 0 candidates remaining; 46 explicit type-star exports per version.
- `npm run sync` - pass.
- `npm run check:sync` - pass.
- `npm --prefix versions/v19 run build` - pass.
- `npm --prefix versions/v20 run build` - pass.
- `npm --prefix versions/v21 run build` - pass.
- `npm run lint:release` - pass after CRLF formatting repair.
- Public type-consumer compile - pass for 25 representative symbols on v19/v20/v21.
- Public surface comparison - 0 changes across 82 entry points; 0 invalid type-star targets.
- Runtime FESM audit - representative interfaces/types are absent from runtime exports.
- Final code/performance review - no findings.
- `git diff --check` - pass.

## Resume From Here

No implementation work remains. Delivery status is recorded in Git history and the remote branch.
