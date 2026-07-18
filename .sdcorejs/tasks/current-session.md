---
updated_at: 2026-07-19T01:36:20+07:00
status: in_progress
track: angular
active_skill: sdcorejs-debug
branch: fix/showcase-loading-manifest-count
---

# Current Session Checkpoint

## User Request

Khắc phục lỗi production `Example manifest for services/loading has 4 entries; expected 3` sau release v1.3.

## Tasks

- [x] Tái hiện lỗi manifest `services/loading` trên source và artifact deploy
- [x] Truy ngược registry, generator, generated manifest và runtime assertion
- [x] Xác nhận root cause bằng repro 3/3 và test freshness
- [x] Thêm regression test, sửa count và verify runtime/build
- [ ] Commit, push và tạo PR hotfix

## Current State

- Last completed: full generator/branding tests, sync, lint và production Showcase build đều pass.
- In progress: independent review và branch-ready gate.
- Blocked/skipped: browser smoke skipped vì phiên không có browser backend.

## Artifacts Touched

- EDIT `scripts/generate-showcase-example-sources.test.mjs` - kiểm tra count registry khớp record generator.
- EDIT `versions/v19|v20|v21/projects/showcase/src/app/docs/core/documentation.registry.ts` - Loading có 4 demo sections.
- EDIT `versions/v19|v20|v21/projects/showcase/src/app/docs/core/documentation.registry.spec.ts` - aggregate expectations cập nhật lên 254.
- EDIT `versions/v19|v20|v21/SYNC-STATUS.md` - metadata rollout.

## Verification

- `npm run test:showcase-examples` - RED 14/15 trước fix, GREEN 15/15 sau fix.
- `npm run sync` - pass.
- `npm run test:showcase-generators` - pass, 27/27.
- `npm run test:showcase-branding` - pass, 3/3.
- `npm run check:sync` - pass.
- `npm run lint:release` - pass cho v19/v20/v21.
- v19 library + production Showcase build - pass.
- Repro sau fix - pass 3/3 (`actual=4`, `expected=4`, `throws=False`).
- Targeted `documentation.registry.spec.ts` - RED 2/6 trước khi cập nhật aggregate, GREEN 6/6 sau fix.
- Browser smoke - skipped, no browser backend available.

## Resume From Here

Hoàn tất review, commit, push và tạo PR hotfix.
