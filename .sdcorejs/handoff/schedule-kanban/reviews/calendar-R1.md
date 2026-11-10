# calendar · R1
Nhánh: `feat/calendar` · Commit: `55f33d2e` · Ngày: 2026-11-09T00:12+07:00
Reviewer: phiên mới, không có lịch sử của phiên tác giả. Chỉ đọc repo, gói handoff và lịch sử git; báo cáo Bước 0 (`reports/calendar-step0.md`) đọc sau khi xong phần đối chiếu spec.

Phạm vi R1 (REVIEW.md mục 2): API, model, cấu trúc state, test (gồm test RED có đỏ đúng lý do không). Phần tương tác, lần lặp, giao diện hẹp, in (checkpoint 3–5) chưa làm, không tính là thiếu.

## Kết luận
Chặn: 0 · Nên sửa: 8 · Ghi chú: 13 (5 mục cần PD chốt)
Được làm tiếp checkpoint 3.

Trước khi làm tiếp nên xử lý N2, N3 (quy trình RED cho các checkpoint sau) và N8 (`check:scss-hex` đang đỏ: mẫu fallback hex sẽ lan sang SCSS của checkpoint 3–5). Ở R2, N8 là mục Chặn nếu còn.

API public, model, kiểu `onMove` có `'cancel'`, `sdLoadError`, vòng đời `onLoad` (signal, abort, bỏ kết quả muộn, `reload()` giữ dữ liệu, lỗi + Thử lại) khớp `calendar.md` §2–4, phụ lục §6 và SC-22…24. Hàm thuần đủ CAL-U-01…21, coverage 100% dòng và nhánh.

## Lệnh đã chạy
Node local `v26.12.0` (PD chốt Q1: local Node 26, CI Node `24.22.1` là cổng chuẩn). Chrome Headless 156. `node_modules` của `versions/v19` là junction tới checkout chính.

| # | Lệnh | Nơi chạy | Kết quả thật |
| --- | --- | --- | --- |
| 1 | `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/calendar/**/*.spec.ts'` | worktree chính, `55f33d2e` | **67/67 SUCCESS**, 27 s tổng (Karma 0.49 s), seed 415992 |
| 2 | `npx eslint projects/sdcorejs-angular/components/calendar projects/sdcorejs-angular/testing/schedule-testing.ts` | worktree chính | exit 0; 14 file (gồm `.html`), 0 lỗi, 0 cảnh báo, ~4 s |
| 3 | Lệnh 1 tại commit RED `1c578914` | worktree tạm `git worktree add --detach` (đã gỡ) | 34 test: **31 FAILED, 3 SUCCESS**, seed 41796 |
| 4 | Lệnh 1 tại commit RED `9c414456` | worktree tạm (đã gỡ) | 65 test: **31 FAILED, 34 SUCCESS**, seed 952468 |
| 5 | Lệnh 1 thêm `--code-coverage`, tại `55f33d2e` | worktree tạm (đã gỡ) | 67/67 SUCCESS. Ngưỡng toàn cục báo đỏ (chạy tập con, không có ý nghĩa). Theo file từ `lcov.info`: `calendar.utils.ts` dòng 170/170, nhánh 96/96, hàm 50/50; `calendar.component.ts` dòng 370/379 (97.6%), **nhánh 196/232 (84.5%)**, hàm 108/113 |
| 6 | `node scripts/check-scss-hex.mjs` (= `npm run check:scss-hex`, chỉ đọc) | worktree chính | **exit 1**: 28 hex trong `calendar.component.scss` |

Không chạy (thuộc R2 hoặc ghi vào repo): `npm run lint` toàn repo (đã thay bằng lệnh 2), full suite, `ng build`, `npm run sync`, `check:sync`, E2E. Không sửa file nào ngoài báo cáo này; hai worktree tạm đã gỡ, `git worktree list` sạch.

## Test RED: có đỏ đúng lý do không

**Checkpoint 1** (`1c578914`, khung lấy từ `7918a929`, xem N4): 31/34 đỏ, **cả 31 đỏ do assert** (`Expected '' to equal '2026/10/19'`, `Expected null to equal …`, `'no key starts with core.component.calendar.'`). 3 test xanh là 3 type test trong `calendar.types.spec.ts`; TESTING §3.7 định nghĩa type test là “compile là đủ”, nên xanh là đúng. Đạt TESTING §0.1.

Commit xanh `d31465eb` chỉ **thêm** 4 assert vào spec hàm thuần, không nới assert nào.

**Checkpoint 2** (`9c414456`): 31/31 test component đỏ (34 test của checkpoint 1 xanh như mong đợi). 20 đỏ do assert. **11 đỏ do `TypeError`** vì stub chỉ render `<section></section>` nên truy vấn DOM trả `null`, hoặc `onLoad` chưa được gọi nên `pending[0]` là `undefined`:
CAL-C-03 (nav), CAL-SC-22, CAL-SC-23, CAL-SC-24 ×2, CAL-C-19 (busy), CAL-C-20 ×3 (holidays, scroll, configuration), CAL-SC-38, CAL-C-22 (block template). Lý do gốc vẫn đúng (chưa có tính năng), không phải lỗi compile hay import, nhưng không phải “assert sai” như TESTING §0.1 yêu cầu: các test đó dừng trước assert chính. Xem N2.

Commit xanh `55f33d2e` sửa spec RED ở hai chỗ: đổi một dòng (G7, hợp lệ) và **thêm 2 test chưa từng đỏ** (N3).

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| N1 | Nên sửa | `calendar.md` §4.2 (`sdRangeChange` “một lần khi khởi tạo”), CAL-C-02, CAL-C-06, SC-32 | `calendar.component.ts:264-267`, `:319-321`, `:522-534`, `:574-581` | Ở lần khởi tạo `#width` là `null`, nên `compact` là false. Effect tải chạy trước callback đầu của `ResizeObserver`. Vì vậy host hẹp (< 600px) **gọi `onLoad` hai lần** (tuần, bị abort, rồi một ngày) và **phát `sdRangeChange` hai lần** (`view: 'week'` rồi `view: 'day'`). Test CAL-C-06 không bắt được vì `trigger(599)` chỉ chạy sau render đầu. Giao diện hẹp thuộc checkpoint 5, nhưng thứ tự đo rồi mới tải là cấu trúc state cần chốt sớm. | Đặt `<sd-calendar>` trong cột 390px, đếm `onLoad` và `sdRangeChange` khi khởi tạo. | Ở checkpoint 5: đo bề rộng host trước lần tải đầu, hoặc hoãn lần tải đầu tới lần đo đầu khi có `ResizeObserver`. Thêm test với `FakeResizeObserver` báo 390px ngay lúc `observe`: `onLoad` một lần với `view: 'day'`, `sdRangeChange` một lần. |
| N2 | Nên sửa | TESTING §0.1 (RED đỏ vì assert) | `calendar.component.spec.ts:79-82` (`block`, `action`, `viewButtons` trả `null`/`undefined` không kiểm) | 11/31 test RED của checkpoint 2 đỏ do `TypeError` (danh sách ở mục trên). | Checkout `9c414456`, chạy lệnh 1. | Từ checkpoint 3: helper truy vấn tự `expect(el).withContext(selector).not.toBeNull()` trước khi thao tác, và kiểm `calls.length` trước khi dùng `pending[i]`. Hoặc stub RED render đủ khung (nút, vùng) để test dừng ở assert hành vi. Ghi danh sách test đỏ và lý do vào báo cáo cổng. |
| N3 | Nên sửa | TESTING §0.1 (RED trước) | `calendar.component.spec.ts:217-232` (CAL-C-03 min/max), `:234-240` (CAL-C-07 nhãn múi giờ) | Hai test thêm trong commit xanh `55f33d2e`, không có ở commit RED `9c414456`, nên chưa từng được chứng minh là đỏ. | `git diff 9c414456 55f33d2e -- '*calendar.component.spec.ts'` | Ghi rõ trong `reports/calendar-tests.md`. Từ checkpoint 3: test mới đi vào commit RED; commit xanh không thêm test, trừ khi báo cáo nói lý do. |
| N4 | Nên sửa | Kế hoạch commit Bước 0 §B.1; schedule-kanban/PROMPT.md “Commit và push” | commit `7918a929` | Commit `chore(handoff): add the … handoff package` chứa **code thư viện**: `components/calendar/index.ts`, `ng-package.json`, `calendar.model.ts`, `calendar.configuration.ts`, `calendar.templates.ts`, `calendar.utils.ts` (stub), 4 file spec (`utils` 505 dòng, `types`, `exports`, `i18n`) và `testing/schedule-testing.ts`. Commit RED `1c578914` chỉ là phần chênh (+136/−29). Thông điệp commit handoff không nhắc tới code. | `git show --stat 7918a929` | Trước khi push: rebase để chuyển các file thư viện từ `7918a929` sang `1c578914`, hoặc ghi rõ trong mô tả PR. |
| N5 | Nên sửa | TESTING §0.3 (truy vấn bằng role, `aria-*`, `data-autoid`, “data-\* của spec”) | spec `:79-82`, `:106`, `:221`, `:236`, `:293`, `:335`, `:338`, `:412-417`, `:455`, `:478`, `:482`; template `calendar.component.html:15-46`, `:61`, `:78`, `:82-84`, `:111`, `:146`, `:174-186`, `:193`, `:207`, `:244`, `:323`, `:370` | Test dựa vào nhiều `data-*` không có trong `calendar.md` §17: `data-day-column`, `data-day-header`, `data-event-id`, `data-action`, `data-view-option`, `data-region`, `data-band`, `data-zone`, `data-title`, `data-skeleton`, `data-now`, `data-off-hours`, `data-agenda-day`, `data-empty`, `data-more`, `data-display`… Theo TESTING §0.3, đây là chi tiết cài đặt. Nếu thả lên DOM mà không ghi tài liệu, consumer E2E sẽ dựa vào chúng như API. | grep `data-` trong spec. | PD chốt một trong hai: (a) chấp nhận danh sách hook này, ghi vào `sd-calendar.md` mục E2E; (b) đổi truy vấn sang role/`aria-label` (vd nút `aria-label="Tuần sau"`, khối `role="button"` + `aria-label`) và `data-autoid`/`data-*` của §17. |
| N6 | Nên sửa | TESTING §2 (component ≥ 85% nhánh); `calendar.md` §6, §7, §8.2, §10 | `calendar.component.ts:343-344`, `:724` (định dạng tiếng Anh), `:348-384` (tiêu đề), `:612-616` (`openDay`, chưa chạy), `:619-623` (Enter trên ô Tháng), `:775` (nhãn “lặp lại”), `:797` (cỡ khối), `:859-862` (giới hạn dòng Tháng) | Nhánh component đang **84.5% (196/232)**. Chưa có test cho phần hiển thị đã làm ở checkpoint 2: tiêu đề (chỉ thử “19 – 25 tháng 10, 2026”; chưa thử tuần khác tháng, khác năm, Ngày, Tháng, Danh sách, giao diện hẹp, `en`), giới hạn dòng Tháng (3, hoặc 2 + “+N khác”; ngày lễ 1 + “+N”), thanh cả ngày nối liền, bấm số ngày, “+N” hay ô Tháng → `view='day'`, cỡ khối lg/md/sm/xs, màu tuỳ ý (`data-color="custom"` + biến inline), nhãn “22:00 Trực đêm”. Đọc code thì định dạng tiêu đề vi/en khớp các chuỗi mẫu §6, nhưng chưa có test giữ. | Coverage ở lệnh 5. | Thêm test trước checkpoint 3, hoặc gộp vào commit RED của checkpoint 3 với mã CAL-C-01/14/15/19. |
| N7 | Nên sửa | `calendar.md` §3 (`SdCalendarLoadArgs.signal`: huỷ khi `option` đổi, khi component bị huỷ); REVIEW 3.4 (test destroy) | `calendar.component.ts:522-534`, `:583-588`; spec `:167-178` | Code abort lần tải khi `option` đổi và khi destroy, nhưng chưa có test: CAL-C-05 chỉ đếm số lần `onLoad`, không kiểm `signal.aborted` của lần trước; chưa có test destroy (abort, `ResizeObserver.disconnect`, dừng timer). | — | Thêm vào CAL-SC-22: `option` mới thì `calls[0].signal.aborted`; `fixture.destroy()` thì signal bị abort, kết quả muộn không ghi, `FakeResizeObserver.instances[0].disconnected`, timer bị dọn (không cần `discardPeriodicTasks`). |
| N8 | Nên sửa (ngoài phạm vi R1; Chặn ở R2 nếu còn) | SC-43, `calendar.md` §14 (“`check:scss-hex` phải xanh”) | `calendar.component.scss:4-33` | Map `$fallbacks` chứa 28 literal hex, nên `npm run check:scss-hex` đỏ. | Lệnh 6. | Viết fallback ngay trong `var(--sd-x, #hex)`, đúng dạng script chấp nhận, rồi bỏ map. |
| G1 | Ghi chú: cần PD chốt | SC-23 và `calendar.md` §13 | `calendar.component.ts:648-664` | `reload()` (hoặc `option` mới cùng khoảng) mà lỗi thì sự kiện cũ **vẫn hiện** cạnh dải lỗi, vì nhánh `catch` không xoá `#loaded`. §13 ghi: lỗi tải thì “lưới vẫn hiện, không có sự kiện”. SC-23 ghi: giữ dữ liệu cũ “tới khi có kết quả”, mà lỗi có thể hiểu là không có kết quả. Chưa có test cho trường hợp này. | Tải xong, `reload()`, reject: khối cũ còn. | PD chốt giữ hay xoá. Sau đó thêm test CAL-SC-24 cho nhánh lỗi sau `reload()`. |
| G2 | Ghi chú: cần PD chốt | SC-41 (“Ngày giờ chỉ qua `SdDateTimeService`”), Bước 0 §B.3 | `calendar.utils.ts:375-388` (`wallClock`), `:455-464` (`instantOf`) | Đọc và ghi wall clock gọi thẳng `DateUtilities.toZonedParts`/`fromZonedParts`, không qua `toWallClock`/`fromWallClock` như bảng Bước 0 đã duyệt. Lý do trong comment `why:` đúng về kỹ thuật: carrier là `Date` local, nên giờ rơi vào khoảng DST bị nhảy của zone trình duyệt sẽ lệch 1 giờ. Ý của SC-41 vẫn giữ (không `new Date(string)`, không cộng 24 giờ), nhưng câu chữ thì không. Chưa có test chạy với zone trình duyệt có DST. | — | PD chốt chấp nhận lệch. Nếu chấp nhận: cập nhật bảng Bước 0 §B.3, ghi vào mục “Lệch” của PR, và ở R2 chạy `TZ=America/New_York` (REVIEW 3.3) với một sự kiện 02:30 ngày 08/03/2026 theo zone `Asia/Ho_Chi_Minh`. |
| G3 | Ghi chú: cần PD chốt | `calendar.md` §15 (bảng key), REVIEW 3.1 (không key ngoài spec), Bước 0 §B.11 | `i18n/src/vi.ts:1694`; `calendar.component.ts:864-870` | Key `day-label-holiday` không có trong bảng §15 và không thuộc 3 key Bước 0 đề xuất (`title-day`, `more-short` đã duyệt; `retry`, `dismiss` đã duyệt). §15 có câu “Ô Tháng: “{weekday} {date}[, {holiday}], {count} sự kiện””, nên key này hợp lý. | — | PD duyệt thêm key, hoặc gộp vào `day-label` bằng tham số. |
| G4 | Ghi chú: cần PD chốt | `calendar.md` §6 (giao diện hẹp phát `view: 'day'`), phụ lục §3.3 (đồng bộ URL bằng `sdRangeChange`), CAL-E-12 | `calendar.component.ts:319-330` | Ở giao diện hẹp `view` vẫn là `'week'` nhưng `sdRangeChange.view` là `'day'`. Consumer đồng bộ `?view=` theo `sdRangeChange` sẽ ghi `day`; mở lại trang thì `view` thành `'day'`, và khi host rộng lại vẫn ở Ngày. | — | PD chốt: URL lấy `view` từ `viewChange` (model) và ngày từ `sdRangeChange`, rồi ghi vào `sd-calendar.md` và ví dụ showcase; hoặc đổi spec. |
| G5 | Ghi chú: cần PD chốt | SC-38, `calendar.md` §17 | `calendar.component.html:292`, `:341` | Sự kiện nhiều ngày có nhiều dòng ở Tháng (mỗi ô một dòng) và ở Danh sách (mỗi ngày một dòng), nên cùng một `data-autoid` `…-event-{id}` xuất hiện nhiều lần. Spec không nói `data-autoid` phải duy nhất. | — | PD chốt: chấp nhận trùng (E2E dùng `.first()`/`data-date` cha), hoặc chỉ gắn ở đoạn đầu. |
| G6 | Ghi chú | Hiệu năng (TESTING §10) cho checkpoint 3 | `calendar.component.ts:752-791` (`#itemView` đọc `selectedId()`, `#nowInstant()`, `dimPast()`, `transform()`) | `blocksByDay`, `allDay`, `monthWeeks`, `agenda` dựng lại toàn bộ view model (nhãn, `Intl`) khi chọn một sự kiện hay khi phút đổi. Với 500 sự kiện vẫn chấp nhận được, nhưng nếu state kéo, quét hay vị trí đề xuất của checkpoint 3 lọt vào các `computed` này thì mỗi `pointermove` sẽ dựng lại hết. | — | Ở checkpoint 3: giữ state kéo, quét, chờ ngoài `#itemView`; vẽ khối đề xuất bằng phần tử riêng như Bước 0 §B.4; tách `selected`/`past` khỏi phần nhãn nếu đo thấy chậm. |
| G7 | Ghi chú | TESTING §0.1 | `calendar.component.spec.ts:145` | Commit xanh đổi `setInput('date', '2026/10/22')` thành `'2026/10/21'` trong test RED CAL-C-03. Lý do hợp lệ: sau khi bấm “Hôm nay”, model `date` đổi bên trong, và `ComponentRef.setInput` bỏ qua giá trị trùng lần `setInput` trước (`@angular/core` 19.2.21, `fesm2022/core.mjs:18182`). Đây là lỗi của harness, không phải nới assert. | — | Ghi lý do vào báo cáo test. |
| G8 | Ghi chú | `calendar.md` §6 (“Hôm nay”: `today()` của zone), §8.3 (`dimPast`), `minDate: 'TODAY'` | `calendar.component.ts:253`, `:299`, `:549-560`, `:607-609`, `:700`, `:787` | `#now` chỉ cập nhật bằng timer, mà timer chỉ chạy khi hôm nay đang hiện trên lưới giờ. Mở Tháng hay Danh sách qua nửa đêm thì “Hôm nay”, `'TODAY'` và `dimPast` dùng ngày cũ. | — | Đọc `#clock.now()`/`today()` lúc bấm “Hôm nay”, hoặc làm mới `#now` khi điều hướng. |
| G9 | Ghi chú | `calendar.md` §15 (live region), SC-33 | `calendar.component.ts:258`, `:694-696` | `#announce` đặt `signal` bằng cùng chuỗi thì không đổi DOM, nên trình đọc màn hình không đọc lại. Ví dụ: Thử lại và lỗi tiếp, chỉ nghe “Không tải được lịch.” lần đầu. Ở checkpoint 3 sẽ gặp lại với từ chối hai lần liên tiếp hoặc `cancelled`. | — | Xoá rồi đặt lại (hoặc thêm bộ đếm vô hình) khi chuỗi trùng; thêm test ở checkpoint 3. |
| G10 | Ghi chú | TESTING §0.2, §3.7 | `calendar.types.spec.ts:15`, `:27` | Hai type test mang mã CAL-C-23, nhưng CAL-C-23 là “Export từ `index.ts` đủ type và token cho scheduler”. Nội dung thật là hợp đồng kiểu `onMove` và `onLoad` (§3.7 không có mã riêng). | — | Đổi nhãn (vd mô tả “type contract (§3.7)” kèm mã SC liên quan như CAL-SC-09…13 hoặc CAL-C-22), hoặc giữ và ghi trong báo cáo test. |
| G11 | Ghi chú | Bước 0 §B.2 (`workingHours`: khoảng thiếu đầu hoặc `from >= to` “bị bỏ (dev warn một lần)”) | `calendar.utils.ts:340-349` | Code bỏ khoảng sai mà không cảnh báo. | — | Thêm `#report` ở component cho khoảng bị bỏ, hoặc sửa lại Bước 0. |
| G12 | Ghi chú | Phụ lục §5.15, `scheduler.md` dòng 45 và §19 câu 1, REVIEW 3.1 | `index.ts:16-60`, `calendar.configuration.ts:25-32` | Entry point export 31 hàm, 1 hằng và 9 kiểu thuần với tiền tố `ɵ` (cộng `ɵSD_CALENDAR_DEFAULTS` qua `export *`), và barrel `components/index.ts` cũng re-export chúng. Cách này hợp quy ước `ɵ` của repo (`ɵsdNormalizeCalendarDay`) và đủ cho scheduler. | — | Ở R2, liệt kê các `ɵ` export trong bảng API của PR như “internal, không thuộc SemVer”. |
| G13 | Ghi chú | `scheduler.md` dòng 45, REVIEW 3.1 (“scheduler không có bản sao … pipeline”) | `calendar.component.ts:646-672` | Vòng đời `onLoad` (`#load`, `#controller`, `#phase`) là private trong component, đúng Bước 0 §B.6. `scheduler.md` chỉ bắt dùng lại hàm thuần và pipeline dời, nhưng scheduler cần đúng hành vi SC-22…24. Nếu chép `#load`, R2 của scheduler dễ bị coi là “hàm cùng thân”. | — | Cân nhắc tách `#load` cùng lúc với `calendar-move.ts` ở checkpoint 3, hoặc để Bước 0 của scheduler chốt. |

## Checklist (phần thuộc R1)

### 3.1 Theo spec
- ✓ Public API so với `calendar.md` §2, §4: `option` (`input.required`), `view`/`date`/`selectedId` (`model`), `views`, `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`/`maxDate` (không alias), `scrollTime`, `agendaDays`, `dimPast`, `transform`, `disabled`/`readonly` (`booleanAttribute`), `ariaLabel`/`autoId` (`string | null | undefined`); output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, `sdLoadError` (phụ lục §6); `reload()`. `move()` thuộc checkpoint 3. Lệch kiểu nhỏ, có lý do: `step`/`firstDayOfWeek`/`holidays` nhận `undefined` để rơi về cấu hình; `minDate`/`maxDate` nhận thêm `number | null` (= `SdCalendarDateInput`, như Bước 0 §B.2).
- ✓ Model `calendar.model.ts` khớp §3 từng trường; `onMove` có `'cancel'`; `SdCalendarMoveError.reason` giữ `'rejected' | 'error'` (phụ lục §6.1).
- ✓ `SD_CALENDAR_CONFIGURATION`/`ISdCalendarConfiguration`; thứ tự input → cấu hình → mặc định (`calendar.component.ts:277-297`).
- ✓ 4 directive template, selector và context đúng §8.5, có `ngTemplateContextGuard`.
- ✓ Export cho scheduler (phụ lục §5.15, CAL-C-23).
- ✗ Key i18n ngoài spec: `day-label-holiday` (G3). `title-day`, `more-short`, `retry`, `dismiss` đã duyệt ở Bước 0.
- ✓ Phạm vi “không làm” (§0) không bị làm.
- N/A Kanban, scheduler.

### 3.2 Hợp đồng chung (các SC đã có code ở checkpoint 1–2)
- ✓ SC-01 (id trùng/rỗng, title rỗng → `sd-data-state`), SC-04, SC-05, SC-07 (kiểu nhóm), SC-16 (phần tải), SC-22, SC-24, SC-33, SC-37, SC-38 (G5), SC-39, SC-40, SC-42, SC-44, SC-45.
- ? SC-23 (G1), SC-41 (G2).
- ✗ SC-43 (N8).
- SC-27: có code (`calendar.component.ts:568-572`), test thuộc checkpoint 3 theo Bước 0.
- N/A ở R1: SC-02/03, 06, 08 (N/A theo Q3), 09–15, 17–21, 25, 26, 28–32, 34–36.

### 3.3 Test
- ✓ Lệnh nhanh: 67/67 xanh, eslint sạch (Node 26, ghi ở trên).
- ✓ Mọi test có mã. Đủ mã checkpoint 1–2 theo Bước 0 §C: CAL-U-01…21, CAL-C-01…07, 15, 16, 17, 19, 20, 21, 22, 23, CAL-SC-01, 16, 22, 23, 24, 33, 37, 38.
- ✓ Không có `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()`.
- ✓ / ✗ Coverage: utils 100%/100% ✓; component nhánh 84.5% < 85% (N6).
- ✓ / ✗ RED: checkpoint 1 đúng lý do; checkpoint 2 có 11 test đỏ do `TypeError` (N2) và 2 test chưa qua RED (N3).
- N/A ở R1: thử phá, chạy lại với `TZ=…`, test `-B-xx`.

### 3.4 Mã nguồn
- ✓ Không có `any`, `as unknown as` trong code calendar và helper test.
- ✓ Không `setTimeout`; cuộn ban đầu dùng `afterNextRender`; timer `setInterval` ngoài zone và được dọn.
- ✓ / ✗ Dọn khi destroy (abort, `disconnect`, `clearInterval`) đúng khi đọc code; chưa có test destroy (N7).
- ✓ Effect không ghi signal mà nó đọc theo cách gây vòng lặp; không gọi API trong `computed` (`onLoad` gọi trong effect qua `untracked`).
- N/A SCSS ở R1 (trừ N8).

### 3.5, 3.6
N/A ở R1.

## Thử phá
N/A ở R1 (REVIEW 3.3, thuộc R2). Pipeline dời chưa có.
