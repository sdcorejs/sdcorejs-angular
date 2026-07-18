# Chuẩn hóa type-only barrel exports — 2026-07-17 16:42

## What was requested

Rà soát các barrel exports của `@sdcorejs/angular` và dùng `export type` cho những module chỉ xuất interface/type nhằm tách rõ type space khỏi runtime space.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/**/index.ts` và `services/excel/src/public-api.ts` — đổi 46 type-only wildcard re-export thành `export type * from` trong 25 barrel files.
- EDIT matching barrel files under `versions/v20` và `versions/v21` — rollout từ source of truth v19.
- EDIT `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, `versions/v21/SYNC-STATUS.md` — cập nhật metadata rollout.

## Decisions made

- Giữ nguyên declaration `export interface`; chỉ thay đổi cú pháp re-export trong barrel.
- Chỉ chuyển các target được TypeScript checker xác nhận không có runtime value export; 370 mixed/runtime wildcard exports được giữ nguyên.
- Dùng `export type *` để giữ nguyên toàn bộ public type names với diff nhỏ và dễ duy trì.
- Test coverage level: standard, theo lựa chọn của người dùng.
- User-guide và technical-doc không áp dụng vì đây là refactor type surface, không thêm tính năng hoặc hành vi người dùng.

## Verification

- Build Angular package pass trên v19, v20 và v21.
- `npm run lint:release` pass sau khi chuẩn hóa CRLF cho các dòng đã sửa.
- `npm run check:sync` pass.
- Public surface comparison: 0 thay đổi trên 82 entry points.
- Public consumer compile: 25 representative type symbols pass trên v19/v20/v21.
- Runtime FESM audit: representative interface/type names không xuất hiện trong runtime export lists.

## Open questions / follow-ups

- Không có.

## Product traceability

- Không áp dụng; không có user-visible feature change.

## Next suggested action

- Không có bước code bắt buộc còn lại; chỉ tạo Git artifact khi người dùng yêu cầu.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-review` -> `sdcorejs-repair-loop` -> `sdcorejs-documentation` -> `sdcorejs-ship`.
