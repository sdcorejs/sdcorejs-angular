# Handoff: SD Core UI · Đợt 1 (thang chiều cao, primitive tìm kiếm, token table, segmented, form-builder, kanban)

## Overview
Đợt 1 sửa các vấn đề hình ảnh tìm thấy trong design review `@sdcorejs/angular`. Thứ tự làm như sau:
- A. Thêm thang chiều cao control dùng chung.
- B. Gộp ba bản ô tìm kiếm tự viết thành một primitive nội bộ, và chốt quy ước "chọn": segmented cho chế độ, tab cho điều hướng.
- C. Đổi token màu của `sd-table` sang dạng dẫn xuất từ palette.
- Sau đó áp vào `sd-segmented`, `sd-form-builder`, `sd-kanban`.

Redesign bố cục `sd-table` (toolbar, thanh chọn, pager, trạng thái tải/rỗng) **không** nằm trong đợt này.

## About the Design Files
Các file HTML trong bundle là **bản tham chiếu thiết kế viết bằng HTML**. Chúng cho thấy giao diện và hành vi mong muốn, không phải mã production để copy. Nhiệm vụ là dựng lại các thiết kế này trong codebase Angular hiện có: standalone component, signal input, SCSS đọc token `--sd-*`. Làm theo đúng convention trong `CLAUDE.md` của repo.

- `Wave 1 Spec.dc.html` là **nguồn chính**. File này có bảng giá trị hiện tại → mục tiêu cho từng mục, kèm hình minh hoạ.
- `SD Core Design Review.dc.html` là bản review đầy đủ, có so sánh hiện trạng và đề xuất. Chỉ dùng để hiểu bối cảnh. Phần sd-table trong đó ngoài phạm vi, trừ mục 02C (token).
- Mở file `.dc.html` bằng trình duyệt; `support.js` phải nằm cùng thư mục.

## Fidelity
**High-fidelity.** Màu, kích thước, bo góc, khoảng cách là giá trị cuối cùng. Các giá trị này lấy từ token đang có (`default.scss`, `_scales.scss`, `_component-tokens.scss`) hoặc là biểu thức `color-mix()` từ token đó. Không thêm hex mới; `check:scss-hex` phải xanh.

## Quy tắc repo bắt buộc (trích CLAUDE.md / THEME.md)
- Chỉ sửa `versions/v19/**`, rồi chạy `npm run sync` và `npm run check:sync`. Không sửa tay `versions/v20|v21|v22`, `published-docs`, `published-pages`, `dist`.
- Component token chỉ được khai báo trong `assets/scss/themes/_component-tokens.scss`. `:host` có thể alias sang tên local, nhưng không được gán giá trị mới.
- Chỉ thay literal bằng scale token khi giá trị bằng đúng nhau. Mọi tham chiếu token mới phải có fallback bằng giá trị cũ, ví dụ `var(--sd-control-height-md, 40px)`.
- Rule focus không chứa hex. Dùng `--sd-focus-ring-*` hoặc `currentColor`.
- Viết spec RED trước khi sửa hành vi. Chạy full Karma tuần tự.
- Rà API consistency theo mục "Review bắt buộc" trong CLAUDE.md. Không đổi hay rename public API ngoài phạm vi này.
- i18n giữ parity 5 locale (vi/en/ja/ko/zh) nếu thêm key.

## Screens / Views

### A. Thang chiều cao control
- Thêm vào `$scales` trong `assets/scss/themes/_scales.scss`:
  - `control-height-sm: 32px`
  - `control-height-md: 40px`
  - `control-height-lg: 48px`
  - `control-height-coarse: 44px`
- Thay literal bằng token (không đổi hình ảnh):
  - `components/button/src/button.component.scss`: `.c-sm/.c-md/.c-lg` height 32/40/48 và width của `.c-square`.
  - `assets/scss/core/form.scss`: `--mat-form-field-container-height` 40 (`.sd-md`) và 32 (`.sd-sm`).
- Cập nhật bảng Scales trong `assets/THEME.md`.

### B. Primitive tìm kiếm nội bộ + quy ước chọn
- Đây là component nội bộ: export có tiền tố `ɵ`, không đưa vào README hay showcase docs. Đặt ở entry point mà kanban, table và form-generic import được mà không tạo vòng phụ thuộc. Đề xuất vị trí trước khi tạo file.
- Kích thước:
  - **sm:** cao `--sd-control-height-sm`, padding ngang 8px, gap 6px, bo `--sd-radius-6`, icon `search` 18px.
  - **md:** cao `--sd-control-height-md`, padding 12px, gap 8px, bo `--sd-radius-8`, icon 20px.
- Giao diện chung:
  - Chữ 14px; khi `pointer: coarse` là 16px và chiều cao tối thiểu `--sd-control-height-coarse`.
  - Viền 1px `--sd-border`, nền `--sd-surface`, màu icon và placeholder `--sd-text-secondary`.
  - Focus: `:focus-within` dùng `outline: var(--sd-focus-ring-width,2px) solid var(--sd-focus-ring-color)`, `outline-offset: 1px`.
  - Disabled: nền `--sd-surface-muted`, chữ `--sd-disabled-text`.
  - Nút xoá chỉ hiện khi có giá trị: 24px (sm) / 28px (md) / 40px (coarse), có aria-label.
  - Có slot cuối để chèn nội dung riêng (ví dụ gợi ý ↵ của table).
- `<input>` thật phải có accessible name. **Không** đặt `aria-hidden` trên input hay wrapper.
- Áp vào ba nơi:
  - `.sd-kanban__search`, size sm, giữ width 280px.
  - `.sd-quick-search-field`, size sm. Giữ Enter để áp dụng, gợi ý ↵, disabled khi thiếu filter bắt buộc, aria-describedby, 44px ở container hẹp.
  - `.fb-search`, size sm. Giữ Escape để xoá và `focusPalette()`.
- Quy ước chọn: chế độ/kiểu xem dùng `sd-segmented`; điều hướng giữa vùng nội dung dùng tab gạch chân. Phần thực hiện nằm trong mục form-builder.

### C. Token table dẫn xuất từ palette
- Sửa trong `_component-tokens.scss`, light và dark dùng cùng biểu thức. Mix với `--sd-table-bg`, không mix với surface.
  - `table-header-bg`: `color-mix(in srgb, var(--sd-surface-muted) 50%, var(--sd-table-bg))`
  - `table-header-text`: `var(--sd-text)`
  - `table-group-header-mix`: `var(--sd-table-header-bg)`
  - `table-row-divider`: `color-mix(in srgb, var(--sd-border) 45%, var(--sd-table-bg))`
  - `table-row-hover-bg`: `color-mix(in srgb, var(--sd-text) 4%, var(--sd-table-bg))`
  - `table-row-selected-bg`: `color-mix(in srgb, var(--sd-primary) 9%, var(--sd-table-bg))`
  - `table-row-activated-bg`: `color-mix(in srgb, var(--sd-primary) 14%, var(--sd-table-bg))`
  - `table-group-row-bg`: `color-mix(in srgb, var(--sd-primary) 4%, var(--sd-table-bg))`
  - `table-group-row-border`: `var(--sd-table-row-divider)`
  - `table-select-arrow`: `var(--sd-text-secondary)`
  - `table-spinner`: `var(--sd-primary)`
- Giữ nguyên: `table-bg`, `table-tree-level-*`, `table-export-*`.
- Màu viết thẳng trong `table.component.scss`:
  - Icon sort: giữ data-URI nhưng dùng làm `mask-image` trên pseudo-element, `background-color: var(--sd-text-secondary)`; cột đang sort dùng `var(--sd-text)`. Không đổi template.
  - `.cdk-drag-preview`: `background: white` → `var(--sd-table-bg)`, border → `var(--sd-table-row-divider)`, shadow → `var(--sd-shadow-md)`.
  - Icon reorder `rgba(0,0,0,.38)` → `var(--sd-text-muted)`.
  - Hover của resize handle và tree toggle → `color-mix(in srgb, var(--sd-text) 8%, transparent)`.
  - Bóng của `.c-btn-add` → `var(--sd-shadow-sm)`.
- Không đụng tới: `.c-loading`, `.lds-ring`, empty state (thuộc đợt redesign table).
- Cập nhật header comment D-014 của file token và THEME.md. Thêm cặp tương phản vào theme test nếu chưa có: header-text/header-bg và text/row-selected-bg ≥ 4.5:1 cho default, mọi preset và dark.

### sd-segmented
Chỉ sửa `segmented.component.scss` và phần tính ring trong `#reveal()`. API, template, keyboard và a11y giữ nguyên.

| Thuộc tính | Hiện tại | Mục tiêu |
| --- | --- | --- |
| Track padding | `4px 5px` | `3px 4px` (inline +1px giữ lý do sub-pixel RTL) |
| Track margin-top | `4px` luôn có | `0`; khi có label thì `sd-label` margin-bottom 4px, như `.sd-label-top > sd-label` |
| Item height sm/md/lg | min-height 28/36/44 | `height: calc(var(--sd-control-height-*) - 8px)` = 24/32/40 |
| Tổng chiều cao | 38/46/54 (+4) | **32/40/48** |
| Item padding | block 4/6/8, inline 10/14/18 | block 0, inline 10/14/18 |
| Item radius | `--sd-radius-4` | `calc(var(--sd-radius-8, 8px) - 3px)` |
| Gap, cỡ chữ | 4px, 14/14/16 | giữ nguyên |
| Focus offset | `--sd-focus-ring-offset` (2px) | `--sd-segmented-ring-offset: 1px` trên host; `#reveal()` đọc cùng biến này |
| pointer: coarse | item min-height 40 | `calc(var(--sd-control-height-coarse) - 8px)` (tổng 44) |

Cập nhật `segmented.keyboard-scroll.spec.ts`. Thêm spec đo tổng chiều cao bằng sd-button cùng size.

### sd-form-builder
- **Chế độ:** thay `.fb-seg` và `onSegmentKeydown` bằng `<sd-segmented size="sm">`, type light, dùng `prefixIcon` từ `modeIcons`, ariaLabel là key `form-builder.mode`.
- **Khung nhìn:** `sd-segmented size="sm"`, item `iconOnly`, vẫn ẩn ở chế độ schema.
- **Builder hẹp (< 720px):** item chế độ chuyển sang `iconOnly`, dựa theo tín hiệu độ rộng builder đã đo (hoặc `compact()`).
- **Tab trang:** kiểu gạch chân như `.fb-tabs__tab`. Trang có rule chỉ hiện icon `visibility`. Trang bị ẩn ở runtime giữ `visibility_off` và màu text-secondary.
- **Thao tác trang:** bỏ 5 nút icon. Tab đang chọn có nút ⋯ 24px mở menu `sd-button-item` gồm:
  - Nhân bản
  - Chuyển sang trái
  - Chuyển sang phải
  - divider
  - Xoá trang (color error)

  Giữ nguyên các điều kiện disabled và ghi chú lý do.
- **Thêm trang:** nút text cuối dải, icon `add`, key `page.add`.
- **Ô tìm kiếm palette:** dùng primitive B, size sm.
- **Dọn mã (commit riêng):**
  - `.msi` → sd-icon.
  - Xoá 7 token `form-builder-md-*` nếu grep toàn thư viện không còn chỗ dùng.
  - Alias `--md-sys-color-*` chỉ gỡ khi mọi widget cấu hình đã đọc token Core; nếu không thì để lại và ghi vào PR.
- Giữ `data-page-action` và `data-builder-page` để test/e2e vẫn tìm được phần tử. Ưu tiên dùng lại i18n key có sẵn.

### sd-kanban
- **Token mới** (light = dark):

| Token | Giá trị |
| --- | --- |
| `kanban-lane-bg` | `color-mix(in srgb, var(--sd-text) 4%, var(--sd-surface))` |
| `kanban-lane-target-bg` | `color-mix(in srgb, var(--sd-primary) 6%, var(--sd-surface))` |
| `kanban-lane-target-border` | `color-mix(in srgb, var(--sd-primary) 45%, var(--sd-surface))` |
| `kanban-drop-slot-border` | `color-mix(in srgb, var(--sd-primary) 55%, var(--sd-surface))` |
| `kanban-card-border` | `color-mix(in srgb, var(--sd-border) 80%, var(--sd-surface))` |
| `kanban-card-hover-border` | `color-mix(in srgb, var(--sd-border-strong) 70%, var(--sd-surface))` |

- **Làn:** nền `--sd-kanban-lane-bg` thay cho `--sd-{color}-light`.
  - Chấm màu 8px `--sd-kanban-column-color` trước nhãn, aria-hidden. Nếu có `prefixIcon` thì hiện icon tô màu thay cho chấm.
  - Làn thu gọn: chấm nằm giữa nút và số đếm.
- **Số đếm:** chữ 13px `--sd-text-secondary`, tabular-nums, "2/5" khi đang lọc; giữ aria-label.
- **Thẻ:** viền `--sd-kanban-card-border`, `box-shadow: none`; hover đổi viền sang `--sd-kanban-card-hover-border`. Thẻ pending/failed giữ viền primary/error.
- **Công cụ thẻ:** trong `@media (hover: hover) and (pointer: fine)` đặt `opacity: 0`. Không dùng display hay visibility, để tay nắm vẫn Tab tới được.
  - Hiện khi thẻ `:hover`, `:focus-within`, pending, failed, hoặc khi trigger menu có `aria-expanded="true"`.
  - Transition dùng `--sd-duration-fast`; tắt khi `prefers-reduced-motion`.
- **Kéo thả:**
  - Làn chứa `.sd-kanban__cards.cdk-drop-list-dragging` (chỉ làn dưới con trỏ): nền `--sd-kanban-lane-target-bg`, viền 1px `--sd-kanban-lane-target-border`.
  - `.cdk-drag-placeholder`: opacity 1, nền target-bg, viền 2px dashed `--sd-kanban-drop-slot-border`, con của nó `visibility: hidden`.
- **Ô tìm kiếm:** dùng primitive B, size sm.
- **forced-colors:** giữ như hiện tại, thêm viền `CanvasText` cho làn.
- Không thêm option `appearance` trong đợt này; ghi thành câu hỏi mở trong PR.

## Interactions & Behavior
- Keyboard, live region, move contract, roving tabindex của segmented, phím tắt của builder: **giữ nguyên**.
- Hover chỉ là lớp hiển thị bổ sung. Mọi thứ vẫn phải dùng được bằng bàn phím và cảm ứng (`pointer: coarse` luôn hiện công cụ).
- Transition chỉ dùng `--sd-duration-fast` + `--sd-ease-standard` và tắt khi `prefers-reduced-motion: reduce`.

## State Management
Không thêm state public. Form-builder có thể cần một computed nội bộ cho danh sách item segmented (label/iconOnly theo độ rộng) và cho trạng thái mở menu trang.

## Design Tokens
- **Palette default (light):**

| Token | Giá trị |
| --- | --- |
| primary | `#005cbb` |
| secondary | `#5c6270` |
| info | `#006a6a` |
| success | `#2e7d32` |
| warning | `#a66300` |
| error | `#ba1a1a` |
| surface | `#fdfbff` |
| surface-muted | `#e7e8ed` |
| text | `#1a1b1f` |
| text-secondary | `#44474f` |
| border | `#c4c6d0` |
| border-strong | `#74777f` |
| table-bg | `#ffffff` |

- `-light` = `color-mix(primary 14%, white)`; `-dark` = `color-mix(primary 84%, black)`.
- **Scales dùng:**
  - radius 4/6/8/12
  - shadow-xs/sm/md (Material elevation 1/2/4)
  - focus-ring 2px/2px
  - duration-fast 120ms
- **Token mới:** `--sd-control-height-{sm,md,lg,coarse}`, `--sd-kanban-*` (6 token), `--sd-segmented-ring-offset` (local trên host).

## Assets
Không có asset mới. Icon dùng `sd-icon` với Material Icons có sẵn: `search`, `close`, `more_horiz`, `add`, `content_copy`, `arrow_back`, `arrow_forward`, `delete`, `visibility`, `visibility_off`, `drag_indicator`, `design_services`, `data_object`, `desktop_windows`, `tablet_mac`, `smartphone`.

## Files
- `Wave 1 Spec.dc.html`: thông số chi tiết + hình minh hoạ (nguồn chính).
- `SD Core Design Review.dc.html`: review đầy đủ (bối cảnh).
- `support.js`: runtime để mở hai file trên.
- `../PROMPT.md`: prompt giao cho Claude Code (chung cho đợt 1 và 2).

## Kiểm tra
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```
Sau đó:
- Build lại lib v19, chạy `npm --prefix showcase run link:library`.
- Mở showcase các trang segmented, kanban, form-builder, table. Kiểm tra light, dark (`data-sd-theme="dark"`), preset default và graphite.
- Ghi `CHANGELOG.md` ở mục `## [Unreleased]`:
  - Added: token control-height, token kanban.
  - Changed: chiều cao segmented, màu table, kanban, form-builder.
  - Removed: token `form-builder-md-*` nếu đã xoá.
- Cập nhật `sd-segmented.md`, `sd-kanban.md`, `sd-form-generic.md` và `THEME.md`.
