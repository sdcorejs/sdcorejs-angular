# Modernize Angular public APIs — 2026-07-20 15:11

## What was requested

Rà soát component/service còn dùng `@Input`/`@Output`, constructor DI và mutable state; chuyển sang `input()`/`output()`/`inject()`/signal khi an toàn. Thực hiện tại v19 rồi đồng bộ sang v20/v21.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/**` — migrate an toàn 76 inputs, 44 outputs và constructor DI trong 68 file; cập nhật template đọc signal inputs.
- EDIT `versions/v19/projects/sdcorejs-angular/**` — giữ và ghi chú các ngoại lệ cần `.observed`, runtime constructor arguments hoặc direct instantiation ngoài injection context.
- EDIT `versions/v20/projects/sdcorejs-angular/**` — mirror source v19 bằng root sync cho Angular 20.
- EDIT `versions/v21/projects/sdcorejs-angular/**` — mirror source v19 bằng root sync cho Angular 21.
- EDIT `versions/v19|v20|v21/SYNC-STATUS.md` — cập nhật trạng thái workspace sau rollout.
- CREATE `.sdcorejs/documentation/technical-docs/angular-modern-api-migration.md` — mô tả phạm vi, contract, ngoại lệ và verification cho maintainer.
- CREATE `.sdcorejs/documentation/user-guides/angular-modern-api-migration.md` — hướng dẫn template/TypeScript consumer sau migration.
- EDIT `.sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs` — ghi nhận API-only guide không có screenshot riêng.

## Decisions made

- `versions/v19` tiếp tục là source of truth; v20/v21 chỉ nhận thay đổi qua `npm run sync`.
- Chỉ chấp nhận migration ở safe mode; không ép 180 decorator inputs khi setter, alias, write access hoặc baseline type errors làm contract chưa rõ.
- Giữ bốn `EventEmitter` vì code/template đọc `.observed`; giữ ba outputs của `GenericSelectComponent` cho tới khi type contract được thống nhất.
- Giữ constructor DI của `VariableComponent` vì class có call site `new VariableComponent(ref)` ngoài Angular injection context; dùng `inject()` tại đây tái hiện `NG0203`.
- Không mass-convert internal state sang signal khi lifecycle, mutation identity hoặc equality semantics chưa được chứng minh.
- User chọn full tests, cả technical doc và user guide, cùng full review + repair loop.

## Open questions / follow-ups

- Chuẩn hóa type contract của ba outputs trong `GenericSelectComponent`, sau đó mới migrate sang `output()`.
- Rà từng nhóm setter/aliased inputs còn lại bằng focused tests nếu muốn tiếp tục giảm 180 decorator inputs.
- Full Karma còn 15 baseline failures: 13 failures tái hiện ngoài diff và 2 drag/drop failures phụ thuộc test order; coverage statements/lines/functions vẫn dưới threshold.

## Product traceability

- Không áp dụng: đây là refactor public-library API, không tạo user-visible feature, route hoặc domain behavior mới.

## Next suggested action

- Sửa baseline Karma failures và đưa coverage trở lại threshold trước khi coi branch là hoàn toàn green.
- Chuẩn hóa `GenericSelectComponent` output types rồi chạy lại Angular output migration ở safe mode.

## Verification evidence

- PASS `npm run check:sync` — v20/v21 match v19.
- PASS `npm run lint:release` — v19, v20 và v21.
- PASS full library `npm run build` — v19, v20 và v21.
- PASS focused `VariableComponent` regression — 1/1.
- PARTIAL full Karma — 3.198 pass, 15 fail, 9 skip; migration regression đã được sửa.
- PASS review/repair — không còn blocking finding thuộc diff migration.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-explore` -> `sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-debug` -> `sdcorejs-review` -> `sdcorejs-repair-loop` -> `sdcorejs-documentation` -> `sdcorejs-ship`.
