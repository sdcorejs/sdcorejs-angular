# SdTable empty-result reload — 2026-07-23 15:45

## What was requested

Cho phép nút Reload của `SdTable` vẫn hiển thị và bấm được khi
`items.length === 0` hoặc `total === 0`, đồng thời commit/push với changelog và
tài liệu Markdown đầy đủ.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html`
  — bỏ duy nhất item-count disabled binding của reload.
- EDIT `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
  — thêm regression cho enabled reload, refetch, export và paginator khi kết quả rỗng.
- EDIT `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`
  — cập nhật public component contract.
- EDIT `CHANGELOG.md` và GENERATE Showcase changelog — ghi nhận fix dưới
  `Unreleased / Fixed`.
- EDIT `versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts`
  — suy ra typed-array type từ fake document để test graph biên dịch trên
  TypeScript 5.7–5.9.
- EDIT `versions/v19/projects/sdcorejs-angular/modules/layout/services/responsive/responsive.service.spec.ts`
  — dùng cùng public viewport entrypoint với code đang test, loại bỏ duplicate
  token/class identity trong full suite.
- GENERATE các mirror tương ứng dưới `versions/v20`, `versions/v21` và cập nhật
  ba `SYNC-STATUS.md` bằng root sync.
- CREATE `.sdcorejs/documentation/technical-docs/sd-table-empty-result-reload.md`
  — technical contract, source map và verification evidence.
- CREATE `.sdcorejs/documentation/user-guides/sd-table-empty-result-reload.md`
  — user-facing retry guidance, được tạo ở documentation tail sau session doc này.

## Decisions made

- Chỉ bỏ `[disabled]="!_items.length"`; không thêm predicate theo `total`,
  loading hoặc API mới.
- Giữ nguyên desktop-only visibility, export gating và paginator behavior.
- `versions/v19` tiếp tục là source of truth; v20/v21 chỉ thay đổi qua `npm run sync`.
- Test coverage: standard, RED-first theo lựa chọn của user.
- Review + repair loop: bật theo lựa chọn của user.
- Test-only verification repairs không thay đổi runtime PDF, layout hoặc loading.
- Full Karma suites phải chạy tuần tự; chạy đồng thời nhiều workspace có thể
  tranh chấp browser/Karma resources và tạo failure không tái hiện khi tuần tự.

## Verification

- Focused `SdTable`: v19/v20/v21 đều `58/58 SUCCESS`.
- Focused PDF: v19/v20/v21 đều `139/139 SUCCESS`.
- Focused responsive repair: v19/v20/v21 đều `4/4 SUCCESS`.
- Full `test:ci`: v19/v20/v21 đều exit `0` khi chạy tuần tự.
- `npm run lint:release`: pass.
- Library build v19/v20/v21: pass.
- Showcase v19 build: pass.
- Browser smoke: local Showcase HTTP 200; Table Examples render; không có
  browser console error.
- `npm run check:sync` và `git diff --check`: pass trước documentation tail.

## Product traceability

- Approved behavior source:
  `docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md`.
- Approved implementation snapshots:
  `.sdcorejs/plans/angular/2026-07-23-12-29-sd-table-empty-reload.md` và
  `.sdcorejs/plans/angular/2026-07-23-15-11-sd-table-empty-reload-revision-2.md`.
- Không tạo product PRD/user-story ledger riêng vì đây là bug fix hẹp, không bổ
  sung workflow, role, route hay public API.

## Open questions / follow-ups

- Không có acceptance gap.
- Published-version metadata không khả dụng trong local Showcase smoke; local
  catalog, examples và production build vẫn hoạt động.
- Git commit/push được thực hiện sau final documentation, task-tracker và
  branch-hygiene checks theo yêu cầu của user.

## Next suggested action

- Tạo user guide đã được phê duyệt.
- Cập nhật current-session/task tracker.
- Chạy lại sync/diff/lint/focused checks sau documentation tail.
- Commit và push branch `chore/prepare-1.4`.

## Skill provenance

`sdcorejs-brainstorming` -> `sdcorejs-plan` -> `sdcorejs-execute-plan` ->
`sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-review` ->
`sdcorejs-debug` -> `sdcorejs-repair-loop` -> `sdcorejs-documentation` ->
`sdcorejs-ship`.
