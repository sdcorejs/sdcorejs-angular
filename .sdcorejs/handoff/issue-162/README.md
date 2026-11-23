# Kiểm chứng sd-section và bộ lọc sd-table

[Issue #162](https://github.com/sdcorejs/sdcorejs-angular/issues/162) · [Commit triển khai](https://github.com/sdcorejs/sdcorejs-angular/commit/5732c7696)

Ảnh chụp từ showcase Angular 19 trên Chrome 157, Windows, Node 24.22.1. Playwright dùng ba viewport. Chế độ tương phản cao dùng `forcedColors: 'active'`. Bảng dùng dữ liệu demo trong bộ nhớ và bộ chuyển đổi `pagingReq` của showcase. Thiết bị cảm ứng thật, trình duyệt khác và API của ứng dụng tiêu thụ chưa được kiểm thử.

| Viewport | Section sáng và tối | Forced colors | Drawer và section lồng | Bộ lọc bảng |
| --- | --- | --- | --- | --- |
| 1440 × 1000 | [Khung và đường kẻ](section-1440.png) | [Ba kiểu khung](forced-colors-1440.png) | [Sáng và tối](composition-1440.png) | [Inline](table-inline-1440.png) · [Query bar](table-query-1440.png) |
| 1024 × 768 | [Khung và đường kẻ](section-1024.png) | [Ba kiểu khung](forced-colors-1024.png) | [Sáng và tối](composition-1024.png) | [Inline](table-inline-1024.png) · [Query bar](table-query-1024.png) |
| 390 × 844 | [Khung và đường kẻ](section-390.png) | [Ba kiểu khung](forced-colors-390.png) | [Sáng và tối](composition-390.png) | [Bộ lọc trên mobile](table-mobile.png) |

- Section mặc định được so với showcase 3.6 đã có trên `main@ff5c364`. Cả hai được chụp trên cùng nền trắng, tại cùng vị trí nguyên pixel, khi font đã tải. Kích thước layout là 680 × 174,296875 CSS px. Ảnh 680 × 175 px cho kết quả **0 pixel khác nhau**. [Ảnh trước và sau](default.png)
- Ở cả hai viewport desktop, độ chênh lớn nhất giữa mép trên các ô lọc là 0,5 CSS px với header đơn và 0,25 CSS px với header nhóm. Fixture header nhóm lấy ví dụ “Full demo (local)”, chuyển các cột sau cột tên thành nhóm qua cấu hình `columns`. Ảnh hàng ẩn dùng `hideInlineFilter: true`. Các ô giữ chỗ dùng input disabled, bỏ qua khi điều hướng bằng bàn phím.
- Chip “Trạng thái” khi trống có vùng bấm khoảng 79 × 24 CSS px, trước đây là 12 × 2 px. Test Playwright chọn “Hoàn tất”, kiểm tra chip, điều kiện `status IN ["done"]` và kết quả 0 dòng với kho Hà Nội đang được ghim. Test cũng mở trực tiếp cột “Trạng thái TT” qua tiêu đề và chọn “Đã thanh toán”, giá trị gửi đi là `paid`.
