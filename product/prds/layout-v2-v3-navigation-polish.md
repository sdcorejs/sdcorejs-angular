# PRD - Layout V2/V3 Navigation Polish

## Problem

Layout V2/V3 có một số chi tiết điều hướng thiếu nhất quán: icon cạnh avatar
trông lệch, V3 khi thu gọn vẫn còn icon thương hiệu, và ô tìm kiếm menu chưa
phù hợp với ngôn ngữ thị giác chung.

## Goal

Làm gọn trạng thái compact của V2/V3 và thống nhất ô tìm kiếm menu dạng
Soft-pill trên desktop/mobile mà không thay đổi public API hay hành vi lọc.

## Users

- Người dùng portal - cần điều hướng rõ ràng, cân đối và dễ nhận biết trạng thái
  focus bằng bàn phím.
- Đội tích hợp - cần giữ nguyên binding, `autoId`, placeholder và public API.

## Scope

- Căn giữa avatar ở account trigger compact và bỏ chevron thừa.
- Ẩn brand/fallback `apps` khi V3 thu gọn, căn giữa nút mở drawer.
- Dùng một presentation component nội bộ cho bốn ô tìm kiếm V2/V3.
- Đồng bộ Angular 19/20/21, cập nhật Layout guide và changelog.

## Out Of Scope

- Layout V1 và public API.
- Thay đổi thuật toán lọc, signal flow hoặc nội dung placeholder.
- Sửa accessibility toàn cục của `SdInput` ngoài module Layout.

## Success Criteria

- 10 acceptance criteria trong tài liệu thiết kế đều có implementation và bằng
  chứng kiểm thử.
- Test Layout, lint release, build thư viện/Showcase và browser UAT đều pass.
