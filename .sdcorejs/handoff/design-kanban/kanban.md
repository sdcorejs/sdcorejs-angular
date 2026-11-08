# sd-kanban · API mới · thông số

Nguồn chính của gói. Khi HTML minh hoạ và file này khác nhau, làm theo file này. Spec đọc trên `main` ngày 08/11/2026 (`components/kanban/**`, `sd-kanban.md`, `THEME.md`, showcase `pages/components/kanban`).

## 0. Phạm vi

Làm:
- Đổi public API của `sd-kanban` theo quy ước của sd-calendar, sd-file-explorer, sd-timeline, sd-scheduler. Breaking change, không giữ alias.
- Thẻ dạng `SdKanbanCard<T>` (`id`, `columnId`, `title`, `data?`). Dữ liệu là `items` có sẵn, hoặc `option.dataSource.onLoad` tải theo từng cột bằng cursor.
- Nhóm `option.move = { movable, droppable, reorder, onMove }`. `droppable` chạy ngay khi bắt đầu kéo để làm mờ cột không nhận.
- Chọn thẻ (`selectedId`, `sdSelect`). Kéo bằng cả thẻ, bỏ tay nắm.
- Header có `summary`, số đếm theo `total` của server, “Xem thêm” theo cột.
- Ô tìm kiếm mặc định tắt.
- Ngưỡng hẹp đo theo bề rộng host.

Giữ nguyên (không viết lại):
- Pipeline dời bi quan trong `#move`: một thao tác chờ cho cả board, `AbortController`, `#current()` bỏ kết quả muộn, `#trackFocus`/`#focusCard`, live region, lỗi trên thẻ và dải lỗi board khi thẻ không hiện. Chỉ đổi đầu vào, đầu ra như mục 7.5.
- Hình ảnh và 6 token `--sd-kanban-*` (review 19/10). Không thêm token.
- Làn thu gọn, `collapsedColumns`, menu “Chuyển sang…”, RTL, `forced-colors`, `prefers-reduced-motion`.

Không làm:
- Swimlane, realtime, giới hạn WIP, CRUD thẻ, virtual scroll.
- Tự sắp xếp thẻ theo field của `data`.

## 1. File

```
versions/v19/projects/sdcorejs-angular/components/kanban/
  sd-kanban.md                     // viết lại theo API mới, có bảng chuyển đổi
  src/kanban.model.ts | kanban.templates.ts | kanban.utils.ts | .spec.ts
  src/kanban.component.ts | .html | .scss | .spec.ts
showcase/src/app/pages/components/kanban/kanban-demo.component.ts
i18n/src/{vi,en,ja,ko,zh}.ts       // core.component.kanban.*
CHANGELOG.md                       // ## [Unreleased] · Changed (breaking) + Added
```

## 2. Quy ước API

| Public API | Theo | Ghi chú |
| --- | --- | --- |
| `SdKanbanCard<T>`: `id: string`, `data?: T` | `SdCalendarEvent`, `SdTimelineItem`, `SdFileExplorerItem` | Bỏ `getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`. |
| `items` hoặc `option.dataSource.onLoad` + `pageSize` + `loadMore` | sd-timeline | Theo cột: `args.columnId`. |
| `option.move = { movable?, droppable?, reorder?, onMove }` | sd-file-explorer, sd-calendar; `droppable` như sd-scheduler | Bỏ `option.move()` và `option.canMove()`. |
| `SdKanbanState<C> = boolean \| ((context: C) => boolean)` | `SdFileExplorerState`, `SdCalendarState` | |
| `selectedId` (model), `sdSelect` | sd-calendar | |
| `reload()`, `loadMore()`, `move()` | sd-timeline, sd-calendar | |
| `sdLoadError` | sd-timeline | Thay `sdRetry`. |
| `id: string` | mọi component | Bỏ `SdKanbanId`. |
| Ngưỡng hẹp theo host (`ResizeObserver`) | sd-calendar 12 | Thay `@media (max-width: 599px)`. |

## 3. Model

```ts
import { Color } from '@sdcorejs/utils/models';

export type SdKanbanMoveSource = 'drag' | 'menu' | 'keyboard' | 'api';
export type SdKanbanState<C> = boolean | ((context: C) => boolean);

export interface SdKanbanColumn {
  readonly id: string;
  readonly label: string;
  readonly color?: Color;
  readonly prefixIcon?: string;
  readonly disabled?: boolean;
  /** Dòng phụ dưới nhãn ("18,4 triệu ₫"). Có dataSource thì LoadResult.summary ghi đè. */
  readonly summary?: string;
}

export interface SdKanbanCard<T = unknown> {
  /** Duy nhất trên cả board. */
  readonly id: string;
  /** Phải là id của một cột trong columns. */
  readonly columnId: string;
  /** Không rỗng; tên đọc cho trình đọc màn hình và nhãn của nút tên. */
  readonly title: string;
  /** Chuỗi để tìm khi searchable và không có dataSource. Mặc định title. */
  readonly searchText?: string;
  /** DTO của consumer, giữ nguyên tham chiếu. */
  readonly data?: T;
}

export interface SdKanbanLoadArgs {
  readonly columnId: string;
  /** null ở trang đầu và sau reload(). */
  readonly cursor: string | null;
  readonly pageSize: number;
  /** keyword đã trim; '' khi không tìm. */
  readonly keyword: string;
  readonly signal: AbortSignal;
}

export interface SdKanbanLoadResult<T = unknown> {
  /** columnId của mọi thẻ phải bằng args.columnId. */
  readonly items: readonly SdKanbanCard<T>[];
  /** null khi hết. */
  readonly nextCursor: string | null;
  /** Tổng số thẻ của cột theo keyword và bộ lọc của server. Chỉ đọc ở trang đầu. */
  readonly total?: number;
  /** Ghi đè column.summary. Chỉ đọc ở trang đầu. */
  readonly summary?: string;
}

export interface SdKanbanDropContext<T = unknown> {
  readonly card: SdKanbanCard<T>;
  readonly from: SdKanbanColumn;
  readonly to: SdKanbanColumn;
}

export interface SdKanbanMoveRequest<T = unknown> {
  readonly card: SdKanbanCard<T>;
  /** index trong dữ liệu đã tải của cột nguồn. */
  readonly from: { readonly columnId: string; readonly index: number };
  /** reorder tắt: index và beforeId là null. reorder bật: index trong dữ liệu đã tải sau khi bỏ thẻ nguồn;
   *  beforeId là id của thẻ ngay sau chỗ thả, null là cuối cột. */
  readonly to: { readonly columnId: string; readonly index: number | null; readonly beforeId: string | null };
  readonly source: SdKanbanMoveSource;
  readonly signal: AbortSignal;
}

export interface SdKanbanMoveError<T = unknown> {
  readonly request: SdKanbanMoveRequest<T>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

export interface SdKanbanLoadError {
  readonly columnId: string;
  readonly error: unknown;
}

export interface SdKanbanOption<T = unknown> {
  dataSource?: {
    onLoad: (args: SdKanbanLoadArgs) => SdKanbanLoadResult<T> | Promise<SdKanbanLoadResult<T>>;
  };
  /** Mặc định 20. */
  pageSize?: number;
  /** Mặc định 'button'. */
  loadMore?: 'button' | 'auto';
  /** Không khai báo: không kéo, không menu chuyển, không Alt + phím. */
  move?: {
    /** Mặc định true. */
    movable?: SdKanbanState<SdKanbanCard<T>>;
    /** Mặc định true. Đồng bộ; chạy khi bắt đầu kéo, khi mở menu, khi Alt + phím và ngay trước onMove. */
    droppable?: SdKanbanState<SdKanbanDropContext<T>>;
    /** Mặc định false: chỉ đổi cột. */
    reorder?: boolean;
    /**
     * true hoặc void: chấp nhận. false: từ chối (lỗi trên thẻ, sdMoveError).
     * 'cancel': người dùng huỷ trong luồng của consumer (đóng hộp nhập lý do): về chỗ cũ, không báo lỗi.
     * Throw hoặc reject: lỗi.
     */
    onMove: (request: SdKanbanMoveRequest<T>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}

export interface SdKanbanCardTemplateContext<T> {
  readonly $implicit: SdKanbanCard<T>;
  readonly card: SdKanbanCard<T>;
  readonly column: SdKanbanColumn;
  readonly index: number;
  readonly pending: boolean;
  readonly selected: boolean;
}

export interface SdKanbanColumnTemplateContext {
  readonly $implicit: SdKanbanColumn;
  readonly column: SdKanbanColumn;
  /** total của server, hoặc số thẻ của cột trong items. null khi chưa biết (đang tải lần đầu, lỗi). */
  readonly total: number | null;
  /** Số thẻ đang hiện (sau keyword ở chế độ items). */
  readonly visibleCount: number;
  readonly summary: string | null;
  readonly collapsed: boolean;
}
```

Bỏ khỏi model: `SdKanbanId`, `getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`, `filter`, `canMove`, `searchable`, `collapsible`, `previousItems`, `nextItems`.

## 4. Input, output, method

| Input | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `columns` | `readonly SdKanbanColumn[]` | bắt buộc (`input.required`) | |
| `option` | `SdKanbanOption<T>` | bắt buộc | `{}` khi chỉ hiển thị `items`. |
| `items` | `readonly SdKanbanCard<T>[] \| undefined` | `undefined` | Bỏ qua khi có `option.dataSource`; cảnh báo dev mode nếu truyền cả hai. |
| `selectedId` | `model<string \| null>` | `null` | id không còn trong dữ liệu thì về `null`. |
| `keyword` | `model<string>` | `''` | |
| `searchable` | `boolean` (`booleanAttribute`) | `false` | Hiện ô tìm kiếm. `keyword` vẫn dùng được khi `false` (consumer có ô riêng). |
| `collapsible` | `boolean` | `true` | |
| `collapsedColumns` | `model<readonly string[]>` | `[]` | |
| `disabled`, `readonly`, `ariaLabel`, `autoId` | như main | | |

Bỏ: `model`, `loading`, `error`.

| Output | Payload | Khi nào |
| --- | --- | --- |
| `sdSelect` | `SdKanbanCard<T>` | Bấm (pointer di chuyển < 5px), chạm, Enter, Space trên thẻ. Cũng đặt `selectedId`. |
| `sdMove` | `SdKanbanMoveRequest<T>` | Sau khi `onMove` chấp nhận và dữ liệu nội bộ đã đổi. |
| `sdMoveError` | `SdKanbanMoveError<T>` | `onMove` trả `false` hoặc lỗi. Không phát khi `'cancel'`. |
| `sdLoadError` | `SdKanbanLoadError` | `onLoad` ném lỗi, ở trang đầu hoặc trang sau. |

Bỏ: `modelChange`, `sdChange`, `sdRetry`.

Method:
- `reload(columnId?: string): void`: huỷ lần tải đang chạy của cột (hoặc mọi cột), gọi lại `onLoad` với `cursor: null`. Giữ thẻ cũ tới khi có kết quả. Không có `dataSource` thì không làm gì.
- `loadMore(columnId: string): void`: tải trang kế; bỏ qua khi đang tải hoặc `nextCursor === null`.
- `move(cardId: string, to: { columnId: string; beforeId?: string | null }, source: SdKanbanMoveSource = 'api'): Promise<boolean>`: chạy pipeline 7.5. `beforeId` bị bỏ qua khi `reorder` tắt. Dùng cho Hoàn tác (S1): `move(request.card.id, { columnId: request.from.columnId })`.

## 5. Dữ liệu

### 5.1 `items`
- Component giữ bản sao nội bộ. `items` tham chiếu mới thay bản sao (như calendar khi `option` đổi); thao tác chờ bị huỷ.
- Thứ tự trong cột là thứ tự trong mảng.
- `searchable` hoặc `keyword` khác rỗng: lọc theo `searchText ?? title`, `toLocaleLowerCase(locale)`, chứa chuỗi. Số đếm “hiện/tổng” như main.
- Sau khi chấp nhận dời: thay thẻ bằng `{ ...card, columnId: to.columnId }` (giữ tham chiếu `data`). `reorder` tắt: giữ vị trí của thẻ trong mảng. `reorder` bật: chèn trước `beforeId` (hoặc sau thẻ cuối của cột đích). Dùng lại cách tính vị trí trong `prepareKanbanMove` hiện có.

### 5.2 `option.dataSource`
- Mỗi cột có state riêng: `cards`, `nextCursor`, `total`, `summary`, `status: 'idle' | 'loading' | 'loading-more' | 'error'`, `error`, `AbortController`.
- Khởi tạo: gọi `onLoad` song song cho mọi cột không `collapsed`. Cột thu gọn tải khi mở lần đầu; header cột thu gọn chưa tải hiện số “–”.
- `columns` tham chiếu mới: cột mới thì tải, cột bị bỏ thì huỷ, cột giữ nguyên id thì giữ state.
- `keyword` đổi: debounce 300ms, huỷ mọi lần tải, tải lại mọi cột đã tải từ `cursor: null`.
- `option` tham chiếu mới: như `reload()` mọi cột.
- Kết quả muộn (signal đã huỷ) bị bỏ. Thẻ trùng id giữa các trang hoặc giữa các cột: giữ bản đầu, cảnh báo dev mode.
- Sau khi chấp nhận dời: bỏ thẻ khỏi cột nguồn, `total` nguồn − 1; thêm vào cột đích (`reorder` tắt: đầu cột; bật: trước `beforeId`), `total` đích + 1. Không gọi lại `onLoad`.
- `loadMore: 'auto'`: `IntersectionObserver` trên nút “Xem thêm” trong vùng cuộn của làn, `rootMargin: 200px`; không có `IntersectionObserver` thì giữ nút.

## 6. Bố cục

Mọi thứ không ghi ở đây giữ như `kanban.component.scss` trên main.

| Phần | Thông số |
| --- | --- |
| Header làn | Như main. Thêm dòng `summary` dưới nhãn: 12/16, `--sd-text-secondary`, `tabular-nums`, cắt bằng …. Nhãn và summary nằm trong một khối `flex-direction: column` thay chỗ `h3`. |
| Số đếm | `total` khi biết. `items`: số thẻ trong cột; đang lọc thì “hiện/tổng” như main. `dataSource` chưa có `total`: số đã tải, thêm “+” khi `nextCursor` khác null. Chưa biết: “–”. |
| Xem thêm | Cuối danh sách thẻ, trong padding của làn. Nút chữ cao 32px, rộng hết, 13/500 `--sd-primary`, hover nền `color-mix(in srgb, var(--sd-primary) 8%, transparent)`, bo 6px. Chữ `load-more` với `count = min(pageSize, total − đã tải)`, không biết `total` thì `pageSize`. |
| Đang tải thêm | Thay nút: spinner 14px (dùng spinner Core có sẵn) và `loading` 13px `--sd-text-secondary`. |
| Đang tải lần đầu | 3 khối xương cao 74px, bo 8px, nền `--sd-surface-muted`; `aria-busy="true"` trên drop list. |
| Lỗi tải | Trang đầu: thay vùng thẻ bằng khối giữa: icon `error` 22px `--sd-error`, `load-error` 13px, nút “Thử lại” cao 28px viền `--sd-error` (cùng kiểu dải lỗi của calendar). Trang sau: thay nút Xem thêm bằng dòng `load-error` + Thử lại. `role="alert"`. |
| Thẻ | Bỏ nút tay nắm. Tên thẻ (`card.title` hoặc nội dung template) đặt trong `<button type="button" class="sd-kanban__card-main">` có `::after { position:absolute; inset:0 }` phủ thẻ. Nút ⋯ và `.sd-kanban__card-actions` có `position: relative; z-index: 1`. Con trỏ: `pointer`; `grab` khi có `option.move` và thẻ movable; `grabbing` khi đang kéo. |
| Thẻ đang chọn | Viền `--sd-primary`, `box-shadow: inset 0 0 0 1px var(--sd-primary)`, nền `color-mix(in srgb, var(--sd-primary) 4%, var(--sd-surface))`. Pending và failed vẫn ưu tiên màu viền của chúng. |
| Focus | `.sd-kanban__card:has(.sd-kanban__card-main:focus-visible)`: vòng focus chuẩn quanh thẻ, offset 2px. Nút tên không tự vẽ outline. |
| Làn bị `droppable` từ chối | Header và danh sách thẻ `opacity: .45`, con trỏ `not-allowed`, `aria-disabled="true"` trên drop list. Không đổi nền làn. Áp dụng cho mọi làn bị từ chối, từ lúc `cdkDragStarted` tới `cdkDragEnded`. |
| Làn nhận | Như main (chỉ làn dưới con trỏ). `reorder` tắt: không có khe thả; chỗ cũ của thẻ ở làn nguồn `opacity: .4`. `reorder` bật: khe nét đứt như main. |
| Hẹp | `compact` = bề rộng host < 600px (`ResizeObserver`, có kiểm tra tồn tại). Làn 260px như main. Bỏ `@media (max-width: 599px)`. |

## 7. Tương tác

### 7.1 Chọn
Bấm, chạm, Enter, Space trên nút tên → `selectedId = card.id`, phát `sdSelect(card)`. Bấm lại thẻ đang chọn: vẫn phát (consumer có thể mở lại drawer). Esc khi focus trong thẻ: `selectedId = null`. `disabled`: không chọn. `readonly`: vẫn chọn.

### 7.2 Kéo
- `cdkDrag` trên `article`, không có `cdkDragHandle`. `cdkDragStartDelay = { touch: 400, mouse: 0 }`. Ngưỡng 5px của CDK phân biệt bấm và kéo; CDK không phát click sau khi kéo, kiểm tra lại trong spec.
- `cdkDragDisabled`: khoá board, thao tác chờ, cột nguồn disabled, hoặc `movable` false.
- `cdkDragStarted`: tính `droppable` cho mọi cột (trừ cột nguồn) một lần, lưu vào signal `blockedColumns`. `enterPredicate` đọc signal đó cùng các điều kiện hiện có.
- `reorder` tắt: `cdkDropListSortingDisabled` trên mọi drop list. Thả vào cột nguồn là no-op.
- Thả lên cột bị từ chối, ngoài board, Esc: no-op.

### 7.3 Menu “Chuyển sang…”
- Mở menu: tính `droppable` cho từng cột; mục bị từ chối thì `disabled`.
- “Lên”, “Xuống” chỉ hiện khi `reorder` bật.

### 7.4 Bàn phím
| Phím (trên nút tên) | Hành động |
| --- | --- |
| `Enter` `Space` | Chọn (7.1). |
| `Esc` | Bỏ chọn. |
| `Alt` + `←` `→` | Sang cột kế cho phép: bỏ qua cột disabled, thu gọn, bị `droppable` từ chối. Đảo khi RTL. |
| `Alt` + `↑` `↓` | Chỉ khi `reorder` bật: lên, xuống một vị trí trong dữ liệu đã tải. |

Hướng dẫn ẩn (`instructions`) đổi theo `reorder`. Focus sau khi dời: như main, nhưng trỏ tới nút tên thay vì tay nắm.

### 7.5 Pipeline dời
Giữ `#move` của main, đổi:
1. Đầu vào: `(cardId, to: { columnId, beforeId? }, source)`. Bỏ qua nếu không có `option.move`, khoá, đang chờ, không tìm thấy thẻ, cột đích disabled hoặc không tồn tại, `movable` false, `droppable` false, cùng cột khi `reorder` tắt, cùng vị trí khi `reorder` bật.
2. Dựng `SdKanbanMoveRequest` (mục 3). Bỏ `withColumn` và kiểm tra id của nó.
3. Kết quả `'cancel'`: như huỷ: bỏ pending, không `#fail`, không `sdMoveError`, đọc `cancelled`, focus về thẻ.
4. Chấp nhận: cập nhật dữ liệu nội bộ như 5.1 hoặc 5.2, mở cột đích nếu đang thu gọn (như main), phát `sdMove`. Không còn `modelChange`, `sdChange`.
5. Điều kiện huỷ (`#current`, effect trong constructor): đổi `this.model()` thành tham chiếu `items` (chế độ items) hoặc “cột nguồn hoặc cột đích vừa được tải lại” (chế độ dataSource). `option`, `columns` đổi tham chiếu và `locked` giữ như main.

## 8. Trạng thái board

| Trạng thái | Hiển thị |
| --- | --- |
| Dữ liệu không hợp lệ (`items`) | Như main: `sd-data-state` lỗi `invalid-data`. Điều kiện: id thẻ trùng hoặc rỗng, `columnId` không có trong `columns`, `title` rỗng, id cột trùng, `label` rỗng. |
| Dữ liệu không hợp lệ (`dataSource`) | Thẻ có `columnId` khác `args.columnId` hoặc `title` rỗng: bỏ thẻ đó, cảnh báo dev mode. Không chặn cả board. |
| Không có cột | Như main. |
| `readonly` | Không kéo, menu chuyển khoá, Alt + phím không dời. Vẫn chọn, tìm, thu gọn, tải thêm. |
| `disabled` | Như readonly, thêm không chọn, không tìm, không thu gọn, nút tên `disabled`. |

Bỏ trạng thái `loading` và `error` cấp board (đã chuyển xuống từng cột).

## 9. Template

Giữ 4 directive và `ngTemplateContextGuard`. Đổi context theo mục 3. `SdKanbanCardTemplateDirective` nhận `[sdKanbanCardTemplate]="option"` để suy kiểu `T` như main. Template thẻ nằm **bên trong** nút tên, nên không được chứa control tương tác; control đặt ở `sdKanbanCardActionsTemplate`. Ghi rõ trong `sd-kanban.md` và kiểm tra lúc dev: template thẻ có `button`, `a[href]`, `input`, `select`, `textarea` hoặc `[tabindex]` thì cảnh báo một lần.

## 10. Token
Không thêm. Thẻ chọn và nút Xem thêm dùng `color-mix` trên `--sd-primary` như mục 6. `check:scss-hex` phải xanh.

## 11. Trợ năng và i18n
- Nút tên: `aria-describedby` trỏ tới `instructions` (và lỗi khi thẻ thất bại, như main). `aria-pressed` không dùng; trạng thái chọn đọc qua `aria-current="true"` trên `article`.
- Làn bị từ chối: `aria-disabled="true"`; đọc `drop-blocked` khi thả vào.
- Live region giữ một vùng như main.

Key `core.component.kanban.*`, đủ 5 locale. Mới:
| Key | vi | en |
| --- | --- | --- |
| `load-more` | Xem thêm {count} thẻ | Show {count} more |
| `loading` | Đang tải… | Loading… |
| `load-error` | Không tải được cột này. | This column couldn't be loaded. |
| `drop-blocked` | Không chuyển sang {column} được | Can't move to {column} |
| `cancelled` | Đã huỷ chuyển {title} | Move of {title} cancelled |
| `instructions-column` | Enter để chọn. Alt + mũi tên trái, phải để chuyển cột. | Enter to select. Alt + Left or Right to change column. |
| `selected` | Đã chọn {title} | {title} selected |

Giữ `instructions` cho `reorder` bật (sửa câu: bỏ nhắc tay nắm). Bỏ `move-card` (tay nắm). Dùng lại key “Thử lại” chung.

## 12. E2E
Giữ `data-autoid` của main. Token thẻ và cột đổi thành `encodeURIComponent(id)` (bỏ tiền tố `typeof`). Thêm trên `article`: `data-selected`, `data-pending`; trên làn: `data-blocked` khi đang kéo, `data-status` (`idle`, `loading`, `loading-more`, `error`) ở chế độ dataSource.

## 13. Spec RED

`kanban.utils.spec.ts`
- Vị trí sau khi dời (items): `reorder` tắt giữ vị trí mảng; bật chèn trước `beforeId`, cuối cột khi `null`; cùng cột lên, xuống.
- Kiểm tra dữ liệu không hợp lệ theo mục 8.
- Tìm cột kế cho Alt + ← → bỏ qua disabled, thu gọn, bị từ chối, RTL.

`kanban.component.spec.ts`
- `items`: render, tham chiếu mới thay dữ liệu và huỷ thao tác chờ, cảnh báo khi có cả `dataSource`.
- `dataSource`: gọi `onLoad` cho từng cột không thu gọn với `{ columnId, cursor: null, pageSize, keyword: '', signal }`; cột thu gọn tải khi mở; `loadMore` truyền `nextCursor`; kết quả muộn bị bỏ; lỗi trang đầu và trang sau, Thử lại, `sdLoadError`; `total`, `summary` từ trang đầu; `keyword` debounce rồi tải lại mọi cột; `columns` mới chỉ tải cột mới; `reload(columnId)`.
- `droppable`: làn bị từ chối có `data-blocked` khi bắt đầu kéo; thả vào không gọi `onMove`; menu khoá mục; Alt + → bỏ qua.
- `reorder` tắt: không có khe, request có `index: null`, `beforeId: null`, không có Lên/Xuống, Alt + ↑ ↓ không làm gì. Bật: `index` và `beforeId` đúng khi đang lọc và khi cột đang phân trang.
- `onMove`: true, void, false, `'cancel'` (không lỗi, không `sdMoveError`), throw; chỉ một thao tác chờ; `data` giữ tham chiếu.
- Chọn: bấm, Enter, Space phát `sdSelect`, đặt `selectedId`; kéo không phát; Esc bỏ chọn; `disabled` không chọn; id biến mất → `null`.
- `movable` false: không kéo, menu khoá, vẫn chọn.
- `move()` public: Hoàn tác về cột cũ; trả false khi bị chặn.
- `searchable` mặc định false; bật thì có ô tìm kiếm.
- Compact theo `ResizeObserver`.
- Cảnh báo dev khi template thẻ có control tương tác.

## 14. Showcase
Trang Kanban, 4 ví dụ:
1. **Đơn hàng (P1)**: `dataSource` giả lập trễ 400ms, 4 cột, `pageSize` 5, `total` và `summary` tổng tiền, cột “Đã huỷ” thu gọn, `droppable` không cho nhảy cóc (Chờ xác nhận → Hoàn tất), `reorder` tắt, chọn thẻ mở drawer demo, chuyển sang “Đã huỷ” mở hộp nhập lý do (đóng hộp → `'cancel'`), toast “Đã chuyển DH… · Hoàn tác” gọi `move()`. Có công tắc làm cột “Đang giao” ném lỗi.
2. **Công việc**: `items`, `reorder: true`, `searchable`, template thẻ với badge, avatar; actions template.
3. **CMS mapping**: như main, đổi sang map `SdKanbanCard`, `readonly`.
4. **Xác nhận async**: như main (Confirm, Reject, Fail, Refresh), thêm nút Cancel trả `'cancel'`.

## 15. Checkpoint (mỗi checkpoint một commit)
1. Model, template context, `kanban.utils.ts` và spec (RED rồi xanh). Chế độ `items` chạy lại được, các spec cũ đã sửa theo API mới.
2. `option.move` mới: `movable`, `droppable` khi kéo và menu, `reorder`, `'cancel'`, `move()` mới.
3. Chọn thẻ, kéo cả thẻ, nút tên phủ thẻ, bỏ tay nắm, bàn phím, focus.
4. `dataSource` theo cột: tải, tải thêm, `auto`, lỗi, `total`, `summary`, `keyword`, `reload()`.
5. Compact theo host, i18n 5 locale, a11y, E2E.
6. `sd-kanban.md` viết lại (có bảng chuyển đổi), `CHANGELOG.md`, showcase 4 ví dụ, `npm run sync`, `check:sync`.

## 16. Câu hỏi cho Bước 0
1. CDK: với `cdkDrag` trên cả thẻ, click trên nút tên có bị phát sau khi kéo không, và cần chặn ở đâu? `cdkDropListSortingDisabled` có giữ placeholder ở làn nguồn đúng như mục 6 không?
2. Nút tên phủ thẻ bằng `::after` có chặn `pointerdown` của CDK trên `article` không (CDK nghe trên phần tử drag, sự kiện nổi bọt nên dự kiến không)? Nếu có vấn đề, đề xuất cách khác giữ được Tab vào thẻ và đọc đúng tên.
3. `'cancel'` trong `onMove` đã chốt cho cả ba component (`schedule-kanban/SHARED-CONTRACT.md`). Xác nhận cách hiện thực trong `#move` không làm đổi hành vi focus hiện có khi huỷ.
4. Grep các repo dùng `@sdcorejs/angular/components/kanban` ngoài showcase (portal-template, sdcorejs-blueprint nếu truy cập được). Có thì liệt kê để ghi vào CHANGELOG phần chuyển đổi.
5. Debounce `keyword` 300ms đặt ở component hay để consumer tự debounce (như sd-table quick search đang làm thế nào)? Theo cách của sd-table.
