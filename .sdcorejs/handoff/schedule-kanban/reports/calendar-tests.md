# sd-calendar · test
Commit: 676e8380 (nhánh `feat/calendar`) · Node local v26.12.0 (PD chốt Q1; CI Node 24.22.1 là cổng chuẩn) · Chrome Headless 156

## Lệnh (TESTING.md §1)
| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` | 9291/9291 SUCCESS (7m28s), seed 782879. Tổng: statements 88.15%, branches 79.44%, functions 87.3%, lines 90.52% (ngưỡng 78/67/75/78) |
| Lệnh nhanh calendar (`--include='**/components/calendar/**/*.spec.ts'`) | 156/156 SUCCESS |
| `npm run lint` (v19) | All files pass linting |
| `npx ng build sdcorejs-angular` | Thành công (chỉ cảnh báo cũ của `modules/icon`) |
| `npm run test:theme` | 65/65 |
| `npm run check:scss-hex` | 0 finding |
| `npm run sync` + `npm run check:sync` | Passed: v20, v21, v22 match v19 (đã khôi phục ~1575 file v22 đổi CRLF giả, diff rỗng) |
| `npm run test:scripts` | 18 bộ, 0 lỗi |
| Showcase `documentation.registry.spec.ts` | 10/10 |
| `npm --prefix showcase run link:library` + Playwright `e2e/components/calendar.e2e.ts` | 40/40 (20 kịch bản × 2 project zone `asia-bangkok`, `utc`) · 1.4m · Chromium |

## Coverage từng file (TESTING.md §2)
| File | Statements | Branches | Ngưỡng |
| --- | --- | --- | --- |
| `calendar.utils.ts` | 100% | 100% | 100/100 ✓ |
| `calendar-move.ts` | 100% | 100% | — (hàm thuần, đạt 100) |
| `calendar-loader.ts` | 100% | 100% | — (hàm thuần, đạt 100) |
| `calendar.component.ts` | 99.88% | 88.98% | ≥90/≥85 ✓ |
| `calendar.templates.ts`, `calendar.model.ts`, `calendar.configuration.ts` | không đo | | type test `calendar.types.spec.ts` |

## Mã test
| Mã | File:dòng test | Kết quả |
| --- | --- | --- |
| CAL-U-01 | calendar.utils.spec.ts:56, calendar.utils.spec.ts:81, calendar.utils.spec.ts:99 | ✓ |
| CAL-U-02 | calendar.utils.spec.ts:110 | ✓ |
| CAL-U-03 | calendar.utils.spec.ts:124 | ✓ |
| CAL-U-04 | calendar.utils.spec.ts:154 | ✓ |
| CAL-U-05 | calendar.utils.spec.ts:168 | ✓ |
| CAL-U-06 | calendar.utils.spec.ts:200 | ✓ |
| CAL-U-07 | calendar.utils.spec.ts:212 | ✓ |
| CAL-U-08 | calendar.utils.spec.ts:224 | ✓ |
| CAL-U-09 | calendar.utils.spec.ts:251 | ✓ |
| CAL-U-10 | calendar.utils.spec.ts:263 | ✓ |
| CAL-U-11 | calendar.utils.spec.ts:280 | ✓ |
| CAL-U-12 | calendar.utils.spec.ts:300 | ✓ |
| CAL-U-13 | calendar.utils.spec.ts:327 | ✓ |
| CAL-U-14 | calendar.utils.spec.ts:360 | ✓ |
| CAL-U-15 | calendar.utils.spec.ts:377 | ✓ |
| CAL-U-16 | calendar.utils.spec.ts:388 | ✓ |
| CAL-U-17 | calendar.utils.spec.ts:394 | ✓ |
| CAL-U-18 | calendar.utils.spec.ts:404, calendar.utils.spec.ts:439 | ✓ |
| CAL-U-19 | calendar.utils.spec.ts:423 | ✓ |
| CAL-U-20 | calendar.utils.spec.ts:474 | ✓ |
| CAL-U-21 | calendar.utils.spec.ts:526, calendar.utils.spec.ts:533, calendar.utils.spec.ts:542 | ✓ |
| CAL-C-01 | calendar.component.spec.ts:88, calendar.component.spec.ts:109, calendar.component.spec.ts:515, calendar.component.spec.ts:537, calendar.component.spec.ts:558 | ✓ |
| CAL-C-02 | calendar.component.spec.ts:118 | ✓ |
| CAL-C-03 | calendar.component.spec.ts:128, calendar.component.spec.ts:217 | ✓ |
| CAL-C-04 | calendar.component.spec.ts:161 | ✓ |
| CAL-C-05 | calendar.component.spec.ts:167 | ✓ |
| CAL-C-06 | calendar.component.spec.ts:180, calendar.component.spec.ts:200 | ✓ |
| CAL-C-07 | calendar.component.spec.ts:234, calendar.component.spec.ts:242 | ✓ |
| CAL-C-08 | calendar.edges.spec.ts:51, calendar.edges.spec.ts:71, calendar.interaction.spec.ts:174, calendar.interaction.spec.ts:188 | ✓ |
| CAL-C-09 | calendar.interaction.spec.ts:200 | ✓ |
| CAL-C-10 | calendar.edges.spec.ts:96, calendar.interaction.spec.ts:557 | ✓ |
| CAL-C-11 | calendar.edges.spec.ts:82, calendar.interaction.spec.ts:582 | ✓ |
| CAL-C-12 | calendar.edges.spec.ts:119, calendar.interaction.spec.ts:604, calendar.interaction.spec.ts:632 | ✓ |
| CAL-C-13 | calendar.recurring.spec.ts:54, calendar.recurring.spec.ts:60, calendar.recurring.spec.ts:77, calendar.recurring.spec.ts:95, calendar.recurring.spec.ts:111 | ✓ |
| CAL-C-14 | calendar.component.spec.ts:586, calendar.component.spec.ts:607, calendar.interaction.spec.ts:720 | ✓ |
| CAL-C-15 | calendar.component.spec.ts:624, calendar.component.spec.ts:631, calendar.component.spec.ts:772, calendar.component.spec.ts:787 | ✓ |
| CAL-C-16 | calendar.component.spec.ts:391, calendar.utils.spec.ts:457 | ✓ |
| CAL-C-17 | calendar.component.spec.ts:408, calendar.interaction.spec.ts:538 | ✓ |
| CAL-C-18 | calendar.compact.spec.ts:78, calendar.compact.spec.ts:94, calendar.compact.spec.ts:120, calendar.compact.spec.ts:141, calendar.compact.spec.ts:180 | ✓ |
| CAL-C-19 | calendar.component.spec.ts:361, calendar.component.spec.ts:642, calendar.edges.spec.ts:171, calendar.interaction.spec.ts:690 | ✓ |
| CAL-C-20 | calendar.component.spec.ts:425, calendar.component.spec.ts:435, calendar.component.spec.ts:463, calendar.component.spec.ts:472, calendar.component.spec.ts:480, calendar.edges.spec.ts:199, calendar.utils.spec.ts:563, calendar.utils.spec.ts:604 | ✓ |
| CAL-C-21 | calendar.component.spec.ts:490 | ✓ |
| CAL-C-22 | calendar.component.spec.ts:752, calendar.component.spec.ts:764, calendar.types.spec.ts:45 | ✓ |
| CAL-C-23 | calendar.exports.spec.ts:15 | ✓ |
| CAL-SC-01 | calendar.component.spec.ts:382 | ✓ |
| CAL-SC-02 | calendar.interaction.spec.ts:351 | ✓ |
| CAL-SC-03 | calendar.interaction.spec.ts:360 | ✓ |
| CAL-SC-06 | calendar-pipeline.spec.ts:42, calendar.edges.spec.ts:131, calendar.interaction.spec.ts:253, calendar.interaction.spec.ts:518 | ✓ |
| CAL-SC-07 | calendar.interaction.spec.ts:266, calendar.interaction.spec.ts:529 | ✓ |
| CAL-SC-09 | calendar-pipeline.spec.ts:23, calendar.interaction.spec.ts:289, calendar.types.spec.ts:15 | ✓ |
| CAL-SC-10 | calendar.interaction.spec.ts:302 | ✓ |
| CAL-SC-11 | calendar.interaction.spec.ts:308 | ✓ |
| CAL-SC-12 | calendar.interaction.spec.ts:322 | ✓ |
| CAL-SC-13 | calendar.interaction.spec.ts:332 | ✓ |
| CAL-SC-14 | calendar-pipeline.spec.ts:51, calendar.interaction.spec.ts:404, calendar.recurring.spec.ts:126 | ✓ |
| CAL-SC-15 | calendar-pipeline.spec.ts:37, calendar.interaction.spec.ts:427, calendar.interaction.spec.ts:444, calendar.recurring.spec.ts:137 | ✓ |
| CAL-SC-16 | calendar.component.spec.ts:343 | ✓ |
| CAL-SC-17 | calendar.edges.spec.ts:145, calendar.interaction.spec.ts:455, calendar.interaction.spec.ts:484 | ✓ |
| CAL-SC-18 | calendar.interaction.spec.ts:500 | ✓ |
| CAL-SC-19 | calendar.interaction.spec.ts:217 | ✓ |
| CAL-SC-20 | calendar.interaction.spec.ts:234 | ✓ |
| CAL-SC-21 | calendar.interaction.spec.ts:242 | ✓ |
| CAL-SC-22 | calendar.component.spec.ts:252, calendar.component.spec.ts:287, calendar.types.spec.ts:27 | ✓ |
| CAL-SC-23 | calendar-pipeline.spec.ts:71, calendar.component.spec.ts:267 | ✓ |
| CAL-SC-24 | calendar-pipeline.spec.ts:108, calendar.component.spec.ts:301, calendar.component.spec.ts:332 | ✓ |
| CAL-SC-26 | calendar.interaction.spec.ts:93, calendar.interaction.spec.ts:119 | ✓ |
| CAL-SC-27 | calendar.interaction.spec.ts:138 | ✓ |
| CAL-SC-28 | calendar.interaction.spec.ts:148 | ✓ |
| CAL-SC-29 | calendar.interaction.spec.ts:652 | ✓ |
| CAL-SC-30 | calendar.interaction.spec.ts:666 | ✓ |
| CAL-SC-31 | calendar.interaction.spec.ts:680 | ✓ |
| CAL-SC-32 | calendar.compact.spec.ts:53, calendar.compact.spec.ts:63 | ✓ |
| CAL-SC-33 | calendar.component.spec.ts:655 | ✓ |
| CAL-SC-34 | calendar.compact.spec.ts:149 | ✓ |
| CAL-SC-35 | calendar.compact.spec.ts:156 | ✓ |
| CAL-SC-37 | calendar.i18n.spec.ts:11 | ✓ |
| CAL-SC-38 | calendar.component.spec.ts:678 | ✓ |
| CAL-E-01 | calendar.e2e.ts:113, calendar.e2e.ts:299 | ✓ |
| CAL-E-02 | calendar.e2e.ts:125 | ✓ |
| CAL-E-03 | calendar.e2e.ts:135 | ✓ |
| CAL-E-04 | calendar.e2e.ts:143, calendar.e2e.ts:315 | ✓ |
| CAL-E-05 | calendar.e2e.ts:156 | ✓ |
| CAL-E-06 | calendar.e2e.ts:168 | ✓ |
| CAL-E-07 | calendar.e2e.ts:189 | ✓ |
| CAL-E-08 | calendar.e2e.ts:201 | ✓ |
| CAL-E-09 | calendar.e2e.ts:213 | ✓ |
| CAL-E-10 | calendar.e2e.ts:222 | ✓ |
| CAL-E-11 | calendar.e2e.ts:241 | ✓ |
| CAL-E-12 | calendar.e2e.ts:257 | ✓ |
| CAL-E-13 | calendar.e2e.ts:343 | ✓ |
| CAL-E-14 | calendar.e2e.ts:272 | ✓ |
| CAL-E-15 | calendar.e2e.ts:359, calendar.e2e.ts:371 | ✓ |
| CAL-E-16 | calendar.e2e.ts:284 | ✓ |
| CAL-E-17 | calendar.e2e.ts:292 | ✓ |
| CAL-B-01 | calendar.component.spec.ts:317 | ✓ |
| CAL-B-02 | calendar.component.spec.ts:664 | ✓ |
| CAL-B-03 | calendar.compact.spec.ts:71 | ✓ |
| CAL-B-04 | calendar.edges.spec.ts:193 | ✓ |

Missing: CAL-SC-08, CAL-SC-25

Bỏ qua có lý do:
- CAL-SC-08 — calendar không có `move.droppable` (PD chốt Q3); vai trò chặn đích do `minDate`/`maxDate` (test CAL-C-08, CAL-C-12 out-of-range, CAL-SC-17).
- CAL-SC-25 — calendar không có input `items` (chỉ `dataSource`).

## E2E (TESTING.md §5.3, §11)
- Trình duyệt: chỉ Chromium (cấu hình Playwright của showcase chỉ có Chromium; ghi lại theo §11).
- Bề rộng: desktop chạy ở viewport 1920 vì ở 1280 trang docs chỉ để ~650px cho một ví dụ (lịch thành compact); component rộng 763px. Cột 400px trên desktop (CAL-E-17), 390px `hasTouch`/`isMobile` (CAL-E-13).
- Zone trình duyệt: `Asia/Bangkok`, `UTC` (project), `America/New_York` + `?timeZone=Asia/Ho_Chi_Minh` (CAL-E-15), `Asia/Kolkata` (CAL-E-15).
- Media: print (CAL-E-16), forced-colors + reduced-motion (ảnh), dark, RTL (ảnh).
- axe-core 4.13.0 (từ `versions/v19/node_modules`, không thêm dependency): 0 vi phạm serious/critical ở tuần light và ở forced-colors.
- Locale: E2E chạy vi; en được kiểm ở Karma (CAL-C-01 titles in English). ja/ko/zh: chỉ kiểm đủ key (CAL-SC-37).

## Hiệu năng (TESTING.md §10, showcase dev build, máy local, 5 lần, trung vị)
| Kịch bản | Đo | Ngân sách |
| --- | --- | --- |
| Tuần, 500 sự kiện, render đầu (bấm "500 sự kiện" → khung hình kế) | 157–224 ms qua các lần chạy (1 worker 157–196, 2 worker song song 210–224) | ≤ 150 ms — **vượt** |
| Kéo trong lúc 500 sự kiện | 0 long task | không task > 50 ms ✓ |

Vượt ngân sách render khi đo trên dev build (không tối ưu, JIT CSS) và máy dùng chung với dev server. Đề xuất: đo lại trên production build ở CI; nếu vẫn vượt, nhớ placement theo sự kiện (bỏ `Intl` khi chỉ đổi lựa chọn, ghi chú R1-G6) trước khi nghĩ tới virtual scroll. Không tự thêm virtual scroll.

## Ảnh chụp (§9)
`reports/calendar-screens/`: week-1280-light, week-1280-dark, week-1280-rtl, week-forced-colors, day-1280-light, state-load-error, print-week, compact-400, mobile-390. Chưa đặt cạnh từng mục của `SD Calendar Design.dc.html` (cần mở HTML và chụp cùng bề rộng; để reviewer so).
