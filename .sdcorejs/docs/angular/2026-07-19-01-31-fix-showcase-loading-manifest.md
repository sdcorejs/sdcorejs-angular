# Khắc phục Showcase Loading manifest — 2026-07-19 01:31

## What was requested

Khắc phục lỗi production sau release v1.3: `Example manifest for services/loading has 4 entries; expected 3`.

## What was changed

- EDIT `scripts/generate-showcase-example-sources.test.mjs` — thêm regression test đối chiếu `demoSectionCount` của toàn bộ local documentation registry với records generator thực tế.
- EDIT `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts` — cập nhật Loading từ 3 thành 4 demo sections.
- EDIT `versions/v20|v21/projects/showcase/src/app/docs/core/documentation.registry.ts` — rollout cùng fix từ source-of-truth v19.
- EDIT `versions/v19|v20|v21/projects/showcase/src/app/docs/core/documentation.registry.spec.ts` — cập nhật aggregate demo expectations từ 253 lên 254.
- EDIT `versions/v19|v20|v21/SYNC-STATUS.md` — cập nhật metadata rollout.

## Decisions made

- Root cause là registry count stale sau khi demo multi-host được thêm, không phải generated manifest stale.
- Giữ runtime assertion; không che lỗi hoặc bỏ validation.
- Regression test kiểm tra toàn registry để ngăn cùng lỗi trên page khác.
- Regression parser fail-closed khi bỏ sót registry block và kiểm tra hai chiều để bắt orphan manifest page.
- Không di chuyển tag `v1.3`; hotfix Showcase sẽ deploy qua commit merge vào `main`.

## Open questions / follow-ups

- Browser smoke không chạy được do phiên hiện tại không có browser backend; regression test và production build là automated evidence thay thế.
- Sau khi merge PR, theo dõi `deploy-pages.yml` và xác nhận site production không còn exception.

## Next suggested action

- Merge PR hotfix vào `main`, sau đó theo dõi GitHub Pages deploy tới khi success.

## Skill provenance

Skills invoked this session: `sdcorejs-debug` -> `systematic-debugging` -> `test-driven-development` -> `sdcorejs-angular` -> `sdcorejs-ship` -> `sdcorejs-git`.
