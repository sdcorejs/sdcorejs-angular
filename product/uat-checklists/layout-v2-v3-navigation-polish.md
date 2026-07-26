# UAT Checklist - Layout V2/V3 Navigation Polish

| Scenario                   | Steps                                                   | Expected Result                                                    | Owner    | Status |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | -------- | ------ |
| V2 desktop compact account | Mở Layout V2 desktop và quan sát account trigger        | Chỉ có avatar được căn giữa; menu account mở được                  | PO / QC  | pass   |
| V3 collapsed header        | Thu gọn drawer V3                                       | Không còn logo/icon `apps`; nút mở nằm giữa drawer 72px            | PO / QC  | pass   |
| V3 account states          | So sánh collapsed, expanded và mobile                   | Collapsed chỉ có avatar; expanded/mobile giữ identity và indicator | PO / QC  | pass   |
| Desktop menu search        | Focus ô tìm kiếm V2/V3, nhập từ khóa và mở account menu | Soft-pill xám, search icon/focus ring rõ, kết quả lọc đúng         | PO / QC  | pass   |
| Mobile menu search         | Mở menu mobile V2/V3, nhập từ khóa, nhấn Escape         | Kết quả đúng; focus quay về trigger; body scroll được khôi phục    | PO / QC  | pass   |
| Regression/release         | Chạy sync, Layout tests, targeted lint và build         | Ba Angular line và Showcase đều pass; không có lỗi runtime Layout  | Dev / QC | pass   |
| V2/V3 pin desktop          | Hover một menu chưa ghim và chờ khoảng 300ms            | Pin chỉ xuất hiện sau độ trễ; vẫn hiện khi focus bàn phím          | PO / QC  | pass   |
| V2/V3 account mobile       | Mở menu mobile và quan sát profile/action               | Pin luôn hiện; đăng xuất trực tiếp cùng hàng profile trên cả V2/V3 | PO / QC  | pass   |
| V3 sticky search           | Cuộn danh sách menu dài tới cuối                        | Search đứng yên, nền trắng kín và không có item lọt phía dưới      | PO / QC  | pass   |
| V1 logo                    | Mở fixture không logo rồi fixture có custom logo        | Không logo hiển thị `apps`; có logo hiển thị đúng ảnh được truyền  | PO / QC  | pass   |
| V1 desktop account         | Mở Showcase V1 desktop và nhấn avatar account           | Avatar nằm trong preview và mở được account menu                   | PO / QC  | pass   |
