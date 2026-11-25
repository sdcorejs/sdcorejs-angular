# Record 360 — bằng chứng nghiệm thu

[Issue #164](https://github.com/sdcorejs/sdcorejs-angular/issues/164) · [Các test Playwright](../../../showcase/e2e/pattern/record-360.e2e.ts)

Các ảnh chụp từ Showcase dùng API mô phỏng trong bộ nhớ. Hồ sơ 12 là doanh nghiệp giả lập có 48 đơn, 3 khoản công nợ, 4 tài liệu và 12 hoạt động. Có 2 khoản quá hạn, tổng 84,2 triệu đồng. Hồ sơ 39 có các danh sách trống. Bản xem trước PDF được tạo từ tên tài liệu mẫu. Không kết nối hệ thống nghiệp vụ hay máy in thật.

| Rộng | Tổng quan sáng / tối | Công nợ quá hạn sáng / tối | Hồ sơ một trang sáng / tối |
| --- | --- | --- | --- |
| 1280px | [Sáng](overview-1280-light.png) · [Tối](overview-1280-dark.png) | [Sáng](debts-1280-light.png) · [Tối](debts-1280-dark.png) | [Sáng](sheet-1280-light.png) · [Tối](sheet-1280-dark.png) |
| 900px | [Sáng](overview-900-light.png) · [Tối](overview-900-dark.png) | [Sáng](debts-900-light.png) · [Tối](debts-900-dark.png) | [Sáng](sheet-900-light.png) · [Tối](sheet-900-dark.png) |
| 390px | [Sáng](overview-390-light.png) · [Tối](overview-390-dark.png) | [Sáng](debts-390-light.png) · [Tối](debts-390-dark.png) | [Sáng](sheet-390-light.png) · [Tối](sheet-390-dark.png) |

| Luồng | Bằng chứng |
| --- | --- |
| Đang tải, lỗi riêng một thẻ và hồ sơ trống | [Đang tải](loading.png) · [Lỗi cục bộ](isolated-error.png) · [Trống](empty.png) |
| Mở tài liệu hoặc đơn hàng từ hồ sơ | [Xem trước tài liệu tổng hợp](document-preview.png) · [Chi tiết đơn DH2408](related-order.png) |
| In toàn bộ hồ sơ hoặc thử lại khi thiếu dữ liệu | [Giao diện in](print.png) · [PDF khổ A4](customer-sheet.pdf) · [Lỗi khi chuẩn bị in](print-incomplete.png) |

Các trạng thái của cùng thẻ Đơn hàng được chụp ở ba kích thước. Vai trò Chỉ xem giữ các quan hệ còn lại khi bỏ Công nợ.

| Rộng | Đang tải | Lỗi cục bộ | Trống | Vai trò Chỉ xem |
| --- | --- | --- | --- | --- |
| 1280px | [Sáng](loading-1280-light.png) · [Tối](loading-1280-dark.png) | [Sáng](error-1280-light.png) · [Tối](error-1280-dark.png) | [Sáng](empty-1280-light.png) · [Tối](empty-1280-dark.png) | [Sáng](viewer-1280-light.png) · [Tối](viewer-1280-dark.png) |
| 900px | [Sáng](loading-900-light.png) · [Tối](loading-900-dark.png) | [Sáng](error-900-light.png) · [Tối](error-900-dark.png) | [Sáng](empty-900-light.png) · [Tối](empty-900-dark.png) | [Sáng](viewer-900-light.png) · [Tối](viewer-900-dark.png) |
| 390px | [Sáng](loading-390-light.png) · [Tối](loading-390-dark.png) | [Sáng](error-390-light.png) · [Tối](error-390-dark.png) | [Sáng](empty-390-light.png) · [Tối](empty-390-dark.png) | [Sáng](viewer-390-light.png) · [Tối](viewer-390-dark.png) |

## Kiểm thử Core và mock

Node 24.22.1, Windows, Angular 19, Karma với Chrome Headless 157. Bộ kiểm thử Core và thẻ quan hệ chạy 214/214 thành công với Jasmine seed `99701`. Coverage cho những file runtime Core có sửa như sau.

| File | Statements | Branches |
| --- | ---: | ---: |
| section-item.component.ts | 4/4 | 2/2 |
| tab.component.ts | 34/34 | 4/4 |
| tab-group.component.ts | 103/108 | 27/31 |
| table-query-params.util.ts | 99/103 | 105/112 |
| page.component.ts | 172/179 | 60/67 |

Bộ test mock/profile/service ban đầu đạt 35/35, seed `3624`. Các test kiểm tra phân trang, tổng độc lập với giới hạn 5 dòng, số liệu tài chính, quan hệ đơn hàng, lỗi theo endpoint và thay đổi hồ sơ. CI chạy cả test bổ sung cho trường hợp tái sử dụng ID đã xoá.

Playwright đạt 32/32 kịch bản Record 360, khách hàng và đơn hàng trong 2,3 phút. Bộ test dùng Chromium ở múi giờ Asia/Bangkok, kiểm tra điều hướng bằng bàn phím, mở URL có bộ lọc, quyền Chỉ xem, cập nhật qua drawer, liên kết mục lục và chỉ in sau khi dữ liệu tải xong. PDF A4 xuất từ fixture 12 có 5 trang, từ đơn DH2408 tới hoạt động cuối cùng. Thanh công cụ và nút in được ẩn trong PDF. Bài test in thay `window.print` bằng hàm ghi nhận thời điểm gọi và xuất PDF bằng bộ in của Chromium. Màn hình hẹp dùng viewport mô phỏng, chưa kiểm tra thiết bị vật lý.
