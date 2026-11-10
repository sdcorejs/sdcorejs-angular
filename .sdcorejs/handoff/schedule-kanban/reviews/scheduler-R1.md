# scheduler · R1
Nhánh: feat/scheduler · Commit: 86598cbc7 (base `main` 22ef521fe; xét e153fb4ae, 5ecfb2dfd, ea6ae27d4, e0d6aa1b9, ccffde78f, 86598cbc7) · Ngày: 2026-11-10
Reviewer: phiên mới, không có lịch sử của phiên tác giả

Phạm vi R1 (REVIEW.md mục 2): API, model, cấu trúc state, test RED của checkpoint 1 và 2. Phần của checkpoint 3–6 (chọn, tạo, dời, kéo mép, bàn phím, compact, template ô, docs đầy đủ, CHANGELOG, E2E) không tính là thiếu; chỉ ghi khi thiết kế hiện tại cản chúng. Thay đổi chưa commit của checkpoint 3 trong worktree tác giả không được xét.

Đã đọc: `AGENTS.md`; `schedule-kanban/{REVIEW,SHARED-CONTRACT,TESTING,PROMPT}.md`; `design-scheduler/{scheduler,PROMPT}.md`; Bước 0 `reports/scheduler-step0.md` (đọc sau khi tự đối chiếu API); code `components/scheduler/**`, `components/calendar/**` (index, utils, format, move, loader, edge-scroll, templates, component), diff 6 commit. HTML thiết kế không mở (R1 không xét hình ảnh).

## Kết luận
Chặn: 0 · Nên sửa: 5 · Ghi chú: 11

Được làm tiếp checkpoint 3. Mục 1 (pipeline dời chưa tách theo H1) phải xong, hoặc PD đổi quyết định H1, **trước khi viết code checkpoint 4**; nếu checkpoint 4 viết pipeline dời ngay trong scheduler thì R2 sẽ ghi Chặn theo REVIEW §3.1.

API public, model, mặc định khớp `scheduler.md` §2–§4 và Bước 0. Cấu trúc signal/effect sạch: không có vòng ghi, mọi ghi trong effect nằm trong `untracked`, `computed` không gọi API, dọn dẹp đủ khi destroy. Commit refactor calendar giữ nguyên API public, DOM và hành vi; spec calendar xanh.

## Lệnh đã chạy
Node local v26 (CI dùng 24.22.1). Chạy trong `C:\tmp\r1-scheduler` (worktree tách rời ở 86598cbc7).

| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include=projects/sdcorejs-angular/components/scheduler/**/*.spec.ts` | **46 SUCCESS**, 0 FAILED, 0.70 s (seed 472073). Có 6 dòng `WARN` thật từ component (xem Ghi chú 11). |
| `npx ng test … --include=projects/sdcorejs-angular/components/calendar/**/*.spec.ts` | **181 SUCCESS**, 0 FAILED, 1.48 s (seed 869662). |
| `npm run lint` (versions/v19) | **All files pass linting.** |
| Như lệnh đầu, thêm `--code-coverage` | 46 SUCCESS. Ngưỡng global đỏ là do chỉ chạy một entry (bình thường). Theo `lcov.info`: `scheduler.utils.ts` lines 100% (73/73), branches 100% (45/45); `scheduler.component.ts` lines 97.1% (396/408), branches 75.7% (159/210); `scheduler.templates.ts` lines 84.6%. Dòng chưa phủ của component: 393, 415–416, 511, 517, 529, 588, 595–596, 639, 936–937. |
| Tái hiện RED CP2: chép `src/` của ccffde78f vào bản review, chạy `--include=…/scheduler.component.spec.ts`, rồi chép lại bản 86598cbc7 (so sha1 từng file: khớp) | **26 FAILED, 2 SUCCESS.** Xem mục "Test RED". |
| Tái hiện RED CP1: chép `scheduler.utils.ts` và 3 spec của ea6ae27d4, chạy utils/exports/types spec, rồi chép lại | **13 FAILED, 4 SUCCESS** (3 type test chỉ cần biên dịch, và SCH-U-04). Mọi test đỏ đều vì assert. |

Không chạy: build lib, showcase, E2E, `sync`/`check:sync` (không thuộc R1).

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nên sửa | scheduler.md §1, §9.5; Bước 0 H1 (step0:55, :215); REVIEW §3.1 | commit 5ecfb2dfd; scheduler.component.ts:285, 293–294; calendar.component.ts:315, 1160–1337 | Bước 0 đã duyệt tách "điều phối pipeline dời" (`SdCalendarMoveRunner`) trong commit `refactor(calendar)`. Commit 5ecfb2dfd chỉ tách định dạng, cấu hình, announcer, focus keeper, edge scroll; `#runMove`/`#commitMove` vẫn private trong calendar. Scheduler đã dựng state dời riêng: `#moving` lưu `{ id, event, saving }` trong khi calendar lưu `{ id, target, saving }`. `sd-scheduler.md` (bản CP2) đã ghi "reuses … the move pipeline of sd-calendar", hiện chưa đúng. | `git show --stat 5ecfb2dfd`; so tiêu đề commit với step0:215 | Tách runner (hook cho `resourceId`, `axis`, `droppable`, mở nhóm) bằng một commit `refactor(calendar)` trước checkpoint 4, spec calendar giữ xanh; chọn một dạng state chờ dùng chung (target hay event). Nếu không tách được, báo PD đổi H1 trước khi code checkpoint 4. |
| 2 | Nên sửa | TESTING §0.1 (RED trước, đỏ vì assert) | commit ccffde78f: scheduler.component.ts (957 dòng), .scss (925 dòng), .html (2 dòng stub) | Commit RED của CP2 đã chứa gần trọn logic component và SCSS; chỉ template bị stub. Commit xanh 86598cbc7 chỉ đổi 43 dòng TS (phần lớn là format, cộng một chỉnh `afterNextRender` của cuộn ngang). Chạy lại RED: 2 test xanh (`[SCH-C-02] calls onLoad with from, to, view…` vì `onLoad` chạy mà không cần DOM; `[SCH-SC-16]`, xem mục 3). 9 test đỏ vì `TypeError` (đọc `null`), không phải assert: SCH-SC-15, SCH-SC-24, SCH-C-01 ×2 (min/max, ‹ ›), SCH-C-17 ×2, SCH-U-06, SCH-U-07, SCH-C-04 (thu gọn). Commit xanh không sửa assert nào (chỉ format), nên test không bị nới. | Chép `src/` của ccffde78f, chạy spec component | Từ CP3: commit RED chỉ có stub (như CP1), báo cáo liệt kê test xanh ở RED. Trước khi đọc thuộc tính phần tử, assert `expect(el).withContext(…).not.toBeNull()` để test đỏ vì assert. Không cần viết lại lịch sử. |
| 3 | Nên sửa | SC-16; SCH-SC-16 | scheduler.component.spec.ts:276–283 | Test chỉ kiểm `SECRET` không có trong DOM. Nó xanh cả khi component không render gì (xanh ở RED CP2). Test không chứng minh nhánh lỗi đã chạy. | Xem mục 2 | Thêm assert dải `[data-band="load-error"]` có mặt và `loadErrors.length === 1` trước khi kiểm `SECRET`. |
| 4 | Nên sửa | §12 "Dữ liệu không hợp lệ: như calendar"; §16 "các trường hợp còn lại như calendar 18" (CAL-C-16); REVIEW mức "thiếu test cho nhánh phụ" | scheduler.component.ts:413–416, 506–537 | Code CP2 có các nhánh chưa test nào chạm: sự kiện ngày hỏng bị bỏ và cảnh báo (415–416, 511), cảnh báo `step` lạ (517), cảnh báo khoảng giờ làm hỏng của component và của từng tài nguyên (529). Coverage branches của component là 75.7%, ngưỡng R2 là 85%. | Coverage ở mục Lệnh | Thêm test (mã gần nhất: SCH-SC-01 cho ngày hỏng, SCH-C-13 cho giờ làm của tài nguyên). SC-27 (`selectedId` về null, dòng 585–589) đã có code nhưng chưa test; Bước 0 G.1 xếp ở CP3, giữ nguyên. |
| 5 | Nên sửa | REVIEW §3.1 (bản sao cùng thân), mức "code khó bảo trì"; Bước 0 H1 (step0:52) | scheduler.component.ts: 983–987, 952–956, 974–976, 545–554, 591–598, 585–589, 382–387, 100 + 825–826, 725–729 | Nhiều thân hàm của component chép gần nguyên từ calendar: `#report` (= calendar.component.ts:1727–1731; Bước 0 hứa gộp "cảnh báo dev một lần" vào lớp dùng chung), `#measureOnce` (= 1478–1482), `#rtl` (= 1502–1504), effect đồng hồ 60 giây (≈ 659–669), khối `ResizeObserver` (= 683–690), effect bỏ `selectedId` (= 677–681), vòng kiểm id/title sự kiện trong `invalid` (= 418–425), `PALETTE` và tách màu (= 104, 1581–1582), `#offDay` (≈ 1562–1563). Không phải pipeline, nhưng mỗi lần sửa calendar phải nhớ sửa hai nơi. | Đặt hai file cạnh nhau | Gộp các phần cùng thân vào `ɵ` của calendar (ví dụ một reporter, một bộ đo bề rộng host gồm `measureOnce` và `ResizeObserver`, một đồng hồ 60 giây, `ɵsdCalendarInvalidEvents`, `ɵsdCalendarColor`, `ɵsdCalendarIsOffDay`), cùng commit với mục 1. Phần nào giữ riêng thì ghi lý do trong báo cáo CP. |
| 6 | Ghi chú | scheduler.md §1 ("khoảng xem, xếp hàng nhiều ngày không viết lại"); Bước 0 câu 5 (step0:157) | scheduler.utils.ts:68–78, 153–157 | Nhánh tuần của `sdSchedulerVisibleDays` lặp nhánh tuần của `sdCalendarVisibleDays` (calendar.utils.ts:220–224); nhánh tháng lặp hai dòng đầu của `sdCalendarMonthWeeks` (205–206). `sdSchedulerColumnSpan` lặp phép tính from/to/clipped của `sdCalendarAllDayLayout` (calendar.utils.ts:301–304, 312). PD đã duyệt hàm khoảng xem riêng ở Bước 0, nên không chặn. | | Nhánh ngày/tuần có thể gọi `ɵsdCalendarVisibleDays({ …, hideWeekends: false })`; tách một helper "chỉ số cột của một khoảng ngày" dùng chung cho cả hai. |
| 7 | Ghi chú: cần PD chốt | H7; Bước 0 E.4 #1 (step0:332, :342) | scheduler.component.ts:298–299, 494–496, 677 | Khoá tải dùng bộ đếm `#generation` (mỗi mảng `resources` mới), không dùng tập `resourceIds` như Bước 0 viết. Mảng mới cùng id (chỉ đổi `title`, `group`, `workingHours`) cũng xoá lưới tới khi tải xong, gây nhấp nháy. H7 nói "đổi `resources`: xoá lưới". | Đổi `title` một tài nguyên bằng mảng mới | PD chốt: xoá theo tham chiếu (như hiện tại) hay theo tập id (giữ sự kiện và hiện thanh tiến trình khi id không đổi). |
| 8 | Ghi chú: cần PD chốt | §7 (biến kích thước trên `:host`); Bước 0 D.2, E.2 | scheduler.component.ts:958–972, 910–915; scheduler.utils.ts:18–19; scss:87–88, 299–308 | Kích thước đọc bằng `parseFloat` của biến CSS: consumer đặt `--sd-scheduler-hour-width: 5rem` thì ra 5 px, bậc nội dung khối và `scrollLeft` sai (calendar cũng làm vậy ở `#hourHeight`, calendar.component.ts:1498–1500). `ROW_MIN`/`LANE` cố định nên đổi `--sd-scheduler-row-min-height`, `--sd-scheduler-lane-height` chỉ đổi CSS, không đổi phép xếp lane. `#trackWidth` chép công thức `--sd-scheduler-track` của SCSS. Bước 0 định đo `offsetWidth` ô giờ. | | PD chốt các biến §7 có phải để consumer ghi đè không. Nếu có: đo bằng `offsetWidth` (ô giờ, rãnh hàng) thay cho `parseFloat`, và đưa pitch lane vào phép tính từ số đo. |
| 9 | Ghi chú: cần PD chốt | REVIEW §3.1 "liệt kê public API và so từng tên" | index.ts:11; scheduler.templates.ts:47 | Type public `SdSchedulerCellView` không có trong spec. Các type `SdScheduler*TemplateContext` cũng không có trong spec nhưng theo tiền lệ calendar (`calendar/index.ts:10–15`). | | Giữ (ghi vào bảng API của PR) hoặc viết thẳng `readonly Exclude<SdSchedulerView, 'day'>[]` vào input `views`. |
| 10 | Ghi chú: cần PD chốt | §14 "Vùng cuộn có `aria-label` = `ariaLabel`" | scheduler.component.html:89–94, 100 | Vùng cuộn không có `aria-label`; lưới bên trong mang "{ariaLabel}, {title}". Calendar cũng không đặt nhãn trên vùng cuộn. | Đọc DOM | PD chốt theo spec (nhãn trên vùng cuộn) hay theo calendar (nhãn trên lưới). |
| 11 | Ghi chú | TESTING §0.2, §0.3, §12 | scheduler.types.spec.ts:21, 37; scheduler.utils.spec.ts:61–63, 217, 233, 239; scheduler.component.spec.ts:151, 292, 381–386 | (a) Type test mang mã `[SCH-SC-09]`, `[SCH-SC-22]`; test hàm thuần mang `[SCH-C-04]`, `[SCH-C-06]`, `[SCH-C-10]`. Khi grep mã ở R2 các mã này trông như đã có test hành vi. (b) `SCH-U-04` xanh với stub RED (stub cho mọi khối lane 0); thêm `count === 1` để có nghĩa ở RED. Ở bản xanh test này vẫn bắt được thử phá `<` → `<=`. (c) Dòng 292 truy vấn class nội bộ `.sd-scheduler__body`. (d) Các test đổi `resources` sang tập con in cảnh báo thật (`client`, `training`, `tuesday`) ra log. | Log test | (a) Ghi rõ trong `reports/scheduler-tests.md` rằng các mã C/SC này còn cần test component ở CP3–CP4, hoặc đổi tên. (c) Dùng `[role="rowgroup"]:not(:first-child)` hay `data-*`. (d) `spyOn(console, 'warn')` trong các test đó. |
| 12 | Ghi chú | §8.4 bước 5; Bước 0 D.4 | scheduler.component.ts:401–422, 438–458 | Cho CP4: `#reading` thay sự kiện bằng bản đề xuất nên mất vị trí gốc, mà §8.4 bước 5 cần "hàng gốc giữ khung nét đứt ở lane cũ". `rows` là một `computed` lớn, đọc `#moving`, `#sizes`, `#width`; nếu đề xuất kéo được đọc trong `rows` thì mỗi lần đích đổi sẽ dựng lại 150 hàng. | | Giữ placement gốc khi đang chờ; để `#drag` ngoài `rows` như Bước 0 D.4 (một lớp kéo cho cả component). |
| 13 | Ghi chú: cần PD chốt | §19 câu 4; H6; TESTING §10 | commit 86598cbc7 (message) | Số đo 122–191 ms (dev server, Tháng 150 × 31 × 3) vượt 100 ms của §19 câu 4. Chưa có số production (Bước 0 B.4 nói production là số chính), và khối chưa có `cdkDrag`. | | PD chốt H6 (cách 3–4) trước CP4; đo lại bản production sau CP4. |
| 14 | Ghi chú | §7 "Tháng: … chấm 4px cho ngày lễ `observance`" | scheduler.component.html:129–131 | Chấm ngày lễ cũng vẽ ở Tuần; spec chỉ nêu cho Tháng. | Tuần có ngày lễ `observance` | Ghi là lệch có chủ đích, hoặc chỉ vẽ ở Tháng. |
| 15 | Ghi chú | §6 cuộn ban đầu | scheduler.component.ts:556–577 | Ở Tuần/Tháng, ‹ › giữ `scrollLeft` cũ (chỉ reset khi vào chế độ). Sang tháng sau sẽ mở ở cùng độ lệch ngang. Spec chỉ nói cuộn ban đầu. | Tháng 11 cuộn tới ngày 9, bấm › | PD chốt có reset `scrollLeft` khi khoảng đổi mà hôm nay không nằm trong khoảng hay không. |
| 16 | Ghi chú | Kiểm commit refactor | calendar-edge-scroll.ts:48–53; calendar.component.ts:1045 | Thứ tự trong vòng rAF đổi nhẹ: trước kia kiểm `#dragSession` rồi mới cuộn, giờ cuộn rồi `onFrame` mới kiểm. Không đổi hành vi vì `#stopEdgeScroll()` huỷ khung trước khi `#dragSession = null` (calendar.component.ts:1045–1049). Ghi để scheduler giữ cùng thứ tự đó ở CP4. | | Không cần sửa. |

## Checklist (phạm vi R1)

### 1. Public API (`components/scheduler/index.ts`) so với `scheduler.md` §2–§4 và Bước 0
| Tên | Thực tế | Spec | Kết quả |
| --- | --- | --- | --- |
| `SdScheduler<T, R>` | component standalone, OnPush (component.ts:202–211) | §0 | ✓ |
| `option` | `input.required<SdSchedulerOption<T, R>>()` (222) | §4.1 | ✓ |
| `resources` | `input.required<readonly SdSchedulerResource<R>[]>()` (224) | §4.1 | ✓ |
| `view` | `model<SdSchedulerView>('day')` (226) | `'day'`, `model()` | ✓ |
| `views` | `input<readonly SdSchedulerView[]>(['day','week','month'])` (232) | ✓ | ✓; rỗng → mọi chế độ (332) |
| `resourceLabel` | `input<string \| null \| undefined>`, mặc định i18n `resources` (234, 314) | ✓ | ✓ |
| `date`, `selectedId` | `model<SdCalendarDateInput \| null \| undefined>(undefined)`, `model<string \| null>(null)` (228–230) | như calendar | ✓ cùng kiểu calendar.component.ts:248–250 |
| `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`, `maxDate`, `scrollTime`, `dimPast`, `transform`, `disabled`, `readonly`, `ariaLabel`, `autoId` | 236–262 | như calendar 4.1 | ✓ cùng tên, kiểu, transform (so calendar.component.ts:254–282); ưu tiên input → `SD_CALENDAR_CONFIGURATION` → mặc định qua `ɵsdCalendarResolve*` |
| Output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, `sdLoadError`, `sdCellSelect` | 265–275 | §4.2 | ✓ payload đúng type |
| `reload()` | 609–611 | §4.3 | ✓ |
| `move()` | chưa có | §4.3 | N/A (CP4) |
| Model `SdSchedulerView`, `SdSchedulerMoveAxis`, `SdSchedulerResource`, `SdSchedulerEvent`, `SdSchedulerRange`, `SdSchedulerVisibleRange`, `SdSchedulerLoadArgs`, `SdSchedulerCreateContext`, `SdSchedulerCreateArgs`, `SdSchedulerDropContext`, `SdSchedulerMoveRequest`, `SdSchedulerMoveError`, `SdSchedulerCellSelect`, `SdSchedulerOption` | scheduler.model.ts | §3 | ✓ từng trường, `readonly`, optional, generic khớp |
| Type calendar (`SdCalendarState`, `…WorkingHours`, `…MoveSource`, `…MoveScope`) | `import type`, không re-export | §2, Bước 0 câu 1 | ✓ (exports.spec kiểm) |
| 4 directive, selector, context, `ngTemplateContextGuard` | scheduler.templates.ts | §8.5 | ✓; `views` của template ô mặc định `['week','month']`, type không nhận `'day'` |
| Context type `SdScheduler*TemplateContext`, `SdSchedulerCellView` | index.ts:9–15 | không nêu | Ghi chú 9 |
| `SD_CALENDAR_CONFIGURATION` dùng chung, không token riêng | component.ts:214 | §2 | ✓ |
| `data-autoid` | `components-scheduler-{autoId}`, con `…-resource-`, `…-event-`, `…-today` … với `encodeURIComponent` | §15, SC-38 | ✓ |
| i18n `core.component.scheduler.*` | 14 key của §14 + `open-day` (H8 đã duyệt), đủ 5 locale | §14 | ✓ |
| Barrel `components/index.ts` | thêm `export *` scheduler (ea6ae27d4) | §1 | ✓ |

### 2. Hợp đồng chung áp dụng ở CP1–CP2
| SC | Kết quả | Ghi |
| --- | --- | --- |
| 01 | ✓ | Tài nguyên trùng/rỗng id, `title` rỗng, sự kiện trùng id → `sd-data-state` (component.ts:369–389); `resourceId` lạ → bỏ, cảnh báo một lần (409–412, 509). Có test. |
| 02, 03 | ✓ | Không sửa input: sort trên bản sao, `Set` mới, mảng mới. Test đóng băng sâu (SCH-SC-03). Phần dời: CP4. |
| 04, 05, 07 | ✓ | Không `get*`/`with*`; cờ dùng `SdCalendarState`; `movable` chỉ đánh giá khi có `option.move` (848, 864). |
| 15 (phần tải) | ✓ | Abort khi đổi khoảng, `resources`, `option`, `reload()`, destroy; kết quả muộn bị bỏ (loader dùng chung). Có test. Phần dời: CP4. |
| 16 (phần tải) | ✓ code / test yếu | Mục 3. |
| 22, 23, 24 | ✓ | `onLoad` nhận `signal`, mảng hoặc Promise; `reload()` giữ dữ liệu; lỗi → dải, Thử lại, `sdLoadError`; abort không phát. Có test. |
| 27 | ✓ code, chưa test | Effect 585–589; test ở CP3 (mục 4). |
| 32 | ✓ code | `ResizeObserver` trên host, guard `typeof` (591–598). Test ở CP5. |
| 33 | ✓ | Một `role="status" aria-live="polite" aria-atomic="true"` (html:82). Có test. |
| 37 | ✓ | Spec parity 5 locale (scheduler.i18n.spec.ts). |
| 38 | ✓ | Có test, có id mã hoá. |
| 39 | ✓ | `booleanAttribute`; `string \| null \| undefined`. |
| 40 | ✓ | Standalone, OnPush, signal API, `@for` track theo id/khoá. |
| 41 | ✓ | Ngày qua `SdDateTimeService` và hàm `ɵ`; `getHours()` chỉ trên carrier `#now` (323), như calendar. Không `new Date(string)`. |
| 42, 43 | ✓ | Không dependency mới; SCSS không hex ngoài fallback, không `!important`, `::ng-deep`. |
| 44 | ✓ | Không phần tử theo slot; 24 ô trục giờ theo §7; dải ngoài giờ là một phần tử mỗi đoạn (như calendar). |
| 45 | ✓ | Có `why:` ở các quyết định chính. |
| 06, 08–14, 17–21, 26, 28–31, 34–36 | N/A | CP3–CP5. |
| 25 | N/A | Scheduler không có `items`. |

### 3. Cấu trúc state
- [x] Effect không ghi signal mà nó đọc theo cách gây vòng. Effect tải (480–504) ghi `#collapsed`, loader, `#now`, `#moving` trong `untracked`; `#now` mới không đổi `today` nên không chạy lại. Effect `selectedId` (585–589) ghi null rồi dừng. Effect `disabled`/`readonly` (539–542) ghi trong `untracked`.
- [x] Không gọi API trong `computed`. `movable` (predicate của consumer) chạy trong `rows` là đúng SC-06 (đánh giá khi render), như calendar.
- [x] Không `setTimeout` chờ render; dùng `afterNextRender` với injector (564, 582).
- [x] Dọn khi destroy: loader, operation, `ResizeObserver`, timer (600–605). `afterNextRender` gắn injector của component.
- [x] Khoá tải gồm `resources` (H7): `${rangeKey}|${generation}` (677). Xem Ghi chú 7 về id so với tham chiếu.
- [x] Nhóm (§10): `#collapsed` là `signal<ReadonlySet<string>>`, giữ qua khoảng và chế độ, bỏ nhóm không còn khi `resources` mới (690–695), mất khi huỷ; nhóm thu gọn vẫn có trong `resourceIds`. Có test.
- [x] `sdRangeChange` không phát khi chỉ `resources` đổi (khoá khoảng, 487–491). Có test.
- [ ] Pipeline dời dùng chung: chưa có (mục 1).

### 4. Không bản sao hàm thuần/pipeline của calendar
- [x] Hàm thuần lấy từ `ɵ` của calendar (đọc ngày giờ, ghi ngày giờ, giờ làm, ngày lễ, tiêu đề, cộng ngày). `scheduler.utils.ts` chỉ có lane, chiều cao hàng, toạ độ ngang, cột, hàng kế, kéo mép theo ngày, nhóm, hit test. Có trùng nhỏ (Ghi chú 6).
- [ ] Phần khung component chép từ calendar (mục 5); pipeline dời chưa tách (mục 1).

### 5. Commit refactor calendar (5ecfb2dfd)
- [x] API public: `calendar/index.ts` chỉ thêm 27 export, đều có tiền tố `ɵ` (dưới dòng `@internal`); không đổi type public.
- [x] DOM: không đổi `calendar.component.html`, `.scss`.
- [x] Hành vi: tiêu đề (`sdCalendarTitle` cùng nhánh month/day/week/range), announcer (NBSP R1-G9), focus keeper (cùng selector và kiểm thanh phạm vi), edge scroll (Ghi chú 16), cấu hình, helper nhỏ: đọc diff, cùng logic.
- [x] Spec calendar: chỉ thêm (`calendar.shared.spec.ts` +199, `calendar.exports.spec.ts` +16), không xoá test; 181 xanh.
- [x] Helper test chung (H9): `configureScheduleTesting`, `createWith`, `q`, `qa`, `text` trong `testing/schedule-testing.ts`; không vào `testing/index.ts`, không có `ng-package.json` (không public).

## Test RED
| Commit | Kết quả chạy lại | Đánh giá |
| --- | --- | --- |
| ea6ae27d4 (CP1) | 13 đỏ, 4 xanh. Đỏ: SCH-U-01, -02, -03, -05, -06, -07, -08, -09, -10, SCH-C-18, và 3 test hàm thuần mã C (-04, -06, -10). Mọi đỏ là assert (`Expected 0 to be 1`, `Expected null to equal …`). Xanh: 3 type test (chỉ cần biên dịch, đúng TESTING §3.7) và SCH-U-04 (Ghi chú 11b). SCH-SC-37 (i18n) đỏ ở RED vì chưa có key (đọc code; không tái hiện vì phải đổi 5 file i18n). | ✓ đúng lý do. Stub trả rỗng, như Bước 0 C.3. |
| ccffde78f (CP2) | 26 đỏ, 2 xanh. 9 đỏ vì `TypeError`. | Mục 2, 3. |
| Commit xanh e0d6aa1b9, 86598cbc7 | Diff spec chỉ là format (prettier), không đổi assert. | ✓ không nới test. |

Mã test theo TESTING §6 có ở CP1–CP2: SCH-U-01…10 (đủ), SCH-C-01, -02, -03, -04, -12, -13 (phần tô), -16 (phần CP2), -17, -18; SCH-SC-01, -03, -15 (phần tải), -16, -22, -23, -24, -33, -37, -38. Khớp danh sách CP1–CP2 của Bước 0 G.1. Không có `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()` trong `components/scheduler/**`.

## Thử phá
Không làm ở R1 (thuộc R2, REVIEW §3.3).
