# Acceptance Criteria - Layout V2/V3 Navigation Polish

| ID | User Story | Criterion | Verification | Status |
|---|---|---|---|---|
| AC1 | US1 | V2 desktop hiển thị avatar căn giữa, không có account chevron kế bên. | unit + browser | verified |
| AC2 | US2 | V3 collapsed không hiển thị brand logo hoặc fallback `apps`. | unit + browser | verified |
| AC3 | US2 | Nút mở V3 được căn giữa trong drawer 72px. | computed style + browser | verified |
| AC4 | US1 | Account trigger V3 collapsed căn giữa, không overflow hoặc chevron. | unit + browser | verified |
| AC5 | US1 | V3 expanded và mobile vẫn giữ avatar, identity và disclosure indicator. | unit + browser | verified |
| AC6 | US3 | Bốn ô tìm kiếm V2/V3 dùng Soft-pill và search icon. | integration + browser | verified |
| AC7 | US3 | Placeholder, `autoId`, kết quả lọc và signal flow không đổi. | integration + browser | verified |
| AC8 | US3 | Account trigger, drawer control và search pill có focus indicator rõ. | source + browser | verified |
| AC9 | US4 | Layout V1 và toàn bộ public API không đổi. | diff guard | verified |
| AC10 | US4 | Angular 19/20/21 đồng bộ; test, lint, build và browser checks pass. | release verification | verified |
