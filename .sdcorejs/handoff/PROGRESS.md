# Tiến độ handoff SD Core (đợt 1 + 2)

Ghi chú để làm tiếp trên máy khác. Thông số gốc nằm ở [`design/PROMPT.md`](design/PROMPT.md),
[`design/wave-1/README.md`](design/wave-1/README.md) và [`design/wave-2/README.md`](design/wave-2/README.md)
(README đợt 2 thắng khi mâu thuẫn). File này ghi lại những gì đã làm, các quyết định đã duyệt và các điểm còn mở.

Cập nhật: 2026-10-21.

## Làm tiếp

- Branch: `feat/design-handoff-wave-1-2`, cắt từ `origin/main` tại `773d7de8` (#93).
- Cài đặt theo `CLAUDE.md`: `npm --prefix versions/v19 ci --legacy-peer-deps`, `npm --prefix showcase ci --legacy-peer-deps`
  (v20/v21 cũng `--legacy-peer-deps`, v22 `npm ci` thường). Release dùng Node `22.22.3`; các bước dưới đây đã chạy
  local trên Node 26, CI mới là chuẩn.
- Mỗi bước: viết spec RED trước, sửa `versions/v19/**`, chạy đủ bộ kiểm tra của PROMPT, `npm run sync` + `npm run check:sync`,
  chụp ảnh showcase trước/sau, commit local một commit cho bước đó, báo cáo rồi chờ duyệt bước sau.
- Bước 5 và bước 10 có cổng duyệt riêng trước khi tạo file.

## Trạng thái

| Bước | Nội dung | Commit |
| --- | --- | --- |
| 1 | Đợt 1 · A — thang `--sd-control-height-*` | `3abaf32a` |
| 2 | Đợt 2 · D — token control, panel, control tự viết | `50863499` |
| 3 | Đợt 2 · E — checkbox và radio | `8cc08f67` |
| 4 | Đợt 1 — sd-segmented | `77d7f449` |
| 5 | Đợt 1 · B — primitive tìm kiếm `ɵ` | commit `feat(forms): draw the four search boxes with one internal search field` |
| 6–10 | Token table, form-builder, kanban, indicator sd-button, operator trong control | chưa làm |

Kết quả kiểm tra ở commit bước 5 (Node 22.22.3): Karma v19 7571/7571 (coverage 89.85 / 79.08 / 90.31 / 92.29), lint,
`test:theme` 48/48, `check:scss-hex` 0 finding, `check:i18n-parity` (1341 key × 5) và `check:i18n` pass, `check:sync` pass,
build lib v19 pass. Ảnh trước/sau: [`screenshots/`](screenshots/).

## Quyết định đã duyệt (2026-10-21)

1. Sau mỗi bước báo cáo và commit local, không push (trừ khi được yêu cầu).
2. ~~Không commit thư mục handoff~~ — đã đổi: handoff được commit để làm tiếp trên máy khác.
3. Không làm phần chỉ có trong HTML mà README không có (mũi tên dropdown `expand_more/less`, label giữ màu thường khi lỗi).
4. Menu thao tác trang của form-builder: nút ⋯ 24px viết native + `mat-menu` với `button[mat-menu-item][data-page-action]`
   (`sd-button-item` là host `display:none`, không mang được `data-page-action` lên nút bấm được; sd-button không có cỡ 24px).
5. Icon chế độ design đổi `edit` → `design_services`.
6. Builder hẹp < 720px: thêm signal `narrow` từ ResizeObserver đang có (`compact()` là < 900px).
7. Viền chưa chọn của checkbox / radio / pseudo-checkbox đặt ở tầng theme (`_material-tokens.scss`, cả hai tiền tố),
   để `mat-checkbox` dùng trực tiếp trong sd-table cũng nhận.
8. Gỡ mọi rule nền disabled trùng (input, input-number, date, datetime, date-range, time, textarea, select); autocomplete
   đổi từ `surface-muted` sang nền disabled chung.
9. `.filter-input-wrapper` có focus (viền focus + `--sd-control-ring`).
10. entity-picker: bỏ viền ở chế độ viewed.
11. Item của segmented bo `calc(var(--sd-control-radius, 8px) - 3px)`.
12. Panel select / autocomplete bo đủ 4 góc.
13. Màu và độ đậm option đang chọn đặt trong phạm vi `.sd-select-panel` / `.sd-autocomplete-panel`; token global giữ nguyên.
14. Thêm cả 7 `--sd-control-*` vào `SD_COLOR_TOKENS` (ghi chú `control-ring*` là box-shadow).
15. (Sau bước 2) Giữ nền label float khi focus như spec, không đổi sang vòng `clip-path`.

### Control dạng ô (README đợt 2, mục D) — đã duyệt

- **Đổi:** entity-picker, ô lọc của sd-select, ô nhập link/ảnh của editor, `.opt__input` (form builder), `.fbp-control`
  (preview canvas), `.field-input` của file explorer (nối qua `--sd-fe-*`), `.c-search` và `query-bar.controls.scss`
  (bỏ skin 6px `!important`). Đã làm ở bước 2.
- **Đổi qua primitive ở bước 5 (đã làm):** `.sd-kanban__search`, `.sd-quick-search-field`, `.fb-search`, `.filter-input-wrapper` của panel sd-select.
- **Giữ:** sd-inline-text, swatch sd-input-color, ô ngày sd-chip-calendar, `.search` dạng pill của file explorer,
  autoid-inspector, preview-pdf, vùng thả của upload-file, `.vb` của form builder, `.c-pop-input` (CSS chết).
- **Còn phải xác nhận trên showcase:** `.sd-editor-surface`, `_inline-edit.scss` (inline edit trong bảng).

## Lệch thông số đã báo

- Bước 1: thêm `min-height: 32px` của infix `.sd-sm` vào token (bằng đúng). Field outline `.sd-md` thật ra cao 43.5px
  (infix `min-height: 43.5px` có từ trước), không phải 40px.
- Bước 2:
  - `--sd-control-border` trộn **82%** (80% của thiết kế chỉ đạt 2.9:1 với copper / forest / plum / rose).
  - Hover option và hàng menu trộn 5% chữ vào `transparent` thay vì `--sd-surface` (nền panel Material là surface-container).
  - Độ dày viền 1px đặt trong `form.scss` (test VAL-001 bắt tầng Material chỉ trỏ `var(--sd-*)`).
  - Panel select dùng `!important` cho bo góc (Material viết cứng, không có token).
  - Thêm hover cho ô lọc select, viền đỏ cho entity-picker khi lỗi.
  - Nền label float lộ mảng lệch màu trên nền khác `--sd-surface` (thấy rõ ở card showcase dark) — đã giữ như spec.
- Bước 3: rule bo 4px áp cho mọi pseudo-checkbox dạng full (cả hàng "Tất cả" của select, vốn không phải `mat-option`).
- Chưa kiểm được: forced-colors, `pointer: coarse`, hover (môi trường test không giả lập); preset graphite.

## Bước 5 — đã làm (duyệt 2026-10-21)

- **Vị trí và tên:** `forms/directives/src/search-field.component.ts` (+ html / scss / spec), export từ `forms/directives/index.ts`.
  Component `ɵSdSearchField` (selector `sd-search-field`), directive `ɵSdSearchFieldInputDirective` (selector
  `input[sdSearchFieldInput]`; đề xuất ghi `ɵSdSearchFieldInput`, nhưng lint `directive-class-suffix` bắt hậu tố `Directive`),
  type `ɵSdSearchFieldSize`. Docs: mục "Internal (ɵ)" trong `sd-form-directives.md`; không showcase.
- **API nội bộ:** `size` (sm / md), `clearable` + output `cleared` (đặt tên theo sd-input / sd-input-number), `clearLabel`
  (mặc định key mới `core.form.search-field.clear`, đủ 5 locale), `autoId` (nút xoá `<autoId>-clear`), slot `[sdSearchFieldEnd]`.
  Nút xoá chỉ phát `cleared`; giá trị do nơi dùng xoá. Directive đọc value / disabled của input ở `ngDoCheck` + `(input)`.
- **Nơi dùng:** kanban (sm, giữ 280px), quick search (sm, clearable, ↵ ở slot cuối, nút xoá giữ aria-label và
  `data-autoid` `…-quick-search-clear`), palette form builder (sm, giữ margin), ô lọc panel sd-select (3 chỗ, sm).
  Class cũ giữ nguyên trên host để spec / e2e vẫn tìm được.

Lệch thông số và quyết định nhỏ (cần duyệt lại nếu không đồng ý):

- Disabled: nền `--sd-surface-muted` + chữ `--sd-disabled-text` theo README đợt 1 (không phải `--sd-control-bg-disabled` như
  mat-form-field); viền `--sd-control-border-disabled` (README không nói).
- Ô lọc panel select chọn size **sm** (32px; trước khoảng 38px) — README không ghi cỡ. Icon đổi từ `--sd-select-icon-muted`
  sang `--sd-text-secondary` của primitive.
- Kanban 40px → 32px, palette 36px → 32px và chữ 13px → 14px (đúng README, ghi lại vì là thay đổi hình ảnh).
- Bấm vào icon / phần đệm vẫn focus input như các wrapper `<label>` cũ (thêm vào primitive).
- Quick search ở container ≤ 550px: đặt `min-height` / `font-size` lên host và biến local `--sd-search-field-clear-size: 40px`.

## Ghi chú kỹ thuật

- Mixin dùng chung cho control tự viết: `assets/scss/core/_control.scss` → `@include control.box($focus, $hover)`.
- `check:scss-hex` chặn outline trong rule `:focus*` nếu màu không phải `var(--sd-*focus-ring*)` / `currentColor`;
  với forced-colors dùng biến local, ví dụ `--sd-control-focus-ring: Highlight`.
- Karma: một sd-select có hơn 10 item (có ô lọc) làm `fixture.whenStable()` treo cả lượt; mở panel đồng bộ
  (`selectRef().open()` + `detectChanges()`) như spec a11y của select.
- `npm run sync` làm git đánh dấu ~688 file v22 do CRLF; nội dung thực không đổi, `git add` chuẩn hoá lại.
- Spec mới ở v22 dài hơn v19 vài dòng: transform đã duyệt của sync, `check:sync` vẫn pass.

## Chụp ảnh trước / sau

Chụp trong Browser pane hay timeout khi cửa sổ bị ẩn, nên dùng Playwright headless có sẵn trong `showcase/node_modules`:

1. Build lib "trước" từ commit của bước trước trong một `git worktree` tạm, `versions/v19/node_modules` là junction trỏ
   về `node_modules` thật. Gỡ junction bằng `cmd /c rmdir` **trước** `git worktree remove`, không thì có thể xoá luôn
   `node_modules` thật.
2. Chép `dist` "trước" vào `showcase/node_modules/@sdcorejs/angular`, xoá thư mục `vite` trong `showcase/.angular/cache`,
   chạy `npm --prefix showcase run ng -- serve showcase --port 4212 --prebundle=false` (không qua `prestart`).
3. `node .sdcorejs/handoff/tools/shots-stepN.mjs http://localhost:4212 <outDir> before`. Server có thể chạy qua cấu hình
   `showcase-raw` (port 4212, không qua `prestart`) trong `.claude/launch.json` (gitignored) bằng preview tool. Builder trong
   showcase luôn < 900px nên palette là panel nổi: `shots-step5.mjs` bấm `.fb-panel-toggle` trước khi chụp.
4. `npm --prefix showcase run link:library`, chạy lại server, chụp với nhãn `after`.
5. `node .sdcorejs/handoff/tools/compose.mjs <outDir> <file.png> "<tiêu đề>"` ghép thành một ảnh so sánh.
