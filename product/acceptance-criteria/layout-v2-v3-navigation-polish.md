# Acceptance Criteria - Layout V2/V3 Navigation Polish

| ID   | User Story | Criterion                                                                                        | Verification             | Status   |
| ---- | ---------- | ------------------------------------------------------------------------------------------------ | ------------------------ | -------- |
| AC1  | US1        | V2 desktop hiển thị avatar căn giữa, không có account chevron kế bên.                            | unit + browser           | verified |
| AC2  | US2        | V3 collapsed không hiển thị brand logo hoặc fallback `apps`.                                     | unit + browser           | verified |
| AC3  | US2        | Nút mở V3 được căn giữa trong drawer 72px.                                                       | computed style + browser | verified |
| AC4  | US1        | Account trigger V3 collapsed căn giữa, không overflow hoặc chevron.                              | unit + browser           | verified |
| AC5  | US1        | V3 expanded và mobile vẫn giữ avatar, identity và disclosure indicator.                          | unit + browser           | verified |
| AC6  | US3        | Bốn ô tìm kiếm V2/V3 dùng Soft-pill và search icon.                                              | integration + browser    | verified |
| AC7  | US3        | Placeholder, `autoId`, kết quả lọc và signal flow không đổi.                                     | integration + browser    | verified |
| AC8  | US3        | Account trigger, drawer control và search pill có focus indicator rõ.                            | source + browser         | verified |
| AC9  | US4        | Layout V1 và toàn bộ public API không đổi.                                                       | diff guard               | verified |
| AC10 | US4        | Angular 19/20/21 đồng bộ; Layout test, targeted lint, build và browser checks pass.              | release verification     | verified |
| AC11 | US5        | V2/V3 mobile hiển thị profile và đăng xuất trực tiếp cùng một hàng.                              | unit + browser           | verified |
| AC12 | US6        | Pin menu desktop V2/V3 ẩn mặc định và chỉ hiện sau khoảng 300ms hover hoặc khi focus bàn phím.   | unit + browser           | verified |
| AC13 | US5        | Pin/unpin trên mobile V2/V3 luôn hiển thị và dùng glyph `push_pin` tương thích.                  | unit + browser           | verified |
| AC14 | US7        | Search V3 mobile giữ sticky, có nền kín và không để item menu lọt phía dưới khi scroll.          | unit + browser           | verified |
| AC15 | US8        | V1 dùng custom logo khi được truyền; nếu thiếu logo thì fallback icon `apps` có accessible name. | unit + browser           | verified |
| AC16 | US9        | Avatar account V1 desktop nằm trong live preview và mở được account menu.                        | unit + browser           | verified |
