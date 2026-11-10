# scheduler · R2 (phần spec và code)
Nhánh: feat/scheduler · Commit: eb32766d2 (base `origin/main` 22ef521fe; `main` local trong bản sao đã cũ, nên phạm vi diff là `22ef521fe..eb32766d2`) · Ngày: 2026-11-11
Reviewer: phiên mới, không có lịch sử của phiên tác giả. Phạm vi: REVIEW §3.1, §3.2, §3.4, §3.5, §3.6. §3.3 (test, coverage, "Thử phá") thuộc reviewer khác, không làm ở đây.

Đã đọc: `AGENTS.md`; `schedule-kanban/{REVIEW,SHARED-CONTRACT,TESTING}.md`; `design-scheduler/{scheduler,PROMPT,README}.md`, `SD Scheduler Design.dc.html` (mở qua server tĩnh local, đủ 9 mục); `design-calendar/calendar.md` (§4–§15); Bước 0 `reports/scheduler-step0.md` (H1–H11 duyệt nguyên đề xuất); `reviews/scheduler-R1.md`, `scheduler-R1-author.md`. Không đọc báo cáo test của tác giả (không có trong bản sao) và không đọc `reports/scheduler-a11y.md`.

## Kết luận
Chặn: 2 · Nên sửa: 7 · Ghi chú: 15

**Chưa được mở PR.** Hai mục Chặn là sai spec có tái hiện (thứ tự lane ở Tuần/Tháng; cuộn ban đầu ở giao diện hẹp). Phần còn lại tốt: public API khớp §2–§4 từng tên, pipeline dời dùng chung `ɵSdCalendarMoveRunner` thật sự, 5 kết quả `onMove` đúng hợp đồng qua cả kéo, phím và `move()`, dọn dẹp khi huỷ đủ, `check:sync` và `check:scss-hex` xanh.

## Lệnh đã chạy
Node local `v26.12.0` (CI dùng 24.22.1, gói ghi 22.22.3). Mọi lệnh chạy trong `C:\tmp\r2-spec-scheduler` (detached ở eb32766d2).

| Lệnh | Kết quả |
| --- | --- |
| `npm run check:sync` | Xanh: "v20, v21, v22 match v19" (8.4 s). |
| `npm run check:scss-hex` | 0 finding. |
| `npx eslint projects/sdcorejs-angular/components/scheduler projects/sdcorejs-angular/components/calendar projects/sdcorejs-angular/testing/schedule-testing.ts` (versions/v19) | Không lỗi, không cảnh báo (9.4 s). |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI "--include=projects/sdcorejs-angular/components/scheduler/**/*.spec.ts"` | **138 SUCCESS**, 0 FAILED, 1.74 s, seed 486538. Log có 12 dòng `WARN` thật của component (Ghi chú 12). |
| Như trên với `components/calendar/**` (refactor dùng chung) | **186 SUCCESS**, 0 FAILED, 1.84 s, seed 294570. |
| `npm run test:showcase-generators` | 10 + 17 + 11 pass (changelog, example sources, route shells 115 trang). |
| `npm run test:theme`, `npm run test:check-i18n` | 65 pass, 9 pass. |
| Harness tạm 1 (spec Karma `zz-r2-temp.spec.ts`, đã xoá): 5 kết quả `onMove` × đồng bộ/Promise qua **kéo** và qua **`Alt` + `↓`**, cộng trạng thái chờ | **21 SUCCESS.** Xem §3.2. |
| Harness tạm 2 (đã xoá): cuộn ban đầu ở host 390px; thứ tự lane ở Tuần | **2 FAILED**: `scrollLeft` 640 thay vì 512; lane `late,early,mid` thay vì `early,mid,late`. Mục 1, 2. |
| Harness tạm 3 (đã xoá): `elementFromPoint` trên khối bị cuộn vào dưới cột tài nguyên | Không chọn: cột tài nguyên ở trên (✓). Đang chọn: **chấm của khối ở trên** (✗). Mục 3. |
| `python -m http.server` trên thư mục `design-scheduler` (127.0.0.1, đã dừng) để mở HTML thiết kế | So ảnh §3.5. |

`git status` sạch sau mỗi harness. Không chạy: full suite có coverage, `ng build`, `npm run sync`, E2E, spec Karma của showcase (`documentation.registry.spec.ts`: bản sao không có `showcase/node_modules`). Không làm "Thử phá".

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chặn | scheduler.md §8.4 bước 2 và 6; HTML mục 02 ("Nhiều khối cùng ngày xếp lane theo giờ bắt đầu"); `sd-scheduler.md` ("sorted by start") | scheduler.component.ts:1814–1829; scheduler.utils.ts:95–98 | Ở Tuần và Tháng, mục xếp lane của khối có giờ là chỉ số cột `[from, to + 1)`. Mọi khối có giờ cùng ngày có cùng `start`, `end`, `allDay`, nên phép sắp trả 0 và giữ thứ tự mảng `onLoad`. Lane và thứ tự DOM (thứ tự Tab) theo thứ tự dữ liệu, không theo giờ bắt đầu. SCH-U-05 không bắt được vì đầu vào đã theo giờ. | Ảnh của tác giả `week-1200.png`, hàng Phòng Sa Pa: 09:00, **13:30**, **11:00**. Harness 2: ba khối 13:30, 09:00, 11:00 trên một hàng ở Tuần → top và DOM `late,early,mid`. | Thêm khoá sắp phụ theo giờ thật (`placement.startInstant` hoặc `startDay`+`startMinutes`, rồi `endInstant` giảm) cho mục lane ở Tuần/Tháng. Test hồi quy `SCH-B-xx` với đầu vào không theo giờ. |
| 2 | Chặn | §6 ("Ngày: `scrollLeft = phút(scrollTime) / 60 × hourWidth`. Chạy khi khởi tạo"); §11 (`hourWidth` 64px khi hẹp) | scheduler.component.ts:396, 691–718, 2018–2024, 2027–2041 | Effect cuộn được tạo trước effect đo kích thước, nên `afterNextRender` của nó chạy trước `#measureSizes()`. Lúc đó `#sizes` vẫn là `SIZES` (giờ 80px, cột 240px). Host hẹp ngay từ đầu thì Ngày mở ở 10:00 thay vì 08:00 (640 px thay vì 512). `#revealToday()` cũng dùng 240px cho phần dính, nên ở Tuần/Tháng hẹp cột hôm nay dừng cách cột tài nguyên 120px và điều kiện "bị khuất" sai. | Ảnh `compact-390.png`: nhãn giờ đầu tiên là 10:00. Harness 2: host 390px, `scrollTime: '08:00'` → `scrollLeft` 640, ô giờ đo được 64px. | Đo kích thước trước khi cuộn (gọi `#measureSizes()` đầu callback cuộn, hoặc đổi thứ tự effect, hoặc đo `offsetWidth` ô giờ và cột như Bước 0 D.2). Test hồi quy `SCH-B-xx` ở host < 600px cho Ngày và cho Tuần có hôm nay bị khuất. |
| 3 | Nên sửa | §7 (cột tài nguyên `sticky`, z-index 2; trục z-index 3; giờ hiện tại "trên khối và dưới phần dính") | scheduler.component.scss:480, 326, 744, 755, 826, 898, 935, 976, 669 | Khối, rãnh và phần dính cùng một ngữ cảnh xếp lớp. Khối đang chọn (z 2, sau trong DOM) vẽ đè lên cột tài nguyên dính (z 2) khi cuộn ngang. Khối đang chờ (z 3), khối nét đứt và khối đề xuất (z 4), con trỏ lưới (z 5), nhãn kéo mép (z 6) đè lên cả cột tài nguyên và trục thời gian khi cuộn. Vạch giờ hiện tại (z 1) nằm dưới khối đang chọn, đang chờ. | Harness 3: chọn "client", cuộn để khối nằm dưới cột tài nguyên → `elementFromPoint` trả `.sd-scheduler__dot`. Không chọn thì trả ô tài nguyên. | `isolation: isolate` (hoặc `z-index: 0`) trên `.sd-scheduler__track`: z-index của khối chỉ còn trong rãnh, vạch giờ (z 1, ngoài rãnh) nằm trên mọi khối và dưới phần dính, đúng §7. Chụp lại ảnh đang kéo, đang chọn khi đã cuộn. |
| 4 | Nên sửa | §8.3 "Như calendar 8.3" (Đang kéo: "viền event-color, bóng lớn"); HTML mục 03 "Đang kéo" và 4b | scheduler.component.scss:933–950; scheduler.component.html:381–393 | Khối đề xuất khi kéo là hộp rỗng viền `--sd-primary`, nền `--sd-primary-light`: không có màu sự kiện, chấm, tên. HTML vẽ chính khối (màu, chấm, tên, bóng lớn) ở vị trí đề xuất. Lệch không có lý do trong spec hay Bước 0. | Ảnh `drag-across-rows.png` so với HTML 4b. | Vẽ khối đề xuất bằng cùng lớp và nội dung của khối (event-color, chấm, tên theo bậc bề rộng), giữ `aria-hidden`; hoặc ghi lệch có chủ đích vào bảng của PR. |
| 5 | Nên sửa | HTML mục 07 và 06 (tiêu đề hẹp "09/11/2026"); calendar.md §6 (hẹp: Ngày "Tháng 10, 2026"); scheduler.md không nói | scheduler.component.ts:508–512; scheduler.component.scss:163–171, 1124–1127 | Ở giao diện hẹp, tiêu đề Ngày vẫn là dạng dài và bị cắt còn "Thứ Hai, 9…" (390px) hoặc "Thứ Hai, 9 tháng 11, …" (400px): không đọc được ngày. Lệch HTML chưa có lý do. | Ảnh `compact-390.png`, `day-400-compact.png`. | **Ghi chú: cần PD chốt** dạng tiêu đề hẹp (HTML "09/11/2026" hay calendar "Tháng 11, 2026"), rồi làm theo; trong lúc chờ, không để tiêu đề bị cắt mất ngày. |
| 6 | Nên sửa | REVIEW §3.1 ý cuối (không bản sao pipeline); R1 mục 5 (mở rộng) | scheduler.component.ts:1245–1278 = calendar.component.ts:1203–1234; scheduler 770–795 = calendar 745–772; 820–829 = 776–785; 1623–1635 = 1189–1201; 1750–1756 = 1265–1271; 1280–1284 = 1398–1402 | Pipeline dời đã dùng chung (đúng H1). Pipeline tạo thì chép gần nguyên thân: `begin('create')` → khối nét đứt chờ → `await onCreate` → nhánh lỗi (`create-error`, dải, live region) → kiểm `signal.aborted` → chèn và chọn (SC-14, SC-19…21). Các thân nhỏ cũng trùng nguyên: `setView`/`shift`/`goToday`/`openDay`/`dismissFailure`, `selectItem`, `answerScope`/`onScopeKeydown`, `#abortMove`, `#outOfRange`. Sửa calendar phải nhớ sửa hai nơi. | Đặt hai file cạnh nhau. | Tách `ɵSdCalendarCreateRunner` (như runner dời: host cấp ghost, loader, failure, announcer) và các handler trùng vào phần `ɵ` của calendar; phần nào giữ riêng thì ghi lý do. |
| 7 | Nên sửa | SC-36; §11 ("Vùng chạm tối thiểu 44×44px cho nút") | scheduler.component.scss:260–269, 1084–1097, 423–435, 452–456 | Ở giao diện hẹp, nút Thử lại / Bỏ qua của dải cao 28px, nút thanh hỏi phạm vi 36px, số ngày trên trục 28px (Tuần) và 22px (Tháng). Chỉ nút thanh công cụ và hàng nhóm được nâng lên 44px. Calendar cũng vậy (đưa vào RX). | Đọc rule `.sd-scheduler--compact`. | Nâng các nút này lên `--sd-control-height-coarse` khi hẹp. Số ngày ở Tháng: cột 28px không chứa được 44px → **Ghi chú: cần PD chốt** (§11 "Tháng giữ 28px" và vùng chạm 44px mâu thuẫn). |
| 8 | Nên sửa | TESTING §9; scheduler.md §17 ("dữ liệu như HTML, hôm nay Thứ Hai 09/11/2026") | showcase/e2e/components/scheduler.e2e.ts:108–113, 327–366; showcase/src/app/pages/components/scheduler/examples/scheduler-demo.data.ts:20–60, 87–108, 120–137 | Bộ ảnh không so 1:1 được với HTML: dữ liệu showcase khác HTML (phòng, xe, người, mã công, nhãn ô góc "Phòng"/"Xe"); khung 1200px thay vì 1122px; đồng hồ không ghim nên "hôm nay" là 11/11, Ngày 09/11 không có vạch giờ hiện tại; RTL được bật sau khi render nên ảnh RTL mở ở 00:00, không phải `scrollTime`. Thiếu ảnh: mục 03 (bậc bề rộng, 8 trạng thái khối), 4a quét, 4c kéo mép, 4d con trỏ lưới, đang tải lần đầu, bị từ chối khi dời, hẹp 360px. | So `reports/scheduler-screens/` với 9 mục HTML. | Dùng dữ liệu của HTML cho ví dụ (hoặc ghi lý do), ghim giờ 09/11/2026 10:40 trong E2E chụp ảnh (`page.clock`), khung 1122px, RTL đặt trước khi render, chụp đủ các mục còn thiếu. |
| 9 | Nên sửa | HTML mục 02 (số ngày trên trục Tuần "09", "10"); Bước 0 L5 chỉ nói tiêu đề Ngày | scheduler.component.ts:1780; scheduler.component.html:166–168 | Trục Tuần ghi "9" thay vì "09". Lệch nhỏ nhưng chưa có trong bảng lệch. | Ảnh `week-1200.png` so với HTML 02. | Ghi cùng lý do L5 (dùng định dạng của calendar) vào bảng lệch của PR, hoặc đệm số 0 ở Tuần. |
| 10 | Ghi chú: cần PD chốt | §8.4 bước 5 ("Hàng gốc giữ khung nét đứt ở lane cũ") và calendar.md §8.3 (đang chờ, đang lưu: "vị trí cũ không hiện") | scheduler.component.ts:547–566, 1831 | Spec mâu thuẫn cho trạng thái đang chờ phạm vi / đang lưu: §8.4 bước 5 nêu cả ba trạng thái rồi nói hàng gốc giữ khung nét đứt; scheduler §8.3 lại theo calendar 8.3 cho hai trạng thái này. Code: khi kéo có khung nét đứt ở lane cũ; khi chờ thì không còn vị trí cũ. | Kéo sang hàng khác với `onMove` chậm 2 giây. | PD chốt có hiện khung nét đứt ở hàng gốc trong lúc chờ hay không. |
| 11 | Ghi chú: cần PD chốt | §15 ("Ô (Tuần, Tháng): `data-date`, `data-resource-id`") và SC-44 (không phần tử theo slot) | scheduler.component.html:265–283 | Không có template ô thì Tuần/Tháng không có phần tử ô (lưới là gradient), nên không có hook `data-date` cho ô. Chỉ ô của template mới có. `sd-scheduler.md` mô tả đúng hành vi này. | | PD chốt §15 có đòi ô ở Tuần/Tháng không có template hay không. |
| 12 | Ghi chú: cần PD chốt | §6 ("Tuần: tiêu đề như Tuần của calendar"); calendar.md §6 (`hideWeekends`: `from`/`to` là ngày hiển thị) | scheduler.component.ts:508–512 | Với `hideWeekends`, tiêu đề Tuần dựng từ `from`/`to` của cả tuần ("9 – 15 tháng 11") trong khi cột chỉ đến T6. Calendar sẽ ghi "9 – 13". | `hideWeekends` ở ví dụ Đặt phòng, Tuần. | PD chốt tiêu đề theo khoảng tải hay theo cột hiển thị. |
| 13 | Ghi chú | R1 mục 7, 8, 9, 10, 13, 15 (cần PD chốt) | | Vẫn mở, không quyết lại. Sự kiện mới cho R1 mục 8: ngoài chuyện `rem`, kích thước còn được đọc **trước** lần đo đầu tiên (mục 2). R1 mục 13: E2E SCH-E-12 có in số đo, chưa được reviewer này kiểm. | | |
| 14 | Ghi chú | REVIEW §3.1 ý cuối; R1 mục 6 (đã giữ theo Bước 0) | scheduler.utils.ts:68–78, 95–107, 147–158 | Còn trùng nhỏ đã biết: nhánh Tuần/Tháng của `sdSchedulerVisibleDays` (calendar.utils.ts:204–224), vòng from/to/clipped của `sdSchedulerColumnSpan` (= `sdCalendarAllDayLayout`, calendar.utils.ts:298–316), vòng gán lane của `sdSchedulerLanes` (= vòng trong `sdCalendarStack`, :268–274). Không phải pipeline. | | Có thể gom khi sửa mục 1. |
| 15 | Ghi chú | Mã chết, comment | scheduler.utils.ts:221–227; scheduler.component.ts:2050, 2013 | `sdSchedulerColumnAt` không được component dùng. JSDoc mồ côi "Width of the host before the first ResizeObserver callback…" trước `#measureSizes`. `#trackWidth` trừ hằng `2` không có `why:`. | | Xoá hoặc dùng; thêm `why:`. |
| 16 | Ghi chú | §9.7 `Alt` + `↑` `↓` | scheduler.component.ts:880–883 | Ở tài nguyên cuối, `Alt` + `↓` đọc "Không chuyển sang {chính tài nguyên đó} được". | Đứng ở Phòng Đà Lạt, `Alt` + `↓`. | Đọc tên hàng kế nếu có, không thì một câu khác (hoặc im lặng). |
| 17 | Ghi chú | §7 (biến kích thước) | scheduler.component.scss:90, 1115 | Thêm biến `--sd-scheduler-group-height` ngoài danh sách §7. Có trong `sd-scheduler.md` và `THEME.md`. | | Ghi vào bảng API của PR. |
| 18 | Ghi chú | HTML 4b và scheduler.md §8.3, §9.3 | | HTML vẽ sọc mọi hàng `droppable` từ chối; spec chỉ vẽ hàng đích. Code theo spec (spec ưu tiên HTML). Không cần làm gì. | | |
| 19 | Ghi chú | SC-43 | scheduler.component.scss:746, 767, 941, 1069 | `var(--sd-shadow-*)` không có fallback (token thang, giống calendar và kanban). | | Để RX quyết chung. |
| 20 | Ghi chú | Bước 0 H9 | showcase/e2e/components/scheduler.e2e.ts:108–113, 315–325 | H9 duyệt tạo `showcase/e2e/components/schedule.support.ts` (axe, frame, shot, rtl); file không có, E2E scheduler tự khai `shot`, `frame`. | | Cho RX (REVIEW §4 ý cuối). |
| 21 | Ghi chú | R1 mục 11d | scheduler.component.spec.ts (các test đổi `resources`) | Log Karma còn 12 dòng `WARN` (`client`, `training`, `tuesday`). Thuộc reviewer test. | | `spyOn(console, 'warn')`. |
| 22 | Ghi chú | §14 (a11y) | scheduler.component.html:150–154, 244–264 | `role="grid"` có 24 `columnheader` giờ (hoặc 7/28–31 ngày) nhưng mỗi hàng chỉ có 2 ô (`rowheader`, rãnh `gridcell`): trình đọc màn hình có thể đọc sai tiêu đề cột. Không chặn thao tác (con trỏ có nhãn đầy đủ). | | Kiểm bằng NVDA/VoiceOver ở bước tay; cân nhắc `aria-hidden` hoặc bỏ role ở ô giờ. |
| 23 | Ghi chú | SC-35 (ngoài yêu cầu) | scheduler.component.scss:1188–1206 | Ở `forced-colors`, chấm màu sự kiện và vòng hôm nay trên trục mất (chỉ là nền). | Ảnh `vehicles-forced-colors.png`. | Tuỳ chọn: viền `CanvasText` cho chấm, `Highlight` cho vòng hôm nay. |
| 24 | Ghi chú | §7 ("viền phải `--sd-calendar-line` (trừ cột cuối)"); calendar.md §6 (ngày ngoài giới hạn: con trỏ `not-allowed`) | scheduler.component.scss:571–575, 886–893 | Gradient của rãnh Tuần/Tháng vẽ cả vạch cuối cột cuối. Ngày ngoài `minDate`/`maxDate` chỉ có con trỏ `not-allowed` khi đang quét, không phải khi rê. | | Nhỏ; sửa cùng mục 3 nếu tiện. |

Mức: 2 Chặn (1, 2) · 7 Nên sửa (3–9) · 15 Ghi chú (10–24, trong đó 10, 11, 12 là "cần PD chốt"; mục 5 và 7 cũng có một phần cần PD chốt).

## Checklist

### 3.1 Theo spec
- [x] Đọc `scheduler.md` §0–§19 từng mục (bảng dưới).
- [x] Public API thực tế so với §2–§4, §14–§15 (bảng dưới). Không có input, output, method, key i18n ngoài spec (trừ `open-day` đã duyệt H8). Type ngoài spec: `SdSchedulerCellView`, bốn `SdScheduler*TemplateContext` (R1 mục 9, vẫn chờ PD). CSS var ngoài §7: mục 17.
- [x] Phạm vi "không làm" không bị làm (không virtual scroll, không Tuần theo giờ, không Danh sách, không nhiều tài nguyên, không kéo mép trái, không cột phụ, không in/xuất, không form).
- [x] Kanban: N/A (PR scheduler).
- [ ] Không bản sao hàm thuần hay pipeline của calendar: hàm thuần lấy từ `ɵ` (✓, trùng nhỏ ở mục 14); pipeline dời dùng chung (✓, `ɵSdCalendarMoveRunner`, calendar cũng dùng: calendar.component.ts:331); **pipeline tạo và vài handler còn chép** (mục 6).

| § | Kết quả | Ghi |
| --- | --- | --- |
| 0 Phạm vi | ✓ | Calendar đã ở `origin/main` (06b4ce97f), nhánh cắt từ 22ef521fe (H11). Mọi mục "Làm" có; "Không làm" không bị làm. |
| 1 Vị trí file | ✓ | Đủ file; spec tách theo checkpoint (Bước 0 C.1). `components/index.ts` có `export *` scheduler; registry có trang. |
| 2 Quy ước API | ✓ | Từng hàng của bảng khớp (bảng API dưới). |
| 3 Model | ✓ | 14 type khớp từng trường, `readonly`, optional, generic. Import type từ calendar, không re-export. |
| 4 Input, output, method | ✓ | 4.1: 21 input cùng tên, kiểu, mặc định, transform như calendar; `view` mặc định `'day'`; `views` rỗng → cả ba (thêm, có tài liệu). Khoá thêm "không có tài nguyên". 4.2: 6 output đúng payload; `sdRangeChange` không phát khi chỉ `resources` đổi. 4.3: `move()` chạy `droppable` (H3/L1 đã duyệt). |
| 5 Giá trị ngày giờ | ✓ | `{ ...event, start, end, allDay, resourceId }`, `data` giữ tham chiếu (harness 1, SCH-SC-02). |
| 6 Khoảng xem, điều hướng | ✗ | Khoảng, ‹ ›, tiêu đề (L5 đã duyệt) ✓. Cuộn ban đầu sai ở giao diện hẹp (mục 2). Tiêu đề Tuần với `hideWeekends` (mục 12). R1 mục 15 vẫn mở. |
| 7 Bố cục, kích thước | ✗ | Biến host, gốc, thanh công cụ, ô góc, trục (40/48px, 11/14, 15/500 trong 28px, 10/12, 12/500 trong 22px, chấm 4px chỉ ở Tháng), cột tài nguyên, hàng nhóm, chiều cao hàng, lưới gradient, giờ hiện tại, khoảng trống 1/2 và 2/3 px ✓. Lớp xếp chồng với phần dính sai (mục 3). Vạch cột cuối (mục 24). |
| 8 Khối sự kiện | ✗ | 8.1, 8.2 (bậc 120/48 px, mốc 96 px, icon `repeat` 13px, cạnh vuông khi bị cắt), 8.5 (4 directive, context, guard, `views` của template ô) ✓. 8.3: tay nắm 3×12, lớp phủ hàng đích, sọc, `opacity: .5`, nhãn nổi và đảo bên ✓; khối đề xuất khác calendar 8.3 (mục 4). 8.4: lane sai thứ tự ở Tuần/Tháng (mục 1); bước 5 mâu thuẫn spec (mục 10). |
| 9 Tương tác | ✓ | 9.1 chọn, `sdCellSelect` không đặt `selectedId`. 9.2 quét giữ hàng (pointer capture), Tuần/Tháng `allDay: true` `[min, max]`, `creatable` có `resource`, đánh giá lại khi khoảng đổi và trước `onCreate`, không tạo trên hàng nhóm, Esc. 9.3 hai trục, `moveStep`, kẹp, bỏ hàng nhóm, `axis` (L8), nhớ `droppable` theo `(resourceId, start)`, thả huỷ đúng 4 trường hợp, tự cuộn hai trục trừ phần dính. 9.4 mép phải 8px, Tuần/Tháng chỉ cả ngày, `axis: 'resource'` không tay nắm, cảm ứng 24px. 9.5 runner chung + `resourceId`/`axis`/`droppable` + mở nhóm + đổi `date`. 9.6 hỏi phạm vi cả khi đổi tài nguyên. 9.7 đủ bảng phím (S2/S3/H4); nhỏ: mục 16. |
| 10 Nhóm | ✓ | Không nhóm đứng đầu, thứ tự lần đầu, `Set` nội bộ giữ qua khoảng/chế độ, bỏ nhóm không còn, nhóm thu gọn vẫn tải và vẫn trong `resourceIds`, `group-count`. |
| 11 Giao diện hẹp | ✗ | 120/64/96/28 px, icon/avatar 24px, tên 2 dòng, ẩn mô tả, hàng nhóm 44px, giữ `views`, chạm giữ 400ms, không vuốt ✓. Cuộn ban đầu (mục 2), tiêu đề bị cắt (mục 5), vùng chạm < 44px (mục 7). |
| 12 Trạng thái | ✓ | Xương 3 hàng đầu (surface-muted, bo 6, cao 28), cột tài nguyên hiện ngay, trống (icon `event_busy` 28px, 14/500, min 144px, template thay toàn bộ, không `onLoad`), dữ liệu không hợp lệ gồm `resources`, `resourceId` lạ bỏ qua + cảnh báo. |
| 13 Token | ✓ | Không token màu mới; 5 token calendar có fallback hex; biến kích thước trên `:host`; `THEME.md` có câu dùng chung + bảng biến; `check:scss-hex` xanh. |
| 14 Trợ năng, i18n | ✓ | `<section role="region">`, một live region, reduced motion, forced colors; `rowheader` + `id` trong `aria-describedby` của khối; nhãn khối, nhãn con trỏ, hàng nhóm đúng chữ; 14 key + `open-day` (H8) đủ 5 locale, vi/en trùng từng chữ bảng §14. `aria-label` trên vùng cuộn: R1 mục 10 vẫn chờ PD. |
| 15 E2E | ✓ | Gốc `data-autoid`, `data-view`, `data-from`, `data-to`; hàng `…-resource-{token}` + `data-resource-id`; khối `…-event-{token}` + `data-resource-id`, `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-selected`; token `encodeURIComponent`; `data-autoid` chỉ khi có `autoId`. Ô Tuần/Tháng: mục 11. |
| 16 Spec RED | N/A | Thuộc reviewer test (§3.3). Các file spec có mặt theo Bước 0 G.1. |
| 17 Showcase | ✗ | Bốn ví dụ, mọi công tắc của §17 (cả `'cancel'`), ví dụ code cho cả bốn ✓. Dữ liệu không như HTML (mục 8). |
| 18 Checkpoint | ✓ | Mỗi checkpoint có commit RED và commit xanh (CP1 kèm `refactor(calendar)`), CP6 docs rồi `chore(sync)`. |
| 19 Câu hỏi Bước 0 | ✓ | Năm câu đã trả lời, PD duyệt H1–H11. Câu 3 (bundle) và câu 4 (số đo) không được reviewer này đo lại. |

Public API thực tế (`components/scheduler/index.ts`) so với spec:

| Nhóm | Tên thực tế | Spec | Kết quả |
| --- | --- | --- | --- |
| Component | `SdScheduler<T, R>` (standalone, OnPush; file component chỉ export class này) | §0, §2 | ✓ |
| Input | `option`, `resources` (required); `view`, `date`, `selectedId` (`model`); `views`, `resourceLabel`, `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`, `maxDate`, `scrollTime`, `dimPast`, `transform`, `disabled`, `readonly`, `ariaLabel`, `autoId` | §4.1 | ✓ 21/21 |
| Output | `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, `sdLoadError`, `sdCellSelect` (+ `viewChange`, `dateChange`, `selectedIdChange` của `model`) | §4.2 | ✓ |
| Method | `reload(): void`, `move(eventId, to: { start; end?; allDay?; resourceId? }, source = 'api'): Promise<boolean>` | §4.3 | ✓ |
| Type | `SdSchedulerView`, `SdSchedulerMoveAxis`, `SdSchedulerResource`, `SdSchedulerEvent`, `SdSchedulerRange`, `SdSchedulerVisibleRange`, `SdSchedulerLoadArgs`, `SdSchedulerCreateContext`, `SdSchedulerCreateArgs`, `SdSchedulerDropContext`, `SdSchedulerMoveRequest`, `SdSchedulerMoveError`, `SdSchedulerCellSelect`, `SdSchedulerOption` | §3 | ✓ 14/14 |
| Directive | `SdSchedulerEventTemplateDirective`, `SdSchedulerResourceTemplateDirective`, `SdSchedulerCellTemplateDirective` (input `views`, mặc định `['week','month']`), `SdSchedulerEmptyTemplateDirective` | §8.5 | ✓ |
| Type template | `SdSchedulerEventTemplateContext`, `SdSchedulerResourceTemplateContext`, `SdSchedulerCellTemplateContext`, `SdSchedulerEmptyTemplateContext`, `SdSchedulerCellView` | không nêu | R1 mục 9 (chờ PD) |
| Dùng chung | `SD_CALENDAR_CONFIGURATION`; type calendar import, không re-export | §2 | ✓ |
| i18n | `core.component.scheduler.{label,resources,group-count,group-expand,group-collapse,empty,drop-blocked,moved-resource,cursor-time,cursor-day,event-label,event-label-all-day,grid-help,event-help,open-day}`; dùng lại `core.component.calendar.*` (+ `all-day`, `retry`, `dismiss`, `recurring`, `title-*`) và `core.common.cancel` | §14, H8 | ✓ |
| `ɵ` của calendar | Chỉ thêm export `ɵ` dưới dòng `@internal` (`calendar/index.ts`); không đổi `calendar.component.html`, `.scss`, `calendar.model.ts`, input/output của `SdCalendar` | Bước 0 H1 | ✓ |

### 3.2 Hợp đồng chung
| SC | Kết quả | Ghi |
| --- | --- | --- |
| 01 | ✓ | Id trùng/rỗng, `title` rỗng ở `resources` và sự kiện → `sd-data-state`; `resourceId` lạ bỏ + cảnh báo một lần. |
| 02 | ✓ | Spread giữ `data` (harness 1; SCH-SC-02). |
| 03 | ✓ | Không sửa input: sắp trên bản sao, mảng mới khi chèn/thay. |
| 04 | ✓ | Không `get*`/`with*`. |
| 05 | ✓ | `SdCalendarState` cho `creatable`, `movable`, `droppable`. |
| 06 | ✓ | Đánh giá khi render (tay nắm, `cdkDragDisabled`, khối nét đứt xám, hàng sọc) và lại ngay trước callback (`allowed()` của runner; `creatable` trước `onCreate`). |
| 07 | ✓ | Không `move`: không kéo, không tay nắm, `Alt` không làm gì, `move()` false. Không `create`: không khối nét đứt. |
| 08 | ✓ | `droppable` đồng bộ; chạy ở đích đầu tiên và mỗi khi đích đổi, `Alt` + phím, `move()` (H3), trước `onMove`; throw = từ chối (L11). |
| 09 | ✓ | `true` và Promise `true`: dữ liệu đổi trước `sdMove` (đọc code `accept`), DOM ở hàng mới, live region "Đã chuyển sang …". Harness 1 (kéo, phím) + SCH-SC-09 (`move()`). |
| 10 | ✓ | `void` và Promise `void` như `true`. Cùng nguồn kiểm. |
| 11 | ✓ | `false`: về hàng và giờ cũ, `data-failed`, dải có nút Bỏ qua, `sdMoveError` `reason: 'rejected'` không có `error`, live region `rejected`. |
| 12 | ✓ | `'cancel'`: về chỗ cũ, không `data-failed`, không dải, không output, live region "Đã huỷ thay đổi". |
| 13 | ✓ | throw/reject: như `false`, `reason: 'error'`, `error` đúng object ném ra, không có "SECRET" trong DOM. |
| 14 | ✓ | `#operation` một thao tác; SCH-SC-14. |
| 15 | ✓ | Dời: khoảng, `resources`, `option`, `reload()`, `readonly`, `disabled`, destroy đều abort, kết quả muộn bị bỏ (SCH-SC-15). Tạo: `option`, `resources`, destroy (L10). |
| 16 | ✓ | Không hiện nội dung lỗi ở dải tải, dải dời, dải tạo. |
| 17 | ✓ | `move()` true chỉ khi chấp nhận; false cho mọi nhánh, gồm `resourceId` lạ, trái `axis`, `droppable` false, template ô. |
| 18 | ✓ | `'api'` không hỏi phạm vi, không lấy focus; tài liệu ghi Hoàn tác có thể bị `droppable` từ chối (H3). |
| 19–21 | ✓ | Chèn và đặt `selectedId` không phát `sdSelect`; `void` biến mất im lặng; throw biến mất + `create-error` (có cả dải như calendar 9.2). |
| 22–24 | ✓ | Loader dùng chung; `reload()` giữ dữ liệu; lỗi → dải + Thử lại + `sdLoadError`; abort không phát. |
| 25 | N/A | Scheduler không có `items`. |
| 26–28 | ✓ | Ngưỡng 5px của CDK, click sau kéo không chọn, Enter/Space, Esc, `readonly` chọn được, `disabled` không. |
| 29–31 | ✓ | Harness 1: sau cả 5 kết quả của `Alt` + `↓` (kể cả throw/reject mà spec hiện có chưa thử), focus ở khối, kể cả khi khối sang nhóm khác. Giữ focus người dùng (SC-30), `'api'` không lấy focus. |
| 32 | ✓ | `ResizeObserver` trên host, guard `typeof`, không media query viewport. |
| 33 | ✓ | Một `role="status" aria-live="polite" aria-atomic="true"`. |
| 34 | ✓ | Tắt transition, icon sync, thanh tiến trình. |
| 35 | ✓ | `CanvasText` cho khung, `Highlight` cho chọn, đang chờ, vạch giờ. |
| 36 | ✗ | Hover chỉ trong `@media (hover: hover)`, mọi thao tác có phím ✓; vùng chạm 44px chưa đủ (mục 7). |
| 37 | ✓ | 5 locale, cùng placeholder (SCH-SC-37 xanh trong lần chạy). |
| 38 | ✓ | |
| 39 | ✓ | `booleanAttribute`; `string \| null \| undefined`. |
| 40–45 | ✓ | Xem 3.4. |

Bảng `onMove` (SC-09 → SC-13): reviewer **tự viết harness Karma tạm** (không qua showcase vì bản sao không cài showcase), thử đủ 5 kết quả, mỗi kết quả đồng bộ và Promise, qua **kéo** sang hàng khác và qua **`Alt` + `↓`**; kiểm DOM (hàng, `data-start`, `data-failed`, dải, nút Bỏ qua, `data-pending` + icon sync khi chờ), output (`sdMove`, `sdMoveError` với `reason`/`error`), live region và focus. 21/21 xanh. Nhánh `move()` (`'api'`) đọc từ spec hiện có (`scheduler-pipeline.spec.ts:276–391`). Harness đã xoá, `git status` sạch.

### 3.4 Mã nguồn
- [x] SC-40: standalone, OnPush, `input()`/`model()`/`output()`, `@if`/`@for` có `track` theo id hoặc khoá.
- [x] SC-41: ngày giờ qua `SdDateTimeService` và `ɵ` của calendar; không `new Date(string)`; `getHours()` chỉ trên carrier `#now` (như calendar); không cộng 24 giờ.
- [x] SC-42: không dependency mới; kéo bằng `cdkDrag`.
- [x] SC-43: màu bằng token có fallback, `check:scss-hex` xanh, không `!important`, không `::ng-deep` (bóng: mục 19).
- [x] SC-44: không phần tử theo slot; vạch lưới bằng gradient; vùng ngoài giờ là một phần tử mỗi đoạn đã gộp.
- [x] SC-45: có `why:` ở các quyết định chính (thiếu ở mục 15).
- [x] Không `any` mới trong public API, không `as unknown as` (grep trên model, templates, component, utils, index và các file `ɵ` mới).
- [x] Dọn khi destroy: loader, operation (AbortController), `ResizeObserver` (`#hostWidth.disconnect()`), bộ đếm 60 giây, rAF tự cuộn (`cancelAnimationFrame`), hai listener `keydown` của document; `afterNextRender` gắn injector. Không có `focusin`, `IntersectionObserver`. Test destroy có cho tải, dời, tạo (SCH-SC-15); dọn observer/timer chỉ kiểm bằng đọc code.
- [x] Effect không gây vòng: mọi ghi nằm trong `untracked`; ghi `#now` trong effect tải chỉ chạy lại khi sang ngày khác rồi dừng; effect `selectedId` ghi `null` rồi dừng. `computed` không gọi API (chỉ predicate `movable` khi render, đúng SC-06).
- [x] Không `setTimeout` chờ render: dùng `afterNextRender` (thứ tự hai `afterNextRender` gây mục 2).
- [x] SCSS: không `min-width` cố định trên host (`:host { min-width: 0 }`); literal trùng thang dùng token (`fs()`, `lh()`, `radius()`).

### 3.5 Trợ năng và hình ảnh
- [ ] Phần tay `TESTING §8`: không làm (không có showcase chạy trong bản sao; không có trình đọc màn hình). Ghi lại mục 22.
- [x] So ảnh `reports/scheduler-screens/` (17 ảnh) với 9 mục HTML:

| Ảnh / mục HTML | Lệch | Chủ đích? |
| --- | --- | --- |
| `day-1200` / 01 | Tiêu đề "9 tháng 11" thay vì "09" | Có (Bước 0 S7/L5) |
| `day-1200` / 01 | Nhóm "· 3 tài nguyên" thay vì "· 3 phòng" | Có (§10: HTML ghi "phòng" để dễ đọc) |
| `day-1200` / 01 | Ô góc "Tài nguyên" thay vì "Phòng"; dữ liệu phòng khác; khung 1200px | Không (mục 8; `resourceLabel` chưa đặt ở ví dụ) |
| `day-1200` / 01 | Không có vạch giờ hiện tại | Không: ảnh không ghim giờ (mục 8); component có vạch (SCH-C-17) |
| `week-1200`, `vehicles-week` / 02 | Lane cùng ngày không theo giờ (Sa Pa 09:00, 13:30, 11:00) | Không (mục 1) |
| `week-1200` / 02 | Số ngày trên trục "9" thay vì "09" | Không (mục 9) |
| `month-1200`, `leave-month` / 02 | Dữ liệu khác HTML, không có thanh bị cắt hai đầu như "Nghỉ thai sản" | Không (mục 8) |
| 03 (bậc, 8 trạng thái) | Không có ảnh | Không (mục 8) |
| `drag-across-rows` / 4b | Khối đề xuất là hộp rỗng màu primary, không phải khối có màu, chấm, tên | Không (mục 4) |
| `drag-blocked-row` / 4b | Chỉ hàng đích bị sọc; HTML sọc mọi hàng bị từ chối | Có (spec §8.3, §9.3 ưu tiên HTML; mục 18) |
| 4a, 4c, 4d | Không có ảnh | Không (mục 8) |
| `timesheet-cells` / 05 | Mã công, cột tổng, không có avatar trong ô tài nguyên | Có phần (mã, tổng là của consumer); dữ liệu khác HTML (mục 8) |
| `state-load-error` / 06 | Chữ "Không tải được lịch." thay vì "… lịch ngày này." | Có (§14 dùng lại `load-error`) |
| `state-empty` / 06 | Không có dòng "Đổi bộ lọc…" | Có (dòng đó là template trống của consumer) |
| 06 đang tải lần đầu, bị từ chối khi dời | Không có ảnh | Không (mục 8) |
| `compact-390`, `day-400-compact` / 07 | Tiêu đề dài bị cắt thay vì "09/11/2026" | Không (mục 5) |
| `compact-390` / 07 | Mở ở 10:00 thay vì 08:00 | Không (mục 2) |
| 07 "hẹp 360px" | Chụp 390/400px | Không (mục 8) |
| `day-1200-dark` | Không có đối chiếu HTML; tương phản và token đúng | — |
| `day-1200-rtl` | Mở ở 00:00 (RTL bật sau render); chữ Việt đảo vị trí do bidi | Không phải lỗi component; ảnh chưa đại diện (mục 8) |
| `vehicles-forced-colors` | Khung, chọn đúng SC-35; mất chấm màu và vòng hôm nay | Ngoài yêu cầu (mục 23) |

- [ ] Light, dark, RTL, forced-colors, reduced motion trên màn chính: light, dark, forced-colors có ảnh và đúng; RTL có ảnh nhưng chưa đại diện (mục 8); reduced motion chỉ kiểm bằng đọc CSS và test.

### 3.6 Tài liệu
- [x] `sd-scheduler.md` (tiếng Anh): API đủ, ví dụ server (`onLoad` với `resourceIds`, `signal`) và client, hợp đồng `onMove` có `'cancel'` (qua bảng Pipeline và link calendar), `droppable`, `axis`, bàn phím, trạng thái, a11y, theming, hook E2E, giới hạn 150 tài nguyên, Hoàn tác và hệ quả H3. Mọi anchor tới `sd-calendar.md` tồn tại. Câu "sorted by start" đúng sau khi sửa mục 1.
- [x] `CHANGELOG.md` `## [Unreleased]`: dòng Highlights và `#### Scheduler` trong Added, có i18n.
- [x] `THEME.md`: câu dùng chung token calendar + đoạn biến kích thước, không token màu mới.
- [x] `documentation.registry.ts`: trang `components/scheduler`, `publishedDocId`, 4 mục; số đếm sửa ở spec registry và `generate-showcase-route-shells.test.mjs` (xanh). Spec Karma của showcase không chạy (không có `showcase/node_modules`).
- [x] i18n đủ 5 locale (15 key, parity xanh).
- [x] `check:sync` xanh; v20/v21/v22 chỉ khác do sync (khác số dòng ở v22 là biến đổi đã duyệt); không đổi `published-*`, `dist`.

## Thử phá
Không làm ở phần này (thuộc reviewer test, REVIEW §3.3).
