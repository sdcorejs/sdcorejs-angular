# sd-operator · dropdown và icon (bổ sung đợt 2, mục G)

Nguồn chính cho phần sd-operator. Mã vấn đề (A1–D2) khớp với mục 03 của `Operator Review.dc.html`.

## 1. Phạm vi
| Repo | File | Việc |
|---|---|---|
| sdcorejs-utils | `src/constants/operator.constants.ts` | **Đã xong** trong 1.3.1. Repo này nâng `@sdcorejs/utils` 1.3.0 → 1.3.1. |
| sdcorejs-angular | `components/operator/**` | API mới, trigger chip, menu, a11y, stroke theo cỡ. |
| sdcorejs-angular | `components/table/src/components/filter/column-filter/*` | Thứ tự operators (B3), trạng thái trống (B5). |
| sdcorejs-angular | `components/query-bar/**` | Chuyển sang `readonly` / `size="xs"`, gỡ `::ng-deep` (A2, A4, D1). |
| sdcorejs-angular | `i18n/src/*.ts` | Key aria-label mới (5 locale), nhãn vi (B6). |

## 2. API
Input cũ giữ nguyên tên và kiểu. Chỉ thêm, không rename.

| Input | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `size` | `'xs' \| 'sm' \| 'md'` | `'md'` | Mục 3.1. |
| `readonly` | `boolean` (booleanAttribute) | `false` | Glyph + tooltip, không mở menu, không vào Tab (A2). |
| `active` | `boolean` (booleanAttribute) | `false` | Điều kiện đang có giá trị → chip tint primary. |
| `showCode` | `boolean` (booleanAttribute) | `false` | Hiện mã operator trong menu (B1). |
| `operators` | `Operator[]` | `[]` | Không đổi. Menu giữ đúng thứ tự truyền vào. |
| `disabled` | `boolean` | `false` | Không đổi. Chỉ dùng khi vô hiệu thật. |
| `model`, `autoId`, `open()` | | | Không đổi. |

`readonly` và `disabled` cùng bật: `disabled` thắng (hiện chip disabled).

## 3. Trigger

### 3.1 Kích thước
Trigger sm/md là cùng một chip với chip operator trong control (README đợt 2, mục G). Dùng chung phần nội bộ `ɵ` đang làm ở G, không dựng lần hai.

| `size` | Hình | Cao | Padding | Icon | stroke-width | Mũi tên | Vùng bấm |
|---|---|---|---|---|---|---|---|
| `xs` | glyph trơn, không nền | 14px | 0 | 14px | 2.5 | không | ≥ 24×24px: padding 5px + margin −5px để không đẩy layout |
| `sm` | chip | 24px | 0 2px 0 6px | 16px | 2.25 | `expand_more` 14px | 24px |
| `md` | chip | 28px | 0 4px 0 8px | 18px | 2.1 | `expand_more` 16px | 28px |

- Bo `calc(var(--sd-control-radius) - 3px)`, gap 2px (giống G).
- `#svg()` nhận cỡ và stroke, bỏ `width="20" height="20"` cố định. Cỡ 20px không còn dùng; nếu có consumer cần thì map 20 → stroke 2.

### 3.2 Trạng thái
| Trạng thái | Nền | Chữ / icon |
|---|---|---|
| Mặc định (không `active`) | `color-mix(in srgb, var(--sd-surface-muted) 75%, var(--sd-surface))` | `--sd-text-secondary` |
| `active` | `--sd-primary-light` | `--sd-primary-dark` |
| Menu mở | `--sd-primary` | `--sd-primary-contrast`, mũi tên `expand_less` |
| Hover | `color-mix(in srgb, var(--sd-text) 6%, <nền hiện tại>)` | như trên |
| Focus-visible | `outline: var(--sd-focus-ring-width) solid var(--sd-focus-ring-color)`, offset 1px | |
| Disabled | token nền disabled của control (đợt 2, mục D) | `--sd-text-disabled` hoặc token tương đương đang có |
| `readonly` | không nền | `currentColor` (kế thừa chip chứa nó), không hover/focus |
| `xs` tương tác | không nền; hover/focus vẽ trên vùng bấm 24px, bo 4px | `currentColor` |

- Bỏ màu primary mặc định và fallback `#0f766e`, bỏ `rgba(0,0,0,.04)` / `rgba(0,0,0,.26)` (D1).
- Chưa có `model`: vẫn hiện phễu `FALLBACK_ICON`, theo màu "Mặc định" (B5).
- Không thêm hex. Nếu token nào ở bảng chưa có trong v19 thì báo, không tự thêm.

### 3.3 Khả truy cập
- Nút trigger: `[attr.aria-label]` (A1).
  - Có model: key `core.component.operator.trigger-label` với tham số label.
  - Không có model: key `core.component.operator.trigger-empty`.
- `readonly`: `<span role="img" [attr.aria-label]="label" [matTooltip]="label">`, không `tabindex`.
- SVG luôn có `aria-hidden="true" focusable="false"`.
- Giữ `matTooltip` trên nút. `aria-haspopup` / `aria-expanded` do `matMenuTrigger` tự thêm.

| Key | vi | en | ja | ko | zh |
|---|---|---|---|---|---|
| `core.component.operator.trigger-label` | Điều kiện: {label} | Condition: {label} | 条件: {label} | 조건: {label} | 条件：{label} |
| `core.component.operator.trigger-empty` | Chọn điều kiện | Choose condition | 条件を選択 | 조건 선택 | 选择条件 |

Dùng cơ chế tham số hiện có của `I18nService`. Nếu không có, ghép chuỗi trong component và báo trong kế hoạch.

## 4. Menu
- Panel: theo README đợt 2, mục D (`.c-op-menu` đã nằm trong danh sách). `max-width: min(360px, calc(100vw - 32px))` để nhãn dài và `showCode` không bị cắt ở 280px của mat-menu.
- Hàng (B1, B2):
  - Một dòng, cao 36px, padding `0 8px 0 10px`, gap 10px, bo `calc(var(--sd-panel-radius) - 4px)`.
  - Ô icon 20px, icon 18px stroke 2.1, màu `--sd-text-secondary`.
  - Nhãn 14px, weight regular, `white-space: nowrap`.
  - Ô tick 18px để sẵn ở mọi hàng, nhãn không xê dịch khi đổi chọn.
  - Bỏ `min-height: 0; height: auto; line-height: normal` hiện tại; dùng chiều cao cố định.
- Hàng đang chọn (A3): nền `--sd-primary-light`, chữ và icon `--sd-primary-dark`, weight medium, `check` 18px ở ô tick.
  - `mat-menu-item` đặt `role="menuitemradio"` và `[attr.aria-checked]`.
  - Focus bàn phím trên hàng đang chọn: `color-mix(in srgb, var(--sd-text) 6%, var(--sd-primary-light))`.
- `showCode`: mã 11px mono, `--sd-text-muted`, `padding-left: 12px`, nằm giữa nhãn và ô tick, cùng dòng.
- Divider (B2): 1px, margin `3px 6px`, màu `color-mix(in srgb, var(--sd-border) 60%, var(--sd-surface))`, `role="separator"`.
  - Chèn khi hai mục liền nhau khác họ. Không sắp xếp lại `operators`.
  - Danh sách ≤ 4 mục thì không chia.
  - Bảng họ đặt trong sd-operator (nội bộ, không export, không thêm vào utils):

    | Họ | Operator |
    |---|---|
    | So sánh | EQUAL, NOT_EQUAL, GREATER_THAN, LESS_THAN, GREATER_OR_EQUAL, LESS_OR_EQUAL |
    | Văn bản | CONTAIN, NOT_CONTAIN, START_WITH, NOT_START_WITH, END_WITH, NOT_END_WITH |
    | Danh sách | IN, NOT_IN |
    | Khoảng | BETWEEN |
    | Trống | NULL, NOT_NULL |

- Bàn phím: giữ hành vi mat-menu. Chọn xong đóng menu, focus về trigger. Chip trong control (G) vẫn focus về ô nhập như README đợt 2.

## 5. Icon (C1–C7)
Đã phát hành trong `@sdcorejs/utils` 1.3.1. Bảng dưới để đối chiếu, không sửa lại ở repo này. Mọi glyph nằm trong vùng 5–19 của viewBox 24, tâm 12; pill nhóm văn bản là ngoại lệ (2.5–21.5). Nét phủ định chung `S = <line x1="17" y1="5" x2="7" y2="19"/>`.

| Operator | `icon` mới |
|---|---|
| EQUAL | `<line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/>` |
| NOT_EQUAL | EQUAL + S |
| GREATER_THAN | `<polyline points="7,7 17,12 7,17"/>` |
| LESS_THAN | `<polyline points="17,7 7,12 17,17"/>` |
| GREATER_OR_EQUAL | `<polyline points="7,5 17,10 7,15"/><line x1="7" y1="19" x2="17" y2="19"/>` |
| LESS_OR_EQUAL | `<polyline points="17,5 7,10 17,15"/><line x1="7" y1="19" x2="17" y2="19"/>` |
| CONTAIN | `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="9" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` |
| NOT_CONTAIN | CONTAIN + S |
| START_WITH | pill + `<rect x="5.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` |
| NOT_START_WITH | START_WITH + S |
| END_WITH | pill + `<rect x="12.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` |
| NOT_END_WITH | END_WITH + S |
| IN | `<path d="M17 6.5h-4.5a5.5 5.5 0 0 0 0 11H17M7 12h9"/>` (∈) |
| NOT_IN | IN + S |
| BETWEEN | `<line x1="7" y1="12" x2="17" y2="12"/><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>` |
| NULL | `<circle cx="12" cy="12" r="6.5"/>` + S (∅) |
| NOT_NULL | `<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/>` |

- Spec hoặc snapshot nào đang so chuỗi `icon` / SVG cũ thì cập nhật theo 1.3.1.
- Stroke theo cỡ đặt ở wrapper `<svg>` trong sd-operator (mục 3.1), OPERATORS không biết cỡ.
- Grep mọi nơi đọc `OPERATORS[].icon` hoặc bảng icon/symbol riêng (`SdOperators` trong `models.md`) và báo trong kế hoạch.

## 6. Nhãn tiếng Việt (B6)
Chỉ đổi `i18n/src/vi.ts`. Locale khác giữ nguyên.

| Key | Cũ | Mới |
|---|---|---|
| `core.operator.not-equal.display` | Không bằng | Khác |
| `core.operator.greater-or-equal.display` | Lớn hơn, hoặc bằng | Lớn hơn hoặc bằng |
| `core.operator.less-or-equal.display` | Nhỏ hơn, hoặc bằng | Nhỏ hơn hoặc bằng |
| `core.operator.start-with.display` | Bắt đầu bởi | Bắt đầu bằng |
| `core.operator.not-start-with.display` | Không bắt đầu bởi | Không bắt đầu bằng |
| `core.operator.end-with.display` | Kết thúc bởi | Kết thúc bằng |
| `core.operator.not-end-with.display` | Không kết thúc bởi | Không kết thúc bằng |
| `core.operator.null.display` | Là rỗng | Trống |
| `core.operator.not-null.display` | Không rỗng | Không trống |

## 7. column-filter
- B3: `operators` map theo `column.filter.operator.list` rồi tra OPERATORS; bỏ mục không có trong OPERATORS.
- B5: trạng thái trống. Trình hai phương án trong kế hoạch, không tự chọn:
  - (a) gán operator mặc định là mục đầu của list khi `operator` là undefined. Nêu rõ có emit `operatorChange` lúc khởi tạo hay không.
  - (b) giữ undefined, chỉ đổi hình trạng thái trống (mục 3.2).
- Template custom (`templateRef`) vẫn render sd-operator rời như G; truyền `size="sm"` và `[active]` theo giá trị filter của cột.

## 8. query-bar
| File | Hiện tại | Mới |
|---|---|---|
| `inline-chip.component.html` | `<sd-operator class="c-token-op" … [disabled]="true" />` | `size="xs" readonly` |
| `inline-value-chip.component.html` | `… class="c-seamless__op" … [disabled]="true"` | `size="xs" readonly` |
| `popover-chip.component.html` | `… class="c-chip-operator" … [disabled]="true"` | `size="xs" readonly` |
| `build-chip.component.html` (bước operator) | sd-operator tương tác, ghi đè padding 0 + 14px | `size="xs"` |
| `build-chip.component.html` (bước value) | `[disabled]="true"` | `size="xs" readonly` |

- Gỡ các đoạn `::ng-deep .c-op-trigger { … }` và `::ng-deep .c-op-icon svg { … }` trong `query-bar.component.scss`, `inline-chip`, `build-chip`, `popover-chip`.
- Hình chip không đổi ngoài nét icon dày hơn (C7) và vùng bấm 24px ở bước chọn operator (A4).
- Sửa comment trong build-chip ("icon + tooltip") cho đúng sau khi tooltip chạy lại.
- `open()` giữ nguyên cho build flow.

## 9. Spec cần thêm hoặc sửa
- sd-operator:
  - aria-label khi có và không có model; SVG `aria-hidden`.
  - `size` xs/sm/md: cỡ svg, stroke, có/không mũi tên.
  - `readonly`: render span `role="img"`, không có button, click không mở menu.
  - `active`, `disabled` ưu tiên hơn `readonly`.
  - Menu: `role="menuitemradio"`, đúng một hàng `aria-checked="true"`, có tick.
  - Divider đúng vị trí đổi họ; ≤ 4 mục không có divider.
  - `showCode` false: không có `.c-op-code`; true: có, cùng hàng.
  - Thứ tự hàng đúng thứ tự `operators`.
- Sửa spec hiện có "stacks the label above the code inside one text block": hàng giờ một dòng, mã chỉ có khi `showCode`.
- column-filter: thứ tự theo `list`; phương án B5 đã duyệt.
- query-bar: chip dùng `readonly`, có tooltip/aria-label; bước operator có vùng bấm ≥ 24px.

## 10. Thay đổi so với README đợt 2
| README đợt 2 | Bổ sung này |
|---|---|
| G · Ràng buộc: "`sd-operator` giữ nguyên public API" | Giữ tên và kiểu input cũ; thêm `size`, `readonly`, `active`, `showCode`. |
| G · Menu: "Giữ dòng mã operator nếu đang có" | Ẩn mặc định, bật bằng `showCode`, cùng dòng. |
| G · Kiến trúc: `ɵ` dùng chung cho chip trong control | sd-operator cũng render chip qua `ɵ` này cho `sm`/`md`. |
| G · Chip: icon SVG từ OPERATORS | Icon mới ở mục 5, stroke theo cỡ ở mục 3.1. |
