# Handoff: sd-query-bar và sd-table · panel, bộ lọc đã lưu, bộ lọc bắt buộc, ô tìm

## Overview
Đợt sửa `sd-query-bar` (và phần query bar của `sd-table`) chốt ngày 09/11/2026. Giữ cơ chế bộ lọc đã lưu hiện tại; thống nhất ba popover của query bar về khung Action Popover của `sd-button`; bộ lọc bắt buộc luôn hiện và không xoá được giá trị; ô tìm dùng `sd-search-field`; mode inline thêm điều kiện không cần bấm +.

## Các file
| File | Nội dung |
|---|---|
| `README.md` | File này. |
| `PROMPT.md` | Prompt cho Claude Code: Bước 0, 6 checkpoint, review độc lập R1/R2, kiểm tra cuối. |
| `query-bar-panels.md` | **Nguồn chính**: phạm vi, file, khung panel, từng panel, bắt buộc, ô tìm, inline, sd-table, i18n, autoId, test (mã QB-*), review, checkpoint, câu hỏi Bước 0. |
| `Query Bar Saved Filters v2.dc.html` | Thiết kế 9 mục, mục 09 là các điểm đã chốt. |
| `support.js` | Runtime cho file `.dc.html`, để cùng thư mục. |

## About the Design Files
File `.dc.html` là bản tham chiếu viết bằng HTML, không phải mã production. Sửa component hiện có theo `CLAUDE.md`; không chép markup hay inline style. Hex trong HTML là giá trị đã giải của theme default từ các file SCSS đã đọc (`action-popover.scss`, `query-bar.component.scss`, `search-field.component.scss`, `toast.component.scss`).

## Fidelity
High-fidelity cho khung panel, hàng bộ lọc đã lưu, trạng thái, ô tìm cỡ `xs`, ô Thêm điều kiện. Chip, chip popover và control con giữ như code hiện tại.

## Đã chốt (09/11)
C1–C9, M1–M7, B1–B5 (mục 09 của HTML). Tóm tắt:
- Giữ cơ chế lưu (localStorage theo `savedFiltersKey`); không thêm trạng thái đang dùng, ghi đè, chia sẻ, adapter.
- Ba panel bỏ `mat-menu`, dùng CDK Overlay và mixin tách từ `action-popover.scss`.
- Field picker theo hàng 40px chữ 14px; bỏ `switchPickerMenu`.
- Xoá bộ lọc đã lưu không hỏi, có Hoàn tác trên toast (toast đã có `actionLabel`).
- `required` kéo theo `pinned`; Xoá lọc giữ giá trị bắt buộc (cả `#clearQueryBar` của bảng).
- `sd-search-field` thêm cỡ `xs` 28px cho density compact.
- Mode inline: ô “Thêm điều kiện” dạng combobox; không tự mở khi chỉ Tab tới.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`.
- Gói đặt ở `.sdcorejs/handoff/design-query-bar-panels/`.
- Không thêm dependency, không thêm token. i18n đủ 5 locale.
- Cập nhật `sd-query-bar.md`, `sd-table.md`, `CHANGELOG.md`, showcase.
