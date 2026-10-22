# Tiến độ sd-operator

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22). Nhánh `feat/sd-operator-handoff` từ `main` `769f9ca73`.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Nâng `@sdcorejs/utils` 1.3.1 (C1–C6) | xong |
| 2 | sd-operator (A1, A3, B1, B2, B4, B5 hình, C7, D1) | xong |
| 3 | column-filter (B3, B5) | xong |
| 4 | query-bar (A2, A4, D1) | xong |
| 5 | Nhãn vi, tài liệu, showcase, CHANGELOG (B6, D2) | xong |

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

## Bước 3

- B3: `operators` của column-filter theo đúng thứ tự `column.filter.operator.list` (tra `OPERATORS`, bỏ mục không có);
  trước đây theo thứ tự của `OPERATORS`. Chip trong control và sd-operator rời đều nhận thứ tự này.
- B5 phương án (b): không gán operator mặc định, không emit; chưa có operator thì sd-operator rời hiện phễu xám.
- sd-operator rời (split filter, `filterDef`, cột một operator): `size="sm"` và `[active]` = cột đang có giá trị
  (`hasFilterValue()`, dùng `ɵsdOperatorHasValue`; method vì `columnFilter` là object cha sửa tại chỗ).
- Spec: 3 spec mới (RED trước): thứ tự theo list + bỏ mục lạ; sd-operator rời `sm`, xám khi trống, không gán operator;
  `active` khi cột có giá trị.
- Kiểm tra: filter specs 38/38, full Karma 7848/7848, prettier + eslint, sync, `check:sync`.
  Ảnh: [`progress/step3-before-after.png`](progress/step3-before-after.png) (menu cột “Họ và tên” của Full demo).

## Bước 4

- `inline-chip`, `inline-value-chip`, `popover-chip` và bước value của `build-chip`: `size="xs" readonly` thay cho
  `[disabled]="true"` (A2): glyph 14px có tên + tooltip, không nút. Bước operator của `build-chip`: `size="xs"`, vùng bấm 24px
  (A4); `open()` giữ nguyên. Sửa comment “icon + tooltip” của build-chip.
- `chip-popover` (ô operator ở đầu popover): `size="sm"` (quyết định 5 của PLAN).
- Gỡ 4 đoạn `::ng-deep .c-op-trigger` / `.c-op-icon svg` ở `query-bar.component.scss`, `inline-chip`, `build-chip`,
  `popover-chip` (D1).
- Lỗi tìm thêm khi chụp ảnh: rule `.c-pop-header sd-icon { color: primary; 16px }` của popover tô cả mũi tên của chip
  operator → thu về `> sd-icon` (chỉ icon của field) ở `chip-popover.component.scss` và bản lặp trong
  `query-bar.component.scss`.
- Còn lại (ngoài phạm vi): nền chip xám của ô operator ở đầu popover gần trùng nền panel query-bar (`#EFEDF0`, panel
  mat-menu mặc định của query-bar), nên chip ít nổi; mũi tên và glyph vẫn rõ.
- Spec: 6 spec RED trước (inline-chip, inline-value-chip, popover-chip: readonly xs có tên, không nút; build-chip: xs 24px ở
  bước operator, readonly xs ở bước value; chip-popover: `sm`).
- Kiểm tra: query-bar specs 171/171, full Karma 7850/7850, eslint, `check:scss-hex` 0, sync, `check:sync`. File query-bar
  vốn chưa theo prettier từ trước (17 file, cả file không đụng) nên không format lại cả file.
  Ảnh: [`progress/step4-before-after.png`](progress/step4-before-after.png); “trước” là lib dựng từ operator của `main`.

## Bước 5

- `vi.ts`: 9 nhãn operator theo mục 6 (Khác, Lớn hơn hoặc bằng, …, Trống, Không trống). Locale khác giữ nguyên. Spec RED
  trước (“uses the Vietnamese labels of the handoff”).
- `sd-operator.md` viết lại: input mới, `SdOperatorSize`, visual cues, a11y, ví dụ `readonly` / `showCode`, hook E2E;
  `sd-query-bar.md` (glyph chỉ-xem, bước operator xs, header sm, không còn `::ng-deep`); `sd-table.md` (thứ tự theo
  `list`, sd-operator rời `sm`).
- Showcase operator: 3 ví dụ mới (Kích thước, Chỉ xem, Hiện mã và đủ 17 toán tử); `demoSectionCount` 5 → 8, tổng registry
  446 → 449, sinh lại example sources.
- CHANGELOG `[Unreleased]`: Added (input mới), Changed (trigger, menu, nhãn, column-filter, query-bar, `@sdcorejs/utils`
  1.3.1), Fixed (tên trigger, tooltip glyph query-bar, vùng bấm, mũi tên header popover).
- Kiểm tra: spec operator 61/61, full Karma 7850/7851 — 1 fail là spec `SdImageEditor` “keeps a ratio fixed…” đã biết hay
  lỗi ngẫu nhiên, chạy riêng file đó 33/33. Hai lần full trước hỏng do môi trường (Chrome headless mất kết nối, không tạo được
  thư mục tạm, `detectIncognito` không đọc được storage quota; đã dừng 2 Chrome headless mồ côi của lần chạy hỏng).
  `check:scss-hex` 0, i18n parity (1394 × 5), `check:i18n`, `test:showcase-generators`, `test:collect-docs`, sync, `check:sync`.

### Kiểm tra cuối trên showcase

Script [`tools/check-operator.mjs`](../../../tools/check-operator.mjs) (Playwright, lib v19 build mới):

- Cỡ: md 48×28, sm 40×24, xs vùng bấm 24×24 (layout 14px); có / không model, `active`.
- `readonly`: glyph `role="img"` tên “Chứa”, “Lớn hơn hoặc bằng”; `readonly` + `disabled` ra nút disabled.
- `showCode` + 17 operator: 17 hàng, 4 đường chia, hàng `aria-checked` là operator hiện tại.
- Bàn phím: tên “Điều kiện: Bắt đầu bằng”, Alt+↓ mở, mũi tên + Enter chọn, focus về trigger.
- Locale en: “Condition: Greater than or equal”, nhãn en không đổi.
- Dark, graphite, forced colors: [`progress/step5-modes.png`](progress/step5-modes.png). Không có lỗi console.
- Query-builder: rule hiện chip md; query-bar (bước 4) và table (bước 3) đã chụp ở các bước trước.
  Ảnh: [`progress/step5-showcase.png`](progress/step5-showcase.png).

Chưa kiểm: screen reader thật (VoiceOver / NVDA) — tên trigger, `menuitemradio` / `aria-checked` và glyph `role="img"` kiểm
bằng spec và DOM. Trong forced colors hàng đang chọn chỉ còn chữ đậm (nền primary-light bị ép), giống chip G hiện tại.
