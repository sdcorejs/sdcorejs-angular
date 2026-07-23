---
date: 2026-07-23T05:31:00+07:00
track: angular
task: production-ready-1-4-task-13
status: completed
---

# Complete public surface and release documentation

## Implemented

- Expanded the public API contract test to compile and runtime-check every new 1.4 component, service, helper, token, guard and exported type.
- Added the Persistence Showcase with graph round-trip, deterministic identity, versioned envelopes and invalid-input containment examples.
- Rewrote the API, Loading, Cache and Storage service docs to match the hardened runtime contracts, and added Persistence and form-connector API docs.
- Added the release 1.4 migration guide and refreshed the root README, npm-facing README and changelog draft.

## Review

- Scanned touched implementation and docs for TODO/FIXME/debug/focused tests, no-op behavior and stale runtime claims.
- Removed obsolete statements about PATCH, loading ref counts, inactive cache configuration and JSON-only storage loss.
- Kept the existing Loading Showcase section IDs stable while documenting real ref-count, `run()` and handle behavior.

## Verification

- Public-surface library smoke: 13/13 PASS.
- Persistence Showcase/registry: 8/8 PASS; generators: 27/27 PASS.
- v19 library build, production Showcase build and lint PASS.
- Showcase: 96 pages, 304 examples, 1471 routes and 1472 generated shells including 404.
- Screenshot script syntax, `git diff --check` and untracked whitespace scan PASS; no v20/v21 direct edits.
