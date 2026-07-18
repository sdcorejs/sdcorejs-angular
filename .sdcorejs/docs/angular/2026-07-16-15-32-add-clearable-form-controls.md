# Bổ sung clearable cho form controls — 2026-07-16 15:32

## What was requested

Bổ sung option `clearable` cho input, input-number, input-color, date và datetime với mặc định `false`; inline column filter và external filter của `SdTable` phải chủ động bật option này.

## What was changed

- EDIT `versions/v19/projects/sdcorejs-angular/forms/{input,input-number,input-color,date,datetime}` — thêm/chuẩn hóa public input `clearable`, gate nút clear ở edit/inline mode và cập nhật component reference.
- EDIT `versions/v19/projects/sdcorejs-angular/components/table/src/components/filter` — bật `clearable` cho string/number/date/datetime filters và các split number/date controls.
- EDIT focused component specs — bao phủ default false, opt-in, delegation của `SdInputColor`, inline behavior và table filter bindings.
- EDIT mirrors `versions/v20` và `versions/v21` qua root `npm run sync`; `npm run check:sync` xác nhận parity.
- CREATE `.sdcorejs/documentation/technical-docs/clearable-form-controls-and-table-filters.md` — technical contract, migration impact, table integration và verification commands.

## Decisions made

- `clearable` dùng `booleanAttribute`; bare attribute tương đương binding `true`.
- Default thống nhất là `false` trên cả năm form controls.
- `clearable` chỉ kiểm soát UI affordance; public method `clear()` vẫn giữ nguyên.
- Nút clear tiếp tục bị ẩn khi empty/required/disabled; input và input-number còn gate readonly, date/datetime edit mode còn gate bare.
- `SdInputColor` delegate sang inner `SdInput` thay vì tạo markup clear riêng.
- v19 là source of truth; v20/v21 là mirrors sinh bởi sync script.
- Finish gate: standard focused tests, technical doc, code review + repair; không tạo user guide.

## Verification

- Focused Angular/Karma suite: `333 SUCCESS`, `0 FAILED` trên v19 sau khi build dist hiện hành.
- `npm --prefix versions/v19 run build`: pass.
- `npm run lint:phase:release`: pass.
- `npm run check:sync`: pass.
- `git diff --check`: pass.
- `npm run lint:release`: pass trên v19, v20 và v21 sau khi khôi phục local Prettier v19 về đúng lockfile `3.8.3` và chuẩn hóa line ending của `org-chart.model.ts`; manifest/lockfile không đổi.
- Review finding R1 (thiếu `clearable` trong coercion note của date/datetime docs) đã được repair và re-review hội tụ.
- Final ship verification: v19 build pass; 7 focused specs pass `333/333`; `npm run check:sync` và `git diff --check` pass.
- Full suite direct CLI vẫn có 17 baseline failures ngoài scope; focused suite của feature không có failure.

## Open questions / follow-ups

- Không có blocker hoặc follow-up chức năng cho contract `clearable`.
- Full release lint không còn blocker; baseline full-test failures tiếp tục được theo dõi riêng, không phát sinh từ feature này.

## Product traceability

- Không tạo product ledger: đây là thay đổi public API/UX ở thư viện Core UI, không có TASKID hay product requirement artifact riêng trong request.

## Next suggested action

- Tạo commit trên `feat/clearable-form-controls` sau khi branch-ready gate pass, rồi push branch lên `origin`.

## Skill provenance

Skills invoked this session: `sdcorejs-using-skills` -> `sdcorejs-explore` -> `sdcorejs-angular` -> `sdcorejs-test` -> `sdcorejs-debug` -> `sdcorejs-review` -> `sdcorejs-repair-loop` -> `sdcorejs-documentation`.
