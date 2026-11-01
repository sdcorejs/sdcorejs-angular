# sd-table trên điện thoại: bộ lọc, sắp xếp, Công cụ, thẻ, `mobile.template`

Nguồn chính của gói. `Table Mobile Proposal.dc.html` là file thảo luận, có cả phương án bị loại; dùng bảng dưới để biết khung nào là bản chốt. Khung mẫu rộng 360 × 720.

| Khung | Trạng thái | Nội dung |
|---|---|---|
| Hiện trạng | Tham chiếu | Drawer lọc và thẻ hiện tại |
| 1a | Loại | Sheet lọc một trang |
| **1b** | **Chốt** | Sheet bộ lọc đầy đủ: danh sách trường → trang con |
| **1c** | **Chốt** | Hàng chip lọc + sheet một trường |
| **1d** | **Chốt** | Khung thẻ `card` |
| 1e | Đợt 2 | Bố cục `list` (Phụ lục A) |
| **1f** | **Chốt** (hình thẻ) | Thẻ dựng từ data; API cấu hình thay bằng mục 9 |
| 2a–2d | Tham chiếu | Tách bố cục / nội dung. API `mobile.slots` bị thay bằng Vòng 3 |
| **3a–3d** | **Chốt** | API `mobile.template` |
| 4a | Loại | |
| **4b** | **Chốt** | Chip sắp xếp, sheet sắp xếp, nút ⋮, chân trang chỉ còn phân trang |

Khung 1b, trang con Ngày tạo có nút chọn khoảng ngày nhanh (Hôm nay, 7 ngày qua…). Phần này để đợt sau; đợt này trang con ngày chỉ có Từ ngày / Đến ngày.

---

## 1. Bố cục bảng trên điện thoại

Từ trên xuống:

1. **Hàng đầu**: ô tìm của bảng (nếu có), nút sắp xếp (chỉ khi không có hàng chip), nút ⋮ Công cụ.
2. **Hàng chip** (chỉ khi bảng có ít nhất một trường lọc): chip Bộ lọc, chip Sắp xếp, vạch ngăn, chip từng trường.
3. **Danh sách thẻ**.
4. **Thanh chọn** khi đang chọn dòng: giữ như hiện tại.
5. **Chân trang**: chỉ còn phân trang. Bỏ nút Công cụ khỏi chân trang.

Desktop không đổi gì.

## 2. Hàng đầu và nút ⋮ (Công cụ)

- Hàng: padding `4px 4px 10px 16px`, gap 4px. Ô tìm cao 40px, co giãn. Nút icon 44 × 44, icon 22px, màu on-surface-variant.
- Không có ô tìm thì các nút canh phải.
- **Nút ⋮** (`more_vert`) thay cho `sd-mobile-tools-trigger` ở chân trang. Giữ autoId và `aria-label` của nút Công cụ hiện tại.
- Sheet Công cụ (`sd-modal view="bottom-sheet"`, cao theo nội dung):
  - Bỏ `tool-filter`, `tool-sort`, `tool-reload` khỏi `mobileToolsActions`. Giữ các mục còn lại, kể cả mục do consumer thêm.
  - Xuất có từ 2 mục trở xuống thì trải phẳng (Xuất Excel, Xuất CSV); nhiều hơn thì giữ menu con như hiện tại.
  - Dòng 56px, padding `0 20px`, icon 22px + nhãn, gap 16px.
  - Không còn mục nào thì ẩn nút ⋮.
- Nút sắp xếp ở hàng đầu (`swap_vert`, 44 × 44): chỉ hiện khi bảng không có hàng chip nhưng có sắp xếp. Mở sheet sắp xếp (mục 6).

## 3. Hàng chip

- Container: padding `0 16px 12px`, gap 8px, cuộn ngang, ẩn thanh cuộn, `border-bottom: 1px` outline-variant.
- Mép phải mờ dần trong 48px cuối (mask gradient). Đường kẻ dưới không bị mờ.
- Chip cao 32px, radius 8px, chữ 14px/500. Vùng chạm tối thiểu 44px chiều cao.
- **Thứ tự cố định**: Bộ lọc → Sắp xếp → vạch ngăn → `externalFilters` theo thứ tự khai báo → cột có filter theo thứ tự cột. Chip không đổi chỗ khi bật hay tắt lọc.

### 3.1 Chip Bộ lọc
- Viền 1px outline-variant, padding `0 8px`, icon `tune` 18px màu primary.
- Đang lọc ≥ 1 trường: thêm số đếm (min-width 18px, cao 18px, radius 9px, nền primary, chữ on-primary 11px/500). Không lọc trường nào thì không có số.
- Bấm: mở sheet bộ lọc đầy đủ (mục 5).
- `aria-label`: "Bộ lọc, {n} đang lọc".

### 3.2 Chip Sắp xếp
- Hiện khi `sort.enable` và có ít nhất một cột sắp xếp được.
- Đang dùng sắp xếp mặc định (giống cấu hình ban đầu, hoặc chưa sắp): chỉ có icon, 32 × 32, `swap_vert` 18px on-surface-variant.
- Đã đổi: icon `arrow_upward` / `arrow_downward` 18px primary + tên cột, padding `0 10px 0 6px`, viền outline-variant (không tô nền).
- Sau chip là vạch dọc 1 × 20px outline-variant.
- `aria-label`: "Sắp xếp" hoặc "Sắp xếp: {cột}, {Tăng dần|Giảm dần}".
- Bấm: mở sheet sắp xếp (mục 6).

### 3.3 Chip trường
- **Không lọc**: viền 1px outline-variant, chữ on-surface-variant, nhãn = tên trường.
- **Đang lọc**: nền secondary-container, chữ on-secondary-container, không viền. Nhãn = "{Tên}: {tóm tắt}".
- Luôn có `arrow_drop_down` 18px ở cuối; padding `0 4px 0 12px`.
- Chip rộng tối đa 240px, phần tóm tắt cắt bằng dấu ….
- Tóm tắt dùng lại phần dựng nhãn của `table-query-bar.util`, cho cùng chuỗi với query bar trên desktop:
  - values chọn 1 giá trị → nhãn giá trị; chọn ≥ 2 → số lượng ("Trạng thái: 2");
  - khoảng ngày → "dd/MM – dd/MM";
  - khoảng số → "từ X" / "đến Y" / "X – Y";
  - chuỗi → "{operator} {giá trị}".
- Bấm: mở sheet một trường (mục 4).

## 4. Sheet một trường (từ chip)

- `sd-modal view="bottom-sheet"`, cao theo nội dung, tối đa 85% chiều cao màn.
- Tay nắm 32 × 4px, radius 2, outline-variant, margin `10px auto 4px`. Góc trên radius 28px.
- Tiêu đề: tên trường 20px/28px 500, padding trái 20px. Bên phải là nút chữ "Bỏ chọn" (primary, cao 40px).
- Dòng operator 12px on-surface-variant (vd. "Là một trong"). Trường có nhiều operator thì dòng này là nút chữ primary + `arrow_drop_down`, mở menu operator hiện có.
- Control theo kiểu trường:
  - **values / lazy-values**: danh sách checkbox, mỗi dòng 48px (checkbox trong vùng 44 × 44 + nhãn). Có hơn 8 lựa chọn thì thêm ô tìm ở đầu danh sách.
  - **date**: Từ ngày / Đến ngày, hai ô 44px cạnh nhau, nhãn 12px phía trên.
  - **number range**: hai ô 44px, gạch ngang ở giữa.
  - **string / number có operator**: dòng operator + một ô 44px.
- Chân sheet: Hủy (outlined, flex 1) + Áp dụng (filled, flex 2), cao 40px, pill. Padding `12px 16px 16px`, viền trên 1px.
- Hành vi:
  - Làm việc trên bản sao, như `mobile-filter` hiện tại.
  - Áp dụng: ghi giá trị của trường đó và tải lại một lần.
  - Hủy, vuốt xuống, bấm scrim, Back: bỏ thay đổi.
  - Bỏ chọn: xoá giá trị trường đó trong bản sao; vẫn phải bấm Áp dụng.

## 5. Sheet bộ lọc đầy đủ (1b)

Thay `sd-side-drawer width="90vw"` trong `mobile-filter` bằng `sd-modal view="bottom-sheet"`. Một modal, có điều hướng hai cấp bên trong (danh sách ↔ trang con), không mở modal chồng nhau.

- Cao: viewport − 40px. Tay nắm như mục 4.

**Cấp 1: danh sách trường**
- Header (viền dưới 1px): nút `close` 44px, "Bộ lọc" 20px/500, "{n} đang lọc" 13px on-surface-variant (ẩn khi n = 0), nút chữ "Xóa tất cả" primary bên phải (disabled khi bản sao trống).
- Mỗi trường một dòng: min-height 60px, padding `0 12px 0 20px`, viền dưới 1px surface-variant.
  - Dòng 1: tên trường, 14px on-surface.
  - Dòng 2: tóm tắt 13px/18px. Đang lọc → primary 500, cùng chuỗi với chip ở mục 3.3; không lọc → "Tất cả" on-surface-variant.
  - Bên phải: `chevron_right` 22px.
- Thứ tự giống hàng chip.
- Chân: Hủy + Áp dụng như mục 4.

**Cấp 2: trang con của một trường**
- Header: `arrow_back` 44px, tên trường, nút chữ "Bỏ chọn".
- Thân: dòng operator + control như mục 4.
- Chân: một nút filled "Xong", full width, cao 40px.
- Xong, Back, `arrow_back`: quay về cấp 1, giữ giá trị trong bản sao.

**Hành vi chung**
- Hủy, `close`, vuốt xuống, scrim: bỏ toàn bộ bản sao.
- Áp dụng: ghi mọi trường và tải lại một lần.
- Xóa tất cả: xoá mọi trường trong bản sao; vẫn phải bấm Áp dụng.
- Control cao 44px (`control-height-coarse`). Nhãn nằm trên ô (14px/500, gap 8px), không dùng float label. Operator là nút chữ cạnh nhãn, không phải chip nằm trong ô.
- Giữ `filterRegister` và thứ tự external → filterDef → cột.

## 6. Sheet sắp xếp (4b)

- `sd-modal view="bottom-sheet"`, cao theo nội dung, tối đa 85% màn; danh sách cột cuộn bên trong.
- Header: "Sắp xếp" 20px/500 + nút chữ "Bỏ sắp xếp" (disabled khi đang dùng mặc định).
- Nút chia đôi full width, cao 40px, pill, viền outline: "Tăng dần" | "Giảm dần". Bên đang chọn có nền secondary-container và icon `check` 16px.
- Danh sách radio các cột sắp xếp được, dòng 48px, theo thứ tự cột. **Có cả cột đang ẩn trong Thiết lập.**
- Chỉ sắp theo một cột.
- Hành vi:
  - Bấm một cột: áp dụng ngay với chiều đang chọn (mặc định `sort.start`), rồi đóng sheet.
  - Đổi chiều khi đã có cột: áp dụng ngay, sheet vẫn mở.
  - Đổi chiều khi chưa chọn cột: chỉ ghi nhớ chiều đó cho lần chọn cột tiếp theo.
  - Bỏ sắp xếp: về sắp xếp mặc định, rồi đóng sheet.
- Bỏ kiểu bấm xoay vòng tăng → giảm → bỏ trên điện thoại.

## 7. Kéo xuống để làm mới

Thay mục Làm mới trong sheet Công cụ.

- Bật khi `reload.visible`.
- Chỉ nhận cử chỉ khi danh sách đang ở đầu (scrollTop = 0) và không có sheet nào mở.
- Ngưỡng 64px. Có chỉ báo tròn 40px ở giữa phía trên danh sách, quay theo khoảng kéo; thả sau ngưỡng thì gọi `reload()`. Chỉ báo giữ đến khi tải xong.
- Dùng listener passive, `overscroll-behavior-y: contain`, không chặn cuộn native. Khi `prefers-reduced-motion` thì bỏ hiệu ứng quay.

## 8. Khung thẻ `card` (1d)

Core vẽ khung; nội dung là template của consumer hoặc data (mục 9).

- Danh sách: nền surface-container-low, padding `8px 12px`, thẻ cách nhau 8px.
- Thẻ: nền surface, viền 1px outline-variant, radius 12px.
- Lưới thẻ:
  - **Có selector**: `44px | 1fr | 44px`, padding `4px 0 10px`. Checkbox nằm trong vùng 44 × 44 ở cột trái (không còn đè góc).
  - **Không có selector**: `1fr | 44px`, padding `4px 0 8px 16px`.
  - Nội dung có padding-top 10px.
- Nút ⋯ (`more_horiz`, 44 × 44, icon 20px on-surface-variant) ở góc trên phải, mở sheet hành động dòng như hiện tại. Bỏ hàng "Chi tiết · ⋯" riêng.
- Expand (`sdTableExpandDef`): dòng "Chi tiết" ở cuối thẻ, chỉ có khi bảng có expand.
- Đang chọn: ẩn ⋯ (như hiện tại), cột phải còn 12px. Thẻ được chọn có viền primary và nền primary tonal nhạt.
- Thanh chọn: giữ như hiện tại.
- `sdTableRowMobileDef` không phải sửa; template chạy trong ô nội dung.

## 9. API `mobile.template` (3a–3d)

### 9.1 Kiểu

```ts
export type SdTableMobileField<T> = NestedKeyOf<T>;
export type SdTableMobileText<T> = SdTableMobileField<T> | { text: string };

/** Phần chung của mọi layout. */
export interface SdTableMobileData<T> {
  title: SdTableMobileText<T>;
  subtitle?: SdTableMobileText<T>;
  /** field: cột phải có useBadge (kiểm tra lúc chạy) */
  badge?: SdTableMobileField<T> | SdBadgeData;
  fields?: SdTableMobileField<T>[];
}

export interface SdTableMobileCardData<T> extends SdTableMobileData<T> {
  /** Ô đầu lưới, chữ đậm */
  highlight?: SdTableMobileField<T>;
  /** Số ô trước nút Thêm. Mặc định 4 */
  maxFields?: number;
}

export interface SdTableMobileDataContext {
  index: number;
  selected: boolean;
}

export type SdTableMobileDataFn<T, D> = (item: T, context: SdTableMobileDataContext) => D;

export type SdTableMobileTemplate<T> =
  | TemplateRef<SdTableRowMobileDefContext<T>>
  /** Bỏ layout = 'card' */
  | { layout?: 'card'; data: SdTableMobileDataFn<T, SdTableMobileCardData<T>> };

// SdTableOption<T>
mobile?: {
  rowLabel?: (row: T) => string;   // đã có
  template?: SdTableMobileTemplate<T> | false;
};

// SD_TABLE_CONFIGURATION — không có tùy chọn layout
mobile?: {
  autoTemplate?: boolean;  // mặc định false
};
```

- `layout` nằm ngoài hàm và cố định cho cả bảng. Bỏ `layout` nghĩa là `'card'`, và mặc định này cố định trong kiểu của thư viện. Không thêm layout vào `SD_TABLE_CONFIGURATION`, để kiểu của `data` luôn xác định được lúc build.
- Export từ `@sdcorejs/angular/components/table`: `SdTableMobileTemplate`, `SdTableMobileData`, `SdTableMobileCardData`, `SdTableMobileDataContext`, `SdTableMobileDataFn`, `SdTableMobileField`, `SdTableMobileText`.

### 9.2 Khai báo nào cho ra gì

| Khai báo | Trên điện thoại |
|---|---|
| `template: { layout: 'card', data }` hoặc `{ data }` | Khung card, nội dung dựng từ `data` (mục 9.4) |
| `template: TemplateRef` hoặc `sdTableRowMobileDef` | Template của consumer trong khung card |
| `template: false` | Bảng desktop |
| Không khai báo, `autoTemplate` tắt | Bảng desktop như hiện tại |
| Không khai báo, `autoTemplate` bật | Khung card, data tự suy từ columns (mục 10) |

Khai báo cả `sdTableRowMobileDef` và `template` thì dùng directive, kèm cảnh báo dev.

### 9.3 Ví dụ

```ts
mobile: {
  rowLabel: row => row.code,
  template: {
    layout: 'card',
    data: row => ({
      title: 'code',
      subtitle: 'customerName',
      badge: row.locked ? { title: 'Đã khóa', color: 'error' } : 'status',
      highlight: 'total',
      fields: ['createdAt', 'warehouse', 'createdBy'],
    }),
  },
},

// Tách hàm ra ngoài: ghi kiểu trả về để có gợi ý và kiểm tra
const orderCard = (row: Order): SdTableMobileCardData<Order> => ({
  title: 'code', badge: 'status', highlight: 'total',
});
template: { data: orderCard },
```

Các trường hợp phải lỗi lúc build (đưa vào test kiểu, mục 13.6):
```ts
{ data: () => ({ title: 'cod' }) }                  // 'cod' không thuộc NestedKeyOf<Order>
{ data: () => ({ title: 'code', trailing: 'x' }) }  // card không có trailing
{ layout: 'list', data: … }                         // đợt này chưa có 'list'
```

### 9.4 Hình thẻ dựng từ data (1f)

- Dòng 1: `title` 15px/500, sau đó là `badge` (pill cao 20px, chữ 12px/500, padding `0 8px`, màu theo `useBadge` hoặc `SdBadgeData`).
- Dòng 2: `subtitle` 14px on-surface-variant, một dòng, cắt bằng ….
- Lưới 2 cột, gap `8px 16px`, margin-top 10px, padding-right 16px. Mỗi ô có nhãn 12px/16px on-surface-variant (tiêu đề cột) và giá trị 14px/20px.
  - `highlight` là ô đầu, chữ 500.
  - Tối đa `maxFields` ô (mặc định 4, tính cả highlight); phần còn lại ẩn sau nút "Thêm {n} trường".
- Nút Thêm / Thu gọn: cao 36px, 13px/500 primary, icon `expand_more` / `expand_less` 18px. Mở ngay trong thẻ.
- Giá trị đi qua cùng đường với ô desktop: `transform`, định dạng date / number, `displayField` của values / lazy-values, `useBadge` (`desktop-cell/view`).
- `{ text }` hiện nguyên chuỗi.

### 9.5 Gọi hàm và cache
- `data` được gọi một lần cho mỗi dòng mỗi khi dữ liệu đổi. Cache theo (`meta.id`, `dataRevision`, `selected`); không gọi lại theo change detection.
- Hàm ném lỗi: dòng đó dùng data tự suy (mục 10) và cảnh báo dev.

### 9.6 Kiểm tra lúc chạy
Một hàm thuần `resolveMobileView(columns, layout, data)` trả về view đã chuẩn hoá, có spec riêng.

| Kiểm tra | Build | Lúc chạy | Khi sai |
|---|---|---|---|
| Field là leaf column trong `columns` (gồm cột con của `children`) | Một phần (`NestedKeyOf`) | Có | Bỏ slot đó. Thiếu title thì dùng `rowLabel`, rồi `rowKey` |
| `badge` dạng field là cột có `useBadge` | Không | Có | Hiện giá trị như chữ thường |
| `badge` dạng `SdBadgeData` | Có | — | — |
| `layout` hợp lệ (consumer JS) | Có | Có | Dùng card |
| Hàm `data` ném lỗi | — | Có | Data tự suy cho dòng đó |
| Field `hidden`, `invisible` hoặc đang ẩn trong Thiết lập | — | — | Có template / `data`: **vẫn hiện**. Tự suy: **bỏ khỏi thẻ** |

- Cảnh báo chỉ trong `isDevMode()`, mỗi (bảng, field, loại lỗi) một lần.
- Việc ẩn hay hiện field không sinh cảnh báo.

## 10. Data tự suy (`autoTemplate`)

Chỉ dùng khi `SD_TABLE_CONFIGURATION.mobile.autoTemplate = true`, bảng không có template, và `template !== false`. Luôn vẽ bằng card.

| Slot | Cách suy |
|---|---|
| `title` | Cột `rowKey` nếu đang hiện, không thì cột hiện đầu tiên |
| `subtitle` | Cột kiểu string đang hiện kế tiếp, chưa dùng cho slot khác |
| `badge` | Cột hiện đầu tiên có `useBadge` |
| `highlight` | Không suy |
| `fields` | Các cột hiện còn lại, theo thứ tự cột (4 ô đầu, phần còn lại vào Thêm) |

Cột `hidden`, `invisible` hoặc đang ẩn trong Thiết lập bị bỏ.

## 11. i18n (đủ 5 locale)

Trước khi thêm, tìm key có sẵn cùng nghĩa (hủy, áp dụng, xong, tất cả, tăng/giảm dần…) và dùng lại. Tên key dưới đây chỉ là đề xuất; đặt theo quy ước của `core.component.table.*`.

| Key đề xuất | vi | en | ja | ko | zh |
|---|---|---|---|---|---|
| `mobile.filter.title` | Bộ lọc | Filters | フィルター | 필터 | 筛选 |
| `mobile.filter.active-count` | {n} đang lọc | {n} active | {n} 件適用中 | {n}개 적용됨 | 已筛选 {n} 项 |
| `mobile.filter.open-aria` | Bộ lọc, {n} đang lọc | Filters, {n} active | フィルター、{n} 件適用中 | 필터, {n}개 적용됨 | 筛选，已筛选 {n} 项 |
| `mobile.filter.clear-all` | Xóa tất cả | Clear all | すべてクリア | 모두 지우기 | 全部清除 |
| `mobile.filter.clear` | Bỏ chọn | Clear | クリア | 지우기 | 清除 |
| `mobile.filter.all` | Tất cả | All | すべて | 전체 | 全部 |
| `mobile.filter.cancel` | Hủy | Cancel | キャンセル | 취소 | 取消 |
| `mobile.filter.apply` | Áp dụng | Apply | 適用 | 적용 | 应用 |
| `mobile.filter.done` | Xong | Done | 完了 | 완료 | 完成 |
| `mobile.filter.search-options` | Tìm lựa chọn | Search options | 選択肢を検索 | 옵션 검색 | 搜索选项 |
| `mobile.filter.date-from` | Từ ngày | From | 開始日 | 시작일 | 开始日期 |
| `mobile.filter.date-to` | Đến ngày | To | 終了日 | 종료일 | 结束日期 |
| `mobile.sort.title` | Sắp xếp | Sort | 並べ替え | 정렬 | 排序 |
| `mobile.sort.clear` | Bỏ sắp xếp | Clear sort | 並べ替えを解除 | 정렬 해제 | 清除排序 |
| `mobile.sort.asc` | Tăng dần | Ascending | 昇順 | 오름차순 | 升序 |
| `mobile.sort.desc` | Giảm dần | Descending | 降順 | 내림차순 | 降序 |
| `mobile.sort.chip-aria` | Sắp xếp: {column}, {direction} | Sort: {column}, {direction} | 並べ替え: {column}、{direction} | 정렬: {column}, {direction} | 排序：{column}，{direction} |
| `mobile.card.more-fields` | Thêm {n} trường | {n} more fields | 他 {n} 項目 | 필드 {n}개 더 보기 | 另外 {n} 个字段 |
| `mobile.card.collapse` | Thu gọn | Show less | 閉じる | 접기 | 收起 |
| `mobile.refresh.pull` | Kéo để làm mới | Pull to refresh | 引っ張って更新 | 당겨서 새로고침 | 下拉刷新 |
| `mobile.refresh.release` | Thả để làm mới | Release to refresh | 離して更新 | 놓아서 새로고침 | 释放刷新 |

Key không còn dùng trên điện thoại sau thay đổi (giữ key, chỉ bỏ chỗ dùng): `core.confirm.no` / `core.confirm.yes` trong `mobile-filter`, và mục Lọc / Sắp xếp / Làm mới của sheet Công cụ.

## 12. Token và kích thước

Không thêm hex; dùng `--sd-*` theo vai trò. Mã màu trong file mẫu chỉ để minh hoạ.

| Vai trò | Dùng cho |
|---|---|
| primary / on-primary | Số đếm chip Bộ lọc, nút Áp dụng / Xong, tóm tắt đang lọc, icon chiều sắp xếp, viền thẻ được chọn |
| secondary-container / on-secondary-container | Chip trường đang lọc, bên đang chọn của nút chia đôi |
| outline-variant | Viền chip, viền thẻ, đường kẻ, vạch ngăn, tay nắm sheet |
| outline | Viền nút Hủy, viền nút chia đôi |
| on-surface-variant | Icon, nhãn phụ, chip không lọc |
| surface-container-low | Nền danh sách thẻ |
| scrim | Lớp phủ sau sheet |

Kích thước: control 44px (`control-height-coarse`), nút 40px pill, chip 32px, dòng chọn 48px, dòng trường 60px, dòng Công cụ 56px, nút icon 44px.

## 13. Test

### 13.1 Hàng chip
- Không có trường lọc nào: không có hàng chip; có sort thì hiện nút `swap_vert` ở hàng đầu.
- Thứ tự Bộ lọc → Sắp xếp → vạch → external → cột; không đổi khi bật hay tắt lọc.
- Số đếm đúng; ẩn khi bằng 0.
- Tóm tắt trên chip trùng chuỗi của query bar với cùng giá trị (1 giá trị, ≥ 2 giá trị, khoảng ngày, khoảng số, chuỗi có operator).
- Chip quá 240px thì cắt bằng ….

### 13.2 Sheet một trường
- Hủy, vuốt, scrim, Back không đổi giá trị đã áp dụng.
- Áp dụng gọi tải lại đúng một lần.
- Bỏ chọn xoá trường đó trong bản sao; chưa bấm Áp dụng thì giá trị thật không đổi.
- values > 8 lựa chọn thì có ô tìm; ≤ 8 thì không.

### 13.3 Sheet bộ lọc đầy đủ
- Vào trang con, sửa, Xong → cấp 1 hiện tóm tắt mới; giá trị thật chưa đổi.
- Hủy sau khi sửa nhiều trường → không đổi gì.
- Xóa tất cả + Áp dụng → mọi trường trống, tải lại một lần.
- "{n} đang lọc" và trạng thái disabled của Xóa tất cả đúng.
- Không còn `sd-side-drawer` trong `mobile-filter`.

### 13.4 Sắp xếp và Công cụ
- Chip chỉ có icon khi đang dùng sắp xếp mặc định; có tên cột + chiều sau khi đổi.
- Bấm cột: áp dụng với chiều đang chọn rồi đóng sheet. Đổi chiều khi đã có cột: áp dụng, sheet vẫn mở.
- Bỏ sắp xếp về mặc định; disabled khi đang dùng mặc định.
- Cột ẩn trong Thiết lập vẫn có trong danh sách.
- Sheet Công cụ không có Lọc, Sắp xếp, Làm mới. Xuất ≤ 2 mục thì trải phẳng. Không còn mục nào thì ẩn ⋮.
- Chân trang không còn nút Công cụ.

### 13.5 Kéo để làm mới
- Chỉ khi `reload.visible`, danh sách ở đầu và không có sheet mở.
- Kéo dưới 64px rồi thả: không tải lại. Qua 64px: gọi `reload()` một lần, chỉ báo giữ đến khi xong.

### 13.6 Thẻ và `mobile.template`
- Có selector: checkbox ở cột trái, không đè góc. Không selector: không có cột trái.
- Không còn hàng "Chi tiết · ⋯"; có expand thì có dòng Chi tiết ở cuối.
- Thứ tự ưu tiên: directive → `template` → tự suy → bảng desktop, theo bảng ở 9.2.
- `data` không bị gọi lại khi change detection chạy mà dữ liệu không đổi; bị gọi lại khi `dataRevision` hoặc `selected` đổi.
- `resolveMobileView`: mọi dòng của bảng 9.6, gồm cảnh báo chỉ một lần.
- Field ẩn: hiện khi có template / `data`, bị bỏ khi tự suy.
- `maxFields`, Thêm / Thu gọn, highlight ở ô đầu.
- Test kiểu (dtslint, `expectError` hoặc `// @ts-expect-error` trong spec biên dịch): các ví dụ ở 9.3.

## 14. Kiểm tra trên showcase (viewport 360 × 720)

- Bảng đơn hàng có 2 external filter và 5 cột filter: hàng chip, cuộn ngang, mép phải mờ.
- Đang lọc 3 trường, sắp theo Tổng tiền giảm dần.
- Sheet bộ lọc đầy đủ: cấp 1 và trang con values (> 8 lựa chọn, có ô tìm).
- Sheet sắp xếp với 12+ cột.
- Bảng có sort nhưng không có filter: nút `swap_vert` ở hàng đầu.
- Thẻ có selector và không selector, một thẻ đang chọn, một thẻ mở Thêm.
- Bảng dùng `template: { data }`, bảng dùng `sdTableRowMobileDef`, bảng `autoTemplate`.
- Kéo để làm mới.

Mỗi mục chụp một ảnh.

## 15. Cần duyệt trong kế hoạch

1. **Kéo để làm mới không có lối thay thế cho bàn phím / trình đọc màn hình.** Đề xuất cách xử lý, nhưng không đưa lại mục Làm mới vào sheet nếu chưa được duyệt.
2. **Cách xác định "sắp xếp mặc định"** để chip chỉ hiện icon.
3. **Vùng chạm 44px cho chip cao 32px**: dùng padding hay pseudo-element, không làm hàng chip cao thêm.
4. **Khoá cache của `data`** (`meta.id`, `dataRevision`, `selected`), và cách vô hiệu cache khi cột hoặc Thiết lập đổi.
5. **Cột có cell template riêng** khi dựng thẻ từ data: hiện cell template hay giá trị đã định dạng.
6. **Điều hướng hai cấp trong một `sd-modal` bottom-sheet**: focus khi vào / ra trang con, Back của trình duyệt.

## 16. Ngoài phạm vi
- Bố cục `list` (1e) và nhấn giữ để chọn: Phụ lục A.
- Chọn khoảng ngày nhanh.
- Sắp theo nhiều cột trên điện thoại.
- Chấm báo trên nút Thiết lập ở điện thoại (vẫn không có, như gói table-settings).
- Desktop.

---

## Phụ lục A. Bố cục `list` (đợt 2, không làm trong đợt này)

Thêm một nhánh vào union; khai báo card đang có không phải sửa.

```ts
export interface SdTableMobileCardData<T> extends SdTableMobileData<T> {
  highlight?: SdTableMobileField<T>;
  maxFields?: number;
  trailing?: never;        // thêm khi có list
}
export interface SdTableMobileListData<T> extends SdTableMobileData<T> {
  /** Giá trị bên phải dòng 1 */
  trailing?: SdTableMobileField<T>;
  highlight?: never;
  maxFields?: never;
}
export type SdTableMobileTemplate<T> =
  | TemplateRef<SdTableRowMobileDefContext<T>>
  | { layout?: 'card'; data: SdTableMobileDataFn<T, SdTableMobileCardData<T>> }
  | { layout: 'list'; data: SdTableMobileDataFn<T, SdTableMobileListData<T>> };
```

- `?: never` hai chiều là bắt buộc. TypeScript không báo thuộc tính thừa trong object trả về từ arrow function, nên nếu thiếu, `highlight` trong list vẫn build được.
- Hình (1e, 2b phải): dòng phẳng full width, viền dưới 1px, padding `10px 4px 10px 16px`.
  - Bên trái: `title` 500, rồi `subtitle · fields[0]` 13px.
  - Bên phải: `trailing` 500 tabular-nums, `badge` dưới nó, rồi nút ⋮ 28 × 44.
  - Không có ô cho các `fields` còn lại; xem qua ⋯ → Chi tiết.
- Chọn dòng: nhấn giữ để vào chế độ chọn. Hàng đầu đổi thành thanh chọn (`close`, "{n} đã chọn", hành động). Thêm mục Chọn trong ⋮ để có cách vào không cần cử chỉ.
- `sdTableGroupDef`: tiêu đề nhóm dính, 12px/500 trên nền surface-container-low.
