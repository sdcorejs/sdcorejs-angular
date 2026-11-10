# sd-calendar · thông số đợt 1

Đây là nguồn chính của gói. Khi HTML minh hoạ và file này khác nhau, làm theo file này. Mọi tên public đã đối chiếu với component có sẵn ở `main @ 773d7de` (mục 2).

## 0. Phạm vi

Đợt 1 gồm:
- Entry point mới `@sdcorejs/angular/components/calendar`, component `SdCalendar<T>`.
- 4 chế độ xem: Tháng, Tuần, Ngày, Danh sách.
- Tạo bằng bấm hoặc quét, dời bằng kéo, đổi giờ kết thúc bằng kéo mép dưới, bàn phím đầy đủ.
- Giờ làm việc, ngày lễ, giờ hiện tại, múi giờ theo `SdDateTimeService`.
- Hiển thị lần lặp do consumer cung cấp và hỏi phạm vi khi dời. Component **không** tự mở rộng RRULE.
- Giao diện hẹp (< 600px), cảm ứng, in.
- Đang tải, lỗi tải, danh sách trống, readonly, disabled, khoá từng sự kiện.

Ngoài phạm vi (đợt sau, không làm):
- Mở rộng RRULE phía client, `sd-recurrence`, xuất `.ics`.
- Kéo thả ở chế độ Tháng, kéo thanh cả ngày, kéo giữa hàng cả ngày và lưới giờ.
- `sd-scheduler`, `sd-slot-picker`, `sd-timeline`, `sd-gantt`.
- Form tạo hay sửa sự kiện. Component gọi `create.onCreate` và phát `sdSelect`; consumer tự dựng form, dialog, bottom sheet.

## 1. Vị trí file

```
versions/v19/projects/sdcorejs-angular/components/calendar/
  index.ts                         // export component, model, templates, configuration
  ng-package.json                  // giống ng-package.json của các entry point khác
  sd-calendar.md                   // tài liệu public (tiếng Anh)
  src/
    calendar.component.ts | .html | .scss | .spec.ts
    calendar.model.ts
    calendar.templates.ts
    calendar.configuration.ts      // SD_CALENDAR_CONFIGURATION
    calendar.utils.ts | .spec.ts   // hàm thuần: khoảng xem, xếp chồng, xếp hàng cả ngày, làm tròn
```

Nếu `components/index.ts` đang re-export các entry point khác thì thêm `calendar` cùng cách. Thêm `sd-calendar.md` vào `documentation.registry.ts` của showcase (guard `generate-showcase-example-sources.test.mjs` so 1:1 với `published-docs/<version>/index.json`).

## 2. Quy ước API

sd-kanban chưa được review, **không dùng làm mẫu** cho tên, kiểu hay hợp đồng. Mẫu là các component đã ổn định:
- `sd-file-explorer`: option theo nhóm năng lực (`move: { movable, onMove }`, `createFolder: { creatable, onCreateFolder }`, `dataSource: { onList }`), kiểu trạng thái `boolean | ((context) => boolean)`, item có `id: string` và `data?: T`, args có `signal`.
- `sd-table`: config phức tạp nằm trong `option`, callback trong option đặt tên `on<Action>`.
- `sd-date`, `sd-time`, `sd-time-range`, `sd-date-range`, `SdDateTimeService`: input và giá trị ngày giờ.

| Public API của sd-calendar | Theo | Ghi chú |
| --- | --- | --- |
| `option = input.required<SdCalendarOption<T>>()` chứa nguồn dữ liệu và năng lực | `SdFileExplorerOption`, `SdTableOption` | Hành vi, dữ liệu, callback ở option. Trạng thái hiển thị và cấu hình lịch là input. |
| `option.dataSource.onLoad(args)` trả mảng hoặc `Promise` | `dataSource.onList` của sd-file-explorer, `items` của sd-table | Một hàm cho cả client và server; `args.signal`. |
| `option.create = { creatable?, onCreate }` | `createFolder: { creatable?, onCreateFolder }` | Không khai báo thì không có thao tác tạo. |
| `option.move = { movable?, onMove }` | `move: { movable?, onMove }` của sd-file-explorer | Cùng tên, cùng kiểu trả `boolean \| void \| Promise<boolean \| void>`. Không khai báo thì không kéo, không kéo mép, không phím dời. |
| `SdCalendarState<C> = boolean \| ((context: C) => boolean)` | `SdFileExplorerState<T>` | Dùng cho `creatable`, `movable`. |
| `SdCalendarEvent<T>`: `id: string`, `data?: T` | `SdFileExplorerItem<T>` | Consumer map DTO trong `onLoad`; `data` giữ nguyên tham chiếu. |
| `SdCalendarMoveRequest.source: 'drag' \| 'resize' \| 'keyboard' \| 'api'` | `SdFileExplorerMoveRequest.source` | `'resize'` thay cho `'menu'`. |
| `reload()`, `move()` public | `reload()` của sd-file-explorer, sd-table | |
| `minDate`, `maxDate`: `Date \| string \| 'TODAY'` | `SdDate` | Không thêm alias `min`/`max` (ở sd-chip-calendar `min`/`max` đã chốt là số lượng). |
| `step` (phút) | `SdTime`, `SdTimeRange` | |
| `transform: SdTemporalValueTransform` | `SdDate`, `SdDateRange` | Import từ `@sdcorejs/angular/forms/models`. |
| `workingHours` dùng `SdTimeRangeValue` | `SdTimeRange` | `{ from, to }`, `'HH:mm'`, import type-only. |
| `sdRangeChange`, `onLoad` nhận `{ from, to }` | `SdDateRangeValue` | `'yyyy/MM/dd'`, gồm cả hai đầu. |
| `firstDayOfWeek` (0 = Chủ Nhật) | `DateAdapter.getFirstDayOfWeek()` | |
| `color: Color \| string` | `Color` của `@sdcorejs/utils/models` (như `color` của sd-button) | Mặc định `'primary'`. |
| `disabled`, `readonly` (`booleanAttribute`), `ariaLabel`, `autoId` (`string \| null \| undefined`) | `SdDate` và các form control | |
| Output `sdSelect`, `sdRangeChange`, `sdMove`, `sdMoveError` | tiền tố `sd` như `sdChange` (sd-date), `sdRetry` (sd-data-state) | |
| `data-autoid="components-calendar-{autoId}"` | `components-file-explorer-{autoId}` | |
| i18n `core.component.calendar.*` | namespace `core.component.*` | Đủ 5 locale. |
| `SD_CALENDAR_CONFIGURATION` / `ISdCalendarConfiguration` | `SD_CORE_CONFIGURATION` / `ISdCoreConfiguration` | |

sd-file-explorer còn giữ callback gốc (`list`, `share`…) làm đường legacy. sd-calendar là component mới nên chỉ có dạng nhóm, không có alias.

### Đổi so với bản đề xuất trước

| Trước | Nay |
| --- | --- |
| `slotMinutes` | `step` |
| `weekStartsOn: 'mon' \| 'sun'` | `firstDayOfWeek: number` |
| `scrollTo` | `scrollTime` |
| `option.load(range, signal)`, hoặc `model` + `loading`/`error`/`sdRetry` | `option.dataSource.onLoad(args)`; component tự quản lý đang tải và lỗi |
| `getId`, `getTitle`, `getStart`, `getEnd`, `isAllDay`, `getColor`, `withTime` | `SdCalendarEvent<T>` do `onLoad` trả về |
| `canMove`, `move`, `isMovable` | `move: { movable, onMove }` |
| `canCreate` + output `sdCreate` | `create: { creatable, onCreate }` |
| `SD_WORK_CALENDAR` | `SD_CALENDAR_CONFIGURATION` |
| `holiday.kind` | `holiday.type` |
| `sdRangeChange` nửa khoảng `[from, to)` | gồm cả hai đầu |
| Mũi tên trên sự kiện để dời | `Alt` + mũi tên (Tab và mũi tên chỉ để duyệt, tránh dời nhầm) |

## 3. Model

```ts
import { InjectionToken } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import type { SdTimeRangeValue } from '@sdcorejs/angular/forms/time-range';

export type SdCalendarView = 'month' | 'week' | 'day' | 'agenda';
export type SdCalendarDateInput = Date | string | number;
export type SdCalendarMoveSource = 'drag' | 'resize' | 'keyboard' | 'api';
export type SdCalendarMoveScope = 'this' | 'following' | 'all';
/** Cờ tĩnh hoặc predicate theo ngữ cảnh. Đánh giá khi render và lần nữa ngay trước khi thực hiện. */
export type SdCalendarState<C> = boolean | ((context: C) => boolean);

/** Một sự kiện hiển thị trên lịch. Consumer map DTO của mình sang dạng này trong dataSource.onLoad. */
export interface SdCalendarEvent<T = unknown> {
  /** Duy nhất trong kết quả của một lần onLoad. Mỗi lần lặp có id riêng. */
  id: string;
  /** Không rỗng; là tên đọc cho trình đọc màn hình. */
  title: string;
  start: SdCalendarDateInput;
  /** Có giờ: mốc kết thúc, không tính. Cả ngày: ngày cuối, có tính; thiếu thì là một ngày. */
  end?: SdCalendarDateInput | null;
  /** Mặc định false. */
  allDay?: boolean;
  /** Color hoặc màu CSS. Mặc định 'primary'. */
  color?: Color | string;
  /** Có giá trị khi sự kiện là một lần của chuỗi lặp (server hoặc consumer đã mở rộng sẵn). */
  occurrence?: SdCalendarOccurrence | null;
  /** DTO của consumer. Giữ nguyên tham chiếu, không serialize. */
  data?: T;
}

export interface SdCalendarOccurrence {
  readonly seriesId: string;
  /** Giờ bắt đầu gốc của lần này theo quy tắc, trước mọi ngoại lệ. */
  readonly originalStart: SdCalendarDateInput;
}

/** Khoảng thời gian ở dạng component phát ra (mục 5). */
export interface SdCalendarRange {
  readonly start: string;
  readonly end: string;
  readonly allDay: boolean;
}

/** Khoảng ngày đang hiển thị, gồm cả hai đầu. Cùng dạng SdDateRangeValue. */
export interface SdCalendarVisibleRange {
  readonly from: string; // 'yyyy/MM/dd'
  readonly to: string;   // 'yyyy/MM/dd'
  readonly view: SdCalendarView;
}

export interface SdCalendarLoadArgs extends SdCalendarVisibleRange {
  /** Huỷ khi khoảng xem đổi, reload(), option đổi hoặc component bị huỷ. */
  readonly signal: AbortSignal;
}

export interface SdCalendarCreateArgs extends SdCalendarRange {
  /** Huỷ khi option đổi hoặc component bị huỷ. */
  readonly signal: AbortSignal;
}

export interface SdCalendarMoveRequest<T = unknown> {
  readonly event: SdCalendarEvent<T>;
  readonly from: SdCalendarRange;
  readonly to: SdCalendarRange;
  readonly source: SdCalendarMoveSource;
  /** null khi sự kiện không phải lần lặp. */
  readonly scope: SdCalendarMoveScope | null;
  /** Huỷ khi khoảng xem đổi, reload(), option đổi, khi bị disabled/readonly hoặc component bị huỷ.
   *  Huỷ là hợp tác, không hoàn tác thao tác backend đã xong. */
  readonly signal: AbortSignal;
}

export interface SdCalendarMoveError<T = unknown> {
  readonly request: SdCalendarMoveRequest<T>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

export interface SdCalendarHoliday {
  readonly date: SdCalendarDateInput;
  readonly label: string;
  /** off: ngày nghỉ, tô nền cả cột, nhãn màu lỗi. observance: chỉ ghi tên. */
  readonly type: 'off' | 'observance';
}

/** Khoá 0–6, 0 là Chủ Nhật. Thứ không có khoá hoặc mảng rỗng là ngày nghỉ. */
export type SdCalendarWorkingHours = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, readonly SdTimeRangeValue[]>>;

export interface SdCalendarOption<T = unknown> {
  /** Bắt buộc. */
  dataSource: {
    /**
     * Trả sự kiện cho khoảng đang xem. Gọi khi khởi tạo, khi khoảng xem đổi và khi reload().
     * Client: trả cả mảng, component tự lọc theo khoảng. Server: gọi API theo from/to, chuyển signal.
     * Throw hoặc reject: dải lỗi có nút Thử lại.
     */
    onLoad: (args: SdCalendarLoadArgs) => readonly SdCalendarEvent<T>[] | Promise<readonly SdCalendarEvent<T>[]>;
  };
  /** Bật tạo bằng bấm, quét, chạm, Enter. */
  create?: {
    /** Mặc định true. Context là khoảng sắp tạo. */
    creatable?: SdCalendarState<SdCalendarRange>;
    /**
     * Mở form của consumer. Trả sự kiện đã tạo để chèn ngay; trả void khi người dùng huỷ.
     * Throw hoặc reject: dải lỗi. Khối nét đứt giữ nguyên trong lúc chờ.
     */
    onCreate: (args: SdCalendarCreateArgs) => SdCalendarEvent<T> | void | Promise<SdCalendarEvent<T> | void>;
  };
  /** Bật kéo dời, kéo mép, Alt + phím. */
  move?: {
    /** Mặc định true. false hoặc predicate trả false: khối không có tay nắm, không dời được. */
    movable?: SdCalendarState<SdCalendarEvent<T>>;
    /** true hoặc void: chấp nhận. false: từ chối. Throw hoặc reject: lỗi. */
    onMove: (request: SdCalendarMoveRequest<T>) => boolean | void | Promise<boolean | void>;
  };
}

export interface ISdCalendarConfiguration {
  firstDayOfWeek?: number;
  step?: number;
  workingHours?: SdCalendarWorkingHours | null;
  holidays?: readonly SdCalendarHoliday[];
  scrollTime?: string;
}
export const SD_CALENDAR_CONFIGURATION = new InjectionToken<ISdCalendarConfiguration>('sd-calendar.configuration');
```

Đặt file cấu hình theo cách upload-file đang làm (đọc `components/upload-file/**/upload-file.configuration.ts` trước). Thứ tự ưu tiên: input → cấu hình → mặc định. Thay `option` bằng object mới là tín hiệu tải lại (gọi `onLoad`); component không theo dõi thay đổi bên trong object.

## 4. Input, output, method

### 4.1 Input

| Input | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `option` | `SdCalendarOption<T>` | bắt buộc | |
| `view` | `SdCalendarView` | `'week'` | Hai chiều (`model()`). Nếu không nằm trong `views` thì dùng phần tử đầu của `views`. |
| `date` | `SdCalendarDateInput \| null \| undefined` | hôm nay (theo zone) | Hai chiều. Ngày neo. Component ghi lại `'yyyy/MM/dd'`, không áp `transform`. |
| `selectedId` | `string \| null` | `null` | Hai chiều. Nếu id không còn trong dữ liệu đã tải thì về `null`. |
| `views` | `readonly SdCalendarView[]` | `['month','week','day','agenda']` | Thứ tự trên nút chuyển. |
| `step` | `number` | cấu hình ?? `30` | Phút, ước của 60 (5, 10, 15, 20, 30, 60); giá trị khác dùng 30 và cảnh báo ở dev mode. |
| `firstDayOfWeek` | `number` | cấu hình ?? `1` | 0–6. |
| `hideWeekends` | `boolean` | `false` | Ẩn cột Thứ Bảy, Chủ Nhật ở Tuần và Tháng. |
| `workingHours` | `SdCalendarWorkingHours \| null \| undefined` | cấu hình ?? T2–T6 08:00–12:00, 13:00–17:30 | `null`: tắt tô ngoài giờ và không coi ngày nào là nghỉ. |
| `holidays` | `readonly SdCalendarHoliday[]` | cấu hình ?? `[]` | |
| `minDate`, `maxDate` | `Date \| string \| 'TODAY' \| undefined` | — | So theo ngày trong zone như sd-date. |
| `scrollTime` | `string` (`'HH:mm'`) | cấu hình ?? giờ làm sớm nhất trong các ngày đang xem ?? `'08:00'` | |
| `agendaDays` | `number` | `14` | 1–62. |
| `dimPast` | `boolean` | `false` | |
| `transform` | `SdTemporalValueTransform \| undefined` | — | Mục 5. |
| `disabled`, `readonly` | `boolean` | `false` | `booleanAttribute`. |
| `ariaLabel` | `string \| null \| undefined` | `core.component.calendar.label` | |
| `autoId` | `string \| null \| undefined` | — | |

Khoá tạo và dời khi: `disabled`, `readonly`, đang tải lần đầu, lỗi tải, dữ liệu không hợp lệ, hoặc đang có thao tác chờ. `readonly` vẫn cho điều hướng, đổi chế độ, chọn. `disabled` chặn cả chọn và bỏ sự kiện khỏi thứ tự Tab.

### 4.2 Output

| Output | Payload | Khi nào |
| --- | --- | --- |
| `sdSelect` | `SdCalendarEvent<T>` | Bấm, chạm, Enter/Space trên sự kiện. Đồng thời đặt `selectedId`. |
| `sdRangeChange` | `SdCalendarVisibleRange` | Một lần khi khởi tạo, sau đó mỗi khi `from`, `to` hoặc `view` đổi. Không phát lại khi khoảng giữ nguyên. Dùng để đồng bộ URL; dữ liệu đã đi qua `onLoad`. |
| `sdMove` | `SdCalendarMoveRequest<T>` | Sau khi `onMove` chấp nhận và dữ liệu đã cập nhật. |
| `sdMoveError` | `SdCalendarMoveError<T>` | `onMove` từ chối hoặc lỗi. |

`viewChange`, `dateChange`, `selectedIdChange` do `model()` sinh.

### 4.3 Method

- `reload(): void`: huỷ lần tải đang chạy, gọi lại `onLoad` cho khoảng hiện tại. Giữ sự kiện cũ trên màn hình tới khi có kết quả.
- `move(eventId: string, to: { start: SdCalendarDateInput; end?: SdCalendarDateInput | null; allDay?: boolean }, source: SdCalendarMoveSource = 'api'): Promise<boolean>`: chạy pipeline mục 9.5. Trả `false` khi không có `option.move`, khoá, không tìm thấy, `movable` false, từ chối hoặc lỗi. Với lần lặp, `'api'` không hỏi phạm vi và dùng `scope: 'this'`.

## 5. Giá trị ngày giờ

- **Đọc**: `event.start`, `event.end`, `holidays[].date`, `minDate`, `maxDate`, `date` nhận `string | number | Date`, đọc bằng `SdDateTimeService` (`toWallClock` để bố trí, `begin`, `beginOfNextDay` để so ngày). Instant hiển thị theo zone cấu hình; chuỗi không có zone giữ nguyên chữ số. Không dùng `new Date(value)` hay getter local.
- **Ghi** (args của `onLoad` và `onCreate`, `request.from/to`, sự kiện sau khi dời):
  - Không `transform`: có giờ `'yyyy/MM/dd HH:mm:ss'`, cả ngày `'yyyy/MM/dd'` (cùng định dạng model của sd-datetime và sd-date). `from`/`to` của khoảng xem luôn `'yyyy/MM/dd'`.
  - `transform='ISOString' | 'UTCString'`: instant của wall clock trong zone (`fromWallClock`), cả ngày là đầu ngày trong zone; `end` của cả ngày là đầu ngày cuối (vẫn inclusive). Dùng lại hàm serialize mà sd-date, sd-datetime đang dùng; không viết hàm mới.
  - `request.from` cũng được serialize lại theo cùng quy tắc, nên `from` và `to` luôn cùng dạng.
  - Sau khi dời được chấp nhận, sự kiện trong dữ liệu được thay bằng object mới `{ ...event, start: to.start, end: to.end, allDay: to.allDay }`; `data` giữ nguyên tham chiếu.
- **Sự kiện có giờ**: `end` exclusive. `end <= start` hoặc không đọc được → không hợp lệ.
- **Cả ngày**: `end` inclusive; thiếu `end` → một ngày.
- **Qua nửa đêm**: sự kiện có giờ mà `end > beginOfNextDay(ngày bắt đầu)` hiển thị ở hàng cả ngày, nhãn có giờ bắt đầu (“22:00 Trực đêm”). Kết thúc đúng 00:00 hôm sau vẫn nằm trong lưới, nhãn kết thúc “24:00”.
- **Sự kiện không hợp lệ**: ngày không đọc được hoặc `end <= start` → bỏ qua khi hiển thị, `console.warn` một lần mỗi sự kiện khi `isDevMode()`. `id` trùng hoặc rỗng, `title` rỗng → trạng thái lỗi dữ liệu (`core.component.calendar.invalid-data`), khoá tạo và dời.
- **DST**: lưới là wall clock 24 hàng. Giờ không tồn tại hay lặp lại do DST không cần xử lý riêng ngoài việc dùng `beginOfNextDay` khi so ngày. Việt Nam không có DST.
- Nhãn múi giờ ở góc cột giờ: `Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })` của hôm nay, ví dụ “GMT+7”. Zone `'local'` dùng múi của trình duyệt.

## 6. Khoảng xem và điều hướng

| Chế độ | `from` | `to` | Bước của Trước/Sau |
| --- | --- | --- | --- |
| `week` | đầu tuần chứa `date` theo `firstDayOfWeek` | `from + 6`; nếu `hideWeekends` thì `from`, `to` là ngày hiển thị đầu và cuối | 7 ngày |
| `day` | `date` | `date` | 1 ngày |
| `month` | đầu tuần chứa ngày 1 | cuối tuần chứa ngày cuối tháng (4–6 hàng, không cố định 6) | 1 tháng, `date` về ngày 1 |
| `agenda` | `date` | `date + agendaDays − 1` | `agendaDays` ngày |

- Giao diện hẹp (mục 12): `week` hiển thị như `day`; `view` vẫn là `'week'`, nhưng `onLoad` và `sdRangeChange` nhận `view: 'day'` và khoảng một ngày.
- “Hôm nay”: `date = today()` của zone.
- `minDate`/`maxDate`: nút Trước/Sau vô hiệu khi khoảng kế tiếp nằm hoàn toàn ngoài giới hạn. Ngày ngoài giới hạn tô nền `--sd-calendar-off-hours`, con trỏ `not-allowed`, không tạo được; dời vào đó bị bỏ qua trước khi gọi `onMove` (không phát `sdMoveError`, đọc `core.component.calendar.out-of-range`).
- Tiêu đề (vùng `aria-live="polite"`):
  - Tuần, cùng tháng: vi “19 – 25 tháng 10, 2026”; en “Oct 19 – 25, 2026”.
  - Tuần, khác tháng: vi “28/09 – 04/10/2026”; en “Sep 28 – Oct 4, 2026”. Khác năm: ghi năm cả hai đầu.
  - Ngày: vi “Thứ Năm, 22 tháng 10, 2026”; en “Thursday, October 22, 2026”.
  - Tháng và Ngày ở giao diện hẹp: vi “Tháng 10, 2026”; en “October 2026”.
  - Danh sách: vi “22/10 – 04/11/2026”; en “Oct 22 – Nov 4, 2026”.
  - Dựng bằng key i18n có tham số (mục 15); tên thứ dài và tên tháng lấy từ `Intl.DateTimeFormat(i18n.locale(), { timeZone })`. Thứ ngắn ở tiêu đề cột dùng key i18n (vi “T2…CN” không có trong Intl).

## 7. Bố cục và kích thước

Font kế thừa app (Roboto qua Material). Kích thước dưới đây là desktop; giao diện hẹp ở mục 12. Literal nào trùng đúng một token thang thì dùng token (`8px` → `var(--sd-radius-8, 8px)`); không trùng thì giữ literal.

| Phần | Thông số |
| --- | --- |
| Gốc | `border: 1px solid var(--sd-border)`, `border-radius: 12px`, nền `var(--sd-surface)`, `overflow: hidden`, `position: relative`. |
| Thanh công cụ | Cao 56px, đệm `0 12px 0 14px`, gap 12px, viền dưới `--sd-calendar-line`. Trái: “Hôm nay” (cao 32px, đệm ngang 14px, viền `--sd-border`, bo 8px, chữ 14/500) cách 4px rồi 2 nút icon tròn 32px (`chevron_left`, `chevron_right`, icon 22px, màu `--sd-text-secondary`, hover nền `color-mix(in srgb, var(--sd-text) 6%, transparent)`). Giữa: tiêu đề 18/24 500, `flex: 1`, cắt bằng `…`. Phải: nhóm chuyển chế độ, viền `--sd-border`, bo 8px, mỗi nút cao 32px, đệm ngang 12px, chữ 13/500, phân cách viền trái; nút đang chọn nền `--sd-primary-light`, chữ `--sd-text`, `aria-pressed="true"`. |
| Thanh tiến trình | Khi `loading`: dải 2px ngay dưới thanh công cụ, nền `--sd-primary-light`, thanh chạy `--sd-primary`. |
| Dải lỗi | Dưới thanh công cụ: nền `--sd-status-error-bg`, chữ `--sd-status-error-fg`, viền dưới `color-mix(in srgb, var(--sd-error) 28%, var(--sd-surface))`, đệm 8px 10px, chữ 13px, icon `error` 18px màu `--sd-error`, nút “Thử lại” cao 28px viền `--sd-error`. `role="alert"`. |
| Dải thất bại khi dời | Cùng vị trí và kiểu dải lỗi, nội dung `core.component.calendar.rejected` hoặc `.error`, nút “Bỏ qua”. |
| Tiêu đề ngày (Tuần) | Cao 72px. Mỗi cột: thứ 11/14 500, giãn chữ .04em, màu `--sd-text-secondary` (hôm nay `--sd-calendar-today`); số ngày trong vòng 32px, chữ 18/500 (hôm nay: nền `--sd-calendar-today`, chữ `--sd-primary-contrast`); dòng ngày lễ 11/14, cắt `…`, `title` đủ tên. Bấm số ngày → `view='day'`, `date` = ngày đó. Viền trái mỗi cột `--sd-calendar-line`. |
| Hàng cả ngày | Nhãn “Cả ngày” 11/14 căn phải trong cột giờ, đệm trên 8px. Lưới cùng số cột, mỗi hàng 22px, cách 2px, đệm dọc 4px, tối thiểu 30px. Tối đa 3 hàng; phần dư thu thành “+N” trên từng ngày (bấm → `view='day'`). Viền dưới khối tiêu đề `--sd-border`. |
| Vùng cuộn | Tiêu đề ngày và hàng cả ngày `position: sticky; top: 0`, nền `--sd-surface`, z-index trên sự kiện. Cuộn dọc trong component; chiều cao do host quyết định (`:host { display: block; }`, vùng cuộn `flex: 1; min-height: 0`). Khi host không có chiều cao, vùng cuộn mặc định `height: 620px`. |
| Cột giờ | Rộng `--sd-calendar-gutter-width` (56px). Nhãn 01:00…23:00, 11/14 `--sd-text-secondary`, căn phải cách 8px, tâm chữ nằm trên vạch giờ (`top = h * 48 - 7px`). Không có nhãn 00:00. |
| Lưới giờ | 1 giờ = `--sd-calendar-hour-height` (48px), 24 giờ = 1152px. Vạch giờ 1px `--sd-calendar-line`, vạch nửa giờ 1px `--sd-calendar-line-half` (vẽ bằng `repeating-linear-gradient`, không render 48 phần tử). Ngoài giờ làm việc, ngày nghỉ, ngày lễ `off`: nền `--sd-calendar-off-hours`. |
| Chừa bên phải cột | Sự kiện không phủ hết cột: Tuần chừa 8px, Ngày 24px, giao diện hẹp 16px; bên trái 2px. Mục đích: luôn bấm được ô trống. |
| Giờ hiện tại | Chỉ ở cột hôm nay: đường 2px `--sd-calendar-now`, chấm tròn 10px ở mép trái (lệch −5px). Cập nhật mỗi 60 giây, theo `SdDateTimeService.now()`. |
| Cuộn ban đầu | `scrollTop = max(0, phút(scrollTime) − 30) / 60 × 48`. Chạy khi khởi tạo và khi vào lại Tuần/Ngày từ chế độ khác; không chạy khi chỉ chuyển tuần. |

## 8. Khối sự kiện

### 8.1 Màu

Màu sự kiện `c` = `event.color ?? 'primary'`.
- `c` là `Color`: đặt `data-color="{c}"` trên khối, SCSS ánh xạ `--sd-calendar-event-color: var(--sd-{c})` và nền `var(--sd-{c}-light)`.
- `c` là chuỗi khác: gán inline `--sd-calendar-event-color: c`, nền `color-mix(in srgb, c 14%, var(--sd-surface))`.

| Thuộc tính | Giá trị |
| --- | --- |
| Nền | `--sd-{c}-light` |
| Viền | 1px `color-mix(in srgb, var(--sd-calendar-event-color) 28%, var(--sd-surface))` |
| Chấm | 6px tròn, `--sd-calendar-event-color`, trước tiêu đề, gap 4px |
| Chữ | Tiêu đề `--sd-text` 12/16 600; dòng phụ `--sd-text-secondary` 12/16 400. Không bao giờ dùng màu sự kiện cho chữ. |
| Bo, đệm | 6px; `2px 6px` (khối một dòng `0 6px`) |

Giá trị đã giải của theme default để đối chiếu với HTML: primary `#dbe8f5` / `#b6cfec` / `#005cbb`; info `#dbeaea` / `#b6d2d5` / `#006a6a`; success `#e2ede2` / `#c3d8c6` / `#2e7d32`; warning `#f3e9db` / `#e5d0b8` / `#a66300`; error `#f5dfdf` / `#eabcbf` / `#ba1a1a`; secondary `#ebecee` / `#d0d0d7` / `#5c6270`.

### 8.2 Nội dung theo chiều cao

Chiều cao = `max(thời lượng phút / 60 × 48 − 2, 16)`; `top = phút bắt đầu / 60 × 48 + 1`.

| Cao | Nội dung |
| --- | --- |
| ≥ 62px | Tiêu đề, “09:30 – 10:30”, địa điểm nếu template cung cấp (mặc định không có địa điểm; xem 8.5) |
| 34–61px | Tiêu đề, giờ |
| < 34px | Một dòng “Tiêu đề, 09:30” |
| < 20px | Như trên, chữ 11/14 |

Mỗi dòng `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. Lần lặp có icon `repeat` 13px trước tiêu đề.

### 8.3 Trạng thái

| Trạng thái | Kiểu |
| --- | --- |
| Hover (chỉ `@media (hover: hover)`) | Nền `color-mix(in srgb, var(--sd-calendar-event-color) 7%, <nền>)`, bóng nhẹ, hiện tay nắm (16×3px, bo 2px, màu event-color, cách đáy 3px, căn giữa). |
| Đang chọn | Viền `--sd-calendar-event-color`, bóng vừa, z-index trên các khối khác. |
| Focus bàn phím | `:focus-visible`: `outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color); outline-offset: var(--sd-focus-ring-offset)`. Không có hex. |
| Đang kéo | Chiếm hết bề ngang cột, viền event-color, bóng lớn, z-index cao nhất. Vị trí cũ hiện khung nét đứt cùng màu viền, opacity .55, nền trong suốt. |
| Đang chờ phạm vi hoặc đang lưu | Ở vị trí đề xuất, chiếm hết bề ngang, viền nét đứt event-color. Đang lưu thêm icon `sync` 14px quay 1s (tắt khi `prefers-reduced-motion`). Model chưa đổi; vị trí cũ không hiện. |
| Thất bại | Về vị trí cũ, `outline: 2px solid var(--sd-error); outline-offset: 1px` đến khi bấm Bỏ qua hoặc có tương tác dời mới. |
| Đã qua (`dimPast`, `end <= now`) | Nền `color-mix(in srgb, <nền> 45%, var(--sd-surface))`, chấm `color-mix(in srgb, var(--sd-calendar-event-color) 45%, var(--sd-surface))`, viền `color-mix(in srgb, <viền> 50%, var(--sd-surface))`; chữ giữ nguyên. |
| Không dời được (không có `option.move`, `move.movable` false cho sự kiện, hoặc khoá) | Không tay nắm, con trỏ `pointer`, `cdkDragDisabled`, phím `Alt` không dời. |

Bóng: dùng `--sd-shadow-sm` (hover), `--sd-shadow-md` (chọn), `--sd-shadow-lg` (kéo). Giá trị trong HTML lần lượt `0 1px 3px rgba(26,27,31,.16)`, `0 2px 8px rgba(26,27,31,.2)`, `0 8px 20px rgba(26,27,31,.22)`; chọn token gần nhất trong `_scales.scss`.

`move.movable` quyết định trước khi kéo (khối có tay nắm hay không), đánh giá khi render và lần nữa ngay trước khi gọi `onMove`. `onMove` quyết định với vị trí đích cụ thể và có thể từ chối.

### 8.4 Xếp chồng (hàm thuần trong `calendar.utils.ts`)

1. Lấy sự kiện có giờ của một ngày, sắp theo `start` tăng, cùng `start` thì `end` giảm.
2. Gom cụm: sự kiện mới thuộc cụm hiện tại nếu `start < max(end)` của cụm.
3. Trong cụm, đặt mỗi sự kiện vào cột đầu tiên có `end` ≤ `start` của nó; không có thì mở cột mới.
4. Mọi sự kiện trong cụm rộng `1 / số cột của cụm`, `left = cột / số cột`.
5. Khối đang kéo, đang chờ, đang lưu bỏ khỏi thuật toán và vẽ hết bề ngang phía trên.
6. Thứ tự DOM = thứ tự sau bước 1, để Tab đi theo ngày rồi giờ.

### 8.5 Template

| Directive | Selector | Context |
| --- | --- | --- |
| `SdCalendarEventTemplateDirective` | `ng-template[sdCalendarEventTemplate]` | `$implicit` và `event: SdCalendarEvent`, `range: SdCalendarRange`, `view`, `compact: boolean` (cao < 34px), `pending` |
| `SdCalendarDayCellTemplateDirective` | `ng-template[sdCalendarDayCellTemplate]` | `$implicit` (`'yyyy/MM/dd'`), `date`, `events: readonly SdCalendarEvent[]`, `holiday: SdCalendarHoliday \| null`, `today`, `inMonth`, `off` |
| `SdCalendarAgendaItemTemplateDirective` | `ng-template[sdCalendarAgendaItemTemplate]` | như event template, không có `compact` |
| `SdCalendarEmptyTemplateDirective` | `ng-template[sdCalendarEmptyTemplate]` | `$implicit: SdCalendarVisibleRange` |

Mỗi directive có `static ngTemplateContextGuard` để template có kiểu context. Template sự kiện thay phần nội dung bên trong khối; khung, màu nền, tay nắm, chấm, trạng thái vẫn do component vẽ. Template ô Tháng thay phần dưới số ngày (dùng cho bảng chấm công một người). Đọc DTO qua `event.data`.

## 9. Tương tác

### 9.1 Chọn

Bấm (pointer di chuyển < 5px), chạm, Enter/Space trên sự kiện → `selectedId` = ID, phát `sdSelect`. Bấm ô trống, Esc trên sự kiện → `selectedId = null` (Esc đưa focus về lưới). Không có panel chi tiết trong component.

### 9.2 Tạo (Tuần, Ngày)

Chỉ có khi khai báo `option.create`. Không có thì bấm ô trống chỉ bỏ chọn.

- Pointer chính nhấn trên ô trống (không phải trên sự kiện): ghi slot bắt đầu `floor(phút / step) × step`.
- Di chuyển ≥ 5px: hiện khối mới nét đứt `--sd-primary`, nền `color-mix(in srgb, var(--sd-primary-light) 92%, transparent)`, chữ “Sự kiện mới” 12/16 600 và dòng “14:00 – 15:30”. Khoảng = `[min(a, b), max(a, b) + step]`, giới hạn trong ngày đó (không qua cột khác), tối đa 24:00.
- Bấm không kéo (< 5px): một slot `[slot, slot + step]`.
- Cảm ứng: chạm ô trống tạo một slot; không quét (kéo dọc dành cho cuộn).
- Thả: nếu `creatable` cho phép và nằm trong `minDate`/`maxDate` → gọi `create.onCreate(args)`. Khối nét đứt giữ nguyên, thêm icon `sync`, mọi thao tác tạo và dời khác bị chặn trong lúc chờ.
  - Trả `SdCalendarEvent`: chèn vào dữ liệu, khối nét đứt biến mất, sự kiện mới được chọn (`selectedId`) nhưng không phát `sdSelect`.
  - Trả `void`: khối nét đứt biến mất.
  - Throw hoặc reject: khối nét đứt biến mất, dải thất bại với `core.component.calendar.create-error`.
  - `signal` bị huỷ (option đổi, component bị huỷ): bỏ qua kết quả.
- `creatable` trả false trong lúc quét: khối nét đứt dùng viền `--sd-border-strong`, con trỏ `not-allowed`, thả không gọi `onCreate`.
- Esc khi đang quét: huỷ.
- Khoá: không có khối nét đứt, con trỏ `default`. Ngày ngoài giới hạn: con trỏ `not-allowed`.

### 9.3 Dời bằng kéo (Tuần, Ngày)

- Dùng `@angular/cdk/drag-drop`, không thêm thư viện. Ngưỡng bắt đầu kéo 5px (mặc định `dragStartThreshold` của CDK). `cdkDragStartDelay`: `{ touch: 400, mouse: 0 }`.
- Trong lúc kéo: vị trí đề xuất tính từ pointer: cột = cột dưới pointer (giới hạn trong khoảng đang xem, bù theo điểm nắm ban đầu), phút = phút gốc + Δy làm tròn theo `moveStep = min(step, 15)`, giữ nguyên thời lượng, kẹp trong `[00:00, 24:00 − thời lượng]`. Vẽ khối ở vị trí đề xuất, giấu preview mặc định của CDK, khung nét đứt ở vị trí cũ.
- Tự cuộn khi pointer cách mép trên hoặc dưới vùng cuộn ≤ 40px, tốc độ tỉ lệ khoảng cách (tối đa 16px mỗi khung hình).
- Thả: `event.source.reset()`; nếu vị trí đổi thì chạy pipeline 9.5 với `source: 'drag'`. Thả ra ngoài vùng lưới hoặc Esc: huỷ.
- Kéo chỉ trong khoảng đang xem; không tự chuyển tuần khi kéo tới mép.

### 9.4 Đổi giờ kết thúc

- Vùng 8px cuối khối, con trỏ `ns-resize`. Dùng pointer events + `setPointerCapture` (CDK không có resize).
- `end` mới = `end` gốc + Δy làm tròn theo `moveStep`; tối thiểu `start + 15 phút` (hoặc `+ step` nếu `step < 15`); tối đa 24:00 của ngày bắt đầu. Giờ trong khối cập nhật trực tiếp.
- Thả → pipeline với `source: 'resize'`.
- Cảm ứng: chỉ khối đang chọn hiện tay nắm, vùng chạm cao 24px, tay nắm vẽ 24×6px.

### 9.5 Pipeline dời

1. Bỏ qua nếu không có `option.move`, khoá, `movable` false cho sự kiện, đang có thao tác chờ, hoặc `to` bằng `from`.
2. Ngoài `minDate`/`maxDate` → bỏ qua, đọc `out-of-range`.
3. Sự kiện có `occurrence` và `source` khác `'api'` → mở thanh hỏi phạm vi (9.6) và chờ. Huỷ → khối về chỗ cũ, không phát gì.
4. Dựng request với `signal` từ một `AbortController` mới. Đánh giá lại `movable`; false thì dừng.
5. Hiện trạng thái đang lưu ở vị trí đề xuất, đọc `pending`, gọi `onMove(request)`. Dữ liệu chưa đổi trong lúc chờ.
6. Chấp nhận (`true` hoặc `void`):
   - `scope` là `null` hoặc `'this'`: thay sự kiện trong dữ liệu như mục 5.
   - `scope` là `'following'` hoặc `'all'`: thay sự kiện như trên rồi gọi `reload()` để lấy chuỗi đã sửa.
   - Phát `sdMove(request)`, đọc `moved` hoặc `resized`.
   - `to` nằm ngoài khoảng đang xem (`Alt+←/→` qua mép): đổi `date` để khoảng mới chứa `to`.
7. Từ chối (`false`) hoặc throw: dữ liệu giữ nguyên, khối thất bại (8.3), dải thất bại, phát `sdMoveError({ request, reason, error? })`, đọc thông báo. Không tự thử lại. Không hiển thị nội dung exception.
8. Huỷ request và bỏ kết quả khi: khoảng xem đổi, `reload()`, `option` đổi tham chiếu, `disabled` hoặc `readonly` bật, component bị huỷ. Kết quả trả về muộn không được ghi đè dữ liệu mới.
9. Mỗi lúc chỉ một thao tác chờ (tạo hoặc dời).
10. Focus: thao tác bắt đầu từ bàn phím thì sau khi xong (chấp nhận, từ chối, huỷ phạm vi) focus trở lại khối đó, kể cả khi khối chuyển sang khoảng khác. Nếu trong lúc chờ người dùng đã chủ động focus chỗ khác thì giữ nguyên chỗ đó.

### 9.6 Lần lặp và thanh hỏi phạm vi

- Khối có icon `repeat`; `aria-label` thêm “lặp lại”.
- Sau khi thả (hoặc `Alt` + phím), khối nằm ở vị trí đề xuất dạng nét đứt. Thanh hỏi hiện ở đáy component: `position: absolute; left: 12px; right: 12px; bottom: 12px`, nền `--sd-surface-inverse`, chữ `--sd-surface`, bo 10px, đệm 12px 14px, bóng lớn, chữ 14px, `role="alertdialog"`, `aria-labelledby` trỏ tới câu hỏi.
- Nội dung: “‘{title}’ là sự kiện lặp. Áp dụng thay đổi cho:” rồi 4 nút cao 36px, đệm ngang 10px, bo 6px, chữ 14/500: “Chỉ lần này”, “Lần này và các lần sau”, “Tất cả” (màu `--sd-primary-light`), “Huỷ” (màu `--sd-surface`). Hover nền `color-mix(in srgb, var(--sd-surface) 12%, transparent)`. Focus dùng vòng focus chuẩn.
- Mở thì focus “Chỉ lần này”. Esc = Huỷ. Huỷ: khối về chỗ cũ, đọc `cancelled`.
- Chọn phạm vi → tiếp bước 4 của pipeline với `scope` tương ứng.

### 9.7 Bàn phím

**Lưới giờ** (Tuần, Ngày): một điểm Tab (`tabindex="0"`, `role="group"`, `aria-label`, `aria-describedby` trỏ tới hướng dẫn ẩn). Một phần tử con làm con trỏ có `id`, `aria-label` “Thứ Năm 22/10, 14:30”; lưới đặt `aria-activedescendant` = id đó. Con trỏ chỉ hiện khi focus bằng bàn phím: khung 2px `--sd-focus-ring-color`, nền `color-mix(in srgb, var(--sd-primary) 8%, transparent)`, bo 4px, cao 1 slot, nhãn giờ 11px. Mỗi lần con trỏ đổi cũng đọc qua live region.

| Phím | Hành động |
| --- | --- |
| `↑` `↓` | Slot trước, sau (theo `step`); tự cuộn để con trỏ luôn thấy, tính cả phần tiêu đề sticky |
| `←` `→` | Ngày trước, sau; ở mép thì sang khoảng trước, sau và giữ giờ. Đảo khi RTL. |
| `Home` `End` | Đầu giờ làm việc, slot cuối trước khi hết giờ làm của ngày đó (không có giờ làm: 00:00, 24:00 − step) |
| `PageUp` `PageDown` | Khoảng trước, sau |
| `T` | Hôm nay |
| `Enter` `Space` | `create.onCreate` cho slot (nếu có `option.create`, không khoá, trong giới hạn, `creatable` cho phép) |

**Sự kiện**: `role="button"`, `tabindex="0"` (disabled: `-1`), `aria-describedby` trỏ tới hướng dẫn phím sự kiện.

| Phím | Hành động |
| --- | --- |
| `Enter` `Space` | Chọn |
| `Esc` | Bỏ chọn, focus về lưới |
| `Alt` + `↑` `↓` | Dời `moveStep` (source `'keyboard'`) |
| `Alt` + `Shift` + `↑` `↓` | Đổi giờ kết thúc `moveStep` |
| `Alt` + `←` `→` | Dời 1 ngày (đảo khi RTL); qua mép thì chuyển khoảng và focus theo |

Mũi tên không có `Alt` trên sự kiện không làm gì. Thanh cả ngày: Enter/Space chọn; `Alt` + `←` `→` dời 1 ngày; không có `↑` `↓`.

**Tháng**: `role="grid"`, hàng `role="row"`, ô `role="gridcell"`, roving tabindex như `mat-calendar`: `←` `→` ±1 ngày, `↑` `↓` ±7, `Home` `End` đầu, cuối tuần, `PageUp` `PageDown` ±1 tháng, `Shift+PageUp/PageDown` ±1 năm, `Enter`/`Space` mở Ngày. Chip trong ô không nằm trong thứ tự Tab; bấm chip bằng chuột phát `sdSelect`.

**Danh sách**: mỗi dòng sự kiện `role="button"`, Enter/Space chọn.

## 10. Chế độ Tháng

- Hàng thứ: 11/500 `--sd-text-secondary`, đệm `8px 8px 6px`, viền dưới `--sd-calendar-line`.
- Ô: tối thiểu 104px, đệm 4px, gap 2px, viền trái và dưới `--sd-calendar-line`. Cuối tuần và ngày `off`: nền `--sd-calendar-off-hours`.
- Số ngày trong vòng 26px, 13/500; hôm nay nền `--sd-calendar-today` chữ `--sd-primary-contrast`; ngoài tháng chữ `--sd-border-strong`. Ngày lễ: nhãn 11px cạnh số, cắt `…` (`off` màu `--sd-error`, `observance` màu `--sd-text-secondary`).
- Dòng sự kiện cao 20px, chữ 12px, bo 4px, đệm ngang 4px:
  - Cả ngày: nền `--sd-{c}-light`, chấm 6px, giữ cùng hàng qua các ngày; đoạn giữa bỏ bo góc và lề âm 5px để nối liền; tiêu đề chỉ ở đoạn đầu của mỗi tuần.
  - Có giờ: nền trong suốt, chấm 6px, “09:00 Họp giao ban tuần”.
- Thứ tự: cả ngày trước (theo hàng đã xếp), rồi có giờ theo `start`.
- Tối đa 3 dòng. Quá 3: hiện 2 dòng và “+N khác” (12/500 `--sd-primary`). Có ngày lễ thì tối đa 2 dòng (1 dòng + “+N khác” nếu quá).
- Bấm ô hoặc “+N khác” → `view='day'`, `date` = ngày đó. Bấm chip → `sdSelect`.
- Không kéo thả trong đợt 1.

## 11. Chế độ Ngày và Danh sách

**Ngày**: một cột, không có hàng tiêu đề ngày (tiêu đề thanh công cụ đã ghi đủ). Chừa 24px bên phải. Thanh cả ngày nhiều ngày: có `chevron_left`/`chevron_right` 16px ở phía bị cắt và ghi “21/10 – 23/10” 11px bên phải.

**Danh sách**:
- Từ `date`, `agendaDays` ngày, bỏ ngày không có sự kiện và không có ngày lễ.
- Mỗi ngày một nhóm: lưới `120px minmax(0,1fr)`, gap 4px 12px, đệm `10px 12px 10px 16px`, viền dưới `--sd-calendar-line`. Cột trái: “Thứ Năm, 22/10” 13/500 (hôm nay màu `--sd-primary`, thêm dòng “Hôm nay” 12px), ngày lễ 12px.
- Dòng sự kiện: lưới `92px minmax(0,1fr)` (component ≥ 720px thêm cột địa điểm nếu template cung cấp), cao tối thiểu 32px, đệm 2px 8px, bo 8px, hover nền `color-mix(in srgb, var(--sd-text) 4%, transparent)`, chọn nền `--sd-primary-light`. Giờ “09:30 – 10:30” hoặc “Cả ngày” 13px `--sd-text-secondary`; chấm 8px; tiêu đề 14/500; icon `repeat` 15px.
- Trống: icon `event_available` 28px `--sd-border-strong`, “Không có sự kiện trong {count} ngày này.” 14px, căn giữa, cao 152px. Thay được bằng `sdCalendarEmptyTemplate`. Chỉ Danh sách có trạng thái trống; các chế độ khác trống vẫn là lưới.

## 12. Giao diện hẹp và cảm ứng

- `compact = bề rộng host < 600px`, đo bằng `ResizeObserver` trên host (kiểm tra có `ResizeObserver` để chạy được SSR và test). Không dùng media query viewport.
- Thanh công cụ 2 hàng: hàng 1 tiêu đề (18/500, `flex: 1`) + “Hôm nay” + 2 nút icon, mọi nút cao 44px; hàng 2 nhóm chuyển chế độ rộng hết, mỗi nút `flex: 1`, cao 42px (+ viền = 44). Nút chế độ “Tuần” ẩn; chế độ hiện: Ngày, Tháng, Danh sách (theo `views`).
- Tuần hiển thị như Ngày, kèm dải 7 ngày của tuần chứa `date`: lưới 7 cột, gap 2px, đệm `4px 8px 6px`, viền trên dưới `--sd-calendar-line`. Mỗi ô cao 56px, bo 12px: thứ 11px, số 16/500, chấm 4px khi có sự kiện. Ô đang xem: nền `--sd-primary`, chữ `--sd-primary-contrast`. Hôm nay (không đang xem): viền 1px `--sd-primary`, chữ `--sd-primary`. `aria-current="date"` trên ô đang xem.
- Cột giờ 48px, chừa phải 16px.
- Tháng: ô cao 56px, số trong vòng 32px căn giữa, dưới là tối đa 3 chấm 6px (mỗi màu một chấm), không có chip, không nhãn ngày lễ. Chạm ô → Ngày.
- Danh sách: một cột; nhóm ngày là tiêu đề nhỏ; mỗi dòng cao tối thiểu 44px: chấm, tiêu đề 14/500, giờ 12px bên dưới.
- Chạm ô trống → `create.onCreate` một slot (nếu có `option.create`). Chạm giữ 400ms trên sự kiện → nhấc lên (`navigator.vibrate?.(10)`), rồi kéo. Đổi giờ kết thúc chỉ khi khối đang chọn.
- Vuốt ngang trên lưới Ngày và dải ngày: `|dx| ≥ 60px` và `|dx| > |dy|` → ngày (hoặc tuần, trên dải) trước, sau.
- Vùng chạm tối thiểu 44×44px cho mọi nút.

## 13. Trạng thái của component

| Trạng thái | Hiển thị |
| --- | --- |
| `onLoad` đang chạy, lần đầu | Thanh tiến trình + khối xương tĩnh (nền `--sd-surface-muted`, bo 6px) ở vài vị trí cố định; `aria-busy="true"` trên vùng lưới. |
| `onLoad` đang chạy, sau khi đổi khoảng hoặc `reload()` | Chỉ thanh tiến trình. `reload()` giữ sự kiện cũ; đổi khoảng thì lưới trống tới khi có kết quả. Vẫn điều hướng được, không tạo, không dời. |
| `onLoad` throw hoặc reject | Dải lỗi dưới thanh công cụ: `core.component.calendar.load-error` và nút Thử lại (gọi `reload()`). Lưới vẫn hiện, không có sự kiện. Không hiển thị nội dung exception. |
| Dữ liệu không hợp lệ | `sd-data-state state="error" compact` với `core.component.calendar.invalid-data`, thay vùng lưới. |
| Danh sách trống | Mục 11. |
| `readonly` | Không tạo, không dời, không tay nắm; con trỏ trên ô trống `default`. Vẫn chọn, điều hướng. |
| `disabled` | Như readonly, thêm `aria-disabled="true"` trên vùng lưới, sự kiện `tabindex="-1"`, không chọn. Màu giữ nguyên. |

## 14. Token

Token màu, khai báo trong `assets/scss/themes/_component-tokens.scss` theo dạng cặp `(light, dark)` của file đó. Biểu thức trộn từ palette của chính scope nên dùng chung cho light, dark và mọi preset (như Sidebar V4). Mọi tham chiếu có fallback hex của theme default.

| Token | Light và dark | Giá trị đã giải (default light) |
| --- | --- | --- |
| `--sd-calendar-line` | `color-mix(in srgb, var(--sd-border) 55%, var(--sd-surface))` | `#dedee5` |
| `--sd-calendar-line-half` | `color-mix(in srgb, var(--sd-border) 25%, var(--sd-surface))` | `#efeef3` |
| `--sd-calendar-off-hours` | `color-mix(in srgb, var(--sd-surface-muted) 45%, var(--sd-surface))` | `#f3f3f7` (≈) |
| `--sd-calendar-now` | `var(--sd-error)` | `#ba1a1a` |
| `--sd-calendar-today` | `var(--sd-primary)` | `#005cbb` |

Biến kích thước khai báo trên `:host` của component (không phải theme token, giống `--sd-sidebar-v4-width`): `--sd-calendar-hour-height: 48px`, `--sd-calendar-gutter-width: 56px` (compact 48px), `--sd-calendar-event-radius: var(--sd-radius-6, 6px)` nếu thang có `6`, không thì `6px`. `--sd-calendar-event-color` là biến nội bộ trên từng khối.

Thêm các token màu vào `THEME.md` (bảng như Sidebar V4). `check:scss-hex` phải xanh.

## 15. Trợ năng và i18n

- Gốc: `<section role="region" [attr.aria-label]>` (fallback `core.component.calendar.label`), `data-autoid`.
- Một vùng `role="status" aria-live="polite" aria-atomic="true"` ẩn (dùng class sr-only có sẵn) cho: con trỏ lưới, đang lưu, đã dời, đã đổi giờ, từ chối, lỗi, huỷ, ngoài giới hạn.
- Nhãn sự kiện: “{title}, {weekday} {date}, {start} đến {end}[, lặp lại]”; cả ngày: “{title}, cả ngày, {from} đến {to}”.
- Ô Tháng: “{weekday} {date}[, {holiday}], {count} sự kiện”.
- Nút điều hướng có `aria-label` theo đơn vị (“Tuần trước”, “Tháng sau”, “14 ngày trước”).
- Nhóm chuyển chế độ `role="group"` + `aria-label`, mỗi nút `aria-pressed`.
- Ghost tạo mới, khung nét đứt, chấm màu, icon trang trí: `aria-hidden="true"`.
- `prefers-reduced-motion`: không transition khi thả và khi đổi khoảng, icon đang lưu đứng yên. Thanh tiến trình giữ.
- `forced-colors: active`: khối có viền `CanvasText`, khối chọn viền 2px `Highlight`, đường giờ hiện tại `Highlight`.

Key mới `core.component.calendar.*`, đủ vi/en/ja/ko/zh. Dùng lại key có sẵn nếu đúng nghĩa (Huỷ, Thử lại, Bỏ qua) — tìm trong `i18n/src/vi.ts` trước.

| Key | vi | en |
| --- | --- | --- |
| `label` | Lịch | Calendar |
| `today` | Hôm nay | Today |
| `views` | Chế độ xem | View |
| `view-month` / `view-week` / `view-day` / `view-agenda` | Tháng / Tuần / Ngày / Danh sách | Month / Week / Day / Agenda |
| `prev-month` / `next-month` | Tháng trước / Tháng sau | Previous month / Next month |
| `prev-week` / `next-week` | Tuần trước / Tuần sau | Previous week / Next week |
| `prev-day` / `next-day` | Ngày trước / Ngày sau | Previous day / Next day |
| `prev-agenda` / `next-agenda` | {count} ngày trước / {count} ngày sau | Previous {count} days / Next {count} days |
| `weekday-short-0` … `-6` | CN, T2, T3, T4, T5, T6, T7 | Sun, Mon, Tue, Wed, Thu, Fri, Sat |
| `title-week` | {from} – {to} tháng {month}, {year} | {monthName} {from} – {to}, {year} |
| `title-range` | {from} – {to} | {from} – {to} |
| `title-month` | Tháng {month}, {year} | {monthName} {year} |
| `all-day` | Cả ngày | All day |
| `more` | +{count} khác | +{count} more |
| `new-event` | Sự kiện mới | New event |
| `recurring` | lặp lại | repeats |
| `event-label` | {title}, {weekday} {date}, {start} đến {end} | {title}, {weekday} {date}, {start} to {end} |
| `event-label-all-day` | {title}, cả ngày, {from} đến {to} | {title}, all day, {from} to {to} |
| `day-label` | {weekday} {date}, {count} sự kiện | {weekday} {date}, {count} events |
| `slot-label` | {weekday} {date}, {time} | {weekday} {date}, {time} |
| `grid-instructions` | Dùng phím mũi tên để chọn khung giờ, Enter để tạo sự kiện, Page Up và Page Down để đổi khoảng. | Use arrow keys to choose a time slot, Enter to create an event, Page Up and Page Down to change the range. |
| `event-instructions` | Enter để chọn. Alt và phím mũi tên để dời, thêm Shift để đổi giờ kết thúc. | Press Enter to select. Use Alt and arrow keys to move, add Shift to change the end time. |
| `scope-message` | “{title}” là sự kiện lặp. Áp dụng thay đổi cho: | “{title}” repeats. Apply the change to: |
| `scope-this` / `scope-following` / `scope-all` | Chỉ lần này / Lần này và các lần sau / Tất cả | This event / This and following events / All events |
| `pending` | Đang lưu {title} | Saving {title} |
| `saving` | Đang lưu | Saving |
| `moved` | Đã dời {title} sang {weekday} {date}, {time} | Moved {title} to {weekday} {date}, {time} |
| `resized` | Đã đổi {title} thành {start} – {end} | Changed {title} to {start} – {end} |
| `cancelled` | Đã huỷ thay đổi | Change cancelled |
| `rejected` | Không dời được sự kiện. | The event could not be moved. |
| `error` | Không lưu được thay đổi. | The change could not be saved. |
| `out-of-range` | Ngoài khoảng cho phép. | Outside the allowed range. |
| `empty-agenda` | Không có sự kiện trong {count} ngày này. | No events in these {count} days. |
| `invalid-data` | Dữ liệu lịch không hợp lệ. | The calendar data is invalid. |
| `load-error` | Không tải được lịch. | The calendar could not be loaded. |
| `create-error` | Không tạo được sự kiện. | The event could not be created. |

ja/ko/zh: dịch cùng nghĩa; thứ ngắn ja 日月火水木金土, ko 일월화수목금토, zh 日一二三四五六; `title-week` theo thứ tự năm-tháng-ngày của từng ngôn ngữ.

## 16. In

`@media print` trong SCSS của component: ẩn nút điều hướng, nhóm chế độ, thanh tiến trình, dải lỗi; giữ tiêu đề. Vùng cuộn `height: auto; overflow: visible`, chỉ in từ giờ làm sớm nhất đến muộn nhất của các ngày đang xem (dịch lưới bằng `margin-top` âm hoặc tính lại `top`). Khối sự kiện: nền `transparent`, viền 1px `--sd-calendar-event-color`, `break-inside: avoid`. Không khai báo `@page` (để app quyết định khổ giấy).

## 17. E2E

Trên gốc: `data-autoid="components-calendar-{autoId}"`, `data-view`, `data-from`, `data-to`. Trên khối: `data-autoid="components-calendar-{autoId}-event-{token}"` (token = `encodeURIComponent(id)`), `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-selected`. Ô Tháng: `data-date`. Chỉ phát `data-autoid` khi có `autoId`.

## 18. Spec phải viết trước (RED)

`calendar.utils.spec.ts`
- Khoảng xem của 4 chế độ, `firstDayOfWeek` 0/1/6, `hideWeekends`, tháng có 4, 5, 6 hàng, `agendaDays`.
- Xếp chồng: không giao, giao 2, chuỗi giao bắc cầu, cùng giờ bắt đầu, khối kết thúc đúng lúc khối khác bắt đầu không giao.
- Xếp hàng cả ngày: thứ tự, tái dùng hàng, cắt theo khoảng xem, giới hạn 3 hàng và số “+N” từng ngày.
- Làm tròn quét và dời theo `step`, `moveStep`, kẹp 00:00–24:00, tối thiểu khi đổi giờ kết thúc.
- Sự kiện qua nửa đêm và kết thúc đúng 24:00.

`calendar.component.spec.ts`
- Render 4 chế độ; `views` lọc nút; `view` không hợp lệ rơi về phần tử đầu.
- `onLoad`: gọi một lần khi khởi tạo với `{ from, to, view, signal }` đúng; gọi lại khi điều hướng, đổi chế độ, đổi `firstDayOfWeek`; không gọi khi khoảng không đổi; lần cũ bị abort và kết quả muộn bị bỏ; đồng bộ và Promise đều được; client trả cả mảng thì chỉ hiện sự kiện trong khoảng; `reload()` giữ sự kiện cũ tới khi có kết quả; option mới → tải lại.
- `sdRangeChange` phát cùng lúc với `onLoad`, không phát lặp; compact nhận `view: 'day'`.
- Lỗi tải: dải lỗi, Thử lại gọi lại `onLoad`, không lộ nội dung exception.
- Zone: với `timeZone: 'Asia/Ho_Chi_Minh'`, instant `'1960-05-19T16:00:00Z'` nằm ở ngày 20/05/1960; args `onCreate` không transform ra `'yyyy/MM/dd HH:mm:ss'`, `transform="ISOString"` ra instant trong zone.
- Tạo: không có `option.create` thì không có khối nét đứt; quét gọi `onCreate` đúng khoảng; bấm gọi một slot; Enter trên lưới; `creatable` false không gọi; khoá, ngoài `minDate` không gọi; trả sự kiện → chèn và chọn; trả void → không đổi; throw → dải thất bại; đang chờ thì chặn tạo và dời khác.
- Dời: không có `option.move` thì không tay nắm, `Alt` không dời, `move()` trả false; `movable` false cho một sự kiện; `onMove` true/void → dữ liệu đổi rồi `sdMove`; false → `sdMoveError` `rejected`, dữ liệu giữ nguyên; throw → `error`; đổi khoảng hoặc `reload()` trong lúc chờ → abort và bỏ kết quả; chỉ một thao tác chờ; `data` giữ tham chiếu sau khi dời.
- `Alt` + phím dời đúng bước; không `Alt` không dời; qua mép đổi `date` và focus theo; RTL đảo `←` `→`.
- Lần lặp: mở thanh hỏi, focus nút đầu, Esc huỷ không gọi `onMove`; chọn phạm vi → request có `scope`; `'following'`/`'all'` → `reload()` sau khi chấp nhận; `source: 'api'` không hỏi.
- Đổi giờ kết thúc: tối thiểu, tối đa 24:00.
- Chọn: đặt `selectedId`, phát `sdSelect` với `SdCalendarEvent`; id biến khỏi dữ liệu → `selectedId` về null.
- Tháng: phím roving, Enter mở Ngày, “+N khác”.
- Danh sách: bỏ ngày trống, trạng thái trống, template trống.
- Dữ liệu không hợp lệ: id trùng, title rỗng → lỗi dữ liệu; ngày hỏng → bỏ qua sự kiện đó.
- readonly, disabled.
- Compact: giả lập `ResizeObserver` < 600px → dải ngày, 3 nút chế độ, `cdkDragStartDelay` cho cảm ứng.
- A11y: `aria-label` khối, `aria-pressed`, `aria-activedescendant`, live region, `aria-busy`.
- `dimPast`, `hideWeekends`, `holidays` off/observance, `workingHours = null`.
- `data-autoid` chỉ có khi có `autoId`.

## 19. Showcase

Trang “Calendar” trong showcase, cùng khung với các trang component khác. Dữ liệu như HTML (tuần 19–25/10/2026). Công tắc: `view`, `step`, `firstDayOfWeek`, `hideWeekends`, `workingHours` bật/tắt, `holidays`, `minDate`, `dimPast`, `readonly`, `disabled`, `transform`; nguồn dữ liệu client (trả cả mảng) và server (trễ 600ms, có tuỳ chọn ném lỗi); có hoặc không `option.create` (dialog demo trả sự kiện hoặc huỷ); có hoặc không `option.move`, `movable` khoá sự kiện đã qua, `onMove` chấp nhận, từ chối, ném lỗi, chậm 2 giây; sự kiện lặp mở rộng sẵn phía demo. Panel chi tiết do demo dựng từ `sdSelect`. Ví dụ code cho client, server, template ô Tháng (chấm công).
