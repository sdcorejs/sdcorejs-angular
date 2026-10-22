# Kế hoạch: sd-operator · dropdown và icon

**Đã duyệt 2026-10-22** theo mọi đề xuất ở mục 5: không tick (giữ quyết định 19, thêm `menuitemradio` + `aria-checked`),
trigger mặc định xám, mã ẩn mặc định (`showCode`), B5 = (b), `chip-popover` dùng `size="sm"`, dùng lại key i18n
`current` / `choose` với chữ mới.

Nhánh `feat/sd-operator-handoff`, cắt từ `origin/main` `769f9ca73` (sau #95). Gói handoff đặt ở
`.sdcorejs/handoff/design/wave-2/operator/` — cạnh README đợt 2 thật (`design/wave-2/`), thay vì tạo thư mục
`design-wave-2/` mới như PROMPT ghi.

## 0. Trạng thái G hiện tại

- `ɵ` đã tách: `operator-items.ts` (`ɵsdOperatorResolver`: items / icon / label, bọc `<svg width="20" height="20"
  stroke-width="2">`) và `ɵSdOperatorChip` (`sd-operator-chip`, nội bộ). Chip đã có: cỡ sm 24 / md 28, nền xám → tint
  primary khi `hasValue` → primary đặc khi mở, hover 6%, focus ring, disabled, `aria-label` (key `current` / `choose`),
  mũi tên luôn hiện, Alt+↓, Esc trả focus, chọn xong phát `chosen` (control đưa focus về ô nhập), menu cách khung ô 6px.
- Menu (cả `sd-operator` và chip) dùng chung `_operator-menu.scss` nhưng mỗi component có template menu riêng, hàng hai dòng
  (nhãn + mã), **không tick** (quyết định 19, review 2026-10-22).
- `sd-operator` vẫn là nút icon 20px màu primary (fallback `#0f766e`, `rgba(...)`), không aria-label.
- Phần đè lên code G: trigger sm/md của `sd-operator` sẽ render `ɵSdOperatorChip`; template menu gộp làm một (trong chip),
  thêm `showCode`, divider, `menuitemradio`; `#svg()` nhận cỡ + stroke nên chip trong control cũng đổi nét icon (C7).

## 1. Commit dự kiến (mỗi bước spec RED trước, full gate, sync, ảnh trước/sau)

| Bước | Commit | File chính |
|---|---|---|
| 0 | `docs(handoff): add the sd-operator handoff and its plan` | `.sdcorejs/handoff/design/wave-2/operator/**` |
| 1 | `chore(deps): bump @sdcorejs/utils to 1.3.1 for the new operator icons` | `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`, `showcase/package.json`, 4 lockfile + showcase lock, v20–v22 package.json qua sync |
| 2 | `feat(operator): size, readonly, active and showCode; one-line menu with families` | `components/operator/**`, i18n 5 locale, spec |
| 3 | `fix(table): column filter operators in list order` | `column-filter.component.{ts,html}`, spec |
| 4 | `refactor(query-bar): readonly xs operators, no ::ng-deep overrides` | 4 template + 4 scss query-bar, spec |
| 5 | `docs(operator): Vietnamese labels, docs, showcase and changelog` | `i18n/src/vi.ts`, `sd-operator.md`, `sd-query-bar.md`, showcase operator demo + registry, `CHANGELOG.md` |

## 2. Trả lời các câu PROMPT

- **`MatMenuItem.role`:** có input `role: 'menuitem' | 'menuitemradio' | 'menuitemcheckbox'` ở v19 (19.2.19) và v22
  (22.1.5, `types/menu.d.ts`); v20/v21 nằm giữa nên có. `aria-checked` không có input → `[attr.aria-checked]` trên
  `button[mat-menu-item]`.
- **Tham số i18n:** `I18nService.t(key, params)` thay `{name}` (đang dùng ở `core.component.operator.current`
  = "Toán tử: {operator}"). **Đề xuất:** không thêm `trigger-label` / `trigger-empty` vì chip G đã có hai key cùng
  nghĩa (`core.component.operator.current` / `.choose`); dùng lại hai key đó cho cả `sd-operator`, đổi chữ theo bảng
  handoff ("Điều kiện: {operator}", "Chọn điều kiện"; en "Condition: …", "Choose condition"; ja/ko/zh theo bảng). Tham số
  giữ tên `{operator}`.
- **Token mục 3.2:** có `--sd-surface-muted`, `--sd-primary-light`, `--sd-primary-dark`, `--sd-primary-contrast`,
  `--sd-text-secondary`, `--sd-text-muted`, `--sd-border`, `--sd-control-radius`, `--sd-panel-radius`,
  `--sd-focus-ring-*`, `--sd-control-bg-disabled`. **Không có `--sd-text-disabled`** → dùng `--sd-disabled-text` (token
  palette tương đương, chip G đang dùng). Không thêm token.
- **Nơi đọc `OPERATORS[].icon`:** chỉ `operator-items.ts` (resolver dùng chung). `SdOperators` đã bị xoá (ghi trong
  `utilities/models/models.md`). query-builder và query-bar chỉ dùng mảng `Operator` riêng (`SD_QB_*`, `SD_QUERY_*`),
  không đọc icon.
- **Spec so chuỗi icon:** không có. `operator.component.spec.ts` lấy icon từ `OPERATORS` lúc chạy, nên tự theo 1.3.1.
  Không có snapshot SVG nào.
- **`@sdcorejs/utils` 1.3.1:** đã có trên npm (2026-10-22). `OPERATORS` trong tarball khớp từng dòng với `operator.md`
  mục 5 (đã đối chiếu 17 icon). Khai báo 1.3.0 ở `versions/v19/package.json`,
  `versions/v19/projects/sdcorejs-angular/package.json`, `showcase/package.json` và lockfile của v19–v22 + showcase.
  package.json của v20–v22 nhận bản nâng qua `npm run sync`; **lockfile thì không** (sync loại `package-lock.json`), nên
  cập nhật riêng trong từng workspace (`npm install --package-lock-only`, có `--legacy-peer-deps` cho v19–v21, không cho
  v22), rồi kiểm lock diff chỉ đổi `@sdcorejs/utils`. Đây là cách #84 đã làm.

## 3. sd-operator (bước 2)

- Input mới `size: 'xs' | 'sm' | 'md'` (mặc định `md`), `readonly`, `active`, `showCode`. Input/output cũ giữ nguyên.
- `sm` / `md`: render `ɵSdOperatorChip` (map `active` → `hasValue`, `model` ↔ `operator`). Chip thêm input nội bộ
  `standalone` (không margin trái, chọn xong focus về chip) và `showCode`. `open()` gọi `chip.open()`.
- `xs`: nút glyph 14px stroke 2.5, vùng bấm 24px (padding 5px + margin −5px), hover/focus bo 4px.
- `readonly` (mọi cỡ): `<span role="img" [attr.aria-label] [matTooltip]>` không tabindex, không menu; `disabled` thắng.
- `#svg(inner, size, stroke)`: `width/height` theo cỡ, `aria-hidden="true" focusable="false"`; xs 14/2.5, sm 16/2.25,
  md 18/2.1, hàng menu 18/2.1.
- Menu (một template trong chip): hàng một dòng 36px, ô icon 20, nhãn 14px nowrap, `role="menuitemradio"` +
  `[attr.aria-checked]`, mã 11px mono khi `showCode`, divider `role="separator"` khi đổi họ và list > 4 mục (bảng họ
  nội bộ), `max-width: min(360px, calc(100vw - 32px))`. Bỏ màu và giá trị khoá cứng trong `operator.component.scss`.

## 4. column-filter (bước 3)

- B3: `operators` theo thứ tự `column.filter.operator.list`, tra `OPERATORS`, bỏ mục không có.
- B5 (xem mục 5 · câu 4). Template custom: sd-operator rời truyền `size="sm"` và `[active]` = cột đang có giá trị filter.

## 5. Cần duyệt

1. **Tick ở hàng đang chọn.** Handoff A3 thêm lại tick; quyết định 19 (review của bạn 2026-10-22) đã bỏ tick, chỉ để
   highlight. Đề xuất: **giữ không tick**, thêm `role="menuitemradio"` + `aria-checked` (screen reader biết hàng đang
   chọn) và chữ medium (dấu hiệu không chỉ bằng màu). Nếu muốn tick theo handoff thì nói, tôi để ô tick 18px như mục 4.
2. **Trigger mặc định xám, tint primary chỉ khi `active`.** Đồng ý theo handoff (giống chip G).
3. **Mã operator ẩn mặc định**, bật bằng `showCode`. Đồng ý theo handoff (lệch dòng "giữ mã" của README đợt 2).
4. **B5 column-filter khi chưa có operator:**
   - (a) gán mục đầu của `list`: hoặc phát `operatorChange` lúc khởi tạo (đổi hợp đồng emit, table gọi
     `filter.operatorChange` của consumer và `onFilterCommit`), hoặc gán im lặng ở bước chuẩn hoá option của table — cả hai
     đều đổi nghĩa lọc khi consumer đang dựa vào operator mặc định của server/kiểu.
   - (b) giữ `undefined`, chỉ đổi hình: phễu màu xám "Mặc định", aria-label "Chọn điều kiện".
   - Đề xuất **(b)**: không đổi hành vi, không emit.
5. **query-bar `chip-popover`** (ô chọn operator ở đầu popover, không có trong mục 8): đề xuất `size="sm"` để khớp chip
   24px; nếu giữ mặc định thì thành chip 28px. query-builder để mặc định (`md`, chip 28px) — chỉ hưởng thay đổi.
