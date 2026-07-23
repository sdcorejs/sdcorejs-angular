---
date: 2026-07-23T04:48:00+07:00
track: angular
task: production-ready-1-4-task-11
status: completed
---

# Add task registry and job progress

## Implemented

- Added `@sdcorejs/angular/services/task` with stable-ID reference-counted leases, manual/poll/SSE sources, non-overlapping polling, bounded exponential retry/jitter, injected EventSource/random adapters, coalesced cancellation and deterministic terminal/injector teardown.
- Added `@sdcorejs/angular/components/job-progress` with direct-state or registry-ID binding, bar/compact/details modes, cancel/retry actions, localized status copy, semantic progress/error announcements and reduced-motion behavior.
- Added root/public exports, 5-locale copy, two 4-section Showcase pages, API/user/technical docs and screenshot capture metadata.

## Review repairs

- Made pending cancellation reactive and blocked retry while transport is healthy.
- Prevented destroyed leases and late cancel completions from mutating detached entries.
- Applied direct-state precedence consistently to display, action eligibility and delegation when `state` and `taskId` are both present.
- Removed indeterminate animation under `prefers-reduced-motion`.

## Verification

- Focused library task/job-progress/public API: 28/28 PASS.
- Showcase registry/demos: 9/9 PASS; generators: 27/27 PASS.
- v19 library build, v19 production Showcase build and lint PASS.
- Showcase: 94 pages, 296 examples, 1441 deployment routes.
- i18n: 502 unique keys in each of en/vi/ja/ko/zh; no missing/extra/duplicate keys.
- Prettier, screenshot script syntax and `git diff --check` PASS; no v20/v21 direct edits.
