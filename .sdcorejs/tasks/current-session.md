---
updated_at: 2026-06-24T23:36:09+07:00
status: completed
track: angular
active_skill: sdcorejs-ship, sdcorejs-git
branch: release/0.10
---

# Current Session Checkpoint

## User Request
Fix toan bo lint cho `sdcorejs-angular` theo phase, v19 truoc roi rollout v20/v21.

## Tasks
- [x] Xac nhan baseline lint va workspace sach truoc khi sua
- [x] Phase 1: fix lint cho release-touched files o v19
- [x] Phase 2-5: fix lint theo tung nhom con lai o v19
- [x] Rollout v19 sang v20/v21 va xu ly lint major-specific
- [x] Chay verification: lint release, test/build trong yeu
- [x] Commit/push ket qua hoac bao blocker neu khong the hoan tat an toan

## Current State
- Last completed: v19/v20/v21 lint and build pass; focused v19 tests pass; lint cleanup committed for `release/0.10`.
- In progress: None.
- Blocked/skipped: None yet.

## Artifacts Touched
- EDIT .sdcorejs/tasks/current-session.md - checkpoint for v19-first workflow update
- ADD .sdcorejs/memories/angular/v19-first-rollout.md - durable v19-first rollout rule
- ADD .sdcorejs/memories/MEMORY.md - memory index
- EDIT package.json - make `npm run sync` rollout v19 to v20/v21; add `npm run rollout` alias
- EDIT README.md - document feature/docs/tests/showcase in v19, then `npm run sync`
- EDIT CLAUDE.md - update agent entry point workflow and commands
- EDIT scripts/sync-multi-version-workspaces.ps1 - document v19 source-of-truth rule in script entry point
- EDIT .github/workflows/deploy-pages.yml - document v19 showcase source-of-truth
- EDIT .github/workflows/publish-npm.yml - document release expects checked-in rollout
- EDIT package.json - add root lint entry points for workspaces and phase runner
- ADD scripts/lint-phase.mjs - run ESLint for a chosen workspace/phase
- ADD docs/lint-fix-phases.md - phase plan for lint cleanup
- EDIT versions/v19/** - lint cleanup source workspace first, then rollout
- EDIT versions/v20/** - rollout from v19 plus major-specific package-lock refresh
- EDIT versions/v21/** - rollout from v19 plus major-specific package-lock refresh
- EDIT versions/v20/package-lock.json - align lock with Angular 20 dependency tree
- EDIT versions/v21/package-lock.json - align lock with Angular 21 dependency tree
- EDIT scripts/sync-multi-version-workspaces.ps1 - keep package-lock.json major-specific during future syncs

## Verification
- Prior release verification is in commit `5c86405b`.
- `versions/v19`: `npm run lint` -> FAIL, 3080 problems (baseline).
- `versions/v19`: changed-file eslint subset -> FAIL, 39 problems.
- `node --check scripts/lint-phase.mjs` -> OK.
- `npm run lint:phase -- --list` -> OK.
- `npm run lint:phase:release` -> FAIL as expected for Phase 1, selected 7 release-touched v19 files and reported 39 problems.
- `git diff --check` -> OK.
- Root `package.json` parse -> OK.
- `npm run lint:v19` -> OK, Angular CLI reports all files pass linting.
- `npm run sync` -> OK after lint cleanup rollout.
- `npm run lint:release` -> OK, v19/v20/v21 all pass linting.
- `npm --prefix versions/v19 run build` -> OK.
- `npm install --legacy-peer-deps` in `versions/v20` and `versions/v21` -> OK; local install reports audit warnings only.
- `npm --prefix versions/v20 run build` -> OK.
- `npm --prefix versions/v21 run build` -> OK.
- Focused v19 tests via ChromeHeadless for select/object/table/tab-router/upload-file/cache specs -> OK, 264 SUCCESS with non-failing Angular runtime warnings.
- Final `npm run sync` using package-lock exclusion -> OK.
- Final `npm run lint:release` -> OK.
- `git diff --cached --check` -> OK.

## Resume From Here
No active follow-up in this session.
