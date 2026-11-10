# sd-calendar · Bước 0 (G0)

Nhánh `feat/calendar` (cắt từ `main @ e501644f`, worktree `calendar-scheduler-kanban-063e68`). Chưa có commit nào.
Đã đọc: gói `schedule-kanban/` (PROMPT, SHARED-CONTRACT, TESTING, REVIEW), `design-calendar/` (README, PROMPT, `calendar.md`, ADDENDUM), và code thật: `components/file-explorer/**`, `components/timeline/**` (mới nhất, đã lấy `dataSource.onLoad` + `sdLoadError`), `components/table/src/models/table-option*.ts`, `forms/date|date-range|datetime|time|time-range`, `forms/models` (`sd-temporal-transform.ts`, `sd-calendar-day.ts`), `services/date-time/**`, `components/data-state`, `components/button`, `forms/segmented`, `assets/scss/themes/*`, `upload-file.configuration.ts`, `card.configuration.ts`, `sd-core.configuration.ts`, `i18n/src/vi.ts`, showcase (`documentation.registry.ts`, `playwright.config.ts`, `e2e/`). HTML `.dc.html` sẽ mở và chụp đối chiếu ở checkpoint 2 và G-final (§9 TESTING); kế hoạch dưới đây lấy `calendar.md` + phụ lục làm nguồn.

## A. Mâu thuẫn giữa các nguồn — PD đã chốt 08/11/2026: Q1–Q4 theo cột “Đề xuất”

| # | Điểm | Nguồn mâu thuẫn | Đề xuất (đã chốt) |
| --- | --- | --- | --- |
| Q1 | Phiên bản Node | Gói ghi `22.22.3`; `AGENTS.md` + CI ghi exact `24.22.1`; máy hiện chạy `26.12.0` (có Node 22.22.3 portable ở `C:\tmp\n22`, không có 24.22.1). | Theo `AGENTS.md`: CI `24.22.1` là cổng chuẩn. Local chạy Node 26 và ghi rõ trong báo cáo. |
| Q2 | Live region | `calendar.md` §6 cho tiêu đề `aria-live="polite"`, §7 cho dải lỗi/thất bại `role="alert"`; SC-33 chỉ cho **một** live region `role="status"` mỗi instance. | Theo SC-33 (ưu tiên cao hơn): tiêu đề là chữ thường; dải lỗi/thất bại không có `role="alert"`; đổi khoảng, lỗi tải, từ chối, lỗi lưu đều đọc qua một vùng `role="status"`. |
| Q3 | `droppable` (SC-08, test `CAL-SC-08`) | SC-07/SC-08 nêu `move.droppable`; `calendar.md` §3 không có `droppable` (chỉ scheduler thêm). | `CAL-SC-08` = N/A cho calendar (không thêm API ngoài spec). Vai trò tương đương là `minDate`/`maxDate` → test `out-of-range` (kéo, `Alt` + phím, `move()`). |
| Q4 | Nút thanh công cụ | §7 cần nhóm chế độ có `aria-pressed`, nút 32px (desktop) / 44px và 42px (hẹp). `sd-segmented` là form control `role="radiogroup"` (không `aria-pressed`); `sd-button` chỉ có 32/40/48px. | Dựng nút native trong template calendar (style bằng token), không dùng `sd-segmented`/`sd-button` cho thanh công cụ. Dải lỗi “Thử lại”/“Bỏ qua” cũng native (cao 28px). |

## B. Kế hoạch theo yêu cầu của `design-calendar/PROMPT.md`

### 1. File và commit

Thư mục `versions/v19/projects/sdcorejs-angular/components/calendar/`:
```
index.ts, ng-package.json, sd-calendar.md
src/calendar.model.ts            types §3 (+ 'cancel', sdLoadError theo phụ lục)
src/calendar.configuration.ts    ISdCalendarConfiguration, SD_CALENDAR_CONFIGURATION, defaults
src/calendar.templates.ts        4 directive template + ngTemplateContextGuard
src/calendar.utils.ts            hàm thuần (khoảng xem, ngày, xếp chồng, hàng cả ngày, làm tròn, kẹp, đọc/ghi ngày giờ)
src/calendar-move.ts             pipeline dời + quản lý một thao tác chờ, tách khỏi component (scheduler dùng lại, phụ lục 4.15)
src/calendar.component.ts|html|scss
src/*.spec.ts                    calendar.utils.spec, calendar.component.spec (+ tách file theo checkpoint nếu > ~1500 dòng),
                                 calendar.types.spec.ts, calendar.i18n.spec.ts
```
Sửa thêm: `components/index.ts` (barrel đang re-export mọi entry → thêm `calendar`), `assets/scss/themes/_component-tokens.scss` (5 token), `assets/THEME.md`, `i18n/src/{vi,en,ja,ko,zh}.ts`, `testing/` (helper chung, mục C), root `CHANGELOG.md` (`## [Unreleased]` → Added), showcase (trang demo, registry, spec đếm của registry và route-shell), `showcase/e2e/components/calendar/*.e2e.ts`. Rollout bằng `npm run sync`.

Commit (mỗi checkpoint: một commit test RED biên dịch được, đỏ vì assert; rồi một commit code xanh):

| CP | Commit RED | Commit xanh |
| --- | --- | --- |
| 1 | `test(calendar): pure helpers, i18n and type contract (RED)` (kèm khung model/config/templates/index với hàm stub trả giá trị rỗng để biên dịch) | `feat(calendar): entry point, model, pure helpers, tokens and i18n` |
| 2 | `test(calendar): rendering, data source and states (RED)` | `feat(calendar): toolbar, week/day/month/agenda rendering, onLoad lifecycle` → **R1** |
| 3 | `test(calendar): selection, create, move pipeline and keyboard (RED)` | `feat(calendar): selection, create, move pipeline, drag and resize, keyboard` |
| 4 | `test(calendar): recurring scope bar (RED)` | `feat(calendar): recurring occurrences and scope bar` |
| 5 | `test(calendar): compact, touch and print (RED)` | `feat(calendar): compact layout, touch, print, forced colors, reduced motion` |
| 6 | — (spec đếm showcase sửa cùng commit) | `docs(calendar): sd-calendar.md, THEME, CHANGELOG, showcase page and e2e` + `chore(calendar): sync v20/v21/v22` |
| B | — | `fix(calendar): … [CAL-B-xx]` sau R2 |

### 2. Bảng API consistency (mục 2 `calendar.md`, đối chiếu code `main @ e501644f`)

| Dòng spec | Code thật | Kết luận |
| --- | --- | --- |
| `option = input.required<SdCalendarOption<T>>()` | `SdFileExplorer.option = input.required<SdFileExplorerConfig<T>>()` | ✓ giống. |
| `option.dataSource.onLoad(args)` | file-explorer `dataSource.onList`; **sd-timeline `dataSource.onLoad({…, signal})`** (mới) | ✓ cùng tên với timeline. |
| `option.create = { creatable?, onCreate }` | file-explorer `capabilities.createFolder = { creatable?, onCreateFolder }` | ✓. |
| `option.move = { movable?, onMove }` | file-explorer `move = { movable?: State<MoveRequest>, onMove }` | ✓ tên. Khác có chủ đích: context của `movable` calendar là `SdCalendarEvent<T>` (đánh giá khi render, chưa có request); `onMove` thêm `'cancel'` (SC). |
| `SdCalendarState<C>` | `SdFileExplorerState<T> = boolean \| ((context: T) => boolean)` | ✓. |
| `SdCalendarEvent<T>` `id: string`, `data?: T` | `SdFileExplorerItem<T>`, `SdTimelineItem<T>` | ✓. |
| `source: 'drag' \| 'resize' \| 'keyboard' \| 'api'` | file-explorer `'drag' \| 'menu' \| 'keyboard' \| 'api'` | ✓ như spec. |
| `reload()`, `move()` | file-explorer `reload()`, `moveFiles(items, target, source='api'): Promise<boolean>`; timeline `reload()` | ✓; `move(eventId, to, source='api')` như spec. |
| `minDate`/`maxDate`: `Date \| string \| 'TODAY'` | `SdDate` có `minDate`/`maxDate` (alias của input) **và** `min`/`max` | ✓ calendar chỉ có `minDate`/`maxDate`, không alias. Kiểu input: `SdCalendarDateInput \| 'TODAY' \| null \| undefined`. |
| `step` | `sd-time`/`sd-time-range` `step` (phút) | ✓. |
| `transform: SdTemporalValueTransform` | `forms/models` export | ✓ import type. |
| `workingHours` dùng `SdTimeRangeValue` | `{ readonly from?: string \| null; readonly to?: string \| null }` | ✓ import type-only. Khoảng thiếu `from`/`to` hoặc `from >= to` bị bỏ (dev warn một lần). Giờ đọc bằng `sdTimeToMinutes` của `forms/time` (từ chối `24:00`); calendar nhận thêm `to: '24:00'` = hết ngày. |
| `sdRangeChange`/`onLoad` `{ from, to }` | `SdDateRangeValue { from?, to? }` | ✓ dạng `'yyyy/MM/dd'`, nhưng `SdCalendarVisibleRange` có `from`/`to` bắt buộc + `view`. |
| `firstDayOfWeek` | `DateAdapter.getFirstDayOfWeek()` | ✓ số 0–6. |
| `color: Color \| string` | `Color` của `@sdcorejs/utils/models` = 6 giá trị (không có `black`) | ✓ (phụ lục giữ `Color \| string`). |
| `disabled`, `readonly` `booleanAttribute`; `ariaLabel`, `autoId` `string \| null \| undefined` | `SdDate`, `SdSegmented` | ✓ (timeline dùng `ariaLabel: string \| undefined`; calendar theo SC-39). |
| Output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError`, **`sdLoadError`** | timeline `sdLoadError = output<unknown>()` | ✓. |
| `data-autoid="components-calendar-{autoId}"` | file-explorer `components-file-explorer-…`, con dùng `sdFileExplorerSafeId` (thay ký tự lạ bằng `-`) | ✓ gốc. Con theo SC-38: `encodeURIComponent(id)` (khác file-explorer, đúng hợp đồng chung). |
| i18n `core.component.calendar.*` | namespace có sẵn | ✓. |
| `SD_CALENDAR_CONFIGURATION` / `ISdCalendarConfiguration` | `SD_CORE_CONFIGURATION`/`ISdCoreConfiguration`, `SD_TABLE_CONFIGURATION`/`ISdTableConfiguration`; sd-card (mới) dùng `SdCardConfiguration` không có `I` | ✓ giữ `ISd…` như spec (đa số repo). File `src/calendar.configuration.ts` như sd-card (upload-file đặt trong `src/configurations/`). |

Mọi tên khác giữ đúng spec. Không có tên nào cần đổi.

### 3. Đọc và ghi ngày giờ

Biểu diễn nội bộ: **ngày** là chuỗi `'yyyy/MM/dd'` (so sánh bằng chuỗi), **giờ** là số phút 0–1440 của wall clock. Số học ngày làm trên số nguyên năm/tháng/ngày (`new Date(y, m - 1, d + n, 12)` dựng từ số, chỉ để lấy lại năm/tháng/ngày và thứ), không cộng 24 giờ, không `new Date(string)`.

| Việc | Hàm dùng lại |
| --- | --- |
| Đọc instant / chuỗi không zone (sự kiện có giờ) | `SdDateTimeService.toWallClock(value)` → carrier → ngày (`DateUtilities.toFormat(carrier, 'yyyy/MM/dd')`) + phút (`getHours`/`getMinutes` trên **carrier**, như chính service làm). `null` → sự kiện không hợp lệ. |
| So `end <= start` (hợp lệ) | `SdDateTimeService.parse` (instant). |
| Đọc ngày cả ngày, `holidays[].date`, `date`, `minDate`, `maxDate` | `ɵsdNormalizeCalendarDay(value, zoned ? dateTime : null)` của `forms/models` (đúng cách sd-date và sd-chip-calendar đọc). `'TODAY'` → `dateTime.today()`. |
| Qua nửa đêm | `end > beginOfNextDay(start)` theo `SdDateTimeService.beginOfNextDay`; kết thúc đúng 00:00 hôm sau → phút 1440 của ngày bắt đầu. |
| Carrier → model, không `transform` | `DateUtilities.toFormat(carrier, 'yyyy/MM/dd HH:mm:ss')` (cả ngày `'yyyy/MM/dd'`) — cùng định dạng model sd-datetime/sd-date. |
| Carrier → model, có `transform` | `sdSerializeTemporalValue(dateTime.fromWallClock(carrier), transform)` — đúng đường sd-date/sd-datetime (`fromWallClock` ở local trả bản sao, giống `sdLocalStartOfDay`). Cả ngày: carrier 00:00. |
| Hôm nay / bây giờ | `dateTime.today()`, `dateTime.now()`; timer 60 giây ngoài zone như sd-timeline. |
| Nhãn múi giờ | `Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })` như `SdTimeline.#zoneLabel`. |

Hàm đọc/ghi nằm trong `calendar.utils.ts`, nhận `Pick<SdDateTimeService, …>` (như `ɵSD_LOCAL_DATE_TIME`) để test thuần và để scheduler dùng lại. Không cần export thêm gì từ forms.

### 4. Kéo dời bằng CDK

- `cdkDrag` độc lập (không `cdkDropList`) trên từng khối; `[cdkDragDisabled]` khi không dời được; `[cdkDragStartDelay]="{ touch: 400, mouse: 0 }"`; ngưỡng 5px mặc định của CDK.
- Giữ khối gốc đứng yên bằng `cdkDragConstrainPosition`: hàm trả lại toạ độ gốc (`dimensions.left/top`) nên transform luôn 0, và **ghi lại toạ độ pointer thật** nó nhận được. `why:` CDK 19 phát `cdkDragMoved.pointerPosition` là toạ độ đã constrain, nên lấy pointer thật ở đây. Khối gốc vẽ thành khung nét đứt (opacity .55) trong lúc kéo; khối đề xuất là phần tử riêng `aria-hidden` ở cột/phút đề xuất, hết bề ngang cột.
- Tính đích từ pointer: cột = cột có `rect` chứa `x` (cache rect khi bắt đầu kéo, kẹp vào khoảng đang xem); phút = phút gốc + `round(Δy_đã_bù_cuộn / 48 × 60 / moveStep) × moveStep`, giữ thời lượng, kẹp `[0, 1440 − thời lượng]`.
- Tự cuộn: vòng `requestAnimationFrame` ngoài zone khi pointer cách mép vùng cuộn ≤ 40px, tốc độ tỉ lệ, tối đa 16px/khung (CDK chỉ tự cuộn với drop list).
- Thả (`cdkDragEnded`): `event.source.reset()`; đích khác gốc và pointer trong lưới → pipeline `source: 'drag'`; ngoài lưới hoặc Esc (listener `keydown` trên document chỉ trong lúc kéo) → huỷ. Chặn `click` ngay sau khi kéo để không thành “chọn”.
- Chạm: `cdkDragStarted` từ touch → `navigator.vibrate?.(10)`.
- Không thấy cần pointer events thuần cho kéo dời; CDK dùng được với hai điểm trên.

### 5. Quét tạo và kéo mép

- Quét: `pointerdown` (pointer chính, `button === 0`, không trên khối) trên lớp lưới của cột → `setPointerCapture`; `pointermove` ≥ 5px → khối nét đứt; `pointerup` → `[min(a,b), max(a,b) + step]`; < 5px → một slot. Esc trong lúc quét → huỷ. `pointerType === 'touch'`: không quét, chỉ chạm (pointerup < 5px) tạo một slot; `pointercancel` (cuộn) → huỷ.
- Kéo mép: vùng 8px cuối khối (cảm ứng: chỉ khối đang chọn, vùng 24px). `mousedown`/`touchstart` trên vùng này gọi `stopPropagation()` để `cdkDrag` của khối không bắt đầu; `pointerdown` + `setPointerCapture`; `end` mới theo `moveStep`, tối thiểu `start + max(15, step khi step < 15)` theo spec, tối đa 1440; giờ trong khối cập nhật trực tiếp; thả → pipeline `source: 'resize'`.
- Bấm và kéo: dưới 5px là bấm (CDK không bắt đầu kéo; quét dùng cùng ngưỡng).

### 6. Dữ liệu và thao tác bất đồng bộ

- `onLoad`: như `SdTimeline.#load` — mỗi lần tạo `AbortController` mới, abort lần cũ, chỉ ghi kết quả khi controller còn là hiện hành và chưa abort. Đổi khoảng → xoá sự kiện, `phase = 'loading'`; `reload()` → giữ sự kiện, `phase = 'reloading'`. Lỗi → `phase = 'error'`, `sdLoadError.emit(error)` (không khi abort). Đồng bộ và `Promise` dùng chung `await`.
- Một thao tác chờ: `#pending = signal<{ kind: 'create' | 'move'; controller; … } | null>`. Tạo/dời mới khi đang chờ → bỏ qua, `move()` trả `false`. Huỷ dời khi: khoảng xem đổi, `reload()`, `option` đổi tham chiếu, `disabled`/`readonly` bật, destroy. Huỷ tạo khi: `option` đổi, destroy (theo `calendar.md` §3 `SdCalendarCreateArgs`).
- Sau khi chấp nhận: `#events.update(list => list.map(e => e.id === id ? { ...e, start, end, allDay } : e))` với `to` đã serialize; `data` giữ tham chiếu; không sửa mảng consumer. `following`/`all` → `reload()` sau khi thay.
- So với sd-file-explorer `#performMove`: giống ở việc kiểm tra `controller.signal.aborted` + callback còn là hiện hành sau `await`, `finally` chỉ dọn khi controller còn của mình. Khác: calendar không refresh sau khi chấp nhận (thay tại chỗ), có `'cancel'`, có dải thất bại thay vì `moveStatus`.
- Focus (9.5 bước 10, SC-29/30/31): lưu `{ eventId, keyboard: boolean }` khi bắt đầu. Xong (mọi kết quả) và `keyboard` → nếu `document.activeElement` vẫn là khối đó, `body`, hoặc phần tử bị gỡ khỏi DOM → `afterNextRender` focus khối `[data-event-id]` (kể cả khi đã sang khoảng khác). Người dùng đã focus chỗ khác → không đụng. `'api'` không lấy focus.
- Pipeline dời đặt trong `calendar-move.ts` (class thuần nhận các hook: đánh giá `movable`, hỏi phạm vi, áp kết quả, thông báo), component chỉ nối signal. Scheduler dùng lại không cần sửa calendar.

### 7. Signal / computed / effect

- `#config` = input → `SD_CALENDAR_CONFIGURATION` → mặc định (`step` 30, `firstDayOfWeek` 1, `workingHours` T2–T6 08:00–12:00 + 13:00–17:30, `holidays` []).
- `activeView` = `view` nếu thuộc `views`, không thì `views[0]`; `anchor` = `date` đã chuẩn hoá hoặc hôm nay; `compact` từ `ResizeObserver` (guard `typeof ResizeObserver`).
- `visibleRange = computed(…, { equal: so from/to/view })`; `loadRange` (compact + week → day). `days`, `parsedEvents` (lọc theo khoảng; không hợp lệ bỏ + warn), `validity` (id trùng/rỗng, title rỗng), `timedLayout` theo ngày (8.4), `allDayRows` (tối đa 3 + “+N”), `monthCells`, `agendaGroups`.
- `effect` (một cái) theo `[option, loadRange]`: trong `untracked` abort thao tác chờ, gọi `#load`, phát `sdRangeChange` nếu khoá `from|to|view` khác lần phát trước → không phát lặp khi URL đặt lại cùng giá trị.
- `effect` theo `disabled`/`readonly` bật → abort dời chờ.
- `effect` theo nhóm chế độ (Tuần/Ngày vs khác): khi vào lại → `afterNextRender` cuộn `scrollTime` (không chạy khi chỉ đổi tuần).
- `selectedId` về `null` khi id không còn trong dữ liệu đã tải: chỉ ghi khi giá trị khác (không vòng).
- Không gọi API trong `computed`; không `setTimeout` chờ render.

### 8. Bàn phím

- Lưới Tuần/Ngày: phần tử `role="group"` `tabindex="0"` với `aria-activedescendant` = id phần tử con trỏ (một phần tử duy nhất, `aria-label` “Thứ Năm 22/10, 14:30”). State con trỏ `{ day, minutes }`; chỉ hiện khi focus bằng bàn phím (`:focus-visible` của lưới). Mỗi lần đổi đọc qua live region. Tự cuộn tính cả phần sticky.
- Tháng: `role="grid"`, roving `tabindex` (một ô `0`, còn lại `-1`), focus ô bằng `afterNextRender`.
- Sự kiện: `role="button"`, phím theo 9.7; mũi tên không `Alt` không làm gì.
- RTL: đọc `getComputedStyle(host).direction` lúc nhấn phím (`Directionality` của CDK 19 chỉ theo `document.dir`, không thấy `dir="rtl"` đặt trên phần tử cha).

### 9. Nút chuyển chế độ, Hôm nay, nút icon

Theo Q4: nút native trong template calendar. Nhóm chế độ `role="group"` + `aria-label`, mỗi nút `aria-pressed`. “Hôm nay”, ‹ › là `<button>`; icon qua `sd-icon`. Kích thước theo §7 và §12 (44/42px ở giao diện hẹp, `--sd-control-height-coarse`).

### 10. Token

Thêm vào `$component-tokens` (cặp light/dark giống nhau vì trộn từ palette của scope):
```scss
// calendar — grid lines, off hours, now line and today marker, mixed from the palette of the scope.
'calendar-line': (color-mix(in srgb, var(--sd-border) 55%, var(--sd-surface)), <same>),
'calendar-line-half': (color-mix(in srgb, var(--sd-border) 25%, var(--sd-surface)), <same>),
'calendar-off-hours': (color-mix(in srgb, var(--sd-surface-muted) 45%, var(--sd-surface)), <same>),
'calendar-now': (var(--sd-error), var(--sd-error)),
'calendar-today': (var(--sd-primary), var(--sd-primary)),
```
Biến kích thước trên `:host`: `--sd-calendar-hour-height: 48px`, `--sd-calendar-gutter-width: 56px` (compact 48px), `--sd-calendar-event-radius: var(--sd-radius-6, 6px)`.
Literal → token thang: radius 4/6/8/10/12 → `--sd-radius-*`; chữ 11/12/13/14/16/18 → `--sd-font-size-*`; line-height 16/24 → `--sd-line-height-*`; nút 32px → `--sd-control-height-sm`, 44px → `--sd-control-height-coarse`; bóng hover/chọn/kéo → `--sd-shadow-sm`/`-md`/`-lg`; vòng focus → `--sd-focus-ring-width|offset|color`. Mọi `var()` có fallback; không hex mới.

### 11. i18n

Mọi key §15 dưới `core.component.calendar.*`, đủ vi/en/ja/ko/zh. Dùng lại `core.common.cancel` (nút Huỷ của thanh hỏi phạm vi). Repo không có key chung cho “Thử lại”, “Bỏ qua” (chỉ có theo component, như `core.component.timeline.retry`) → thêm `core.component.calendar.retry`, `core.component.calendar.dismiss`.
Đề xuất thêm 3 key không có trong bảng §15 nhưng spec cần: `title-day` (“{weekday}, {day} tháng {month}, {year}” / “{weekday}, {monthName} {day}, {year}”), `more-short` (“+{count}” của hàng cả ngày), `today-marker` không cần (dùng `today`).

### 12. Ảnh hưởng

- Entry point mới `@sdcorejs/angular/components/calendar`; `components/index.ts` thêm `export * from '@sdcorejs/angular/components/calendar'`.
- Không đổi API component khác. Không thêm dependency (CDK drag-drop đã có).
- Showcase: trang `components/calendar` trong `documentation.registry.ts`; sửa số đếm trong `documentation.registry.spec.ts` và `scripts/generate-showcase-route-shells.test.mjs`. `published-docs` không đụng (sinh lúc release).
- `npm run sync` sang v20/v21/v22.

### 13. Phụ lục mục 3: API đợt 1 đủ cho P2

1. Tạo bằng drawer không route: `onCreate` trả Promise; khối nét đứt giữ trong lúc chờ; `void` → huỷ. Đủ. Showcase có ví dụ drawer `@if`.
2. Dời có hoàn tác: `request.from` là `SdCalendarRange { start, end, allDay }`, gán thẳng được cho `move(id, to)`; `'api'` không hỏi phạm vi, trả `Promise<boolean>`. Đủ. Giới hạn ghi trong doc: hoàn tác sau `following`/`all` chỉ dời lần này (`scope: 'this'`).
3. Đồng bộ URL: `view`/`date` là `model`; `sdRangeChange` không phát lặp khi khoảng không đổi. Đủ.
4. Bộ lọc chung: `option` mới hoặc `reload()`. Đủ.
5. Mobile theo bề rộng host: có, ghi rõ trong `sd-calendar.md`.
Không cần thêm API.

### 14. Tên đã đổi từ `773d7de` tới `main @ e501644f`

98 commit. Các API mà spec dựa vào không đổi tên: model file-explorer (chỉ `utils` đổi), `SdTimeRangeValue`, `SdTemporalValueTransform`, `SdDateTimeService`, `sd-date` (`minDate`/`maxDate` vẫn là alias). Mới có: sd-timeline (`dataSource.onLoad` + `sdLoadError`, trùng quy ước calendar), sd-card (`SdCardConfiguration` không tiền tố `I`), drawer không route (#137). Không có tên nào trong bảng mục 2 phải đổi.

## C. Bổ sung của cổng G0 (`schedule-kanban/PROMPT.md`)

### Helper test dùng chung
Repo đã có `projects/sdcorejs-angular/testing/` (`test-utils.ts`: `createHostFixture`, `dispatch`, `setInput`, `findCssRule`…), spec import bằng đường dẫn tương đối, không publish. Đề xuất đặt helper mới ở đó thay vì `components/calendar/src/testing/`, để scheduler và kanban dùng chung mà không import chéo entry point (RX mục 4 cấm hai bản giống nhau):
`testing/schedule-testing.ts`: `Deferred<T>`/`deferred()`, `FakeResizeObserver` (`trigger(width)`, cài/gỡ), `FakeIntersectionObserver` (`intersect(target)`), `stubNow(dateTime, '2026/11/09 10:40')`, `drag(el, to, { touch })` + `click3px`, `press(el, key, mods)`, `expectI18nParity(prefix)`. Không có runtime trong thư viện.

### axe
Showcase **không** có `@axe-core/playwright`. `versions/v19` có `axe-core@4.13.0` (devDependency, đang dùng trong `table.component.a11y.spec.ts`). Không thêm dependency; làm:
- Karma: chạy `axe.run` trên các trạng thái chính của component (như spec a11y của table).
- E2E: `page.addScriptTag({ path: 'versions/v19/node_modules/axe-core/axe.min.js' })` (job e2e của CI đã `npm ci` trong `versions/v19`), rồi `axe.run()` trong trang; không `serious`/`critical`.

### Playwright
`showcase/playwright.config.ts`: `testDir: ./e2e`, `testMatch: **/*.e2e.ts`, **chỉ Chromium**, hai project zone `asia-bangkok` và `utc`. Không có Firefox/WebKit → chạy Chromium và ghi lại. E2E calendar ở `showcase/e2e/components/calendar/*.e2e.ts`; zone khác (`America/New_York`, `Asia/Kolkata`, `Asia/Ho_Chi_Minh`) bằng `test.use({ timezoneId })` trong spec; mobile bằng `test.use({ viewport: 390×844, hasTouch, isMobile })`.

### Mã test theo checkpoint

| CP | Mã |
| --- | --- |
| 1 | CAL-U-01 … CAL-U-21; CAL-SC-37 (i18n parity); `calendar.types.spec.ts` (TESTING 3.7: `onMove` trả `'canceled'` bị từ chối, context template có kiểu, `onLoad` trả sai kiểu bị từ chối); CAL-C-23 (export). |
| 2 | CAL-C-01 … CAL-C-07, CAL-C-15, CAL-C-16, CAL-C-17 (phần hiển thị), CAL-C-19 (`aria-pressed`, `aria-busy`, `aria-label` khối), CAL-C-20, CAL-C-21, CAL-C-22; CAL-SC-01, CAL-SC-16 (lỗi tải), CAL-SC-22, CAL-SC-23, CAL-SC-24, CAL-SC-33, CAL-SC-38. |
| 3 | CAL-C-08 … CAL-C-12, CAL-C-14, CAL-C-17 (khoá thao tác), CAL-C-19 (`aria-activedescendant`); CAL-SC-02, 03, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16 (dời), 17, 18, 19, 20, 21, 26, 27, 28, 29, 30, 31. |
| 4 | CAL-C-13. |
| 5 | CAL-C-18; CAL-SC-32; CAL-SC-34, CAL-SC-35 và in (kiểm tra rule CSS bằng `findCssRule`). |
| G-final | CAL-E-01 … CAL-E-17 (E2E), axe, ảnh chụp §9, hiệu năng §10. |

N/A đề xuất: CAL-SC-08 (Q3), CAL-SC-25 (calendar không có `items`). CAL-SC-04, 05, 36, 39–45 kiểm tra bằng review/type test, có test khi đo được (vd SC-39 bằng type test và `booleanAttribute`).

### Giới hạn môi trường (cần PD biết)
- Không chạy được VoiceOver/NVDA: phần screen reader (§8 TESTING) sẽ ghi “chờ PD”; làm đủ phần bàn phím, phóng to 200%, `forced-colors`, kiểm tra cây trợ năng bằng Playwright.
- Hiệu năng đo trên máy local (Windows, Node 26), không phải máy CI.
- Review độc lập R1/R2/R2': subagent mới, không có lịch sử phiên này, chỉ nhận prompt `REVIEW.md` mục 6.
- Kanban (PR 2) làm sau calendar trong phiên này; scheduler (PR 3) chỉ làm Bước 0 cho tới khi calendar merge.
