# Acceptance Criteria - Layout account menu

| ID     | User Story | Tiêu chí                                                                    | Verification                             | Trạng thái |
| ------ | ---------- | --------------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| AC-001 | US1        | V1 không hiển thị raw logout translation key                                | V1 user spec, Showcase spec/UAT          | verified   |
| AC-002 | US1        | Signout V1 có icon `logout`, màu error và hover/focus state                 | V1 user spec, browser UAT                | verified   |
| AC-003 | US1        | Identity V1 đặt avatar trái, tên/email phải như V2/V3                       | V1 desktop/mobile specs, UAT             | verified   |
| AC-004 | US1        | Role hợp lệ hiển thị text/icon/color trên V1/V2/V3                          | shared user-menu spec, Showcase spec/UAT | verified   |
| AC-005 | US1        | Role null/undefined/rỗng không render                                       | shared user-menu spec                    | verified   |
| AC-006 | US2        | `updateProfile` chỉ hiện khi cấu hình và gọi một lần                        | shared user-menu spec                    | verified   |
| AC-007 | US2        | `setting` chỉ hiện khi cấu hình và gọi một lần                              | shared user-menu spec                    | verified   |
| AC-008 | US2        | `notification` chỉ hiện khi cấu hình và gọi action một lần                  | shared user-menu spec                    | verified   |
| AC-009 | US2, US3   | Number, Signal và Observable cập nhật badge đúng                            | configuration/shared specs               | verified   |
| AC-010 | US2, US3   | Badge ẩn ở 0, normalize invalid và cap `99+`                                | shared user-menu spec                    | verified   |
| AC-011 | US3        | Observable có một subscription và cleanup khi destroy/source đổi            | shared user-menu spec                    | verified   |
| AC-012 | US4        | Mobile V1/V2/V3 giữ identity + signout cùng hàng, action ở dưới             | mobile/Showcase specs, 390px UAT         | verified   |
| AC-013 | US5        | Desktop action order đúng; hỗ trợ arrows/Home/End/Escape/focus restoration  | shared user-menu spec                    | verified   |
| AC-014 | US6        | Consumer không dùng API mới vẫn giữ `userInfo`, `changePassword`, `signout` | configuration/shared/V1 specs            | verified   |
| AC-015 | US7        | Ba independent Showcase thể hiện role/actions/badge ở desktop/mobile        | Showcase spec và browser UAT             | verified   |
