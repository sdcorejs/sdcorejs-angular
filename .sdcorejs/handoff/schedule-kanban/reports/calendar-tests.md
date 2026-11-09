# sd-calendar · test
Commit: e77967c2 (nhánh `feat/calendar`, sau các sửa của R2 và R2') · Node local v26.12.0 (PD chốt Q1; CI Node 24.22.1 là cổng chuẩn) · Chrome Headless 156

## Lệnh (TESTING.md §1)
| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` | 9308/9308 SUCCESS (6m33s), seed 535832. Tổng: statements 88.16%, branches 79.46%, functions 87.3%, lines 90.53% (ngưỡng 78/67/75/78) |
| Lệnh nhanh calendar (`--include='**/components/calendar/**/*.spec.ts'`) | 173/173 SUCCESS |
| `npm run lint` (v19) | All files pass linting |
| `npx ng build sdcorejs-angular` | Thành công (chỉ cảnh báo cũ của `modules/icon`) |
| `npm run test:theme` | 65/65 |
| `npm run check:scss-hex` | 0 finding |
| `npm run sync` + `npm run check:sync` | Passed: v20, v21, v22 match v19 (đã khôi phục 1575 file v22 đổi CRLF giả, diff rỗng) |
| `npm run test:scripts` | exit 0, 0 lỗi |
| Showcase `documentation.registry.spec.ts` | 10/10 (ở `676e8380`; registry không đổi sau đó) |
| `npm --prefix showcase run link:library` + Playwright `e2e/components/calendar.e2e.ts` (cấu hình của repo, cổng 4321) | 44 passed, 4 skipped (2m05s): 20 kịch bản × 2 project zone `asia-bangkok`, `utc`, cộng 4 test chụp ảnh chỉ chạy ở `asia-bangkok` · Chromium |

## Coverage từng file (TESTING.md §2)
Statements lấy từ báo cáo HTML của Istanbul, branches và lines từ `lcov.info` (R2 B-7: bản trước ghi nhầm số Lines vào cột Statements).

| File | Statements | Branches | Lines | Ngưỡng |
| --- | --- | --- | --- | --- |
| `calendar.utils.ts` | 100% (208/208) | 100% (91/91) | 100% | 100/100 ✓ |
| `calendar-move.ts` | 100% (31/31) | 100% (16/16) | 100% | — (hàm thuần, đạt 100) |
| `calendar-loader.ts` | 100% (30/30) | 100% (13/13) | 100% | — (hàm thuần, đạt 100) |
| `calendar.component.ts` | 97.78% (1016/1039) | 89.59% (542/605) | 99.89% (871/872) | ≥90/≥85 ✓ |
| `calendar.templates.ts`, `calendar.configuration.ts` | 100% | — | 100% | type test `calendar.types.spec.ts` |

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
| CAL-U-11 | calendar.utils.spec.ts:294 | ✓ |
| CAL-U-12 | calendar.utils.spec.ts:314 | ✓ |
| CAL-U-13 | calendar.utils.spec.ts:341 | ✓ |
| CAL-U-14 | calendar.utils.spec.ts:374 | ✓ |
| CAL-U-15 | calendar.utils.spec.ts:391 | ✓ |
| CAL-U-16 | calendar.utils.spec.ts:402 | ✓ |
| CAL-U-17 | calendar.utils.spec.ts:408 | ✓ |
| CAL-U-18 | calendar.utils.spec.ts:418, calendar.utils.spec.ts:453 | ✓ |
| CAL-U-19 | calendar.utils.spec.ts:437 | ✓ |
| CAL-U-20 | calendar.utils.spec.ts:488 | ✓ |
| CAL-U-21 | calendar.utils.spec.ts:540, calendar.utils.spec.ts:547, calendar.utils.spec.ts:556 | ✓ |
| CAL-C-01 | calendar.component.spec.ts:88, calendar.component.spec.ts:109, calendar.component.spec.ts:515, calendar.component.spec.ts:537, calendar.component.spec.ts:558 | ✓ |
| CAL-C-02 | calendar.component.spec.ts:118 | ✓ |
| CAL-C-03 | calendar.component.spec.ts:128, calendar.component.spec.ts:217 | ✓ |
| CAL-C-04 | calendar.component.spec.ts:161 | ✓ |
| CAL-C-05 | calendar.component.spec.ts:167 | ✓ |
| CAL-C-06 | calendar.component.spec.ts:180, calendar.component.spec.ts:200 | ✓ |
| CAL-C-07 | calendar.component.spec.ts:234, calendar.component.spec.ts:242 | ✓ |
| CAL-C-08 | calendar.edges.spec.ts:51, calendar.edges.spec.ts:71, calendar.interaction.spec.ts:174, calendar.interaction.spec.ts:188 | ✓ |
| CAL-C-09 | calendar.interaction.spec.ts:200 | ✓ |
| CAL-C-10 | calendar.edges.spec.ts:96, calendar.interaction.spec.ts:590 | ✓ |
| CAL-C-11 | calendar.edges.spec.ts:82, calendar.interaction.spec.ts:654 | ✓ |
| CAL-C-12 | calendar.edges.spec.ts:119, calendar.interaction.spec.ts:676, calendar.interaction.spec.ts:704 | ✓ |
| CAL-C-13 | calendar.recurring.spec.ts:54, calendar.recurring.spec.ts:60, calendar.recurring.spec.ts:77, calendar.recurring.spec.ts:149, calendar.recurring.spec.ts:165 | ✓ |
| CAL-C-14 | calendar.component.spec.ts:586, calendar.component.spec.ts:607, calendar.interaction.spec.ts:792 | ✓ |
| CAL-C-15 | calendar.component.spec.ts:624, calendar.component.spec.ts:631, calendar.component.spec.ts:772, calendar.component.spec.ts:787 | ✓ |
| CAL-C-16 | calendar.component.spec.ts:391, calendar.utils.spec.ts:471 | ✓ |
| CAL-C-17 | calendar.component.spec.ts:408, calendar.interaction.spec.ts:571 | ✓ |
| CAL-C-18 | calendar.compact.spec.ts:78, calendar.compact.spec.ts:109, calendar.compact.spec.ts:170, calendar.compact.spec.ts:191, calendar.compact.spec.ts:230 | ✓ |
| CAL-C-19 | calendar.component.spec.ts:361, calendar.component.spec.ts:642, calendar.edges.spec.ts:171, calendar.interaction.spec.ts:762 | ✓ |
| CAL-C-20 | calendar.component.spec.ts:425, calendar.component.spec.ts:435, calendar.component.spec.ts:463, calendar.component.spec.ts:472, calendar.component.spec.ts:480, calendar.edges.spec.ts:330, calendar.utils.spec.ts:577, calendar.utils.spec.ts:618 | ✓ |
| CAL-C-21 | calendar.component.spec.ts:490 | ✓ |
| CAL-C-22 | calendar.component.spec.ts:752, calendar.component.spec.ts:764, calendar.types.spec.ts:45 | ✓ |
| CAL-C-23 | calendar.exports.spec.ts:15 | ✓ |
| CAL-SC-01 | calendar.component.spec.ts:382 | ✓ |
| CAL-SC-02 | calendar.interaction.spec.ts:384 | ✓ |
| CAL-SC-03 | calendar.interaction.spec.ts:393 | ✓ |
| CAL-SC-06 | calendar-pipeline.spec.ts:42, calendar.edges.spec.ts:131, calendar.interaction.spec.ts:286, calendar.interaction.spec.ts:551 | ✓ |
| CAL-SC-07 | calendar.interaction.spec.ts:299, calendar.interaction.spec.ts:562 | ✓ |
| CAL-SC-09 | calendar-pipeline.spec.ts:23, calendar.interaction.spec.ts:322, calendar.types.spec.ts:15 | ✓ |
| CAL-SC-10 | calendar.interaction.spec.ts:335 | ✓ |
| CAL-SC-11 | calendar.interaction.spec.ts:341 | ✓ |
| CAL-SC-12 | calendar.interaction.spec.ts:355 | ✓ |
| CAL-SC-13 | calendar.interaction.spec.ts:365 | ✓ |
| CAL-SC-14 | calendar-pipeline.spec.ts:51, calendar.interaction.spec.ts:437, calendar.recurring.spec.ts:180 | ✓ |
| CAL-SC-15 | calendar-pipeline.spec.ts:37, calendar.interaction.spec.ts:460, calendar.interaction.spec.ts:477, calendar.recurring.spec.ts:191 | ✓ |
| CAL-SC-16 | calendar.component.spec.ts:343 | ✓ |
| CAL-SC-17 | calendar.edges.spec.ts:145, calendar.interaction.spec.ts:488, calendar.interaction.spec.ts:517 | ✓ |
| CAL-SC-18 | calendar.interaction.spec.ts:533 | ✓ |
| CAL-SC-19 | calendar.interaction.spec.ts:250 | ✓ |
| CAL-SC-20 | calendar.interaction.spec.ts:267 | ✓ |
| CAL-SC-21 | calendar.interaction.spec.ts:275 | ✓ |
| CAL-SC-22 | calendar.component.spec.ts:252, calendar.component.spec.ts:287, calendar.types.spec.ts:27 | ✓ |
| CAL-SC-23 | calendar-pipeline.spec.ts:71, calendar.component.spec.ts:267 | ✓ |
| CAL-SC-24 | calendar-pipeline.spec.ts:108, calendar.component.spec.ts:301, calendar.component.spec.ts:332 | ✓ |
| CAL-SC-26 | calendar.interaction.spec.ts:93, calendar.interaction.spec.ts:119 | ✓ |
| CAL-SC-27 | calendar.interaction.spec.ts:138 | ✓ |
| CAL-SC-28 | calendar.interaction.spec.ts:148 | ✓ |
| CAL-SC-29 | calendar.interaction.spec.ts:724 | ✓ |
| CAL-SC-30 | calendar.interaction.spec.ts:738 | ✓ |
| CAL-SC-31 | calendar.interaction.spec.ts:752 | ✓ |
| CAL-SC-32 | calendar.compact.spec.ts:53, calendar.compact.spec.ts:63 | ✓ |
| CAL-SC-33 | calendar.component.spec.ts:655 | ✓ |
| CAL-SC-34 | calendar.compact.spec.ts:199 | ✓ |
| CAL-SC-35 | calendar.compact.spec.ts:206 | ✓ |
| CAL-SC-37 | calendar.i18n.spec.ts:11 | ✓ |
| CAL-SC-38 | calendar.component.spec.ts:678 | ✓ |
| CAL-E-01 | calendar.e2e.ts:130, calendar.e2e.ts:317, calendar.e2e.ts:422 | ✓ |
| CAL-E-02 | calendar.e2e.ts:141 | ✓ |
| CAL-E-03 | calendar.e2e.ts:151, calendar.e2e.ts:440 | ✓ |
| CAL-E-04 | calendar.e2e.ts:159, calendar.e2e.ts:325 | ✓ |
| CAL-E-05 | calendar.e2e.ts:172 | ✓ |
| CAL-E-06 | calendar.e2e.ts:184 | ✓ |
| CAL-E-07 | calendar.e2e.ts:207 | ✓ |
| CAL-E-08 | calendar.e2e.ts:219 | ✓ |
| CAL-E-09 | calendar.e2e.ts:231 | ✓ |
| CAL-E-10 | calendar.e2e.ts:240 | ✓ |
| CAL-E-11 | calendar.e2e.ts:259 | ✓ |
| CAL-E-12 | calendar.e2e.ts:274 | ✓ |
| CAL-E-13 | calendar.e2e.ts:359 | ✓ |
| CAL-E-14 | calendar.e2e.ts:289, calendar.e2e.ts:504 | ✓ |
| CAL-E-15 | calendar.e2e.ts:374, calendar.e2e.ts:386 | ✓ |
| CAL-E-16 | calendar.e2e.ts:301 | ✓ |
| CAL-E-17 | calendar.e2e.ts:309, calendar.e2e.ts:528 | ✓ |
| CAL-B-01 | calendar.component.spec.ts:317 | ✓ |
| CAL-B-02 | calendar.component.spec.ts:664 | ✓ |
| CAL-B-03 | calendar.compact.spec.ts:71 | ✓ |
| CAL-B-04 | calendar.edges.spec.ts:193 | ✓ |
| CAL-B-05 | calendar.recurring.spec.ts:97, calendar.recurring.spec.ts:120 | ✓ |
| CAL-B-06 | calendar.compact.spec.ts:135 | ✓ |
| CAL-B-07 | calendar.interaction.spec.ts:615 | ✓ |
| CAL-B-08 | calendar.interaction.spec.ts:217 | ✓ |
| CAL-B-09 | calendar.utils.spec.ts:276 | ✓ |
| CAL-B-10 | calendar.recurring.spec.ts:133 | ✓ |
| CAL-B-11 | calendar.edges.spec.ts:199 | ✓ |
| CAL-B-12 | calendar.compact.spec.ts:94 | ✓ |
| CAL-B-13 | calendar.compact.spec.ts:101 | ✓ |
| CAL-B-14 | calendar.edges.spec.ts:215 | ✓ |
| CAL-B-15 | calendar.edges.spec.ts:231 | ✓ |
| CAL-B-16 | calendar.edges.spec.ts:243 | ✓ |
| CAL-B-17 | calendar.edges.spec.ts:250 | ✓ |
| CAL-B-18 | calendar.edges.spec.ts:264 | ✓ |
| CAL-B-19 | calendar.edges.spec.ts:305 | ✓ |
| CAL-B-20 | calendar.interaction.spec.ts:641 | ✓ |

Missing: CAL-SC-08, CAL-SC-25

Bỏ qua có lý do:
- CAL-SC-08 — calendar không có `move.droppable` (PD chốt Q3); vai trò chặn đích do `minDate`/`maxDate` (test CAL-C-08, CAL-C-12 out-of-range, CAL-SC-17).
- CAL-SC-25 — calendar không có input `items` (chỉ `dataSource`).

## E2E (TESTING.md §5.3, §11)
- Trình duyệt: chỉ Chromium (cấu hình Playwright của showcase chỉ có Chromium; ghi lại theo §11).
- Bề rộng: kịch bản desktop chạy ở viewport 1920 vì ở 1280 trang docs chỉ để ~650px cho một ví dụ (lịch thành compact); component rộng ~760px trong cột docs. Ảnh §9 chụp trong khung cố định 960px và 390px (xem mục Ảnh). Cột 400px trên desktop (CAL-E-17), 390px `hasTouch`/`isMobile` (CAL-E-13). PD chốt về viewport: R2 B-4.
- Zone trình duyệt: `Asia/Bangkok`, `UTC` (project), `America/New_York` + `?timeZone=Asia/Ho_Chi_Minh` (CAL-E-15), `Asia/Kolkata` (CAL-E-15). Karma với biến `TZ` khác không kiểm được trên Windows vì Chrome bỏ qua `TZ` (R2 B-9).
- Media: print (CAL-E-16), forced-colors + reduced-motion (CAL-E-01), dark và RTL (ảnh 960px).
- axe-core 4.13.0 (từ `versions/v19/node_modules`, không thêm dependency): 0 vi phạm serious/critical ở tuần light và ở forced-colors.
- Focus: CAL-E-06 kiểm focus về khối sau Esc ở thanh hỏi phạm vi (SC-29, R2 A-18).
- Locale: E2E chạy vi; en được kiểm ở Karma (CAL-C-01 titles in English). ja/ko/zh: chỉ kiểm đủ key (CAL-SC-37).

## Hiệu năng (TESTING.md §10, showcase dev build, máy local, 5 lần, trung vị)
| Kịch bản | Đo | Ngân sách |
| --- | --- | --- |
| Tuần, 500 sự kiện, render đầu (bấm "500 sự kiện" → khung hình kế) | Sau R2': 177 ms và 187 ms (hai project chạy song song). Trước R2: 157–224 ms qua các lần chạy | ≤ 150 ms — **vượt** |
| Kéo trong lúc 500 sự kiện | 0 long task | không task > 50 ms ✓ |

Vượt ngân sách render khi đo trên dev build (không tối ưu, JIT CSS) và máy dùng chung với dev server. Đề xuất: đo lại trên production build ở CI; nếu vẫn vượt, nhớ placement theo sự kiện (bỏ `Intl` khi chỉ đổi lựa chọn, ghi chú R1-G6) trước khi nghĩ tới virtual scroll. Không tự thêm virtual scroll.

## Ảnh chụp (§9)
Thư mục `reports/calendar-screens/`. Ảnh calendar chụp bằng Playwright (Chromium, zone `Asia/Bangkok`, dữ liệu demo tuần 19–25/10/2026 của playground) trong khung cố định 960 × 640px, dạng hẹp 390 × 760px; chỉ project Bangkok ghi ảnh. Ảnh thiết kế `design-*.png` là các mục của `SD Calendar Design.dc.html`, chụp ở viewport 1280.

| Mục của HTML | Ảnh thiết kế | Ảnh calendar | Đối chiếu |
| --- | --- | --- | --- |
| 01 Giải phẫu (Tuần 960px) | `design-giai-phau.png` | `week-960-light.png`, `week-960-dark.png`, `week-960-rtl.png` | Khớp: thanh công cụ, cột giờ, hàng cả ngày, lưới 48px/giờ, nét giờ và nửa giờ, ngoài giờ và cuối tuần tô nền, ngày lễ dưới số ngày, chồng giờ chia cột và chừa phải, icon lặp. Khác do dữ liệu: showcase dùng ngày thật (09/11) nên 22/10 không tô "hôm nay" và không có đường giờ hiện tại (đã kiểm ở Karma); demo có thêm cụm sự kiện Thứ Ba. RTL: khối bám mép phải cột, chừa trái, mũi tên lật. |
| 02 Chế độ xem | `design-che-do.png` | `month-960-light.png`, `day-960-light.png`, `agenda-960-light.png` | Tháng: ô, ngày ngoài tháng xám, thanh nhiều ngày, "+N khác" khớp (chấm lặp ở ô kéo dài đã sửa, CAL-B-16). Ngày và Danh sách khớp; cột địa điểm của Danh sách chỉ có khi consumer cấp template (§11). |
| 03 Khối sự kiện | `design-su-kien.png` | `block-selected.png`, `block-pending.png`, `block-failed.png`, `block-past.png`, `interaction-drag.png`; màu và tầng nội dung trong `week-960-light.png` | Khớp: nền nhạt + chấm màu, chọn (viền + bóng), đang kéo (viền màu sự kiện, bóng lớn, chỗ cũ nét đứt), đang lưu (nét đứt + icon xoay), từ chối (viền đỏ), đã qua (nhạt). Hover và focus bàn phím không chụp (trạng thái con trỏ). |
| 04 Tương tác | `design-tuong-tac.png` | `interaction-sweep.png`, `interaction-drag.png`, `interaction-resize.png`, `interaction-cursor.png`, `interaction-scope.png`, `block-failed.png` | Khớp sáu khung. Thanh hỏi phạm vi ở đáy component — lệch #3. |
| 05 Trạng thái | `design-trang-thai.png` | `state-loading.png`, `state-load-error.png`, `state-empty.png` | Khớp: thanh chạy dưới thanh công cụ, dải lỗi + "Thử lại", Danh sách trống có icon và câu. |
| 06 Mobile | `design-mobile.png` | `mobile-390-light.png`, `mobile-390-dark.png`, `compact-400.png` | Khớp: hàng 1 tiêu đề + "Hôm nay" + ‹ › (CAL-B-13), hàng nút 3 chế độ với "Ngày" được nhấn (CAL-B-12), dải 7 ngày có chấm, hàng cả ngày. Thứ tự nút — lệch #4. |
| In, forced colors | — | `print-week.png`, `week-forced-colors.png` | Không có trong HTML; kiểm theo §16 và SC-35. |

### Lệch thiết kế có chủ đích
1. Nút thanh công cụ là nút native trong template, không dùng `sd-segmented`/`sd-button` (Q4 ở Bước 0: `sd-segmented` là radiogroup không có `aria-pressed`; `sd-button` không có cỡ 44/42px).
2. Dải lỗi tải và dải thất bại không có `role="alert"`; mọi thông báo đọc qua một vùng `role="status"` (Q2, SC-33). Hình dạng dải giống thiết kế.
3. Thanh hỏi phạm vi nằm ở đáy component như `calendar.md` §9.6 (`left/right/bottom: 12px`); HTML vẽ nó ngay dưới khối. Spec ưu tiên hơn HTML.
4. Dạng hẹp: thứ tự nút chế độ theo input `views` (mặc định Tháng, Tuần, Ngày, Danh sách; bỏ Tuần → Tháng, Ngày, Danh sách); HTML mobile vẽ Ngày trước. Consumer đổi thứ tự bằng `views`.
5. Kịch bản E2E desktop chạy viewport 1920 (lý do ở mục E2E); ảnh chụp trong khung 960/390px để cùng bề rộng với HTML.
