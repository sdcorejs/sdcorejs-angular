# `<sd-table>`

## Khởi tạo và lịch đọc

Table chờ snapshot cấu hình, lookup của các cột hiển thị và filter mặc định/đã lưu
hydrate xong trước khi phát **một initial read**. Giá trị từ URL được truyền qua
default hoặc `filterRegister.value.set(...)` được đưa vào request khi áp dụng;
Core không tự đọc URL. Snapshot đầu của storage chỉ khởi tạo state, không phải
một thao tác đổi filter. Cấu hình hoặc lookup đến bất đồng bộ cũng theo cùng
lifecycle; kết quả cũ không được ghi vào cấu hình/cache khi option đổi hoặc table
bị destroy.

Các thao tác tự động dùng chung một lịch đọc có thể hủy: paging/sort/cấu hình chờ
200 ms; thay đổi filter giữ tổng thời gian chờ cũ 500 + 200 ms. Thay đổi liên tiếp
thay thế lịch đang chờ. `notReload` chỉ commit giá trị; manual external filter vẫn
chờ Apply. Required external filter/tenant chưa hợp lệ tiếp tục chặn loader.

`onFilter` chạy đồng bộ trong bước chuẩn bị request. Nếu hook hydrate URL/saved
filter qua `setFilter()` hoặc `filterRegister.value.set(...)`, các giá trị đó
được đưa vào chính request hiện tại; không tạo một lịch đọc khác để tự hủy lần
đọc đang chạy. Cặp `setFilter()` rồi `notReload: true` vẫn render response đầu
tiên, bao gồm khi URL không có filter. Required tenant được kiểm tra lại sau
hook. Thay đổi filter sau bước chuẩn bị vẫn hủy hiệu lực response cũ như thường.

`reload()` hủy lịch tự động đang chờ và đọc lại chủ động, kể cả payload giống lần
trước. Refresh trong lúc lookup khởi tạo đang chạy chờ hydrate rồi dùng chính lần
đọc đó. Lookup của cột `values` (`option.items`) lỗi — Promise reject hoặc lỗi đồng
bộ — không chặn dữ liệu: bảng vẫn đọc, ô hiện mã thô và lỗi được `console.error`.
Cột lỗi không được ghi cache nên lần cấu hình sau thử lại lookup. Lỗi khởi tạo cấu
hình khác hiển thị error state/Retry kể cả trước khi có cấu hình, tuân theo
`hideReadError` và custom error template; `retryRead()` thực hiện hydrate lại.
Lỗi đọc paging vẫn retry đúng snapshot thất bại như bên dưới. Không cần bật
auto-cache/dedupe cho POST để bảo đảm một initial read.

Nếu gọi `reload()` trước effect khởi tạo hoặc ngay sau khi input `option` đổi,
lời gọi kết thúc an toàn và lần khởi tạo option mới sẽ tải dữ liệu. Không gọi
loader của option cũ trong khoảng chờ effect; reload đang chờ lookup cũng bị bỏ
qua khi option đổi hoặc component bị hủy.

## Trạng thái đọc server và retry

`readState()` là signal readonly `SdReadState`; `(sdReadStateChange)` phát snapshot
`TABLE` với status `idle/loading/ready/empty/error`. Chỉ `error` chứa exception
nguyên bản (`unknown`). `retryRead(): Promise<void>` đọc lại đúng loader và snapshot
filter/paging/sort thất bại, không reset trang hoặc chạy lại `onFilter`.
Request cũ không ghi đè kết quả mới, kể cả trong formatter bất đồng bộ.

Chỉ loader lỗi mới là lỗi đọc. Callback hiển thị của cột (`transform`, `htmlTemplate`,
`tooltip`, `useBadge`, `lazy-values` `views`) ném lỗi hoặc reject thì chỉ ô đó rơi về
giá trị thô (mảng nối bằng `, `, rỗng là `--`); lần đọc vẫn `ready`/`empty` và mỗi cột
log một lần cho mỗi lượt format.

Dữ liệu và lỗi không bao giờ cùng hiển thị: lần đọc hiện hành lỗi sẽ gỡ rows/total
(và tổng aggregate) của lần đọc trước rồi mới hiện `SdDataState` lỗi; retry vẫn dùng
đúng snapshot đã lỗi. Không tạo response giả `{ items: [], total: 0 }`.

Response thành công rỗng dùng empty mặc định 3 nhánh như bảng local: filter không có
kết quả, chưa chọn external filter bắt buộc, hoặc chưa có dữ liệu — ảnh thay được qua
`SD_TABLE_CONFIGURATION.images`. Khi consumer khai báo `sdDataStateTemplate`, empty
đi qua template đó. Vùng empty chỉ hiện khi bảng không có dòng nào.
`hideReadError` (boolean transform, default `false`) ẩn toàn bộ vùng lỗi, bao gồm
custom template, nhưng vẫn giữ signal/output/retry. Local mode giữ luồng hiện có.

```html
<sd-table #table [option]="option" (sdReadStateChange)="readState.set($event)">
  <ng-template sdDataStateTemplate let-state let-retry="retry">
    <p>{{ state }}</p>
    <button type="button" (click)="retry()">Thử lại</button>
  </ng-template>
</sd-table>
```

Import directive từ `@sdcorejs/angular/components/data-state`; types từ
`@sdcorejs/angular/utilities/read-state`. Xem
[contract và migration](../../utilities/read-state/sd-read-state.md).

Bảng local lỗi (loader ném lỗi hoặc không trả mảng) hiện cùng `SdDataState` lỗi như bảng
server, cùng nhánh `sdDataStateTemplate`; nút thử lại gọi `reload()`. Toast cảnh báo
của bảng local vẫn giữ.

## Loading

Nothing covers the table while it loads: the header, inline filters, sort, quick search,
external filters, the paginator and the scrollbars stay usable, and the keyboard is never
blocked. What shows depends on whether rows are on screen:

| `data-loading-view` | When | What shows |
| --- | --- | --- |
| `none` | not loading, or a read faster than `showDelay` | the rows |
| `skeleton` | `loading()` with no rows (first read, after an empty result or an error); also before the configuration is ready and while the first read of an option waits in its debounce | skeleton rows under the real header (`aria-hidden`), at once; mobile cards: up to 3 skeleton cards |
| `refresh` | `loading()` with rows for longer than `showDelay` (300 ms), then at least `minDuration` (400 ms) | the table body (`tbody`) at `--sd-table-loading-dim` and ignoring the pointer, buttons in cells included, plus a 2px progress bar under the last header row (mobile: the card list, bar at its top) |

- New rows render as soon as they arrive; only the bar and the dimming wait for `minDuration`.
  An empty or failed result ends `refresh` at once, so the empty/error region shows.
- A read that replaces another (paging, sort, filter) keeps an already visible bar or skeleton
  through the debounce between them; a debounce alone never shows the bar.
- `data-loading` and `aria-busy` are unchanged: they follow `loading()` at once, without delay.
- Skeleton rows: 5, or enough to fill a table with a fixed height (fill mode, `style.maxHeight`),
  at most `paginate.pageSize` and 20. Bar widths follow the column type and `align`.
- Desktop tree and expand buttons stay in the DOM while their children/details load, so focus
  stays on them: the tree chevron becomes a 16px spinner (`aria-busy`, `aria-disabled`); the
  expand `sd-button` shows its own loading spinner (`aria-busy` on the `sd-button`). Mobile tree
  and expand buttons show the 16px spinner and stay `disabled` while loading.

```ts
// Per table (wins field by field)
option: SdTableOption<Order> = { type: 'server', items: this.load, columns, loading: { showDelay: 500, dim: false } };

// For every table of the app
providers: [{ provide: SD_TABLE_CONFIGURATION, useValue: { loading: { skeletonRows: 8 } } }];
```

| `SdTableOptionLoading` field | Default | Notes |
| --- | --- | --- |
| `skeleton` | `true` | `false`: a read without rows waits `showDelay`, then shows only the progress bar. |
| `skeletonRows` | 5, or fill a fixed-height table | Rounded down to 1–20. Mobile cards show at most 3. |
| `showDelay` | `300` | ms before the bar and dimming show over existing rows. `0` shows them at once. |
| `minDuration` | `400` | ms the bar stays once shown. `0` hides it as soon as the read ends. |
| `dim` | `true` | `false`: progress bar only; the rows stay at full opacity and clickable. |

Negative numbers and values of the wrong type count as not set. Colours:
`--sd-table-skeleton-bg`, `--sd-table-skeleton-highlight`, `--sd-table-progress-track` and
`--sd-table-spinner` (see `assets/THEME.md`, "Table tokens"). Component CSS variable:
`--sd-table-loading-dim` (default `0.55`). Animations stop with `prefers-reduced-motion`; with
`forced-colors: active` the bars use `GrayText` and the progress bar `Canvas`/`CanvasText`/`Highlight`.

## Phân trang không biết tổng (`paginate.total: 'unknown'`)

Dùng cho API phân trang theo offset/limit nhưng không trả tổng số bản ghi (ví dụ
endpoint chỉ nhận `first`/`max` và trả một danh sách). Khai báo tường minh
`paginate.total: 'unknown'` trên bảng `type: 'server'`; `items()` trả
`SdTableServerHasMoreResult<T>` = `{ items, hasMore }` thay cho `{ items, total }`.
Bảng không khai báo (mặc định `'known'`) và bảng `type: 'local'` giữ nguyên hành vi cũ.

```ts
import { firstValueFrom } from 'rxjs';
import { SdTableOption, SdTableServerHasMoreResult } from '@sdcorejs/angular/components/table';

readonly option: SdTableOption<AuditEvent> = {
  type: 'server',
  rowKey: 'id',
  paginate: { total: 'unknown', pageSize: 25, pages: [25, 50, 100] },
  columns: [
    { field: 'time', type: 'datetime', title: 'Thời điểm' },
    { field: 'type', type: 'string', title: 'Sự kiện' },
  ],
  items: async (filter, paging): Promise<SdTableServerHasMoreResult<AuditEvent>> => {
    const max = paging.pageSize!;
    const first = paging.pageNumber! * max; // offset tăng theo pageSize, không theo số dòng lookahead
    // Lấy dư 1 dòng: có dòng thứ max+1 thì chắc chắn còn trang sau.
    const rows = await firstValueFrom(this.api.events({ first, max: max + 1, type: filter.rawExternalFilter['type'] }));
    return { items: rows.slice(0, max), hasMore: rows.length > max };
  },
};
```

| | Known (mặc định) | Unknown |
| --- | --- | --- |
| Kết quả `items()` | `{ items, total }` | `{ items, hasMore: boolean }` |
| Paginator | `mat-paginator`: `1-25/1.234`, first/prev/next/last | Paginator cùng style, token và nhãn `SdTablePaginatorIntl`: page size, range thật (`26-32`), Trước/Sau; nút Trang đầu khi `showFirstLastButtons` (desktop). Không có Trang cuối, không hiện tổng |
| `table.total()` | Tổng của server | Luôn `undefined` |

**Phân chia trách nhiệm.** Consumer: map `pageNumber`/`pageSize` sang offset/limit
của API, quyết định `hasMore` (khuyến nghị lấy `pageSize + 1` dòng), giữ HTTP/auth/
nghiệp vụ trong loader. Không suy `hasMore` chỉ vì `items.length === pageSize` — một
trang đủ dòng vẫn có thể là trang cuối. Table: lịch đọc, khoá thao tác khi đang tải,
bỏ response cũ, chỉ commit trang/range khi render thành công, retry đúng request lỗi.
Table bỏ qua response cũ nhưng không abort HTTP; loader tự huỷ nếu cần.

**Trang yêu cầu và trang đang hiển thị là hai trạng thái riêng.** Request dùng trang
yêu cầu; range, STT (`index`) và nút Sau chỉ đọc trang đang hiển thị, do một lần render
thành công ghi. Vì vậy:

- Range chỉ phản ánh dòng đang hiển thị: trang 2 nhận 7 dòng với `pageSize: 25` là
  `26-32`. Không có dòng thì không có range.
- Trong lúc trang mới đang tải, dòng cũ vẫn hiển thị với range của chính nó. Trước/Sau,
  Trang đầu và page size bị khoá từ lúc lên lịch đến khi tải xong (`aria-busy="true"`);
  nút giữ focus (`disabledInteractive`) nên bấm lặp không tạo request trùng.
- Sau chỉ bật khi trang đang hiển thị đã ổn định và loader báo `hasMore: true`. Trước
  tắt ở trang đầu.
- Lỗi tải trang sau/trước hoặc lỗi đổi page size: theo luật dữ liệu/lỗi không cùng hiển
  thị, table gỡ dòng cũ và hiện `SdDataState` lỗi cùng Thử lại trong vùng bảng, phía trên
  paginator; range ẩn, không bao giờ có dòng trang 1 mang nhãn trang 2. Paginator đứng
  ở trang lỗi: Trước về trang liền trước nó, Sau khoá, page size vẫn đổi được.
  `retryRead()` gửi lại đúng filter/paging/sort đã lỗi.
- Đổi filter, quick search hoặc sort: về trang đầu, giữ page size. Đổi page size: về
  trang đầu với size mới. Paginator khoá ngay trong thời gian debounce nên không bấm
  được Sau của truy vấn cũ.
- `items` dài hơn `pageSize`: table cắt về `pageSize` và coi là còn trang sau. Trang rỗng
  luôn là trang cuối, kể cả khi loader báo `hasMore: true`, nên dữ liệu bị xoá giữa chừng
  không tạo vòng Sau vô hạn; Trước vẫn mở.
- Loader trả thiếu `hasMore` boolean (ví dụ vẫn trả `{ items, total }`): lần đọc lỗi
  với thông báo rõ, table không đoán.
- Trang đầu là trang duy nhất (`hasMore: false` ở trang 1): paginator ẩn như khi
  known-total có `total <= pageSize`; desktop hiện `Đang hiển thị 1-N`, không có `/tổng`.
  Đây cũng là trường hợp duy nhất `filter.hideInlineFilter: 'auto'` biết đủ số dòng để ẩn
  filter dưới cột (N ≤ 10, chưa lọc).
- Commit filter không reload (`notReload`, ví dụ `setFilter()` rồi `notReload: true`) hủy
  lần đọc filter đang chờ hoặc làm response đang tải bị bỏ: paginator quay về trang đang
  hiển thị, không bị khoá giữa hai trang; lần chuyển trang kế tiếp dùng filter đã commit.
- Bảng known-total nhận `{ items, hasMore }` không có `total` sẽ `console.warn` một lần
  (thiếu `paginate.total: 'unknown'`) và giữ hành vi cũ `total = 0`.

**Export mặc định** (không khai báo `export.items`) gọi `items()` theo chunk
`maxItemsPerRequest` cho đến khi `hasMore: false` hoặc gặp chunk rỗng; dòng lookahead của
mỗi chunk bị cắt. `export.items` trả mảng thì dừng ở chunk không đúng một trang (ngắn hơn
là trang cuối, dài hơn là nguồn không phân trang). `export.max` tính theo số dòng đã tải;
không khai báo `export.max` thì giới hạn là 1.048.575 dòng (một sheet Excel), để nguồn bỏ
qua offset và luôn báo `hasMore: true` không chạy vô hạn. Nút export không hiện phần trăm.

**Giới hạn.** Offset pagination không có snapshot ổn định: thêm/xoá dữ liệu nguồn giữa
hai lần chuyển trang có thể làm lặp hoặc sót dòng. Table không quét toàn bộ dữ liệu để
tính tổng.

**Chuyển từ paginator đặt ngoài table:** bỏ paginator ngoài cùng state offset/`hasMore`/
loading/error tự quản; thêm `paginate: { total: 'unknown', pageSize, pages }`; chuyển lời
gọi API vào `items(filter, paging)` với `first = paging.pageNumber * paging.pageSize`; dùng
`reload()`, `retryRead()`, `sdReadStateChange` và `sdDataStateTemplate` thay cho UI lỗi tự
dựng.

**Type**: Component (generic over `T`)
**Selector**: `sd-table`
**Import path**: `@sdcorejs/angular/components/table` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdTable<T = unknown>` (implements `AfterViewInit`, `OnDestroy`)
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

The standard list/table component of SDCoreJS — renders tabular data with paging, sorting, inline column filters, external (toolbar) filters, multi-select with bulk actions, row commands, expansion, grouping, sticky columns, drag-and-drop row reorder, **drag-to-resize columns with persistence**, Excel/CSV export, and column-config persistence. Used on virtually every list page.

## When to use

- Any list page (master data, transactions, search results)
- Both **local** mode (`type: 'local'`, full client-side data) and **server** mode (`type: 'server'`, paged + filtered + sorted server-side)
- Multi-select operations on rows (approve, delete, export, …)
- Per-row commands (edit, view detail, custom actions)
- Hierarchical / grouped views (with `option.group`) and parent-detail expansion (with `option.expand`)
- Pages that need user-customizable column visibility/order/width (config saved in storage when `option.key` is set)
- Pages that need drag-to-resize columns at runtime (set `option.config.resizable: true`; width persists into the same storage entry as the column-config dialog)

## When NOT to use

- For ≤ 5 simple cards / a small read-only list → use a regular Angular `@for` with custom layout
- For "key-value detail" display → use `<sd-view>`, not a 1-row table
- For tree-structured data with inline child rows → use `option.tree` (configurable depth via `maxDepth`)
- For master-detail panel below a row → use `option.expand` + `[sdTableExpandDef]`
- For editable spreadsheets — cell editing is not first-class; use a different grid library if heavy in-place editing is required

## The contract: `[option]` is the only required input

Everything is configured via the `SdTableOption<T>` object passed to `[option]`. The option discriminates on `type: 'local' | 'server'`.

### `SdTableOption<T>` (top-level)

| Field               | Type                                                             | Required     | Notes                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`              | `'local' \| 'server'`                                            | yes          | Discriminator.                                                                                                                                                                                                                               |
| `items` (local)     | `() => T[] \| Promise<T[]>`                                      | yes (local)  | Returns the full dataset. Filtering/sorting/paging done client-side.                                                                                                                                                                         |
| `items` (server)    | `(filterReq, pagingReq) => Promise<{items: T[]; total: number}>` | yes (server) | Server fetches; both `SdTableFilterRequest` and `PagingReq` are passed. With `paginate.total: 'unknown'` it resolves `{ items, hasMore }` instead (`SdTableServerHasMoreResult<T>`).                                                       |
| `onFilter` (server) | `(filterReq, { externalFilterValid }) => void`                   | no           | Called BEFORE each server fetch; useful to cancel / log / sync URL.                                                                                                                                                                          |
| `columns`           | `SdTableColumn<T>[]`                                             | yes          | Column definitions (see schema below).                                                                                                                                                                                                       |
| `key`               | `string`                                                         | no           | Storage key for persisted user column-config (visibility/order/width).                                                                                                                                                                       |
| `rowKey`            | `string`                                                         | no           | Field that identifies a row (dot-notation supported, e.g. `'id'` / `'user.id'`). Becomes `SdTableItem.meta.id` — the mat-table `trackBy` key, the `preserveSelection` key, the tree expand-state key and the per-row `data-autoid` suffix. See **Row identity** below. |
| `config`            | `TableOptionConfig`                                              | no           | `{ visible?, resizable?, onResize? }` — gear button, drag-to-resize, resize callback. See **Column resize** section.                                                                                                                         |
| `selector`          | `SdTableOptionSelector<T>`                                       | no           | Multi-select + bulk actions.                                                                                                                                                                                                                 |
| `expand`            | `SdTableOptionExpand<T>`                                         | no           | Per-row expansion (master-detail).                                                                                                                                                                                                           |
| `tree`              | `SdTableOptionTree<T>`                                           | no           | Tree rows — inline child rows with expand/collapse.                                                                                                                                                                                          |
| `sort`              | `{ enable?: boolean }`                                           | no           | Master switch for sortable headers. Omitted and `enable: false` create no sort control, sort focus target, `aria-sort`, or sort icon.                                                                                                                                                                        |
| `paginate`          | `SdTableOptionPaginate`                                          | no           | `{ pageSize?, pages?, showFirstLastButtons?, hidePageSize?, hidden?, total? }`. `total: 'unknown'` (server only) pages without a record count — see **Phân trang không biết tổng**.                                                         |
| `reload`            | `{ visible?, onReload? }`                                        | no           | Show the reload button and run `onReload` after refresh. When visible, the reload action stays enabled for empty results (`items.length === 0` or `total === 0`) so users can retry.                                                          |
| `loading`           | `SdTableOptionLoading`                                           | no           | `{ skeleton?, skeletonRows?, showDelay?, minDuration?, dim? }` — skeleton rows, progress bar delay and hold, dimming. Merged field by field over `SD_TABLE_CONFIGURATION.loading`. See **Loading**.                                     |
| `export`            | `SdTableOptionExportDefault \| SdTableOptionExportCustom`        | no           | Excel/CSV/Custom export config.                                                                                                                                                                                                              |
| `group`             | `{ fields: string[]; htmlTemplate: (rows) => string }`           | no           | Group rows by `fields` and render an HTML group header.                                                                                                                                                                                      |
| `filter`            | `SdTableOptionFilter`                                            | no           | `{ hideInlineFilter?, externalFilterPerRow?, manualFilter?, collapsible?, externalFilterCollapsed?, hideExternalFilterToolbar?, externalFilters?, operatorChange? }`.                                                                                                  |
| `commands`          | `SdTableCommand<T>[]`                                            | no           | Per-row action buttons.                                                                                                                                                                                                                      |
| `command`           | `{ align?: 'left' \| 'right'; commands?: SdTableCommand<T>[] }`  | no           | Newer per-row commands API with alignment.                                                                                                                                                                                                   |
| `style`             | `{ shadow?, maxHeight?, minHeight?, rowCss? }`                   | no           | Shadow toggle, scroll bounds, per-row CSS.                                                                                                                                                                                                   |
| `rowReorder`        | `{ enabled?, onChange?, icon?, disabled?(row,i) }`               | no           | Drag-and-drop row reordering. Respects groups.                                                                                                                                                                                               |
| `index`             | `{ enabled?, title?, width? }`                                   | no           | Adds a leading STT (row-number) column. Default `title: '#'`, `width: '50px'`. Numbering is global across pages — `pageIndex * pageSize + i + 1`. Placed after selector/tree/command(left)/group, before data columns. Hidden on group rows. |

| `mobile` | `{ rowLabel?: (row: T) => string }` | no | Accessible label and command-bar title for mobile cards; falls back to `rowKey`, then row ordinal. |

### Row identity (`rowKey` → `SdTableItem.meta.id`)

See also [Mobile row cards](#mobile-row-cards-sdtablerowmobiledef) for the template and accessible row-label API.

Every row the table renders is wrapped in an `SdTableItem` whose `meta.id` is the row's identity. It is used for:

- the mat-table `trackBy` (which DOM row view is reused for which data row),
- `selector.preserveSelection` (the key of the internal selected-items map),
- the tree expand/collapse state map,
- the per-row `data-autoid` suffixes (`…-expand-<rowId>`, `…-tree-toggle-<rowId>`).

**How the id is derived:**

| `option.rowKey` | Resulting `meta.id`                                                                  | Survives a server re-fetch? |
| --------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| set (e.g. `'id'`) | `String(row.id)` — readable and deterministic                                       | yes                         |
| unset           | generated `sd-row-<n>`, pinned to the row data object's **identity** (via a `WeakMap`) | no                          |

Without `rowKey`, the same data object always maps back to the same id (so local filtering, sorting, paging and tree child re-formatting all keep their ids), but a **new** object — which is what a server fetch produces — gets a new id.

> **Changed (BREAKING for consumers who relied on the old behaviour).** `meta.id` used to be a **content hash** (`Utilities.hash({ data })`). That made two rows with equal content share one id — which corrupted row-view recycling, made `flattenTree` drop the duplicate, and collided in the expand-state / preserved-selection maps. It also made *every* group header share a single id. Ids are no longer derived from content.
>
> **Migration:** add `rowKey: '<your id field>'` to `option` if you use any of:
>
> - `selector.preserveSelection` on a `type: 'server'` table (selection must survive a re-fetch),
> - `tree` on a `type: 'server'` table (expand state must survive a re-fetch),
> - per-row `data-autoid` values as E2E selectors (they must be stable across page loads).
>
> Everything else works unchanged with no option edit. A side effect of the fix: two rows with identical content are now rendered as two distinct rows (previously the second one could be swallowed by the tree flattener).

### Local sorting

When `items` supplies the full array, local sorting places `null`, `undefined` and `''` **last in both ASC and DESC**.
For `date`, `datetime` and `time`, values are compared as timestamps: valid `Date` objects, numeric epoch milliseconds (including `0`) and strings accepted by JavaScript `Date` are supported. Invalid dates are treated as empty. Bare time strings such as `'12:30'` are not parsed as clock times; supply a valid date/time value.
For `number`, numeric strings are compared numerically; `0` is a real value, distinct from empty. `NaN` and nonnumeric strings are treated as empty. Infinities retain their numeric order.
For `string`, nonempty values use case-sensitive string comparison; `0` and `false` are preserved as `'0'` and `'false'`.

Equal values and empty/invalid values retain their input row order in either direction. Sorting happens before pagination and does not mutate the supplied array. The comparator returns only `-1`, `0` or `1`; direction is applied to nonempty comparisons, without reversing the sorted array. Server sorting remains the server's responsibility. Column types and `filter: { type: 'daterange' }` keep their existing filter behavior.

### Column schema (`SdTableColumn<T>`)

A discriminated union over `type`. All variants share `SdTableColumnBase`:

| Field                             | Type                                                                                                             | Notes                                                                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field`                           | `NestedKeyOf<T>` (or `string` for `'children'`)                                                                  | Nested key supported (e.g. `'user.name'`), read with `getNestedValue`. A key it rejects (spaces, `*`) is read literally or dot-split, own property only; `__proto__`, `prototype` and `constructor` read as empty.                                                  |
| `type`                            | `'string' \| 'number' \| 'boolean' \| 'date' \| 'datetime' \| 'time' \| 'values' \| 'lazy-values' \| 'children'` | Determines cell renderer + filter UI + sort comparator.                                                                                                                                                                                                             |
| `title`                           | `string \| { title: string; templateRef?: TemplateRef<any> }`                                                    | Header text or templated header.                                                                                                                                                                                                                                    |
| `cell`                            | `{ templateRef?, copiable?, truncate?: { enable?, type?: 'more' \| 'tooltip' } }`                                | Custom cell renderer / copy-on-hover / truncation behavior.                                                                                                                                                                                                         |
| `width` / `minWidth` / `maxWidth` | `string`                                                                                                         | CSS sizes.                                                                                                                                                                                                                                                          |
| `hidden`                          | `boolean`                                                                                                        | Always hidden (not even in column-config).                                                                                                                                                                                                                          |
| `invisible`                       | `boolean`                                                                                                        | Hidden by default but toggleable in column-config.                                                                                                                                                                                                                  |
| `fixed`                           | `boolean`                                                                                                        | Sticky column.                                                                                                                                                                                                                                                      |
| `align`                           | `'right'`                                                                                                        | Right-align (numbers, currency).                                                                                                                                                                                                                                    |
| `htmlTemplate`                    | `(value, row) => string`                                                                                         | HTML string renderer (sanitized via `sdSafeHtml`).                                                                                                                                                                                                                  |
| `transform`                       | `(value, row, { isExport? }) => string \| Promise<string>`                                                       | Format the value (display + export).                                                                                                                                                                                                                                |
| `tooltip`                         | `(value, row) => string`                                                                                         | Hover tooltip on the cell.                                                                                                                                                                                                                                          |
| `click`                           | `(value, row) => void`                                                                                           | Cell click handler — turns cell into a link.                                                                                                                                                                                                                        |
| `sortable`                        | `boolean`                                                                                                        | Enable sort on this column (also requires `option.sort.enable`).                                                                                                                                                                                                    |
| `filter`                          | `{ disabled?, default?, onChange?, operator?, filterDef? }`                                                      | Inline column filter. `onChange(value, column, columnFilter)` fires when the committed value changes; for text/number inputs this is Enter or blur. `operator: { default?, enable?, list? }` controls the operator picker (a prefix chip inside default controls, a separate `sd-operator size="sm"` beside `filterDef` / split filters); the menu lists the operators in the order of `list`. Without `default` (column or table configuration) no operator is picked. `filterDef` is a custom `TemplateRef`. |
| `export`                          | `{ disabled?, description? }`                                                                                    | Export-specific overrides.                                                                                                                                                                                                                                          |

#### Type-specific column variants

| `type`                           | Extra fields                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'string'`                       | `useBadge?: (value, row) => SdBadgeData`                                                                                                                   |
| `'number'`                       | `useBadge?`, `filter?: { type?: 'split-number' }`                                                                                                          |
| `'boolean'`                      | `useBadge?`, `option?: { displayOnTrue?, displayOnFalse? }`                                                                                                |
| `'date' \| 'datetime' \| 'time'` | `useBadge?`, `filter?: { type?: 'daterange' \| 'date' \| 'split-date' }`                                                                                   |
| `'values'`                       | `option: { items: K[] \| Signal<K[]> \| () => Promise<K[]>; valueField; displayField; selection?: 'MULTIPLE' }`, `useBadge?: (value, row, items) => SdBadgeData` |
| `'lazy-values'`                  | `option: { items: SdSearch<K>; valueField; displayField; views?(values) => Promise<K[]>; selection?: 'MULTIPLE' }`                                         |
| `'children'`                     | `children: SdTableColumnNormal<T>[]` — produces a multi-row header with this group on top of its children.                                                 |

`useBadge` returns `SdBadgeData` (`@sdcorejs/angular/components/badge`): `{ title?, type?, color?, icon?, label?, tooltip? }`, rendered as a `<sd-badge>` in the cell. `type` defaults to `'round'`. `title` replaces the cell text. `label` is the left part of `type: 'pair'`. `tooltip` shows only when the column has no `tooltip`. The badge is a button (`role="button"`, focusable, hover) only when the column has `click`; otherwise it is a plain status. The cell tooltip goes to the badge's own `tooltip` input, so a badge whose text is cut still shows a single tooltip.

**Grouped column headers:** `type: 'children'` uses a compact group title with a subtle background and divider above its child columns. Standalone titles are vertically centered across both title rows. Filters occupy a separate aligned sticky row; `filter.hideInlineFilter` (including `'auto'`) shows or hides that row consistently for all columns. No consumer CSS is required. Numeric child titles keep their configured alignment.

**Rendering convention:** status/state columns should use `useBadge` or a projected `<sd-badge>`. Do not hand-roll `.status-*`, `.pill-*`, or badge-like CSS classes for plain state display.

### Config option (`TableOptionConfig`) — gear button + column resize

```ts
export interface TableOptionConfig {
  visible?: boolean; // show the gear (column-config) button in the toolbar
  resizable?: boolean; // enable drag-to-resize on data column headers
  onResize?: (field: string, width: string, columnWidth: Record<string, string>) => void;
}
```

| Field       | Type                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible`   | `boolean`                             | Shows the settings (⚙) button in the footer. The settings modal lets users show, hide, reorder (mouse or keyboard), rename, resize, fix and shorten columns, and pick the filter layout and the shown filters; the button carries a dot while the table uses custom settings. See **Settings modal**.                                                                                                                                                                                         |
| `resizable` | `boolean`                             | When `true`, a 6px drag handle appears on the right edge of every **data** column header. Cursor switches to `col-resize` on hover; dragging updates the width live (mousemove updates inline style outside Angular zone for smoothness) and persists on mouseup. **Excluded from resize:** the special columns `sdSelection`, `sdCommand`, `sdGroup`, `sdSubInformation`, `sdReorder`, `sdIndex`, and `type: 'children'` parent header cells. |
| `onResize`  | `(field, width, columnWidth) => void` | Fires once per resize, on `mouseup`; a click on the grip that does not change the width stores nothing and does not fire. `field` = column resized, `width` = new width (e.g. `'220px'`), `columnWidth` = snapshot `Record<field, width>` of **all** data columns that currently have a width set (including ones not resized this time). Useful for syncing width state to a remote profile or analytics.                                                                                                                                     |

#### Settings modal

`sd-modal width="sm"` with two tabs, **Cột** and **Bộ lọc** (`role="tablist"`, ← → / Home / End, `-config-tab-columns` / `-config-tab-filters`), and one footer for both. It always opens on **Cột**. Without a **Bộ lọc** tab (below) there is no tab bar. Stored data, storage key and `loadConfigurationResult` are unchanged.

- **List:** one 44px row per configurable column, in display order: drag handle `⠿`, **Hiện** checkbox, then a button that opens the row. The button shows the title (the renamed one, greyed while hidden), `push_pin` when fixed, `short_text` when shortened, and the width: `120 px`, **Tự động** (no width), the value as written when it is not px (`20%`), or **Đang ẩn**. It carries `aria-expanded` / `aria-controls`; one row is open at a time.
- **Open row:** **Tiêu đề cột** (`sd-input size="sm"`, the original title as placeholder; when renamed, “Gốc: … · Khôi phục” clears the rename), **Rộng**, and the **Cố định khi cuộn ngang** / **Rút gọn nội dung dài** options: rows with the label and a description on the left and an `sd-switch` on the right. A hidden column can be opened but its details are locked; its **Hiện** checkbox never is.
- **Width:** a positive number is stored as `${n}px`, an empty field (or zero / a negative number) as `undefined` (the option width, or auto). A width in another unit (`%`, `rem`) is shown as written, without the px suffix; typing a number turns it into px. On blur and on Apply an edited width is rounded and kept within the column's px `minWidth` / `maxWidth`; a bound in another unit is ignored, and a width nobody edited is saved as it was.
- **Toolbar:** wraps in a narrow modal. A find box above eight columns (current or original title, accent- and case-insensitive; a row it filters out closes), “Hiện {shown}/{total} cột” and **Hiện tất cả** (disabled when every column is shown). The hint under it (`core.component.table.config.drag-hint`) names both ways to reorder; while searching, reordering is off and the hint says so (`drag-disabled-search`).
- **Reorder:** drag the handle (pressing the handle of the open row closes it first), or focus it and press Space / Enter to pick the row up, ↑ / ↓ to move it, Space / Enter to drop it, Escape to put the order back. Leaving the handle drops the row. While a row is held, Escape does not close the modal. A live region inside the modal reads each step (`reorder-picked`, `-moved`, `-dropped`, `-cancelled`).
- **Bộ lọc tab:** shown on desktop when filtering is on (not `filter.disabled`) and the table has a filter (quick search, an external filter or a column filter), unless `filter.modeSelectable` is `false` and there is no external filter.
  - **Kiểu lọc:** two radio cards, **Khung bộ lọc** (`'default'`) and **Thanh bộ lọc** (`'query-bar'`), checked from the stored choice, else `filter.mode` (`-config-mode-default` / `-config-mode-query-bar`). Hidden with `filter.modeSelectable: false`.
  - **Bộ lọc hiển thị:** one switch row per external filter (`-config-filter-<field>`), the same `TableFilterConfiguration.inlineExternal` as the external filter toolbar. With the panel the switch shows the filter in it; with the bar it pins the filter as a chip. A `required` filter is locked (“Bắt buộc”, always pinned on the bar). On the bar, a filter the bar cannot show (`custom`, an `sdTableFilterDef` template, `queryBar.exclude`, a date without `defaultOperator` `GREATER_OR_EQUAL` / `LESS_OR_EQUAL`) is off and locked (“Không có trên thanh”) and keeps its panel choice; with `queryBar.pinned` the list follows it and is locked.
- **Footer:** **Khôi phục mặc định** on the left (`type="text"`, `restart_alt`), **Bỏ qua** (outline) and **Áp dụng** (filled) on the right, all `size="sm"`, for both tabs. Apply stores the columns and, when the **Bộ lọc** tab changed, the inline external filters and the filter kind (a kind equal to `filter.mode` is not stored, so the table keeps following the option). Restore defaults asks for confirmation (`config.confirm-reset`), removes the stored columns, puts the inline external filters back to `defaultShowing` and clears the stored filter kind. Skip drops the edits of both tabs.

**Settings button indicator:** the footer settings button (`-config`) shows a primary dot, labelled “Đang dùng thiết lập riêng” for screen readers (`indicatorLabel`), while the table uses custom settings:

- the stored columns differ from the option in order, or from their stored original in visibility, title, width, fixed or truncate. A width dragged on the table counts (same storage entry);
- the inline external filters differ from `defaultShowing`;
- the stored filter kind differs from `filter.mode` (while `filter.modeSelectable` is not `false`).

Columns added to or removed from the option since the settings were stored do not count, and neither does a title changed in code. Without `option.key` it follows the session storage. Restore defaults turns it off at once. Mobile shows no dot (the tools button is unchanged).

**Persistence:** When `option.key` is provided, resize writes to the same storage entry used by the column-config dialog (under the prefix `TABLE_CONFIG`). Without a key it falls back to session storage keyed by `Utilities.hash(option)`.

**Reload semantics:** Resizing does **NOT** trigger a data reload, value cache refresh, or filter re-register — it only updates the configuration signal locally and writes storage silently (via the new `SdStorage.setSilent`). Safe to use on heavy server-mode tables.

**Width clamp:** During drag, width is clamped to `[column.minWidth, column.maxWidth]`. If either is unset or not a `'NNpx'` string, defaults apply: `minWidth = 40px`, `maxWidth = ∞`. Other units (`%`, `rem`, …) are ignored by the clamp parser.

### Reserved column names (internal `matColumnDef`)

The table adds these special columns conditionally — **do not** define a data column with the same `field`:

| Name                     | When rendered                   | Position                                                    |
| ------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `sdReorder`              | `rowReorder.enabled`            | very first (unshifted)                                      |
| `sdSelection`            | `selector.visible`              | left, sticky                                                |
| `sdCommand`              | `commands` / `command.commands` | left if `command.align !== 'right'`, else right (stickyEnd) |
| `sdGroup`                | `group.fields.length`           | left                                                        |
| `sdIndex`                | `index.enabled`                 | after group, before data columns (sticky)                   |
| `sdSubInformation`       | `expand` configured             | render under each row                                       |
| `sdSubInformationAction` | `expand` configured             | right (stickyEnd)                                           |

### Selector option (`SdTableOptionSelector<T>`)

| Field             | Type                                  | Notes                                                                                                                                                                                        |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible`         | `boolean`                             | Show the checkbox column.                                                                                                                                                                    |
| `single`          | `boolean`                             | Radio-style single-select (default is multi-select).                                                                                                                                         |
| `actions`         | `SdTableAction<T>[]`                  | Bulk-action buttons shown when ≥ 1 row selected. Each action: `{ icon?, fontSet?, tooltip?, title?, color?, type?, hidden?, isGrouped?, click(selectedItems) }` (or grouped via `children`). |
| `message`         | `string \| (selected) => string`      | Selection summary text in the action bar.                                                                                                                                                    |
| `onSelect`        | `(rowData, selectedItems) => void`    | Row toggle callback.                                                                                                                                                                         |
| `onSelectAll`     | `(selectedItems) => void`             | Header checkbox callback.                                                                                                                                                                    |
| `disabled`        | `(rowData, selectedItems) => boolean` | Per-row disable predicate.                                                                                                                                                                   |
| `defaultSelected` | `(rowData) => boolean`                | Pre-select after each load.                                                                                                                                                                  |
| `preserveSelection` | `boolean`                           | Keep the selection across paging / filtering / sorting / reload; `selectedTableItems()` then returns every selected row including off-page ones. Matching is by `meta.id` — **set `option.rowKey`** when the table is `type: 'server'`, otherwise a re-fetch produces new row objects with new ids and the selection is not restored. See **Row identity**. |

The selection message/action toolbar is inset 8px from both horizontal table edges, including when its actions wrap on narrow screens. Its visibility, selection callbacks and clear-selection behavior are unchanged.

Header select-all operates only on visible rows that are selectable. Rows disabled by `disabled` or incompatible with the currently available `actions` are skipped. The header is checked only when every selectable visible row is selected; when no visible row is selectable, it stays unchecked. A row that is already selected remains enabled so the user can deselect it.

### Expand option (`SdTableOptionExpand<T>`)

`{ disabled?(row), onExpand?(row) => any \| Promise<any>, multiple?, always? }` — `always: true` keeps every row expanded; `multiple` allows multiple expanded simultaneously.

### Tree option (`SdTableOptionTree<T>`)

Inline child rows rendered beneath parent rows (tree table). **Discriminated union on `loadType`** — pick `'static'` (children embedded) or `'lazy'` (loaded on demand). `loadType` is required.

```typescript
// loadType: 'static' — children embedded in each row
tree?: {
  loadType: 'static';
  childrenKey?: NestedKeyOf<T> | 'children';  // default 'children'
  maxDepth?: number;                           // undefined = unlimited
  defaultExpanded?: boolean | number;          // false | true | open to depth N
  indentSize?: number;                         // default 20px per level
}

// loadType: 'lazy' — children fetched on first expand
tree?: {
  loadType: 'lazy';
  maxDepth?: number;                           // undefined = unlimited
  onExpandChildren: (row: T) => Promise<T[]>;  // required; result cached under 'children'
  hasChildren?: (row: T) => boolean;           // optional; gate the expand icon (see below)
  indentSize?: number;                         // default 20px per level
}
```

- **`static`:** each row may contain a nested array at `childrenKey`. No async call on expand.
- **`lazy`:** no `childrenKey`/`defaultExpanded` (always stores under `'children'`, can't pre-expand un-loaded branches). On expand, `onExpandChildren(row)` is called once and the result cached on the row.
  - **`hasChildren?`** — without it, **every** lazy node shows an expand icon (you can't know until you load). Provide it to gate the icon: it shows only when `hasChildren(row)` returns `true` (a `false` row is a leaf — no icon, `onExpandChildren` never called). A row that already has embedded children always shows the icon regardless.
- **Toggle placement:** there is **no separate toggle column**. The expand icon (`chevron_right` collapsed / `expand_more` expanded, light hover bg) sits in the **first column** — the `sdIndex` cell when `index.enabled` (indent + chevron + hierarchical STT), otherwise the first data column (indent + chevron + cell), indented `level * indentSize`.
- **Pagination (server):** only root rows are paginated; `total` = root count.
- **Coexist** with `expand` (master-detail). **Cannot combine** with `group`.
- **Row reorder:** only root rows (level 0) are draggable.
- **Child-level search** (`type: 'local'` + `loadType: 'static'` only): when an inline column filter is active, the table searches the **whole subtree**, not just root rows — a branch is kept if the node itself **or any descendant** matches. Matching branches are **pruned** (non-matching siblings hidden) and **auto-expanded** so the matched descendants are revealed. Clearing the filter restores the full tree at its default expand state. (Lazy trees and `type: 'server'` tables filter on the server / root only.)

Example (static):

```typescript
tree: { loadType: 'static', maxDepth: 3, defaultExpanded: 1 },
items: () => [
  { id: 1, name: 'Parent', children: [{ id: 2, name: 'Child' }] },
],
```

Example (lazy):

```typescript
tree: {
  loadType: 'lazy',
  hasChildren: row => row.type === 'Folder',   // only folders get an expand icon
  onExpandChildren: row => api.getChildren(row.id),
},
```

### Filter option (`SdTableOptionFilter`)

`externalFilters?: { field, type: 'string' \| 'boolean' \| 'date' \| 'datetime' \| 'daterange' \| 'select' \| ...; defaultOperator?: Operator; required? }[]` controls the toolbar filter form.

**Filter placement rule for generated pages:** treat inline column filters and `filter.externalFilters` as mutually exclusive per field. If a field already has an enabled column filter, do not repeat that same field in `externalFilters`. Use `externalFilters` only for global search, fields that are not rendered as columns, or fields whose column filter is disabled/hidden intentionally.

Built-in `filter.externalFilters` controls use `size="sm"` and `hideInlineError`. Their section body provides 16px spacing around the filter grid and manual Search action, aligned with the section header. Custom filter templates own their control size and error presentation.

**Collapsed external filter (`filter.externalFilterCollapsed`).** `true` starts the external filter section collapsed, `false` open. Unset: open, except in the main table of `sd-page-list` on a short viewport (`compact()`), where it starts collapsed. A user who opens or closes it keeps that state until the default changes. Ignored when `collapsible` is `false`.

#### Quick search (`filter.quickSearch`)

Quick search and the paginator use a fixed white background, independent of `--sd-surface`, on desktop and mobile. Quick search has 12px vertical / 16px horizontal padding; its toolbar and the paginator have square corners, with no divider below the toolbar. At container widths of 550px or less, the controls stack while keeping the same outer inset. The table body retains its theme surface. The existing table scroll area, sticky headers and loading layer (skeleton rows, progress bar) remain scoped to the table body. Tables without quick search reserve no extra toolbar space.

Optional row above the table: dropdowns on the left, one keyword input, and an optional consumer template on the right. No search button; **Enter** commits the trimmed term. Typing or blurring does not submit it. Clearing the input removes only the term. The keyword input is the shared internal search field at size sm (32px, control border and focus ring, search icon, clear button while it holds a term, ↵ hint at the end). At container widths of 550px or less, or on a coarse pointer, it grows to 44px with 16px text and a 40px clear button. Table utilities stay in the footer. The row and its custom slot are absent when `quickSearch` is undefined or `filter.disabled` is true.

The input uses its placeholder without a separate visible label. Hovering the Enter icon shows the submission hint; the input retains an accessible name and description for screen readers. A missing required dropdown value still shows a visible explanation below the row.

| Option | Type | Behavior |
| --- | --- | --- |
| `containFields` | `string[]` | Fields matched with `CONTAIN`. |
| `equalFields` | `string[]` | Fields matched with `EQUAL`. |
| `placeholder` | `string` | Explain the accepted keyword, e.g. name, complete phone number or code. |
| `filters` | `SdTableQuickSearchFilter[]` | Only external-filter-style `values` and `lazy-values` dropdowns; use the same `option.items`, `valueField`, `displayField` and `selection` contracts. |

The fields in both arrays form **one OR group**, ANDed with dropdowns and existing column/external filters. Paths can refer to fields absent from `columns`. Avoid putting the same field in both arrays: the OR would also allow partial matches. Dropdown scalars use `defaultOperator` (default `EQUAL`); arrays use `IN`. Local keyword matching is case-insensitive; server case sensitivity follows the backend's implementation of these operators.

Both arrays are optional. With neither array populated, no automatic keyword condition is generated, but the applied value is still present in **`filterReq.quickSearch`**:

```ts
{
  term: 'KH-001',
  filters: { tenantId: 'north' },
}
```

For server tables, `items(filterReq, pagingReq)` receives this state plus the generated `pagingReq.filters`. Consumers can implement custom keyword logic from `filterReq.quickSearch?.term`. When invoking `SdConvertToPagingReq` manually, pass the option as `{ quickSearch: option.filter?.quickSearch }`. Local tables automatically apply configured field/dropdown predicates before pagination; empty field arrays leave keyword handling to the consumer. Pagination, reload, retry and export use the **applied** term, never a draft still being typed.

Dropdowns apply on change using the table's existing reload debounce, independently of Enter and `manualFilter`. They keep the previous applied term and preserve the input draft. Supported additions to the external-dropdown contract:

- `default?: SdTableQuickSearchFilterValue | Signal<SdTableQuickSearchFilterValue>`: a signal is read before the first request and stays reactive. Its latest value wins per-table cache, including `null` to clear. A plain default is used when no cached field exists; an explicitly cached clear remains cleared.
- `hidden?: boolean | Signal<boolean>` and `disabled?: boolean | Signal<boolean>` control the UI. Hiding retains the value and required constraint. Consumers own permission checks and backend authorization.
- `required?: boolean`: missing values block data loading and disable the keyword input, including when hidden. `0` and `false` are valid values. `onFilter` still receives the request with `context.quickSearchValid === false`.
- `onChange?: (value: SdTableQuickSearchFilterValue) => void`: fires once for a user change, after storing the dropdown value. Initialization, signal synchronization, `setFilter` and reset do not emit it. The table reads a signal default; the consumer writes shared state in this callback.

For a tenant shared across screens, inject the same application-owned store into both consumers:

```ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { SdTableOption } from '@sdcorejs/angular/components/table';

@Injectable({ providedIn: 'root' })
export class TenantSelection {
  readonly id = signal<string | null>('north');
  readonly canChoose = signal(true);
}

// Inside each standalone table consumer:
readonly tenant = inject(TenantSelection);
readonly tenantHidden = computed(() => !this.tenant.canChoose());
readonly option: SdTableOption<Customer> = {
  type: 'server',
  items: (filterReq, pagingReq) => this.api.search(pagingReq),
  columns: [{ field: 'name', title: 'Name', type: 'string' }],
  filter: {
    quickSearch: {
      containFields: ['name', 'email'],
      equalFields: ['phone', 'code'],
      placeholder: 'Name, email, complete phone number or code…',
      filters: [{
        field: 'tenantId', title: 'Tenant', type: 'values', required: true,
        default: this.tenant.id,
        hidden: this.tenantHidden,
        option: {
          valueField: 'id', displayField: 'name',
          items: [{ id: 'north', name: 'North' }, { id: 'south', name: 'South' }],
        },
        onChange: value => this.tenant.id.set(typeof value === 'string' ? value : null),
      }],
    },
  },
};
```

Replace `Customer` and `this.api` with application types/services. A table on screen B resolves `tenant.id()` on creation, so a tenant selected on screen A is already selected. Keeping a screen mounted also follows later signal changes. For remote dropdowns, use `type: 'lazy-values'` and the existing `SdSearch` loader in `option.items`.

Import **`SdTableQuickSearchRightDefDirective`** in the consumer's standalone `imports` to project optional controls. No wrapper is rendered when the template is absent; on narrow containers the custom UI wraps below the search controls.

```html
<sd-table [option]="option" autoId="customers">
  <ng-template sdTableQuickSearchRightDef>
    <sd-checkbox label="Only active" size="sm" [model]="onlyActive()"
      (sdChange)="applyActiveFilter($event)" />
  </ng-template>
</sd-table>
```

The projected checkbox is consumer-owned; it does not automatically add a predicate. Also import `SdCheckbox` and implement its state/handler. Native keyword/clear controls expose `data-autoid="customers-quick-search-term"` and `customers-quick-search-clear`; dropdowns receive `autoId="customers-quick-search-<field>"`. The keyword has a label, placeholder, Enter hint and IME-safe submission.

#### Query bar mode (`filter.mode: 'query-bar'`)

`filter.mode: 'query-bar'` replaces quick search, the external filter section and the column filter row with one `sd-query-bar` at the top of the table surface. It is a view only: the filter state is still `TableFilterValue`, so `items()`, `filterReq`, `pagingReq`, the cache, `required`, `default`, `manualFilter`, `onFilter` and the filter callbacks behave as in the default mode. **The same edit sends the same `pagingReq` in both modes.** Switching modes, or the viewport, keeps the applied values. Users can switch modes themselves in the settings modal (**Bộ lọc** tab) unless `filter.modeSelectable` is `false`; their choice wins over `mode`.

```ts
filter: {
  mode: 'query-bar',
  queryBar: { pinned: ['warehouseId', 'status'], exclude: ['internalCode'] },
  quickSearch: { containFields: ['code', 'customer.name'], placeholder: 'Mã đơn, khách hàng…', filters: [/* … */] },
  externalFilters: [/* … */],
}
```

| Option | Default | Effect |
| --- | --- | --- |
| `mode` | `'default'` | `'query-bar'` turns the mode on. `SD_TABLE_CONFIGURATION.filter.mode` sets it for every table; the option wins. |
| `modeSelectable` | `true` | Lets the user pick the filter mode in the settings modal. The choice is stored with the filter settings (`TableFilterConfiguration.mode`, persistent with `filter.key`), wins over `mode`, turns on the dot of the settings button while it differs from `mode`, and is cleared by **Khôi phục mặc định**. `false` always uses `mode` and ignores a stored choice. `SD_TABLE_CONFIGURATION.filter.modeSelectable` sets it for every table; the option wins. |
| `queryBar.editor` | `'inline'` | `'inline'` edits the operator and value of each chip directly on the bar (`sd-query-bar` mode `'inline'`); `'popover'` edits a chip in its popover. A standalone `sd-query-bar` still defaults to `'popover'`. |
| `queryBar.pinned` | visible quick filters + external filters shown inline (`defaultShowing` / user setting) or `required` | Replaces the default list of pinned chips. Items are `field`s of `quickSearch.filters`, `externalFilters` or `columns`. `required` fields are always pinned. |
| `queryBar.exclude` | — | Fields left off the bar; their values are still sent. |

`SD_TABLE_CONFIGURATION.filter.queryBar` is merged field by field under `option.filter.queryBar`. Mobile (`SdViewportService.isMobile()`) always renders the default controls, quick search and the mobile filter drawer included. `filter.disabled` renders no filter UI, as before.

**Layout.** The bar is flush inside the table card (padding `8px 12px`): search box (quick-search `placeholder`, shown whenever `quickSearch` is set) │ pinned chips │ added chips │ `+` … clear button │ Search (with `manualFilter` only) │ the `sdTableQuickSearchRightDef` template. Chips wrap; the actions stay on the first row. The bar sits outside the loading layer, so it stays usable during `skeleton` and `refresh`. `role="search"`, `aria-label` = `core.component.table.filter`.

**Chips.** Pinned chips (no remove button) read `Tất cả` when empty, `Chọn giá trị` when the field is `required`. Other fields are under `+`, grouped "Bộ lọc" (quick + external) and "Cột"; more than eight fields get a find box. Operators are limited to what the raw record can hold:

| Source | Bar field | Operators | Raw value |
| --- | --- | --- | --- |
| `quickSearch.term` | search box | OR over `containFields` / `equalFields` | `quickSearch.term` |
| `quickSearch.filters[]` | same type | `selection` containing `MULTIPLE` → `IN`; else `defaultOperator ?? EQUAL` | `quickSearch.filters[field]` |
| external `string` / `number` | same type | `defaultOperator ?? CONTAIN` / `?? EQUAL` | `externalFilter[field]` (`EQUAL` + commas → `IN`, as before) |
| external `boolean` | `boolean` (`displayOnTrue/False` labels) | `EQUAL` | `true` / `false` |
| external `date` / `datetime` | same type | its `defaultOperator` (`GREATER_OR_EQUAL` / `LESS_OR_EQUAL`) | one date |
| external `daterange` | `date` | `BETWEEN`, either end may stay empty | `{ from, to }` |
| external `values` / `lazy-values` | same type | `MULTIPLE` → `IN`; else `defaultOperator ?? EQUAL` | value or array |
| column `string` / `number` | same type | `operator.list` without `BETWEEN` / `IN` / `NOT_IN` when `operator.enable`; else `operator.default ?? CONTAIN / EQUAL` | `columnFilter[field]`, `columnOperator[field]` |
| column `number` + `filter.type: 'split-number'` | `number` | `BETWEEN`, either end may stay empty | `{ from, to }` |
| column `boolean` | `boolean` | `EQUAL` | `'1'` / `'0'` |
| column `values` / `lazy-values` | same type | `MULTIPLE` → `IN`; else `operator.list` ∩ `EQUAL`, `NOT_EQUAL` (default `EQUAL`) | value or array |
| column `date` / `datetime`, `filter.type: 'date'` | `date` | `EQUAL` (whole day) | one date |
| column `date` / `datetime`, other filter types | `date` | `BETWEEN`, either end may stay empty | `{ from, to }` |

Columns whose `operator.list` holds `NULL` / `NOT_NULL` (default controls) offer them too. Column `date` / `datetime` and external `daterange` use date-only pickers, as the default controls do, since the request covers whole days.

**Not on the bar** (values still sent; a dev-mode `console.warn` lists them once per table): external `type: 'custom'`, fields with an `sdTableFilterDef` or `filter.filterDef` template, `time` columns, `hidden` columns, columns with `filter.disabled`, external `date` / `datetime` without `defaultOperator` `GREATER_OR_EQUAL` / `LESS_OR_EQUAL` (they send no condition in the default mode either), `queryBar.exclude`, and `hidden` quick filters (their value and `required` still apply). With `hideInlineFilter: true` no column goes on the bar; `'auto'` keeps them (they only sit under `+`). A column with the same field as an external filter is covered by it: only the external chip shows and the column value is always cleared. A column hidden through the table settings keeps its chip while it still filters. Children of grouped headers are offered like any other column.

**Applying.** Without `manualFilter`, a chip popover that closes with a changed value or operator, removing a chip that had a value, an inline chip commit and Enter in the search box each apply once (the existing 700 ms read debounce). A popover that closes unchanged reads nothing; an added chip that closes empty is dropped. Changing the operator of an empty column is stored without a read, like the column filter. With `manualFilter: true` edits stay a draft until the Search button (disabled while a `required` field is empty) or Enter. Every apply writes the whole bar in one `filterRegister.value.set`; then column `filter.onChange(value, column, columnFilter)`, `filter.operatorChange(column, operator)`, external `onChange(value)` and quick-filter `onChange(value)` run for the fields the user changed — never on init or for changes from outside. Changes from outside (`setFilter`, a signal `default`, the cache) wait while a chip popover is open and never overwrite unapplied edits of other chips.

**Required.** An empty `required` chip has the error look and `aria-invalid`, and a hint under the bar (`core.component.query-bar.required`, labels joined by commas; also hidden required quick filters and required external filters the bar cannot show) is its `aria-describedby`. An empty required external filter blocks a server read through its value (`onFilter` gets `externalFilterValid: false`); `requireFiltered` and the "choose a filter" state are unchanged.

**Clear.** The clear button (label `core.component.query-bar.clear-all` with the number of chips that hold a value) resets to the defaults (`filterRegister.value.remove()`), calls `filter.onClearFilter` and reads once. It is disabled while the applied state equals the defaults.

**Header icons.** Every leaf column whose field is on the bar, or is covered by an external filter, gets a 20 × 20 `button.sd-table-filter-trigger` (`filter_alt`) beside its title — after it, or before it for `align: 'right'`. It is invisible (still focusable) until the header cell is hovered or focused, or on a coarse pointer, and stays visible in `--sd-primary` while the field filters by an applied value. Clicking it opens that field's chip without sorting or resizing: with the inline editor it focuses the chip, or starts building one when the field has none; with `editor: 'popover'` it opens the chip popover (adding the chip when needed) and focus returns to the icon when the popover closes. `aria-label`: `core.component.table.filter-by` / `filtering-by` with the column title; `aria-haspopup="menu"` only with `editor: 'popover'` (the chip popover is a menu).

**Ignored in this mode:** `externalFilterPerRow`, `collapsible`, `externalFilterCollapsed`, `hideExternalFilterToolbar`.

#### Inline column filter — commit semantics

- **Enter** trên `sd-input` / `sd-input-number` → commit value vào `filterRegister` **và** trigger reload (debounce 500ms + 200ms).
- **Blur** (focus rời input) → commit value vào `filterRegister` với `notReload: true` — **không** gọi API. Đảm bảo giá trị typed-but-not-entered không bị mất nếu user chuyển sang filter khác hoặc bấm Reload.
- **Enter rồi Tab** trong lúc lần đọc filter còn chờ → blur không có giá trị mới nên không commit lại và **không** hủy lần đọc Enter vừa lên lịch. Nếu user sửa giá trị trước khi blur, commit `notReload` mới vẫn thay thế và hủy lần đọc đang chờ như cũ.
- **Click nút Reload** (`reload()`) → table tự commit `this.columnFilter` snapshot vào `filterRegister` (notReload:true) trước khi build filter request — đảm bảo giá trị input vẫn còn focus cũng được gửi lên.
- **Empty result:** khi `reload.visible` là `true`, nút Reload vẫn enabled với `items.length === 0` hoặc `total === 0`; export và paginator vẫn giữ điều kiện hiển thị hiện tại.
- **`sd-select` / `sd-date-range` / `sd-date`** vẫn dùng `(sdChange)` → commit + reload tức thì.
- **Đổi operator** (chip trong ô hoặc `sd-operator`) khi ô đã có giá trị → commit + reload tức thì; ô trống chỉ lưu operator vào `filterRegister` (notReload:true). `filter.operatorChange` vẫn được gọi trước.
- **Vị trí operator** (thiết kế đợt 2 · G): với control mặc định (`string`, `number`, `boolean`, `values`, `lazy-values`, `date`, `datetime`, `time`), operator là chip tiền tố bên trong ô — column-filter truyền `[operators]` và `[(operator)]` xuống control, không còn `<sd-operator class="mr-4">` đứng riêng. Cột có `filter.filterDef` (template custom), filter `split-number` / `split-date` (hai ô) và danh sách chỉ một operator vẫn giữ `sd-operator` riêng như cũ (control nhận một operator sẽ tự đặt nó và phát `operatorChange` lúc khởi tạo). `filter.operatorChange`, `filterChange`, `filterCommit` và thời điểm emit không đổi. Chọn `NULL` / `NOT_NULL` trong chip thì control xoá giá trị và khoá ô; `SdConvertToPagingReq` gửi `{ field, operator }` **không có `data`** (kể cả khi ô trống), bảng local giữ dòng có giá trị `null` / `undefined` (NULL) hoặc khác (NOT_NULL), và chọn hay rời khỏi hai operator này đều lọc lại ngay. Cột `filterDef` / split vẫn chỉ lọc khi có giá trị.
- **Dense controls:** custom `sdTableFilterDef` templates, editable table-cell controls, external-filter custom templates, and dashboard/table toolbar controls must use `size="sm"` where supported and `hideInlineError` on SD form components (`sd-input`, `sd-select`, `sd-autocomplete`, `sd-date`, `sd-date-range`, `sd-datetime`, `sd-input-number`, `sd-textarea`, `sd-chip`, `sd-chip-calendar`, `sd-input-color`) so inputs do not inflate row/header/toolbar height or inject inline error text into dense surfaces.

#### Grouped headers and split filters

- **Columns under a grouped header** (`type: 'children'`) filter like flat columns. `SdConvertToPagingReq`, local filtering and local sorting, `filter.default`, the cache and `SD_TABLE_CONFIGURATION.filter.operator` all work on leaf columns; the grouped header itself sends nothing. Before, only top-level `columns` were read, so a child column's filter was never sent, matched or restored. Passing `option.columns` to `SdConvertToPagingReq` by hand now includes the children too. The list of a child `values` column is loaded like a top-level one, for its cells, its filter and the export.
- **Split filters survive a reset.** Clearing the filters (`clearFilter()`, the external filter's clear button, `setFilter` without the field) can drop the `{ from, to }` of a `split-number` / `split-date` column from the shared `columnFilter`. The column filter now shows both ends empty and recreates `{ from, to }` when one is typed; before, change detection threw `Cannot read properties of undefined (reading 'from')`.

#### Inline column filter — local matching semantics (`type: 'local'`)

Client-side matching sống ở `matchesColumnFilter` (`services/table-local/table-local.util.ts`) và bám theo đúng operator mà `SdConvertToPagingReq` gửi lên server ở `type: 'server'`:

| Column `type`                      | Luật khớp                                                                                                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'string'`                         | operator đã chọn, mặc định `CONTAIN`; hỗ trợ `NOT_CONTAIN`, `EQUAL`, `NOT_EQUAL`, `START_WITH`, `NOT_START_WITH`, `END_WITH`, `NOT_END_WITH`; không phân biệt hoa thường                                                                                                             |
| `'number'`                         | operator đã chọn, mặc định `EQUAL`; hỗ trợ `NOT_EQUAL`, `GREATER_THAN`, `GREATER_OR_EQUAL`, `LESS_THAN`, `LESS_OR_EQUAL`. Prefix `>` / `>=` / `<` / `<=` gõ trong ô thắng operator. `split-number` `{ from, to }` = khoảng đóng, thiếu một đầu thì biên đó mở. `0` là giá trị hợp lệ |
| `'boolean'`                        | `'1'`/`'true'` vs `'0'`/`'false'`                                                                                                                                                                                                                                                    |
| `'date'` / `'datetime'` / `'time'` | range `{ from, to }`, thiếu một đầu thì biên đó mở                                                                                                                                                                                                                                   |
| `'values'` / `'lazy-values'`       | chọn nhiều giá trị = **OR** (tương đương `IN`); dữ liệu hàng dạng mảng thì khớp khi **giao khác rỗng**                                                                                                                                                                               |

Operator lấy từ `columnOperator[field]` (giá trị chọn trên `sd-operator`), không có thì `column.filter.operator.default` — cùng fallback với `SdConvertToPagingReq`. Trước bản sửa này local bỏ qua operator: cột number luôn so `=`, prefix luôn ra rỗng, filter `0` bị bỏ và dòng có giá trị `0` bị ẩn khi cột đang lọc.

`'values'` / `'lazy-values'` **không** đọc `option.selection` lúc so khớp — nhánh được chọn theo hình dạng giá trị thực tế. Nhờ vậy cột `selection: 'MULTIPLE'` lọc đúng cho cả dữ liệu hàng scalar (`status: 'ACTIVE'`) và dữ liệu hàng mảng (`statuses: [{ id, name }]`), và `filter.default` dạng string trên cột MULTIPLE cũng là input hợp lệ.

#### Time zone (`ISdCoreConfiguration.timeZone`)

Khi cấu hình `timeZone`, mọi phép tính ngày của table theo múi giờ đó thay vì múi giờ trình duyệt:

- **Filter server** (`SdConvertToPagingReq`): một ngày là `[đầu ngày, đầu ngày kế tiếp)` trong zone, gửi dạng instant (`toISOString()`). Với `'Asia/Ho_Chi_Minh'`, ngày `1960/05/20` gửi `GREATER_OR_EQUAL '1960-05-19T16:00:00.000Z'` và `LESS_THAN '1960-05-20T16:00:00.000Z'`; ngày `1975/06/12` (dài 25 giờ) có biên trên `'1975-06-12T17:00:00.000Z'`. Giá trị datetime không múi giờ (`'1960/05/20 08:00:00'`) là giờ đồng hồ trong zone.
- **Filter client, sort local, aggregate MIN/MAX:** giá trị hàng không múi giờ được đọc là giờ đồng hồ trong zone; instant giữ nguyên. Cột `'time'` không có zone.
- **Ô hiển thị và export Excel:** cột `date` / `datetime` / `time` ghi giờ đồng hồ của zone (`'1960-05-19T16:00:00Z'` → `'1960/05/20'`, `'1960/05/20 00:00:00'`).
- Gọi `SdConvertToPagingReq` thủ công thì truyền `dateTime: inject(SdDateTimeService)` để có cùng biên; bỏ trống (hoặc zone `'local'`) giữ đúng payload cũ.

Không cấu hình (hoặc `'local'`) thì mọi giá trị giữ nguyên như trước. Xem [`SdDateTimeService`](../../services/date-time/sd-date-time.md).

#### Inline column filter — server payload for `split-number` (`type: 'server'`)

`SdConvertToPagingReq` gửi giá trị `{ from, to }` của cột `type: 'number'` + `filter: { type: 'split-number' }` thành một filter khoảng đóng, bỏ qua operator trên `sd-operator`. Một đầu là `undefined`, `null` hoặc `''` thì coi là trống; `0` là giá trị hợp lệ.

| Giá trị filter             | `pagingReq.filters`                                          |
| -------------------------- | ------------------------------------------------------------ |
| `{ from: 10, to: 20 }`     | `{ field, operator: 'BETWEEN', data: { from: 10, to: 20 } }` |
| `{ from: 10, to: null }`   | `{ field, operator: 'GREATER_OR_EQUAL', data: 10 }`          |
| `{ from: null, to: 20 }`   | `{ field, operator: 'LESS_OR_EQUAL', data: 20 }`             |
| `{ from: null, to: null }` | không gửi filter                                             |

Release `3.1` trở về trước gửi `{ field, operator: 'EQUAL', data: { from, to } }` (hoặc operator đã chọn kèm object), kể cả khi hai đầu đều trống. Backend nhận cột này phải hỗ trợ `BETWEEN` với `data: { from, to }`, `GREATER_OR_EQUAL` và `LESS_OR_EQUAL`.

### Commands (`SdTableCommandNormal<T>`)

`{ color?, icon?: string \| (row)=>string, fontSet?, title?: string \| (row)=>string, disabled?: boolean \| (row)=>boolean, hidden?: boolean \| (row)=>boolean \| Promise<boolean>, click(row), htmlTemplate?(row)=>string }`. Group via `{ ... children: SdTableCommandNormal<T>[] }`.

Command icons default to Material Symbols Outlined (`material-icons-outlined`). Child command menu items use the same default unless `child.fontSet` is provided. Use icon + title for child commands so menu rows align consistently.

Desktop command `children`, selection action `children` and the selection toolbar More menu use a compact CDK overlay menu: white background, 8px corners, 36px minimum rows, 18px icons and a 4px gap from the trigger. Touch/narrow-screen menu rows remain at least 44px. Menus escape clipped table cells, support arrow-key/typeahead navigation and restore trigger focus on Escape or selection. Existing child visibility, disabled state, custom HTML and callbacks remain supported; no consumer configuration changes are required.

Desktop row commands keep their touch targets within each 24px button so adjacent actions and menu triggers remain independently clickable. Mobile action controls retain their existing sizing.

Disabled desktop row-command icons inherit the button's disabled color from the Material theme, making them visibly muted instead of retaining the active icon color. Disabled child menu items are muted and cannot be activated.

```ts
command: {
  align: 'right',
  commands: [
    { icon: 'visibility', title: 'View', click: row => this.onView(row) },
    { icon: 'edit', title: 'Edit', color: 'primary', click: row => this.onEdit(row) },
    {
      icon: 'more_vert',
      title: 'More',
      children: [
        { icon: 'content_copy', title: 'Duplicate', click: row => this.onDuplicate(row) },
        { icon: 'delete', title: 'Delete', color: 'error', click: row => this.onDelete(row) },
      ],
    },
  ],
}
```

### Switches in cells

Switches (`sd-switch`) rendered within the table use the compact `sm` appearance (36×20px track), including projected consumer cell templates and mobile cards. This table styling takes precedence over the switch size; switches outside the table still default to `md`.

## Inputs (the host element)

| Name     | Type                          | Default     | Notes                                                                 |
| -------- | ----------------------------- | ----------- | --------------------------------------------------------------------- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="components-table-<value>"` for E2E selectors. |
| `option` | `SdTableOption<T>` (REQUIRED) | —           | The whole table configuration (see schema above).                     |

## Outputs

None. All callbacks live inside the `option` object (`onSelect`, `onReload`, `commands[].click`, `expand.onExpand`, `rowReorder.onChange`, `selector.actions[].click`, …). Use a `@ViewChild(SdTable)` ref for imperative API.

## Public API (via template ref)

```ts
@ViewChild(SdTable) tableRef!: SdTable<MyEntity>;
```

- `tableRef.reload(force = true, scrollTop = true)` — re-fetch (server) or re-filter (local)
- `tableRef.reloadFirstPage()` — read the first page again with the current filters and sort. Call it when a condition outside the table changes (status tabs, score cards): `reload()` keeps the current page.
- `tableRef.dataItems: T[]` — current rendered rows (data only)
- `tableRef.selectedItems: T[]` — current selection
- `tableRef.clearFilter()` — resets column, external and quick-search filters to defaults; quick-search term becomes empty and signal defaults are read again
- `tableRef.setFilter({ columnFilter?, externalFilter?, quickSearch? })` — programmatically set filter values; omitting `quickSearch` preserves its applied state
- `tableRef.exportExcel(columns?)` / `exportCSV(columns?)` / `exportCustom()` — trigger export
- `tableRef.onClearSelection(items?)` — clear selected rows (defaults to all)
- `tableRef.detectChanges()` — force CD

## Column aggregate — tổng và subtotal độc lập với footer

Khai báo `aggregate` trên ít nhất một **leaf column đang hiển thị** để tự hiện hàng
tổng ngay phía trên footer. Không cần khai báo `option.aggregate` cho trường hợp
thông thường. Footer `sdTableFooterDef` vẫn nhận `{ items: SdTableItem<T>[], column }`;
aggregate nhận **raw `T`**, không có wrapper, group header hay summary row.
Paginator giữ nguyên vị trí và số bản ghi. Aggregate không tham gia selection,
row click, command, drag/drop, sort hoặc export dữ liệu nghiệp vụ.

```ts
const option: SdTableOption<Order> = {
  type: 'local', items: () => orders,
  columns: [
    { field: 'name', title: 'Tên', type: 'string', aggregate: 'COUNT' },
    { field: 'amount', title: 'Số tiền', type: 'number', aggregate: 'SUM' },
    { field: 'active', title: 'Active', type: 'boolean', aggregate: 'COUNT' },
    { field: 'date', title: 'Ngày đầu tiên', type: 'date', aggregate: 'MIN' },
    { field: 'updated', title: 'Cập nhật cuối', type: 'datetime', aggregate: 'MAX' },
  ],
};
```

### Built-in, COUNT và dữ liệu rỗng

| Loại cột | Built-in hợp lệ |
| --- | --- |
| `number` | `SUM`, `AVERAGE`, `COUNT`, `MIN`, `MAX` |
| `date`, `datetime` | `COUNT`, `MIN`, `MAX` |
| `string`, `boolean`, `time`, `values`, `lazy-values` | `COUNT` |

Mọi data column đều dùng được callback hoặc template. Cột cha `type: 'children'`
chỉ nhóm header; cấu hình aggregate trên từng con. Selection/STT/command/filler
không nhận aggregate và luôn để trống. TypeScript từ chối built-in sai loại cột,
`time` với MIN/MAX, callback async và object `{}` rỗng. Runtime cũng kiểm tra
phép tính; cấu hình sai/callback ném lỗi được báo qua `console.error`, cell hiển
thị placeholder `--`, `isComplete=false`, không che lỗi bằng số 0.

`COUNT` đếm **số dòng có raw field được xem là có giá trị**, độc lập với type,
label lookup, HTML, `column.transform` hay format:

- Bỏ qua `null`, `undefined`, chuỗi rỗng/whitespace, `[]`, `NaN`, `Infinity`,
  `-Infinity`, `Invalid Date`.
- Vẫn đếm `0`, `false`, `{}`, `[null]`, mảng không rỗng và chuỗi không rỗng.
  Mỗi dòng tối đa một lần, không đếm phần tử mảng hoặc duyệt sâu.
- `values`/`lazy-values` đếm raw key/mảng key, không chờ label để quyết định có giá trị.
- `aggregate: items => items.length` đếm tất cả bản ghi trong scope; khác COUNT.

Ví dụ raw values `[null, undefined, '', '  ', [], 0, false, {}, [null]]`:
COUNT = **4**, `items.length` = **9**. Chuỗi `'invalid date'` vẫn được COUNT đếm;
COUNT không parse ngày hay kiểm tra nghiệp vụ theo type.

SUM/AVERAGE/MIN/MAX number dùng number hữu hạn hoặc numeric string được
`NumberUtilities.isNumber`/number formatter hiện có chấp nhận. Loại boolean,
chuỗi trống và chuỗi locale như `'1.200.000 đ'`; không tự parse tiền tệ.
AVERAGE chia cho **số number hợp lệ**, không lấy COUNT làm mẫu số.
MIN/MAX date/datetime nhận `Date`, epoch milliseconds hoặc date string mà native
`Date` parse được, cùng semantics với local sort. ISO kèm timezone so sánh theo
instant; hiển thị theo date/datetime formatter hiện có của ứng dụng. Không thêm
parser cho ngày địa phương hoặc so sánh chuỗi đã format.

Sau khi tải thành công tập hợp rỗng: SUM/COUNT = `0`; AVERAGE/MIN/MAX = `null`.
Renderer dùng `SdFormatNumberPipe`, `SdFormatDatePipe` hoặc `SdFormatDatetimePipe`;
COUNT luôn là số nguyên. `null`/`undefined` hiển thị `--` theo convention table.
Callback trả string được escape thành text. Không gọi `column.transform` với
row giả; custom HTML phải đi qua `templateRef`.

### Callback và TemplateRef có typed context

`column.aggregate` nhận một trong các dạng sau:

```ts
aggregate: 'SUM'
aggregate: (items, context) => `${context.scope}: ${items.length} bản ghi`
aggregate: { calculate: items => items.filter(item => item.active).length }
aggregate: { templateRef: summaryTemplate }
aggregate: { calculate: 'SUM', templateRef: summaryTemplate }
aggregate: { calculate: items => items.length, templateRef: summaryTemplate }
```

Callback đồng bộ, thuần, không mutate array/data hoặc gọi API. Result public là
`string | number | boolean | Date | null | undefined`; Promise/Observable không
được hỗ trợ. `calculate` quyết định giá trị, `templateRef` quyết định cách render.
Template-only có `value=undefined`; dùng `items` và context để hiển thị.

| Context | Ý nghĩa |
| --- | --- |
| `column` | Leaf data column đang tính |
| `kind` | `'total'`, `'group'`, `'tree'` |
| `scope` | Scope yêu cầu `'page'` hoặc `'filtered'` |
| `group` | Khi subtotal nhóm: `{ key, values }`, values là raw group fields |
| `parent` | Khi subtotal nhánh: raw parent, không nằm trong subtotal items |
| `isComplete` | Đầy đủ trong scope/node set yêu cầu, không phải toàn database |
| `$implicit`, `items` | Chỉ trên template: cùng readonly raw item array |
| `value` | Chỉ trên template: kết quả calculate, hoặc undefined |

Imports public từ `@sdcorejs/angular/components/table`:
`SdTableAggregateOperation`, `SdTableAggregateResult`, `SdTableAggregateCallback`,
`SdTableAggregateContext`, `SdTableAggregateTemplateContext<T, R>`,
`SdTableAggregateGroup`, `SdTableAggregateDefinition`, `SdTableColumnAggregate`,
`SdTableOptionAggregate`.

Ví dụ standalone hoàn chỉnh; static query được resolve trước `ngOnInit`, tránh
đọc `viewChild.required()` trước khi template sẵn sàng:

```ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  SdTable, SdTableOption, SdTableAggregateTemplateContext, SdMaterialFooterDefDirective,
} from '@sdcorejs/angular/components/table';

interface Order { name: string; amount: number | null; }

@Component({
  selector: 'app-order-totals',
  imports: [SdTable, DecimalPipe, SdMaterialFooterDefDirective],
  template: `
    <ng-template #summary let-items let-value="value" let-kind="kind" let-isComplete="isComplete">
      @if (isComplete) {
        <strong>{{ value | number:'1.0-2' }}</strong>
        <small>{{ kind }} · {{ items.length }} bản ghi</small>
      } @else { <span>Chưa đủ dữ liệu</span> }
    </ng-template>
    @if (option) {
      <sd-table [option]="option">
        <ng-template sdTableFooterDef="amount" let-items="items">
          Footer riêng: {{ items.length }} dòng trên trang
        </ng-template>
      </sd-table>
    }
  `,
})
export class OrderTotals implements OnInit {
  @ViewChild('summary', { static: true }) summary!: TemplateRef<SdTableAggregateTemplateContext<Order, number | null>>;
  option?: SdTableOption<Order>;
  ngOnInit(): void {
    this.option = {
      type: 'local', items: () => [{ name: 'A', amount: 40 }, { name: 'B', amount: 60 }],
      aggregate: { scope: 'filtered' },
      columns: [
        { field: 'name', title: 'Tên', type: 'string', aggregate: (items, ctx) =>
          ctx.kind === 'group' ? 'Tổng nhóm' : ctx.scope === 'page' ? 'Tổng trang' : 'Tổng sau lọc' },
        { field: 'amount', title: 'Số tiền', type: 'number',
          aggregate: { calculate: 'SUM', templateRef: this.summary } },
      ],
    };
  }
}
```

Để dùng template-only, bỏ `calculate` và đổi nội dung template sang hiển thị
`items/context`; `value` sẽ undefined. Table không tự chèn label vào cell đã có
aggregate. Callback ở cột `name` trong ví dụ trên minh họa label do consumer chọn.

### Scope, grouping, tree và dữ liệu chưa đầy đủ

```ts
aggregate: {
  scope: 'page',       // default; hoặc 'filtered' cho local
  group: false,        // default; true để thêm subtotal nhóm
  tree: {
    items: 'leaves',   // default; hoặc 'roots', 'all'
    subtotal: false,   // default; true để thêm subtotal nhánh
  },
}
```

- `page`: raw rows thuộc trang hiện tại sau filter/sort/pagination. Không lấy
  selected rows hoặc DOM viewport làm nguồn tính.
- `filtered`: toàn bộ kết quả local sau filter, trước pagination. Ví dụ 50 bản
  ghi khớp, pageSize 10: page có tối đa 10 giá trị, filtered tối đa 50.
- Server: trang tải xong có thể complete với scope page. Không lấy pagination
  `total` làm COUNT, không tự tải thêm trang. Server filtered báo diagnostic và
  `isComplete=false`; built-in trả undefined, **không fallback thành page**.
  Callback/template nhận phần dữ liệu sẵn có và cờ incomplete. Chưa có contract
  backend aggregate trong API này.
- Loading ẩn snapshot cũ; lỗi hoặc required filter chưa hợp lệ không trở thành
  tổng 0 của một dataset rỗng thành công. `isComplete` mô tả dữ liệu trong scope.
- `group:true` thêm subtotal cuối nội dung nhóm đang mở. Thu gọn ẩn subtotal
  của nhóm, không đổi grand total hay tính lại callback. Nhóm theo nhiều fields
  hiện là **combined bucket**, không phải nested row groups. Group AVERAGE và
  grand AVERAGE luôn tính từ raw items, không average-of-averages.
- Grouped headers hiện hỗ trợ một cấp `children`. Chỉ leaf đang hiển thị tham
  gia aggregate, theo thứ tự/visibility của grid. Parent không có merged summary.
  Hidden/invisible child bị loại khỏi cả header/body/aggregate; sticky child
  đồng bộ với body. Không mở rộng thêm nested header/group capability.
- `option.aggregate.tree` không bật tree mode. Khi có `option.tree`, tree ưu
  tiên hơn row grouping theo hành vi table hiện tại.

| `tree.items` | Grand total | Subtotal nhánh |
| --- | --- | --- |
| `roots` | Các root thuộc scope | Các con trực tiếp của parent |
| `leaves` | Các leaf đã xác định | Leaf bên dưới parent |
| `all` | Mọi node, gồm cha và con | Mọi descendant, loại parent |

Cha 100, hai con 40 và 60: grand roots=100, leaves=100, all=200. Shared descendants
được tính một lần trong từng phép tính; không cộng lại subtotal vào tổng. Collapse
hoặc `maxDepth` hiển thị không loại raw node đã có. Static tree filter giữ/prune
nhánh theo pipeline hiện có; parent đã biết có children không trở thành leaf chỉ
vì các con bị filter ẩn.

Lazy node chưa tải children và chưa được xác định là leaf không được tính như
leaf. Thiếu descendants cần dùng khiến leaves/all incomplete; roots vẫn complete
nếu các root cần tính đã có. Subtotal roots cần children trực tiếp đã tải.
Built-in incomplete trả undefined và placeholder; callback/template có thể ghi
“Chưa đủ dữ liệu”. Mở nhánh tải children (kể cả kết quả rỗng) cập nhật snapshot;
aggregate không tự gọi loader.

### Lifecycle, sticky và mobile

Kết quả, text và context được tính một lần theo data/config lifecycle. Filter,
paging, `reload()`, đổi option/cấu hình và lazy load cập nhật aggregate. Sau khi
sửa data tại chỗ, gọi API hiện có `table.detectChanges()` để invalidation; dùng
`reload(false)` để áp lại filter/pagination hoặc `reload()` để tải nguồn mới.
Chỉ resize/reposition, selection, collapse/expand dữ liệu đã có hoặc một lần
Angular change detection không chạy lại reducer/callback.

Aggregate và footer là hai Material footer rows hợp lệ, tổng đứng trước footer.
Sticky offset đo theo chiều cao thực tế, có theo dõi thay đổi kích thước template
nhiều dòng. Mobile card mode dùng cùng snapshot cho vùng tổng và subtotal; không
có engine tính riêng. Table hiện không có virtual-scroll viewport; aggregate
không phụ thuộc số DOM rows đang render.

Showcase **Column aggregate** có bộ dữ liệu với `null`, `undefined`, `''`, `[]`,
`0`, `false`, lựa chọn numeric operation và page/filtered, COUNT string/boolean/
array, date MIN/datetime MAX, callback, template-only, built-in + template,
footer cùng tổng, grouped headers, nhóm dòng, static tree và lazy caveat.

## Row height and fill mode

A one-line row is 36px high (`--mat-table-row-item-container-height: 36px` on the host; Material's default is 52px). Rows with longer text, buttons or other taller content grow as before.

Inside `sd-page-list`, the main table runs in **fill mode**: the page list provides `SD_TABLE_LAYOUT` (`@sdcorejs/angular/components/table`) and names the table, or a wrapper around it, as its fill target. The host then gets the class `sd-table--fill` and:

- takes the height left in its flex column (`flex: 1 1 0`) instead of `height: 100%`;
- keeps the data area at least as tall as the header plus five 36px rows; when that does not fit, the host keeps its minimum and the page body scrolls instead of the table;
- gives the footer at least 48px, so the paginator does not move between the paginator, the "Đang hiển thị" line and an empty footer;
- starts its external filter collapsed while `compact()` is on (see `filter.externalFilterCollapsed`).

The minimum is measured from the rendered header and the fixed parts of the table (quick search, external filter, selection bar, footer). Tables outside `sd-page-list`, and other tables on a page list, keep their own height. See `modules/layout/components/page-list/sd-page-list.md`.

### Date and time cells in client XLSX export

Default `exportExcel()` writes untransformed date/time columns as numeric Excel
date/time cells. No opt-in option is needed:

| Column type | Excel format | Stored value | Example display |
| --- | --- | --- | --- |
| `date` | `dd/mm/yyyy` | Whole calendar-day serial; time removed | `28/10/2026` |
| `datetime` | `dd/mm/yyyy hh:mm:ss` | Calendar-day serial plus time fraction; milliseconds removed | `28/10/2026 14:05:09` |
| `time` | `hh:mm:ss` | Seconds since midnight / 86400, in `[0, 1)`; no hidden date | `14:05:09` |

Parsing and timezone interpretation still come from `SdDateTimeService` and
`ISdCoreConfiguration.timeZone`. Instants (`Date`, epoch milliseconds including
`0`, strings with offsets) are converted to the configured wall clock once;
accepted zone-less strings retain the existing parser behavior. The default zone
is `local`. This does not add parsing for `dd/MM/yyyy` strings or bare clock
strings: supply values already accepted by the date service.

`null`, `undefined`, empty strings and parser-invalid values produce blank cells.
Date/datetime values from `1900-01-01` through `9999-12-31` use the Excel 1900
calendar: January 1 = serial 1, February 28 = 59, March 1 = 61. No real date maps
to Excel's fictitious February 29, 1900 (serial 60). Valid dates outside that
range stay formatted text (`dd/MM/yyyy` or `dd/MM/yyyy HH:mm:ss`); time-only
exports use the valid input's clock independently of its year.

Existing transforms keep priority: an effective `export.columns[].transform`
wins over `column.transform`, then the default conversion applies only when
neither transform handles the field. A transformed string such as `28/10/2026`
stays text; date-looking transform results are never reparsed. Preserve the
legacy distinction that export-column transforms are resolved only with explicit
`export.type: 'default'`; omitting `type` does not activate those transforms.
Column transforms retain their supported async behavior. Source rows and column
options are not mutated.

CSV remains text in `yyyy/MM/dd`, `yyyy/MM/dd HH:mm:ss`, and `HH:mm:ss`; CSV has no
cell-type metadata. Custom export callbacks and other column types keep their
existing behavior.

**Migration:** consumers reading generated XLSX files must accept numeric/date
cells instead of relying on the previous date strings. ExcelJS readers may
interpret the earliest 1900 serials differently because of the fictitious leap
day; the exported numeric serials follow Excel's calendar. The table still owns
timezone conversion; `SdExcelService` only writes the supplied values and format.

## Content projection (slots / directive children)

- `[sdTableCellDef]="'<field>'"` — custom cell template per column. Inside `<ng-template sdTableCellDef="fieldName" let-row>...</ng-template>`.
- `[sdTableTitleDef]="'<field>'"` — custom header template per column.
- `[sdTableFooterDef]="'<field>'"` — custom footer cell (totals row). Presence of any footer def turns on the footer row.
- `[sdTableFilterDef]="'<field>'"` — custom inline-filter template per column.
- `sdTableQuickSearchRightDef` — optional template to the right of `filter.quickSearch`; only rendered when quick search is enabled.
- `[sdTableExpandDef]` — custom row-expansion (sub-information) template.
- `[sdTableCommandHeaderDef]` — content for the **header cell of the command column**, which is otherwise empty. No field argument (there is only one command column). Use it for a table-level action — typically "add row" — so it sits directly above the per-row command buttons instead of needing its own strip below the table. Rendered centered; the cell stays 50px wide, so keep it to one icon button. Nothing is rendered (no wrapper element) when the template is absent.

```html
<sd-table [option]="option">
  <ng-template sdTableCommandHeaderDef>
    <sd-button prefixIcon="add" type="text" color="primary" tooltip="Thêm dòng" (click)="addRow()"></sd-button>
  </ng-template>
</sd-table>
```

### Standalone imports for projected table templates

`<sd-table>` is standalone, but Angular still requires every directive and pipe used by projected templates to be imported by the host standalone component. This is the most common source of AI-generated compile errors.

```ts
import { Component } from '@angular/core';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableExpandDefDirective,
  SdTableFilterDefDirective,
  SdTableFooterDefDirective,
  SdTableOption,
  SdTableTitleDefDirective,
} from '@sdcorejs/angular/components/table';
import { SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [
    SdTable,
    SdTableCellDefDirective,
    SdTableFilterDefDirective,
    SdTableTitleDefDirective,
    SdTableFooterDefDirective,
    SdTableExpandDefDirective,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdFormatNumberPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdViewPipe,
  ],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="amount" let-row>
        {{ row.amount | sdFormatNumber: 0 | sdView }}
      </ng-template>

      <ng-template sdTableCellDef="createdAt" let-row>
        {{ row.createdAt | sdFormatDatetime: 'dd/MM/yyyy HH:mm' | sdView }}
      </ng-template>

      <ng-template sdTableFilterDef="keyword" let-filter let-update="update">
        <sd-input size="sm" hideInlineError [(model)]="filter.keyword" (keyupEnter)="update()"></sd-input>
      </ng-template>
    </sd-table>
  `,
})
export class InvoiceListComponent {
  tableOption!: SdTableOption<unknown>;
}
```

| Template usage                           | Required import             |
| ---------------------------------------- | --------------------------- | ---------------------- |
| `<ng-template sdTableCellDef="field">`   | `SdTableCellDefDirective`   |
| `<ng-template sdTableFilterDef="field">` | `SdTableFilterDefDirective` |
| `<ng-template sdTableTitleDef="field">`  | `SdTableTitleDefDirective`  |
| `<ng-template sdTableFooterDef="field">` | `SdTableFooterDefDirective` |
| `<ng-template sdTableExpandDef>`         | `SdTableExpandDefDirective` |
| `                                        | sdFormatNumber`             | `SdFormatNumberPipe`   |
| `                                        | sdFormatDate`               | `SdFormatDatePipe`     |
| `                                        | sdFormatDatetime`           | `SdFormatDatetimePipe` |
| `                                        | sdView`                     | `SdViewPipe`           |

### Dense editable controls inside table cells

When rendering form controls inside cells, custom inline filters, external-filter templates, dashboard filter bars, or table toolbars, always use `size="sm"` where supported and `hideInlineError`. This keeps dense surfaces compact and uses the error icon/tooltip instead of expanding the row with inline error text.

**Quy tắc label, required và hướng dẫn trong cell:**

- Input, dropdown/select, date/datetime và các control khác trong cell dùng `size="sm"`; **không truyền label hiển thị** vì title của cột đã mô tả dữ liệu. Không dùng placeholder để lặp lại title; chỉ dùng khi cần gợi ý định dạng hoặc giá trị.
- Cột có dữ liệu bắt buộc hiển thị **`*` màu error ngay sau title**, cùng một hàng. Dùng token Core qua `text-error`; không viết title dài như “Họ và tên (bắt buộc)” hoặc lặp chữ “Bắt buộc” trong mỗi cell.
- Guide/help của cột dùng **icon `info` kèm tooltip ở header**, sau title và dấu `*` nếu có. Không đặt đoạn hướng dẫn dài trong header/cell hoặc lặp lại `helperText` cho mọi hàng. Tooltip cần truy cập được bằng bàn phím và icon có tên truy cập; thao tác xem trợ giúp không được kích hoạt sort.
- Vẫn giữ `required`/validator trên từng control; dấu `*` ở header chỉ là thông tin hiển thị, không thay thế validation. Không bỏ tên truy cập của control khi bỏ label hiển thị; bảo đảm người dùng screen reader vẫn nhận biết trường và hàng đang chỉnh sửa.
- Quy tắc không lặp label áp dụng cho cell có title cột tương ứng. Filter/toolbar độc lập và mobile card không có header cột hiển thị vẫn cần nhãn/ngữ cảnh nhận diện trường.

Dùng API hiện có: `<ng-template sdTableTitleDef="field">` hoặc `column.title.templateRef` cho header và `sdTableCellDef` cho cell. Giữ `column.title` (hoặc `column.title.title`) là tên dữ liệu ngắn, ví dụ `Số lượng`; không thêm API `column.required`/`headerTooltip` vì các field này chưa tồn tại.

Ví dụ dưới đây dùng `SdTableTitleDefDirective`, `SdTableCellDefDirective`, `SdIcon` và `MatTooltipModule` trong imports của consumer, cùng các control tương ứng. Cột `quantity` có title `Số lượng` trong `tableOption`.

```html
<sd-table [option]="tableOption">
  <ng-template sdTableTitleDef="quantity">
    <span style="display: inline-flex; align-items: center; gap: 4px">
      <span>Số lượng <span class="text-error" aria-hidden="true">*</span></span>
      <sd-icon
        name="info"
        size="16px"
        tabindex="0"
        role="img"
        aria-label="Hướng dẫn số lượng"
        matTooltip="Nhập số nguyên dương. Đây là dữ liệu bắt buộc."
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"></sd-icon>
    </span>
  </ng-template>

  <ng-template sdTableCellDef="quantity" let-row>
    <sd-input-number size="sm" hideInlineError required type="positive" [precision]="0" [(model)]="row.quantity"></sd-input-number>
  </ng-template>

  <ng-template sdTableCellDef="status" let-row>
    <sd-select size="sm" hideInlineError [items]="statusList" valueField="code" displayField="name" [(model)]="row.status"></sd-select>
  </ng-template>

  <ng-template sdTableCellDef="note" let-row>
    <sd-input size="sm" hideInlineError [(model)]="row.note"></sd-input>
  </ng-template>
</sd-table>
```

### Display pipes in custom cells

Prefer shared pipes instead of app-local formatting pipes or ad-hoc template expressions.

```html
<ng-template sdTableCellDef="amount" let-row> {{ row.amount | sdFormatNumber : 0 | sdView }} </ng-template>

<ng-template sdTableCellDef="issueDate" let-row> {{ row.issueDate | sdFormatDate | sdView }} </ng-template>

<ng-template sdTableCellDef="updatedAt" let-row> {{ row.updatedAt | sdFormatDatetime : 'dd/MM/yyyy HH:mm' | sdView }} </ng-template>

<ng-template sdTableCellDef="tags" let-row> {{ row.tags | sdView }} </ng-template>
```

### Dense filter/cell controls

When rendering SD form controls in `sdTableFilterDef`, editable cells, external-filter custom templates, dashboard filter bars, or compact table toolbars, use `size="sm"` where supported and `hideInlineError`. This prevents Material's inline error/subscript row from increasing header, row, or toolbar height; validation remains available through the compact error icon/tooltip.

```html
<ng-template sdTableFilterDef="keyword" let-filter let-update="update">
  <sd-input size="sm" hideInlineError [(model)]="filter.keyword" (keyupEnter)="update()"></sd-input>
</ng-template>
```

## Visual cues (helps agent map screenshots → component)

The settings modal lists one 44px row per column (handle, **Hiện** checkbox, summary) inside a bordered list that uses the modal body's gutters, aligned with the footer actions; see **Settings modal**.

Colours come from the theme (see `assets/THEME.md`, "Table tokens"): the header band, row dividers, hover, selected, activated and group rows are `color-mix()` of the palette over `--sd-table-bg`, so dark mode and presets follow. Sort arrows are tinted `--sd-text-secondary` at rest and `--sd-text` on the sorted column; the drag preview, reorder handle and hover overlays use theme tokens too.

The desktop table uses subtle 6px outer corners: the existing scroll area rounds the top corners and the paginator rounds the bottom corners. No additional clipping or scroll container is introduced, preserving sticky headers and columns. Mobile cards retain their existing shape.

- **Toolbar** (top): external-filter form (collapsible), reload button, column-config gear, export menu, selection-action bar (when rows selected).
- **Query bar** (`filter.mode: 'query-bar'`, desktop): one chip row flush at the top of the table card instead of quick search, external filter and the filter row; a funnel icon appears beside a filterable column title on hover and stays blue while that column filters.
- **Header row**: column titles, sort arrows on sortable columns, inline filter row beneath header (input/select/daterange depending on column `type`). Sticky on scroll.
- **Body rows**: standard row height, hover highlight, per-row commands cell on the **right** (default) or `command.align='left'`. Tree expand toggle (`chevron_right` collapsed / `expand_more` expanded, light hover bg) is **embedded in the first column** — the `sdIndex` cell when `index.enabled`, otherwise the first data column — indented per depth (no separate toggle column). Expand caret for master-detail when `expand` configured.
- **Selection column**: leftmost checkbox column when `selector.visible`. Header checkbox toggles select-all.
- **Selection-action bar** (`<selector-action>`, contained): opens only when rows are selected **and** `selector.actions` resolves to at least one action the selection is allowed to run. A table with `selector.visible` but no `actions` never opens the bar — it would restate the checkbox state with `×` as its only control; deselect through the checkboxes instead. The per-row allow-list still applies, so a selection mixing rows with different permitted actions can resolve to zero and keep the bar closed.
- **Sticky columns**: any column with `fixed: true` stays pinned while horizontal scroll happens; rendered with a subtle box-shadow on the boundary (via `StickyShadowDirective`).
- **Group rows**: spanning row with HTML rendered from `group.htmlTemplate`, separating sub-sections.
- **Empty state**: one of three illustrated messages, for local and server tables alike — filter/search returned nothing (`images.filterEmpty`), a required external filter is still empty (`images.filterRequired`), or there is no data yet (`images.dataEmpty`). A projected `sdDataStateTemplate` replaces it for server reads. It only renders when the table has no rows. A failed read, local or server, shows the `sd-data-state` error block with a retry button.
- **Loading**: no overlay. Without rows: grey skeleton bars under the real header (mobile: skeleton cards). With rows, after 300 ms: the table body fades to 55% and a 2px bar runs under the last header row. A tree chevron or expand button that is loading shows a small spinner in place of its icon. See **Loading**.
- **Pagination bar** (bottom): "Đang hiển thị 1-50/1.234" + page-size selector + first/prev/next/last buttons. Vietnamese labels via `SdTablePaginatorIntl`. With `paginate.total: 'unknown'`: page-size selector + loaded range only (`26-32`, no total) + prev/next (first when `showFirstLastButtons`), never a last button; automation ids `<autoId>-paginator`, `-paginator-previous`, `-paginator-next`, `-paginator-first`, `-paginator-page-size`.
- **Drag handle** (when `rowReorder.enabled`): leftmost icon column `sdReorder` with the configured icon (default `drag_indicator`); rows can be reordered within the same group.
- **Row-number (STT) column** (when `index.enabled`): sticky `sdIndex` column rendering the global row number (`pageIndex * pageSize + i + 1`). Sits after selector/tree/command(left)/group, before data columns. Title defaults to `'#'`, width `'50px'`. Hidden on group spanning rows.
- **Column resize handle** (when `config.resizable`): a 6px transparent strip at the right edge of each data-column header. Cursor changes to `col-resize` on hover; a subtle dark overlay appears on hover for affordance. The handle does not show on `sdSelection`/`sdCommand`/`sdGroup`/`sdSubInformation`/`sdReorder`/`sdIndex` columns or on `type: 'children'` parent headers.

## Configuration provider

```ts
provide: SD_TABLE_CONFIGURATION,
useValue: {
  paginate: { pageSize: 50, pages: [10, 25, 50, 100], showFirstLastButtons: true },
  filter: { hideInlineFilter: false, operator: { default: { string: 'CONTAIN', ... }, list: { ... } } },
  // Giao diện lọc mặc định cho mọi bảng (option.filter.mode thắng); queryBar gộp theo từng field.
  // filter: { mode: 'query-bar', queryBar: { editor: 'popover' } },
  // Ảnh thay cho 3 trạng thái empty mặc định (bỏ trống thì dùng ảnh của core).
  images: { dataEmpty: 'assets/empty.svg', filterEmpty: 'assets/no-results.svg', filterRequired: 'assets/choose-filter.svg' },
  // Lớp loading cho mọi bảng; option.loading của từng bảng thắng theo từng field.
  loading: { showDelay: 300, minDuration: 400 },
} satisfies ISdTableConfiguration
```

Per-table options always override these defaults.

## Export button label (i18n)

The export button's label comes from the i18n catalog, so it follows the app language — it used to be the hard-coded English string `Export`, which showed up untranslated for Vietnamese users.

| Key | vi | en |
|---|---|---|
| `core.component.table.export` | Xuất dữ liệu | Export |
| `core.component.table.exporting` | Đang xuất...{percent}% | Exporting...{percent}% |
| `core.component.table.export-excel` | Xuất excel | Export Excel |
| `core.component.table.export-csv` | Xuất CSV | Export CSV |

`TableExportService.exportTitle` is a `computed()` over the current language plus the export progress; drive progress with `setExportProgress(percent | null)` (`null` restores the idle label). Do not assign to `exportTitle` — it is no longer writable.

## Export row limit (`export.max`) — BREAKING

`export.max` used to be declared on `SdTableOptionExportDefault` but never read, so an export with
100 000 rows went ahead even with `max: 5000`. It is now enforced for Excel and CSV export:

- Before any data is fetched, the table total (server total, or the filtered row count of a local table)
  is compared with `max`.
- While exporting, the total reported by `items` / `export.items` (`{ items, total }`) and the number
  of rows fetched so far are checked again, so a stale table total cannot slip through.
- When the limit is exceeded, no file is written, the export button returns to its idle state and a
  warning toast shows `core.component.table.export-max-exceeded` with `{max}` and `{total}`.
- Only a positive finite number is a limit. Leaving `max` unset (or `0`, a negative number, `NaN`)
  keeps the export unlimited, as before.
- `export.type: 'custom'` is not affected — `onExport` owns its own limits.

| Key | vi | en |
|---|---|---|
| `core.component.table.export-max-exceeded` | Không thể xuất {total} dòng. Giới hạn là {max} dòng — hãy thu hẹp bộ lọc rồi thử lại. | Cannot export {total} rows. The limit is {max} rows — narrow the filter and try again. |

## Permission gating

None built in. The package ships no license or permission gate of its own. Bulk actions (`selector.actions`) and per-row `commands` are gated at the application level (hide via the `hidden(row)` predicate, or omit the option when composing it). To gate the whole table, wrap the host with `*sdPermission`.

## Examples

### 1. Server-paginated list with filters, selection, commands, export — typical CRUD list page

```html
<sd-page title="Quản lý nhân viên">
  <ng-container headerRight>
    <sd-button
      *sdPermission="'HR_C_EMPLOYEE_CREATE'; sdPermissionKey: 'hr'"
      title="Tạo mới"
      type="fill"
      color="primary"
      prefixIcon="add"
      (click)="onCreate()">
    </sd-button>
  </ng-container>

  <sd-table #tableRef autoId="employee" [option]="tableOption"></sd-table>
</sd-page>
```

```ts
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

@ViewChild(SdTable) tableRef!: SdTable<Employee>;

tableOption: SdTableOption<Employee> = {
  type: 'server',
  key: 'hr.employee.list', // persists user column-config

  items: async (filterReq, pagingReq) => this.api.searchEmployees(pagingReq),

  columns: [
    { field: 'code', title: 'Mã NV', type: 'string', width: '120px', fixed: true,
      sortable: true, filter: { operator: { enable: true, default: 'CONTAIN' } } },

    { field: 'fullName', title: 'Họ và tên', type: 'string', sortable: true,
      cell: { copiable: true, truncate: { enable: true, type: 'tooltip' } },
      click: (_, row) => this.onView(row) },

    { field: 'department.name', title: 'Phòng ban', type: 'lazy-values',
      option: {
        items: this.api.searchDepartments,
        valueField: 'id',
        displayField: 'name',
        selection: 'MULTIPLE',
      } },

    { field: 'status', title: 'Trạng thái', type: 'values',
      option: { items: STATUS_LIST, valueField: 'value', displayField: 'label' },
      useBadge: (val) => ({ color: val === 'ACTIVE' ? 'success' : 'warn',
                            title: val === 'ACTIVE' ? 'Hoạt động' : 'Ngưng' }) },

    { field: 'salary', title: 'Lương', type: 'number', align: 'right', sortable: true },

    { field: 'hiredAt', title: 'Ngày vào', type: 'date', sortable: true,
      filter: { type: 'daterange' } },
  ],

  filter: {
    externalFilters: [
      // Global search only. Do not repeat `status` here because it already has an inline column filter.
      { field: 'q', type: 'string', defaultOperator: 'CONTAIN' },
    ],
  },

  selector: {
    visible: true,
    actions: [
      { icon: 'check_circle', title: 'Kích hoạt', color: 'success', type: 'fill',
        click: (rows) => this.onActivate(rows) },
      { icon: 'block', title: 'Khóa', color: 'warn', type: 'outline',
        click: (rows) => this.onDeactivate(rows) },
    ],
    message: (rows) => `Đã chọn ${rows?.length ?? 0} nhân viên`,
  },

  command: {
    align: 'right',
    commands: [
      { icon: 'visibility', title: 'Xem', click: (row) => this.onView(row) },
      { icon: 'edit', title: 'Sửa', color: 'primary',
        hidden: (row) => !row.canEdit, click: (row) => this.onEdit(row) },
      { icon: 'delete', title: 'Xóa', color: 'warn',
        click: (row) => this.onDelete(row) },
    ],
  },

  paginate: { pageSize: 50, pages: [25, 50, 100, 200] },

  export: {
    type: 'default',
    fileName: 'danh-sach-nhan-vien',
    visible: 'ALL',
    items: (filterReq) => this.api.exportEmployees(filterReq),
  },

  reload: { visible: true },
  config:  { visible: true },
  sort:    { enable: true },
  style:   { shadow: true, maxHeight: 'calc(100vh - 280px)' },
};
```

### 2. Local-mode table with row expansion and grouping

```ts
tableOption: SdTableOption<Order> = {
  type: 'local',
  items: () => this.cachedOrders, // sync array
  columns: [
    { field: 'orderNo', title: 'Số đơn', type: 'string', fixed: true },
    { field: 'customerName', title: 'Khách hàng', type: 'string' },
    { field: 'total', title: 'Tổng tiền', type: 'number', align: 'right' },
  ],
  group: {
    fields: ['status'],
    htmlTemplate: rows => `<strong>${rows[0].status}</strong> &nbsp; (${rows.length} đơn)`,
  },
  expand: {
    multiple: false,
    onExpand: row => this.api.getOrderDetails(row.id), // returns Promise
  },
};
```

```html
<sd-table [option]="tableOption">
  <ng-template sdTableExpandDef let-row>
    <div class="p-3">
      <div>Mã KH: {{ row.customerCode }}</div>
      <div>Ghi chú: {{ row.note }}</div>
      <!-- row.meta.expand.data is the resolved Promise -->
    </div>
  </ng-template>
</sd-table>
```

### 3. Custom cell template with badge + commands

```html
<sd-table [option]="tableOption">
  <ng-template sdTableCellDef="status" let-row>
    <sd-badge
      [title]="row.statusLabel"
      [color]="row.status === 'APPROVED' ? 'success' : 'warn'"
      [icon]="row.status === 'APPROVED' ? 'check' : 'hourglass_empty'">
    </sd-badge>
  </ng-template>
</sd-table>
```

### 4. Custom inline filter for a column

```html
<sd-table [option]="tableOption">
  <ng-template sdTableFilterDef="customField" let-filter let-update="update">
    <sd-input size="sm" hideInlineError [(model)]="filter.customField" (modelChange)="update()"></sd-input>
  </ng-template>
</sd-table>
```

### 5. Resizable columns with min/max constraints and remote profile sync

```ts
tableOption: SdTableOption<Employee> = {
  type: 'server',
  key: 'hr.employee.list', // required for resize to persist across reloads
  items: (req, paging) => this.api.search(paging),

  columns: [
    // Constrained: user cannot shrink below 80px or grow above 300px
    { field: 'code', title: 'Mã', type: 'string', width: '120px', minWidth: '80px', maxWidth: '300px' },
    // Unconstrained: free resize (clamped only to default min 40px)
    { field: 'name', title: 'Họ tên', type: 'string', width: '220px' },
    { field: 'salary', title: 'Lương', type: 'number', width: '140px', align: 'right' },
  ],

  config: {
    visible: true, // also show the gear button so user can reset
    resizable: true, // enable drag handle on data columns
    onResize: (field, width, columnWidth) => {
      // Optional: sync to a remote user profile so widths follow the user
      // across browsers/devices. Fires once per resize (on mouseup).
      console.log(`User resized '${field}' → ${width}`);
      console.log('Current column widths:', columnWidth);
      // e.g. { code: '120px', name: '320px', salary: '140px' }
      this.userPrefs.saveTableLayout('hr.employee.list', columnWidth);
    },
  },
};
```

The drag handle hides automatically for columns excluded from resize. Widths reload from localStorage on next page visit; calling `tableRef.detectChanges()` is not necessary — the component's storage subscriber updates the live configuration signal in place without re-fetching data.

## Anti-patterns

- ❌ Recreating `tableOption` on every change-detection cycle (e.g. computing it inside the template) — every new reference triggers a full re-init via the `effect`. Keep it as a class property.
- ❌ Using `type: 'local'` for ≥ 1k rows that come from the server — paging happens client-side, so all rows are fetched and held in memory. Switch to `type: 'server'`.
- ❌ Skipping `option.key` on a customer-facing list — without it, user column-config is not persisted across page reloads.
- ❌ Turning on `selector.preserveSelection` (or `tree`) on a `type: 'server'` table without `option.rowKey` — a re-fetch produces new row objects, so the ids change and the selection / expand state is not restored. See **Row identity**.
- ❌ Returning a fresh object from `style.rowCss` that encodes state the table cannot see — `rowCss` is resolved **once per render** (and after a tree expand), not on every change-detection pass. Trigger a `reload()` when the styling inputs change.
- ❌ Wiring per-row navigation via the cell `click` callback when the user expects right-click "open in new tab" — use a column with `htmlTemplate` rendering an `<a [sdHref]>` instead.
- ❌ Defining `commands` AND `command.commands` simultaneously — `command` is the newer API; pick one to avoid confusion.
- ❌ Putting a heavy server-side `items()` in front of a daterange filter without honoring the `BETWEEN` / `GREATER_OR_EQUAL` operators emitted in `pagingReq.filters` — the table builds the request correctly; your backend must accept that operator vocabulary.
- ❌ Reading a `split-number` column filter on the server as `EQUAL` with a `{ from, to }` object — after release `3.1` the table sends `BETWEEN` `{ from, to }`, `GREATER_OR_EQUAL` or `LESS_OR_EQUAL` (see "server payload for `split-number`").
- ❌ Using `'lazy-values'` with `selection: 'MULTIPLE'` and forgetting to provide `views` — bulk-display of saved values needs `views(values) => K[]` to render labels for already-stored ids.
- ❌ Mutating row data in-place after a server fetch and expecting the table to redraw — call `tableRef.reload()` or replace the dataset reference.
- ❌ Setting `expand.always: true` AND `expand.onExpand` — `always` keeps every row expanded; `onExpand` is bypassed for toggling but still called once for each row's data on first render. Decide which mode you want.
- ❌ Relying on `output` events — there are none. Use `option`-level callbacks or `@ViewChild` API.
- ❌ Setting `config.resizable: true` without `option.key` and expecting widths to survive reload — without `key` the storage falls back to session storage hashed from the option object; safe for prototypes, not for persistent UX.
- ❌ Using `column.minWidth: '30%'` (or any non-`px` unit) and expecting the resize clamp to honor it — the directive's parser only accepts `'NNpx'`. Other units render fine for static width but are treated as "no clamp" by the resize logic (falls back to default `min = 40px`).
- ❌ Writing to `column.width` programmatically while `config.resizable: true` on a table that already has `option.key` — the persisted user width takes precedence over `column.width` in `option`. Reset via the gear dialog → "Đưa về mặc định" if you want option-defined widths back.
- ❌ Mutating `columnWidth` object inside `onResize` callback expecting it to affect rendering — the snapshot is read-only intent; to push new widths back into the table, set them via `option.columns[i].width` AND clear the user storage (or write your own keyed storage).
- ❌ Rendering statuses with custom pill CSS inside cells — use `useBadge` or a projected `<sd-badge>`.
- ❌ Placing default `md`/`lg` form controls inside table filters or editable cells — use `size="sm"` for dense table UI.
- ❌ Repeating a column title as the visible label of every cell editor, writing “(bắt buộc)” in the title, or repeating long guide text in cells — use a label-free editor, a `text-error` asterisk after the header title, and a header info icon with tooltip.
- Built-in inline column filters and external filters opt their input/number/date/datetime controls into `clearable`, so users can clear an active filter even though those controls default `clearable` to `false` elsewhere.

- ❌ Forgetting to import projected-template directives (`SdTableCellDefDirective`, `SdTableFilterDefDirective`, `SdTableTitleDefDirective`, `SdTableFooterDefDirective`, `SdTableExpandDefDirective`) in a standalone host component.
- ❌ Rendering SD form controls inside table cells without `hideInlineError`; inline `<mat-error>` text expands rows and makes table density unstable.
- ❌ Creating custom number/date/datetime pipes for table cells; use `sdFormatNumber`, `sdFormatDate`, `sdFormatDatetime`, then `sdView`.
- ❌ Writing `{{ value || '--' }}` in cells; it hides valid `0`/`false` values. Use `sdView`.

- Avoid duplicating the same field in both `columns[].filter` and `filter.externalFilters`; generated list pages should choose one filter surface per field. Prefer the column filter when the field is already visible as a column; reserve external filters for global search or non-column criteria.

## E2E test attributes

Rendered directly on the `<sd-table>` host element:

| Attribute      | Value                       | Source                                                        |
| -------------- | --------------------------- | ------------------------------------------------------------- |
| `data-autoid`  | `components-table-<autoId>` | input `autoId`                                                |
| `data-loading` | `"true"` / `"false"`        | `loading` signal (toggled by paging + external-filter submit) |
| `data-loading-view` | `"none"` / `"skeleton"` / `"refresh"` | what the loading layer draws (see **Loading**). `skeleton` shows at once and also while `data-loading` is `"false"` (before the configuration, during the first read's debounce); `refresh` starts `showDelay` after `data-loading` and can stay `minDuration` after it |
| `data-filter-mode` | `"default"` / `"query-bar"` | filter UI on screen: `filter.mode`, except that mobile always renders `"default"` |

Selector example:

```ts
await expect(page.locator('sd-table[data-autoid="components-table-employees"]')).toHaveAttribute('data-loading', 'false');
// Wait for the loading layer itself to be gone (progress bar held for minDuration):
await expect(page.locator('sd-table[data-autoid="components-table-employees"]')).toHaveAttribute('data-loading-view', 'none');
```

### Inner elements (derived autoIds)

All interactive children derive their autoId from the table base `components-table-<autoId>` and are emitted by `<sd-button>` as `components-button-<base>-<suffix>`. **They render only when the table `autoId` input is set** — otherwise the attribute is omitted (no `undefined…` ids). Let `B = components-table-<autoId>`:

| Element                                               | autoId (`data-autoid`)                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Reload button                                         | `components-button-<B>-reload`                                                                               |
| Export button (custom / menu / excel-only / csv-only) | `components-button-<B>-export` / `-export-excel` / `-export-csv`                                             |
| Export menu items (Excel / CSV)                       | `<B>-export-excel` / `<B>-export-csv`                                                                        |
| Config (settings) button                              | `components-button-<B>-config`                                                                               |
| Mobile filter open button                             | `components-button-<B>-mobile-filter-open`                                                                   |
| Tree expand toggle (per row)                          | `components-button-<B>-tree-toggle-<rowId>` (native `button`, `data-autoid`; embedded in first/index column) |
| Detail expand toggle (per row)                        | `components-button-<B>-expand-<rowId>`                                                                       |
| Group collapse toggle (per group)                     | `components-button-<B>-group-toggle-<groupKey>`                                                              |
| Per-row command                                       | `<B>-command-<rowKey>-<commandKey>` (see `desktop-command`)                                                  |
| Selector-action: action buttons                       | `components-button-<B>-action-<index>`                                                                       |
| Selector-action: clear-selection (×)                  | `components-button-<B>-clear-selection`                                                                      |
| Config modal: skip / reset / apply                    | `components-button-<B>-config-skip` / `-config-reset` / `-config-apply`                                      |
| Config modal: find box / show all                     | `forms-input-<B>-config-find` / `components-button-<B>-config-show-all`                                      |
| External filter: clear / setting / submit             | `components-button-<B>clear` / `…setting` / `…submit`                                                        |
| Query bar (`filter.mode: 'query-bar'`)                | host `<B>-query-bar`; inner controls use it as the `sd-query-bar` autoId prefix                              |
| Header filter icon (query-bar mode)                   | `<B>-filter-trigger-<field>`                                                                                 |

`<rowId>` / `groupKey` come from `SdTableItem.meta.id` / `meta.group.key`, guaranteeing uniqueness per row/group. **Set `option.rowKey` if you want `<rowId>` to be a readable, deterministic value** (e.g. `…-expand-42`) — without it the id is an internally generated `sd-row-<n>` that changes between page loads and is unusable as a stable E2E selector. See **Row identity** above. Group toggles use `meta.group.key` (a hash of the group field values) and stay deterministic regardless. The base autoId is passed down to `external-filter`, `mobile-filter`, `column-filter`, `desktop-command`, `selector-action`, and `config` via their `[autoId]` input.

> Not yet covered: `popup-export` (export-template modal) — its buttons have no autoId (follow-up).

## Accessibility

- **Sort state belongs to the semantic header cell.** For an enabled sortable leaf, `aria-sort` is emitted only on the native `<th>` and the title-only control supplies the accessible name plus mouse/Enter/Space activation. Inline filters and resize handles remain siblings outside that control, so they cannot become nested interactive content or trigger sorting. Disabled, omitted and non-sortable paths emit no sort control, focus target, `aria-sort`, or icon. The Material arrow is not instantiated; the existing SdTable background indicator is the single visible icon in unsorted, ascending and descending states.
- **Loading is announced.** A visually hidden `span.sd-table-live` (`role="status" aria-live="polite" aria-atomic="true"`) is always in the DOM. It reads `core.component.table.loading` when the skeleton or the progress bar shows for a running read, then `core.component.table.loaded` (`loaded-one` for one row) with the number of rows on screen, expanded tree rows included, once the read ends. A new read clears an earlier count. A skeleton that resolves without a running read (column lookups, synchronous local data) announces nothing. When the read ends without rows, it reads the title of the empty block (see below). The default error block announces itself (`role="alert"`), so the region is cleared; with a custom `sdDataStateTemplate` it reads `core.component.table.error-occurred`. Reads faster than `showDelay` announce only an empty result. The scroll container gets `aria-busy="true"` while `loading()` is set. Skeleton rows and the progress bar are `aria-hidden`.
- **Loading buttons keep focus (desktop).** A tree toggle or expand button that is loading stays in the DOM (`aria-busy`; the tree toggle also `aria-disabled`), so keyboard focus does not fall back to the page. The tree toggle is named `core.component.table.tree-toggle` and carries `aria-expanded`. Mobile cards keep their tree and expand buttons `disabled` while loading.
- **Empty state is announced.** When a read ends without rows, `span.sd-table-live` reads the title of the empty block: `core.component.table.no-results` (filtered), `choose-filter-hint` (a required filter is missing) or `no-data`, also after a read faster than `showDelay` and under a custom `sdDataStateTemplate`. The block itself has no live role, because text inserted together with its region is often not read.
- **Row commands are named.** The per-row command buttons (`desktop-command`) dropped `aria-hidden="true"` — they are real `<button>`s that still took tab focus while announcing nothing, because they render an icon with no text. They now expose `aria-label` from the command title, plus `aria-haspopup="menu"` on the submenu trigger.
- **Clickable HTML cells are keyboard reachable.** A cell whose display config supplies `click` renders as `role="button"` + `tabindex="0"` with Enter/Space mirroring the click (it previously carried `aria-hidden="true"`). The handler ignores key events bubbling from consumer-supplied markup inside the cell, so nested controls do not double-fire.
- **Settings modal from the keyboard.** Tab runs the selected tab (← → / Home / End switch **Cột** and **Bộ lọc**) → find box → **Hiện tất cả** → per row handle, **Hiện**, open button → the details of the open row → footer. The handle reorders with Space / Enter, ↑ / ↓ and Escape, and a live region inside the modal (`aria-live="assertive"`) reads each step; one outside an `aria-modal` dialog can be skipped by screen readers. Each handle is named “Kéo để đổi thứ tự cột: {title}” and each **Hiện** checkbox “Hiển thị: {title}” (a visually hidden label); the fixed / shortened flags are named for screen readers. On **Bộ lọc**, the two kinds are one radio group (arrow keys change the pick) named by the card title and described by its text, and each filter switch is named by the filter title. The settings button dot is described by `indicatorLabel`.

## Related

- `<sd-button>`, `<sd-quick-action>` — used in toolbar / per-row commands
- `<sd-badge>` — used inside cells via `useBadge` or custom cell templates
- `<sd-page>`, `<sd-section>` — typical wrappers for a list page
- `*sdPermission` — for permission-gated rows / commands
- `SD_TABLE_CONFIGURATION` — global default config provider
- `SdSearch<T>` (forms autocomplete pattern) — used by `'lazy-values'` columns
- `PagingReq`, `Operator` — request payload contract for server-mode tables
- Skill ref `30-list-page.md` (if present) — the recommended page-level scaffold using `<sd-table>`


## Mobile row cards (`sdTableRowMobileDef`)

Import `SdTableRowMobileDefDirective` with `SdTable` from `@sdcorejs/angular/components/table` (both are also exported by the components barrel). Project **one** mobile template directly into each table. No provider or additional mobile flag is required. Nested tables own their templates and selection independently.

With a template, `SdViewportService.isMobile()` selects the card renderer; its configured Core breakpoint is shared with the rest of the application (default: width below 768px). Without a template, the existing table renderer remains in use at every width. Only one renderer exists at a time. `MatSort`, paginator, filters, data, selection and expanded rows belong to the same table instance: resizing neither fetches data nor reapplies `defaultSelected`.

### Complete standalone consumer

```ts
import { DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  SdTable,
  SdTableOption,
  SdTableRowMobileDefDirective,
} from '@sdcorejs/angular/components/table';

interface Order {
  id: string;
  customerName: string;
  total: number | null;
  locked: boolean;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, SdTable, SdTableRowMobileDefDirective],
  template: `
    <sd-table autoId="orders" [option]="tableOption">
      <ng-template
        [sdTableRowMobileDef]="tableOption"
        let-row="item"
        let-index="index"
        let-selected="selected"
        let-selectionDisabled="selectionDisabled"
        let-autoId="autoId">
        <strong>{{ row.id }} · {{ row.customerName }}</strong>
        <p>{{ row.total == null ? '—' : (row.total | number) }} ₫</p>
        <small>{{ index + 1 }} · {{ selected ? 'Đã chọn' : 'Chưa chọn' }}</small>
        @if (selectionDisabled) { <p>Không thể chọn đơn này</p> }
        <button type="button" (click)="message.set('Ghi chú: ' + row.id)">Ghi chú</button>
      </ng-template>
    </sd-table>
    <p role="status">{{ message() }}</p>
  `,
})
export class OrdersComponent {
  readonly message = signal('');
  readonly orders: Order[] = [
    { id: 'DH-001', customerName: 'An', total: 250000, locked: false },
    { id: 'DH-002', customerName: 'Bình', total: null, locked: true },
  ];
  readonly tableOption: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: () => this.orders,
    mobile: { rowLabel: row => `${row.id} · ${row.customerName}` },
    columns: [
      { field: 'id', type: 'string', title: 'Mã đơn', sortable: true },
      { field: 'customerName', type: 'string', title: 'Khách hàng' },
      { field: 'total', type: 'number', title: 'Tổng tiền' },
    ],
    sort: { enable: true },
    paginate: { pageSize: 10 },
    selector: {
      visible: true,
      preserveSelection: true,
      disabled: row => !!row?.locked,
      actions: [{ title: 'Xử lý', click: (rows = []) => this.process(rows) }],
    },
    command: {
      commands: [{ title: 'Xem', click: row => this.message.set(`Xem ${row.id}`) }],
    },
  };

  async process(rows: Order[]): Promise<void> {
    // Replace this demonstration with the application's request and outcome handling.
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    this.message.set(`Đã xử lý: ${rows.map(row => row.id).join(', ')}`);
  }
}
```

The bare attribute `sdTableRowMobileDef` is supported, including under `strictTemplates`, but its `item` type defaults to **`any`**: Angular cannot infer a projected directive's generic from the parent's `[option]`. Bind `[sdTableRowMobileDef]="tableOption"` as above to infer `Order` and reject nonexistent properties at compilation. The binding is a type witness, not a separate source of rows. Always pass the owning table's option. Other context properties retain their declared types in both forms.

### Template context

The exported `SdTableRowMobileDefContext<T>` contains:

| Property | Type | Meaning |
| --- | --- | --- |
| `item` | `T` | Business data, not `SdTableItem<T>`. |
| `index` | `number` | Zero-based position among rendered data rows in this page, excluding group headers and expanded-detail blocks. Visible tree children count as data rows. |
| `selected` | `boolean` | Current table selection. |
| `selectionDisabled` | `boolean` | Whether this row can currently be selected. A selected row remains removable even if its eligibility later changes. |
| `autoId` | `string \| undefined` | Table auto-id prefix plus `-mobile-row-<rowId>`; also assigned to the card's `data-autoid`. Absent when table `autoId` is absent. |

Core renders the card frame, selector, command trigger, tree/group/expand controls and action bar. The 14px checkbox/radio sits on a 24px circular surface centered over the top-right border, with a 40px hit area. The row-command trigger sits at the bottom-right. No separate selector row is needed. A projected `sdTableCommandHeaderDef` is centered above the cards; otherwise there is no header banner. Do not duplicate selection state or add a wrapping button. Links, buttons, inputs, labels, selects, contenteditable controls and nested tables work independently, without consumer `stopPropagation()`. Enter/Space on a focused card matches body activation; pointer scrolling, drag handles and text selection do not activate it.

`mobile.rowLabel(row)` supplies the command title and accessible selector/command labels. Empty/nullish labels fall back to a primitive `rowKey` value and then a one-based row ordinal across pages. Internal generated identities and guessed business fields are never used as visible labels.

### Browsing, selection and actions

With commands configured and no selection, tapping non-interactive card content or `⋯` opens that row's commands without selecting it. Ticking a selector closes row commands and enters selection mode, even for one selected row. Body taps then toggle selection; `⋯` is hidden. Clearing the final row returns to browsing without reopening an old command.

Without row commands, body taps select immediately. `selector.single` uses radio controls and replaces the old selection; selecting the active radio again leaves it selected. Use **Clear selection** to clear it. A hidden selector has no selection control or body-selection behavior. `defaultSelected` is reflected on the first mobile render.

Mobile cards do not display **Select this page**. The shared selection API and desktop page checkbox retain their existing scope and eligibility: current-page group members and visible, loaded tree rows only. Empty eligibility remains unchecked, and page deselection retains off-page rows. **Clear selection** (`table.onClearSelection()`) clears the complete selection, including preserved rows and cached tree children.

For `preserveSelection`, provide a stable `rowKey` with server data. The summary reports the total selected count and the count on this page when they differ. Callbacks receive the complete selection, including preserved rows. Bulk eligibility is intersected over all selected rows; a bulk callback never silently receives a filtered subset. Incompatible grouped actions do not become compatible merely because they share a parent title. A row with disabled selection can still expose eligible row commands.

Row commands open directly in `SdModal` with `view="bottom-sheet"`, titled **Row actions: <row label>**. The sheet lists commands in declaration order, with group headings, disabled states, icons, semantic colors and supported HTML content. Closing it leaves selection unchanged and returns focus to the row trigger.

Only selection uses a contained `SdQuickAction`, with 16px horizontal padding. A highlighted selected count and a labelled clear icon stay centered in separate side columns; flat actions wrap into evenly aligned columns between them. **More** opens a titled `SdModal` bottom sheet for grouped or HTML actions and subsequent actions, preserving declaration order. `selector.message` is omitted on mobile. The full total/on-page summary remains available through the bar's accessible name and a polite live region. The count and clear route remain available without bulk actions. Closing the sheet preserves selection.

Card lists keep equal 20px side gutters and symmetric content padding with or without selection controls. The corner checkbox does not reduce the content width. Row commands share a separate action row with the expand control, so they do not overlap the consumer's content.

The footer has one **Tools** button and the shared paginator. **Table tools** opens a separate Core bottom sheet containing enabled reload, export, filter, sort and configuration controls. Filter/configuration close the sheet before opening their existing drawer/dialog. Sort choices use the same `MatSort` state and cycle ascending, descending and clear.

Changing data, filtering, paging or calling `table.detectChanges()` after an in-place edit invalidates row commands. Async `hidden` results are tied to their row and render revision. Renderer changes, owner destruction and enclosing Core modal/drawer closure dismiss owned sheets. Tables keep independent state even when Material replaces a previously open sheet.

### Async results belong to the consumer

Row callbacks still receive `row`; bulk callbacks receive `selectedRows`. Existing `void` callbacks remain supported. If a callback returns a Promise, duplicate actions are disabled until it settles; rejection shows an error and retains selection. Core does not interpret success or clear selection automatically, even after a resolved Promise.

After successful processing, update your business data and `await table.reload()`; use `table.detectChanges()` if only in-place display/eligibility values changed. Call `table.onClearSelection()` only when the application intends to clear everything. For partial success with preservation, remove only confirmed successes using the existing selection API before reloading:

```ts
const succeededIds = new Set(result.succeededIds); // authoritative server outcome
for (const row of table.selectedTableItems()) {
  if (succeededIds.has(row.data.id)) {
    row.meta.selector!.isSelected = false;
    table.onSelect(row); // updates the preserved map, including rows outside this page
  }
}
await table.reload(); // failed rows remain selected when preserveSelection is enabled
```

The consumer owns error reporting, retries and `defaultSelected` predicates; update a default predicate too if it would otherwise reselect a processed row on a new load.

### Desktop-to-mobile mapping

| Feature / slot | Card view |
| --- | --- |
| Columns, `sdTableCellDef`, `sdTableTitleDef` | Columns continue to define filters, sort, configuration and export. The mobile row template supplies the body instead of desktop cell templates. Custom titles remain in footer/configuration; the sort menu uses column title text. |
| `sdTableFilterDef`, inline filters | Existing mobile filter drawer, sharing the same filter register and operators. External filters also move into this drawer; there is no separate filter form above the card list. |
| Sort | The Table tools bottom sheet cycles ascending → descending → clear through the same `MatSort` and request fields. Only configured sortable leaf columns are listed. |
| Pagination, reload, configuration, export | Paginator and one Tools button below the list; enabled tools live in the titled Core sheet. Export uses business rows and configured columns, never card DOM. |
| `sdTableCommandHeaderDef` | Centered above the card list. |
| `sdTableFooterDef` | Labelled summary below cards; the original `{ items, column }` scope is unchanged (`items` are current-page `SdTableItem` wrappers). |
| `sdTableExpandDef` | Dedicated Details button and inline detail block; keeps its existing `{ item: SdTableItem }` context, `always`, `multiple`, disabled and async behavior. |
| `sdTableGroupDef` | Separate group header using the existing group context and selection/expand controls. |
| Tree | Indentation, level labels and separate expand/collapse controls; lazy children are fetched only on expansion. |
| Reorder | Dedicated CDK drag handle; respects existing disabled/group/tree scope and callbacks. |
| `[sdTableTop]` | Remains above the table content. |

The action bar keeps a layout footprint inside the owning scroll container, so the final card and paginator remain reachable. It follows Core theme tokens and safe-area insets. Applications with their own bottom navigation may set `--sd-table-mobile-bottom-offset` on the table to the occupied height. Template authors should allow wrapping and provide their own null-value presentation, as in the example.

### Selection toolbar layout

The selected-state icon and the mobile selection count use the success color.

The desktop selection toolbar reserves space inside its table, immediately above the pagination footer. It does not float over the page. A single message shows the selection count; a custom `selector.message` is preserved verbatim, without another count badge.

The first two permitted actions remain visible as `sd-button size="sm"`; additional actions appear under More. Existing child groups keep their labels and allowed children. The action resolver and callbacks still use the complete selection. The clear-selection control has an accessible name, and action autoIds retain their filtered action indexes. The toolbar wraps on narrow screens. Existing row-command sizing is unchanged.


### Action Popover dùng chung

Desktop command children, selection actions (children/overflow) và menu export Excel/CSV dùng capability Action Popover của SdButton. Consumer giữ nguyên option/model: icon ánh xạ prefixIcon, title thành label, color/fontSet/tooltip và callback dùng dữ liệu row/selection hiện tại. Command hidden/disabled và selection eligibility vẫn do Table xử lý; primitive không giữ row context. Popup riêng sd-table-action-menu đã được bỏ.

Mobile action modal vẫn giữ busy/error/closeBeforeRun và responsive behavior hiện có. Menu cấu hình filter không thuộc thay đổi này. Vùng thông báo/action khi chọn dòng vẫn có padding ngang 8px.

Command có menu con dùng icon-only trigger không kèm chevron, giữ footprint 24px. Action overflow dùng suffixIcon more_horiz thay chevron; action có label và không có suffixIcon vẫn dùng chevron mặc định của sd-button.
