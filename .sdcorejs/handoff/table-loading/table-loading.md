# sd-table · Loading (phương án 1e)

Nguồn chính của đợt này. Hình minh hoạ và bản bấm thử: `Table Loading Spec.dc.html`. Phương án đã chọn: `Table Loading Options.dc.html#1e`. Phân tích gốc L1–L8: Icon Chip Table Review · 3.05.

Đọc trên `sdcorejs/sdcorejs-angular@main` (aacb38e), `versions/v19/projects/sdcorejs-angular/components/table/`.

## Tóm tắt

- Không có dòng nào trên màn hình (lần đầu, sau trạng thái rỗng, sau lỗi): hiện khung xương ngay.
- Đã có dòng: giữ nguyên dòng cũ. Request chạy quá `showDelay` (300ms) thì hiện thanh tiến trình 2px dưới header và làm mờ thân bảng. Đã hiện thì giữ ít nhất `minDuration` (400ms).
- Bỏ lớp phủ `.c-loading` và `<mat-spinner>` 100px, bỏ `bottom: 56px`, bỏ `rgba(0, 0, 0, 0.15)`.
- Header, inline filter, sort, quick search, external filter và thanh cuộn không bị lớp hiển thị chặn.
- Spinner 16px thay `.lds-ring` ở tree và expand. Nút giữ nguyên trong DOM nên focus không mất.
- Bảng local lỗi dùng `sd-data-state` như bảng server.
- Một vùng live cố định báo "đang tải" và "đã tải xong".

Logic đọc (lịch đọc có debounce, bỏ response cũ, khoá paginator, dữ liệu và lỗi không cùng hiện, thử lại đúng snapshot) giữ nguyên. Đợt này chỉ đổi lớp hiển thị và thêm một signal suy ra từ `loading()`.

## Hiện trạng

| Chỗ | Hiện nay | Vấn đề |
| --- | --- | --- |
| `table.component.html:166–172` | `@if (_loading)` → `.c-loading role="status"` + `<mat-spinner>` không có `diameter` | L1 spinner 100px, hiện ngay; L8 vùng status mất khi tải xong |
| `table.component.scss:200–210` | `.c-loading` absolute `top:0; bottom:56px`, nền `rgba(0,0,0,.15)`, `z-index:2` | L2 chặn header/filter/cuộn; L3 56px đặt cứng; L6 không theo theme |
| `table.component.scss:366–369`, `716–720` | bo góc riêng cho `.c-loading` | bỏ cùng `.c-loading` |
| `table.component.html:634` | `_noRows` cần `!_loading` | L4 lần đầu chỉ có header + khoảng trống |
| `table.component.html:95–100`, `262–268` | `.lds-ring` khi tree/expand đang tải, thay chỗ nút | L5 `#cceeff` ~1,2:1; nút biến mất làm mất focus |
| `table.component.scss:281–318` | `.lds-ring` 40px, tree thu bằng `scale(0.45)` | L5 |
| `table.component.html:645–650` | local lỗi: `.c-no-data-row role="alert"` + chữ + `sd-button` Tải lại | L7 khác hẳn `sd-data-state` của server |
| `table.component.ts:248` | host `[attr.data-loading]` theo `loading()` | giữ nguyên (contract E2E) |
| `table.component.html:180` | `.c-table [attr.aria-busy]` theo `_loading` | giữ nguyên |
| `mobile-cards.component.html` | tree/expand đang tải dùng icon `hourglass_empty` trong nút disabled | đổi sang spinner 16px |

## 1. Trạng thái hiển thị

Thêm signal nội bộ `loadingView: Signal<'none' | 'skeleton' | 'refresh'>`, suy ra từ `loading()` và số dòng đang hiển thị. Không đổi `loading()`.

| `loadingView` | Khi nào | Thân bảng | Header, filter, paginator |
| --- | --- | --- | --- |
| `none` | không tải, hoặc tải nhanh hơn `showDelay` | dòng thật | bình thường |
| `skeleton` | `loading()` bật khi chưa có dòng nào (`items().length === 0`) và `skeleton !== false` | khung xương, không có dòng thật | bình thường; paginator ẩn như hiện nay vì `total` chưa có |
| `refresh` | `loading()` đã bật quá `showDelay` khi có dòng, hoặc đang trong thời gian giữ `minDuration` | dòng cũ mờ `--sd-table-loading-dim`, không nhận chuột | thanh tiến trình 2px dưới header; paginator giữ khoá như hiện nay |

Vùng rỗng/lỗi (`sd-data-state`, `.c-no-data-row`) vẫn ẩn khi `loading()` như hiện nay.

Host thêm `[attr.data-loading-view]` = `none` | `skeleton` | `refresh` để SCSS và E2E dùng. `data-loading` giữ nguyên nghĩa: phản ánh `loading()` thật, đổi ngay, không có độ trễ.

## 2. Mốc thời gian

```
loading false → true:
  nếu chưa có dòng và skeleton bật  → view = 'skeleton' (ngay, không trễ)
  nếu view === 'refresh' (đang giữ)  → huỷ hold timer, giữ 'refresh', giữ shownAt
  còn lại                            → showTimer = setTimeout(showDelay)
showTimer chạy và loading() vẫn true → view = 'refresh', shownAt = now
loading true → false:
  huỷ showTimer
  view 'skeleton'                    → 'none' ngay
  view 'refresh'                     → còn = shownAt + minDuration − now
                                        còn > 0 ? holdTimer(còn) → 'none' : 'none'
request mới thay request cũ mà loading() vẫn true → không đổi gì
```

- Chỉ dựa vào `loading()`. `#readScheduled` (đang debounce khi gõ filter) không bật thanh tiến trình.
- Dữ liệu mới render ngay khi về, kể cả khi đang giữ `minDuration`; chỉ lớp mờ và thanh tiến trình kéo dài.
- Chỉ giữ `minDuration` khi kết quả mới có dòng. Kết quả rỗng hoặc lỗi: về `none` ngay để vùng rỗng/lỗi hiện luôn.
- `showDelay: 0` → hiện ngay. `minDuration: 0` → tắt ngay khi xong.
- Timer chạy ngoài Angular zone, set signal khi chạy; dọn bằng `DestroyRef`.

| Request (đã có dòng) | Hiển thị |
| --- | --- |
| 150ms | không hiện gì |
| 450ms | `refresh` từ 300ms đến 700ms |
| 1000ms | `refresh` từ 300ms đến 1000ms |
| 500ms, rồi request mới tới 1100ms | `refresh` liên tục 300ms → 1100ms, không tắt giữa chừng |
| lần đầu, 600ms | `skeleton` từ 0 đến 600ms |
| 450ms, lỗi | `refresh` từ 300ms đến 450ms, không giữ |

## 3. Khung xương (desktop)

Header thật vẫn render (cần `configuration` đã có). Khung xương nằm dưới header, trong `.c-table` để cuộn ngang cùng bảng.

| Thông số | Giá trị |
| --- | --- |
| Số dòng | `loading.skeletonRows`, mặc định 5. Bảng có chiều cao cố định (`sd-table--fill`, `style.maxHeight`): đủ lấp phần nhìn thấy, tối đa `paginate.pageSize`, tối đa 20 |
| Cao dòng | `var(--mat-table-row-item-container-height, 36px)` |
| Viền dòng | `1px solid var(--sd-table-row-divider)` |
| Đệm ô | `0 8px` (như `desktop-cell px-8`) |
| Thanh | cao 12px, bo `var(--sd-radius-4, 4px)`, giữa dòng theo chiều dọc |
| Màu | nền `--sd-table-skeleton-bg`, vệt sáng `--sd-table-skeleton-highlight` |
| Vệt sáng | gradient 90° `bg 0 → highlight 40% → bg 80%`, `background-size: 480px 100%`, chạy 1,4s linear vô hạn. `background-attachment` theo từng thanh là được, không cần đồng bộ giữa các thanh |
| Căn | theo `column.align`; `align: 'right'` thì thanh căn phải |
| `aria-hidden` | `true` cho toàn khối |

Độ rộng thanh theo cột, `i` là số dòng, `j` là thứ tự cột dữ liệu:

| Cột | Độ rộng |
| --- | --- |
| `string`, `values`, `lazy-values`, cột có `cell.templateRef` | `[72, 54, 84, 62, 46][(i + j) % 5]%` của bề rộng nội dung, tối đa 240px |
| `number` | `[64, 48, 80, 56, 72][(i + j) % 5]%`, tối đa 120px |
| `date` / `datetime` / `time` | 76px / 116px / 44px, không quá 100% |
| `boolean` | 40px |
| cột có `useBadge` | viên thuốc 64 × 20px, bo 999px |
| `sdSelection` | ô vuông 14 × 14px, bo 3px |
| `sdIndex` | 16px |
| `sdCommand`, `sdReorder`, `sdSubInformationAction`, `sdFiller` | trống |

Khung xương phải thẳng cột với header. Hai cách, chọn trong kế hoạch (mục 14):
- (a) Khối riêng sau `<table>`: một grid có `grid-template-columns` lấy từ bề rộng các `th` lá của hàng header cuối, đo bằng `ResizeObserver` chỉ khi `loadingView === 'skeleton'`. Không chạm dataSource. Đề xuất.
- (b) Đưa N dòng giả vào dataSource với cờ `meta.skeleton`, mỗi `matCellDef` rẽ nhánh. Thẳng cột sẵn, kể cả sticky, nhưng phải chặn dòng giả khỏi selection, aggregate, tree, group, export, đếm dòng, autoid.

Khung xương không có vệt chuyển khi tắt. Dòng thật thay vào ngay; bố cục giống nhau nên không nhảy.

## 4. Làm mờ và thanh tiến trình (`refresh`)

### Làm mờ
- Áp `opacity: var(--sd-table-loading-dim, 0.55)` và `pointer-events: none` lên **`tr`** của thân bảng: `tr.c-row`, `tr.c-detail-row`, `tr.c-group-row-tr`, `tr.sd-aggregate-row`.
- Không áp lên `td`: ô sticky sẽ trong suốt và lộ nội dung cuộn bên dưới.
- Không áp lên dòng footer sticky (`sd-aggregate-total`, footer của `sdTableFooterDef`) vì cùng lý do.
- `.c-table` thêm `cursor: progress` trong trạng thái này.
- Cuộn chuột và cuộn chạm vẫn chạy vì sự kiện rơi xuống `.c-table`.
- Bàn phím không bị chặn. Không dùng `inert` vì focus đang ở trong dòng sẽ mất.
- Chuyển opacity `var(--sd-duration-fast, 120ms)`; tắt khi `prefers-reduced-motion`.
- `loading.dim: false` thì chỉ có thanh tiến trình, không mờ, không chặn chuột.

### Thanh tiến trình
- Cao 2px, rộng bằng vùng nhìn thấy của bảng (không cuộn ngang theo bảng).
- Nằm sát mép dưới hàng header sticky cuối cùng, kể cả khi có header nhóm hai tầng, hàng filter riêng, quick search.
- Đặt trong `.c-container` (`position: absolute; top: <cao thead>`), không trong `.c-table`. Cao thead đo bằng `ResizeObserver` vào `--sd-table-head-h`; nếu được thì dùng chung với `--sd-table-fill-head` đang có.
- `.c-container` thêm `isolation: isolate`; thanh có `z-index` cao hơn ô sticky của thân bảng và thấp hơn mọi overlay.
- Track `--sd-table-progress-track`, vệt chạy `--sd-table-spinner` (đang là `var(--sd-primary)`). Vệt rộng 35%, chạy từ −35% tới 100% trong 1,1s ease-in-out vô hạn.
- `prefers-reduced-motion`: vệt đứng yên, phủ 100%, `opacity: 0.6`.
- `forced-colors: active`: track `Canvas` viền 1px `CanvasText`, vệt `Highlight`.
- Dùng `mat-progress-bar mode="indeterminate"` với token chiều cao/màu, hoặc một phần tử CSS riêng. Chọn trong kế hoạch; nếu dùng `mat-progress-bar` phải tự xử lý reduced-motion.
- Phần tử thanh có `aria-hidden="true"`; thông báo đi qua vùng live ở mục 8.

## 5. Mobile cards (`mobileCards()`)

- `skeleton`: thay `sd-table-mobile-cards` bằng `min(skeletonRows, 3)` thẻ giả trong cùng `.sd-mobile-list` (gap 24px, đệm `20px 20px 8px`). Thẻ dùng đúng viền, bo, đệm của `.sd-mobile-card` (`1px var(--sd-border)`, 8px, `8px 12px`). Trong thẻ: 3 thanh cao 14/12/12px, rộng 60%/85%/40%, cách nhau 8px, đệm `4px 0` như `.sd-mobile-card-body`.
- `refresh`: thanh tiến trình ở mép trên `.c-table` (dưới `.sd-mobile-command-header` nếu có); `.sd-mobile-list` mờ và không nhận chạm như mục 4.
- Tree và expand đang tải: thay icon `hourglass_empty` bằng spinner 16px (mục 6), nút giữ `disabled` như hiện nay.

## 6. Spinner 16px (tree, expand)

- Một spinner dùng chung: vòng 16px, nét 2px, màu `--sd-table-spinner`, track `--sd-table-progress-track`. `mat-spinner [diameter]="16" [strokeWidth]="2"` hoặc CSS; bỏ `.lds-ring` và `@keyframes lds-ring`.
- Tree (`#sdTreeToggle`): luôn render `button.sd-tree-toggle-btn`. Khi `isExpanding`: icon chevron đổi thành spinner, `aria-busy="true"`, `aria-disabled="true"`, click không làm gì. Focus ở nguyên nút.
- Expand (`sdSubInformationAction`): như tree. Nút `sd-button` 35px giữ nguyên, prefix icon đổi thành spinner. Nếu `sd-button` không nhận nội dung spinner thì dùng `[loading]` của `sd-button` (đang dùng cho nút export) nhưng phải giữ focus.
- `prefers-reduced-motion`: spinner đứng yên, giữ cung 25%.

## 7. Lỗi

- Bảng local lỗi: thay `.c-no-data-row role="alert"` + chữ + `sd-button` bằng `sd-data-state state="error" [retryable]="true" (sdRetry)="reload()"`, cùng nhánh template tuỳ biến `sdDataStateTemplate` như bảng server.
- Thông báo toast khi local lỗi (ts:1250–1260) giữ nguyên trong đợt này (mục 14).
- Thử lại sau lỗi: không còn dòng → `skeleton`.

## 8. A11y

- Bỏ `role="status"` khỏi lớp phủ. Thêm một phần tử ẩn **luôn có trong DOM**: `span.sd-table-live` (`role="status" aria-live="polite" aria-atomic="true"`, kiểu sr-only như `.sd-mobile-sr-only`).
- Nội dung:

| Lúc | Nội dung |
| --- | --- |
| `loadingView` chuyển sang `skeleton` hoặc `refresh` | `core.component.table.loading` (đã có) |
| tải xong, có dòng, và trước đó đã báo "đang tải" | `core.component.table.loaded` với `{count}` = số dòng dữ liệu đang hiện |
| tải xong, rỗng | xoá nội dung; `.c-no-data-row` đã tự báo |
| tải xong, lỗi | xoá nội dung; `sd-data-state` tự báo (kiểm tra role của nó, nếu không có thì vùng live đọc `core.component.table.error-occurred`) |
| tải nhanh hơn `showDelay` | không đổi gì |

- `aria-busy` trên `.c-table` giữ nguyên, theo `loading()` thật.
- Khung xương `aria-hidden="true"`. Thanh tiến trình `aria-hidden="true"`.

## 9. Token

Component token mới trong `assets/scss/themes/_component-tokens.scss`, cùng biểu thức cho light và dark (như các token table khác), ghi vào bảng table của `THEME.md`:

| Token | Giá trị | Light (nền #ffffff) |
| --- | --- | --- |
| `--sd-table-skeleton-bg` | `color-mix(in srgb, var(--sd-text) 8%, var(--sd-table-bg))` | ≈ #ededed |
| `--sd-table-skeleton-highlight` | `color-mix(in srgb, var(--sd-text) 3%, var(--sd-table-bg))` | ≈ #f8f8f8 |
| `--sd-table-progress-track` | `color-mix(in srgb, var(--sd-primary) 18%, var(--sd-table-bg))` | ≈ #d1e2f3 |

Dùng lại: `--sd-table-spinner` (vệt chạy, spinner), `--sd-table-row-divider`, `--sd-radius-4`, `--sd-duration-fast`.

Biến CSS cấp component (không phải màu, ghi trong `sd-table.md`): `--sd-table-loading-dim` (mặc định `0.55`), `--sd-table-head-h` (nội bộ, đo).

Không thêm hex. Khung xương là trang trí nên không cần 3:1. `forced-colors: active`: thanh khung xương `GrayText`.

## 10. API

```ts
// models/table-option-loading.model.ts (mới), export qua models/index.ts
export interface SdTableOptionLoading {
  /** Khung xương khi chưa có dòng. @defaultValue true */
  skeleton?: boolean;
  /** Số dòng khung xương. @defaultValue 5, hoặc đủ lấp bảng có chiều cao cố định */
  skeletonRows?: number;
  /** Chờ bao lâu (ms) mới hiện thanh tiến trình khi đã có dòng. @defaultValue 300 */
  showDelay?: number;
  /** Đã hiện thì giữ ít nhất bao lâu (ms). @defaultValue 400 */
  minDuration?: number;
  /** Làm mờ và chặn chuột trên dòng cũ. @defaultValue true */
  dim?: boolean;
}
```

- `SdTableBaseOption.loading?: SdTableOptionLoading`.
- `ISdTableConfiguration.loading?: SdTableOptionLoading` (mặc định toàn app qua `SD_TABLE_CONFIGURATION`).
- Thứ tự ưu tiên: `option.loading` > `SD_TABLE_CONFIGURATION.loading` > mặc định trên. Gộp theo từng field.
- Giá trị âm hoặc không phải số → dùng mặc định. `skeletonRows` làm tròn xuống, tối thiểu 1, tối đa 20.
- Host attribute mới: `data-loading-view`.
- i18n mới: `core.component.table.loaded` (mục 12).

## 11. Giữ nguyên

- `loading` signal, `data-loading`, `aria-busy`, `readState`, `loadError`, `hideReadError`, `retryRead()`, `reload()`.
- Khoá paginator (`unknown-total-paginator` `aria-busy`, khoá page size).
- `sdDataStateTemplate` cho cả server và local.
- Toàn bộ logic đọc trong `table.component.ts` (lịch đọc, debounce, huỷ response cũ).
- `SdLoadingService` toàn trang của popup export.

Bỏ (nội bộ, ghi CHANGELOG vì có thể có app đè bằng `::ng-deep`): `.c-loading`, `<mat-spinner>` lớp phủ, `.lds-ring`, `@keyframes lds-ring`, `.sd-tree-spinner`.

## 12. i18n

| Key | vi | en | ja | ko | zh |
| --- | --- | --- | --- | --- | --- |
| `core.component.table.loaded` | Đã tải xong {count} dòng | Loaded {count} rows | {count} 行を読み込みました | {count}개 행을 불러왔습니다 | 已加载 {count} 行 |

Dùng lại: `core.component.table.loading`, `core.component.table.error-occurred`, `core.component.table.reload`.

## 13. Spec cần viết

File mới `table.component.loading.spec.ts` (fakeAsync), cùng sửa hai test `.c-loading` ở `table.component.spec.ts:154–171`:

1. Có dòng, `loading` bật: `data-loading-view="none"` tới 299ms, `refresh` ở 300ms.
2. Tải xong ở 150ms: không lúc nào có thanh tiến trình hay dòng mờ.
3. Hiện ở 300ms, xong ở 450ms: giữ `refresh` tới 700ms rồi `none`.
4. Xong ở 1000ms: `none` ngay ở 1000ms.
5. Request mới trong lúc giữ: không có frame nào về `none` giữa hai lần.
6. Chưa có dòng: `skeleton` ngay; xong → `none` ngay; mặc định 5 dòng; `skeletonRows` có tác dụng; khối có `aria-hidden`.
7. `skeleton: false`: lần đầu đi theo nhánh trễ, không có khung xương.
8. `dim: false`: có thanh tiến trình, dòng không mờ, vẫn nhận click.
9. Thứ tự ưu tiên option > configuration > mặc định, gộp theo field; giá trị sai → mặc định.
10. `data-loading` và `aria-busy` đổi ngay theo `loading()` như trước.
11. Trong `skeleton` và `refresh`, `document.elementFromPoint` trên ô header/inline filter trả về phần tử của header (không có lớp nào đè).
12. Vùng live luôn có trong DOM; báo `loading` khi hiện; báo `loaded` với đúng `{count}`; tải nhanh không báo; rỗng không báo trùng.
13. Tree: bấm mở node lazy, focus vẫn ở nút toggle, nút có `aria-busy="true"`, spinner 16px; xong thì focus vẫn ở đó.
14. Expand: như 13.
15. Local lỗi: render `sd-data-state` state error, `sdRetry` gọi `reload()`; template `sdDataStateTemplate` dùng được.
16. Mobile cards: `skeleton` render `min(skeletonRows, 3)` thẻ; `refresh` làm mờ `.sd-mobile-list`.
17. Destroy khi timer đang chạy: không lỗi, không set signal sau destroy.
18. Bảng có header nhóm + hàng filter: thanh tiến trình nằm đúng mép dưới hàng header cuối (so `getBoundingClientRect`).

## 14. Cần duyệt trong kế hoạch

1. Khung xương thẳng cột: (a) grid đo từ header hay (b) dòng giả trong dataSource.
2. Thanh tiến trình: `mat-progress-bar` hay phần tử CSS; cách đo cao thead (dùng chung `--sd-table-fill-head` được không).
3. Trước khi có `configuration` (lookup đang chạy): giữ như hiện nay (không render gì) hay một khung xương chung 5 dòng × 4 cột không header.
4. Toast khi bảng local lỗi: giữ hay bỏ khi đã có `sd-data-state`.
5. Expand: spinner trong `sd-button` bằng cách nào mà vẫn giữ focus.
6. Có cần báo "đã tải xong" cho cả lần tải nhanh hơn `showDelay` không (mặc định: không).

## 15. Kiểm tra trên showcase

- Thêm vào demo sd-table một công tắc độ trễ giả (0 / 150 / 600 / 3000ms) và nút "lần tới lỗi" để thử nhanh.
- Desktop: lần đầu; sort, đổi trang, quick search, inline filter, external filter khi đã có dòng; gõ filter liên tục trong lúc đang tải; lỗi rồi thử lại; rỗng rồi lọc lại.
- Header nhóm hai tầng + hàng filter, có cột sticky trái/phải, cuộn ngang và dọc trong lúc `refresh`.
- `sd-table--fill` (sd-page-list), `style.maxHeight`, bảng không có chiều cao cố định, bảng không phân trang.
- Tree lazy và expand: bấm bằng chuột và bằng bàn phím.
- Mobile cards ≤ 600px, `pointer: coarse`.
- Light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors, `prefers-reduced-motion`.
- Trình đọc màn hình (NVDA hoặc VoiceOver): nghe "Đang tải dữ liệu bảng" rồi "Đã tải xong N dòng".
