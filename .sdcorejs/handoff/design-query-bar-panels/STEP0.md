# Bước 0 · đã duyệt 09/11/2026

Câu trả lời Bước 0 cho `query-bar-panels.md`, được duyệt nguyên văn. Reviewer đọc file này để biết các lệch spec có chủ đích.

## Điểm đã chốt

1. **Node `24.22.1`** cho mọi lệnh (theo `AGENTS.md` và CI). PROMPT ghi `22.22.3`; luật repo thắng.
2. **Lưu bộ lọc** mở khi có ít nhất một chip có giá trị (kể cả chip bắt buộc) hoặc ô tìm có chữ. Mục 5.4 viết `activeCount() === 0`, nhưng mục 6.2 đổi `activeCount` để không đếm chip bắt buộc; ghép đúng chữ thì thanh chỉ có giá trị bắt buộc không lưu được.
3. **Bỏ** output `swapField` của chip popover (nội bộ, không export) và key i18n `core.component.query-bar.swap-field` cùng với `switchPickerMenu`. `SdQueryBar.changeFilterField()` (công khai) giữ.
4. **`filter.queryBar.savedFilters` chỉ đọc từ option của từng bảng**; giá trị trong `SD_TABLE_CONFIGURATION.filter.queryBar` bị bỏ qua (một key chung sẽ trộn bộ lọc của mọi bảng).
5. Nhánh `feat/query-bar-panels`. Reviewer R1/R2 là phiên mới không chia sẻ ngữ cảnh, chạy trong cùng worktree khi phiên tác giả dừng.

## Trả lời mục 16

1. `SdActionPopover` không export khỏi entry `components/button` và gắn chặt với `button[role=menuitem]`, canh phải, không `returnFocusTo`, không sự kiện đóng, không kiểu biểu mẫu / listbox. Viết mới trong `components/query-bar/src/components/panel/`: `ɵSdQueryPanel` (trên `ng-template`, giữ overlay, id, kiểu `list` | `form`, canh, focus, phát `opened` / `closed`), `ɵSdQueryPanelTrigger` (aria, click, Enter / Space, `openMenu(returnFocusTo?)`, `closeMenu()`), `ɵSdQueryPanelGroup` (cung cấp ở `SdQueryBar`, mở panel này đóng panel kia). Vị trí, scroll strategy, outside click chép theo `SdActionPopover` có `why:`. Class khung đặt trên phần tử gốc trong template nên style component áp mà không cần `::ng-deep`.
2. `assets/scss/core/_popover-panel.scss` hợp quy ước (`_control`, `_inline-edit`, `_read-state-panel`, `@use` đường tương đối). Hex của `action-popover.scss` đều là fallback `var(--x, #hex)`, được `check:scss-hex` miễn; `test:theme` chỉ biên dịch `sd-core.scss`. Không sửa danh sách file.
3. `Size` (`@sdcorejs/utils` 1.3.1) là `'sm' | 'md' | 'lg'`. `ɵSdSearchFieldSize` thành `Extract<Size, 'sm' | 'md'> | 'xs'`; class `sd-md` đổi từ `size() !== 'sm'` sang `size() === 'md'`. Kanban, badge-picker, palette form builder, sd-select, quick search chỉ dùng `sm` / `md`.
4. `sd-select` không có cách khoá mục theo trạng thái chọn (`disabledField` theo dữ liệu item) → nhiều giá trị: hoàn lại giá trị trước + dòng `required-min-one`. Một giá trị: `[required]` + `[clearable]="false"` (nút × `matSuffix` chỉ ẩn theo `required`).
5. `SdNotifyService.info(message, { title, actionLabel, onAction })` — tên callback là `onAction`. Không có key chung "Hoàn tác" → thêm `saved-filters.undo`. `error()` gom 500 ms. Key `core.component.query-bar.search` đã có ("Tìm kiếm"), dùng lại. Toast Hoàn tác giữ thời lượng mặc định 3 giây.
6. `savedFilters?: { key: string }` vào `SdTableOptionFilterQueryBar`. `#clearQueryBar` → `clearFilter()` → `value.remove()` đưa mọi thứ về default: chưa giữ giá trị bắt buộc; `#queryBarDirty` đếm giá trị bắt buộc là bẩn. Cột không có cờ `required` (chỉ quick filter và external filter) → "column filter bắt buộc" N/A.
7. `@sdcorejs/utils` không có reviver ngày; regex ở `table-query-params.util.ts` là hàm riêng. Chép một hàm nhỏ vào query-bar, `why:` trỏ về nguồn.
8. Xem bảng checkpoint dưới.

## Checkpoint

| # | Commit | Mã test |
| --- | --- | --- |
| 1 | `feat(query-bar): khung panel chung, mixin popover-panel, sd-search-field cỡ xs` | QB-P-01 (xanh trước và sau, không có bước đỏ), QB-F-01, QB-P-03…07 với panel thử |
| 2 | `feat(query-bar): bộ lọc đã lưu trên panel mới, xoá có Hoàn tác, trạng thái trống/lỗi` | QB-S-01…10 |
| 3 | `feat(query-bar): field picker và chip popover trên panel chung, bỏ mat-menu và switchPickerMenu` | QB-P-02, QB-P-08, QB-FP-01…05 → R1 |
| 4 | `feat(query-bar): bộ lọc bắt buộc luôn có chip, không xoá được giá trị` | QB-R-01…10, QB-T-03 |
| 5 | `feat(query-bar): ô tìm dùng sd-search-field, ô Thêm điều kiện ở mode inline` | QB-F-02…05, QB-I-01…07 |
| 6 | `feat(table): bộ lọc đã lưu ở chế độ query bar` | QB-T-01, 02, 04, 05 → R2 |

Spec sửa vì selector mat-menu: `query-bar.component.spec.ts`, `chip-popover.component.spec.ts`, `field-picker.component.spec.ts`, `popover-chip.component.spec.ts`, `saved-filters-menu.component.spec.ts`. Xoá: test `switchPickerMenu` (`chip-popover.component.spec.ts`) và binding `[switchPickerMenu]` / `(swapField)` của host spec đó.

## Rủi ro đã nêu

- `openField()` từ header cột: overlay gắn trong lúc click header (listener capture của CDK đã qua); `returnFocusTo` thắng trả focus về chip; mọi đường đóng phải commit để bảng không kẹt `#barPending`.
- `applyOn: 'commit'`: mỗi lần đóng là một lần apply → commit đúng một lần cho Esc, bấm ngoài, Tab ra, `closeMenu`, đổi panel, destroy; đổi chip A → B: A commit trước khi seed B.
- Overlay con trong chip popover (`sd-operator` mat-menu, panel `sd-select`, mat-datepicker): click và focus trong đó không được coi là ra ngoài.
- Không còn backdrop trong suốt của mat-menu: click ra ngoài đi thẳng tới phần tử bên dưới (đúng spec 2.2) — ghi CHANGELOG.
