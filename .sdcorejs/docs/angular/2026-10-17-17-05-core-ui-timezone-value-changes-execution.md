# Execution — form.valueChanges khi bật timeZone hoặc transform — 2026-10-17

Plan `.sdcorejs/plans/angular/2026-10-17-17-05-core-ui-timezone-value-changes.md` (`sha256:v1:9cf36b2d…`), spec `.sdcorejs/specs/angular/2026-10-17-16-54-core-ui-timezone-value-changes.md` (`sha256:v1:8e77bcb6…`). Gate kiến trúc: not-applicable (`bounded-bug-fix`). `prepareExecution`: valid (track angular, strict-v2). Nguồn: phát hiện 2 của e2e (`.sdcorejs/docs/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e-execution.md`).

## 1. Thay đổi

- `forms/models/src/sd-model-facing-control.ts`: khi control editor (`source`) phát `valueChanges`, helper đặt cờ "người dùng vừa sửa"; lần đồng bộ model → control kế tiếp (effect, hoặc microtask nếu chạy trước) ghi model với `emitEvent: true` rồi xoá cờ. Ghi model từ `[(model)]` của cha vẫn im lặng; ghi qua control đã đăng ký vẫn phát đúng một lần.
- Spec mới `forms/models/src/sd-model-facing-control.spec.ts` (5 case) và thêm `describe('form.valueChanges')` (3 case mỗi file) vào ba `*.time-zone.spec.ts`; `setup` của ba file nhận thêm `transform` để đặt trước lần render đầu.
- Demo `services/date-time` đọc `form.value` từ `form.valueChanges` (bỏ `sdChange` + `focusout` + `setTimeout`).
- Doc ba form, `sd-date-time.md`, CHANGELOG `[Unreleased]` (Changed); v20–v22 qua `npm run sync`, v22 LF.

## 2. TDD ledger

| Case | RED | GREEN |
| --- | --- | --- |
| helper (5) | 3 case "phát" fail (không có sự kiện), 2 case "im lặng" pass — RED hợp lệ | 5/5 |
| component (9) | 6 case "phát" fail, 3 case "`[model]` im lặng" pass — RED hợp lệ | 9/9 |

## 3. Kiểm chứng (Asia/Bangkok host, Node 22.22.3)

| Lệnh | Kết quả |
| --- | --- |
| Karma `forms/models`, `forms/date`, `forms/date-range`, `forms/datetime`, `forms/chip-calendar`, `forms/time` | 563/563 (seed 225543) |
| `npm --prefix versions/v19 run build && npm --prefix showcase run e2e` | build OK, e2e 14 passed (demo đọc `valueChanges`) |
| `npx eslint` 5 file ts đã đổi | exit 0 |
| `npm run check:sync` + kiểm doc/CHANGELOG có `valueChanges` | pass |
| `npm run test:scripts` | exit 0 |

## 4. Điểm lệch và ghi chú

1. `showcase/src/app/docs/generated/example-manifest.generated.ts` có trong plan (EDIT) nhưng không đổi: tiêu đề và note của demo giữ nguyên nên generator sinh lại y hệt; chỉ `example-sources.generated.ts` đổi.
2. **Hành vi có sẵn, không sửa:** nếu đổi `transform` lúc runtime, lần commit đầu tiên sau đó đổi control đăng ký trong form và form cha phát thêm một lần (giá trị cũ hoặc `null`). Spec component đặt `transform` trước lần render đầu để không dính hiện tượng này.
3. **Lỗi thứ tự spec có sẵn:** một lần chạy (seed 961716) đỏ ở `SdTime (validation message is interaction-gated)` vì spec của `sd-date`/`sd-datetime` (từ #60) đặt ngôn ngữ `'en'` vào localStorage. Không liên quan thay đổi này; lần chạy lại xanh.
