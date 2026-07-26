---
updated_at: 2026-07-27T02:29:00+07:00
status: complete
track: angular
active_skill: sdcorejs-git
branch: feat/layout-navigation-polish
---

# Current Session Checkpoint

## User request

Repair the Layout V2/V3 findings, make release suffix 1.5 documentation-complete,
then commit, push and create a pull request.

## Tasks

- [x] (2026-07-27) Identify the 1.4/1.5 documentation gap and Layout root causes.
- [x] (2026-07-27) Capture RED regressions for mobile containment and the version catalog.
- [x] (2026-07-27) Repair Layout, generated-documentation tooling and 1.5 docs.
- [x] (2026-07-27) Pass tests, lint, sync, builds and browser UAT.
- [x] (2026-07-27) Review the final diff, commit intentionally, push and create PR #17.

## Current state

- All code and documentation repairs are complete.
- The canonical v19 workspace is synchronized to v20/v21.
- The 1.5 collector was verified in a temporary output directory with 97
  documents per Angular major.
- No tag, npm publication or immutable 1.5 archive creation is included.
- Repair commit `daf49b2` is pushed and PR
  `https://github.com/sdcorejs/sdcorejs-angular/pull/17` targets `main`.

## Verification

- Library: `3856 SUCCESS` with 9 intentional skips.
- Showcase: `198 SUCCESS`.
- Focused Layout and version-catalog suites pass across Angular 19/20/21.
- Generator suites: `29 SUCCESS`.
- v19/v20/v21 builds, full v19 lint, release lint, sync parity and browser UAT
  pass.

## Resume from here

Review CI and PR feedback. Tagging, npm publication and immutable 1.5 archive
creation require a separate explicit release action after merge approval.
