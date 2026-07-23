---
date: 2026-07-23T04:22:00+07:00
track: angular
task: production-ready-1-4-task-10
status: completed
---

# Add unsaved changes registry and close adapters

## Implemented

- Added `@sdcorejs/angular/services/unsaved-changes` with scoped/idempotent registrations, aggregated dirty signals, save/reset/discard actions, scope-aware prompt coalescing, configurable confirmation adapter, browser window token, conditional `beforeunload`, SSR safety and deterministic cleanup.
- Added functional CanDeactivate guard, FormGroup snapshot adapter and reusable close guard.
- Added backward-compatible `beforeClose`, `requestClose`, `forceClose` and close-error contracts to Modal, SideDrawer and Tab; changed TabRouter callback exceptions from fail-open to fail-closed.
- Added five-locale copy, root/public exports, 4-section Showcase page, API/user/technical docs and screenshot capture metadata.

## Review repairs

- Namespace registration identity by `(scope, id)` instead of global id.
- Keep pending prompt results isolated by scope.
- Promote a successful FormGroup save to the next discard snapshot.
- Run ignored duplicate cleanup without tearing down a re-registered identical watcher object.
- Route guarded Material backdrop/Escape through the same coalesced close request.

## Verification

- Focused library acceptance: 177/177 PASS; final cleanup regression slice 14/14 PASS.
- Showcase registry/demo: 8/8 PASS; generators: 27/27 PASS.
- v19 library build, v19 production Showcase build and lint PASS.
- Showcase: 92 pages, 288 examples, 1411 deployment routes.
- i18n: 494 unique keys in each of en/vi/ja/ko/zh; no missing/extra keys.
- Prettier, screenshot script syntax and `git diff --check` PASS; no v20/v21 direct edits.
