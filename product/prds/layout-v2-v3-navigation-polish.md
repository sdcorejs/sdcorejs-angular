# PRD - Layout V2/V3 Navigation Polish

## Problem

Layout V1/V2/V3 có một số chi tiết điều hướng thiếu nhất quán: account action
trên mobile chưa gọn, pin menu khó nhận biết, sticky search có thể để menu lọt
phía dưới, và fallback logo của V1 khác V2/V3.

## Goal

Làm gọn account mobile, thống nhất pin/search/logo trên cả ba layout và giữ
nguyên public API cũng như hành vi lọc.

## Users

- Người dùng portal - cần điều hướng rõ ràng, cân đối và dễ nhận biết trạng thái
  focus bằng bàn phím.
- Đội tích hợp - cần giữ nguyên binding, `autoId`, placeholder và public API.

## Scope

- Căn giữa avatar ở account trigger compact và bỏ chevron thừa.
- Ẩn brand/fallback `apps` khi V3 thu gọn, căn giữa nút mở drawer.
- Dùng một presentation component nội bộ cho bốn ô tìm kiếm V2/V3.
- Hiển thị đăng xuất trực tiếp cùng hàng profile trên mobile V2/V3.
- Chỉ hiện pin desktop sau một khoảng hover ngắn; luôn hiện pin trên mobile.
- Giữ search V3 mobile ở lớp sticky có nền kín khi danh sách scroll.
- Dùng custom logo của V1 khi được truyền, nếu không thì fallback icon `apps`.
- Đồng bộ Angular 19/20/21, cập nhật Layout guide và changelog.

## Out Of Scope

- Thay đổi public API.
- Thay đổi thuật toán lọc, signal flow hoặc nội dung placeholder.
- Sửa accessibility toàn cục của `SdInput` ngoài module Layout.

## Success Criteria

- 16 acceptance criteria đều có implementation và bằng
  chứng kiểm thử.
- Test Layout, lint theo phạm vi, build thư viện/Showcase và browser UAT đều
  pass.
