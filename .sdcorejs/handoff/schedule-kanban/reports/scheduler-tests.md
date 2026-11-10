# sd-scheduler · test
Commit: `0b9288e35` (sau R2'), báo cáo ở commit kế tiếp, nhánh `feat/scheduler` cắt từ `main` sau khi #141 merge · Node local v26.12.0 (PD chốt K1 ở kanban: CI Node 24.22.1 là cổng chuẩn) · Chrome Headless 156

## Lệnh (TESTING.md §1)
| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` | 9780/9780 SUCCESS, seed 372538, 5 phút 41 giây. Tổng: statements 88.93% (43082/48443), branches 80.7%, functions 88.16%, lines 91.2% (ngưỡng karma không báo lỗi). Trước R2 (`eb32766d2`): 9753/9753, seed 644544. |
| Lệnh nhanh scheduler (`--include='projects/sdcorejs-angular/components/scheduler/**/*.spec.ts'`) | 159/159 SUCCESS |
| Scheduler + calendar với `JASMINE_SEED=475754` (seed reviewer thấy `SCH-B-03` đỏ) | 351/351 SUCCESS sau `5f97e4d74` |
| Spec calendar sau các commit `refactor(calendar)` | 192/192 SUCCESS; API và DOM calendar không đổi |
| `npm run lint` (v19) | All files pass linting |
| `npx ng build sdcorejs-angular` | exit 0 |
| `npm run test:theme` | exit 0 |
| `npm run check:scss-hex` | 0 finding |
| `npm run test:scripts` | exit 0, 0 fail |
| `npm run sync` + `npm run check:sync` | Passed: v20, v21, v22 match v19 (mỗi lần sync khôi phục ~1600 file v22 chỉ đổi CRLF, diff rỗng; memory `sync-v22-phantom-eol`) |
| Showcase `npm test` | 331/331 SUCCESS (`NODE_OPTIONS=--max-old-space-size=8192`). Đã thêm bản tiếng Anh còn thiếu trên `main` cho 5 ví dụ calendar và ví dụ popover của query-bar. |
| Playwright `e2e/components/scheduler.e2e.ts` | Cấu hình tạm ngoài repo, dev server cổng 4371, hai project `asia-bangkok`, `utc`, Chromium 1920×1000: 35 passed, 5 skipped (5 test ảnh chỉ chạy ở Bangkok), 1,3 phút |

## Coverage từng file (TESTING.md §2)
Statements từ báo cáo HTML của Istanbul, branches và lines từ `lcov.info`, lần chạy đầy đủ sau R2'.

| File | Statements | Branches | Lines | Ngưỡng |
| --- | --- | --- | --- | --- |
| `scheduler.utils.ts` | 100% (84/84) | 100% (48/48) | 100% (69/69) | 100/100 ✓ |
| `scheduler.component.ts` | 96.75% (1042/1077) | 86.98% (508/584) | 99.34% (905/911) | ≥90/≥85 ✓ |
| `calendar-move.ts`, `calendar-host.ts`, `calendar-format.ts`, `calendar-edge-scroll.ts`, `calendar-loader.ts`, `calendar.utils.ts` (phần dùng chung, export `ɵ`) | 100% | 100% | 100% | — (lớp nội bộ) |
| `scheduler.templates.ts` | 100% (16/16) | — | 100% (13/13) | không đo (§2), type test |

Nhánh còn trống của component: callback tự cuộn hai trục khi kéo sát mép (lớp `ɵSdCalendarEdgeScroller` dùng chung có test ở `calendar.shared.spec.ts`), nhánh RTL của `#revealToday`.

## Mã test
Bảng sinh từ tên test (`[SCH-…]`) và từ bảng mã của các test chạy theo bảng (`scheduler-pipeline.spec.ts`: kết quả `onMove`, lý do huỷ SC-15). Mã `SCH-B-xx` là test hồi quy của các lỗi sửa sau R1: `SCH-B-30…33` (tìm thấy khi viết tài liệu, trước R2), `SCH-B-01…48` (R2 và R2', xem `reviews/scheduler-R2-author.md`).

| Mã | File:dòng test | Kết quả |
| --- | --- | --- |
| SCH-U-01 | scheduler.utils.spec.ts:35 | ✓ |
| SCH-U-02 | scheduler.utils.spec.ts:42 | ✓ |
| SCH-U-03 | scheduler.utils.spec.ts:51 | ✓ |
| SCH-U-04 | scheduler.utils.spec.ts:60 | ✓ |
| SCH-U-05 | scheduler.utils.spec.ts:64 | ✓ |
| SCH-U-06 | scheduler.component.spec.ts:408, scheduler.utils.spec.ts:74 | ✓ |
| SCH-U-07 | scheduler.component.spec.ts:482, scheduler.utils.spec.ts:89 | ✓ |
| SCH-U-08 | scheduler.utils.spec.ts:155 | ✓ |
| SCH-U-09 | scheduler.utils.spec.ts:204 | ✓ |
| SCH-U-10 | scheduler.utils.spec.ts:142 | ✓ |
| SCH-C-01 | scheduler.component.spec.ts:54, scheduler.component.spec.ts:78, scheduler.component.spec.ts:87, scheduler.component.spec.ts:96, scheduler.component.spec.ts:122 | ✓ |
| SCH-C-02 | scheduler.component.spec.ts:133, scheduler.component.spec.ts:146, scheduler.component.spec.ts:167 | ✓ |
| SCH-C-03 | scheduler.component.spec.ts:187 | ✓ |
| SCH-C-04 | scheduler.component.spec.ts:293, scheduler.component.spec.ts:305, scheduler.utils.spec.ts:216 | ✓ |
| SCH-C-05 | scheduler.interaction.spec.ts:46, scheduler.interaction.spec.ts:74, scheduler.interaction.spec.ts:97, scheduler.interaction.spec.ts:121, scheduler.interaction.spec.ts:288 | ✓ |
| SCH-C-06 | scheduler-pipeline.spec.ts:60, scheduler-pipeline.spec.ts:80, scheduler-pipeline.spec.ts:103, scheduler-pipeline.spec.ts:239, scheduler-pipeline.spec.ts:260, scheduler-pipeline.spec.ts:600, scheduler-pipeline.spec.ts:746, scheduler.utils.spec.ts:238 | ✓ |
| SCH-C-07 | scheduler-pipeline.spec.ts:117, scheduler-pipeline.spec.ts:143, scheduler.review.spec.ts:89 | ✓ |
| SCH-C-08 | scheduler-pipeline.spec.ts:158, scheduler.keyboard.spec.ts:285 | ✓ |
| SCH-C-09 | scheduler-pipeline.spec.ts:186, scheduler.keyboard.spec.ts:272 | ✓ |
| SCH-C-10 | scheduler-pipeline.spec.ts:203, scheduler-pipeline.spec.ts:672, scheduler-pipeline.spec.ts:698, scheduler-pipeline.spec.ts:718, scheduler.keyboard.spec.ts:322, scheduler.utils.spec.ts:232 | ✓ |
| SCH-C-11 | scheduler.compact.spec.ts:136, scheduler.compact.spec.ts:192 | ✓ |
| SCH-C-12 | scheduler.component.spec.ts:603, scheduler.types.spec.ts:64 | ✓ |
| SCH-C-13 | scheduler.component.spec.ts:374, scheduler.component.spec.ts:422, scheduler.component.spec.ts:438, scheduler.component.spec.ts:462, scheduler.keyboard.spec.ts:139, scheduler.keyboard.spec.ts:189 | ✓ |
| SCH-C-14 | scheduler.keyboard.spec.ts:49, scheduler.keyboard.spec.ts:72, scheduler.keyboard.spec.ts:92, scheduler.keyboard.spec.ts:117, scheduler.keyboard.spec.ts:159, scheduler.keyboard.spec.ts:170, scheduler.keyboard.spec.ts:205 | ✓ |
| SCH-C-15 | scheduler.compact.spec.ts:41, scheduler.compact.spec.ts:57, scheduler.compact.spec.ts:68 | ✓ |
| SCH-C-16 | scheduler.component.spec.ts:536, scheduler.keyboard.spec.ts:338 | ✓ |
| SCH-C-17 | scheduler.component.spec.ts:503, scheduler.component.spec.ts:523 | ✓ |
| SCH-C-18 | scheduler.exports.spec.ts:7 | ✓ |
| SCH-SC-01 | scheduler.component.spec.ts:332, scheduler.component.spec.ts:357, scheduler.review.spec.ts:143 | ✓ |
| SCH-SC-02 | scheduler-pipeline.spec.ts:395 | ✓ |
| SCH-SC-03 | scheduler-pipeline.spec.ts:409, scheduler.component.spec.ts:397 | ✓ |
| SCH-SC-06 | scheduler-pipeline.spec.ts:421, scheduler.interaction.spec.ts:134, scheduler.review.spec.ts:28 | ✓ |
| SCH-SC-07 | scheduler-pipeline.spec.ts:449, scheduler.interaction.spec.ts:153, scheduler.keyboard.spec.ts:299 | ✓ |
| SCH-SC-08 | scheduler-pipeline.spec.ts:462, scheduler-pipeline.spec.ts:627, scheduler.keyboard.spec.ts:255 | ✓ |
| SCH-SC-09 | scheduler.types.spec.ts:21, scheduler-pipeline.spec.ts (table) | ✓ |
| SCH-SC-10 | scheduler-pipeline.spec.ts (table) | ✓ |
| SCH-SC-11 | scheduler-pipeline.spec.ts (table) | ✓ |
| SCH-SC-12 | scheduler-pipeline.spec.ts:360 | ✓ |
| SCH-SC-13 | scheduler-pipeline.spec.ts (table) | ✓ |
| SCH-SC-14 | scheduler-pipeline.spec.ts:477, scheduler.interaction.spec.ts:166, scheduler.keyboard.spec.ts:309 | ✓ |
| SCH-SC-15 | scheduler-pipeline.spec.ts:500, scheduler.component.spec.ts:214, scheduler.interaction.spec.ts:188 | ✓ |
| SCH-SC-16 | scheduler-pipeline.spec.ts:379, scheduler.component.spec.ts:279 | ✓ |
| SCH-SC-17 | scheduler-pipeline.spec.ts:535, scheduler-pipeline.spec.ts:613, scheduler.review.spec.ts:50 | ✓ |
| SCH-SC-18 | scheduler-pipeline.spec.ts:562 | ✓ |
| SCH-SC-19 | scheduler.interaction.spec.ts:225 | ✓ |
| SCH-SC-20 | scheduler.interaction.spec.ts:250 | ✓ |
| SCH-SC-21 | scheduler.interaction.spec.ts:265 | ✓ |
| SCH-SC-22 | scheduler.component.spec.ts:206, scheduler.types.spec.ts:37 | ✓ |
| SCH-SC-23 | scheduler.component.spec.ts:239 | ✓ |
| SCH-SC-24 | scheduler.component.spec.ts:256 | ✓ |
| SCH-SC-26 | scheduler-pipeline.spec.ts:653, scheduler.interaction.spec.ts:314, scheduler.interaction.spec.ts:340, scheduler.review.spec.ts:154 | ✓ |
| SCH-SC-27 | scheduler.interaction.spec.ts:354 | ✓ |
| SCH-SC-28 | scheduler.compact.spec.ts:166, scheduler.interaction.spec.ts:368 | ✓ |
| SCH-SC-29 | scheduler.keyboard.spec.ts:224, scheduler.review.spec.ts:166 | ✓ |
| SCH-SC-30 | scheduler.keyboard.spec.ts:239 | ✓ |
| SCH-SC-31 | scheduler-pipeline.spec.ts:586 | ✓ |
| SCH-SC-32 | scheduler.compact.spec.ts:27, scheduler.review.spec.ts:125 | ✓ |
| SCH-SC-33 | scheduler.component.spec.ts:550 | ✓ |
| SCH-SC-34 | scheduler.compact.spec.ts:220 | ✓ |
| SCH-SC-35 | scheduler.compact.spec.ts:229 | ✓ |
| SCH-SC-36 | scheduler.compact.spec.ts:242 | ✓ |
| SCH-SC-37 | scheduler.i18n.spec.ts:24 | ✓ |
| SCH-SC-38 | scheduler.component.spec.ts:558 | ✓ |
| SCH-E-01 | scheduler.e2e.ts:130, scheduler.e2e.ts:254, scheduler.e2e.ts:333, scheduler.e2e.ts:345, scheduler.e2e.ts:380, scheduler.e2e.ts:401, scheduler.e2e.ts:420 | ✓ |
| SCH-E-02 | scheduler.e2e.ts:142 | ✓ |
| SCH-E-03 | scheduler.e2e.ts:155 | ✓ |
| SCH-E-04 | scheduler.e2e.ts:167 | ✓ |
| SCH-E-05 | scheduler.e2e.ts:178 | ✓ |
| SCH-E-06 | scheduler.e2e.ts:189 | ✓ |
| SCH-E-07 | scheduler.e2e.ts:199 | ✓ |
| SCH-E-08 | scheduler.e2e.ts:214 | ✓ |
| SCH-E-09 | scheduler.e2e.ts:231 | ✓ |
| SCH-E-10 | scheduler.e2e.ts:243, scheduler.e2e.ts:439 | ✓ |
| SCH-E-11 | scheduler.e2e.ts:301, scheduler.e2e.ts:451 | ✓ |
| SCH-E-12 | scheduler.e2e.ts:264 | ✓ |
| SCH-B-01 | scheduler.review.spec.ts:203, scheduler.review.spec.ts:214 | ✓ |
| SCH-B-02 | scheduler.review.spec.ts:235, scheduler.review.spec.ts:244 | ✓ |
| SCH-B-03 | scheduler.review.spec.ts:258 | ✓ |
| SCH-B-04 | scheduler.review.spec.ts:277 | ✓ |
| SCH-B-05 | scheduler.review.spec.ts:305 | ✓ |
| SCH-B-07 | scheduler.review.spec.ts:313 | ✓ |
| SCH-B-16 | scheduler.review.spec.ts:325 | ✓ |
| SCH-B-23 | scheduler.review.spec.ts:359 | ✓ |
| SCH-B-30 | scheduler-pipeline.spec.ts:718 | ✓ |
| SCH-B-31 | scheduler-pipeline.spec.ts:746 | ✓ |
| SCH-B-32 | scheduler.component.spec.ts:462 | ✓ |
| SCH-B-33 | scheduler.compact.spec.ts:166 | ✓ |
| SCH-B-40 | scheduler.review.spec.ts:28 | ✓ |
| SCH-B-41 | scheduler.review.spec.ts:50 | ✓ |
| SCH-B-42 | scheduler.review.spec.ts:89 | ✓ |
| SCH-B-43 | scheduler.review.spec.ts:125 | ✓ |
| SCH-B-44 | scheduler.review.spec.ts:143 | ✓ |
| SCH-B-45 | scheduler.review.spec.ts:154 | ✓ |
| SCH-B-46 | scheduler.review.spec.ts:166 | ✓ |
| SCH-B-47 | scheduler.review.spec.ts:339 | ✓ |
| SCH-B-48 | scheduler.review.spec.ts:347 | ✓ |

Bỏ qua có lý do:
- SCH-SC-04, SCH-SC-05: kiểm bằng type test (`scheduler.types.spec.ts`: không có `get*`/`with*`, cờ là `SdCalendarState<C>` import từ calendar) và bằng reviewer; calendar và kanban cũng không gắn mã này vào test.
- SCH-SC-25: scheduler không có input `items` (chỉ `dataSource`), như calendar.
- SCH-SC-39 → SCH-SC-45: quy tắc mã nguồn, reviewer kiểm theo REVIEW.md §3.4.

## Thử phá (REVIEW.md §3.3)
Reviewer test làm ở R2 và R2' (`reviews/scheduler-R2-tests.md`, `scheduler-R2-recheck-tests.md`); tác giả chạy lại sau sửa (`reviews/scheduler-R2-author.md`). Mỗi đột biến dưới đây có ít nhất một test đỏ:

| Chỗ sửa | Test đỏ |
| --- | --- |
| Bỏ kiểm `signal.aborted` trước khi ghi kết quả (`calendar-move.ts`) | 6 `[SCH-SC-15]` |
| Coi `'cancel'` như `false` | 2 `[SCH-SC-12]` |
| Bỏ đánh giá lại `movable`/`droppable` ngay trước `onMove` (`allowed: () => true`) | 2 `[SCH-B-40]` |
| `<=` thành `<` trong phép giao lane (`scheduler.utils.ts`) | `[SCH-U-02]`, `[SCH-U-04]`, `[SCH-U-05]` |
| Cho hai thao tác chờ cùng lúc (runner và guard của scheduler) | 2 `[SCH-SC-14]` |
| Bỏ guard `locked` | `[SCH-B-41]` |
| Khoá nhớ `droppable` chỉ theo tài nguyên, hoặc bỏ bộ nhớ | `[SCH-B-42]` |
| Bỏ guard `axis` ở pipeline / khi kéo | `[SCH-C-08]` |
| Bỏ mở nhóm thu gọn khi chấp nhận | 2 `[SCH-C-09]` |
| `Alt` + `↑` `↓` không bỏ qua hàng bị từ chối | `[SCH-SC-08]` |
| Bỏ khoá sắp theo giờ ở Tuần/Tháng | 2 `[SCH-B-01]` |
| Bỏ đo kích thước trước lần cuộn đầu | `[SCH-B-02]` |
| Bỏ `isolation` của rãnh | `[SCH-B-03]` |

Zone: reviewer test chạy lệnh nhanh scheduler ở New York, Kolkata, UTC, St John's, Kiritimati (Karma mở bằng Playwright `timezoneId`, vì Chrome trên Windows bỏ qua `TZ`): 138/138 ở `eb32766d2`.

## E2E (TESTING §6.3, §11)
Dữ liệu của bốn ví dụ là dữ liệu của `SD Scheduler Design.dc.html`; đồng hồ ghim Thứ Hai 09/11/2026 10:40 (`page.clock.setFixedTime`).

| Mã | Kịch bản | Kết quả |
| --- | --- | --- |
| SCH-E-01 | Đặt phòng: quét 10:00–12:00 trên Phòng Huế, Lưu trong hộp demo: khối mới đúng hàng, giờ, được chọn; axe. Cùng mã: tuần Xe giao hàng (thanh cả ngày), forced colors + reduced motion, axe; zone New York với `?timeZone=Asia/Ho_Chi_Minh` (giờ và vạch giờ hiện tại theo zone cấu hình), Kolkata không cấu hình; ảnh 01–04 ở 1122px, dark, RTL | ✓ |
| SCH-E-02 | Kéo “Review ngân sách Q4” (6 người) từ Phòng Hà Nội sang Phòng Huế (6 chỗ): hàng đích `data-drop="ok"`, nhãn nổi “Phòng Huế · 10:00 – 11:30”, đổi hàng, live region “Đã chuyển sang Phòng Huế, 10:00” | ✓ |
| SCH-E-03 | Kéo sang Phòng Cần Thơ (4 chỗ): hàng `data-drop="blocked"`, thả về chỗ cũ, không `sdMove`, đọc “Không chuyển sang Phòng Cần Thơ được” | ✓ |
| SCH-E-04 | Nghỉ phép `axis: 'time'`: kéo “Công tác Đà Nẵng” của Trần Thu Hà sang hàng Lê Minh: không đổi người, không đổi ngày; axe | ✓ |
| SCH-E-05 | Thu gọn Tầng 5, `Alt` + `↓` trên “Họp nhóm kho” (Phòng Đà Nẵng, hàng cuối Tầng 3): nhóm mở, khối sang Phòng Sài Gòn (hàng đầu Tầng 5), focus ở lại khối | ✓ |
| SCH-E-06 | Chấm công: cột tổng “4,5” của Phạm Quốc Bảo; bấm ô Lê Minh ngày 03/11 (Ô): `sdCellSelect` đúng người, ngày, mã; không có khối; axe | ✓ |
| SCH-E-07 | Kéo mép phải “1:1 Hà – Bảo” thêm 1 giờ: nhãn nổi “09:00 – 10:30”, kết thúc 10:30, đọc “Đã đổi 1:1 Hà – Bảo thành 09:00 – 10:30” | ✓ |
| SCH-E-08 | 150 tài nguyên × 31 ngày, cuộn ngang 400px và dọc 600px: trục giữ vị trí trên, cột tài nguyên giữ mép trái | ✓ |
| SCH-E-09 | `onMove` trả `'cancel'`: về hàng và giờ cũ, không `data-failed`, không dải lỗi, đọc “Đã huỷ thay đổi” | ✓ |
| SCH-E-10 | Lỗi tải một lần, Thử lại: dải lỗi, `sdLoadError`, rồi hết dải và có dữ liệu. Cùng mã: ảnh đang tải lại (nguồn server), trống | ✓ |
| SCH-E-11 | 390px, `hasTouch`: compact, cột tài nguyên 120px, giờ 64px, chạm tạo một ô, giữ 500ms rồi kéo (touch qua CDP) sang Phòng Huế. Cùng mã: ảnh 700, 400, 360px | ✓ |
| SCH-E-12 | 150 × 31 × 3, đo theo §10 (mục dưới) | ✓ |

Lỗi console: mỗi lần mở trang có các dòng `404` của `GET /docs/versions.json` (registry docs, dev server không phục vụ), như calendar và kanban.

Ma trận §11 chưa phủ: preset `graphite` (tham số biên dịch SCSS, không đổi được trong showcase lúc chạy), locale `en` (kiểm ở Karma `scheduler.i18n.spec.ts`), viewport 1280 (ở 1280 trang docs để lại < 600px cho ví dụ, nên dùng 1920 và khung cố định 1122/700/400/360px như calendar; **cần PD chốt**).

## Hiệu năng (TESTING §10)
Kịch bản: ví dụ Đặt phòng, nút “150 tài nguyên × 31 ngày” (150 tài nguyên trong 10 nhóm, 3 sự kiện mỗi tài nguyên, Tháng 12/2026). Kéo: `PerformanceObserver('longtask')` trong một lần kéo một khối sang hàng khác.

| Đo | Kết quả | Ngân sách |
| --- | --- | --- |
| Render, production build (`ng build showcase --configuration production`, server tĩnh), đo trong trang từ lúc bấm tới khung hình sau khi khối đầu có trong DOM, 7 lần | trung vị **101 ms** (90–120) không ghim đồng hồ; 111 ms (96–131) khi ghim | ≤ 250 ms ✓ (Q4 nhắm 100 ms) |
| Render, production build, E2E SCH-E-12 (gồm độ trễ poll của Playwright), 1 worker, 3 lần × 5 mẫu | trung vị 256, 280, 258 ms | ≤ 250 ms (vượt do cách đo) |
| Render, dev server, E2E SCH-E-12, 2 worker | trung vị 300–405 ms | ≤ 250 ms — vượt |
| Long task khi kéo (dev server và production) | không có | không task > 50 ms ✓ |

Đã làm ở checkpoint 2 (Bước 0 H6, cách 1–2): một bộ listener cho mỗi hàng thay vì mỗi khối, `track` theo id, lưới vẽ bằng gradient, không phần tử cho từng ô; đích kéo tính ngoài zone, chỉ vào zone khi đích đổi. Cách 3–4 (ảo hoá hàng, `content-visibility`) chưa làm, chờ PD (H6).

## Ảnh chụp (TESTING §9)
Thư mục `reports/scheduler-screens/`, chụp từ project `asia-bangkok`, Chromium, vi, light trừ khi ghi khác, khung 1122px như HTML trừ khi ghi khác.

| Mục thiết kế | Ảnh |
| --- | --- |
| 01 Ngày (đặt phòng theo tầng) | `01-day-1122.png` (vạch giờ hiện tại 10:40), `01-day-1122-dark.png`, `01-day-1122-rtl.png` |
| 02 Tuần, Tháng | `02-week-1122.png`, `02-month-1122.png`, `vehicles-week.png` (xe, 763px), `leave-month.png` (nghỉ phép, 763px), `month-150-scrolled.png` (150 tài nguyên, đã cuộn hai chiều) |
| 03 Khối | `03-blocks-selected.png` (đang chọn, các bậc bề rộng), `03-block-saving.png` (đang lưu) |
| 04 Tương tác | `04-create-sweep.png` (quét), `04-grid-cursor.png` (con trỏ lưới), `04-recurring-scope.png` (hỏi phạm vi), `04-move-rejected.png` (bị từ chối), `move-across-rows.png` (đổi hàng, nhãn nổi), `move-blocked-row.png` (hàng bị chặn), `resize-end.png` (kéo mép, nhãn nổi) |
| 05 Template ô | `timesheet-cells.png` (mã công, cột tổng) |
| 06 Trạng thái | `06-state-reloading.png`, `state-load-error.png`, `06-state-empty.png`. Không có ảnh “đang tải lần đầu”: khối xương chỉ có trước câu trả lời đầu của `onLoad`, ví dụ client trả ngay; Karma kiểm (`SCH-C-02`). |
| 07 Hẹp | `07-day-700.png`, `07-day-400.png`, `07-day-360.png`, `compact-390.png` (390px, cảm ứng) |
| Forced colors | `vehicles-forced-colors.png` |

Lệch có chủ đích (ghi trong PR):
- Số ngày trên trục Tuần “9” thay vì “09”, tiêu đề Ngày “9 tháng 11”: định dạng của calendar (Bước 0 L5).
- Số đếm hàng nhóm “3 tài nguyên” thay vì “3 phòng”: chỉ đổi qua key i18n `group-count` (R1 #7, chờ PD).
- Tiêu đề hẹp xuống dòng thay vì “09/11/2026” (R2 #5, chờ PD).
- Ví dụ Chấm công không có avatar như HTML (template tài nguyên của ví dụ chỉ có tên và cột tổng).
