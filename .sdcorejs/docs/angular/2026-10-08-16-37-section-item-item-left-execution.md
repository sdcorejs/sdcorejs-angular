---
artifact_id: execution-section-item-item-left-20261008
artifact_kind: execution-doc
change_ref: section-item-item-left
source_spec: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
source_architecture: .sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md
source_plan: .sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md
commit_policy: with-change
owner: sdcorejs-angular
track: angular
created_at: 2026-10-08T10:10:00.000Z
redaction_applied: false
---

# Change Execution Record - Slot `[itemLeft]` cho sd-section-item (port NSP-5634)

## Requested Outcome

Port slot `[itemLeft]` và `label` tuỳ chọn của `@sd-angular/core` `19.0.43` (NSP-5634, lib-core-angular MR !211) sang `@sdcorejs/angular`. Consumer chuyển giữa hai gói không phải sửa template. Người dùng yêu cầu tạo branch từ `main` và mở PR vào `main`.

## Material Changes

Mọi path dưới đây thuộc `versions/v19/projects/sdcorejs-angular/components/section/` trừ khi ghi khác.

- EDIT `src/section-item/section-item.component.ts`: `label = input<string>('')` (trước là `input.required`), kèm JSDoc ngắn.
- EDIT `src/section-item/section-item.component.html`: `.c-item-label` bọc `<ng-content select="[itemLeft]">{{ label() }}</ng-content>`; class `c-item-label T14R text-secondary` và `labelWidth` giữ nguyên.
- EDIT `src/section-item/section-item.component.spec.ts`: 5 case mới:
  - label-only giữ class, width và text;
  - slot thay label và giữ width;
  - value slot chạy song song slot trái;
  - slot-only không có `label`;
  - `label()` mặc định là `''`.
- EDIT `sd-section.md`:
  - `label` mặc định `''`;
  - thêm bảng slot của `<sd-section-item>`;
  - ghi hành vi fallback, quirk `@if` và việc kế thừa màu;
  - thêm ví dụ.
- EDIT `showcase/src/app/pages/components/section/section-demo.component.ts`: thêm block "Section item custom left column" (id `example-section-item-custom-left-column`), có guard `focusedSectionId`.
- EDIT `showcase/src/app/docs/core/documentation.registry.ts`: `demoSectionCount` của section từ 8 lên 9. `documentation.registry.spec.ts` sửa tổng từ 403 lên 404.
- REGENERATE `showcase/src/app/docs/generated/example-{sources,manifest}.generated.ts` bằng `npm run generate:showcase-examples`. Kết quả chỉ thêm, không xoá dòng nào.
- EDIT `CHANGELOG.md` `[Unreleased]`: thêm một bullet Added (slot) và một bullet Changed (`label` tuỳ chọn).
- SYNC `npm run sync`: ghi 4 file section và `SYNC-STATUS.md` (chỉ đổi `Updated At`) vào v20, v21, v22. v22 có shim `ChangeDetectionStrategy.Eager` cho cả 3 host component trong spec.

## Decisions And Invariants

- D-001 `[itemLeft]`; D-002 fallback bằng default content của `ng-content`; D-003 giữ class mặc định của cột trái; D-004 không bump version, entry nằm ở `[Unreleased]`; D-005 branch `feat/section-item-item-left` từ `origin/main` `59f6c3eb`, PR vào `main`.
- INV-001: consumer chỉ truyền `label` có DOM như cũ. Spec label-only và các spec `label()`/`labelWidth()` có sẵn đều pass.
- INV-002: không thêm dependency, entry point, service hay style. v20, v21, v22 chỉ đổi qua sync và `npm run check:sync` pass. Không manifest hay lockfile nào đổi.

## Verification Evidence

- Preflight:
  - Local `main` chậm 10 commit so với `origin/main`, nên branch tạo trực tiếp từ `origin/main` `59f6c3eb`.
  - Working tree sạch, chỉ có artifact `.sdcorejs` của change; `prepareExecution` pass.
  - Node `22.22.3` qua fnm.
- Baseline section specs v19 (`section-item` + `section`): 57/57.
- RED: 4 case fail đúng lý do (`NG0950`, slot chưa có). Case label-only pass.
- GREEN: v19 62/62. Sau sync, v22 cũng 62/62 trên Angular 22, xác nhận A-001.
- `npx ng build sdcorejs-angular` (v19): thành công.
- `npm run test:showcase-examples`: 17/17.
- Showcase:
  - Sau `link:library`, `documentation.registry.spec.ts` 8/8. Karma báo heap OOM khi tắt, sau khi đã báo TOTAL.
  - `ng build showcase --configuration development`: thành công, không có lỗi. Build này compile demo dùng slot-only trên lib đã build.
- `npm run check:sync`: "v20, v21, v22 match v19".
- Nhiễu EOL ở v22:
  - Sync làm 1054 file v22 hiện `M`.
  - `git diff --name-only` chỉ thấy 5 file thật. 1049 file còn lại chỉ khác CRLF ở working tree; đã restore bằng `git checkout --pathspec-from-file`.
  - 5 file thật đã chuyển sang LF theo `versions/v22/.gitattributes`.
- `npx eslint` trên `section-item.component.{ts,spec.ts,html}` của v19: sạch. Showcase không có cấu hình eslint.
- Mojibake: 0 trên các dòng thêm. Một hit "ĐÃ XÓA" là tiếng Việt thật, nằm ở dòng cũ ngoài hunk. `git diff --check`: sạch.

## Known Gaps

- Chưa chạy full suite v19 với `--code-coverage` (gate release do workflow của maintainer chạy) và chưa build lib v20/v21/v22. Bù lại: `check:sync` pass và section specs v22 pass.
- Không kiểm trình duyệt showcase.

## Related Artifacts

- Spec draft: `.sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-spec.md`
- Approved spec: `.sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38`)
- Architecture draft: `.sdcorejs/docs/architecture/2026-10-08-16-37-section-item-item-left-architecture.md`
- Approved architecture: `.sdcorejs/architecture/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:99a943f9d9db8af8014e5d9f56f9e84828628c93f172de8fce3b510e79c6d80d`)
- Plan draft: `.sdcorejs/docs/angular/2026-10-08-16-37-section-item-item-left-plan.md`
- Approved plan: `.sdcorejs/plans/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:ce2a33f5ca322d14420441ab6f99c877fbd652a350050efe4cc7b5aa4168b4b9`)
- Reference: `@sd-angular/core` `19.0.43`, lib-core-angular MR !211.
