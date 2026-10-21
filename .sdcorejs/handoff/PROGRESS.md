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
| 5 | Đợt 1 · B — primitive tìm kiếm `ɵ` | `6e6a4259` |
| 6 | Đợt 1 · C — token table | `42246293` |
| 7 | Đợt 1 — sd-form-builder | `f0576fa6` + dọn `5c39c40b` |
| 8 | Đợt 1 — sd-kanban | `cbaaa034` |
| 9 | Đợt 2 · F — indicator sd-button | `365168c2` |
| 2b | Góp ý review panel select/autocomplete (2026-10-21) | commit `fix(forms): panel spacing, white surface and autocomplete highlight from review` |
| 10 | Operator trong control | đang làm (user duyệt làm hết rồi review một lượt, 2026-10-21) |

Kết quả kiểm tra ở commit sửa panel (Node 22.22.3): Karma v19 7595/7595 (coverage 89.89 / 79.16 / 90.36 / 92.32), lint,
`test:theme` 51/51, `check:scss-hex` 0 finding, `check:i18n-parity` (1341 key × 5) và `check:i18n` pass, `check:sync` pass,
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

## Bước 6 — đã làm

- **Token** (`_component-tokens.scss`): 11 token `table-*` theo README đợt 1 mục C, cùng biểu thức light / dark; giữ `table-bg`,
  `table-tree-level-*`, `table-export-*`. Header comment D-014 ghi ngoại lệ cho token dẫn xuất (Sidebar V4, sd-view, table).
- **`table.component.scss`:** icon sort giữ data-URI, thành `mask-image` trên `::after` (`--sd-text-secondary`, cột đang sort
  `--sd-text`; `.sd-table-sort-header` thêm `position: relative`); drag preview `--sd-table-bg` / `--sd-table-row-divider` /
  `--sd-shadow-md`; icon reorder `--sd-text-muted`; hover resize và tree toggle `color-mix(text 8%, transparent)`;
  `.c-btn-add` `--sd-shadow-sm`. Không đụng `.c-loading`, `.lds-ring`, empty state.
- **Test:** `core-theme.test.mjs` assert 11 biểu thức + giá trị giữ nguyên; `theme-contrast.test.mjs` thêm 3 cặp ≥ 4.5:1
  (header-text / header-bg, text / row-selected-bg, text / row-activated-bg — cặp cuối thêm ngoài README) cho mọi preset
  và dark; a11y spec của table assert icon sort là mask có màu theme (RED trên SCSS cũ đã xác nhận).
- **Docs:** `THEME.md` mục "Table tokens" + dòng Component tokens, `sd-table.md` (Visual cues), CHANGELOG.
- Ảnh: light gần như không đổi (header nhạt hơn chút, hàng chọn tint primary); dark: hàng chọn bớt xanh đậm, tay nắm
  reorder giờ thấy được (trước là đen 38% trên nền tối). Preset graphite chưa xem bằng mắt — chỉ có test tương phản.

## Bước 7 — đã làm

- **Toolbar:** chế độ và khung nhìn là `sd-segmented size="sm"` (`data-builder-toolbar="mode|viewport"`), item từ `modeItems()` /
  `viewportItems`; khung nhìn luôn `iconOnly`; builder < 720px (signal `narrow` từ ResizeObserver sẵn có) thì chế độ cũng
  `iconOnly`. Icon thiết kế `design_services`. Gỡ `.fb-seg`, `onSegmentKeydown`, `applyMode`, `applyViewport`.
- **Tab trang:** gạch chân như `.fb-tabs__tab`; tab có rule chỉ thêm icon `visibility` (bỏ viền nét đứt); ẩn ở runtime giữ
  `visibility_off` + text-secondary. Tab đang chọn có nút ⋯ 24px (`data-page-menu-trigger`) mở `mat-menu.fb-page-menu`:
  Nhân bản / Chuyển sang trái / Chuyển sang phải / divider / Xóa (màu error). `data-page-action` giữ nguyên giá trị
  (`add`, `duplicate`, `up`, `down`, `delete`). Nút "Thêm trang" là nút text 32px cuối dải.
- **i18n mới:** `page.actions`, `page.move-left`, `page.move-right` (5 locale). Nhân bản / Xóa dùng lại key cũ (menu
  hiện "Xóa", không phải "Xoá trang").
- **Lệch:** sd-segmented ngang chỉ nhận ← → Home End, nên ↑ ↓ không còn đổi chế độ (spec cập nhật). Ghi chú ẩn
  (`sd-visually-hidden`) chuyển ra ngoài hàng tab: trong Karma không có class global nên nó chiếm chỗ của dải tab.
- **Dọn (commit riêng):** `.msi` là CSS chết (không template nào dùng) → xoá; 7 token `form-builder-md-*` không còn chỗ
  dùng → xoá; alias `--md-sys-color-*` chỉ còn một chỗ đọc làm fallback (number field của renderer) → đổi chỗ đó
  sang `--sd-text-secondary` và gỡ alias. Ghi ở CHANGELOG `### Removed`. Gate phần dọn: theme 49/49, scss-hex 0,
  form-generic 455/455; full Karma chạy cùng bước 8.

## Bước 8 — đã làm

- 6 token `kanban-*` (light = dark) trong `_component-tokens.scss`; `test:theme` assert biểu thức + cặp `text` /
  `text-secondary` trên `kanban-lane-bg` ≥ 4.5:1 cho mọi preset và dark.
- Làn nền `--sd-kanban-lane-bg` (bỏ `--sd-kanban-column-tint`); chấm 8px `.sd-kanban__dot` (aria-hidden) khi cột không có
  `prefixIcon`; làn thu gọn xếp theo `order`: nút, chấm, số, nhãn. Số đếm chữ 13px tabular, `2/5` (bỏ khoảng trắng —
  spec cũ `1 / 2` đổi theo). Thẻ viền `--sd-kanban-card-border`, không shadow, hover đậm viền.
- Công cụ thẻ: `opacity: 0` trong `(hover: hover) and (pointer: fine)`, hiện khi hover / focus-within / pending / failed /
  `:has([aria-expanded=true])`; transition tắt khi reduced-motion. Làn đích: `:has(> .sd-kanban__cards.cdk-drop-list-dragging)`.
  Placeholder: `.sd-kanban__card.cdk-drag-placeholder` khe nét đứt 2px, con `visibility: hidden`. forced-colors thêm viền
  `CanvasText` cho làn.
- **Câu hỏi mở cho PR:** không thêm option `appearance` (giữ nguyên theo README).

## Bước 9 — đã làm

- Input `indicator` (`boolean | number | null`), `indicatorColor` (`Color`, mặc định `error`), `indicatorMax` (99),
  `indicatorLabel` trên `SdButton` (signal input, `readonly`, transform giống các input sẵn có). `span.sd-button__indicator`
  là anh em của nút gốc (`aria-hidden`, `pointer-events: none`, `data-size` / `data-color`); `indicatorLabel` thành span
  ẩn có id nối vào `aria-describedby` của cả 4 biến thể nút. Host thêm `position: relative`.
- Hình học bằng Sass map theo size từ `--sd-control-height-*` × 0.146; token mới `button-indicator-ring`
  (`var(--sd-surface)`); test theme + 13 spec (ẩn/chấm/số/max, vị trí 3 cỡ, màu, disabled, describedby, kích thước nút).
- Showcase: example `button-indicator` + demo-section "Indicator" (registry 8 → 9, tổng 420 → 421, spec spacing),
  chạy `npm run generate:showcase-examples`. Ảnh: `screenshots/step9-indicator.png` (không có bản trước).
- **Lưu ý gate:** lần full Karma đầu đỏ 3 spec do timeout (select virtual 10k, thumbnail preview-pdf) vì server showcase
  của bước 8 còn chạy và rebuild trong nền; tắt server, chạy lại 7590/7590. Nhớ `preview_stop` trước khi chạy Karma.

## Góp ý review panel (sau bước 9)

User review panel bước 2 và gửi 6 điểm; đã sửa trong một commit riêng (đo theo HTML đợt 2 phần "Đề xuất"):

1. Panel không có ô lọc: option đầu sát mép trên → panel `padding: 4px 0` (select trước đó `padding: 0`; autocomplete
   Material 8px → 4px). Ô lọc sticky vẫn dính mép trên khi cuộn.
2. Không có khe giữa hai option → viền trong suốt 1px trên/dưới + `background-clip: padding-box`, padding dọc option
   8px → 7px để vẫn cao 36px (virtual scroll không đổi). Khe nhìn thấy 2px, nền option còn 34px (thiết kế 36 + gap 2).
3. Hàng "Tất cả" lệch ô tick 4px → cùng `margin: 0 4px`, `padding: 0 12px`, cao 36px, đường chia giữ ở viền dưới.
4. Nền panel trắng: **đã sửa** sang `--sd-select-panel-bg` (#fff / dark #1d1f23) cho cả select và autocomplete — token sẵn có,
   ô lọc và footer sticky cũng dùng nên không lệch màu; hover vẫn trộn 5% chữ vào transparent.
5. Autocomplete mở lại không highlight giá trị → class `sd-option--selected` trên option khớp `model` (Material
   autocomplete không có selection model và dựng lại option), cùng màu với option đang chọn của select.
6. Panel sát control → `margin-top: 6px` (hoặc `margin-bottom` khi pane có `.mat-mdc-select-panel-above` /
   `.mat-mdc-autocomplete-panel-above`, đã xác minh class có ở Material 19 và 22).

Menu `sd-operator` (`.c-op-menu`) chưa đổi nền ở commit này; làm cùng chip operator ở bước 10. Ảnh:
`screenshots/panels-review-before-after.png`, script `tools/shots-panels.mjs`.

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
