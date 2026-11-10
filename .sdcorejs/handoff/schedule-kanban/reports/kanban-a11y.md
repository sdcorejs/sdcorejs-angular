# sd-kanban · trợ năng (TESTING.md §8)
Nhánh `feat/kanban-api`. Showcase không có `@axe-core/playwright`; axe-core 4.13.0 của `versions/v19/node_modules` được nạp bằng `page.addScriptTag` như calendar (Bước 0 mục F), không thêm dependency.

| Mục | Cách kiểm | Kết quả |
| --- | --- | --- |
| Tự động | axe-core trong E2E: ví dụ Đơn hàng đang kéo (KAN-E-01, có làn bị `droppable` từ chối), và sau dark + RTL + `forcedColors: 'active'` + `reducedMotion: 'reduce'` với một thẻ đang chọn | 0 vi phạm serious/critical |
| Chỉ bàn phím | E2E KAN-E-07 (Tab tới nút tên, Enter chọn, `Alt` + `→` sang Đang giao, focus theo thẻ). Karma KAN-C-14 (Enter, Space, Esc), KAN-C-16 (nút tên là tab stop; ⋯ và actions nằm trên lớp phủ), KAN-C-10 (`Alt` + `→` bỏ làn bị từ chối), KAN-C-11 (`Alt` + `↑` `↓` không làm gì khi `reorder` tắt), KAN-SC-29…31, KAN-R-04…06 (focus sau khi dời, giữ focus người dùng tự đặt, `move()` từ API không lấy focus) | Đạt. Không bẫy focus: menu ⋯ là `mat-menu` (Esc đóng, focus về nút); hộp lý do của ví dụ là của consumer. |
| Live region | Karma KAN-SC-33 (đúng một vùng `role="status"`, polite, atomic, kể cả khi có dải lỗi board, cột trống, lỗi tải; dải lỗi và chữ trống không còn role riêng, K3). Chuỗi đọc: KAN-SC-09…13 (đã dời, từ chối, lỗi, huỷ theo từng kết quả `onMove`), KAN-C-10 (thả vào làn bị từ chối), KAN-C-14 (đã chọn) | Đạt |
| Làn bị từ chối | Karma KAN-C-10: `data-blocked` và `aria-disabled="true"` trên danh sách của làn bị `droppable` từ chối từ `cdkDragStarted` tới `cdkDragEnded`; thả vào đọc "Không chuyển sang {cột} được" | Đạt |
| Tên và mô tả | Nút tên: tên là nội dung thẻ; `aria-describedby` trỏ tới hướng dẫn ẩn (đổi theo `reorder`) và tới lỗi trên thẻ khi thất bại. Thẻ đang chọn: `aria-current="true"` trên `article`. Template thẻ có control: cảnh báo dev (KAN-C-18). | Đạt |
| forced-colors | Ảnh `orders-forced-colors.png` (Chromium `forcedColors: 'active'`), Karma KAN-SC-35 | Làn khung `CanvasText`; thẻ chọn, chờ, lỗi viền `Highlight` |
| reduced motion | Karma KAN-SC-34; ảnh cùng lúc với forced-colors | Công cụ thẻ không transition |
| Cảm ứng | E2E KAN-E-08 (`hasTouch`, 390px): chạm chọn, giữ 400ms mới kéo, vuốt ngang cuộn board. Karma KAN-SC-36: vùng chạm 40px cho ⋯, Bỏ qua, Thử lại, Xem thêm (`pointer: coarse`) | Đạt |
| Phóng to 200% | Chưa làm tay | **Chờ** |
| VoiceOver + Safari / NVDA + Firefox | Không chạy được trong môi trường này (Windows, không có trình đọc màn hình) | **Chờ PD**: tên thẻ và hướng dẫn, thông báo đang lưu, đã dời, từ chối, huỷ, lỗi tải, làn bị từ chối khi kéo, Xem thêm |
