# sd-table · Lọc bằng query bar (phương án A)

Nguồn chính của đợt này. Hình minh hoạ và bản bấm thử: `Table Query Bar Spec.dc.html`. Phân tích ba phương án: `Query Bar Filter Mode Proposal.dc.html`. Đã chốt A: query bar chỉ là lớp hiển thị, state lọc giữ nguyên.

Đọc trên `sdcorejs/sdcorejs-angular@main` (166f16c), `versions/v19/projects/sdcorejs-angular/components/table/` và `components/query-bar/`.

## Tóm tắt

- `filter.mode: 'query-bar'` gộp quick search, external filter và filter dưới cột vào một `sd-query-bar` ở đầu bảng. Mặc định vẫn là `'default'`.
- State lọc vẫn là `TableFilterValue` trong `SdTableFilterService`. Một adapter thuần chuyển hai chiều giữa `TableFilterValue` và `SdQuery` của thanh.
- `items()`, `filterReq`, `pagingReq`, cache, `required`, `default`, `manualFilter`, `onFilter`, các callback `onChange` giữ nguyên. Tiêu chí nghiệm thu chính: cùng một thao tác lọc, `pagingReq` ở hai mode giống hệt nhau.
- Chip ghim (không xoá được) cho `quickSearch.filters` và external đang hiện inline hoặc `required`. Các field còn lại thêm qua nút +, chia nhóm "Bộ lọc" và "Cột".
- Cột lọc được có icon lọc ở header; bấm mở chip của field đó trên thanh.
- Mobile giữ nguyên giao diện mode default.
- Không có OR, mỗi field tối đa một chip, toán tử chỉ gồm những gì raw record biểu diễn được.

## Hiện trạng

| Chỗ | Hiện nay | Mode query-bar |
| --- | --- | --- |
| `table.component.html:48–56` | `<external-filter>` (sd-section, `mb-16`) ngoài `.sd-table-surface` | không render |
| `table.component.html:163–170` | `<sd-table-quick-search>` đầu `.sd-table-surface` | thay bằng `<sd-query-bar>` |
| `table.component.html:29–33`, `70–82`, `463–465`, `589–600` | `_showInlineFilter`, template `#inlineColumnFilter`, filter trong `th`, hàng `c-filter-header` | không render; header có icon lọc (mục 8) |
| `table.component.html:836–846`, `898–906` | nút mở và drawer `mobile-filter` | giữ nguyên (mục 10) |
| `table.component.ts:352` | `externalFilter = viewChild(ExternalFilterComponent)`; `form.invalid` dùng cho `externalFilterValid` (ts:1440) | không có component; tính từ giá trị (mục 6) |
| `table.component.ts:679–688` | `filterRegister`, `quickSearchValue`, `columnFilter` (sửa tại chỗ), `columnOperator` | giữ nguyên, adapter ghi vào |
| `table.component.ts:1875`, `1885`, `1891`, `2188`, `2240` | `onFilterChange`, `onQuickSearchChange`, `onFilterCommit`, `clearFilter`, `onOperatorChange` | dùng lại, không thêm nhánh đọc mới |
| `table-filter.model.ts` `SdConvertToPagingReq` | dựng `pagingReq.filters` từ raw record | không đổi |
| `query-bar.component.ts` | `filters` model, apply chỉ khi bấm Tìm kiếm/Enter; `clearAll()` xoá hết; chip nào cũng có × | thêm Q1–Q12 (mục 12), standalone không đổi hành vi |

## 1. Bật mode

- `option.filter.mode` > `SD_TABLE_CONFIGURATION.filter.mode` > `'default'`. Gộp như `manualFilter` ở ts:1224–1226.
- `effectiveMode = isMobile() ? 'default' : mode`. Đổi viewport thì đổi mode hiển thị; state lọc không đổi nên không mất giá trị.
- `filter.disabled`: như hiện nay, không render vùng lọc nào.
- Các option chỉ có nghĩa ở mode default và bị bỏ qua ở mode query-bar: `externalFilterPerRow`, `collapsible`, `externalFilterCollapsed`, `hideExternalFilterToolbar`. Ghi rõ trong `sd-table.md`.
- `hideInlineFilter: true` → không đưa cột vào thanh. `'auto'` → vẫn đưa vào (cột chỉ nằm trong nút +, không tốn chỗ).

## 2. Bố cục (desktop)

```
.sd-table-surface.sd-table-surface--query-bar
  sd-query-bar[appearance=flush]
    [ô tìm] │ [chip ghim…] [chip thêm…] [+]          [Xoá lọc (n)] [Tìm kiếm]* [slot cuối]
  (dòng nhắc required, nếu có)
  .c-container  (bảng, như hiện nay)
```
\* chỉ khi `manualFilter`.

| Thông số | Giá trị |
| --- | --- |
| Đệm thanh | `8px 12px`; chip xuống dòng khi hết chỗ, cụm bên phải đứng yên (đã có trong `.c-query-bar__main`) |
| Viền dưới | dùng lại viền đang ngăn quick search với bảng (`.sd-table-surface--quick-search`) |
| Chip | `density: 'compact'`, cao 28px, như SCSS hiện có của query-bar |
| Ô tìm | rộng 220px, chỉ có khi `quickSearch.containFields` hoặc `equalFields` khác rỗng; placeholder = `quickSearch.placeholder` ?? `core.component.query-bar.search-placeholder` |
| Slot cuối | nội dung `sdTableQuickSearchRightDef`, sau nút Xoá lọc / Tìm kiếm |
| Cao vùng lọc | 44px khi chip vừa một hàng; mỗi hàng chip thêm 34px |
| `[sdTableTop]` | giữ vị trí hiện tại (trước `.sd-table-surface`) |

`appearance: 'flush'` (Q6) bỏ viền, bo góc, bóng và nền riêng của thanh để nằm liền trong card bảng.

## 3. Danh sách field (`sdTableQueryFields`)

Hàm thuần, file mới `services/table-filter/table-query-bar.util.ts`, có spec riêng.

```ts
sdTableQueryFields(args: {
  columns: SdTableColumnAnyRow[];          // cột lá đang hiển thị, sau khi đã gộp SD_TABLE_CONFIGURATION.filter.operator
  externalFilters?: SdTableExternalFilter[];
  quickSearch?: SdTableOptionQuickSearch;
  inlineExternal: Record<string, boolean>; // TableFilterConfiguration
  queryBar?: SdTableOptionFilterQueryBar;
  hideColumns: boolean;                    // hideInlineFilter === true
  labels: { filters: string; columns: string };
}): { fields: SdQueryField[]; sources: Map<string, SdTableQuerySource>; excluded: { field: string; reason: string }[] }
```

### Khoá
- `SdQueryField.key` = `` `${source}:${field}` ``, `source` ∈ `quick` | `external` | `column`. Ví dụ `external:createdAt`, `column:customer.name`.
- Khoá tổng hợp chỉ dùng trong thanh; không lộ ra `filterReq`, `pagingReq` hay cache.
- `sources` map khoá về `{ source, field, column?, external?, quick? }` để adapter tra ngược.

### Thứ tự
1. `quickSearch.filters` (theo khai báo).
2. `externalFilters` (theo khai báo).
3. Cột lá đang hiển thị, theo thứ tự cột; cột `children` trải phẳng.

### Nhóm (Q4)
- `quick` và `external` → `group: labels.filters` ("Bộ lọc").
- `column` → `group: labels.columns` ("Cột").
- Chỉ có một nhóm thì không hiện tiêu đề nhóm.

### Ghim (Q1)
- Mặc định ghim: mọi `quickSearch.filters` không `hidden`; external có `inlineExternal[field]` (khởi tạo từ `defaultShowing`, người dùng đổi được ở mode default) hoặc `required`.
- `queryBar.pinned` (mảng field) có thì thay hẳn danh sách mặc định. Field `required` luôn ghim dù không có trong `pinned`.
- Cột không được ghim mặc định; ghim được qua `queryBar.pinned`.

### Trùng field
- Cùng `field` ở external và cột: chỉ giữ `external:<field>`. Cột đó không vào thanh; icon lọc ở header cột ấy trỏ tới chip external.
- Adapter luôn ghi `columnFilter[field] = null` cho cột bị che, để không có điều kiện ẩn từ cache cũ.
- Cùng `field` ở quick filter và external: giữ cả hai (hai khoá khác nhau); hiện trạng đã cho phép.

### Không vào thanh
Ghi vào `excluded`, bảng `console.warn` một lần mỗi instance khi `isDevMode()`:
- external `type: 'custom'`, `sdTableFilterDef` (`filterDefs`), cột có `filter.filterDef`;
- cột `type: 'time'`, cột `hidden`, cột có `filter.disabled`;
- external `date` / `datetime` không có `defaultOperator` là `GREATER_OR_EQUAL` hoặc `LESS_OR_EQUAL` (mục 14 · 4);
- field nằm trong `queryBar.exclude`;
- quick filter `hidden` (giá trị và `required` vẫn có hiệu lực, như hiện nay).

Giá trị đang có của field bị loại vẫn nằm trong raw record và vẫn gửi đi; màn cần các field này thì giữ mode default.

## 4. Ánh xạ theo kiểu

"Khoá" = `operators` một phần tử, không có chọn toán tử.

| Nguồn | `SdQueryField` | Toán tử | `Filter.data` ↔ raw |
| --- | --- | --- | --- |
| `quickSearch.term` | (ô tìm, `search`) | OR theo `containFields`/`equalFields` như cũ | `string` ↔ `quickSearch.term` |
| `quickSearch.filters[]` values / lazy-values | cùng type; lazy: `option.items` → `option.search` | `selection` có `MULTIPLE` → `IN`; còn lại `defaultOperator ?? EQUAL`. Khoá | mảng / giá trị ↔ `quickSearch.filters[f]` |
| external `string` | `string` | `defaultOperator ?? CONTAIN`. Khoá | ↔ `externalFilter[f]` (kể cả quy tắc `EQUAL` + dấu phẩy → `IN` của converter) |
| external `number` | `number` | `defaultOperator ?? EQUAL`. Khoá | ↔ `externalFilter[f]` |
| external `boolean` | `boolean`; `displayOnTrue/False` → `trueLabel/falseLabel` | `EQUAL`. Khoá | ↔ `externalFilter[f]` |
| external `date` / `datetime` | cùng type; `minDate/maxDate` → `min/max` | `defaultOperator` (`GREATER_OR_EQUAL` / `LESS_OR_EQUAL`). Khoá | `Date \| string` ↔ `externalFilter[f]` |
| external `daterange` | `date` (`datetime` nếu `enableTime`) | `BETWEEN`. Khoá. Bỏ trống một đầu được | `{from, to}` ↔ `externalFilter[f]` |
| external `values` / `lazy-values` | cùng type | `selection` có `MULTIPLE` → `IN`; còn lại `defaultOperator ?? EQUAL`. Khoá | ↔ `externalFilter[f]` |
| cột `string` / `number` | cùng type | `operator.enable` → `operator.list` bỏ `BETWEEN`, `IN`, `NOT_IN`; tắt → khoá `operator.default` ?? `CONTAIN` (string) / `EQUAL` (number) | ↔ `columnFilter[f]`, `columnOperator[f]` |
| cột `number` + `filter.type: 'split-number'` | `number` | `BETWEEN`. Khoá. Bỏ trống một đầu được | `{from, to}` ↔ `columnFilter[f]` |
| cột `boolean` | `boolean`; `option.displayOnTrue/False` | `EQUAL`. Khoá | ↔ `columnFilter[f]` |
| cột `values` / `lazy-values` | cùng type; lazy: `option.items` → `option.search`, `option.views` dùng cho Q12 | `selection: 'MULTIPLE'` → `IN` (+ `NULL`, `NOT_NULL` nếu có trong `list`); còn lại `list` ∩ {`EQUAL`, `NOT_EQUAL`, `NULL`, `NOT_NULL`}, rỗng thì khoá `EQUAL` | ↔ `columnFilter[f]`, `columnOperator[f]` |
| cột `date` / `datetime`, `filter.type: 'date'` | cùng type | `EQUAL` (cả ngày). Khoá | `Date` ↔ `columnFilter[f]` |
| cột `date` / `datetime`, còn lại | cùng type | `BETWEEN`. Khoá. Bỏ trống một đầu được | `{from, to}` ↔ `columnFilter[f]` |

- `NULL` / `NOT_NULL`: `data: null` ↔ `columnFilter[f] = null`, `columnOperator[f] = op`. Converter đã xử lý (`isNoDataColumnOperator`).
- Chỉ ghi `columnOperator[f]` khi cột bật `operator.enable`, như column-filter hiện nay.
- Adapter không đổi kiểu giá trị ngày. Nếu control trong query-bar phát kiểu khác control cũ (string so với `Date`), chuẩn hoá về kiểu control cũ phát; spec parity (mục 15 · 1) bắt lỗi này.
- Bảng này là nguồn cho `sdTableQueryFields`; trường hợp nào không có trong bảng thì loại (mục 3).

## 5. Adapter hai chiều

Cùng file `table-query-bar.util.ts`, hàm thuần:

```ts
tableFilterToQuery(value: TableFilterValue, ctx: QueryCtx, prev?: Filter[]): SdQuery
queryToTableFilter(query: SdQuery, ctx: QueryCtx, current: TableFilterValue): {
  patch: Pick<TableFilterValue, 'quickSearch' | 'externalFilter' | 'columnFilter' | 'columnOperator'>;
  changed: { key: string; value: unknown; operator?: Operator }[];
}
```

### Raw → thanh
- Chạy mỗi khi `filterRegister.value.observer` phát.
- Chip có trong `SdQuery.filters`: mọi field ghim (kể cả rỗng), cộng field không ghim có giá trị theo `hasFilterValue` / `hasQuickSearchValue` (daterange/split: `from` hoặc `to`), hoặc có toán tử `NULL` / `NOT_NULL`.
- Thứ tự chip: ghim theo thứ tự mục 3; sau đó chip thêm theo thứ tự người dùng thêm trong phiên (`#chipOrder`); chip khôi phục từ cache xếp theo thứ tự khai báo.
- **Giữ identity**: filter nào có `operator` và `data` bằng sâu với lần trước thì trả lại đúng object cũ trong `prev`. `sd-query-bar` track chip theo identity (`rowId`), object mới mỗi lần sẽ huỷ và dựng lại chip, mất focus.
- Không set lại `filters` / `search` của thanh nếu kết quả bằng với giá trị đang có (tránh vòng lặp).

### Thanh → raw
- Chạy khi thanh phát `apply` (Q3). Không ghi raw khi chip chỉ đang sửa nháp.
- Gộp một lần: `filterRegister.value.set(patch)`. Đường reload, cache, `filtered`, `#syncColumnFilterInPlace` đi như cũ.
- Field có trong ctx nhưng không có chip → ghi rỗng: `null` (cột, external, quick filter), `{ from: null, to: null }` (daterange, cột date không phải `filter.type: 'date'`, split-number). `columnOperator[f]` về `operator.default` nếu cột bật operator.
- Cột bị che (mục 3) luôn ghi `null`.
- Field bị loại (mục 3) không đụng tới.
- Với mỗi mục trong `changed`, gọi callback như control cũ, sau `value.set`:
  - cột: `column.filter.onChange(value, column, columnFilter)`; đổi toán tử thì `onOperatorChange(column, op)` (ts:2240, đã gọi `filter.operatorChange`);
  - external: `externalFilter.onChange(value)`;
  - quick filter: `item.onChange(value)`.
- Không gọi callback cho giá trị không đổi, cho khởi tạo, hay khi raw đổi từ ngoài vào.

## 6. Áp dụng, bắt buộc, manualFilter

| | `manualFilter` tắt (mặc định) | `manualFilter` bật |
| --- | --- | --- |
| Thanh | `applyOn: 'commit'` | `applyOn: 'search'` (hành vi hiện tại của query-bar) |
| Đóng popover / commit inline | áp dụng nếu giá trị hoặc toán tử đổi | chỉ đổi nháp |
| Xoá chip (×) | áp dụng | chỉ đổi nháp |
| Enter ở ô tìm | áp dụng | áp dụng |
| Nút Tìm kiếm | ẩn | hiện; tắt khi có chip `required` rỗng |

- Chip thêm mà đóng popover khi vẫn rỗng: bỏ chip, không áp dụng (giá trị không đổi).
- `required` (Q2): chip `required` rỗng có viền đỏ, `aria-invalid="true"`, và dòng nhắc dưới thanh `core.component.query-bar.required` với `{label}`; nhiều field thì nối nhãn bằng dấu phẩy.
- Mode query-bar không có `ExternalFilterComponent`, nên `externalFilter()?.form?.invalid` (ts:1440) luôn là hợp lệ. Thay bằng kiểm tra giá trị: mọi external `required` có giá trị theo `#filtered`. Dùng cho `onFilter(..., { externalFilterValid })` và cho cổng chặn đọc ở ts:1429–1452 (mục 14 · 2).
- `requireFiltered` (ts:1418) giữ công thức. Bảng hiện trạng thái "cần chọn bộ lọc" như hiện nay.
- `quickSearchValid` giữ nguyên.

## 7. Xoá lọc

- Nút "Xoá lọc" của thanh gọi `onClearAll` (Q7) → `clearFilter()` của bảng (ts:2188): `filterRegister.value.remove()` về giá trị default, gọi `filter.onClearFilter`, đọc lại một lần.
- Chip ghim ở lại, nhận giá trị default. Chip thêm biến mất trừ khi default của field có giá trị.
- Bật khi raw khác default (so hash giá trị `#defaultValue` với giá trị hiện tại, bỏ `notReload`/`filtered`). Tắt thì nhãn không kèm số.
- Số trong nhãn (`core.component.query-bar.clear-all`, `{count}`) = số chip đang có giá trị (`isFilterActive`), không phải số chip.
- Từ khoá trong ô tìm cũng về default (`''`), như `initialQuickSearchValue`.

## 8. Icon lọc ở header cột

- Có với mỗi cột lá có field trong thanh, hoặc bị external che (trỏ tới chip external).
- Phần tử: `button.sd-table-filter-trigger`, 20 × 20px, bo `var(--sd-radius-4, 4px)`, icon `filter_alt` 15px. Nằm cạnh tiêu đề trong `.c-header-title`: sau tiêu đề ở cột trái, trước tiêu đề ở cột `align: 'right'`, để mép tiêu đề không dịch.
- Không lọc: `opacity: 0`, vẫn trong DOM và nhận focus; hiện khi `th:hover`, `th:focus-within`, hoặc `pointer: coarse`. Màu `--sd-text-secondary`, nền hover `--sd-table-row-hover` (hoặc token hover tương đương có sẵn).
- Đang lọc (giá trị **đã áp dụng** có hiệu lực, không phải nháp): luôn hiện, màu `--sd-primary`.
- `aria-label`: `core.component.table.filter-by` / `core.component.table.filtering-by` với `{title}`; `aria-haspopup="dialog"`.
- Bấm: `stopPropagation` (không sort, không bắt đầu resize), gọi `queryBar.openField(key)` (Q5). Chưa có chip thì thanh tạo chip và mở popover; có rồi thì mở popover của chip đó.
- Header nhóm (`multipleHeader`): icon nằm ở ô header của cột lá (`secondColumns`, hoặc `firstColumns` không phải `children`).
- Không có hàng `c-filter-header` trong mode query-bar.
- Focus sau khi popover đóng: mục 14 · 3.

## 9. Cache và khởi tạo

- `register()` không đổi; `#resolveKey` không đổi (không đưa `mode` vào hash) nên đổi mode giữ được giá trị đã cache.
- Lần đầu render: `tableFilterToQuery(filterRegister.value.get())`. Thanh hiện chip từ cache trước lần đọc đầu.
- `quickSearch.filters[].default` dạng signal: theo `initialQuickSearchValue` như cũ; thanh cập nhật qua observer.
- `inlineExternal` đổi (người dùng đổi ở mode default) → ghim tính lại ở lần render sau.

## 10. Mobile

- `isMobile()` → mode default, như mục 1. Quick search, nút mở `mobile-filter` và drawer giữ nguyên; drawer đọc cùng `filterRegister` nên thấy đúng giá trị đã lọc trên desktop.
- Hàng chip cho mobile để đợt sau.

## 11. Loading và a11y

- Thanh không bao giờ bị mờ hay chặn trong `loadingView` `skeleton` / `refresh` (theo `table-loading.md` · mục 4). Bấm chip trong lúc đang tải: áp dụng như bình thường, request cũ bị bỏ như hiện nay.
- Vùng live `.sd-table-live` không đổi.
- Thanh có `role="toolbar"` hoặc `role="search"` (giữ role query-bar đang dùng), `aria-label` = `core.component.table.filter`.
- Chip ghim: không có nút xoá; Delete/Backspace trên chip ghim không làm gì.
- Dòng nhắc required: `id` riêng, chip `required` rỗng có `aria-describedby` trỏ tới nó.
- Tab đi qua: ô tìm → chip theo thứ tự → + → Xoá lọc → Tìm kiếm → slot cuối.

## 12. Thay đổi ở `sd-query-bar` (cộng thêm)

Không đổi hành vi khi không dùng option mới. Mỗi mục có spec riêng trong `query-bar.component.spec.ts` hoặc spec của sub-component.

| # | Thay đổi | Chi tiết |
| --- | --- | --- |
| Q1 | `field.pinned?: boolean` | Chip luôn có, không có ×, `removeFilter` bỏ qua; rỗng hiện `core.component.query-bar.all`; không nằm trong field picker. Host bảo đảm `filters` luôn có một mục cho field ghim. Áp cho cả popover và inline. |
| Q2 | `field.required?: boolean` | Chip rỗng: viền và chữ màu lỗi, `aria-invalid`; `canSearch` false khi có required rỗng. Dòng nhắc do host render (bảng), thanh chỉ phát trạng thái qua `invalidFields()` (signal). |
| Q3 | `applyOn?: 'search' \| 'commit'` | Mặc định `'search'`. `'commit'`: gọi `triggerApply()` sau commit popover (khi giá trị hoặc toán tử đổi), sau `removeFilter`, sau commit inline, khi Enter ở ô tìm; ẩn nút Tìm kiếm. |
| Q4 | `field.group?: string` | Field picker chia nhóm theo thứ tự xuất hiện; một nhóm thì không hiện tiêu đề. Hơn 8 field: ô lọc đầu picker (`core.component.query-bar.find-field`), lọc theo nhãn, không dấu. |
| Q5 | `openField(key: string)` | Public. Có chip → mở popover của nó (inline: focus chip). Không có → `addFilter(field)` (đã tự mở popover). |
| Q6 | `appearance?: 'default' \| 'flush'` | `'flush'`: bỏ viền, bo, bóng, nền của `.c-query-bar`. |
| Q7 | `onClearAll?: () => void` | Có thì nút Xoá lọc gọi nó thay vì `clearAll()`. Số trong nhãn đổi thành số chip đang có giá trị (áp cho mọi trường hợp; hiện là `filters.length`). Thêm `clearDisabled?: boolean` để host tắt nút. |
| Q8 | `searchPlaceholder?: string`, slot `[sdQueryBarEnd]` | Placeholder ghi đè i18n. `<ng-content select="[sdQueryBarEnd]">` sau actions-bar. |
| Q9 | Toán tử ngoài bộ mặc định | Kiểm tra và sửa nếu cần ở popover, inline chip, build chip: `values`/`lazy-values` với `EQUAL`/`NOT_EQUAL` (chọn một); `date`/`datetime` với `GREATER_OR_EQUAL`/`LESS_OR_EQUAL` (một giá trị); `BETWEEN` bỏ trống một đầu được giữ nguyên, không bị coi là rỗng. |
| Q10 | `showOperatorOnChip: boolean \| 'auto'` | `'auto'`: hiện ký hiệu toán tử khi field có hơn một toán tử, hoặc toán tử khác `SD_QUERY_DEFAULT_OPERATOR_BY_TYPE[type]`. Bảng truyền `'auto'`. |
| Q11 | Chữ trên chip | Ngày theo định dạng ngày của app (`SdDateTimeService` / pipe đang dùng ở sd-date), không in chuỗi ISO. `BETWEEN` thiếu một đầu: `range.from` / `range.to`. Khoảng cùng năm rút gọn được (`01/10 – 31/10/2026`). |
| Q12 | Nhãn lazy-values khi khôi phục | Chip `lazy-values` có giá trị từ cache: gọi `option.search({ type: 'VALUE', value })` một lần để lấy nhãn; chưa có thì hiện giá trị thô. Field có `option.views` (cột) thì dùng `views(values)`. |

## 13. API sd-table

```ts
// services/table-filter/table-filter.model.ts
export interface SdTableOptionFilterQueryBar {
  /** Cách sửa chip. @defaultValue 'popover' */
  editor?: 'popover' | 'inline';
  /** Thay danh sách chip ghim mặc định. Phần tử là `field` của quickSearch.filters / externalFilters / columns. */
  pinned?: string[];
  /** Field không đưa vào thanh; giá trị đang có vẫn gửi đi. */
  exclude?: string[];
}

export interface SdTableOptionFilter<T = unknown> {
  // …giữ nguyên các field hiện có
  /** Giao diện lọc. @defaultValue 'default' */
  mode?: 'default' | 'query-bar';
  /** Chỉ dùng khi mode là 'query-bar'. */
  queryBar?: SdTableOptionFilterQueryBar;
}
```

- `ISdTableConfiguration.filter.mode?` và `ISdTableConfiguration.filter.queryBar?`; ưu tiên option > configuration > mặc định, `queryBar` gộp theo từng field.
- Host attribute mới: `[attr.data-filter-mode]` = `default` | `query-bar` (theo `effectiveMode`).
- `data-autoid`: thanh nhận `autoId` = `` `${autoId}-query-bar` ``; icon header `` `${autoId}-filter-trigger-${field}` ``.
- Không export adapter ra public API trong đợt này.

## 14. Cần duyệt trong kế hoạch

1. **Đồng bộ thanh và raw**: thanh giữ nháp trong `filters` model; đường raw → thanh chạy qua observer. Cách chặn vòng lặp (apply → `value.set` → observer → set filters → …) và cách giữ chip đang mở popover khi observer phát giữa chừng (ví dụ signal default của quick filter đổi).
2. **Cổng chặn đọc khi external `required` rỗng** không còn `ExternalFilterComponent.form`: chỗ nào trong ts:1400–1460 và `#loadCompleted` (ts:1007) đang dựa vào form, sửa thế nào mà mode default không đổi.
3. **Focus sau popover mở từ icon header**: mat-menu trả focus về trigger (chip). Trả về icon header (đề xuất) hay để ở chip.
4. **External `date`/`datetime` thiếu `defaultOperator`**: ở mode default, giá trị một ngày không tạo điều kiện nào. Loại khỏi thanh kèm cảnh báo (đề xuất), hay coi là `BETWEEN` cả ngày (khác payload mode default).
5. **Cột ẩn qua config**: field theo danh sách cột đang hiển thị (đề xuất, giống hàng filter) hay mọi cột không `hidden`; chip của cột vừa bị ẩn mà còn giá trị thì làm gì (đối chiếu hành vi hiện tại của `columnFilter` với cột ẩn).
6. **Thứ tự chip thêm**: chỉ trong bộ nhớ (đề xuất; reload về thứ tự khai báo) hay lưu vào `TableFilterConfiguration`.

## 15. Spec cần viết

`table-query-bar.util.spec.ts` (hàm thuần):
1. **Parity**: ma trận nguồn × type × toán tử × giá trị (rỗng, một giá trị, mảng, khoảng đủ, khoảng thiếu một đầu, `NULL`). Mỗi ô: `SdConvertToPagingReq(raw từ queryToTableFilter(query))` bằng `SdConvertToPagingReq(raw đặt tay như control cũ)`. Chạy cả `dateTime` mặc định và một time zone khác `'local'`.
2. `sdTableQueryFields`: thứ tự, khoá, nhóm, ghim mặc định, `queryBar.pinned` thay danh sách, `required` luôn ghim, trùng field, mọi trường hợp loại có `reason`.
3. Roundtrip `tableFilterToQuery` ∘ `queryToTableFilter` giữ nguyên raw; filter không đổi giữ đúng object.
4. Cột bị che luôn ra `null`; `columnOperator` chỉ ghi khi `operator.enable`.

`table.component.query-bar.spec.ts`:
5. Mode default (không đặt `mode`) render như cũ; mọi spec hiện có xanh không sửa.
6. Mode query-bar: không có `external-filter`, `sd-table-quick-search`, `thead column-filter`, `.c-filter-header`; có `sd-query-bar`; `data-filter-mode="query-bar"`.
7. `applyOn: 'commit'`: đóng popover có đổi → đúng một lần `items()`; không đổi → không gọi; xoá chip → một lần; Enter ô tìm → một lần.
8. `manualFilter`: sửa chip không gọi `items()`; Tìm kiếm → một lần; payload bằng mode default.
9. `required` rỗng: không gọi `items()`, trạng thái "cần chọn bộ lọc", chip `aria-invalid`, dòng nhắc có nhãn; `onFilter` nhận `externalFilterValid: false`.
10. Xoá lọc: về default, `onClearFilter` được gọi, một lần `items()`; tắt khi raw bằng default.
11. Callback: `column.filter.onChange`, `externalFilter.onChange`, `quickSearch.filters[].onChange`, `operatorChange` nhận đúng tham số như mode default; không gọi khi khởi tạo.
12. Cache: tạo lại bảng cùng `filter.key` + `cacheable` → chip và giá trị khôi phục; đổi mode giữa hai lần vẫn giữ giá trị.
13. Icon header: ẩn/hiện/đang lọc; bấm không sort; mở đúng chip (kể cả cột bị external che); header nhóm.
14. Mobile (`isMobile`): render như mode default.
15. Loading `refresh`: `elementFromPoint` trên chip trả về chip (không bị phủ).
16. Lazy-values khôi phục từ cache hiện nhãn (Q12).
17. Dev warning cho field bị loại: gọi một lần mỗi instance.

## 16. Giữ nguyên

- `TableFilterValue`, `TableFilterRegister`, `SdTableFilterService` (trừ việc bảng đọc thêm `#defaultValue` qua API có sẵn cho mục 7 nếu cần, không đổi format cache).
- `SdConvertToPagingReq`, `quickSearchConditions`, `matchesQuickSearch`, lọc local.
- `SdTableFilterRequest`, `PagingReq`, `onFilter`, `items()`.
- `ExternalFilterComponent`, `ColumnFilterComponent`, `TableQuickSearchComponent`, `mobile-filter`: không sửa (chỉ không render ở mode query-bar).
- Mode default: DOM, class, `data-autoid`, thứ tự emit.
- `sd-query-bar` dùng độc lập: mọi input/output hiện có, mặc định `applyOn: 'search'`, `showOperatorOnChip: false`.

## 17. i18n

| Key | vi | en | ja | ko | zh |
| --- | --- | --- | --- | --- | --- |
| `core.component.query-bar.all` | Tất cả | All | すべて | 전체 | 全部 |
| `core.component.query-bar.required` | Chọn {label} để xem dữ liệu | Select {label} to view data | データを表示するには{label}を選択してください | 데이터를 보려면 {label}을(를) 선택하세요 | 请选择{label}以查看数据 |
| `core.component.query-bar.find-field` | Tìm trường | Find field | 項目を検索 | 필드 찾기 | 查找字段 |
| `core.component.query-bar.range.from` | Từ {value} | From {value} | {value} 以降 | {value}부터 | {value} 起 |
| `core.component.query-bar.range.to` | Đến {value} | To {value} | {value} まで | {value}까지 | 至 {value} |
| `core.component.table.query-bar.filters` | Bộ lọc | Filters | フィルター | 필터 | 筛选 |
| `core.component.table.query-bar.columns` | Cột | Columns | 列 | 열 | 列 |
| `core.component.table.filter-by` | Lọc theo {title} | Filter by {title} | {title}で絞り込む | {title}(으)로 필터 | 按{title}筛选 |
| `core.component.table.filtering-by` | Đang lọc theo {title} | Filtering by {title} | {title}で絞り込み中 | {title}(으)로 필터링 중 | 正在按{title}筛选 |

Dùng lại: `core.component.query-bar.search-placeholder`, `add-filter`, `no-fields`, `clear-all`, `search`, `boolean.true`, `boolean.false`; `core.component.table.filter`, `core.component.table.choose-filter-hint`. Nếu `core.component.table.filter` chưa có thì thêm đủ 5 locale.

## 18. Kiểm tra trên showcase

- Thêm vào demo sd-table công tắc `mode` (default / query-bar) và `manualFilter`, dùng một option có đủ: quick search có term + 2 dropdown (1 `required`), 4 external (`values` multiple, `daterange` có default, `lazy-values`, `string`), cột `string` có operator, `number` split và không split, `values`, `date` hai kiểu, cột trùng field với external, header nhóm.
- Cùng thao tác ở hai mode: so `pagingReq` in ra console (hoặc khung JSON trong demo).
- Reload trang với `cacheable`; đổi mode qua lại.
- Chip xuống nhiều hàng; bảng `sd-table--fill` trong sd-page-list (màn thấp và cao); bảng có `style.maxHeight`.
- Bàn phím: Tab qua thanh, mở/đóng popover, Enter ô tìm, icon header.
- Trong lúc `refresh`: bấm chip, gõ ô tìm.
- Light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors, `prefers-reduced-motion`.
- ≤ 600px và `pointer: coarse`: mode default.
