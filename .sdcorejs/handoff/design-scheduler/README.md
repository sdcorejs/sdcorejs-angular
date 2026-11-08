> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

# Handoff: sd-scheduler

## Overview
Component mới `sd-scheduler` (`@sdcorejs/angular/components/scheduler`): lịch theo tài nguyên. Mỗi hàng là một phòng, một người hoặc một xe; trục ngang là giờ trong ngày (Ngày) hoặc ngày trong tuần, trong tháng (Tuần, Tháng). Dùng cho đặt phòng, lịch xe, nghỉ phép theo phòng ban, bảng chấm công. Đợt 3 của lộ trình schedule; dùng chung model, cấu hình, token và pipeline dời với `sd-calendar`.

Điều kiện trước: `sd-calendar` đợt 1 đã merge.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quy tắc, quyết định. |
| `PROMPT.md` | Prompt cho Claude Code: Bước 0, 6 checkpoint, kiểm tra. |
| `scheduler.md` | **Nguồn chính**: phạm vi, API, bố cục, khối, tương tác, bàn phím, nhóm, mobile, trạng thái, token, i18n, E2E, spec, showcase, câu hỏi Bước 0. |
| `SD Scheduler Design.dc.html` | Thiết kế tĩnh 9 mục. |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. |

Cần thêm gói calendar đã có trong repo: `.sdcorejs/handoff/design-calendar/calendar.md` và `ADDENDUM-2026-11-08.md`.

## About the Design Files
File `.dc.html` là bản tham chiếu viết bằng HTML, không phải mã production. Dựng lại bằng standalone component Angular, signal `input()`/`model()`/`output()`, `@if/@for`, SCSS với token `--sd-*`, theo `CLAUDE.md`. Không copy markup, inline style hay logic. Dữ liệu trong HTML là dữ liệu giả; hôm nay trong mẫu là Thứ Hai 09/11/2026, 10:40.

## Fidelity
High-fidelity về bố cục, kích thước, màu và trạng thái. Hex trong HTML là giá trị đã giải của theme default; map sang token theo `scheduler.md` mục 7, 8, 13 và `calendar.md` mục 8.1, 14.

## Tóm tắt thiết kế
- **Ngày**: trục giờ 24 giờ, 1 giờ = 80px, cuộn ngang tới `scrollTime`. Vạch giờ hiện tại dọc qua mọi hàng.
- **Tuần, Tháng**: trục ngày, cột `minmax(120px, 1fr)` và `minmax(28px, 1fr)`. Khối có giờ nằm trong ô ngày; cả ngày và nhiều ngày là thanh nối liền.
- **Cột tài nguyên** 240px dính trái: icon hoặc avatar, tên, mô tả. **Hàng nhóm** 32px theo `resource.group`, thu gọn được.
- **Hàng** cao tối thiểu 48px; sự kiện trùng giờ xếp thành lane, hàng cao thêm 32px mỗi lane.
- **Khối** cao 28px; nội dung theo bề rộng (≥ 120 / 48–119 / < 48px); màu và trạng thái như calendar.
- **Tương tác**: quét ngang trên một hàng để tạo; kéo ngang đổi giờ, kéo dọc đổi tài nguyên; `move.droppable` làm mờ hàng không nhận; `move.axis` khoá một trục; kéo mép phải đổi giờ kết thúc.
- **Template ô** ở Tuần, Tháng thay khối bằng nội dung của consumer (mã công), không kéo thả.
- **Giao diện hẹp** (< 600px bề rộng host): cột tài nguyên 120px, 1 giờ = 64px, thanh công cụ 2 hàng, nút 44px.

## Quyết định
D1–D11 ở mục 09 của HTML đã chốt ngày 08/11/2026 theo đề xuất.
- Chỉ Ngày có trục giờ; không có Tuần theo giờ, không có Danh sách.
- Một sự kiện thuộc đúng một tài nguyên (`resourceId`).
- `resources` là input; `onLoad` nhận `resourceIds`.
- Trùng giờ hiển thị thành lane, không chặn.
- Thêm `move.droppable` (kiểm tra đích trong lúc kéo, đồng bộ) và `move.axis`.
- Chỉ kéo mép phải.
- Không thêm token màu; dùng lại `--sd-calendar-*`.
- Không virtual scroll; khuyến nghị tối đa 150 tài nguyên.
- Có template ô thì chế độ đó không kéo thả.
- Hàm thuần và pipeline dời dùng chung với calendar; cách export do Bước 0 đề xuất.
- `onMove` trả thêm `'cancel'`; có output `sdLoadError` (hợp đồng chung `schedule-kanban/SHARED-CONTRACT.md`).

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`.
- Gói đặt ở `.sdcorejs/handoff/design-scheduler/`. Không tạo `design/`, `product/`, `docs/` ở root.
- Không thêm dependency. Kéo thả dùng `@angular/cdk/drag-drop`.
- i18n đủ 5 locale vi/en/ja/ko/zh.
- Cập nhật `sd-scheduler.md` (mới), `THEME.md`, `CHANGELOG.md` mục `## [Unreleased]` (Added), `documentation.registry.ts`.
