---
updated_at: 2026-07-13T14:12:00+07:00
status: completed
track: angular
active_skill: sdcorejs-angular
branch: refactor/showcase-documentation-site
---

# Current Session Checkpoint

## User Request
Refactor toàn bộ Angular showcase thành một documentation site chuyên nghiệp, giữ đủ demo, hỗ trợ published docs/version/changelog/about và đồng bộ từ v19 sang v20/v21.

## Tasks
- [x] Audit showcase, published docs, routes, demos và khả năng tái sử dụng
- [x] Xây foundation registry, services, shell, routing và shared docs UI
- [x] Migrate toàn bộ trang/demo và hoàn thiện Button làm mẫu
- [x] Thêm landing, search, changelog, about, generators và authoring guide
- [x] Đồng bộ v19 sang v20/v21 và chạy validation
- [x] Review, repair loop, runtime audit và handoff

## Current State
- Last completed: v19 showcase production build, 390px/desktop CDP audit, `npm run sync` và `npm run check:sync` đều pass.
- In progress: Không có; sẵn sàng bàn giao diff trên branch refactor.
- Blocked/skipped: Không có blocker. NVDA/VoiceOver, Lighthouse/axe và memory profile dài hạn chưa chạy vì cần môi trường/manual tooling riêng.

## Artifacts Touched
- ADD/EDIT `versions/v19/projects/showcase/src/app/docs/**` - documentation registry, services, pages, shared UI và tests.
- EDIT `versions/v19/projects/showcase/src/app/pages/**` - 253 focused structural guards; Button tách 7 example components.
- ADD/EDIT `scripts/generate-showcase-*.mjs` - changelog/example source generators cùng 18 Node tests.
- EDIT `.github/workflows/deploy-pages.yml`, root/v19 package scripts và showcase test/build config.
- ADD `docs/showcase-authoring.md`; sync cùng feature surface sang v20/v21.

## Verification
- `npm run test:showcase-generators` - 19/19 pass.
- `npm run test:showcase` (v19) - 63/63 pass.
- v19 library production build - pass.
- v19 showcase production build - pass; initial estimated transfer 189.86 kB.
- CDP production audit - 390px không overflow, zero console/network errors, route title/published docs/focused sections đúng.
- `npm run sync` + `npm run check:sync` - pass.

## Resume From Here
Review final diff hoặc commit/push branch khi người dùng yêu cầu. Không hand-edit v20/v21; tiếp tục sửa v19 rồi sync lại.
