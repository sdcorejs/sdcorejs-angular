# Execution — Cố định múi giờ cho Core UI (`ISdCoreConfiguration.timeZone`) — 2026-10-17

Nhật ký thực thi plan r3 cho tính năng cố định múi giờ. Phần utils đã release; phần Core UI đã làm xong trên worktree, **chưa commit**.

## 1. Trạng thái nhanh

- **Utils (`sdcorejs/sdcorejs-ultis`):** TASK-001…003 xong. Squash merge #20 (`7bfc9b8`), PR version #21 (`dfe9fa7`), tag `v1.3.0`. npm `@sdcorejs/utils@1.3.0` là `latest`, có provenance.
- **Core UI (`sdcorejs/sdcorejs-angular`):** TASK-004…019 xong trên branch `claude/core-ui-fixed-timezone` (từ `origin/main` `5f692cd34`). Chưa commit, chưa PR.
- **Independent review:** chưa thực hiện (pending).

## 2. Chuỗi artifact đã duyệt

| Loại | Path | Hash |
| --- | --- | --- |
| Spec r3 | `.sdcorejs/specs/angular/2026-10-16-15-37-core-ui-fixed-timezone-r3.md` | `sha256:v1:ee30a3ad…` |
| Architecture | `.sdcorejs/architecture/angular/2026-10-16-15-55-core-ui-fixed-timezone.md` | `sha256:v1:4d194a5e…` |
| Plan r3 (đang áp dụng) | `.sdcorejs/plans/angular/2026-10-16-16-46-core-ui-fixed-timezone-r3.md` | `sha256:v1:ba94982a…` |

## 3. Phạm vi đã làm (Core UI, `versions/v19`, rồi sync sang v20–v22)

1. **Cấu hình:** `SdTimeZone` (union mở, 22 id gợi ý + `string & {}`) và `ISdCoreConfiguration.timeZone`.
2. **`SdDateTimeService`** (`@sdcorejs/angular/services/date-time`, root): `toFormat`, `parse`, `parseFrom`, `begin`, `end`, `beginOfNextDay`, `today`, `now`, `toWallClock`, `fromWallClock`. Zone sai hoặc offset số thì throw. `ɵsdInjectDateTime()` cho pipe; `ɵSD_LOCAL_DATE_TIME` cho hàm thuần không có injector (xem phần 5).
3. **Pipe:** `sdFormatDate`, `sdFormatDatetime`, `sdTimeDifferent`, history `viewDateTime`.
4. **Form:** `sd-date`, `sd-datetime` (adapter `SdDatetimeTimeZoneAdapter`), `sd-date-range`, `SdStrictDateAdapter.today()`. Có zone thì control ở chế độ model-facing (`form.value` giữ giá trị model).
5. **Table:** `SdConvertToPagingReq` nhận `dateTime` (tuỳ chọn, public); `filterLocalItems`/`matchesColumnFilter`, `compareLocalValues`, `calculateAggregate`/`buildAggregateSnapshot` nhận `dateTime` (nội bộ); export Excel qua `toFormat`. `sd-table` truyền service.
6. **Import-excel:** ô Date đọc UTC fields là giờ đồng hồ trong zone; ô text qua `parseFrom`; pipe preview qua `toFormat`. Kiểu lưu giữ nguyên.
7. **Form-generic:** `sdEvaluateFilter`/`sdElementState` nhận `timeZone`, `SdFormGenericValidationContext.timeZone`, `SdFormGenericDisplayOptions.dateFormat`; biên `'today'` của datetime theo zone; inspector theo zone.
8. **File-explorer:** `sdFileExplorerFormatDate`/`sdFileExplorerFormatDateTime` nhận `dateTime`; nhãn hôm nay/hôm qua và tooltip theo zone.
9. **Docs:** `sd-date-time.md` (mới), `sd-core.configuration.md`, 3 pipe, 3 form, `sd-table`, `sd-import-excel`, `sd-form-generic`, `sd-file-explorer`, `sd-history`, ghi chú backend cho `sd-query-bar` / `sd-query-builder`.
10. **Showcase:** trang `services/date-time` trong `documentation.registry.ts`; registry spec 108 → 109, services 11 → 12.
11. **CHANGELOG** `[Unreleased]`: Added (timeZone + service, `SdConvertToPagingReq.dateTime`), Changed (utils 1.3.0, `form.value` của form ngày khi bật zone, kèm diff migration).
12. **Pin `@sdcorejs/utils` 1.3.0:** package.json + lockfile v19–v22 và showcase. Sync v20–v22 bằng `npm run sync`; file v22 đưa về LF.

## 4. Kiểm chứng (local, máy múi giờ Asia/Bangkok, Node 22.22.3)

| Lệnh | Kết quả |
| --- | --- |
| Karma `services/date-time` | 15/15 |
| Karma pipes + history | 86/86 (trước TASK-010) |
| Karma forms (models, date, date-range, datetime, chip-calendar, time) | 549/549 |
| Karma table (sau GREEN) | 700/700 |
| Karma import-excel | 47/47 (RED trước: 1 fail đúng dự kiến) |
| Karma form-generic | 373/373 |
| Karma file-explorer | 261/261 |
| **Hồi quy gộp** (service, pipes, history, 6 form, table, import-excel, form-generic, file-explorer) | **2017/2017** |
| `importScan` | OK |
| `modelScan` (15 file) | OK |
| `npx eslint` các file ts đã đổi trong v19 | 0 lỗi (sau `--fix` 32 lỗi prettier ở dòng mới viết) |
| `npm run test:showcase-examples` / `test:showcase-route-shells` / `test:collect-docs` / `test:showcase-changelog` | 17 / 11 / 22 / 8 pass |
| `npm run sync` + `npm run check:sync` | pass (v20, v21, v22 khớp v19) |
| pin check `@sdcorejs/utils` 1.3.0 (9 package.json + 5 lockfile) | OK |
| `npm run test:scripts` (17 nhóm) | pass hết |
| `cd versions/v19 && npm ci --legacy-peer-deps && npm run build` | exit 0 |
| `npm run build` v20 / v21 / v22 | exit 0 cả ba |
| Showcase `link:library` + xoá `.angular/cache` + `documentation.registry.spec.ts` | 10/10 (lần đầu Node hết heap 4 GB **sau** khi báo `TOTAL: 10 SUCCESS`; chạy lại với `NODE_OPTIONS=--max-old-space-size=8192` thì exit 0) |

Chưa kiểm local dưới host UTC cho Karma (CI chạy UTC). Spec mới đều ghim instant nên kỳ vọng độc lập múi giờ host.

## 5. Điểm lệch so với plan r3

1. **`forms/models/index.ts` không sửa.** Entry đã `export *` nên `ɵsdParseTransformedInstant` tự được export.
2. **`site/src/.../render.spec.ts` của utils không sửa.** Anchor guide ghim ở `guides.ts`; nội dung "Fixed time zone" gộp vào section `three-time-concepts` có sẵn.
3. **Thêm `ɵSD_LOCAL_DATE_TIME`** vào `services/date-time/src/date-time.service.ts` (+1 test trong `date-time.service.spec.ts`). Lý do: INV-003 / `modelScan` cấm `DateUtilities.begin/end/toFormat/...` trong file table, form-generic, file-explorer. Các hàm thuần (`SdConvertToPagingReq` gọi trực tiếp bởi consumer, `matchesColumnFilter`, `sdDisplayValue`) cần fallback local khi không có service. Hằng này bằng đúng service ở `'local'` (có test đối chiếu); internal (`ɵ`), không vào docs.
4. **Nhánh datetime của `SdConvertToPagingReq` giữ `new Date(value)` khi local** (mở rộng tinh thần D-029 sang file filter). `DateUtilities.parse` đọc chuỗi date-only theo nửa đêm local, khác `new Date('2026-08-15')` (UTC); giữ `new Date` để payload local giống hệt bản cũ.
5. **`scripts/generate-showcase-route-shells.test.mjs`** (ngoài danh sách file plan) phải cập nhật: số trang 108 → 109, services 11 → 12, thêm assert trang `services/date-time`. Đây là guard của registry, giống guard docs site của utils ở plan r3.
6. **Cột `'time'`:** filter client và sort không áp zone (giờ trong ngày không có zone), nhưng hiển thị và export vẫn theo zone vì ô `time` của table đã đi qua `sdFormatDatetime`.
7. **RED:** table xác nhận RED bằng lỗi compile (API chưa nhận `dateTime`); import-excel RED chạy thật (1 fail). Form-generic và file-explorer viết spec rồi code ngay, không chạy RED riêng; các spec đó phân biệt được (giá trị kỳ vọng khác với hành vi local trên cả host Bangkok lẫn UTC).
8. **Lockfile v20–v22:** lần đầu chạy `npm --prefix versions/vNN install` làm npm thêm `sdcorejs-angular-orchestrator: file:../..` vào lockfile (quirk của `--prefix` khi cwd là một package). Đã khôi phục lockfile từ HEAD và cài lại bằng `cd versions/vNN && npm install`; diff cuối chỉ còn 8 dòng utils mỗi file.

## 6. Xác nhận API consistency (self-review)

- **Tên config `timeZone`** trùng `TimeZoneOptions.timeZone` của utils 1.3.0; giá trị mặc định `'local'`.
- **Service `SdDateTimeService`**, entry `services/date-time`: theo quy ước `Sd<Name>Service` và entry kebab-case như `services/unsaved-changes`.
- **Tham số `dateTime`** dùng cùng tên ở `SdConvertToPagingReq`, `FilterLocalItemsOption`, `matchesColumnFilter`, `compareLocalValues`, `calculateAggregate`, `buildAggregateSnapshot`, file-explorer utils. Kiểu là `Pick<SdDateTimeService, ...>`; `'local'` hoặc vắng thì giữ đúng hành vi cũ.
- **`dateFormat`** đặt cạnh `numberFormat` trong `SdFormGenericDisplayOptions` (cùng kiểu formatter truyền vào).
- **Public API mới:** `SdTimeZone`, `ISdCoreConfiguration.timeZone`, `SdDateTimeService`, `SdConvertToPagingReq` `args.dateTime`. Đều là bổ sung tuỳ chọn, không đổi chữ ký cũ.
- **Hành vi đổi khi consumer bật zone:** `form.value` của `sd-date`/`sd-datetime`/`sd-date-range` (ghi ở CHANGELOG Changed, có diff migration). Không bật thì không đổi.
- **v19–v22:** chỉ sửa v19, rollout bằng `npm run sync`; `check:sync` pass.
- **Independent review:** pending.

## 7. Việc còn mở

- Commit + PR vào `main` khi người dùng yêu cầu.
- Independent review.
- Kiểm thủ công trên Showcase (đổi `timeZone` và xem các bề mặt) nếu cần.

## 8. Trạng thái working tree cuối

- Mỗi line v19–v22: 47 file sửa + file mới giống nhau (spec time-zone, `services/date-time/**`, `datetime-time-zone.adapter.ts`). v22 toàn LF.
- Ngoài `versions/`: `CHANGELOG.md`, `scripts/generate-showcase-route-shells.test.mjs`, `showcase/package.json`, `showcase/package-lock.json`, `showcase/src/app/docs/core/documentation.registry{,.spec}.ts`, artifact `.sdcorejs/**`.
- Registry spec có thêm một chỗ đếm theo nhóm điều hướng (`DOC_NAV_GROUPS`: services 11 → 12), cùng file đã có trong plan.
