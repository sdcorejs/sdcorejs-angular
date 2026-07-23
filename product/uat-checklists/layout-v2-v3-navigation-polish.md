# UAT Checklist - Layout V2/V3 Navigation Polish

| Scenario | Steps | Expected Result | Owner | Status |
|---|---|---|---|---|
| V2 desktop compact account | Mở Layout V2 desktop và quan sát account trigger | Chỉ có avatar được căn giữa; menu account mở được | PO / QC | pass |
| V3 collapsed header | Thu gọn drawer V3 | Không còn logo/icon `apps`; nút mở nằm giữa drawer 72px | PO / QC | pass |
| V3 account states | So sánh collapsed, expanded và mobile | Collapsed chỉ có avatar; expanded/mobile giữ identity và indicator | PO / QC | pass |
| Desktop menu search | Focus ô tìm kiếm V2/V3, nhập từ khóa và mở account menu | Soft-pill xám, search icon/focus ring rõ, kết quả lọc đúng | PO / QC | pass |
| Mobile menu search | Mở menu mobile V2/V3, nhập từ khóa, nhấn Escape | Kết quả đúng; focus quay về trigger; body scroll được khôi phục | PO / QC | pass |
| Regression/release | Chạy sync, Layout tests, lint và build | Ba Angular line và Showcase đều pass; console không có lỗi/cảnh báo | Dev / QC | pass |
