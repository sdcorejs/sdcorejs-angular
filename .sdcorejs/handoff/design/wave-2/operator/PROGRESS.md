# Tiến độ sd-operator

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22). Nhánh `feat/sd-operator-handoff` từ `main` `769f9ca73`.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Nâng `@sdcorejs/utils` 1.3.1 (C1–C6) | xong |
| 2 | sd-operator (A1, A3, B1, B2, B4, B5 hình, C7, D1) | xong |
| 3 | column-filter (B3, B5) | chưa |
| 4 | query-bar (A2, A4, D1) | chưa |
| 5 | Nhãn vi, tài liệu, showcase, CHANGELOG (B6, D2) | chưa |

## Bước 1

- `@sdcorejs/utils` 1.3.0 → 1.3.1 ở `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`,
  `showcase/package.json`; v20–v22 package.json qua `npm run sync`. Lockfile cập nhật trong từng workspace (v19 và showcase
  `npm install --legacy-peer-deps`; v20 / v21 `npm install --package-lock-only --legacy-peer-deps`; v22 không cờ), mỗi lock
  chỉ đổi 4 dòng của `@sdcorejs/utils`.
- `OPERATORS` của 1.3.1 khớp 17 dòng `operator.md` mục 5. Không có spec/snapshot so chuỗi icon cũ; thêm spec
  “draws the @sdcorejs/utils 1.3.1 glyphs” (∈ của IN, vòng + chấm của NOT_NULL).
- Kiểm tra: full Karma 7827/7827, `test:scripts` (gồm release contract, theme), `npm run sync`, `check:sync`.
  Ảnh: [`progress/step1-before-after.png`](progress/step1-before-after.png).

## Bước 2

- `sd-operator`: input mới `size` (`SdOperatorSize` = `xs` | `sm` | `md`, mặc định `md`), `readonly`, `active`, `showCode`.
  Input / output cũ và `open()` giữ nguyên. Trigger render `ɵSdOperatorChip` (`standalone`): `sm` / `md` là chip 24 / 28px
  của G, `xs` là glyph 14px có vùng bấm 24px (padding 5px, margin −5px). `readonly` (khi không `disabled`) là
  `<span role="img">` có tên + tooltip, không menu, không Tab. Nút trigger giữ class `c-op-trigger` và `data-autoId`.
- Chip G: input nội bộ `standalone` (không cách mép, chọn xong mat-menu trả focus về chip, không căn theo khung ô),
  `showCode`, cỡ `xs`; mũi tên `expand_less` khi mở. Nền mặc định xám, tint primary khi `active` / `hasValue`.
- `ɵsdOperatorResolver`: glyph theo cỡ (`ɵSD_OPERATOR_GLYPHS`: xs 14/2.5, sm 16/2.25, md 18/2.1; hàng menu dùng md),
  SVG `aria-hidden="true" focusable="false"`, item có `separated` theo bảng họ nội bộ khi list > 4.
- Menu một template (trong chip): hàng một dòng 36px, `role="menuitemradio"` + `aria-checked`, không tick (quyết định 19),
  mã chỉ khi `showCode`, đường chia `role="separator"`, `max-width: min(360px, calc(100vw - 32px))`. Bỏ màu và giá trị
  khoá cứng (`#0f766e`, `rgba(...)`) của `operator.component.scss`.
- i18n: dùng lại `core.component.operator.current` / `.choose`, đổi chữ 5 locale ("Điều kiện: {operator}", "Chọn điều kiện"…).
- Spec: `operator.handoff.spec.ts` (18 spec mới, 14 RED trước); sửa spec cũ "stacks the label above the code" → một dòng,
  mã chỉ khi `showCode`; spec chip đọc nhãn + `aria-checked`; 3 assert của column-filter chỉ tìm chip không standalone.
- Bỏ transition nền đã thử thêm cho chip: spec màu đọc giá trị giữa chừng, handoff không yêu cầu.
- Kiểm tra: spec operator 60/60, filter 35/35, full Karma 7843 + 2 spec column-filter đã sửa, `test:theme` 53/53,
  `check:scss-hex` 0, i18n parity, `check:i18n`, sync, `check:sync`. Ảnh: [`progress/step2-before-after.png`](progress/step2-before-after.png).
- Tạm thời tới bước 4: chip chỉ-xem của query-bar đang là chip md disabled (query-bar còn `[disabled]="true"`).
