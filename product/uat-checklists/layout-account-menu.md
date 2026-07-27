# UAT Checklist - Layout account menu

| Kịch bản              | Các bước                                | Kết quả mong đợi                                             | Owner   | Trạng thái |
| --------------------- | --------------------------------------- | ------------------------------------------------------------ | ------- | ---------- |
| Desktop V1/V2/V3      | Mở từng Showcase, chọn avatar           | Identity ngang, role, 5 action đúng thứ tự, badge đọc được   | PO / QC | pass       |
| V1 expand/collapse    | Chọn rail toggle hai lần                | Sidebar đổi 290 → 60 → 290 và avatar vẫn tương tác được      | PO / QC | pass       |
| Mobile V1             | Chuyển V1 sang Mobile, mở drawer        | Profile + signout cùng hàng; optional actions ở dưới         | PO / QC | pass       |
| Mobile V2             | Chuyển V2 sang Mobile, mở More          | Bottom sheet không overflow, pin luôn thấy, signout inline   | PO / QC | pass       |
| Mobile V3             | Chuyển V3 sang Mobile, mở drawer        | Search sticky không che menu; signout inline; pin luôn thấy  | PO / QC | pass       |
| Reactive badge        | Đổi Showcase Signal count               | Badge cập nhật không remount Layout; 0 ẩn và >99 thành `99+` | QC      | pass       |
| Keyboard account menu | Dùng arrows/Home/End/Escape             | Focus di chuyển đúng, Escape đóng và trả focus               | QC      | pass       |
| I18n/readability      | Kiểm tra V1/V2/V3 và search placeholder | Không có raw `core.module.layout.*` key                      | QC      | pass       |
