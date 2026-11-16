# Handoff: sd-tree điều hướng, thanh chọn nhiều dùng chung, bỏ mat-menu còn lại của sd-table

## Overview
Chốt ngày 09/11/2026. `sd-tree` thêm chế độ điều hướng cho pattern P12 tree-detail (nút đang mở, mở tới nút theo id, số đếm, ⋯ dùng được bằng bàn phím, tìm trên server, giữ trạng thái mở) và sửa trạng thái gốc. Thanh chọn nhiều của cây dùng chung với `sd-table` (thanh trong khung, ô icon primary ở cả hai). Hai `mat-menu` cuối cùng của `sd-table` chuyển sang Action Popover.

## Các file
| File | Nội dung |
|---|---|
| `PROMPT.md` | Prompt cho Claude Code: Bước 0, 6 checkpoint, review độc lập R1/R2, kiểm tra cuối. |
| `tree-selection.md` | **Nguồn chính**: API, R1–R8, thanh chọn (SB), mat-menu (MM), i18n, test, review, checkpoint, câu hỏi Bước 0. |
| `SD Tree Review.dc.html` | Thiết kế 7 mục, mục 07 là điểm đã chốt. |
| `support.js` | Runtime cho file `.dc.html`. |

## About the Design Files
File `.dc.html` là bản tham chiếu viết bằng HTML, không phải mã production. Sửa component hiện có theo `CLAUDE.md`. Phần “Hiện tại” dựng từ `tree.component.html/.scss`; thanh chọn dựng từ `selector-action.component.html/.scss`; nút `sd-button` trong mock vẽ theo cỡ sm và kiểu light.

## Đã chốt
Q1–Q8 ở mục 07 của HTML: `activeId` là model; checkbox không tô nền khi điều hướng; `aria-selected` cho nút đang mở; debounce theo quick search của bảng; lỗi gốc dùng `sd-button`; thanh chọn như `sd-table`; ô icon primary ở cả hai; menu lệnh trên hàng giữ Action Popover.

## Quy tắc repo bắt buộc
Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`. Gói đặt ở `.sdcorejs/handoff/design-tree-selection/`. Không thêm dependency, không thêm token. i18n đủ 5 locale. Cập nhật `sd-tree.md`, `sd-table.md`, `CHANGELOG.md`, showcase.
