# sd-table trên điện thoại — kế hoạch

**Duyệt 2026-11-01** ("Duyệt, làm bước 1"): theo mọi phương án đề xuất. 15.1 nút "Tải lại" chỉ hiện khi focus, không đưa
Làm mới lại sheet Công cụ. 15.6 thêm `sd-modal` `closeOnNavigation`, Back hai cấp qua history. Khung mới chỉ ở chế độ thẻ.
Chuỗi chip theo query bar.

Nguồn: `table-mobile.md` (gói handoff cùng thư mục). Branch làm việc: `claude/update-code-from-main-e16433` (từ `origin/main`
29e2ba395, có #131). Mỗi bước một commit, spec trước; chỉ commit khi được yêu cầu. Chỉ sửa `versions/v19/**`, rollout bằng
`npm run sync`, kiểm `npm run check:sync`. Worktree chưa có `node_modules`: trước bước 1 cài v19 + showcase bằng Node 24.22.1.

## Hiện trạng đã đối chiếu

- Điện thoại có hai chế độ. **Thẻ** (`mobileCards()` = `isMobile() && sdRowMobileDef`): footer có nút Công cụ
  (`.sd-mobile-tools-trigger`, `{autoId}-mobile-tools`), sheet Công cụ gồm Làm mới / Xuất / Lọc / Sắp xếp (xoay vòng) /
  Thiết lập. **Bảng desktop trên điện thoại** (không có template): footer cũ + nút `{autoId}-mobile-filter-open` mở drawer lọc.
- `mobile-filter` là `sd-side-drawer 90vw`, bản sao làm việc, Áp dụng = một lần `filterRegister.value.set(...)`.
- `SdTableOptionSort` chỉ có `enable`: không có `sort.start`, không có sắp xếp ban đầu.
- Danh sách cột của `configuration()` đã bỏ cột ẩn trong Thiết lập; `TableFormatService.format` tính `meta.display` cho
  mọi cột của option (cả cột ẩn).
- Chuỗi tóm tắt chip **không** nằm trong `table-query-bar.util`: util chỉ đổi giá trị bảng sang `Filter[]`
  (`sdTableQueryFields`, `tableFilterToQuery`). Chuỗi do `SdQueryBar.chipValueText` (private) dựng, và khác ví dụ ở mục 3.3:
  nhiều giá trị → `Đã giao +1` (không phải `Trạng thái: 2`); khoảng ngày cùng năm → `01/10 – 31/10/2026`; một đầu →
  `Từ X` / `Đến Y`.
- `sd-chip` là ô nhập nhiều giá trị (form input), không phải chip bấm được. `sd-button` không có input `aria-label`,
  ghi autoId thành `components-button-…`, chặn click 300ms. Có `sd-segmented`, `sd-operator`, `sd-checkbox`, `sd-radio`.
- `sd-modal` bottom-sheet: không có tay nắm, không vuốt để đóng; `MatBottomSheet` mặc định đóng khi có `popstate`.
- Kiểm bằng `tsc` 5.7: với kiểu ở 9.1, `{ data: () => ({ title: 'code', trailing: 'x' }) }` **không** lỗi. Thêm
  `trailing?: never` thì lỗi đúng như 9.3 yêu cầu.

## Quyết định cho mục 15

1. **Kéo để làm mới không có lối thay thế.** Thêm nút "Tải lại" (`refresh`, key `core.component.table.reload`) ở hàng
   đầu, ẩn kiểu skip link: chỉ hiện khi nhận focus bàn phím, nằm trước ⋮ trong thứ tự Tab, screen reader đọc được. Không
   đưa lại mục Làm mới vào sheet Công cụ. Lý do: phủ bàn phím và trình đọc màn hình mà giao diện chạm giữ đúng thiết kế.
   Lưu ý: người dùng chạm không làm được cử chỉ kéo vẫn chưa có lối một chạm (WCAG 2.5.1). Lối đủ chuẩn là giữ mục Làm mới
   trong sheet Công cụ; cần anh/chị chọn.
2. **Sắp xếp mặc định** = không có cột đang sắp (`active === ''` hoặc `direction === ''`), vì option không có cấu hình sắp
   xếp ban đầu. Khi đó chip chỉ có icon và "Bỏ sắp xếp" disabled. Bỏ sắp xếp đặt `active = ''`, `direction = ''` rồi phát
   `sortChange`, cùng đường với bước "bỏ" của kiểu xoay vòng hiện nay. Chiều mặc định khi chọn cột lần đầu là `asc`
   (mặc định của `MatSort`); không thêm `sort.start`.
3. **Vùng chạm 44px cho chip 32px**: pseudo-element `::before` của nút, `inset: -6px -4px` (ăn vào gap 8px). Vì hàng chip
   cuộn ngang (cắt nội dung theo trục dọc), hàng có `padding-top: 6px; margin-top: -6px` để phần trên không bị cắt; chiều
   cao nhìn thấy không đổi. Spec kiểm bằng `elementFromPoint` ở mép trên/dưới.
4. **Cache của `data`**: hai lớp. Lớp 1 giữ kết quả thô của `data(item, ctx)` theo `meta.id`, kèm `dataRevision`,
   `selected` và tham chiếu hàm; chỉ gọi lại khi một trong ba đổi (đổi option thì hàm đổi). Lớp 2 giữ view đã chuẩn hoá
   (`resolveMobileView`) theo kết quả lớp 1 + `option.columns` + `configuration()`; đổi cột hoặc Thiết lập chỉ dựng lại
   lớp 2, không gọi lại `data`. `table.detectChanges()` tăng `dataRevision` nên vô hiệu cả hai. Hệ quả: `ctx.index` có thể
   cũ khi chỉ thứ tự dòng đổi mà `dataRevision` không đổi (bung tree); ghi trong docs.
5. **Cột có cell template**: ô trong lưới (`fields`, `highlight`) đi qua `desktop-cell` như desktop: có `sdTableCellDef`
   / `cell.templateRef` thì hiện template, không thì `view` (transform, định dạng, `displayField`, `useBadge`). `title` và
   `subtitle` luôn là chữ thuần (giá trị đã định dạng, bỏ HTML), không dùng template. Lý do: một đường hiển thị duy nhất;
   template thường mang nghĩa (link, giá trị ghép); title phải gọn một dòng.
6. **Hai cấp trong một bottom-sheet**: trạng thái `page = signal<key | null>`, header/thân/chân đổi theo cấp.
   - Vào trang con: focus tiêu đề trang con (`h2 tabindex="-1"`). Về cấp 1: focus lại dòng của trường đó. Mở sheet: focus
     phần tử đầu; đóng: trả focus về chip/nút đã mở.
   - Escape: ở trang con thì về cấp 1 (chặn lan để sheet không đóng); ở cấp 1 thì đóng và bỏ bản sao.
   - Back của trình duyệt: khi mở sheet đẩy một mục history (cùng URL, cùng `history.state`), vào trang con đẩy thêm một
     mục. `popstate`: trang con → về cấp 1; cấp 1 → đóng, bỏ bản sao. Đóng bằng nút thì `history.back()` để gỡ mục đã đẩy.
     Cần `sd-modal` không tự đóng khi có `popstate` → thêm input `closeOnNavigation` (mặc định `true`, tên theo Material)
     cho `sd-modal`. Áp dụng cho cả sheet một trường và sheet sắp xếp (một cấp). Router Angular bỏ qua `popstate` cùng URL
     (`onSameUrlNavigation: 'ignore'`); app đặt `'reload'` sẽ chạy lại route, ghi trong docs.
   - Phương án không đụng `sd-modal`: Back luôn đóng cả sheet và bỏ bản sao, nhưng Back vẫn rời trang (hành vi hiện nay
     của drawer). Cần anh/chị chọn.

## Quyết định khác cần duyệt

- A. **Chuỗi tóm tắt** lấy đúng của query bar (theo 3.3 "cùng chuỗi" và test 13.1). Tách `chipValueText` + phần tra nhãn
  (`values` hàm, `lazy-values` qua `views`) của `SdQueryBar` thành helper thuần `ɵsdQueryChipValueText` /
  `ɵSdQueryChipLabels` trong `components/query-bar`, query bar gọi lại helper (hành vi không đổi). Hệ quả: chip ra
  `Trạng thái: Đã giao +1`, không phải `Trạng thái: 2`. Muốn đúng ví dụ thì chip điện thoại sẽ khác query bar.
- B. **Phạm vi khung mới**: hàng đầu, hàng chip, kéo để làm mới, chân trang chỉ còn phân trang chỉ áp dụng khi điện thoại
  hiện thẻ. Bảng desktop trên điện thoại (không template, không `autoTemplate`) giữ footer cũ và nút
  `-mobile-filter-open`; riêng sheet lọc mà nút đó mở thành bottom-sheet mới vì dùng chung `mobile-filter`.
- C. **Nút**: chip, ⋮, `swap_vert`, ⋯, Thêm/Thu gọn, tay nắm là `<button mat-button>` / `mat-icon-button` như
  `mobile-cards` hiện nay, để giữ `data-autoid="{autoId}-mobile-…"`, đặt được `aria-label`, `aria-expanded`,
  `aria-haspopup`. Hủy / Áp dụng / Xong / Bỏ chọn / Xóa tất cả / Bỏ sắp xếp là `sd-button`. Tăng/Giảm dần là
  `sd-segmented`. Control dùng `sd-input`, `sd-input-number`, `sd-date`, `sd-checkbox`, `sd-radio` (values chọn một).
- D. **Bộ lọc tự viết** (`sdTableFilterDef`, external `custom`, cột `time`): không có chip; ở cấp 1 là một dòng mở trang
  con hiển thị template, dòng tóm tắt bỏ trống (không biết giá trị). Bộ lọc nhanh trong ô tìm giữ nguyên.
- E. **Thứ tự và tập trường**: chip và cấp 1 dùng `sdTableQueryFields` (external → cột, cột bị external che thì bỏ), tập
  cột như `mobile-filter` hiện nay (cột đang hiện). Sheet sắp xếp lấy cột lá `sortable` của option, bỏ `hidden: true`, giữ
  cột `invisible` và cột ẩn trong Thiết lập, theo thứ tự option.
- F. **Operator**: nút chữ primary + `arrow_drop_down` cạnh nhãn, mở `mat-menu` liệt kê operator của cột với nhãn/icon từ
  `OPERATORS` (cùng nguồn với `sd-operator`). `sd-operator` không có kiểu nút chữ.
- G. **`lazy-values`**: luôn có ô tìm (tìm qua `option.items`), giá trị đã chọn nằm đầu danh sách. `values` > 8 lựa chọn
  mới có ô tìm.
- H. **Vuốt xuống để đóng**: `MatBottomSheet` không có; viết handler nội bộ (pointer, passive) trên tay nắm + header của
  ba sheet mới (lọc, một trường, sắp xếp). Sheet Công cụ và sheet hành động dòng giữ nguyên.
- I. **`trailing?: never`** thêm vào `SdTableMobileCardData` ngay đợt này (xem kiểm `tsc` ở trên).

## Public API mới (chỉ thêm)

| API | Kiểu | Export |
|---|---|---|
| `SdTableMobileField`, `SdTableMobileText`, `SdTableMobileData`, `SdTableMobileCardData` (có `trailing?: never`), `SdTableMobileDataContext`, `SdTableMobileDataFn`, `SdTableMobileTemplate` | type | `models/table-mobile.model.ts` → `models/index.ts` → `@sdcorejs/angular/components/table` |
| `SdTableOption.mobile.template?: SdTableMobileTemplate<T> \| false` | option | sẵn có qua `SdTableOption` |
| `ISdTableConfiguration.mobile?: { autoTemplate?: boolean }` (mặc định `false`) | configuration | sẵn có qua `ISdTableConfiguration` |
| `SdModal.closeOnNavigation` (mặc định `true`) | input | `@sdcorejs/angular/components/modal` — chỉ khi chọn phương án Back ở 15.6 |
| `ɵsdQueryChipValueText`, `ɵSdQueryChipLabels` | ɵ (nội bộ, như `ɵsdOperatorHasValue`) | `@sdcorejs/angular/components/query-bar` |

`resolveMobileView` và các component mới (`mobile-toolbar`, `mobile-field-sheet`, `mobile-sort-sheet`, thẻ từ data) là
nội bộ, không export. `SdTable` có thêm vài signal/method công khai (như các đợt trước). Không đổi tên hay xoá input/output
nào. `table.mobileFilter()` giữ `open()`, `close()`, `externalFilters()`, `workingExternalFilter()`.

API consistency (sẽ ghi vào PR): `mobile.template` cùng nhóm với `mobile.rowLabel`; callback trong option không theo
`on<Action>` vì đây là hàm dựng dữ liệu, như `rowLabel`; `autoTemplate` nằm trong `SD_TABLE_CONFIGURATION.mobile` theo cách
nhóm `filter` / `loading`; `closeOnNavigation` trùng tên `MatDialogConfig` / `MatBottomSheetConfig`.

## Bước, file, commit

Sau mỗi bước: full Karma v19 có coverage, `npm run lint`, `test:theme`, `check:scss-hex`, `sync`, `check:sync`, ảnh 360 × 720.
Mỗi commit kèm phần rollout v20/v21/v22 (chú ý `sync` ghi lại v22 thành CRLF trên checkout CRLF).

1. `feat(table): mobile card frame with left selector and corner menu`
   `components/mobile-cards/mobile-cards.component.{html,scss,ts}`; spec mới `table.component.mobile-card.spec.ts`;
   sửa nhẹ `table.component.mobile.spec.ts` nếu selector đổi chỗ.
2. `feat(table): build mobile cards from data with mobile.template`
   Mới: `models/table-mobile.model.ts` (+ `table-mobile.model.spec.ts`, test kiểu bằng `// @ts-expect-error`),
   `services/mobile/mobile-view.util.ts` (+ spec: `resolveMobileView`, data tự suy, cảnh báo dev một lần),
   `components/mobile-cards/mobile-card-data.component.{ts,html,scss}`. Sửa: `models/index.ts`,
   `models/table-option.model.ts`, `configurations/table.configuration.ts`, `table.component.{ts,html}` (`mobileCards` →
   chọn directive → template → tự suy → bảng), `mobile-cards.component.*` (cache hai lớp), i18n 5 locale.
3. `feat(table): mobile filter chips and single-field sheet`
   Mới: `components/query-bar/src/query-bar-chip-text.ts` (+ spec), `services/table-filter/table-mobile-filter.util.ts`
   (+ spec), `components/mobile-toolbar/*` (hàng đầu + hàng chip), `components/filter/mobile-filter/mobile-filter-field.*`
   (thân control dùng chung), `components/filter/mobile-filter/mobile-field-sheet.*`, `components/mobile-sheet/*` (tay
   nắm + vuốt, history). Sửa: `query-bar.component.ts`, `components/query-bar/index.ts`, `table.component.{ts,html,scss}`,
   i18n. Spec mới `table.component.mobile-filter.spec.ts`.
4. `feat(table): two-level bottom sheet for mobile filters`
   Viết lại `mobile-filter.component.{ts,html,scss}`; nếu chọn: `components/modal/src/modal.component.ts` (+ spec,
   `sd-modal.md`). Thêm spec vào `table.component.mobile-filter.spec.ts`; giữ test L230 của
   `table.component.mobile.spec.ts`.
5. `feat(table): mobile sort sheet, top-row tools and pull to refresh`
   Mới: `components/mobile-sort/mobile-sort-sheet.*`, `components/mobile-toolbar/pull-refresh.*`. Sửa:
   `table.component.{ts,html,scss}` (`mobileToolsActions`, ⋮ lên hàng đầu, footer), i18n. Spec mới
   `table.component.mobile-sort.spec.ts`.
6. `docs(table): document the mobile filters, sort, tools and card data`
   `sd-table.md` (Mobile row cards, Desktop-to-mobile mapping, bảng autoId, `mobile.template`, `autoTemplate`, lọc / sắp
   xếp / Công cụ / kéo để làm mới), `CHANGELOG.md`, showcase (`table-demo.component.ts`: sửa ghi chú các mục mobile, thêm
   2 mục "Thẻ dựng từ data" và "Lọc và sắp xếp trên điện thoại" có `autoTemplate`; `content.en.ts`;
   `documentation.registry.ts` 37 → 39; `documentation.registry.spec.ts` 496 → 498; sinh lại example manifest), ảnh vào
   `.sdcorejs/handoff/screenshots/`.

## Test

**Sửa** (`table.component.mobile.spec.ts`): L181 (Công cụ ở footer → ⋮ ở hàng đầu; bỏ `-mobile-tool-filter`,
`-mobile-tool-sort-name`; thêm kiểm chip/sheet), L220 (ẩn ⋮ khi không còn mục), L700 (xoay vòng sort → sheet sắp xếp).
L255/L482 (`.sd-mobile-command-trigger`) và L575 (`-expand-1`) giữ nguyên tên nên chỉ cần chạy lại. Rà
`table.component.loading.spec.ts` L1019 (thanh tiến trình dưới command header: hàng đầu đặt ngoài `.c-table` để không
lệch) và `table-quick-search.spec.ts` L214. Spec query bar hiện có phải xanh nguyên sau khi tách helper.

**Mới** theo mục 13:
- 13.1 hàng chip: không có trường lọc → không hàng chip, có sort → `swap_vert`; thứ tự cố định khi bật/tắt; số đếm, ẩn khi 0;
  chuỗi chip = `ɵsdQueryChipValueText` cho 1 giá trị, ≥ 2, khoảng ngày, khoảng số, chuỗi có operator; chip > 240px có `…`;
  vùng chạm 44px.
- 13.2 sheet một trường: Hủy/vuốt/scrim/Back/Escape không đổi giá trị; Áp dụng tải lại đúng một lần; Bỏ chọn chỉ đổi bản
  sao; values > 8 có ô tìm, ≤ 8 không.
- 13.3 sheet đầy đủ: trang con → Xong → cấp 1 hiện tóm tắt mới, giá trị thật chưa đổi; Hủy sau nhiều trường không đổi gì;
  Xóa tất cả + Áp dụng tải lại một lần; "{n} đang lọc" và disabled của Xóa tất cả; không còn `sd-side-drawer`; focus
  vào/ra trang con; Back hai cấp.
- 13.4 sort và Công cụ: chip icon / tên + chiều; bấm cột áp dụng rồi đóng; đổi chiều khi có cột áp dụng, sheet mở; đổi chiều
  khi chưa có cột chỉ ghi nhớ; Bỏ sắp xếp, disabled khi mặc định; cột ẩn trong Thiết lập có trong danh sách; Công cụ không
  có Lọc/Sắp xếp/Làm mới; Xuất ≤ 2 trải phẳng; không còn mục thì ẩn ⋮; footer không còn nút Công cụ.
- 13.5 kéo để làm mới: chỉ khi `reload.visible`, ở đầu danh sách, không sheet nào mở; < 64px không tải; > 64px gọi `reload()`
  một lần, chỉ báo giữ đến khi xong; nút "Tải lại" ẩn hiện khi focus (nếu duyệt 15.1).
- 13.6 thẻ và `mobile.template`: selector cột trái / không có cột trái; không còn hàng "Chi tiết · ⋯", có expand thì có dòng
  Chi tiết; thứ tự directive → template → tự suy → bảng (kèm cảnh báo khi có cả directive và template); `data` không gọi lại
  khi chỉ chạy change detection, gọi lại khi `dataRevision` hoặc `selected` đổi; đổi Thiết lập không gọi lại `data`;
  `resolveMobileView` đủ các dòng bảng 9.6, cảnh báo một lần; field ẩn hiện khi có template/data, bỏ khi tự suy;
  `maxFields`, Thêm/Thu gọn, highlight; test kiểu ba ví dụ 9.3 + một ví dụ hợp lệ.

## i18n

Dùng lại: `core.component.table.filter` (Bộ lọc), `core.common.cancel` (Hủy), `core.component.table.apply` (Áp dụng),
`core.component.query-bar.all` (Tất cả), `core.component.query-bar.clear` (Xóa tất cả), `core.component.table.mobile.sort`
(Sắp xếp), `core.component.table.mobile.details` (Chi tiết), `core.component.table.mobile.tools` (nhãn ⋮),
`core.component.table.reload` (nút Tải lại ẩn); chuỗi chip dùng sẵn `core.component.query-bar.range.*`, `boolean.*`.

Mới (đủ vi/en/ja/ko/zh, nội suy `{count}` theo quy ước repo, dạng `core.component.table.mobile.<tên>` vì `mobile.sort` đã
là một key lá):

| Key | vi | en | ja | ko | zh |
|---|---|---|---|---|---|
| `mobile.filter-count` | {count} đang lọc | {count} active | {count} 件適用中 | {count}개 적용됨 | 已筛选 {count} 项 |
| `mobile.filter-open` | Bộ lọc, {count} đang lọc | Filters, {count} active | フィルター、{count} 件適用中 | 필터, {count}개 적용됨 | 筛选，已筛选 {count} 项 |
| `mobile.clear-field` | Bỏ chọn | Clear | クリア | 지우기 | 清除 |
| `mobile.done` | Xong | Done | 完了 | 완료 | 完成 |
| `mobile.search-options` | Tìm lựa chọn | Search options | 選択肢を検索 | 옵션 검색 | 搜索选项 |
| `mobile.date-from` | Từ ngày | From | 開始日 | 시작일 | 开始日期 |
| `mobile.date-to` | Đến ngày | To | 終了日 | 종료일 | 结束日期 |
| `mobile.sort-clear` | Bỏ sắp xếp | Clear sort | 並べ替えを解除 | 정렬 해제 | 清除排序 |
| `mobile.sort-asc` | Tăng dần | Ascending | 昇順 | 오름차순 | 升序 |
| `mobile.sort-desc` | Giảm dần | Descending | 降順 | 내림차순 | 降序 |
| `mobile.sort-active` | Sắp xếp: {column}, {direction} | Sort: {column}, {direction} | 並べ替え: {column}、{direction} | 정렬: {column}, {direction} | 排序：{column}，{direction} |
| `mobile.more-fields` | Thêm {count} trường | {count} more fields | 他 {count} 項目 | 필드 {count}개 더 보기 | 另外 {count} 个字段 |
| `mobile.show-less` | Thu gọn | Show less | 閉じる | 접기 | 收起 |
| `mobile.refresh-pull` | Kéo để làm mới | Pull to refresh | 引っ張って更新 | 당겨서 새로고침 | 下拉刷新 |
| `mobile.refresh-release` | Thả để làm mới | Release to refresh | 離して更新 | 놓아서 새로고침 | 释放刷新 |

Không còn dùng trên điện thoại (giữ key): `core.confirm.no` / `core.confirm.yes` trong `mobile-filter`; mục Làm mới (vẫn
dùng cho nút ẩn nếu duyệt 15.1), Lọc (`core.component.table.filter` vẫn dùng ở chỗ khác) và Sắp xếp của sheet Công cụ.
`mobile.select-page` vốn đã không dùng.

## Tiến độ và lệch thông số

**Bước 1 — khung thẻ** (chưa commit). `mobile-cards.component.{html,scss,ts}`, spec mới
`table.component.mobile-card.spec.ts` (9 test: đỏ cả 9 trên code cũ, xanh trên code mới). Full Karma v19 8818/8818,
lint, `test:theme`, `check:scss-hex`, `sync` + `check:sync` xanh. Ảnh `table-mobile-01..03`.
- Cột phải 44px chỉ khi bảng có lệnh dòng và không đang chọn; bảng không có lệnh dòng cũng còn 12px (thông số chỉ nói
  trường hợp đang chọn). Lý do: không có ⋯ thì không chừa chỗ trống 44px.
- Token: surface-container-low = `color-mix(--sd-surface-muted 35%, --sd-surface)` (cùng nền vùng tổng hợp của bảng);
  outline-variant = `--sd-border`; on-surface-variant = `--sd-text-secondary`; viền/nền thẻ chọn giữ như cũ.
- Vùng 44 × 44 của checkbox được tính là control: chạm vào vùng ngoài ô vuông chỉ chọn một lần, không mở sheet hành động.
- Khối chi tiết mở ra nằm dưới dòng "Chi tiết" (nút đứng trước nội dung nó điều khiển); dòng hàng tree/kéo-thả giữ ở đầu
  cột nội dung.
- Checkbox dùng kích thước Material mặc định trong vùng 44px (bỏ ô 14px trên nền tròn đè góc).
- Docs (`sd-table.md` "Card lists keep equal 20px side gutters…", "checkbox… straddles the border") và ghi chú demo showcase
  còn tả khung cũ; sửa ở bước 6.

Từ bước 2, người dùng yêu cầu làm hết các bước không dừng chờ duyệt: mỗi bước commit sau khi full Karma, lint, scss-hex,
i18n parity, theme, sync + check:sync xanh. Spec các bước 2–5 viết cùng lúc với code (không chạy RED riêng như bước 1).
Ảnh 360 × 720 chụp gộp ở bước 6, khi showcase có demo.

**Bước 2 — `mobile.template`** (a4d49ada1).
- Khoá cache của `data` thêm tham chiếu object dòng: `dataRevision` chỉ tăng khi `table.detectChanges()`, nên một lần đọc
  lại trả object mới cùng `meta.id` phải gọi lại `data`.
- Field `hidden: true` không được bảng định dạng (`TableFormatService` bỏ qua), thẻ hiện giá trị thô.
- Tự suy chọn badge trước subtitle, để cột trạng thái `string` có `useBadge` thành badge.
- Sửa lỗi: khoá lưu Thiết lập khi không có `option.key` băm cả option; `TemplateRef` trong `mobile.template` vượt độ sâu
  khi băm. Nay bỏ `mobile.template` khỏi phần băm (khoá cũ không đổi).

**Bước 3 — hàng chip, sheet một trường** (6543e86d5).
- Vùng chạm 44px dùng `::after` (Material giữ `::before` với `pointer-events: none`); hàng chip có `padding-top: 6px`, hàng
  đầu (bước 5) giảm `padding-bottom` còn 4px khi có hàng chip, khoảng cách nhìn thấy vẫn 10px.
- Tóm tắt `string` / `number` có operator đứng trước giá trị (`Chứa abc`), `NULL` / `NOT_NULL` hiện tên operator.
- Sheet dùng `SdTableSheetHistory` (đẩy một mục history mỗi cấp, `sd-modal` `closeOnNavigation: false`) và vuốt xuống trên
  tay nắm + header (`sdTableSheetSwipe`, listener passive, `touch-action: none`).

**Bước 4 — sheet bộ lọc đầy đủ** (4ce8e61bd).
- Escape ở trang con bắt bằng listener TS trên thân sheet (lint không cho `(keydown)` trên `div` không focus được).
- Bộ lọc tự viết có dòng mở trang con chứa control riêng, không có dòng tóm tắt; chỉ bộ lọc đã biết hiện "Tất cả".

**Bước 5 — sắp xếp, Công cụ, chân trang, kéo để làm mới.**
- Nút chia đôi là `sd-segmented` (`stretch`), bên đang chọn có icon `check`. Danh sách cột là `sd-radio`.
- Dòng sheet Công cụ cao 56px qua input nội bộ `sheetClass` của `sd-table-mobile-actions`; sheet hành động dòng giữ nguyên.
- Kéo để làm mới: `sd-table-pull-refresh` trên `.c-table`, chỉ báo giữ đến khi `loading` tắt (thêm hạn 300ms cho lần đọc không
  bật loading). Chỉ nhận kéo khi danh sách, mọi phần tử cuộn bên trên và trang đều ở đầu.

**Bước 6 — docs, showcase, ảnh.** `sd-table.md` (Card body, Filters/sort/tools on phones, bảng mapping, autoId), CHANGELOG,
showcase 2 mục mới ("Lọc và sắp xếp trên điện thoại", "Thẻ tự suy từ cột"; registry 37 → 39, tổng 496 → 498), ghi chú mục
"Thẻ mobile và thao tác". Ảnh `table-mobile-04..14` chụp ở 360 × 720 với demo đặt trong một khung toàn màn hình (khung demo
của trang docs chỉ rộng 282px).
- Kiểm trên showcase tìm ra hai lỗi lib, sửa trong commit riêng có spec: hàng chip cuộn ngang vẫn góp bề rộng min-content nên
  bảng trong container flex giãn theo tổng bề rộng chip (sửa: `contain: inline-size`); sheet lọc đầy đủ chưa cao viewport − 40px
  và chân không sát đáy (rule 85dvh của sheet khác cùng độ ưu tiên, thân sheet không giãn).
- Nút chia đôi dùng giao diện mặc định của `sd-segmented` (bên chọn nền sáng + ✓), không phải nền secondary-container.

## CHANGELOG (`## [Unreleased]`)

- Changed (BREAKING cho E2E): autoId `{autoId}-mobile-tool-filter`, `-mobile-tool-sort-<field>`, `-mobile-tool-reload` không
  còn; `-mobile-tools` chuyển từ footer lên hàng đầu (icon ⋮, không còn chữ "Công cụ").
- Changed: drawer lọc trên điện thoại thành bottom-sheet hai cấp (cả khi điện thoại hiện bảng desktop); nút Công cụ lên hàng
  đầu; sheet Công cụ bỏ Lọc, Sắp xếp, Làm mới, Xuất ≤ 2 mục trải phẳng; kéo xuống để làm mới; chân trang chỉ còn phân trang;
  khung thẻ mới (checkbox cột trái, ⋯ góc trên phải, bỏ hàng "Chi tiết · ⋯", nền danh sách, khoảng cách); sắp xếp trên điện
  thoại chọn một cột trong sheet thay cho xoay vòng.
- Added: `mobile.template` + các kiểu `SdTableMobile*`; `SD_TABLE_CONFIGURATION.mobile.autoTemplate`; hàng chip lọc, chip
  sắp xếp; (`sd-modal` `closeOnNavigation` nếu duyệt).
- Before upgrading: kiểm E2E dùng các autoId trên và ảnh chụp điện thoại.
