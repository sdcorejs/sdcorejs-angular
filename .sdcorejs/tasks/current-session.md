---
updated_at: 2026-06-24T23:13:30+07:00
status: complete
track: angular
active_skill: sdcorejs-ship, sdcorejs-git
branch: release/0.10
---

# Current Session Checkpoint

## User Request
Bo sung lint entry points va chia phase fix lint cho `sdcorejs-angular`.

## Tasks
- [x] Ra lai lint command/config hien tai va root entry point
- [x] Them lint entry points de chay theo release/workspace/phase
- [x] Viet phase plan don lint co thu tu va tieu chi pass ro rang
- [x] Verify JSON/script thay doi va chay thu lenh lint phase nho
- [x] Commit/push bo sung len `release/0.10` hoac bao neu bi chan

## Current State
- Last completed: Added lint entry points, phase runner, and lint cleanup plan; ready to commit/push.
- In progress: None.
- Blocked/skipped: Actual lint cleanup is not performed in this commit; Phase 1 remains red with 39 release-touched lint problems.

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

## Verification
- Prior release verification is in commit `5c86405b`.
- `versions/v19`: `npm run lint` -> FAIL, 3080 problems (baseline).
- `versions/v19`: changed-file eslint subset -> FAIL, 39 problems.
- `node --check scripts/lint-phase.mjs` -> OK.
- `npm run lint:phase -- --list` -> OK.
- `npm run lint:phase:release` -> FAIL as expected for Phase 1, selected 7 release-touched v19 files and reported 39 problems.
- `git diff --check` -> OK.
- Root `package.json` parse -> OK.

## Resume From Here
Start Phase 1 from `docs/lint-fix-phases.md`: fix `npm run lint:phase:release` first, then verify focused tests/build.
