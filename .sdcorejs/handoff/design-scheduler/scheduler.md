# sd-scheduler · thông số

Nguồn chính của gói. Khi HTML minh hoạ và file này khác nhau, làm theo file này.

sd-scheduler dùng lại phần lớn hợp đồng của sd-calendar. File này chỉ ghi phần khác. Mọi chỗ ghi “như calendar X” nghĩa là làm đúng mục X của `calendar.md` (gói `.sdcorejs/handoff/design-calendar/`, kèm `ADDENDUM-2026-11-08.md`), chỉ thay tên `calendar` → `scheduler` và `SdCalendarEvent` → `SdSchedulerEvent`.

## 0. Phạm vi

Điều kiện trước: `sd-calendar` đợt 1 đã merge. Nếu chưa, dừng ở Bước 0 và báo lại.

Làm:
- Entry point mới `@sdcorejs/angular/components/scheduler`, component `SdScheduler<T, R>`.
- 3 chế độ: Ngày (trục giờ), Tuần và Tháng (trục ngày).
- Cột tài nguyên dính trái, nhóm tài nguyên thu gọn được, trục thời gian dính trên.
- Tạo bằng quét hoặc bấm trên một hàng. Dời theo hai trục (thời gian, tài nguyên), kiểm tra hàng đích trong lúc kéo. Đổi giờ kết thúc bằng mép phải. Bàn phím đầy đủ.
- Giờ làm việc theo component hoặc theo từng tài nguyên, ngày lễ, giờ hiện tại, múi giờ theo `SdDateTimeService`.
- Lần lặp do consumer cung cấp và câu hỏi phạm vi, như calendar 9.6.
- Template ô cho Tuần và Tháng (bảng chấm công).
- Giao diện hẹp (< 600px bề rộng host), cảm ứng.
- Đang tải, lỗi tải, không có tài nguyên, readonly, disabled, khoá từng sự kiện.

Không làm:
- Virtual scroll. Giới hạn khuyến nghị 150 tài nguyên; ghi trong `sd-scheduler.md`.
- Tuần có trục giờ, chế độ Danh sách, khoảng tuỳ chọn (3 ngày, 2 tuần).
- Một sự kiện thuộc nhiều tài nguyên.
- Kéo mép trái, kéo giữa hai component, kéo từ danh sách ngoài vào lịch.
- Cột phụ ngoài cột tài nguyên (tổng công, sức chứa). Consumer đặt vào `sdSchedulerResourceTemplate`.
- In, xuất `.ics`, xuất Excel.
- Form tạo hay sửa sự kiện (như calendar).

## 1. Vị trí file

```
versions/v19/projects/sdcorejs-angular/components/scheduler/
  index.ts
  ng-package.json
  sd-scheduler.md                   // tài liệu public (tiếng Anh)
  src/
    scheduler.component.ts | .html | .scss | .spec.ts
    scheduler.model.ts
    scheduler.templates.ts
    scheduler.utils.ts | .spec.ts    // chỉ phần riêng: xếp lane theo hàng, toạ độ ngang, bỏ qua hàng droppable
```

Hàm thuần của calendar (khoảng xem, làm tròn theo step, đọc và ghi ngày giờ, xếp hàng nhiều ngày) và pipeline dời **không viết lại**. Bước 0 đề xuất cách dùng chung (mục 19, câu 1). Thêm `scheduler` vào `components/index.ts` nếu file đó re-export các entry point khác. Thêm `sd-scheduler.md` vào `documentation.registry.ts`.

## 2. Quy ước API

Mẫu là sd-calendar (đã review), rồi tới sd-file-explorer và sd-table như calendar 2. sd-kanban chưa review, không dùng làm mẫu.

| Public API | Theo | Khác calendar |
| --- | --- | --- |
| `option = input.required<SdSchedulerOption<T, R>>()` | `SdCalendarOption` | Thêm `move.axis`, `move.droppable`. |
| `resources = input.required<readonly SdSchedulerResource<R>[]>()` | `items` của sd-table | Mới. Tài nguyên là input, không đi qua `dataSource`. |
| `SdSchedulerResource<R>`: `id: string`, `data?: R` | `SdFileExplorerItem<T>` | Mới. |
| `SdSchedulerEvent<T> extends SdCalendarEvent<T>` | `SdCalendarEvent` | Thêm `resourceId: string`. |
| `SdSchedulerRange extends SdCalendarRange` | `SdCalendarRange` | Thêm `resourceId`. |
| `dataSource.onLoad(args)` | calendar | `args` thêm `resourceIds`. |
| `create = { creatable?, onCreate }` | calendar | Context của `creatable` có `resource`. |
| `move = { movable?, axis?, droppable?, onMove }` | calendar, sd-file-explorer | `axis`, `droppable` mới. Đối chiếu tên ở Bước 0. |
| `SdCalendarState<C>` | calendar | Import, không khai báo lại. |
| `SdCalendarWorkingHours`, `SdCalendarHoliday` | calendar | Import. Tài nguyên có `workingHours` riêng. |
| `SD_CALENDAR_CONFIGURATION` | calendar | Dùng chung, không có token cấu hình riêng. |
| Output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError` | calendar | Payload kiểu scheduler. |
| Output `sdCellSelect` | `sdSelect` | Mới, chỉ khi có template ô. |
| `reload()`, `move()` | calendar | `move()` nhận `resourceId`. |
| `data-autoid="components-scheduler-{autoId}"` | calendar | |
| i18n `core.component.scheduler.*` | calendar | Chuỗi trùng nghĩa dùng lại `core.component.calendar.*` (mục 14). |

## 3. Model

```ts
import type {
  SdCalendarEvent, SdCalendarRange, SdCalendarState, SdCalendarMoveSource,
  SdCalendarMoveScope, SdCalendarWorkingHours, SdCalendarHoliday, SdCalendarDateInput,
} from '@sdcorejs/angular/components/calendar';

export type SdSchedulerView = 'day' | 'week' | 'month';
export type SdSchedulerMoveAxis = 'both' | 'time' | 'resource';

export interface SdSchedulerResource<R = unknown> {
  /** Duy nhất trong resources. */
  id: string;
  /** Không rỗng; tên đọc cho trình đọc màn hình. */
  title: string;
  description?: string;
  /** Nhãn nhóm. Cùng chuỗi thì cùng nhóm; thứ tự nhóm theo lần xuất hiện đầu tiên. */
  group?: string;
  /** Tên Material Symbols. Bỏ qua khi có avatar. */
  icon?: string;
  /** URL ảnh. Có thì hiện sd-avatar (ảnh, chữ viết tắt từ title khi ảnh lỗi). */
  avatar?: string;
  /** Ghi đè workingHours của component cho riêng tài nguyên này. null: không tô ngoài giờ. */
  workingHours?: SdCalendarWorkingHours | null;
  data?: R;
}

export interface SdSchedulerEvent<T = unknown> extends SdCalendarEvent<T> {
  /** Đúng một tài nguyên. Không có trong resources thì bỏ qua sự kiện, cảnh báo ở dev mode. */
  resourceId: string;
}

export interface SdSchedulerRange extends SdCalendarRange {
  readonly resourceId: string;
}

export interface SdSchedulerVisibleRange {
  readonly from: string; // 'yyyy/MM/dd'
  readonly to: string;   // 'yyyy/MM/dd', gồm cả hai đầu
  readonly view: SdSchedulerView;
}

export interface SdSchedulerLoadArgs extends SdSchedulerVisibleRange {
  /** Theo thứ tự của resources. Gồm cả tài nguyên trong nhóm đang thu gọn. */
  readonly resourceIds: readonly string[];
  readonly signal: AbortSignal;
}

export interface SdSchedulerCreateContext<R = unknown> extends SdSchedulerRange {
  readonly resource: SdSchedulerResource<R>;
}

export interface SdSchedulerCreateArgs<R = unknown> extends SdSchedulerCreateContext<R> {
  readonly signal: AbortSignal;
}

export interface SdSchedulerDropContext<T = unknown, R = unknown> {
  readonly event: SdSchedulerEvent<T>;
  readonly to: SdSchedulerRange;
  readonly resource: SdSchedulerResource<R>;
}

export interface SdSchedulerMoveRequest<T = unknown, R = unknown> {
  readonly event: SdSchedulerEvent<T>;
  readonly from: SdSchedulerRange;
  readonly to: SdSchedulerRange;
  /** Tài nguyên đích. Bằng tài nguyên gốc khi chỉ đổi giờ. */
  readonly resource: SdSchedulerResource<R>;
  readonly source: SdCalendarMoveSource;
  readonly scope: SdCalendarMoveScope | null;
  readonly signal: AbortSignal;
}

export interface SdSchedulerMoveError<T = unknown, R = unknown> {
  readonly request: SdSchedulerMoveRequest<T, R>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

export interface SdSchedulerCellSelect<T = unknown, R = unknown> {
  readonly resource: SdSchedulerResource<R>;
  readonly date: string; // 'yyyy/MM/dd'
  readonly events: readonly SdSchedulerEvent<T>[];
}

export interface SdSchedulerOption<T = unknown, R = unknown> {
  dataSource: {
    onLoad: (args: SdSchedulerLoadArgs) => readonly SdSchedulerEvent<T>[] | Promise<readonly SdSchedulerEvent<T>[]>;
  };
  create?: {
    creatable?: SdCalendarState<SdSchedulerCreateContext<R>>;
    onCreate: (args: SdSchedulerCreateArgs<R>) => SdSchedulerEvent<T> | void | Promise<SdSchedulerEvent<T> | void>;
  };
  move?: {
    movable?: SdCalendarState<SdSchedulerEvent<T>>;
    /** 'time': chỉ đổi giờ, không đổi tài nguyên. 'resource': chỉ đổi tài nguyên, không kéo ngang, không kéo mép. Mặc định 'both'. */
    axis?: SdSchedulerMoveAxis;
    /** Chạy đồng bộ trong lúc kéo, mỗi khi hàng hoặc slot đích đổi. Không gọi API ở đây; kiểm tra cuối vẫn là onMove. */
    droppable?: SdCalendarState<SdSchedulerDropContext<T, R>>;
    /** true/void: chấp nhận. false: từ chối. 'cancel': người dùng huỷ trong luồng của consumer, về chỗ cũ không báo lỗi. Throw: lỗi. */
    onMove: (request: SdSchedulerMoveRequest<T, R>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}
```

Thay `option` hoặc `resources` bằng tham chiếu mới thì tải lại (gọi `onLoad`). Component không theo dõi thay đổi bên trong mảng hay object.

## 4. Input, output, method

### 4.1 Input

| Input | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `option` | `SdSchedulerOption<T, R>` | bắt buộc | |
| `resources` | `readonly SdSchedulerResource<R>[]` | bắt buộc | Rỗng: trạng thái trống, không gọi `onLoad`. |
| `view` | `SdSchedulerView` | `'day'` | `model()`. Không thuộc `views` thì lấy phần tử đầu. |
| `views` | `readonly SdSchedulerView[]` | `['day','week','month']` | |
| `resourceLabel` | `string \| null \| undefined` | `core.component.scheduler.resources` | Chữ ở ô góc. |
| `date`, `selectedId` | như calendar | | `model()`. |
| `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours`, `holidays`, `minDate`, `maxDate`, `dimPast`, `transform`, `disabled`, `readonly`, `ariaLabel`, `autoId` | như calendar 4.1 | như calendar | Cùng thứ tự ưu tiên input → `SD_CALENDAR_CONFIGURATION` → mặc định. |
| `scrollTime` | `string` | như calendar | Cuộn ngang ở Ngày (mục 6). |

Khoá tạo và dời như calendar 4.1. Thêm: không có tài nguyên.

### 4.2 Output

| Output | Payload | Khi nào |
| --- | --- | --- |
| `sdSelect` | `SdSchedulerEvent<T>` | Như calendar. |
| `sdRangeChange` | `SdSchedulerVisibleRange` | Như calendar. Không phát khi chỉ `resources` đổi. |
| `sdMove` | `SdSchedulerMoveRequest<T, R>` | Như calendar. |
| `sdMoveError` | `SdSchedulerMoveError<T, R>` | Như calendar. |
| `sdLoadError` | `unknown` | `onLoad` throw hoặc reject (cùng lúc với dải lỗi). Không phát khi bị huỷ. |
| `sdCellSelect` | `SdSchedulerCellSelect<T, R>` | Chỉ khi chế độ hiện tại có `sdSchedulerCellTemplate`: bấm, chạm, Enter trên ô có ít nhất một sự kiện. Ô trống thì đi đường tạo (9.2). |

### 4.3 Method

- `reload()`: như calendar.
- `move(eventId, to: { start; end?; allDay?; resourceId? }, source = 'api'): Promise<boolean>`: như calendar. Thiếu `resourceId` thì giữ tài nguyên. Trả `false` thêm khi `resourceId` không có trong `resources`, hoặc trái với `axis`. Không chạy `droppable` (consumer gọi thì consumer tự chịu); vẫn gọi `onMove`.

## 5. Giá trị ngày giờ

Như calendar 5. Thêm: sau khi dời được chấp nhận, sự kiện được thay bằng `{ ...event, start: to.start, end: to.end, allDay: to.allDay, resourceId: to.resourceId }`; `data` giữ nguyên tham chiếu.

## 6. Khoảng xem và điều hướng

| Chế độ | Khoảng | ‹ › | Tiêu đề (vi) |
| --- | --- | --- | --- |
| Ngày | ngày `date` | ±1 ngày | “Thứ Hai, 09 tháng 11, 2026” |
| Tuần | 7 ngày từ `firstDayOfWeek` chứa `date`; `hideWeekends` bỏ cột T7, CN nhưng `from`/`to` vẫn là cả tuần | ±1 tuần | như Tuần của calendar |
| Tháng | ngày 1 tới ngày cuối tháng của `date` (28–31 cột), không có ngày của tháng kề | ±1 tháng | “Tháng 11, 2026” |

Định dạng tiêu đề lấy từ hàm của calendar. Cuộn ban đầu:
- Ngày: `scrollLeft = phút(scrollTime) / 60 × hourWidth`. Chạy khi khởi tạo, khi vào Ngày từ chế độ khác; không chạy khi chỉ chuyển ngày.
- Tuần, Tháng: nếu hôm nay nằm trong khoảng và cột hôm nay bị khuất thì cuộn để cột đó nằm sát mép trái vùng lưới.
- Dọc: giữ `scrollTop` khi chuyển khoảng và chế độ.

## 7. Bố cục và kích thước

Font, quy tắc literal và token như calendar 7. Biến trên `:host`: `--sd-scheduler-resource-width: 240px`, `--sd-scheduler-hour-width: 80px`, `--sd-scheduler-day-min-width: 120px` (Tuần), `--sd-scheduler-month-day-min-width: 28px`, `--sd-scheduler-row-min-height: 48px`, `--sd-scheduler-lane-height: 28px`, `--sd-scheduler-event-radius: 6px` (theo thang nếu có `6`). Giao diện hẹp ghi đè ở mục 11.

| Phần | Thông số |
| --- | --- |
| Gốc | Như calendar: viền `--sd-border`, bo 12px, nền `--sd-surface`, `overflow: hidden`. |
| Thanh công cụ, thanh tiến trình, dải lỗi, dải thất bại | Như calendar 7. Nhóm chế độ có 3 nút theo `views`. |
| Vùng cuộn | Một phần tử cuộn cả hai trục. Chiều cao do host quyết định (`flex: 1; min-height: 0`); host không có chiều cao thì `max-height: 640px`. |
| Ô góc | Rộng bằng cột tài nguyên, `position: sticky; top: 0; left: 0`, z-index 4, nền `--sd-surface`. Chữ `resourceLabel` 12/16 500 `--sd-text-secondary`, đệm ngang 14px, rồi “· {số tài nguyên}” 400. |
| Trục thời gian | `position: sticky; top: 0`, z-index 3, nền `--sd-surface`, viền dưới `--sd-border`. Ngày: cao 40px, mỗi giờ một ô `hourWidth`, viền phải `--sd-calendar-line`, nhãn “08:00” 11/14 500 `--sd-text-secondary` cách vạch 6px; 24 ô. Tuần: cao 48px, thứ 11/14 500 giãn .04em cạnh số ngày 15/500 trong vòng 28px, gap 6px. Tháng: cao 48px, cột dọc: thứ 10/12 500, số 12/500 trong vòng 22px, chấm 4px cho ngày lễ `observance` (`title` có tên). Hôm nay: thứ màu `--sd-calendar-today`, vòng nền `--sd-calendar-today`, chữ `--sd-primary-contrast`. Ngày lễ `off`: nhãn thứ màu `--sd-error`. Bấm số ngày → `view='day'`, `date` = ngày đó. |
| Cột tài nguyên | Rộng `--sd-scheduler-resource-width`, `position: sticky; left: 0`, z-index 2, nền `--sd-surface`, viền phải `--sd-border`. Ô: đệm `0 12px 0 14px`, gap 10px, căn giữa dọc. Icon: khung 32px bo 8px, nền `color-mix(in srgb, var(--sd-text) 6%, var(--sd-surface))`, icon 18px `--sd-text-secondary`. Avatar: `sd-avatar` 28px. Tên 14/20 500, mô tả 12/16 `--sd-text-secondary`; mỗi dòng cắt bằng …, `title` đủ chữ. |
| Hàng nhóm | Cao 32px, rộng hết, viền dưới `--sd-calendar-line`, nền `--sd-surface`. Phần nhãn dính trái: icon `expand_more` 18px (thu gọn: `chevron_right`), nhãn 12/16 600 `--sd-text-secondary`, “· {n} {đơn vị}” 400. Là `button` với `aria-expanded`. Không vẽ lưới trong hàng nhóm. Không có `group` thì không có hàng nhóm. |
| Hàng tài nguyên | Cao `max(48, 8 + 32 × số lane)`; một lane thì khối ở `top: 10px`, từ hai lane khối ở `top: 6 + lane × 32`. Viền dưới `--sd-calendar-line`. |
| Lưới Ngày | Vạch giờ 1px `--sd-calendar-line` ở cuối mỗi giờ, vạch nửa giờ 1px `--sd-calendar-line-half`, cùng một `repeating-linear-gradient` theo `hourWidth`. Ngoài giờ làm việc, ngày nghỉ, ngày lễ `off`: nền `--sd-calendar-off-hours`, tính theo `resource.workingHours` nếu có. |
| Lưới Tuần, Tháng | Cột theo `grid-template-columns: repeat(n, minmax(<min>, 1fr))`, viền phải `--sd-calendar-line` (trừ cột cuối). T7, CN (theo `workingHours`), ngày lễ `off`: nền `--sd-calendar-off-hours` cả cột. |
| Giờ hiện tại | Chỉ ở Ngày khi đang xem hôm nay: vạch dọc 2px `--sd-calendar-now` qua mọi hàng (kể cả hàng nhóm), chấm 10px ở đầu ngay dưới trục giờ, z-index trên khối và dưới phần dính. Cập nhật mỗi 60 giây. |
| Khoảng trống quanh khối | Trái 1px, phải 2px (Ngày); trái 2px, phải 3px (Tuần, Tháng). Không chừa dải trống như calendar, vì hàng luôn có chỗ trống phía trên và dưới khối khi chỉ một lane; khi nhiều lane, tạo bằng bấm vào khoảng giờ không có khối. |

## 8. Khối sự kiện

### 8.1 Màu
Như calendar 8.1.

### 8.2 Nội dung theo bề rộng

Cao `--sd-scheduler-lane-height` (28px), đệm `0 8px`, gap 6px, chữ 12/16, `white-space: nowrap`.

| Bề rộng khối | Nội dung |
| --- | --- |
| ≥ 120px | Chấm, tên 600, giờ “10:00–11:30” 400 `--sd-text-secondary`. Tên co trước, giờ giữ nguyên. |
| 48–119px | Chấm, tên. |
| < 48px | Chỉ chấm. |

Tuần và Tháng: khối có giờ thay phần giờ bằng giờ bắt đầu đặt trước tên (“08:00 Tuyến Q1 – Q3”), chỉ khi khối ≥ 96px. Lần lặp có icon `repeat` 13px sau chấm. Mọi khối có `title` và `aria-label` đầy đủ (mục 14).

Toạ độ Ngày: `left = (phút bắt đầu trong ngày) / 60 × hourWidth + 1`, `width = thời lượng phút / 60 × hourWidth − 3`, tối thiểu 12px. Sự kiện cả ngày ở Ngày phủ 00:00–24:00. Sự kiện bị cắt bởi đầu hoặc cuối khoảng: cạnh đó vuông (`border-radius` 0 phía đó).

Toạ độ Tuần, Tháng: `left = cột đầu / số cột`, `width = số cột / số cột` (phần trăm), trừ khoảng trống ở mục 7. Khối có giờ chiếm một cột của ngày bắt đầu; sự kiện qua nửa đêm và cả ngày chiếm đủ các cột.

### 8.3 Trạng thái
Như calendar 8.3, đổi:
- Tay nắm: dọc 3×12px, bo 2px, màu event-color, cách mép phải 3px, căn giữa dọc.
- Đang kéo: không chiếm hết bề ngang; giữ bề rộng theo thời lượng ở vị trí đề xuất.
- Hàng đích hợp lệ trong lúc kéo: lớp phủ `color-mix(in srgb, var(--sd-primary) 6%, transparent)` trên vùng lưới của hàng.
- Hàng đích bị `droppable` từ chối: lớp phủ sọc `repeating-linear-gradient(135deg, color-mix(in srgb, var(--sd-text) 5%, transparent) 0 6px, transparent 6px 12px)`, ô tài nguyên `opacity: .5`, con trỏ `not-allowed`.
- Nhãn nổi trong lúc kéo và kéo mép: bên phải khối, cách 6px, nền `--sd-surface-inverse`, chữ `--sd-surface`, 11/14 500, đệm `2px 6px`, bo 4px, `aria-hidden`. Nội dung: “{tài nguyên} · 10:00 – 11:30” khi đổi hàng, “10:00 – 11:30” khi chỉ đổi giờ. Không đủ chỗ bên phải thì đặt bên trái.

### 8.4 Xếp lane (hàm thuần trong `scheduler.utils.ts`)
Cho từng tài nguyên, trên khoảng đang xem:
1. Lấy sự kiện của tài nguyên giao với khoảng. Ở Tuần, Tháng, khối có giờ được coi như chiếm `[ngày bắt đầu, ngày bắt đầu + 1)`.
2. Sắp theo `start` tăng; cùng `start` thì cả ngày trước, rồi `end` giảm.
3. Đặt mỗi sự kiện vào lane đầu tiên có `end` cuối cùng ≤ `start` của nó; không có thì mở lane mới.
4. Số lane của hàng = số lane đã mở, tối thiểu 1. Không giới hạn số lane.
5. Khối đang kéo, đang chờ, đang lưu không tham gia xếp lane của hàng đích; vẽ ở lane 0 của hàng đích, phía trên các khối khác. Hàng gốc giữ khung nét đứt ở lane cũ.
6. Thứ tự DOM: theo tài nguyên, rồi theo bước 2.

### 8.5 Template

| Directive | Selector | Context |
| --- | --- | --- |
| `SdSchedulerEventTemplateDirective` | `ng-template[sdSchedulerEventTemplate]` | `$implicit`, `event`, `range: SdSchedulerRange`, `resource`, `view`, `compact` (khối < 48px), `pending` |
| `SdSchedulerResourceTemplateDirective` | `ng-template[sdSchedulerResourceTemplate]` | `$implicit`, `resource`, `group: string \| null`, `compact` (giao diện hẹp) |
| `SdSchedulerCellTemplateDirective` | `ng-template[sdSchedulerCellTemplate]` | `$implicit` (`'yyyy/MM/dd'`), `date`, `resource`, `events`, `holiday`, `today`, `off`. Thuộc tính `views` của directive (mặc định `['week','month']`, không nhận `'day'`) chọn chế độ áp dụng. |
| `SdSchedulerEmptyTemplateDirective` | `ng-template[sdSchedulerEmptyTemplate]` | `$implicit: SdSchedulerVisibleRange` |

Mỗi directive có `static ngTemplateContextGuard`. Template sự kiện thay phần bên trong khối (như calendar 8.5). Template tài nguyên thay nội dung ô bên trái; khung, chiều rộng, phần dính vẫn do component vẽ. Template ô: ở chế độ được áp dụng, component không vẽ khối, không kéo, không kéo mép; ô là `role="gridcell"` bấm được (9.1, 9.2).

## 9. Tương tác

### 9.1 Chọn
Như calendar 9.1. Có template ô: bấm ô có sự kiện → `sdCellSelect`; không đặt `selectedId`.

### 9.2 Tạo
Như calendar 9.2, đổi:
- Quét theo chiều ngang trên một hàng tài nguyên. Pointer ra khỏi hàng thì khoảng vẫn tính theo trục ngang, hàng giữ nguyên.
- Ngày: làm tròn theo `step`, giới hạn trong ngày đang xem. Tuần, Tháng: theo ngày, `allDay: true`, khoảng `[min, max]` gồm cả hai đầu.
- `creatable` nhận `SdSchedulerCreateContext` (có `resource`). Đánh giá lại khi khoảng quét đổi.
- Không tạo trên hàng nhóm.
- Khối nét đứt chữ “Sự kiện mới” (`core.component.calendar.new-event`) và giờ theo 8.2.

### 9.3 Dời bằng kéo
Như calendar 9.3, đổi:
- Hai trục. Ngang: Ngày theo `moveStep = min(step, 15)`, kẹp `[00:00, 24:00 − thời lượng]` của ngày đang xem; Tuần, Tháng theo 1 ngày, giữ giờ bắt đầu và thời lượng, kẹp trong khoảng đang xem. Dọc: hàng tài nguyên dưới pointer (bỏ qua hàng nhóm; nhóm thu gọn không nhận).
- `axis: 'time'`: khoá dọc (`cdkDragLockAxis="x"`). `axis: 'resource'`: khoá ngang (`cdkDragLockAxis="y"`), giờ giữ nguyên.
- Mỗi lần hàng hoặc slot đích đổi: dựng `SdSchedulerDropContext`, chạy `droppable`. False → hàng đó vẽ trạng thái bị từ chối (8.3). Kết quả nhớ theo `(resourceId, start)` trong một lần kéo.
- Thả lên hàng bị từ chối, hàng nhóm, ngoài lưới, hoặc Esc: huỷ, khối về chỗ cũ, không gọi `onMove`, đọc `core.component.scheduler.drop-blocked` khi bị từ chối.
- Tự cuộn cả hai trục khi pointer cách mép vùng cuộn ≤ 40px (đã trừ phần dính), tốc độ như calendar.
- Có template ô ở chế độ hiện tại: không kéo.

### 9.4 Đổi giờ kết thúc
Như calendar 9.4, đổi:
- Vùng 8px ở mép phải, con trỏ `ew-resize`.
- Ngày: theo `moveStep`, tối thiểu như calendar, tối đa 24:00 của ngày bắt đầu.
- Tuần, Tháng: chỉ sự kiện cả ngày, theo 1 ngày, tối thiểu 1 ngày, tối đa ngày cuối khoảng. Khối có giờ không có tay nắm.
- `axis: 'resource'`: không có tay nắm.
- Cảm ứng: chỉ khối đang chọn, vùng chạm 24px, tay nắm 6×24px.

### 9.5 Pipeline dời
Như calendar 9.5, thêm trước bước 4:
- `to.resourceId` không có trong `resources`, hoặc trái `axis` → bỏ qua.
- Đánh giá `droppable` cho đích cuối. False → dừng như huỷ, đọc `drop-blocked`. (Kéo đã kiểm tra rồi; bước này cho `Alt` + phím.)

Kết quả `'cancel'`: như phụ lục calendar mục 6 (về chỗ cũ, không lỗi, không `sdMove`/`sdMoveError`, đọc `core.component.calendar.cancelled`).

Bước 6: `to` ở hàng nằm trong nhóm đang thu gọn thì mở nhóm đó. `to` ngoài khoảng đang xem thì đổi `date` như calendar.

### 9.6 Lần lặp
Như calendar 9.6. Câu hỏi phạm vi giữ nguyên chữ; đổi tài nguyên cũng hỏi.

### 9.7 Bàn phím
Lưới là một điểm Tab, `aria-activedescendant` như calendar 9.7. Con trỏ cao bằng hàng trừ 12px, rộng 1 `step` (Ngày) hoặc 1 cột (Tuần, Tháng), viền 2px `--sd-focus-ring-color`, nền `color-mix(in srgb, var(--sd-primary) 8%, transparent)`, bo 4px, nhãn giờ 10/12 500 góc trên trái.

| Phím trên lưới | Hành động |
| --- | --- |
| `←` `→` | Slot trước, sau. Mép → khoảng trước, sau. Đảo khi RTL. |
| `↑` `↓` | Tài nguyên trước, sau; bỏ qua hàng nhóm và nhóm thu gọn. |
| `Home` `End` | Ngày: đầu giờ làm, slot cuối trước khi hết giờ làm của tài nguyên đang đứng. Tuần, Tháng: cột đầu, cuối. |
| `Ctrl/Cmd` + `Home` `End` | Tài nguyên đầu, cuối. |
| `PageUp` `PageDown`, `T` | Như calendar. |
| `Enter` `Space` | Tạo (Ngày: 1 step; Tuần, Tháng: 1 ngày). Có template ô và ô có sự kiện: `sdCellSelect`. |

| Phím trên sự kiện | Hành động |
| --- | --- |
| `Enter` `Space`, `Esc` | Như calendar. |
| `Alt` + `←` `→` | Dời `moveStep` (Ngày) hoặc 1 ngày (Tuần, Tháng). Không có khi `axis: 'resource'`. |
| `Alt` + `↑` `↓` | Sang tài nguyên trên, dưới gần nhất mà `droppable` cho phép; không còn hàng thì không làm gì, đọc `drop-blocked`. Không có khi `axis: 'time'`. |
| `Alt` + `Shift` + `←` `→` | Đổi giờ kết thúc (9.4). |

Hàng nhóm là `button` có `tabindex="-1"`, nên không thêm điểm Tab. Bàn phím thu gọn hoặc mở rộng nhóm bằng `Alt` + `Enter` khi con trỏ lưới đứng trên một tài nguyên của nhóm đó; nhóm đang thu gọn thì `↑` `↓` dừng ở hàng nhóm và `Alt` + `Enter` mở lại. Ghi trong hướng dẫn phím ẩn (`grid-help`).

## 10. Nhóm tài nguyên

- Nhóm theo `resource.group`. Tài nguyên không có `group` đứng trước mọi nhóm, không có hàng nhóm.
- Trạng thái thu gọn là signal nội bộ (`Set<string>`), giữ khi đổi khoảng và chế độ, mất khi component bị huỷ. `resources` mới mà nhóm không còn thì bỏ khỏi set.
- Nhóm thu gọn: chỉ còn hàng nhóm; sự kiện của nhóm vẫn được tải; `resourceIds` vẫn có các tài nguyên đó.
- Số đếm: số tài nguyên của nhóm. Đơn vị đọc từ i18n `group-count` (“{count} tài nguyên”); consumer đổi chữ bằng template tài nguyên nếu cần “phòng”, “người”. Trong HTML minh hoạ ghi “3 phòng” để dễ đọc.

## 11. Giao diện hẹp và cảm ứng

- `compact` như calendar 12 (bề rộng host < 600px, `ResizeObserver`).
- Thanh công cụ 2 hàng như calendar 12; nhóm chế độ giữ đủ `views`.
- `--sd-scheduler-resource-width: 120px`: icon hoặc avatar 24px, tên 13/16 500 tối đa 2 dòng (`-webkit-line-clamp: 2`), ẩn mô tả.
- `--sd-scheduler-hour-width: 64px`; `--sd-scheduler-day-min-width: 96px`; Tháng giữ 28px.
- Kéo một ngón là cuộn. Chạm ô trống tạo một slot. Chạm giữ 400ms trên khối để nhấc lên, kéo theo hai trục như 9.3.
- Không có vuốt để chuyển ngày.
- Vùng chạm tối thiểu 44×44px cho nút. Hàng nhóm cao 44px.

## 12. Trạng thái của component

Như calendar 13, đổi:
| Trạng thái | Hiển thị |
| --- | --- |
| Đang tải lần đầu | Cột tài nguyên hiện ngay. Khối xương tĩnh (nền `--sd-surface-muted`, bo 6px, cao 28px) ở 3 hàng đầu, vị trí cố định. |
| `resources` rỗng | Thay vùng dưới trục thời gian: icon `event_busy` 28px `--sd-text-secondary`, “Không có tài nguyên nào” 14/500, cao tối thiểu 144px. `sdSchedulerEmptyTemplate` thay toàn bộ. Không gọi `onLoad`. |
| Dữ liệu không hợp lệ | Như calendar, thêm: `resources` có id trùng hoặc `title` rỗng. Sự kiện có `resourceId` không tồn tại: bỏ qua, cảnh báo dev mode, không phải lỗi. |

## 13. Token

Không thêm token màu. Dùng lại `--sd-calendar-line`, `--sd-calendar-line-half`, `--sd-calendar-off-hours`, `--sd-calendar-now`, `--sd-calendar-today` (calendar 14), luôn có fallback hex. Biến kích thước ở mục 7 khai báo trên `:host`. Ghi vào `THEME.md`: sd-scheduler dùng các token của calendar. `check:scss-hex` phải xanh.

## 14. Trợ năng và i18n

- Gốc `<section role="region">`, live region, `prefers-reduced-motion`, `forced-colors` như calendar 15.
- Vùng cuộn có `aria-label` = `ariaLabel`. Ô tài nguyên `role="rowheader"`, `id` để khối dùng trong `aria-describedby`.
- Nhãn khối: “{title}, {resource}, {weekday} {date}, {start} đến {end}[, lặp lại]”; cả ngày: “{title}, {resource}, cả ngày, {from} đến {to}”.
- Nhãn con trỏ: “{resource}, {weekday} {date}, {time}” (Ngày) hoặc “{resource}, {weekday} {date}” (Tuần, Tháng).
- Hàng nhóm: `aria-expanded`, `aria-label` “{group}, {count} tài nguyên”.

Dùng lại key `core.component.calendar.*` cho: `today`, `views`, `view-day`, `view-week`, `view-month`, `prev-*`/`next-*` theo ngày, tuần, tháng, `new-event`, `load-error`, `create-error`, `rejected`, `error`, `invalid-data`, các key phạm vi lặp, `pending`, `moved`, `resized`, `cancelled`, `out-of-range`, `weekday-*`. Key mới `core.component.scheduler.*`, đủ vi/en/ja/ko/zh:

| Key | vi | en |
| --- | --- | --- |
| `label` | Lịch theo tài nguyên | Resource schedule |
| `resources` | Tài nguyên | Resources |
| `group-count` | {count} tài nguyên | {count} resources |
| `group-expand` / `group-collapse` | Mở rộng {group} / Thu gọn {group} | Expand {group} / Collapse {group} |
| `empty` | Không có tài nguyên nào | No resources |
| `drop-blocked` | Không chuyển sang {resource} được | Can't move to {resource} |
| `moved-resource` | Đã chuyển sang {resource}, {start} | Moved to {resource}, {start} |
| `cursor-time` | {resource}, {weekday} {date}, {time} | {resource}, {weekday} {date}, {time} |
| `cursor-day` | {resource}, {weekday} {date} | {resource}, {weekday} {date} |
| `event-label` | {title}, {resource}, {weekday} {date}, {start} đến {end} | {title}, {resource}, {weekday} {date}, {start} to {end} |
| `event-label-all-day` | {title}, {resource}, cả ngày, {from} đến {to} | {title}, {resource}, all day, {from} to {to} |
| `grid-help` | Mũi tên để di chuyển, Enter để tạo. Alt + Enter để thu gọn nhóm. | Arrow keys to move, Enter to create. Alt + Enter to collapse the group. |
| `event-help` | Alt + mũi tên để dời, Alt + Shift + mũi tên để đổi giờ kết thúc. | Alt + arrow keys to move, Alt + Shift + arrow keys to change the end. |

## 15. E2E

Gốc: `data-autoid="components-scheduler-{autoId}"`, `data-view`, `data-from`, `data-to`. Hàng: `data-autoid="components-scheduler-{autoId}-resource-{token}"`, `data-resource-id`. Khối: `…-event-{token}`, `data-resource-id`, `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-selected`. Ô (Tuần, Tháng): `data-date`, `data-resource-id`. Token = `encodeURIComponent(id)`. Chỉ phát khi có `autoId`.

## 16. Spec phải viết trước (RED)

`scheduler.utils.spec.ts`
- Xếp lane: không giao, giao 2, bắc cầu 3, cùng `start`, kết thúc đúng lúc khối khác bắt đầu không giao, cả ngày đứng trước; Tuần, Tháng coi khối có giờ là một ngày.
- Toạ độ Ngày: trong ngày, cắt đầu, cắt cuối, cả ngày, qua nửa đêm; bề rộng tối thiểu.
- Toạ độ Tuần, Tháng: `hideWeekends`, tháng 28/30/31 ngày, thanh cắt hai đầu.
- Tìm hàng kế cho `Alt + ↑ ↓` bỏ qua hàng nhóm, nhóm thu gọn và hàng bị `droppable` từ chối.

`scheduler.component.spec.ts`
- Render 3 chế độ; `views`; `view` không hợp lệ.
- `onLoad` nhận `resourceIds` đúng thứ tự; gọi lại khi `resources` đổi tham chiếu; không gọi khi `resources` rỗng; `sdRangeChange` không phát khi chỉ `resources` đổi. Các trường hợp còn lại như calendar 18.
- Sự kiện có `resourceId` lạ: bỏ qua, có cảnh báo dev mode.
- Nhóm: thứ tự nhóm, tài nguyên không nhóm đứng đầu, thu gọn ẩn hàng nhưng vẫn tải, giữ khi đổi khoảng.
- Tạo: quét giữ hàng, `creatable` nhận `resource`, Tuần, Tháng ra `allDay: true`, không tạo trên hàng nhóm.
- Dời: đổi hàng → request có `from.resourceId`, `to.resourceId`, `resource`; `droppable` false → không gọi `onMove`; `axis: 'time'` không đổi hàng, `Alt + ↑ ↓` không làm gì; `axis: 'resource'` không đổi giờ, không tay nắm; sau khi chấp nhận, sự kiện có `resourceId` mới và `data` giữ tham chiếu; đích trong nhóm thu gọn → mở nhóm.
- `move()` với `resourceId` lạ hoặc trái `axis` → `false`.
- `onMove` trả `'cancel'`: khối về hàng và giờ cũ, không viền lỗi, không `sdMoveError`; `sdLoadError` phát khi `onLoad` lỗi, không phát khi abort.
- Đổi giờ kết thúc ở Ngày; ở Tuần, Tháng chỉ với cả ngày.
- Template ô: không vẽ khối, không kéo; bấm ô có sự kiện → `sdCellSelect`; ô trống → `onCreate`; `views` của directive.
- Template tài nguyên, template sự kiện, template trống: context đúng kiểu.
- `resource.workingHours` ghi đè tô ngoài giờ và `Home`/`End`.
- Bàn phím trên lưới hai trục; RTL.
- Compact: biến kích thước, ẩn mô tả, `cdkDragStartDelay` cảm ứng.
- A11y: `rowheader`, `aria-expanded`, nhãn khối có tên tài nguyên, live region `drop-blocked`.
- `data-autoid` chỉ có khi có `autoId`.

## 17. Showcase

Trang “Scheduler”, cùng khung các trang component khác. Bốn ví dụ, dữ liệu như HTML (hôm nay Thứ Hai 09/11/2026):
1. Đặt phòng họp: Ngày, nhóm theo tầng, `droppable` chặn phòng nhỏ hơn số người, `onCreate` mở dialog demo.
2. Xe giao hàng: Tuần, nhóm theo kho, khối có giờ và thanh nhiều ngày.
3. Nghỉ phép phòng ban: Tháng, avatar, `axis: 'time'`.
4. Chấm công: Tháng, `sdSchedulerCellTemplate` hiện mã công, cột tổng trong `sdSchedulerResourceTemplate`.

Công tắc: `view`, `step`, `hideWeekends`, `workingHours` bật/tắt, `holidays`, `dimPast`, `readonly`, `disabled`, nguồn dữ liệu client hoặc server (trễ 600ms, có tuỳ chọn ném lỗi), `onMove` chấp nhận, từ chối, ném lỗi, chậm 2 giây, `resources` rỗng. Ví dụ code cho cả bốn.

## 18. Checkpoint (mỗi checkpoint một commit)

1. Model, template directive, `scheduler.utils.ts` và spec (RED rồi xanh). Dùng lại hàm của calendar theo phương án đã duyệt ở Bước 0.
2. Render: 3 chế độ, cột tài nguyên, nhóm, phần dính, lưới, giờ làm việc, ngày lễ, giờ hiện tại, `dataSource`, trạng thái tải, lỗi, trống.
3. Chọn và tạo (quét, bấm, Enter), `creatable`.
4. Dời hai trục, `droppable`, `axis`, đổi giờ kết thúc, pipeline, lần lặp.
5. Bàn phím, a11y, giao diện hẹp, cảm ứng, template ô.
6. `sd-scheduler.md`, `THEME.md`, `CHANGELOG.md` (`## [Unreleased]` · Added), i18n 5 locale, showcase, `documentation.registry.ts`, E2E.

## 19. Câu hỏi cho Bước 0

1. Dùng chung code với calendar: export hàm thuần và pipeline từ `components/calendar` (public, đánh dấu `@internal`), hay tách entry point nội bộ? Ghi rõ ảnh hưởng tới ng-packagr và `check:sync`.
2. `move.droppable` và `move.axis`: sd-file-explorer hoặc component nào trong repo đã có khái niệm tương đương? Có thì đề xuất đổi tên theo đó.
3. Import type từ `@sdcorejs/angular/components/calendar` vào entry point scheduler có tạo phụ thuộc vòng hay làm bundle scheduler kéo theo component calendar không? Nếu có, đề xuất chỗ đặt type dùng chung.
4. Đo thời gian render 150 tài nguyên × 31 ngày, mỗi tài nguyên 3 sự kiện, trên showcase. Nếu > 100ms cho lần render đầu, đề xuất cách giảm trước khi code tiếp checkpoint 2.
5. Đối chiếu các tên ở mục 2 và mục 4 với `main` tại thời điểm làm (sau khi calendar merge). Ghi lại tên nào đã đổi.
