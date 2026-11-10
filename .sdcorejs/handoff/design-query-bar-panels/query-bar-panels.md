# sd-query-bar và sd-table · panel, bộ lọc đã lưu, bộ lọc bắt buộc, ô tìm · thông số

Nguồn chính của gói. HTML (`Query Bar Saved Filters v2.dc.html`) là minh hoạ; khi khác nhau, theo file này. Đọc trên `main` ngày 09/11/2026: `components/query-bar/**`, `components/button/src/action-popover.scss`, `forms/directives/src/search-field.*`, `services/notify/src/components/toast/*`, `components/table/src/table.component.ts` (query bar), `services/table-filter/table-query-bar.util.ts`, `sd-table.md` mục Query bar mode.

Mã điểm đã chốt (C1–C9, M1–M7, B1–B5) khớp mục 09 của HTML.

## 0. Phạm vi

Làm:
1. **Một khung panel** cho cả ba panel của query bar (field picker, chip popover, bộ lọc đã lưu): bỏ `mat-menu`, dùng CDK Overlay và khung của Action Popover (C9, M1).
2. **Bộ lọc đã lưu**: giữ cơ chế (localStorage theo `savedFiltersKey`, lưu, chọn để áp, xoá). Đổi giao diện, tách nút xoá khỏi hàng, xoá có Hoàn tác, trạng thái trống và lỗi, khoá Lưu khi không có điều kiện, đọc lại ngày đúng kiểu (C1, C2, C4, C7, M4).
3. **Bộ lọc bắt buộc**: luôn có chip, không xoá được giá trị (B1–B5, M3).
4. **Ô tìm** của query bar dùng `sd-search-field`, thêm cỡ `xs` 28px (C3, M2).
5. **Mode inline**: ô “Thêm điều kiện” thay nút +, danh sách field dạng combobox (C8, M5).
6. **sd-table**: nối bộ lọc đã lưu ở chế độ query bar; Xoá lọc giữ giá trị bắt buộc (M3).

Giữ nguyên (không viết lại):
- Logic chip, staging của chip popover và ghi giá trị khi đóng (`onChipPopoverCommit`), `applyOn`, `#searchBase`, `canSearch`, `invalidFields`, ánh xạ `TableFilterValue` ↔ chip trong `table-query-bar.util.ts`.
- `appearance: 'flush'` (đã có, sd-table đã truyền).
- Giao diện của `sd-button` Action Popover: tách mixin không được làm đổi pixel nào.
- Panel của control con (`sd-select`, `sd-date`, `sd-datetime`, `sd-operator`, `sd-input*`).

Không làm:
- Trạng thái “đang dùng”, ghi đè, đổi tên, mặc định, chia sẻ, adapter lưu trữ (bản 1 đã bỏ, C1).
- Trạng thái Đang tải của bộ lọc đã lưu (chỉ ghi quy cách ở mục 5.6).
- Bộ lọc đã lưu trên mobile của sd-table (mobile không dùng query bar).

## 1. File

```
versions/v19/projects/sdcorejs-angular/
  assets/scss/core/_popover-panel.scss          // mới: mixin khung + hàng + tiêu đề + đường kẻ (tách từ action-popover.scss)
  components/button/src/action-popover.scss     // dùng lại mixin, không đổi giao diện
  forms/directives/src/search-field.component.{ts,scss,spec.ts}   // cỡ xs
  components/query-bar/
    sd-query-bar.md
    src/query-bar.component.{ts,html,scss,spec.ts}
    src/query-bar.model.ts
    src/query-bar.controls.scss                 // bỏ selector .mat-mdc-menu-panel.*, dùng class panel mới
    src/components/panel/                       // mới, nội bộ: overlay + trigger + focus (mục 2)
    src/components/field-picker/*
    src/components/chip-popover/*
    src/components/popover-chip/*
    src/components/saved-filters-menu/*
    src/components/actions-bar/*
    src/components/inline-chip/*, inline-value-chip/*, build-chip/*   // B3
  components/table/
    sd-table.md
    src/table.component.ts                      // savedFilters, #clearQueryBar
    src/services/table-filter/table-filter.model.ts
    src/services/table-filter/table-query-bar.util.ts (+ spec)
i18n/src/{vi,en,ja,ko,zh}.ts
showcase: trang sd-query-bar, trang sd-table (query bar)
CHANGELOG.md                                    // ## [Unreleased]
```

## 2. Khung panel chung

### 2.1 Mixin
Tách từ `components/button/src/action-popover.scss` sang `assets/scss/core/_popover-panel.scss`, giữ nguyên giá trị:

| Mixin | Giá trị |
| --- | --- |
| `panel` | `box-sizing: border-box; min-width: min(160px, calc(100vw - 16px)); max-width: min(320px, calc(100vw - 16px)); max-height: min(360px, calc(100dvh - 16px)); overflow: auto; border: 1px solid var(--sd-border); border-radius: var(--sd-radius-8, 8px); background: var(--sd-surface); color: var(--sd-text); box-shadow: 0 4px 12px rgb(15 23 42 / 14%), 0 1px 3px rgb(15 23 42 / 10%)` |
| `panel-list` | `panel` + `padding: 4px` |
| `item` | `display:flex; align-items:center; gap:8px; min-height:40px; padding:8px 12px; border-radius:4px; font-size:14px; line-height:20px`; hover và `:focus-visible` nền `color-mix(in srgb, var(--sd-action-accent, var(--sd-text)) 8%, transparent)`; `:focus-visible` outline 2px `--sd-focus-ring-color`, offset −2px; disabled `opacity:.45`; icon 18px màu `--sd-action-accent`; `@media (pointer: coarse)` min-height 44px |
| `heading` | `padding: 4px 12px; font-size: 12px; color: var(--sd-text-secondary)` |
| `divider` | `border-top: 1px solid var(--sd-border); margin: 4px 8px` |

`action-popover.scss` chỉ còn `@include`. Spec `button-action-popover.spec.ts` phải xanh không sửa; thêm một test so computed style của `.sd-action-popover` và `.sd-action-item` trước và sau (padding, border, radius, shadow, min-height).

### 2.2 Overlay nội bộ
Một cặp nội bộ trong `components/query-bar/src/components/panel/` (tên gợi ý `ɵSdQueryPanel` cho `ng-template` nội dung và `ɵSdQueryPanelTrigger` cho nút mở). Bước 0 đọc `SdActionPopover` (`components/button/src/action-popover.ts`) và dùng lại phần overlay, focus, đóng nếu tách được; không thì viết mới theo đúng hành vi dưới.

| Hành vi | Quy định |
| --- | --- |
| Vị trí | `FlexibleConnectedPositionStrategy` gắn vào trigger. Mặc định dưới, canh trái; bộ lọc đã lưu canh phải (như `xPosition="before"` hiện tại). Thiếu chỗ thì lật lên. Cách trigger 4px. `RepositionScrollStrategy`. |
| Bề rộng | Field picker 200–260px; chip popover 280–320px; bộ lọc đã lưu 220–320px (giữ như hiện tại). |
| Mở | Bấm trigger, Enter, Space; `openMenu(returnFocusTo?)` công khai như hiện tại. `aria-haspopup`, `aria-expanded`, `aria-controls` trên trigger. |
| Đóng | Esc; bấm ra ngoài (`outsidePointerEvents`); chọn một mục (kiểu danh sách); Tab ra khỏi panel (cả hai kiểu, như mat-menu). `closeMenu()` công khai. |
| Focus khi mở | Mở bằng bàn phím: danh sách focus ô tìm (nếu có) hoặc mục đầu không disabled; biểu mẫu focus control giá trị đầu tiên. Mở bằng chuột: như bàn phím, trừ danh sách không có ô tìm thì giữ focus ở panel. |
| Focus khi đóng | Về trigger, hoặc về `returnFocusTo` khi mở qua `openField()` (icon lọc ở header cột sd-table). Đóng do bấm ra ngoài vào một phần tử focus được: không kéo focus về. |
| Sự kiện | Phát mở và đóng để `query-bar.component` thay `(menuOpened)` / `(closed)` hiện tại (`openChipPopover`, `onMenuClosed`, `focusFind`, `query.set('')`). |
| Nhiều panel | Mở panel này thì đóng panel khác của cùng query bar. |
| Reduced motion | Không có animation mở (Action Popover không có); không thêm. |
| Panel class | `sd-query-panel` + `sd-query-panel--list` hoặc `sd-query-panel--form`, cộng class riêng (`c-field-picker-menu`, `c-chip-popover`, `c-saved-filters-menu`) để style cũ chuyển sang dễ. |

Bỏ khỏi query bar: `MatMenuModule`, `MatMenu`, `MatMenuTrigger`, `matMenuContent`, mọi `::ng-deep .mat-mdc-menu-panel.*`, phần vá margin icon của `mat-menu-item` trong `saved-filters-menu.component.scss`.

### 2.3 Vai trò trợ năng
| Panel | Vai trò |
| --- | --- |
| Field picker | `role="listbox"`, mục `role="option"`, mục đã dùng `aria-disabled="true"`; mục đang trỏ qua `aria-activedescendant` của ô tìm hoặc ô Thêm điều kiện (combobox). |
| Chip popover | `role="dialog"`, `aria-labelledby` trỏ tới nhãn field ở header. |
| Bộ lọc đã lưu | `role="menu"`; nút áp bộ lọc và “Lưu bộ lọc hiện tại” là `role="menuitem"`; nút xoá là `button` thường nằm cạnh, ngoài vòng mũi tên (mục 5.3). |

## 3. Field picker (M6, M7, M5)

| Phần | Hiện tại | Mới |
| --- | --- | --- |
| Khung | mat-menu, min 200, max 260 | `panel-list`, cùng bề rộng |
| Ô tìm (mode popover, nút +) | 32px, viền `--sd-query-bar-border`, bo 6px, margin 4px 8px | `sd-search-field size="sm"` trong panel, margin `4px 4px 6px`, `role="combobox"`, `aria-controls` là listbox |
| Ô tìm (mode inline) | như trên | Không có trong panel; ô “Thêm điều kiện” bên ngoài đóng vai combobox (mục 8) |
| Tiêu đề nhóm | 11px in hoa, `letter-spacing .04em`, padding 8px 16px 4px | mixin `heading` (12px, không in hoa) |
| Hàng | 36px, chữ 13px, icon 16px | mixin `item` (40px, chữ 14px); icon field 16px `--sd-query-bar-text-secondary`; tag kiểu `Roboto Mono` 11px muted bên phải; field đã dùng có dấu check 14px primary và disabled |
| Trống | `.c-field-empty` 12px 16px, 13px | padding 12px, 13px, `--sd-text-secondary` |
| Lọc | không dấu, theo nhãn | giữ |
| Đổi field trong chip (`switchPickerMenu`) | input của chip popover, query bar không truyền | Bỏ input, nhánh template và test (M7) |

Bàn phím trong panel: ↑ ↓ Home End qua các option không disabled; Enter chọn; khi focus ở ô tìm, ↓ vào danh sách và mũi tên vẫn điều khiển `aria-activedescendant` (không chuyển focus thật khỏi ô). Không typeahead theo chữ cái.

## 4. Chip popover

- Khung `panel` (không padding), `overflow: hidden` để header nằm trong bo 8px.
- Header, thân, độ rộng, 8 nhánh control giữ nguyên như `chip-popover.component.html` / `.scss` (header 10px 12px viền dưới `--sd-query-bar-border-soft`, icon 16px primary, nhãn 13/500, `sd-operator` bên phải; thân 10px 12px gap 12px).
- `(click)` và `(keydown.enter)` `stopPropagation` trong header và thân không còn cần cho mat-menu; giữ nếu vẫn ngăn đóng nhầm, ghi lý do trong `why:`.
- Ghi giá trị khi đóng (`onMenuClosed` → `commit`) giữ nguyên cho mọi đường đóng: Esc, bấm ngoài, Tab ra.
- Field bắt buộc: mục 6.3.

## 5. Bộ lọc đã lưu

### 5.1 Nút kích hoạt
Không đổi: 28×28 (32 ở comfortable), viền 1px `--sd-query-bar-border`, bo 6px, icon `bookmark_border` 18px, hover viền và icon primary, khoá khi không có key, tooltip như cũ. Thêm `aria-haspopup="menu"`, `aria-expanded`, `aria-label` (key `saved-filters.tooltip`).

### 5.2 Panel
```
[panel-list 220–320px]
  heading   “Bộ lọc đã lưu”                        saved-filters.heading (mới)
  hàng × n  [nút áp: icon filter_alt 18 · tên]  [nút xoá 32×32]
  divider
  item      [icon bookmark_add 18, --sd-primary] “Lưu bộ lọc hiện tại”   saved-filters.save
```
- Hàng: `display:flex; align-items:center; gap:2px; border-radius:4px`. Nút áp: `flex:1`, `min-height:40px`, `padding: 8px 4px 8px 12px`, gap 8px, tên cắt bằng `…`. Nút xoá: 32×32, bo 4px, icon `delete` 18px, `margin-right:4px`, `aria-label` = `saved-filters.delete` với `{name}`.
- Hover hoặc focus-within của hàng: nền 8% như `item`. Nút xoá ẩn (`opacity:0`, vẫn focus được) tới khi hàng hover hoặc focus-within; luôn hiện khi `pointer: coarse` (40×40). Hover nút xoá: nền `color-mix(--sd-error 8%)`, icon `--sd-error`.
- Chọn hàng: như `onApplyFilter` hiện tại, cộng quy tắc B4 (mục 6.4), rồi đóng panel.

### 5.3 Bàn phím
- ↑ ↓ đi qua các nút áp và “Lưu bộ lọc hiện tại”; Home End.
- → hoặc Tab trên nút áp: sang nút xoá của hàng đó; ← về nút áp. Delete trên nút áp: xoá bộ lọc đó.
- Enter, Space: áp (nút áp) hoặc xoá (nút xoá).
- Sau khi xoá: focus sang nút áp của hàng kế; hết hàng thì “Lưu bộ lọc hiện tại”.

### 5.4 Lưu
- Khoá (`disabled`, opacity .45) khi không có chip nào có giá trị và ô tìm rỗng (`activeCount() === 0 && !search().trim()`). Hiện tại vẫn lưu được bộ lọc rỗng.
- Đặt tên bằng `SdConfirmService.withInput` như hiện tại. Lưu xong: không đổi trạng thái thanh, panel đóng.
- Snapshot như hiện tại (`currentQuery()`: filters, logic, search khi `showSearch`), C6.

### 5.5 Xoá và Hoàn tác (C7)
- Xoá ngay, không hỏi. Ghi localStorage.
- Toast qua `SdNotifyService`: type `info`, title `saved-filters.deleted` (“Đã xoá bộ lọc”), message là tên, nút hành động `saved-filters.undo` (“Hoàn tác”). Toast trên main đã có `data.actionLabel` và `onActionClick`; Bước 0 xác nhận tên tham số ở service.
- Hoàn tác: chèn lại đúng vị trí cũ, ghi localStorage. Hoàn tác khi danh sách đã đổi (lưu thêm): vẫn chèn về vị trí cũ, kẹp trong độ dài hiện tại.

### 5.6 Trạng thái
| Trạng thái | Điều kiện | Hiển thị |
| --- | --- | --- |
| Trống | danh sách rỗng, đọc được | dòng `saved-filters.empty`, padding 12px, 13/18 `--sd-text-secondary` |
| Đọc lỗi | `JSON.parse` lỗi hoặc dữ liệu không phải mảng `SdSavedFilter` | icon `error` 16px `--sd-error` + `saved-filters.read-error`, chữ `--sd-text`. Lưu vẫn được; lưu đầu tiên thay danh sách hỏng. Bỏ qua từng mục sai dạng (thiếu id, name, query) thay vì bỏ cả danh sách. |
| Ghi lỗi | `localStorage.setItem` throw (quota, bị chặn) khi lưu, xoá, hoàn tác | Danh sách trong bộ nhớ quay về trạng thái trước; toast type `error`, message `saved-filters.write-error`. Không hiện nội dung exception. |
| Đang tải | không áp dụng cho localStorage | Không làm. Quy cách để dành: spinner 14px + `loading`, cùng kiểu dòng Trống. |

### 5.7 Đọc lại ngày (M4)
Parse với reviver chuyển chuỗi đúng dạng `Date#toJSON` (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/`) thành `Date`, như `table-query-params.util.ts`. Không import từ components/table (sai chiều phụ thuộc): Bước 0 đề xuất chỗ dùng chung (`@sdcorejs/utils` nếu có helper tương đương) hoặc sao một hàm nhỏ có comment `why:` trỏ về nguồn.

## 6. Bộ lọc bắt buộc (B1–B5, M3)

### 6.1 B1: required kéo theo pinned
- `field.required === true` được xử lý như `pinned: true` ở mọi chỗ đang đọc `pinned`: `isPinned`, `pickerFields`, `removeFilter`, `clearAll`, nút × của ba loại chip, `onChipPopoverCommit` (không bỏ chip rỗng).
- Thiếu chip cho field bắt buộc hoặc ghim trong `filters`: query bar tự thêm chip rỗng (toán tử mặc định của field), theo thứ tự `fields`, đứng trước các chip khác. Thêm trong cùng lượt cập nhật `filters`, không phát `apply`.
- `emptyTextFor`: required vẫn “Chọn giá trị” (`placeholder.select-value`), pinned không required vẫn “Tất cả”.

### 6.2 B2: Xoá lọc
- `clearAll()`: chip của field required giữ nguyên (cả toán tử và giá trị); chip pinned không required về rỗng như hiện tại; chip khác bỏ.
- `activeCount` cho nhãn “Xoá tất cả (n)” và `clearCount` không đếm chip required. Không còn gì để xoá (chỉ còn chip required có giá trị, không chip khác có giá trị) thì nút Xoá lọc khoá.
- **sd-table** (`#clearQueryBar`, truyền qua `onClearAll`): kiểm tra và sửa để kết quả giống `clearAll()` ở trên với quick filter, external filter và column filter bắt buộc; giữ `default` của field không bắt buộc như hiện tại. `clearDisabled` của bảng (`!#queryBarDirty()`) không coi giá trị bắt buộc là “bẩn”.

### 6.3 B3: không bỏ trống được giá trị
| Kiểu | Quy định |
| --- | --- |
| Toán tử | `allowedOperators` của field required bỏ `NULL`, `NOT_NULL`. |
| `values`, `lazy-values` một giá trị | `sd-select` không clearable, không có lựa chọn rỗng; chọn lại giá trị đang chọn không bỏ chọn. |
| `values`, `lazy-values` nhiều giá trị | Thay đổi làm mảng rỗng thì giữ giá trị trước, hiện dòng `required-min-one` dưới control (12px `--sd-text-secondary`, `aria-live="polite"`). Nếu `sd-select` hỗ trợ khoá từng mục thì khoá mục cuối còn chọn thay vì hoàn lại (Bước 0). |
| `string`, `number` (popover và inline seamless) | Xoá hết rồi đóng popover hoặc rời ô: trả lại giá trị trước. |
| `date`, `datetime`, `BETWEEN` | Như trên; `BETWEEN` cần ít nhất một đầu. |
| `boolean` | Không có trạng thái bỏ chọn (giữ). |
| `applyOn: 'commit'` | Chip required không bao giờ bị bỏ khỏi thanh khi rỗng. |

Áp dụng cho chip popover, `inline-chip`, `inline-value-chip`, `build-chip` (field required không đi qua build chip vì luôn có chip sẵn; vẫn chặn nếu host gọi).

### 6.4 B4: áp bộ lọc đã lưu
`onApplyFilter(saved)`:
1. Lấy `saved.query.filters`, bỏ mục có field không còn trong `fields` (field lạ) và mục của field `disabled`.
2. Với mỗi field required hoặc pinned: nếu bộ lọc đã lưu có chip **có giá trị** cho field đó thì dùng; không thì giữ chip hiện tại (kể cả toán tử).
3. Ghép theo B1 (chip bắt buộc, ghim đứng đầu theo thứ tự `fields`), rồi `logic`, `search` như hiện tại, rồi `triggerApply()`.

### 6.5 B5
Lần đầu chưa có giá trị và không có `default`: chip lỗi (`.c-chip-invalid`, `.c-token-invalid`), dòng nhắc của host, chặn Tìm kiếm và Enter. Giữ như hiện tại.

### 6.6 Trợ năng
Chip required: `aria-required="true"`. Dòng `required-min-one` được `aria-describedby` từ control giá trị.

## 7. Ô tìm (C3, M2)

### 7.1 `sd-search-field` cỡ `xs`
- `ɵSdSearchFieldSize` thêm `'xs'`; host class `sd-xs`.
- `:host(.sd-xs)`: `height: 28px; padding: 0 4px 0 8px; gap: 6px; font-size: 13px`; icon 16px; nút xoá 20×20. Khung, viền, hover, focus, disabled như `sm`. `pointer: coarse`: như các cỡ khác (min-height 44px, chữ 16px, nút xoá 40px).
- Spec của primitive thêm trường hợp `xs`.

### 7.2 Trong query bar
- Thay `.c-search` bằng `<sd-search-field [size]="density === 'compact' ? 'xs' : 'sm'" clearable>` với `<input sdSearchFieldInput>`. Bề rộng tối thiểu 220px như hiện tại; divider 16px sau ô giữ.
- `input`: `aria-label` = `option.searchPlaceholder` nếu có, không thì `core.component.query-bar.search` (mới); placeholder như hiện tại; `enterkeyhint="search"`; `autocomplete="off"`.
- Enter: `applySearch()` như hiện tại. Nút xoá (`cleared`) và Esc khi có chữ: `setSearch('')` rồi `applySearch()`. Esc khi rỗng: không làm gì.
- Bỏ style `.c-search*` và `.c-search-kbd` không dùng.
- `data-autoid`: `<autoId>-search` cho input, `<autoId>-search-clear` cho nút xoá (primitive tự thêm `-clear`).

## 8. Mode inline: ô “Thêm điều kiện” (C8, M5)

- Thay nút `.c-add-filter` (chỉ mode inline) bằng ô nhập cuối hàng chip: không viền, cao 28/32px theo density, `min-width:150px`, `flex: 1 1 150px`, padding `0 8px`, icon `add` 16px `--sd-query-bar-text-muted`, chữ 13px, placeholder `add-condition` (“Thêm điều kiện”). Focus: vòng trong 1px `--sd-primary` (`box-shadow: inset 0 0 0 1px`), bo 6px.
- `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` (listbox của field picker), `aria-activedescendant`.
- Mở danh sách: bấm hoặc chạm vào ô; bấm vào chỗ trống của `.c-query-bar__main` (không trúng chip hay control); gõ ký tự; ↓ hoặc Alt + ↓.
- Không mở: focus bằng Tab; focus quay về ô sau khi xong một chip.
- Gõ: lọc danh sách (không dấu), mục đầu không disabled được trỏ sẵn. Enter: chọn mục đang trỏ → `beginBuild(field)`, xoá chữ trong ô.
- Danh sách đóng, ô rỗng, Enter: như nút Tìm kiếm (`triggerApply`, chặn khi còn field bắt buộc rỗng).
- Backspace khi ô rỗng: lần đầu focus chip cuối; lần nữa xoá chip đó (không xoá chip required hoặc pinned).
- Esc: đóng danh sách, xoá chữ, giữ focus.
- Xong chip (commit value, huỷ build): focus về ô, danh sách không mở.
- Hết field (`addDisabled`): ô `disabled`, tooltip giữ nhãn hiện tại.
- Mode popover: giữ nút + (mở field picker có ô tìm trong panel).
- `data-autoid`: `<autoId>-add-condition`.

## 9. sd-table

### 9.1 Bộ lọc đã lưu
- Option mới trong nhóm query bar của `filter` (tên theo shape đang có trong `table-filter.model.ts`, ví dụ `filter.queryBar.savedFilters`): `savedFilters?: { key: string }`. Có thì bảng truyền `showSavedFilters: true` và `savedFiltersKey: 'sd-table:' + key`.
- Áp bộ lọc đã lưu đi qua đường áp hiện có của bảng (query bar `apply` → `table-query-bar.util` → `TableFilterValue`, đọc dữ liệu một lần). Field lạ hoặc filter disabled bị bỏ như khi đọc URL.
- Ghi chú trong `sd-table.md`: chỉ có ở chế độ query bar, desktop; không lưu sắp xếp, cột, số dòng.

### 9.2 Xoá lọc
Mục 6.2.

### 9.3 Không đổi
`appearance: 'flush'`, padding 8px 12px, vị trí `sdTableQuickSearchRightDef`, ô tìm là `quickSearch.term` (nay vẽ bằng `sd-search-field` qua query bar, mục 7).

## 10. Token
Không thêm token. Màu chỉ từ `--sd-*` có fallback; không hex mới (`check:scss-hex`). Không `!important` mới, không `::ng-deep` mới (bỏ được nhiều cái cũ).

## 11. i18n
Key `core.component.query-bar.*`, đủ 5 locale.

| Key | vi | en | Trạng thái |
| --- | --- | --- | --- |
| `saved-filters.heading` | Bộ lọc đã lưu | Saved filters | mới |
| `saved-filters.delete` | Xoá {name} | Delete {name} | đổi: thêm `{name}` |
| `saved-filters.deleted` | Đã xoá bộ lọc | Filter deleted | mới |
| `saved-filters.undo` | Hoàn tác | Undo | mới (dùng key chung nếu đã có) |
| `saved-filters.read-error` | Không đọc được bộ lọc đã lưu trên trình duyệt này. | Saved filters on this browser can't be read. | mới |
| `saved-filters.write-error` | Không lưu được bộ lọc. | The filter couldn't be saved. | mới |
| `search` | Tìm kiếm | Search | mới |
| `search-clear` | Xoá từ khoá | Clear search | mới |
| `add-condition` | Thêm điều kiện | Add condition | mới |
| `required-min-one` | Chọn ít nhất một giá trị. | Choose at least one value. | mới |

Giữ: `saved-filters.tooltip`, `.tooltip-disabled`, `.empty`, `.save`, `.name-label`, `search-placeholder`, `all`, `placeholder.select-value`, `no-fields`, `add-filter`.

## 12. E2E (`data-autoid`, chỉ khi có autoId)
| Phần tử | Giá trị |
| --- | --- |
| Nút bộ lọc đã lưu | `<autoId>-saved-filters` |
| Nút áp | `<autoId>-saved-filter-<index>` |
| Nút xoá | `<autoId>-saved-filter-<index>-delete` |
| Lưu bộ lọc hiện tại | `<autoId>-saved-filters-save` |
| Panel | `<autoId>-panel-field-picker`, `-panel-chip`, `-panel-saved-filters` |
| Ô tìm | `<autoId>-search`, `<autoId>-search-clear` |
| Ô Thêm điều kiện | `<autoId>-add-condition` |

Giữ mọi autoId chip hiện có.

## 13. Test

Quy ước: test RED trước; tên test có mã; không `fit`/`xit`; không chờ thời gian thật; mỗi bug từ review có test `-B-xx`.

### 13.1 Khung và overlay (`QB-P`)
| Mã | Nội dung |
| --- | --- |
| QB-P-01 | Computed style của `.sd-action-popover`, `.sd-action-item` không đổi sau khi tách mixin (sd-button). |
| QB-P-02 | Ba panel có `sd-query-panel` và đúng modifier; không còn `.mat-mdc-menu-panel` trong overlay của query bar. |
| QB-P-03 | Vị trí: mở dưới; thiếu chỗ thì lật lên (stub kích thước viewport); bộ lọc đã lưu canh phải. |
| QB-P-04 | Esc, bấm ngoài, Tab ra đóng panel; chip popover ghi giá trị ở cả ba đường. |
| QB-P-05 | Focus khi mở (danh sách, biểu mẫu) và khi đóng (trigger, `returnFocusTo`); bấm ngoài vào nút khác không kéo focus về. |
| QB-P-06 | Mở panel này đóng panel kia. |
| QB-P-07 | `aria-haspopup`, `aria-expanded`, `aria-controls`; role listbox, dialog, menu đúng. |
| QB-P-08 | `openField()` (icon lọc ở header cột bảng) vẫn mở đúng chip và trả focus về icon. |

### 13.2 Field picker (`QB-FP`)
| Mã | Nội dung |
| --- | --- |
| QB-FP-01 | Hàng 40px (44 coarse), chữ 14px, tiêu đề nhóm theo heading. |
| QB-FP-02 | Lọc không dấu; trống thì dòng trống. |
| QB-FP-03 | ↑ ↓ Home End bỏ qua mục disabled; Enter chọn; không typeahead. |
| QB-FP-04 | Mode popover: ô tìm là `sd-search-field` sm, combobox điều khiển listbox. |
| QB-FP-05 | Không còn input `switchPickerMenu`; type test `@ts-expect-error` khi truyền. |

### 13.3 Bộ lọc đã lưu (`QB-S`)
| Mã | Nội dung |
| --- | --- |
| QB-S-01 | Hàng gồm hai nút ngang hàng; không có phần tử tương tác lồng nhau (`button button`, `[role=button]` trong `button`). |
| QB-S-02 | Nút xoá ẩn tới khi hover, focus-within; luôn hiện với `pointer: coarse` (stub matchMedia). |
| QB-S-03 | Bàn phím 5.3: ↑ ↓ bỏ qua nút xoá, → sang xoá, ← về, Delete xoá, focus sau xoá. |
| QB-S-04 | Xoá ghi localStorage, phát toast info có actionLabel; Hoàn tác chèn lại đúng vị trí, ghi localStorage. |
| QB-S-05 | Lưu khoá khi không có điều kiện và ô tìm rỗng; mở khi có một trong hai. |
| QB-S-06 | Đọc lỗi: JSON hỏng → dòng lỗi; mảng có mục sai dạng → bỏ mục đó, giữ mục đúng. |
| QB-S-07 | Ghi lỗi: `setItem` throw khi lưu, xoá, hoàn tác → danh sách về như trước, toast error, chuỗi exception không có trong DOM. |
| QB-S-08 | Ngày: lưu bộ lọc có `Date`, tải lại (tạo component mới) → giá trị là `Date`, chip hiện đúng ngày. |
| QB-S-09 | Khoá cũ `sd-query-bar:savedFilters:<key>` đọc được, dữ liệu cũ không mất. |
| QB-S-10 | autoId mục 12. |

### 13.4 Bắt buộc (`QB-R`)
| Mã | Nội dung |
| --- | --- |
| QB-R-01 | required không pinned: tự có chip rỗng, không ×, không trong picker; không phát apply khi tự thêm. |
| QB-R-02 | `clearAll()`: giữ required, reset pinned, bỏ chip khác; `activeCount` không đếm required; nút khoá khi chỉ còn required. |
| QB-R-03 | Toán tử của required không có NULL, NOT_NULL. |
| QB-R-04 | Một giá trị: không bỏ chọn được (popover, inline). |
| QB-R-05 | Nhiều giá trị: thay đổi làm rỗng → giữ giá trị trước, hiện dòng nhắc, `aria-describedby`. |
| QB-R-06 | string, number, date, datetime, BETWEEN: xoá hết rồi đóng hoặc rời ô → giá trị trước. |
| QB-R-07 | `applyOn: 'commit'`: chip required rỗng không bị bỏ. |
| QB-R-08 | `onApplyFilter`: bộ lọc đã lưu thiếu field required, pinned → giữ chip hiện tại; có giá trị → dùng giá trị đã lưu; field lạ, disabled bị bỏ; thứ tự đúng B1. |
| QB-R-09 | B5: lần đầu rỗng vẫn lỗi, chặn Tìm kiếm và Enter. |
| QB-R-10 | `aria-required` trên chip required. |

### 13.5 Ô tìm (`QB-F`)
| Mã | Nội dung |
| --- | --- |
| QB-F-01 | `sd-search-field` `xs`: 28px, padding, chữ 13px, nút xoá 20px; `sm` không đổi. |
| QB-F-02 | Query bar compact dùng `xs`, comfortable dùng `sm`. |
| QB-F-03 | `aria-label` theo `searchPlaceholder` hoặc key `search`. |
| QB-F-04 | Nút xoá và Esc: xoá chữ rồi áp một lần; Esc khi rỗng không áp. |
| QB-F-05 | Enter áp, bị chặn khi còn required rỗng (giữ hành vi cũ). |

### 13.6 Inline thêm điều kiện (`QB-I`)
| Mã | Nội dung |
| --- | --- |
| QB-I-01 | Mode inline không còn nút +, có ô combobox với đủ thuộc tính ARIA. |
| QB-I-02 | Bấm ô, bấm chỗ trống của vùng chip, gõ, ↓, Alt + ↓ mở danh sách; Tab tới không mở. |
| QB-I-03 | Gõ lọc; mục đầu được trỏ; Enter → `beginBuild`, chữ trong ô bị xoá. |
| QB-I-04 | Ô rỗng + danh sách đóng + Enter → `triggerApply`; chặn khi required rỗng. |
| QB-I-05 | Backspace hai lần: focus rồi xoá chip cuối; không xoá chip required, pinned. |
| QB-I-06 | Esc đóng, xoá chữ; xong chip thì focus về ô, danh sách không mở. |
| QB-I-07 | `addDisabled` → ô disabled. Mode popover vẫn có nút +. |

### 13.7 sd-table (`QB-T`)
| Mã | Nội dung |
| --- | --- |
| QB-T-01 | `savedFilters.key` bật nút, khoá localStorage `sd-query-bar:savedFilters:sd-table:<key>`. Không có option thì không có nút. |
| QB-T-02 | Áp bộ lọc đã lưu: một lần đọc, `filterReq` đúng; field không còn trong bảng bị bỏ. |
| QB-T-03 | Xoá lọc của bảng giữ quick filter, external filter, column filter bắt buộc; `clearDisabled` không tính giá trị bắt buộc. |
| QB-T-04 | Ô tìm của bảng ở chế độ query bar là `sd-search-field`, giữ `quickSearch.term`, placeholder của quick search. |
| QB-T-05 | Spec query bar mode hiện có (`table.component.query-bar.spec.ts`) xanh sau khi đổi selector mat-menu. |

### 13.8 E2E và hình ảnh (showcase, Playwright)
- QB-E-01 Popover mode: thêm điều kiện bằng +, sửa chip, lưu bộ lọc, chọn lại, xoá rồi Hoàn tác.
- QB-E-02 Inline mode: bấm vào thanh, gõ “kh”, Enter, chọn giá trị, Backspace hai lần.
- QB-E-03 Bảng có quick filter bắt buộc: Xoá lọc, áp bộ lọc đã lưu thiếu field đó.
- QB-E-04 Chỉ bàn phím qua cả thanh và ba panel.
- QB-E-05 Bảng hẹp 700px: panel lật lên khi ở cuối trang.
- Ảnh chụp so với HTML: mục 01, 02, 03, 04, 05, 06, 07 ở light, dark, RTL; `forced-colors` cho panel.

## 14. Review độc lập
- R1 sau checkpoint 3 (khung panel và ba panel đã đổi): phiên Claude Code mới, không có lịch sử của phiên tác giả, không sửa code. Kiểm mục 2–5, 13.1–13.3, thử phá: bỏ trả focus khi đóng; cho phép nút lồng nút; bỏ ghi giá trị khi Tab ra khỏi chip popover → phải có test đỏ.
- R2 sau checkpoint cuối: toàn bộ file này, lệnh đầy đủ, thử phá thêm: cho `clearAll` xoá required; cho `onApplyFilter` thay toàn bộ filters; bỏ reviver ngày → phải có test đỏ.
- Báo cáo `.sdcorejs/handoff/design-query-bar-panels/reviews/R1.md`, `R2.md`: Chặn / Nên sửa / Ghi chú, mỗi mục có `file:dòng` và mục spec.

## 15. Checkpoint (mỗi checkpoint một commit, test RED trước)
1. Mixin `_popover-panel.scss`, `action-popover.scss` dùng lại (QB-P-01); `sd-search-field` cỡ `xs` (QB-F-01); overlay nội bộ (QB-P-03…07 với một panel thử).
2. Bộ lọc đã lưu trên overlay mới: mục 5 (QB-S).
3. Field picker và chip popover trên overlay mới, bỏ `mat-menu` khỏi query bar, bỏ `switchPickerMenu` (QB-P-02, QB-P-08, QB-FP). **R1.**
4. Bắt buộc B1–B5 ở query bar và `#clearQueryBar` của bảng (QB-R, QB-T-03).
5. Ô tìm trong query bar và ô Thêm điều kiện mode inline (QB-F-02…05, QB-I).
6. sd-table `savedFilters` (QB-T-01, 02, 04, 05); `sd-query-bar.md`, `sd-table.md`; i18n 5 locale; showcase; `CHANGELOG.md`; `npm run sync`, `check:sync`. **R2.**

## 16. Câu hỏi cho Bước 0
1. `SdActionPopover` (`components/button/src/action-popover.ts`) tách được phần overlay, focus, đóng để query bar dùng lại không? Nếu không, đề xuất cấu trúc `components/query-bar/src/components/panel/`.
2. Mixin đặt ở `assets/scss/core/_popover-panel.scss` có hợp quy ước `assets/scss/core` hiện tại không, và `check:scss-hex`, `test:theme` có cần cập nhật danh sách file không.
3. `Size` trong `@sdcorejs/utils/models` có `'xs'` chưa; thêm cỡ cho `sd-search-field` có ảnh hưởng chỗ nào khác (kanban, quick search, form builder, sd-select).
4. `sd-select` nhiều giá trị có cách khoá một mục (mục cuối còn chọn) không; nếu không, dùng cách hoàn lại giá trị ở 6.3.
5. Tên tham số `actionLabel` và callback khi bấm của `SdNotifyService`; có key i18n chung cho “Hoàn tác” chưa.
6. Shape hiện tại của nhóm query bar trong `table-filter.model.ts` để đặt `savedFilters`; `#clearQueryBar` đang xử lý required thế nào.
7. Reviver ngày: helper có sẵn ở `@sdcorejs/utils` không.
8. Danh sách spec sẽ sửa vì đổi selector mat-menu, và ước lượng số test thêm cho từng checkpoint.
