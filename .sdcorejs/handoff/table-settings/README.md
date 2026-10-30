# Handoff · sd-table modal Thiết lập + chấm trên nút Thiết lập

Đổi tab Cột của modal Thiết lập sang danh sách mở theo dòng: ô tìm, số cột đang hiện, đổi thứ tự bằng phím, float label sm, nút M3 sm, Khôi phục mặc định ở bên trái footer. Nút Thiết lập ở footer bảng có chấm primary khi đang dùng thiết lập riêng. Dữ liệu và storage không đổi.

## File
- `PROMPT.md`: giao cho agent implement.
- `table-settings.md`: thông số, nguồn chính.
- `Table Settings Spec.dc.html` (+ `support.js`): 3a tab Cột (bấm được: ô Hiện, mở dòng, checkbox, Hiện tất cả), 3b nút Thiết lập có chấm.

## Thứ tự
1. Tab Cột: danh sách, phần chi tiết, ô tìm, footer.
2. Đổi thứ tự bằng phím và vùng live.
3. Chấm trên nút Thiết lập (`hasCustomSetup`).
4. Docs, i18n, showcase.
