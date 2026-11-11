# sd-scheduler · Bước 0 (G0)

Trạng thái: **chỉ Bước 0, chờ PD duyệt**. PR 1 `feat/calendar` (draft #141) chưa merge. Nhánh `feat/scheduler` hiện chỉ có commit tài liệu này, cắt từ `feat/calendar` (`3c769ca1`) để có code calendar khi đọc; khi #141 merge sẽ cắt lại từ `main` (H11). Chưa có code scheduler. Mọi trích dẫn code dưới đây là của nhánh `feat/calendar` (worktree `calendar-scheduler-kanban-063e68`) và `feat/kanban-api` (worktree `kanban-api`), đọc qua thư mục, chưa phải `main`. **Đối chiếu lại toàn bộ sau khi calendar merge** (câu 5).

Viết tắt đường dẫn:
- `CAL/` = `versions/v19/projects/sdcorejs-angular/components/calendar/` (feat/calendar)
- `LIB/` = `versions/v19/projects/sdcorejs-angular/` (feat/calendar)
- `KAN/` = `versions/v19/projects/sdcorejs-angular/components/kanban/` (feat/kanban-api)
- `CDK` = `versions/v19/node_modules/@angular/cdk/fesm2022/drag-drop.mjs` (`@angular/cdk@19.2.19`)

Đã đọc: `schedule-kanban/{PROMPT,SHARED-CONTRACT,TESTING,REVIEW}.md`, `design-scheduler/{PROMPT,README,scheduler}.md` (HTML chỉ lướt mục 08–09: tên API, D1–D10), `design-calendar/{calendar,ADDENDUM-2026-11-08}.md`, hai báo cáo mẫu `calendar-step0.md`, `kanban-step0.md`; code `CAL/**` (model, configuration, utils, `calendar-move.ts`, `calendar-loader.ts`, templates, `index.ts`, component, `calendar.testing.ts`), `LIB/testing/schedule-testing.ts`, `components/file-explorer` (model), `KAN/src/kanban.model.ts`, `services/date-time`, `components/avatar`, `_component-tokens.scss`, `THEME.md`, `i18n/src/vi.ts`, showcase (`playwright.config.ts`, `package.json`, `e2e/components/calendar.e2e.ts`, `documentation.registry.ts` và spec đếm), `scripts/check-version-sync.mjs`, `CDK` (`_pointerMove`, `_getConstrainedPointerPosition`).

---

## A. Mâu thuẫn giữa các nguồn và điểm cần PD chốt

| # | Điểm | Nguồn | Đề xuất |
| --- | --- | --- | --- |
| S1 | `move()` có chạy `droppable` không | `scheduler.md` §4.3: "Không chạy `droppable`". `SHARED-CONTRACT` SC-08: `droppable` chạy "ngay trước `onMove`"; `TESTING` §4 dòng SC-08: "không gọi `onMove` … khi `move()`"; REVIEW §3.3 "Thử phá" 3 bỏ đánh giá lại `droppable` phải có test đỏ. Kanban đã chạy `droppable` cho mọi nguồn (`KAN/src/kanban.component.ts:401-403`). | Theo SC-08 (hợp đồng chung ưu tiên hơn spec riêng): `move()` cũng đánh giá `droppable` cho đích, false → trả `false`, đọc `drop-blocked`. Hệ quả: "Hoàn tác" (SC-18) về chỗ cũ sẽ thất bại nếu `droppable` từ chối chỗ cũ; ghi trong `sd-scheduler.md`. |
| S2 | `Alt` + `↑` `↓` với nhóm thu gọn | `scheduler.md` §16 và `TESTING` SCH-U-09: hàng kế "bỏ qua … nhóm thu gọn". `TESTING` SCH-E-05: "Thu gọn nhóm Tầng 5, `Alt` + `↓` từ Tầng 3 → Nhóm mở, khối sang hàng đầu của Tầng 5". `design-scheduler/PROMPT.md` kiểm tra tay: "nhóm thu gọn rồi dời bằng `Alt` + `↑` `↓` vào nhóm đó". §9.5 bước 6 "mở nhóm". | Theo SCH-E-05 và PROMPT: `Alt` + `↑` `↓` coi tài nguyên trong nhóm thu gọn là ứng viên (bỏ hàng nhóm và hàng `droppable` false); đích ở nhóm thu gọn → sau khi chấp nhận thì mở nhóm. SCH-U-09 viết theo quy tắc này. Con trỏ lưới (`↑` `↓` không `Alt`) thì dừng ở hàng nhóm đang thu gọn, bỏ qua hàng nhóm đang mở (§9.7 đoạn cuối). |
| S3 | Con trỏ `↑` `↓` | §9.7 bảng: "bỏ qua hàng nhóm và nhóm thu gọn"; §9.7 đoạn cuối: "nhóm đang thu gọn thì `↑` `↓` dừng ở hàng nhóm và `Alt` + `Enter` mở lại". | Như S2: dừng ở hàng nhóm thu gọn (để còn mở lại được), bỏ qua hàng nhóm đang mở. |
| S4 | Live region | §7 "dải lỗi, dải thất bại như calendar 7" (calendar 7 có `role="alert"`); SC-33 một vùng `role="status"`. | Như Q2 đã chốt cho calendar: một vùng `role="status"`, dải là chữ thường. |
| S5 | Nút thanh công cụ | Như calendar 7. | Như Q4 đã chốt cho calendar: nút native trong template, style bằng token. |
| S6 | Node | `design-scheduler/PROMPT.md` ghi `22.22.3`; `AGENTS.md` và CI `24.22.1`. | Như Q1 của calendar: CI `24.22.1` là chuẩn; local ghi rõ phiên bản trong báo cáo. |
| S7 | Tiêu đề Ngày | §6 ví dụ "Thứ Hai, **09** tháng 11, 2026"; hàm của calendar truyền `day: anchor.day` là số (`CAL/src/calendar.component.ts:468-474`) nên ra "Thứ Hai, **9** tháng 11, 2026". §6 cũng nói "Định dạng tiêu đề lấy từ hàm của calendar". | Dùng hàm của calendar (ra "9"). Ghi là lệch nhỏ có chủ đích. |
| S8 | Thứ tự checkpoint | §18: i18n 5 locale ở checkpoint 6; render ở checkpoint 2 đã cần chữ. | i18n đủ 5 locale ở checkpoint 1 (như calendar), để spec parity chạy từ đầu. |

Các điểm khác cần chốt (không phải mâu thuẫn giữa nguồn, mà là lựa chọn cài đặt) ở mục "Câu hỏi cho PD" cuối file.

---

## B. Năm câu hỏi ở mục 19 của `scheduler.md`

### Câu 1. Dùng chung code với calendar: export từ `components/calendar` hay entry point nội bộ?

**Đề xuất: export `ɵ` từ entry point calendar, không tạo entry point nội bộ.** Calendar đã làm phần lớn việc này trong PR #141.

Đã có (bằng chứng):
- `CAL/index.ts:16` ghi `// @internal Pipeline pieces and pure helpers shared with sd-scheduler. Not covered by SemVer.`, rồi export có tiền tố `ɵ`:
  - `ɵSdCalendarLoader`, `ɵSdCalendarLoadPhase` (`CAL/index.ts:17`; lớp ở `CAL/src/calendar-loader.ts:9-59`): vòng đời `onLoad`, abort, kết quả muộn, `loading`/`reloading`/`error`.
  - `ɵSdCalendarOperation`, `ɵsdCalendarAllows`, `ɵsdCalendarCallMove`, `ɵSdCalendarMoveOutcome` (`CAL/index.ts:18-23`; `CAL/src/calendar-move.ts:16-70`): một thao tác chờ (SC-14), đánh giá cờ (SC-05/06), gọi `onMove` và phân loại 5 kết quả (SC-09…13, SC-15).
  - 32 hàm thuần, hằng `ɵSD_CALENDAR_STEPS` và 9 type (`CAL/index.ts:24-69`): khoảng xem, cộng ngày/tháng, thứ, làm tròn (`ɵsdCalendarSlot`, `ɵsdCalendarSweep`, `ɵsdCalendarSnapMove`, `ɵsdCalendarResizeEnd`, `ɵsdCalendarMoveStep`), đọc ngày giờ (`ɵsdCalendarPlace`, `ɵsdCalendarReadDay`, `ɵsdCalendarReadWallClock`), ghi (`ɵsdCalendarSerialize`, `ɵsdCalendarRangeOf`), giờ làm (`ɵsdCalendarWorkingRanges`, `ɵsdCalendarOffSegments`).
  - `ɵSD_CALENDAR_DEFAULTS` (`CAL/src/calendar.configuration.ts:25-32`, export qua `CAL/index.ts:2`).
- Tiền lệ trong repo: `forms/models` export `ɵsdNormalizeCalendarDay` cho entry khác dùng (`CAL/src/calendar.utils.ts:1`).
- Test CAL-C-23 khoá các export này (`CAL/src/calendar.exports.spec.ts:15-53`).

Còn thiếu (đang nằm private trong component calendar). Scheduler cần đúng các phần này; viết lại sẽ là "bản sao hàm cùng thân" mà REVIEW §3.1 (dòng 31) bắt:

| Phần | Vị trí hiện tại | Đề xuất |
| --- | --- | --- |
| Định dạng tiêu đề, tên thứ dài, chữ ngày, nhãn nút ‹ › | `#formats`, `title` (`CAL/src/calendar.component.ts:440-491`), `#navLabel`, `#weekdayLong`, `#dateText` (`:1633-1660`) | Tách sang `CAL/src/calendar-format.ts`: hàm thuần nhận `t`, `locale`, `language`. Export `ɵ`. §6 yêu cầu "Định dạng tiêu đề lấy từ hàm của calendar". |
| Thông báo live region (cùng chữ hai lần thì thêm NBSP để được đọc lại, R1-G9), cảnh báo dev một lần | `#announce` (`:1623-1626`), `#report` (`:1830`) | Gộp vào lớp nhỏ `SdCalendarAnnouncer` (`calendar-move.ts` hoặc file riêng). Export `ɵ`. |
| Giải cấu hình input → `SD_CALENDAR_CONFIGURATION` → mặc định; ngày neo; `minDate`/`maxDate` | `stepValue`, `#firstDayOfWeek`, `#workingHours`, `#holidays` (`:367-387`), `#anchor` (`:392-395`), `#boundDay` (`:1628-1631`) | Hàm thuần `sdCalendarResolveConfig(inputs, configuration, clock)` và `sdCalendarBoundDay` trong `calendar.utils.ts`. Export `ɵ`. §4.1 yêu cầu "cùng thứ tự ưu tiên input → `SD_CALENDAR_CONFIGURATION` → mặc định". |
| Helper nhỏ | `daysBetween` (`calendar.utils.ts:185-189`, private), `rangeKey`, `sameRange`, `sameList`, `carrierDay`, `utcDay`, `targetOf`, `lastDayOf`, `pointOf`, `cssEscape` (`calendar.component.ts:1848-1908`), type `SdCalendarTarget` (`:112-118`) | Chuyển vào `calendar.utils.ts`, export `ɵ`. |
| Điều phối pipeline dời | `#runMove`, `#commitMove`, `#abortMove`, `#restoreFocus`, `#focusPending` (`calendar.component.ts:1207-1320`, `1384-1394`, `1513-1537`) | Tách lớp `SdCalendarMoveRunner` vào `calendar-move.ts`, nhận hook (tìm sự kiện, serialize, kiểm tra đích, hỏi phạm vi, áp kết quả, thông báo, focus). Calendar dùng lại lớp này; scheduler thêm bước `resourceId`/`axis`/`droppable`/mở nhóm qua hook. Export `ɵ`. |
| Tự cuộn khi kéo | `#edgeScroll`, `#stopEdgeScroll` (`calendar.component.ts:1463-1488`), chỉ trục dọc | Tách `SdCalendarEdgeScroller` hai trục (`calendar-edge-scroll.ts`); calendar dùng trục dọc, scheduler hai trục. Export `ɵ`. |

Cách làm: một commit `refactor(calendar): …` đầu PR scheduler (checkpoint 1), không đổi API public, không đổi DOM, toàn bộ spec calendar giữ nguyên và xanh; CAL-C-23 thêm các export mới. Thời điểm làm là câu hỏi H1 cho PD (làm ở PR scheduler, hay sửa PR #141 trước khi merge).

Không tách được (là template và SCSS, không phải hàm): thanh công cụ và dải lỗi/thất bại (`CAL/src/calendar.component.html:16-80`), live region và hướng dẫn ẩn (`:103-105`), thanh hỏi phạm vi (`:106-136`), cùng SCSS tương ứng. Đề xuất chép markup và SCSS sang scheduler với class `sd-scheduler__*` (H2 cho PD).

Ảnh hưởng ng-packagr:
- Entry mới `components/scheduler/ng-package.json` giống calendar (`CAL/ng-package.json:1-6`: `$schema` + `lib.entryFile: "index.ts"`).
- ng-packagr dựng entry phụ theo đồ thị import: scheduler import `@sdcorejs/angular/components/calendar` nên calendar dựng trước. Không có vòng (câu 3).
- Calendar không cần `ng-package.json` mới; chỉ thêm file trong `src/` và dòng export trong `index.ts`.
- Barrel `LIB/components/index.ts:35` đang `export *` từ calendar. Thêm `export * from '@sdcorejs/angular/components/scheduler'`. Vì cả hai cùng `export *`, **scheduler không được re-export type của calendar** (sẽ trùng tên, TS báo lỗi ở barrel). Consumer import `SdCalendarState`… từ calendar, đúng như §3.

Ảnh hưởng `check:sync`:
- `scripts/check-version-sync.mjs:13`: `syncedRoots = ['projects/sdcorejs-angular']`. Thư mục `components/scheduler/**` và các file calendar sửa thêm nằm trong root này, nên `npm run sync` tự chép sang v20/v21/v22, không cần sửa script.
- Biến đổi v22 `applyAngular22EagerMigration` chỉ thêm `ChangeDetectionStrategy.Eager` cho `@Component` chưa khai báo `changeDetection` (`check-version-sync.mjs:395-406`). Component scheduler khai báo `OnPush` nên không bị đổi; host component trong spec (nếu không khai báo) được biến đổi tự động như mọi spec khác.
- Showcase không thuộc `syncedRoots` (`check-version-sync.mjs:10-13`), sửa showcase không ảnh hưởng `check:sync`.
- Bộ nhớ dự án ghi: sau `npm run sync`, nhiều file v22 hiện `M` với diff rỗng (EOL); `git checkout` các file đó trước khi commit.
- Release contract (`scripts/release-contracts/<suffix>.json`) sẽ thấy entry mới (file, export) khi dựng snapshot cho release kế tiếp từ artifact CI. Việc của release, không thuộc PR này.

### Câu 2. `move.droppable` và `move.axis` đã có khái niệm tương đương chưa?

Không có tên public nào khác cho hai khái niệm này. Không đề xuất đổi tên.

| Khái niệm | Đã có trong repo | Kết luận |
| --- | --- | --- |
| Kiểm tra đích (`droppable`) | sd-file-explorer **không** có `droppable`: đích nằm trong context của `movable` (`move.movable?: SdFileExplorerState<SdFileExplorerMoveRequest<T>>`, `components/file-explorer/src/file-explorer.model.ts:299-301`; request có `targetFolder`, `:438-444`). sd-calendar: `movable` nhận sự kiện, không có đích (`CAL/src/calendar.model.ts:128-136`). sd-kanban (feat/kanban-api): `move.droppable?: SdKanbanState<SdKanbanDropContext<T>>` (`KAN/src/kanban.model.ts:93-97`), context `{ card, from, to }` (`:52-56`). SC-07/SC-08 đặt tên `droppable` cho cả ba. | Giữ `droppable` (tên của hợp đồng chung, trùng kanban). Không gộp vào `movable` như file-explorer, vì `movable` phải đánh giá khi render (vẽ tay nắm) lúc chưa có đích. Khác kanban ở context (`{ event, to, resource }` so với `{ card, from, to }`) là do spec; RX sẽ thấy khác biệt này và nó có trong spec. |
| Khoá trục (`axis`) | Không component nào có input/option khoá trục. CDK dùng `'x' \| 'y'` qua `cdkDragLockAxis` (`components/upload-file/src/upload-file.component.html:289`) và `cdkDropListLockAxis` (`components/tab-router/.../tab-router-nav.component.html:16`, `components/table/.../config.component.html:83`). | Giữ `axis: 'both' \| 'time' \| 'resource'` như spec. Không dùng `'x' \| 'y'`: tên theo nghĩa nghiệp vụ, không lộ CDK, và không đảo nghĩa ở RTL. |

### Câu 3. Import type từ calendar có tạo vòng hoặc kéo theo component calendar không?

- **Không có vòng.** Calendar import `@angular/cdk/drag-drop`, `components/data-state`, `forms/models`, `forms/time`, `forms/time-range` (type), `i18n`, `modules/icon`, `services/date-time` (`CAL/src/calendar.component.ts:1-87`, `CAL/src/calendar.utils.ts:1-3`, `CAL/src/calendar.model.ts:1-2`). Không có import nào về scheduler. Hướng phụ thuộc chỉ một chiều: scheduler → calendar.
- **Type**: `import type` bị xoá khi biên dịch, không vào bundle.
- **Runtime**: scheduler cần `SD_CALENDAR_CONFIGURATION`, `ɵSD_CALENDAR_DEFAULTS`, các hàm `ɵ`, `ɵSdCalendarLoader`, `ɵSdCalendarOperation`. Chúng nằm trong cùng file FESM của entry calendar với lớp `SdCalendar`. Package khai `sideEffects` chỉ cho CSS/SCSS và hai FESM khác (`LIB/package.json:68-73`), nên FESM calendar được coi là không có side effect và bundler của app (esbuild của Angular CLI) bỏ được lớp `SdCalendar` khi không ai dùng. **Chưa đo.** Cách kiểm ở checkpoint 6: build showcase production, mở chunk lazy của trang Scheduler và các chunk nó import tĩnh, tìm định nghĩa component calendar (`"sd-calendar"` trong `selectors`). Có thì báo, kèm phương án dưới.
- Phương án dự phòng (chỉ khi đo thấy bị kéo theo): tách các phần dùng chung sang entry nội bộ `@sdcorejs/angular/components/calendar/core` (model, configuration, utils, loader, move). `components/calendar` re-export nguyên phần public, nên tên import của consumer và của §3 không đổi. Cần thêm một `ng-package.json`; `check:sync` vẫn không đổi (cùng root).

### Câu 4. Đo render 150 tài nguyên × 31 ngày × 3 sự kiện

Scheduler chưa có code nên **chưa đo được**. Cam kết: **đo ngay khi checkpoint 2 có render, trước khi làm checkpoint 3.** Kết quả và quyết định ghi vào báo cáo checkpoint 2 (trước R1).

Cách đo (giống kanban, `kanban-tests.md` mục Hiệu năng):
- Kịch bản: chế độ Tháng của một tháng 31 ngày (12/2026; hôm nay 09/11/2026 thuộc tháng 30 ngày), 150 tài nguyên trong 10 nhóm, 3 sự kiện mỗi tài nguyên (2 có giờ, 1 thanh nhiều ngày), dữ liệu client (`onLoad` trả mảng đồng bộ) để chỉ đo render.
- Một nút "150 tài nguyên × 31 ngày" trong ví dụ Đặt phòng của showcase (H5 cho PD). Render đo trong trang: `performance.now()` lúc bấm, rồi `requestAnimationFrame` rồi `setTimeout(0)` (hết khung hình đầu đã vẽ), lấy hiệu. 5 lần, trung vị.
- Kéo: `PerformanceObserver({ type: 'longtask' })` trong một lần kéo đổi hàng và giờ.
- **Bản production** (`ng build showcase --configuration production`, server tĩnh) là số chính; dev server ghi để tham khảo. Máy local Windows, ghi rõ không phải máy CI.
- Ngân sách: `scheduler.md` §19 câu 4 là **100 ms** cho render đầu (ngưỡng để đề xuất giảm trước khi làm tiếp); `TESTING` §10 là 250 ms render đầu, kéo không có long task > 50 ms (ngưỡng nghiệm thu).

Ước lượng DOM theo thiết kế (Tháng, không có template ô):

| Phần | Phần tử | Ghi chú |
| --- | --- | --- |
| Trục ngày (31 cột) | ~95 | ô, thứ, vòng số; chấm ngày lễ khi có |
| Ô góc, thanh công cụ, dải, live region, hướng dẫn ẩn, con trỏ, vạch giờ | ~40 | |
| Hàng nhóm (10) | ~40 | nút, icon, nhãn, số đếm |
| Cột tài nguyên (150 ô) | ~900 | ô, khung icon, `sd-icon`, tên, mô tả (avatar: `sd-avatar`) |
| Rãnh hàng (150) | ~150 | một phần tử mỗi hàng; vạch cột, cuối tuần, ngày lễ, ngoài giờ vẽ bằng gradient (SC-44) |
| Khối sự kiện (450) | ~2.250 | khối (`cdkDrag`), chấm, tên, giờ, tay nắm mép phải |
| Lớp kéo (khối đề xuất, lớp phủ hàng, nhãn nổi) | 3–5 | chỉ khi kéo; một bộ cho cả component, không theo hàng |
| **Tổng** | **~3.500** | Không có phần tử theo slot. |

Instance Angular: 450 `CdkDrag`, 150 `sd-icon` hoặc `sd-avatar`, `NgTemplateOutlet` khi có template.

Ước lượng thời gian (thô, chưa đo): calendar Tuần 500 sự kiện (~2.500 phần tử khối) đo 157–224 ms trên dev build (`calendar-tests.md` mục Hiệu năng); kanban 800 thẻ có template nặng 830–1.400 ms (`kanban-tests.md`, phần lớn do template của ví dụ). Scheduler có số khối gần calendar cộng 150 ô tài nguyên, nên dự đoán **150–300 ms dev, 100–200 ms production: nhiều khả năng vượt 100 ms**.

Cách giảm đã chuẩn bị (không đổi API, không virtual scroll; làm theo thứ tự, đo lại sau mỗi bước):
1. **Mô hình hiển thị tính sẵn trong `computed`**: chuỗi style, nhãn, `data-autoid`, cờ `movable` có sẵn trong view model; template không gọi method theo khối; `@for … track id`. (Bài học của kanban, `kanban-tests.md` "Đã làm".) Làm ngay từ đầu.
2. **Một listener cho cả lưới**: `pointerdown`, `click`, `keydown`, `dblclick` gắn trên rãnh lưới, tìm khối bằng `closest('[data-event-id]')`; không gắn listener theo khối. Làm ngay từ đầu.
3. **Không tạo `CdkDrag` cho từng khối**: dùng service `DragDrop.createDrag(element)` của `@angular/cdk/drag-drop` khi `pointerdown` trên khối (sự kiện `pointerdown` đến trước `mousedown`/`touchstart` tương thích, nên `DragRef` kịp nhận lần nhấn đó), huỷ `DragRef` khi thả. Giảm 450 instance còn 1. Vẫn là CDK (SC-42). **Cần thử** trên Chromium, Firefox, WebKit, cảm ứng; chỉ làm khi bước 1–2 chưa đủ (H6).
4. **`content-visibility: auto`** + `contain-intrinsic-block-size` (biết trước chiều cao hàng) trên từng hàng: bỏ style, layout, paint của hàng ngoài màn hình. Cần kiểm phần dính trái trong hàng, `getBoundingClientRect` khi kéo, in. Chỉ làm khi cần (H6).
5. Nếu vẫn vượt 250 ms: báo ở R1 kèm số đo và trace, không tự thêm virtual scroll (`TESTING` §10).

Cũng đo thêm (ghi để PD biết): ví dụ Chấm công dùng template ô sẽ vẽ 150 × 31 = 4.650 `gridcell` có template của consumer, nặng hơn kịch bản trên. Đây là hành vi theo spec (§8.5), không phải slot thời gian.

### Câu 5. Đối chiếu tên mục 2 và mục 4 với code calendar hiện tại

Đối chiếu với **feat/calendar** (chưa phải `main`). **Sẽ kiểm lại sau khi calendar merge**, ghi kết quả vào báo cáo checkpoint 1.

| Tên trong `scheduler.md` | Code calendar | Kết quả |
| --- | --- | --- |
| `SdCalendarOption` (mẫu cho `SdSchedulerOption`) | `CAL/src/calendar.model.ts:107-137` | ✓ |
| `SdCalendarEvent<T>` (`id`, `title`, `start`, `end`, `allDay`, `color`, `occurrence`, `data`) | `:20-36` | ✓ |
| `SdCalendarRange` (`start`, `end`, `allDay`) | `:46-50` | ✓ |
| `SdCalendarState<C>` | `:17` | ✓ |
| `SdCalendarMoveSource` (`'drag' \| 'resize' \| 'keyboard' \| 'api'`) | `:11` | ✓ |
| `SdCalendarMoveScope` | `:14` | ✓ |
| `SdCalendarWorkingHours`, `SdCalendarHoliday` | `:104`, `:96-101` | ✓ |
| `SdCalendarDateInput` | `:8` | ✓ |
| `dataSource.onLoad(args)` | `:109-116` | ✓ |
| `create = { creatable?, onCreate }` | `:118-126` | ✓ |
| `move = { movable?, onMove }`, `onMove` trả thêm `'cancel'` | `:128-136` | ✓ |
| `SD_CALENDAR_CONFIGURATION`, `ISdCalendarConfiguration` | `CAL/src/calendar.configuration.ts:5-18` | ✓ |
| Input `view`, `date`, `selectedId` (`model()`) | `CAL/src/calendar.component.ts:244-248` | ✓. Mặc định `view` của calendar là `'week'`; scheduler `'day'` theo §4.1. |
| `views`, `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`, `maxDate`, `scrollTime`, `dimPast`, `transform`, `disabled`, `readonly`, `ariaLabel`, `autoId` | `:250-280` | ✓ cùng tên, cùng kiểu (`minDate`/`maxDate`: `SdCalendarDateInput \| 'TODAY' \| null \| undefined`; `disabled`/`readonly`: `booleanAttribute`; `ariaLabel`/`autoId`: `string \| null \| undefined`). |
| Output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, `sdLoadError` | `:283-291` | ✓ |
| `reload()` | `:786-788` | ✓ |
| `move(eventId, to: { start; end?; allDay? }, source = 'api'): Promise<boolean>` | `:796-805` | ✓; scheduler thêm `resourceId?` vào `to`. |
| `data-autoid="components-calendar-{autoId}"` | `:364` | ✓ mẫu; scheduler `components-scheduler-{autoId}`. |
| Key `core.component.calendar.*` dùng lại (mục F) | `LIB/i18n/src/vi.ts:1660-1716` | ✓ đủ, trừ: spec ghi `weekday-*`, code là `weekday-short-0…6` (`vi.ts:1675-1681`). Dùng `weekday-short-*`. |
| Template directive (mẫu `ngTemplateContextGuard`) | `CAL/src/calendar.templates.ts:40-88` | ✓ |
| Token `--sd-calendar-line`, `-line-half`, `-off-hours`, `-now`, `-today` | `LIB/assets/scss/themes/_component-tokens.scss:68-74` | ✓. `THEME.md:389-405` đã ghi "`sd-calendar` (and `sd-scheduler`, which reuses them)". |

Không có tên nào ở mục 2 và 4 cần đổi. Khác biệt có chủ đích so với calendar (theo spec, ghi vào bảng đối chiếu của PR):
- Tuần có `hideWeekends`: `from`/`to` của scheduler vẫn là cả tuần (§6); của calendar là ngày hiển thị đầu và cuối (`calendar.md` §6). Vì vậy scheduler **không** dùng `ɵsdCalendarVisibleRange` cho Tuần và Tháng (Tháng của calendar là các tuần đầy đủ, `CAL/src/calendar.utils.ts:191-201`); scheduler viết hàm khoảng xem riêng, dựng từ `ɵsdCalendarStartOfWeek`, `ɵsdCalendarAddDays`, `ɵsdCalendarAddMonths`, `ɵsdCalendarIsWeekend`.
- Giao diện hẹp: calendar đổi Tuần thành Ngày và `onLoad` nhận `view: 'day'` (`calendar.md` §6); scheduler giữ đủ `views` (§11), không đổi `view` của `onLoad`.
- ‹ › ở Tháng: `ɵsdCalendarShiftDate` đưa `date` về ngày 1 (`CAL/src/calendar.utils.ts:226-238`). §6 của scheduler chỉ ghi "±1 tháng"; dùng lại hàm của calendar (về ngày 1).

---

## C. Kế hoạch file và commit

### 1. File thêm

Thư mục `LIB/components/scheduler/` (theo `scheduler.md` §1, tách spec theo checkpoint như calendar):
```
index.ts                          export component, model (export type *), 4 directive + context type.
                                  Không re-export type của calendar.
ng-package.json                   như CAL/ng-package.json
sd-scheduler.md                   tài liệu public (tiếng Anh): API, ví dụ client/server, onMove có 'cancel', droppable,
                                  axis, bàn phím, giới hạn 150 tài nguyên, khác biệt với sd-calendar
src/scheduler.model.ts            §3 (import type từ calendar)
src/scheduler.templates.ts        4 directive + ngTemplateContextGuard; SdSchedulerCellTemplateDirective có input `views`
src/scheduler.utils.ts            chỉ phần riêng: khoảng xem Tuần/Tháng, lane, chiều cao hàng, toạ độ Ngày, cột Tuần/Tháng,
                                  kéo mép theo ngày, hàng kế cho Alt + ↑ ↓, tìm hàng theo toạ độ (tìm nhị phân), đích kéo
src/scheduler.component.ts|html|scss
src/scheduler.testing.ts          fixture chỉ cho spec (tài nguyên, sự kiện mẫu của HTML, configureScheduler)
src/scheduler.utils.spec.ts       SCH-U-*
src/scheduler.types.spec.ts       TESTING 3.7
src/scheduler.exports.spec.ts     export của entry, SCH-C-18
src/scheduler.i18n.spec.ts        SCH-SC-37
src/scheduler.component.spec.ts   render, nhóm, dataSource, trạng thái (CP2)
src/scheduler.interaction.spec.ts chọn, tạo (CP3)
src/scheduler-pipeline.spec.ts    dời hai trục, droppable, axis, kéo mép, onMove, lần lặp (CP4)
src/scheduler.keyboard.spec.ts    bàn phím, a11y (CP5)
src/scheduler.compact.spec.ts     compact, cảm ứng, template ô, media (CP5)
```
Showcase: `showcase/src/app/pages/components/scheduler/` (trang demo, 4 ví dụ, dữ liệu mẫu), `showcase/e2e/components/scheduler.e2e.ts`.

### 2. File sửa

| File | Sửa |
| --- | --- |
| `LIB/components/index.ts` | Thêm `export * from '@sdcorejs/angular/components/scheduler';` sau dòng calendar (`:35`). |
| `CAL/src/calendar.utils.ts`, `CAL/src/calendar-move.ts`, `CAL/src/calendar.component.ts`, `CAL/index.ts`; mới `CAL/src/calendar-format.ts`, `CAL/src/calendar-edge-scroll.ts` | Commit `refactor(calendar)` ở câu 1 (nếu PD duyệt H1). Không đổi API public, không đổi DOM. `CAL/src/calendar.exports.spec.ts` thêm export mới. |
| `CAL/src/calendar.testing.ts`, `LIB/testing/schedule-testing.ts` | Chuyển `createWith`, `q`, `qa`, `text` (`calendar.testing.ts:76-93`) sang file chung để scheduler không chép lại (REVIEW §4 dòng 77). H9. |
| `LIB/i18n/src/{vi,en,ja,ko,zh}.ts` | Key `core.component.scheduler.*` (mục F). |
| `LIB/assets/THEME.md` | Đã có câu "sd-scheduler, which reuses them" (`:391`); thêm đoạn biến kích thước `--sd-scheduler-*` khai trên host, không phải token. |
| `CHANGELOG.md` (root) | `## [Unreleased]` → Added: `#### Scheduler`; thêm `sd-scheduler` vào dòng Highlights cạnh `sd-calendar` (`CHANGELOG.md:45`). |
| `showcase/src/app/docs/core/documentation.registry.ts` | Trang `components/scheduler` cạnh calendar (`:317-329`). |
| `showcase/src/app/docs/core/documentation.registry.spec.ts:21,28`, `scripts/generate-showcase-route-shells.test.mjs:187` | Số trang 114 → 115; tổng `demoSectionCount` cộng số mục của trang Scheduler. |
| `showcase/src/app/docs/generated/*` | Sinh lại bằng script của showcase, không sửa tay. |
| v20/v21/v22 | Chỉ qua `npm run sync`. |

Không sửa: `published-docs/`, `published-pages/`, `dist/`, `components/kanban/**`, component khác ngoài calendar (refactor nội bộ).

### 3. Commit dự kiến

Mỗi checkpoint: commit test RED (biên dịch được, đỏ vì assert), rồi commit code xanh, sau lệnh nhanh (`TESTING` §1, `--include='**/components/scheduler/**/*.spec.ts'`) và `npm run lint`. Commit `refactor(calendar)` chạy thêm `--include='**/components/calendar/**/*.spec.ts'`.

| CP | Commit RED | Commit xanh |
| --- | --- | --- |
| 1 | (nếu H1 = làm ở PR scheduler, trước RED) | `refactor(calendar): share title format, small helpers, move runner and edge scroll with sd-scheduler` |
| 1 | `test(scheduler): pure helpers, i18n and type contract (RED)` (kèm khung model, templates, index, hàm stub trả rỗng để biên dịch) | `feat(scheduler): entry point, model, templates, pure helpers and i18n` |
| 2 | `test(scheduler): rendering, groups, data source and states (RED)` | `feat(scheduler): day, week and month rendering, resource column, groups, onLoad lifecycle` (+ khung trang showcase và nút hiệu năng nếu H5) → **đo câu 4** → **R1** |
| 3 | `test(scheduler): selection and create (RED)` | `feat(scheduler): selection, sweep, click and Enter create, creatable` |
| 4 | `test(scheduler): two-axis move, droppable, axis, resize and pipeline (RED)` | `feat(scheduler): two-axis drag, droppable, axis lock, resize end, move pipeline and recurring scope` |
| 5 | `test(scheduler): keyboard, a11y, compact, touch and cell template (RED)` | `feat(scheduler): keyboard grid, a11y, compact layout, touch and cell template` |
| 6 | (spec đếm showcase sửa cùng commit) | `docs(scheduler): sd-scheduler.md, THEME, CHANGELOG, showcase page and e2e`, rồi `chore(scheduler): sync v20/v21/v22` |
| B | | `fix(scheduler): … [SCH-B-xx]` sau R2; mỗi sửa có test hồi quy trước |

Không push, không mở PR cho tới khi qua R2' (`schedule-kanban/PROMPT.md`).

---

## D. Kéo hai trục bằng CDK

### 1. Bố cục làm nền cho phép tính

- Một phần tử cuộn hai trục (`[data-scroller]`). Bên trong là lưới CSS hai cột: cột tài nguyên `--sd-scheduler-resource-width` và vùng thời gian.
- Hàng đầu: ô góc (`position: sticky; inset-block-start: 0; inset-inline-start: 0`, z-index 4) và trục thời gian (`sticky; inset-block-start: 0`, z-index 3).
- Mỗi hàng tài nguyên: ô `role="rowheader"` (`sticky; inset-inline-start: 0`, z-index 2) và một **rãnh** `[data-track]` (một phần tử, nền gradient). Khối là con của rãnh, `position: absolute`, đặt bằng `inset-inline-start` và `inline-size` (tự đảo ở RTL).
- Hàng nhóm: một `button` kéo hết bề ngang, phần nhãn dính trái.
- Lớp kéo (một bộ cho cả component, nằm trong vùng thời gian): khối đề xuất, lớp phủ hàng đích (hợp lệ hoặc sọc), nhãn nổi. Không có phần tử theo hàng hay theo slot.

### 2. Phiên kéo

Giống calendar ở ba điểm đã chạy được (`CAL/src/calendar.component.ts:1058-1109`): `cdkDrag` độc lập (không `cdkDropList`); `cdkDragConstrainPosition` trả lại toạ độ gốc nên phần tử gốc đứng yên (vẽ khung nét đứt ở lane cũ) và **lưu toạ độ pointer thật**; `cdkDragEnded` gọi `source.reset()` rồi chạy pipeline. `[cdkDragStartDelay]="{ touch: 400, mouse: 0 }"`, ngưỡng 5px mặc định.

Khác calendar: **không bind `(cdkDragMoved)`**. CDK gọi `constrainPosition` trong `_pointerMove`, chạy ngoài NgZone (`CDK:900`, `:938`, `:1341-1345`); còn `cdkDragMoved` chỉ phát khi có người nghe và luôn trong `zone.run` (`CDK:957-959`), tức mỗi lần chuột di chuyển là một lượt change detection. Scheduler tính đích ngay trong `constrainPosition` (ngoài zone) và chỉ `zone.run` khi **đích đổi**.

Khi `cdkDragStarted` (trong zone), chụp một lần:
- `rect` của vùng cuộn, `scrollLeft`/`scrollTop` lúc đầu, hướng `dir` (`getComputedStyle(host).direction`, như calendar).
- Phần dính: `stickyBlock` = chiều cao trục thời gian, `stickyInline` = bề rộng cột tài nguyên (đo bằng `offsetHeight`/`offsetWidth`, nên đúng cả khi consumer đổi biến CSS).
- Hàng: mảng `{ key, kind: 'resource' | 'group', resourceId, top, bottom }` theo toạ độ nội dung (`offsetTop` trong vùng cuộn), đã sắp. Chiều cao hàng không đổi trong lúc kéo (khối đang kéo không tham gia xếp lane của hàng đích, hàng gốc giữ lane cũ, §8.4 bước 5), nên chụp một lần là đủ; tự cuộn chỉ đổi `scroll*`.
- Ngày: `hourWidth` thật (`offsetWidth` của một ô giờ trên trục). Tuần, Tháng: mép các cột (từ ô trục), theo toạ độ nội dung.
- Điểm nhấn (`#pickup`, ghi ở `pointerdown` như calendar `:342`), hàng gốc, cột/phút gốc, thời lượng.
- `memo = new Map<string, boolean>()` cho `droppable` (§9.3 "nhớ theo `(resourceId, start)` trong một lần kéo").

### 3. Tính hàng đích và slot từ pointer

Hàm thuần `sdSchedulerDragTarget(session, pointer, scroll)` trong `scheduler.utils.ts` (test được không cần DOM):
1. Toạ độ nội dung: `cy = p.y − rect.top + scrollTop`; `cx = dir > 0 ? p.x − rect.left + scrollLeft : rect.right − p.x − scrollLeft` (RTL: `scrollLeft` ≤ 0 theo chuẩn hiện tại, trục ngang đo từ mép phải).
2. Trục dọc:
   - `axis: 'time'`: hàng = hàng gốc, bỏ qua `p.y`.
   - Pointer đang trên trục thời gian dính (`p.y < rect.top + stickyBlock`): giữ hàng của lần trước (pointer không ở trên hàng nào nhìn thấy được).
   - Còn lại: tìm nhị phân trong mảng hàng theo `cy`. Hàng nhóm → đích không hợp lệ (`kind: 'group'`, thả là huỷ). Nhóm thu gọn chỉ còn hàng nhóm nên rơi vào trường hợp này (§9.3 "nhóm thu gọn không nhận").
3. Trục ngang:
   - `axis: 'resource'`: giữ giờ gốc, bỏ qua `p.x`.
   - Pointer đang trên cột tài nguyên dính: giữ giá trị của lần trước (H10).
   - Ngày: `deltaMin = (cx − cxNhấn) / hourWidth × 60`; `start = ɵsdCalendarSnapMove(startGốc, deltaMin, thờiLượng, ɵsdCalendarMoveStep(step))` (kẹp `[0, 1440 − thời lượng]`, `CAL/src/calendar.utils.ts:321-324`).
   - Tuần, Tháng: cột = cột chứa `cx` (kẹp vào cột đầu, cuối); dịch = `cột − cộtNhấn`, tính trên **danh sách cột đang hiện** (đã bỏ T7, CN khi `hideWeekends`), kẹp để `[ngày đầu, ngày cuối]` của sự kiện vẫn nằm trong khoảng xem; giữ giờ bắt đầu và thời lượng.
4. `outside` = pointer ra ngoài `rect` của vùng cuộn. Thả khi `outside`, trên hàng nhóm, trên hàng bị từ chối, hoặc sau Esc: huỷ, không gọi `onMove`.
5. Kết quả: `{ rowKey, resourceId, startDay, startMinutes, endDay, endMinutes, outside }` và khoá `${resourceId}|${start}`.

### 4. Chạy `droppable` khi đích đổi mà không giật

- Mỗi lần `constrainPosition` chạy: tính đích (mục 3). Khoá **trùng** lần trước → không làm gì (không ghi signal, không change detection).
- Khoá **đổi**: lấy `memo.get(key)`; chưa có thì dựng `SdSchedulerDropContext { event, to, resource }` và gọi `droppable` (đồng bộ, rẻ theo hợp đồng). Throw → coi là false, cảnh báo dev một lần. Ghi vào `memo`.
- Sau đó một `zone.run(() => this.#drag.set(proposal))`. Signal này điều khiển: khối đề xuất (lane 0 của hàng đích, trên các khối khác), lớp phủ hàng (một phần tử, `top`/`height` lấy từ mảng hàng đã chụp), nhãn nổi, `data-blocked` trên hàng đích, con trỏ `not-allowed`.
- Số lượt change detection trong một lần kéo = số lần đổi hàng hoặc slot (Ngày: mỗi `moveStep`; Tuần/Tháng: mỗi cột), không phải mỗi lần chuột di chuyển.
- Mờ ô tài nguyên của hàng bị từ chối (`opacity: .5`, §8.3): thuộc tính `data-blocked` trên hàng đích. Mặc định dùng binding (`[attr.data-blocked]` so với `#drag().resourceId`). Nếu đo thấy long task khi đổi hàng (150 hàng cùng kiểm lại binding), chuyển sang đặt thuộc tính trực tiếp trên hai phần tử (hàng cũ, hàng mới) ngoài zone.
- Live region: không đọc mỗi lần đổi hàng (tránh ồn); chỉ đọc `drop-blocked` khi thả lên hàng bị từ chối (§9.3) và khi `Alt` + `↑` `↓` không còn hàng.
- Có template ô ở chế độ hiện tại: không có khối nên không kéo (§9.3).

### 5. Tự cuộn hai trục

Vòng `requestAnimationFrame` ngoài zone như calendar (`CAL/src/calendar.component.ts:1463-1488`), nhưng hai trục. Vùng nhìn = `rect` trừ `stickyBlock` ở trên và `stickyInline` ở mép đầu dòng (trái; phải khi RTL). Pointer cách mép vùng nhìn ≤ 40px → cuộn trục đó, tốc độ tỉ lệ, tối đa 16px mỗi khung. Mỗi khung tính lại đích (mục 3) với `scroll*` mới; chỉ ghi signal khi khoá đổi. Đây là phần tách thành `SdCalendarEdgeScroller` ở câu 1.

### 6. `cdkDragLockAxis` cho `axis`

- `[cdkDragLockAxis]="axis === 'time' ? 'x' : axis === 'resource' ? 'y' : null"` như §9.3.
- Lưu ý: CDK áp `lockAxis` **sau** `constrainPosition` (`CDK:1343-1355`). Vì `constrainPosition` đã giữ phần tử đứng yên, `cdkDragLockAxis` chỉ còn tác dụng trên phần tử gốc (không nhìn thấy). Khoá thật nằm ở mục 3: `'time'` bỏ qua `p.y`, `'resource'` bỏ qua `p.x`. SCH-C-08 kiểm bằng request và khối đề xuất, không bằng vị trí phần tử.
- `axis: 'resource'`: không có tay nắm mép phải; `Alt` + `←` `→` và `Alt` + `Shift` + `←` `→` không làm gì (§9.4, §9.7). `axis: 'time'`: `Alt` + `↑` `↓` không làm gì.
- `move()` trái `axis` (đổi `resourceId` khi `'time'`, đổi giờ khi `'resource'`) → `false` (§4.3).

### 7. Quét tạo và kéo mép phải

- Quét: `pointerdown` (pointer chính, nút 0, không trên khối, không trên hàng nhóm) trên rãnh → `setPointerCapture`. Hàng giữ nguyên từ lúc nhấn; pointer ra khỏi hàng vẫn tính theo trục ngang (§9.2). Ngày: `ɵsdCalendarSweep(neo, hiệnTại, step)` (`CAL/src/calendar.utils.ts:314-318`), giới hạn trong ngày. Tuần, Tháng: `[min, max]` theo cột, `allDay: true`. Dưới 5px: một slot (`ɵsdCalendarSlot`) hoặc một ngày. Cảm ứng: chỉ chạm (một slot), không quét. Esc huỷ.
- Kéo mép phải: vùng 8px ở mép cuối dòng, con trỏ `ew-resize`, `stopPropagation` trên `mousedown`/`touchstart` để `cdkDrag` không bắt đầu (như calendar). Ngày: `ɵsdCalendarResizeEnd(start, end, deltaMin, step)` (`CAL/src/calendar.utils.ts:327-330`: tối thiểu như calendar, tối đa 24:00 của ngày bắt đầu). Tuần, Tháng: chỉ sự kiện cả ngày, hàm mới `sdSchedulerResizeDays` (tối thiểu 1 ngày, tối đa ngày cuối khoảng). Cảm ứng: chỉ khối đang chọn, vùng 24px.

---

## E. Cấu trúc signal, computed, effect

Nguyên tắc như calendar: `computed` thuần (không gọi API, không ghi signal); mỗi `effect` không ghi signal mà nó đọc; mọi ghi trong effect nằm trong `untracked`; không `setTimeout` chờ render (dùng `afterNextRender`).

### 1. Input, output, content

- `input.required`: `option`, `resources`. `model`: `view` (`'day'`), `date`, `selectedId`. `input`: `views`, `resourceLabel`, `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`, `maxDate`, `scrollTime`, `dimPast`, `transform`, `disabled`, `readonly`, `ariaLabel`, `autoId` (kiểu và transform như calendar, câu 5).
- `output`: `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, `sdLoadError`, `sdCellSelect`.
- `contentChild`: 4 template directive.

### 2. Trạng thái nội bộ (signal ghi được)

| Signal | Nội dung |
| --- | --- |
| `#loader = new ɵSdCalendarLoader<SdSchedulerEvent<T>>()` | `items`, `phase`, `everLoaded` |
| `#operation = new ɵSdCalendarOperation<'create' \| 'move'>()` | một thao tác chờ |
| `#width`, `#metrics` | bề rộng host (ResizeObserver, guard `typeof ResizeObserver`); `hourWidth` thật và bề rộng vùng thời gian, đo trong cùng callback (để chia bậc nội dung khối theo px) |
| `#now` | giờ hiện tại, cập nhật 60 giây |
| `#collapsed: signal<ReadonlySet<string>>` | nhóm thu gọn (§10) |
| `#cursor` | `{ resourceId, day, minutes }` của con trỏ lưới |
| `#drag`, `#ghost`, `#resize` | đề xuất kéo, khối nét đứt khi tạo, kéo mép |
| `#moving`, `#asking`, `#failure` | trong runner dùng chung (câu 1): sự kiện đang chờ ở vị trí đề xuất, thanh hỏi phạm vi, dải thất bại |

### 3. Computed, theo tầng

1. **Cấu hình**: `stepValue`, `firstDayOfWeekValue`, `workingHoursValue`, `holidaysByDay` qua `ɵsdCalendarResolveConfig` (câu 1).
2. **Khoảng xem**: `compact` (`#width` < 600); `activeView` (`view` thuộc `views`, không thì `views[0]`); `anchor`; `range = computed(() => sdSchedulerVisibleRange(activeView, anchor, firstDayOfWeek), { equal: cùng from|to|view })`; `columns` (ngày đang hiện: Ngày 1, Tuần 7 hoặc 5, Tháng 28–31; mỗi cột có `today`, `holiday`, thứ ngắn); `title`, nhãn và trạng thái ‹ › (hàm định dạng chung).
3. **Tài nguyên**: `resourceCheck` (id trùng hoặc rỗng, `title` rỗng → dữ liệu không hợp lệ, §12); `resourceById: Map`; `resourceIds` (thứ tự của `resources`, gồm cả nhóm thu gọn, cho `onLoad`); `groups` (không nhóm đứng đầu, rồi nhóm theo lần xuất hiện đầu, §10); `rows` (hàng nhóm + hàng tài nguyên, bỏ tài nguyên của nhóm thu gọn). Mỗi hàng có `workingHours` hiệu lực (`resource.workingHours` nếu khai báo, kể cả `null`, không thì của component) và chuỗi gradient ngoài giờ/ngày nghỉ, nhớ theo tham chiếu `workingHours` để các hàng giống nhau dùng chung một chuỗi.
4. **Dữ liệu**: `reading` = với mỗi item của `#loader`: `resourceId` có trong `resourceById`? (không: ghi vào danh sách cảnh báo, bỏ) → `ɵsdCalendarPlace` (null: cảnh báo, bỏ) → nếu đang chờ dời thì đặt ở đích (kể cả `resourceId` mới). Ra `placed`, `unknownResource`, `unreadable`. `inRange` lọc theo `range`. `byResource: Map<resourceId, placed[]>`.
5. **Lane và toạ độ**: `lanes = computed(Map<resourceId, { count, laneOf }>)` bằng `sdSchedulerLanes` (§8.4; khối đang kéo, đang chờ không tham gia, vẽ lane 0 của hàng đích). `rowViews`: chiều cao `sdSchedulerRowHeight(count)` (= `max(48, 8 + 32n)`), danh sách khối của hàng với `inset-inline-start`/`inline-size` dạng chuỗi tính sẵn (Ngày: `calc(var(--sd-scheduler-hour-width) * x + 1px)`, bề rộng `max(12px, …)`; Tuần/Tháng: phần trăm theo `sdSchedulerColumnSpan` trừ khoảng trống §7), `top` theo lane, bậc nội dung (≥ 120 / 48–119 / < 48 px, mốc 96 px cho giờ đứng trước tên) tính bằng `#metrics`, nhãn `aria-label`, `data-autoid`, màu, cờ cắt hai đầu, `movable`, context template. Template ô đang áp dụng: `rowViews` có `cells` (ngày, sự kiện của ô) thay cho khối.
6. **Tương tác**: `locked` (`disabled`, `readonly`, đang tải, lỗi tải, dữ liệu không hợp lệ, không có tài nguyên); `canCreate`; `canMove` (có `option.move`, không khoá, không có template ô ở chế độ này); `cellTemplateActive`; `cursorLabel`; `nowOffset` (chỉ Ngày khi đang xem hôm nay); `dragView` (khối đề xuất, lớp phủ, nhãn nổi).

### 4. Effect

| # | Đọc | Việc (trong `untracked`) |
| --- | --- | --- |
| 1 | `option`, `range`, khoá `resourceIds` | Phát `sdRangeChange` khi khoá `from\|to\|view` đổi (không phát khi chỉ `resources` đổi, SCH-C-02). Huỷ dời đang chờ (SC-15); huỷ tạo đang chờ khi `option` hoặc `resources` đổi. Bỏ khỏi `#collapsed` các nhóm không còn (§10). `resources` rỗng: huỷ lần tải, xoá item, không gọi `onLoad`. Còn lại: `#loader.load(khoá range + resourceIds, …)`. |
| 2 | `reading` (danh sách cảnh báo), `step`, `workingHours` của component và của từng tài nguyên | Cảnh báo dev một lần mỗi khoá (`resourceId` lạ, ngày hỏng, `step` lạ, khoảng giờ làm hỏng). |
| 3 | `disabled`, `readonly` | Bật → huỷ dời đang chờ (SC-15). |
| 4 | `activeView === 'day'` và hôm nay là `date` | Bật/tắt bộ đếm 60 giây ngoài zone (như calendar `:708-719`). |
| 5 | chuyển chế độ, `range` | `afterNextRender`: vào Ngày (khởi tạo, hoặc từ chế độ khác) → `scrollLeft` theo `scrollTime`; Tuần/Tháng có hôm nay bị khuất → cuộn cột hôm nay sát mép trong. Không đụng `scrollTop` (§6). |
| 6 | `selectedId`, `phase`, item | id không còn → `selectedId = null` (SC-27), chỉ ghi khi khác. |
| 7 | `#asking` | Mở thanh hỏi → `afterNextRender` focus "Chỉ lần này" (nếu runner dùng chung chưa làm). |

`ResizeObserver` tạo trong constructor (không phải effect), dọn ở `DestroyRef.onDestroy` cùng loader, operation, timer, rAF, listener `keydown` của document (REVIEW §3.4).

Khoá tải gồm `resourceIds`, nên đổi `resources` sẽ xoá lưới tới khi có kết quả (như đổi khoảng). Lý do: tránh cảnh báo "`resourceId` lạ" giả cho sự kiện của tài nguyên vừa bị bỏ. H7.

---

## F. i18n (`scheduler.md` §14)

### 1. Key mới `core.component.scheduler.*` (14 key, đủ vi/en/ja/ko/zh)

| Key | vi | en | Placeholder |
| --- | --- | --- | --- |
| `label` | Lịch theo tài nguyên | Resource schedule | |
| `resources` | Tài nguyên | Resources | |
| `group-count` | {count} tài nguyên | {count} resources | `count` |
| `group-expand` | Mở rộng {group} | Expand {group} | `group` |
| `group-collapse` | Thu gọn {group} | Collapse {group} | `group` |
| `empty` | Không có tài nguyên nào | No resources | |
| `drop-blocked` | Không chuyển sang {resource} được | Can't move to {resource} | `resource` |
| `moved-resource` | Đã chuyển sang {resource}, {start} | Moved to {resource}, {start} | `resource`, `start` |
| `cursor-time` | {resource}, {weekday} {date}, {time} | {resource}, {weekday} {date}, {time} | 4 |
| `cursor-day` | {resource}, {weekday} {date} | {resource}, {weekday} {date} | 3 |
| `event-label` | {title}, {resource}, {weekday} {date}, {start} đến {end} | {title}, {resource}, {weekday} {date}, {start} to {end} | 6 |
| `event-label-all-day` | {title}, {resource}, cả ngày, {from} đến {to} | {title}, {resource}, all day, {from} to {to} | 4 |
| `grid-help` | Mũi tên để di chuyển, Enter để tạo. Alt + Enter để thu gọn nhóm. | Arrow keys to move, Enter to create. Alt + Enter to collapse the group. | |
| `event-help` | Alt + mũi tên để dời, Alt + Shift + mũi tên để đổi giờ kết thúc. | Alt + arrow keys to move, Alt + Shift + arrow keys to change the end. | |

ja/ko/zh dịch cùng nghĩa, cùng tập placeholder (kiểm bằng `i18nParityProblems`, `LIB/testing/schedule-testing.ts:335-363`).

Cách dùng (chỗ spec chưa nói rõ, đề xuất):
- Hàng nhóm: `aria-label` = "{group}, " + `group-count` (§14 gạch đầu dòng cuối); `group-expand`/`group-collapse` làm `title` của nút (gợi ý khi hover), để không đọc trùng với `aria-expanded`.
- `moved-resource` `{start}`: Ngày "10:00"; Tuần/Tháng "{thứ} {ngày}" (thêm ", HH:mm" cho khối có giờ).
- Nhãn khối lặp: nối `, ` + `core.component.calendar.recurring` (§14 "[, lặp lại]").

### 2. Key dùng lại của calendar (có trong `LIB/i18n/src/vi.ts:1660-1716`)

| Nhóm | Key `core.component.calendar.*` |
| --- | --- |
| Thanh công cụ | `today`, `views`, `view-day`, `view-week`, `view-month`, `prev-day`, `next-day`, `prev-week`, `next-week`, `prev-month`, `next-month` |
| Tiêu đề (qua hàm định dạng chung) | `title-day`, `title-week`, `title-range`, `title-month` |
| Trục ngày | `weekday-short-0` … `weekday-short-6` (spec ghi `weekday-*`) |
| Tạo | `new-event`, `create-error` |
| Lần lặp | `recurring`, `scope-message`, `scope-this`, `scope-following`, `scope-all`, và `core.common.cancel` (như calendar, `CAL/src/calendar.component.html:132`) |
| Dời | `pending`, `saving`, `moved` (chỉ đổi giờ), `resized`, `cancelled`, `rejected`, `error`, `out-of-range` |
| Tải, dữ liệu | `load-error`, `invalid-data`, `retry`, `dismiss` |

Không dùng của calendar: `label`, `grid-instructions`, `event-instructions` (scheduler có `label`, `grid-help`, `event-help` riêng vì nội dung khác: thêm `Alt` + `Enter`, đổi giờ kết thúc bằng `←` `→`); `slot-label` (thay bằng `cursor-time` có tên tài nguyên); `event-label*` (thay bằng bản có `{resource}`).

Thiếu so với giao diện (H8): tên đọc của nút số ngày trên trục Tuần/Tháng (bấm → mở Ngày), và nhãn `gridcell` của template ô. Đề xuất: `gridcell` dùng `cursor-day`; nút số ngày cần một key mới `open-day` ("Mở ngày {weekday} {date}" / "Open {weekday} {date}"), chỉ thêm khi PD duyệt (REVIEW §3.1 cấm key ngoài spec).

---

## G. Bổ sung của cổng G0 (`schedule-kanban/PROMPT.md`)

### 1. Mã test theo checkpoint

Tên test bắt đầu bằng mã (`it('[SCH-C-06] …')`). Mã hợp đồng chung dùng tiền tố `SCH-SC-xx` (TESTING §4), chạy trên component scheduler.

| CP | File spec | Mã |
| --- | --- | --- |
| 1 | `scheduler.utils.spec.ts`, `scheduler.types.spec.ts`, `scheduler.exports.spec.ts`, `scheduler.i18n.spec.ts` | SCH-U-01 … SCH-U-10; SCH-SC-37; SCH-C-18 (scheduler nhận cấu hình qua `SD_CALENDAR_CONFIGURATION`; type `SdSchedulerEvent` gán được cho `SdCalendarEvent`; reviewer kiểm "không bản sao" bằng diff); type test TESTING 3.7 (`onMove` trả `'canceled'` bị từ chối, context 4 template có kiểu, `resources`/`onLoad` sai kiểu báo lỗi, `views` của template ô không nhận `'day'`). Spec calendar giữ xanh sau `refactor(calendar)`; CAL-C-23 thêm export mới. |
| 2 | `scheduler.component.spec.ts` | SCH-C-01, -02, -03, -04, -12, -13 (phần tô ngoài giờ theo tài nguyên), -16 (phần `rowheader`, `aria-expanded`, nhãn khối có tên tài nguyên), -17; SCH-SC-01, -03 (render với dữ liệu đóng băng sâu), -15 (phần tải: đổi khoảng, `resources`, `option`, `reload()`, destroy), -16 (`onLoad` reject `'SECRET'`), -22, -23, -24, -33, -38. Đo hiệu năng câu 4 (chạy tay, ghi số vào báo cáo CP2). |
| 3 | `scheduler.interaction.spec.ts` | SCH-C-05; SCH-SC-06 (`creatable`), -07 (không `option.create` → không khối nét đứt), -14 (đang chờ `onCreate`), -15 (huỷ tạo khi `option`/`resources` đổi, destroy), -19, -20, -21, -26, -27, -28. |
| 4 | `scheduler-pipeline.spec.ts` | SCH-C-06 (kèm lần lặp: thanh hỏi, đổi tài nguyên cũng hỏi, `following`/`all` → `reload()`), -07, -08, -09, -10; SCH-SC-02, -03 (thao tác trên dữ liệu đóng băng), -06 (`movable`, `droppable` đánh giá lại trước `onMove`), -07 (không `option.move`), -08 (kéo, `move()`), -09 … -13 (mỗi kết quả: đồng bộ và Promise), -14, -15 (phần dời: `resources`, `option`, khoảng xem, `reload()`, `readonly`, `disabled`, destroy), -16 (`onMove` throw `'SECRET'`), -17 (cả `resourceId` lạ, trái `axis`, `droppable` false), -18, -31. |
| 5 | `scheduler.keyboard.spec.ts`, `scheduler.compact.spec.ts` | SCH-C-11, -13 (phần `Home`/`End`), -14, -15, -16 (live region `drop-blocked`, `aria-activedescendant`); SCH-SC-07 và -08 (phần `Alt` + phím), -14 (phím), -29, -30, -32, -34, -35, -36 (vùng chạm 44px khi `pointer: coarse`, kiểm rule CSS bằng `findCssRule`, `LIB/testing/test-utils.ts:73`). |
| 6 / G-final | `showcase/e2e/components/scheduler.e2e.ts` | SCH-E-01 … SCH-E-12; axe; ảnh TESTING §9 (mục 01–07 của HTML); hiệu năng §10 (SCH-E-12). |

N/A: SCH-SC-25 (scheduler không có `items`). SCH-SC-04, -05, -39 … -45 kiểm bằng review, type test (SC-05, SC-39) và lệnh (`check:scss-hex`, lint), không có `it` riêng; ghi trong báo cáo như calendar.

Chỗ TESTING chưa có mã riêng, gom vào mã gần nhất: lần lặp → SCH-C-06; `move()` `resourceId` lạ, trái `axis` → SCH-SC-17; `'cancel'` về đúng hàng và giờ cũ → SCH-SC-12; `sdLoadError` không phát khi abort → SCH-SC-24.

### 2. Helper test dùng chung

Dùng lại `LIB/testing/schedule-testing.ts` của calendar (hiện có trên feat/calendar, kanban đã chép nguyên file theo K10). Đủ cho scheduler, không cần helper mới:
- `deferred` (`:16-24`), `FakeResizeObserver` có `install(null)` (`:27-81`), `clockFor` (`:145-150`), `SCHEDULE_TEST_NOW = '2026/11/09 10:40'` và `SCHEDULE_TEST_ZONE` (`:153-154`, trùng "hôm nay" của HTML scheduler), `stubNow` (`:157-169`), `mouse`, `pointer`, `mouseDrag` (2 bước 3px rồi tới đích, chạy được cả hai trục), `clickWithJitter`, `touch`, `touchDrag` (giữ 400ms) (`:184-303`), `press` (`:308-326`), `i18nParityProblems` (`:335-363`).
- `LIB/testing/test-utils.ts`: `findCssRule` (`:73`), `dispatch` (`:54`).

Đề xuất (H9): chuyển `createWith`, `q`, `qa`, `text` và phần chung của `configureCalendar` (`CAL/src/calendar.testing.ts:62-93`, cung cấp zone, ngôn ngữ, `SD_CALENDAR_CONFIGURATION`, ghim "bây giờ") sang `schedule-testing.ts`, vì scheduler dùng đúng các hàm này và cùng token cấu hình. Fixture riêng của scheduler ở `src/scheduler.testing.ts` (spec-only, không export ở `index.ts`): tài nguyên và sự kiện của bốn ví dụ HTML, `pointAt(root, resourceId, minutes | day)` (toạ độ client của một slot trên một hàng, cho `mouseDrag`/`pointer`). Host test có kích thước cố định (1122 × 640, như mục 01 của HTML) để có layout thật.

### 3. axe

Showcase **không** có `@axe-core/playwright` (`showcase/package.json` chỉ có `@playwright/test` 1.63.0, dòng 62; `package.json` root không có). `versions/v19/package.json:72` có `axe-core` 4.13.0. Làm như calendar và kanban, không thêm dependency: `page.addScriptTag({ path: 'versions/v19/node_modules/axe-core/axe.min.js' })` rồi `axe.run(root)` trong trang, không có vi phạm `serious`/`critical` (`showcase/e2e/components/calendar.e2e.ts:17`, `:91-96`). Chạy ở Ngày (light), Tuần (dark), forced-colors, trạng thái đang kéo và hàng bị từ chối.

### 4. Playwright

`showcase/playwright.config.ts:19-22`: **chỉ Chromium**, hai project zone `asia-bangkok` (`Asia/Bangkok`) và `utc`; `testDir: ./e2e`, `testMatch: **/*.e2e.ts`. Không có Firefox/WebKit → chạy Chromium và ghi lại theo TESTING §11.
- File: `showcase/e2e/components/scheduler.e2e.ts` (cùng thư mục với `calendar.e2e.ts`, `kanban.e2e.ts`).
- Zone khác (`America/New_York`, `Asia/Kolkata`, `Asia/Ho_Chi_Minh`): `test.use({ timezoneId })` trong spec (như `calendar.e2e.ts:372`, `:384`). Mobile 390 (SCH-E-11): `test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })`. Cột 400px trên desktop: khung 400px trong trang.
- Ma trận §11, phủ mỗi giá trị ít nhất một lần: bề rộng 1280/960/700/400/390; zone 4 giá trị, có và không `timeZone`; vi, en; light, dark, preset graphite; LTR, RTL; `prefers-reduced-motion`, `forced-colors`.
- Ảnh: `reports/scheduler-screens/`, chụp ở project `asia-bangkok` như calendar và kanban.
- Trên máy local, cổng 4321 đang bị app khác dùng; dùng file cấu hình local không commit như kanban (`showcase/playwright.local-kanban.config.ts`).
- Đề xuất (H9): tạo `showcase/e2e/components/schedule.support.ts` cho `axe`, `frame`, `shot`, `rtl` (hiện calendar và kanban mỗi bên một bản: `calendar.e2e.ts:91-127` và `:397`, `kanban.e2e.ts:69-115`). Scheduler dùng file này; calendar và kanban chuyển sang ở bước RX.

---

## H. Lệch spec dự kiến

| # | Lệch | Lý do |
| --- | --- | --- |
| L1 | `move()` chạy `droppable` (khác §4.3) | SC-08 ưu tiên hơn (S1). |
| L2 | `Alt` + `↑` `↓` vào được nhóm thu gọn rồi mở nhóm (khác SCH-U-09, §16) | Theo SCH-E-05, PROMPT kiểm tra tay (S2). |
| L3 | Một live region, dải không có `role="alert"` | SC-33, như calendar Q2 (S4). |
| L4 | Nút thanh công cụ native | Như calendar Q4 (S5). |
| L5 | Tiêu đề Ngày ra "9 tháng 11" không phải "09 tháng 11" | Dùng hàm định dạng của calendar (S7). |
| L6 | i18n ở checkpoint 1 thay vì 6 | Render cần chữ từ checkpoint 2 (S8). |
| L7 | Khung trang showcase (một ví dụ + nút hiệu năng) ở checkpoint 2 thay vì 6 | Câu 4 bắt đo trên showcase trước checkpoint 3 (H5). |
| L8 | Không bind `cdkDragMoved`; khoá trục thật nằm ở phép tính đích, `cdkDragLockAxis` vẫn đặt | Tránh change detection mỗi lần chuột di chuyển; CDK áp `lockAxis` sau `constrainPosition` (mục D.2, D.6). |
| L9 | Thuộc tính `data-blocked` trên hàng đích khi kéo, `data-group` trên hàng nhóm | §15 không liệt kê; cần cho test (TESTING §0.3: truy vấn bằng `data-*`) và cùng tên với kanban (`data-blocked` của làn). |
| L10 | Đổi `resources` xoá lưới tới khi có kết quả; cũng huỷ thao tác tạo đang chờ | H7. SC-15 chỉ nêu huỷ cho request dời; mở rộng cho tạo vì tài nguyên của khối nét đứt có thể không còn. |
| L11 | `droppable` throw → coi là false, cảnh báo dev | Hợp đồng nói `droppable` đồng bộ, không nói khi throw. |
| L12 | Pointer trên phần dính (trục thời gian, cột tài nguyên) khi kéo: giữ giá trị trục đó của lần trước, không coi là ngoài lưới | H10. |
| L13 | `aria-label` của hàng nhóm theo §14 ("{group}, {count} tài nguyên"); `group-expand`/`group-collapse` làm `title` | §14 có cả hai, không nói key nào cho `aria-label`. |
| L14 | Phần dùng chung tách ra calendar (câu 1) sửa file calendar trong PR scheduler | H1. Không đổi API public, không đổi DOM. |

---

## Câu hỏi cho PD (trả lời trước G1)

Mã `H` để khỏi nhầm với Q1–Q4 của calendar. S1 là H3, S2–S3 là H4. S4–S8 làm theo quyết định đã chốt cho calendar; PD chỉ cần trả lời nếu không đồng ý.

1. **H1 — Tách phần dùng chung khỏi component calendar** (định dạng tiêu đề, helper nhỏ, giải cấu hình, thông báo, điều phối pipeline dời, tự cuộn; câu 1): làm bằng commit `refactor(calendar)` đầu PR scheduler (**đề xuất**), hay sửa PR #141 trước khi merge, hay để scheduler tự viết (rủi ro bị REVIEW §3.1 bắt bản sao)?
2. **H2 — Thanh công cụ, dải lỗi/thất bại, thanh hỏi phạm vi**: chép markup và SCSS sang scheduler với class `sd-scheduler__*` (**đề xuất**; không đổi DOM calendar), hay tách thành component nội bộ `ɵ` trong entry calendar (đổi DOM calendar, phải chụp lại ảnh calendar)?
3. **H3 — `move()` và `droppable`** (S1): theo SC-08, `move()` cũng kiểm `droppable` (**đề xuất**, giống kanban), hay theo `scheduler.md` §4.3 (không kiểm)?
4. **H4 — `Alt` + `↑` `↓` và nhóm thu gọn** (S2, S3): vào được tài nguyên của nhóm thu gọn rồi mở nhóm sau khi chấp nhận, con trỏ `↑` `↓` dừng ở hàng nhóm thu gọn (**đề xuất**, theo SCH-E-05); hay bỏ qua nhóm thu gọn (theo SCH-U-09) và sửa SCH-E-05?
5. **H5 — Nơi đo hiệu năng ở checkpoint 2**: dựng sớm trang Scheduler trong showcase với ví dụ Đặt phòng và nút "150 tài nguyên × 31 ngày" (**đề xuất**, như K5 của kanban), hay harness tạm không commit?
6. **H6 — Nếu render đầu > 100 ms**: cách 1–2 (mục B câu 4) làm luôn từ đầu. Cách 3 (`DragDrop.createDrag` khi `pointerdown` thay cho `cdkDrag` trên từng khối) và cách 4 (`content-visibility: auto` trên hàng) chỉ làm sau khi báo số đo và PD đồng ý (**đề xuất**)?
7. **H7 — Đổi `resources`**: xoá lưới tới khi có kết quả (**đề xuất**), hay giữ sự kiện cũ (chỉ thanh tiến trình) và tạm không cảnh báo `resourceId` lạ trong lúc tải?
8. **H8 — Key i18n thiếu**: thêm `core.component.scheduler.open-day` cho nút số ngày trên trục Tuần/Tháng (**đề xuất**); `gridcell` của template ô dùng `cursor-day`?
9. **H9 — Helper test**: chuyển `createWith`, `q`, `qa`, `text` và phần chung của `configureCalendar` sang `testing/schedule-testing.ts`; tạo `showcase/e2e/components/schedule.support.ts` cho scheduler, calendar/kanban chuyển sang ở RX (**đề xuất**)?
10. **H10 — Pointer trên phần dính khi kéo**: giữ giá trị trục đó của lần trước, chỉ ra khỏi vùng cuộn mới là "ngoài lưới" (**đề xuất**), hay coi trên cột tài nguyên/trục là ngoài lưới (thả là huỷ)?
11. **H11 — Thời điểm bắt đầu**: sau khi #141 merge, cắt `feat/scheduler` từ `main` mới nhất và làm lại câu 5 trên `main` trước G1 (**đề xuất**)?

---

## Giới hạn và điểm chưa chắc

- Mọi số dòng là của nhánh `feat/calendar` và `feat/kanban-api` hiện tại, không phải `main`. Sẽ khác sau khi merge (nhất là khi H1 tách code khỏi component calendar).
- Câu 4 chỉ là ước lượng; số thật đo ở checkpoint 2.
- Câu 3: chưa kiểm thật rằng bundle của trang Scheduler không kéo theo lớp `SdCalendar`; kiểm ở checkpoint 6.
- Cách giảm 3 (`DragDrop.createDrag` trong `pointerdown`) dựa trên thứ tự `pointerdown` trước `mousedown`/`touchstart`; chưa thử với CDK 19 và cảm ứng.
- Cách giảm 4 (`content-visibility`) chưa thử với ô dính trái trong hàng và với in.
- RTL: phép tính `cx` dựa trên `scrollLeft` âm ở RTL (Chromium, Firefox, WebKit hiện tại); sẽ có test RTL ở SCH-C-14 và E2E.
- HTML `SD Scheduler Design.dc.html` mới lướt (mục 08–09). Sẽ mở đầy đủ và chụp đối chiếu ở checkpoint 2 và G-final.
- Không chạy được VoiceOver/NVDA (như calendar): phần trình đọc màn hình ghi "chờ PD".
