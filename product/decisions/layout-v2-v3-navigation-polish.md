# Decisions - Layout V2/V3 Navigation Polish

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-07-23 | Chọn Soft-pill nền xám, bo tròn và có leading search icon. | Phù hợp phản hồi trực tiếp và giữ nhận diện focus rõ. | Layout V2/V3 desktop/mobile |
| 2026-07-23 | Dùng component presentation nội bộ, không export public. | Tránh tăng public surface cho một chi tiết trình bày. | Angular library internals |
| 2026-07-23 | Compact account chỉ ẩn identity/chevron, vẫn giữ full trigger và accessible name. | Giữ hit target, khả năng mở menu và hỗ trợ screen reader. | V2 desktop, V3 collapsed |
| 2026-07-24 | Giữ finding `SdInput aria-hidden` ngoài scope Layout. | Đây là hành vi toàn cục có blast radius riêng, cần audit/fix độc lập. | Follow-up forms/input |
