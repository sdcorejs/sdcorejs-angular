> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

# Handoff: sd-kanban · API mới

## Overview
Review `sd-kanban` trên main ngày 08/11/2026. Hành vi, trợ năng và hình ảnh giữ nguyên. Public API đổi theo quy ước của sd-calendar, sd-file-explorer, sd-timeline, sd-scheduler, và thêm những thứ pattern P1 board cần. Breaking change: main chỉ có showcase dùng component này.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quyết định. |
| `PROMPT.md` | Prompt cho Claude Code: Bước 0, 6 checkpoint, kiểm tra. |
| `kanban.md` | **Nguồn chính**: phạm vi, model, input/output, dữ liệu, bố cục, tương tác, trạng thái, i18n, E2E, spec, showcase, câu hỏi Bước 0. |
| `Kanban Review.dc.html` | Review và thiết kế 8 mục. |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. |

## About the Design Files
File `.dc.html` là bản tham chiếu viết bằng HTML, không phải mã production. Sửa component hiện có theo `CLAUDE.md`; không copy markup hay inline style. Hex trong HTML là giá trị đã giải của theme default và của 6 token `--sd-kanban-*`.

## Fidelity
High-fidelity cho phần mới (header có summary, Xem thêm, thẻ chọn, làn bị từ chối, trạng thái tải theo cột). Phần còn lại giữ như `kanban.component.scss` trên main.

## Quyết định đã chốt (08/11)
- Đổi API ngay, breaking, có bảng chuyển đổi trong `sd-kanban.md` và CHANGELOG.
- Thẻ `SdKanbanCard<T>` (`id: string`, `columnId`, `title`, `searchText?`, `data?`). Bỏ các hàm `get*` và `withColumn`.
- Dữ liệu: `items` có sẵn, hoặc `option.dataSource.onLoad` tải theo từng cột bằng cursor, trả `total` và `summary`.
- Ô tìm kiếm giữ, mặc định tắt (`searchable`).
- `option.move.reorder`, mặc định `false`: chỉ đổi cột.
- Kéo bằng cả thẻ; bấm không kéo là chọn (`selectedId`, `sdSelect`). Bỏ tay nắm.

## Đã chốt thêm (08/11, theo đề xuất)
- `onMove` trả thêm `'cancel'` để phân biệt người dùng huỷ với từ chối. sd-calendar và sd-scheduler dùng cùng giá trị.
- `column.summary` và `LoadResult.summary` cho tổng tiền ở header.
- `to.beforeId` cho vị trí khi `reorder` bật.
- Sau khi dời ở chế độ `dataSource`, thẻ vào đầu làn đích cho tới lần tải lại cột đó.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`.
- Gói đặt ở `.sdcorejs/handoff/design-kanban/`.
- Không thêm dependency, không thêm token.
- i18n đủ 5 locale.
- Cập nhật `sd-kanban.md`, `CHANGELOG.md` (`## [Unreleased]` · Changed và Added), showcase.
