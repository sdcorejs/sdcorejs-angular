# Decisions - Layout V2/V3 Navigation Polish

| Date       | Decision                                                                          | Reason                                                                           | Impact                      |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| 2026-07-23 | Chọn Soft-pill nền xám, bo tròn và có leading search icon.                        | Phù hợp phản hồi trực tiếp và giữ nhận diện focus rõ.                            | Layout V2/V3 desktop/mobile |
| 2026-07-23 | Dùng component presentation nội bộ, không export public.                          | Tránh tăng public surface cho một chi tiết trình bày.                            | Angular library internals   |
| 2026-07-23 | Compact account chỉ ẩn identity/chevron, vẫn giữ full trigger và accessible name. | Giữ hit target, khả năng mở menu và hỗ trợ screen reader.                        | V2 desktop, V3 collapsed    |
| 2026-07-24 | Giữ finding `SdInput aria-hidden` ngoài scope Layout.                             | Đây là hành vi toàn cục có blast radius riêng, cần audit/fix độc lập.            | Follow-up forms/input       |
| 2026-07-25 | Dùng `push_pin` và hover-delay 300ms trên desktop; mobile luôn hiện pin.          | Glyph tương thích Material Icon hiện tại và mobile không có hover.               | Menu tree V2/V3             |
| 2026-07-25 | V2/V3 mobile cùng dùng account row inline.                                        | Profile và đăng xuất cần cùng hàng để sheet gọn, nhất quán giữa hai layout.      | Shared user menu            |
| 2026-07-25 | V1 fallback bằng icon `apps`, custom logo dùng ảnh được truyền.                   | Đồng nhất contract branding V1/V2/V3 và tránh title chiếm vùng logo.             | Sidebar V1                  |
| 2026-07-25 | Giới hạn legacy `100vh` của V1 trong live preview Showcase.                       | Giữ avatar account V1 nhìn thấy và tương tác được mà không đổi runtime ứng dụng. | Showcase Layout fixture     |
