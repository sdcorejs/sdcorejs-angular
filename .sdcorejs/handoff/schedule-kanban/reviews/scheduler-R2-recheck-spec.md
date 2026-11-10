# scheduler · R2' (phần spec và code)
Nhánh: feat/scheduler · Commit: 06fc39714 (sửa từ eb32766d2: 62566f854, 9c44e3e8f, a274b1e5c, 06fc39714) · Ngày: 2026-11-11
Reviewer: cùng reviewer R2 phần spec và code ([`scheduler-R2-spec.md`](scheduler-R2-spec.md)). Đối chiếu với phản hồi của tác giả [`scheduler-R2-author.md`](scheduler-R2-author.md), phần "Phần spec và code".

Phạm vi R2' (REVIEW §2): chỉ các mục đã ghi ở R2, cộng test hồi quy. Phần test và "Thử phá" thuộc reviewer khác. Không sửa code, không commit.

## Kết luận
Chặn: 0 · Nên sửa: 1 (mới) · Ghi chú: 6 (mới hoặc còn lại) · Chờ PD: 6 mục (5 dạng tiêu đề, 7 ô Tháng, 9, 10, 11, 12)

**Chưa được mở PR.** Hai mục Chặn và sáu trên bảy mục Nên sửa của R2 đã sửa, có test hồi quy và tôi đã kiểm lại độc lập. Mục 5 đã có cách tạm (tiêu đề xuống dòng, không mất ngày), dạng tiêu đề chờ PD. Lý do duy nhất chưa được mở PR là mục mới M1, thấy trong ảnh mới: quét để tạo bôi đen chữ. Calendar đã chặn việc này bằng `user-select: none`, sửa bằng một dòng CSS. Sửa M1 (hoặc PD chấp nhận lý do) thì được mở PR. Các mục "chờ PD" không chặn phía reviewer.

## Lệnh đã chạy
Node local `v26.12.0`. Chạy trong `C:\tmp\r2-spec-scheduler`, `git checkout --detach 06fc39714` (`git log --oneline -1`: `06fc39714 chore(sync): roll the R2 fixes out to v20, v21 and v22`).

| Lệnh | Kết quả |
| --- | --- |
| `npm run check:sync` | Xanh: "v20, v21, v22 match v19". |
| `npm run check:scss-hex` | 0 finding. |
| `npx eslint projects/sdcorejs-angular/components/scheduler projects/sdcorejs-angular/components/calendar projects/sdcorejs-angular/testing/schedule-testing.ts` | Không lỗi. |
| Karma `--include=projects/sdcorejs-angular/components/scheduler/**/*.spec.ts` | **157 SUCCESS**, 0 FAILED, 1.78 s, seed 50351. Còn 6 dòng `WARN` (trước là 12). |
| Karma `--include=projects/sdcorejs-angular/components/calendar/**/*.spec.ts` | **192 SUCCESS**, 0 FAILED, 1.74 s, seed 633988. |
| `npm run test:showcase-generators` | 10 + 17 + 11 pass: mã nguồn ví dụ sinh lại khớp. |
| Harness tạm của R2 chạy lại (`zz-r2-temp.spec.ts`, đã xoá) | **5 SUCCESS**: host 390px mở ở `8 × 64px`; Tuần và Tháng xếp `wide` (cả ngày), `early`, `mid`, `late` cả theo top lẫn DOM với dữ liệu nhập lộn thứ tự; khối đang chọn hay không chọn đều nằm dưới cột tài nguyên khi cuộn. |
| Ảnh mới `reports/scheduler-screens/` (a274b1e5c) so với 9 mục HTML | Xem mục 8 và M1–M6. |

Sau harness, `git status` sạch.

## Kết quả các mục của R2
| # R2 | Mức cũ | Kết quả | Bằng chứng | Ghi |
| --- | --- | --- | --- | --- |
| 1 | Chặn | ✓ đã sửa | scheduler.utils.ts:104 (khoá `at` sau `start`, `allDay`); scheduler.component.ts:1794 (`at: startInstant` ở Tuần/Tháng) | `[SCH-B-01]` ×2 (hàm thuần; DOM và top). Harness của tôi cho cả Tuần và Tháng, có thêm sự kiện cả ngày: đúng §8.4 bước 2 và 6. Ảnh `02-week-1122.png`: Hà Nội 08:30, 10:00, 14:00. |
| 2 | Chặn | ✓ đã sửa | scheduler.component.ts:1998, 2009 (`#measureSizes()` đầu `#scrollToTime` và `#revealToday`) | `[SCH-B-02]` ×2 (Ngày mở ở 512px; Tuần đưa hôm nay sát cột 120px). Harness của tôi xanh. Ảnh `compact-390.png`, `07-day-400.png`, `07-day-360.png` mở ở 08:00. |
| 3 | Nên sửa | ✓ đã sửa | scheduler.component.scss:536 (`isolation: isolate` trên rãnh) | `[SCH-B-03]` và harness của tôi: `elementFromPoint` dưới cột tài nguyên trả ô tài nguyên. Vạch giờ hiện tại nay nằm trên mọi khối và dưới phần dính, đúng §7. Hệ quả phụ: M3. |
| 4 | Nên sửa | ✓ đã sửa | scheduler.component.html:384–399; scheduler.component.scss:938–952 | Khối đề xuất là `sd-scheduler__event` có `data-color`, chấm, tên theo bậc, viền màu sự kiện, bóng lớn, không cắt nhãn (`[SCH-B-04]`). Ảnh `move-across-rows.png` khớp HTML 4b; `move-blocked-row.png` có viền nét đứt `--sd-border-strong`. |
| 5 | Nên sửa | **PD** (cách tạm ✓) | scheduler.component.scss:1112–1117 | Khi hẹp, tiêu đề xuống dòng, không còn mất ngày (`[SCH-B-05]`, ảnh 07-day-360/400). Dạng tiêu đề ("09/11/2026" của HTML hay dạng của calendar) chờ PD chốt. |
| 6 | Nên sửa | ✓ đã sửa | calendar-move.ts (`SdCalendarCreateRunner`, `SdCalendarScopeBar`); calendar.utils.ts (`sdCalendarOutOfRange`); scheduler.component.ts:1261–1270, 1273, 1730 | Pipeline tạo và thanh hỏi phạm vi nay dùng chung, calendar cũng dùng (calendar.component.ts). Template calendar chỉ đổi binding, DOM ra giống hệt. API public của calendar không đổi (thành viên bị bỏ trước đây là `protected`). Lý do giữ các handler 1–3 dòng (`setView`, `shift`, `goToday`, `openDay`, `dismissFailure`, `selectItem`) là chúng nối với signal riêng của từng component: chấp nhận. Calendar 192/192. |
| 7 | Nên sửa | ✓ đã sửa; ô Tháng **PD** | scheduler.component.scss:1119–1132 | Khi hẹp: nút của dải và nút thanh hỏi phạm vi `min-height` 44px, số ngày ở Tuần có vùng chạm 44px bằng `::after` (`[SCH-B-07]` kiểm nút Thử lại và số ngày; nút thanh hỏi phạm vi kiểm bằng đọc code). Ô Tháng 28px mâu thuẫn §11: chờ PD. Calendar cùng lệch: để RX. |
| 8 | Nên sửa | ✓ đã sửa (còn Ghi chú G1) | showcase/.../scheduler-demo.data.ts; scheduler-*.example.html (`resourceLabel`); showcase/e2e/components/scheduler.e2e.ts:34, 373–470 | Dữ liệu ví dụ nay đúng HTML: phòng theo tầng, xe theo kho, Phòng Kế toán, mã công và cột tổng, nhãn ô góc "Phòng", "Xe", "Nhân viên". Đồng hồ ghim Thứ Hai 09/11/2026 10:40 nên có vạch giờ hiện tại; khung 1122px; RTL mở lại Ngày nên cuộn tới `scrollTime`. Có thêm ảnh 03 (đang chọn, đang lưu), 4a, 4b, 4c, 4d, phạm vi lặp, bị từ chối, đang tải lại, 360px. So từng cặp: 01 khớp HTML trừ các lệch đã có lý do; `vehicles-week`, `leave-month` khớp dữ liệu 02; `timesheet-cells` khớp mã và tổng của 05. |
| 9 | Nên sửa | **PD** / ghi lệch | | Tác giả giữ định dạng của calendar (như L5) và ghi vào bảng lệch của PR. Chấp nhận nếu bảng lệch của PR có dòng này. |
| 10, 11, 12 | Ghi chú (cần PD chốt) | **PD** | | Không đổi, đúng như yêu cầu. |
| 15 | Ghi chú | ✓ | scheduler.utils.ts (bỏ `sdSchedulerColumnAt`); scheduler.component.ts:1988 (`why:`) | JSDoc mồ côi đã xoá. |
| 16 | Ghi chú | ✓ | scheduler.component.ts:886–888 | Ở tài nguyên đầu hoặc cuối, phím không làm gì và không đọc gì (`[SCH-B-16]`). |
| 21 | Ghi chú | ✓ một phần | scheduler.component.spec.ts | `spyOn(console, 'warn')` ở SCH-C-02. Còn 6 dòng `WARN` từ test khác, không ảnh hưởng kết quả. |
| 23 | Ghi chú | ✓ | scheduler.component.scss:1210–1219 | Ở `forced-colors`, chấm có viền `CanvasText`, số ngày hôm nay có viền `Highlight` (`[SCH-B-23]`). Ảnh `vehicles-forced-colors.png` thấy cả hai. |

Các Ghi chú R2 khác (13, 14, 17, 18, 19, 20, 22, 24): tác giả giữ, có lý do; không phải mục cần recheck.

## Mục mới và mục còn lại
| # | Mức | Mục spec | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | Nên sửa (mới) | §9.2 (quét); như calendar (calendar.component.scss:392–394, 478–480: "sweeping and dragging must not select the titles under the pointer") | scheduler.component.scss (`.sd-scheduler__body` / `.sd-scheduler__track` không có `user-select: none`) | Quét bằng chuột trên rãnh bôi đen chữ dưới con trỏ. Ảnh mới `04-create-sweep.png`: chữ "Sự kiện mới" trong khối nét đứt bị bôi xanh. Chỉ thấy được trong ảnh mới, ảnh R2 không có cảnh quét. | Ví dụ Đặt phòng, quét 13:00–15:00 trên Phòng họp online (`sweep()` của E2E). | `user-select: none` trên vùng hàng (như calendar, kèm `why:`), và một kiểm `getComputedStyle(...).userSelect` hoặc `findCssRule`. |
| G1 | Ghi chú | TESTING §9 (còn lại của mục 8) | | Chưa có ảnh: đang tải lần đầu (lý do: ví dụ client trả ngay, Karma SCH-C-02 kiểm, có ảnh đang tải lại thay thế: chấp nhận được); các trạng thái hover, focus, đã qua của mục 03. Khung HTML 02 (xe, nghỉ phép) chỉ có ảnh 763px (`vehicles-week`, `leave-month`), phần cuối tuần và cuối tháng không so được; `02-week-1122` và `02-month-1122` dùng dữ liệu phòng. | | Tuỳ chọn: chụp hai ví dụ 02 ở khung 1122px. |
| G2 | Ghi chú (mới) | RTL | scheduler.component.html (giờ trong khối, nhãn nổi) | Trong RTL, khoảng giờ bị thuật toán bidi đảo: "13:30–15:30" hiện "15:30–13:30" (`01-day-1122-rtl.png`, Phòng Huế, Phòng Sài Gòn). Thư viện chưa có locale RTL, nhưng consumer đặt `dir="rtl"` sẽ thấy. | Ảnh `01-day-1122-rtl.png`. | `unicode-bidi: isolate` với `direction: ltr` cho chữ giờ và nhãn nổi. |
| G3 | Ghi chú (mới, hệ quả của mục 3) | §7 | scheduler.component.scss:536, 668–672 | Vạch giờ hiện tại nay vẽ trên cả nhãn nổi của kéo và kéo mép (nhãn nằm trong rãnh). Ảnh `resize-end.png`: vạch cắt chữ "09:00 – 10:30". Đúng chữ "trên khối" của §7, nhưng nhãn khó đọc khi trùng vạch. | Kéo mép một khối kết thúc gần 10:40. | Chấp nhận, hoặc cho nhãn nổi một lớp riêng trên vạch. |
| G4 | Ghi chú (mới) | §8.2, HTML 4c | scheduler.component.ts (`blockSize` đổi bề rộng, `tier` giữ theo bề rộng gốc) | Trong lúc kéo mép, bậc nội dung giữ theo bề rộng ban đầu: khối 30 phút kéo thành 90 phút vẫn chỉ có chấm (`resize-end.png`); HTML 4c vẽ cả tên khi khối rộng ra. | Kéo mép khối "Giao ban" của Phòng Huế. | Tuỳ chọn: tính lại bậc theo bề rộng đang kéo. |
| G5 | Ghi chú (mới) | §12 (trống) | scheduler.component.scss:645–658 | Nội dung trạng thái trống canh giữa quanh x ≈ 441px bất kể bề rộng khung: lệch trái ở 1122px (`06-state-empty.png`). HTML 06 chỉ có khung hẹp nên không so 1:1 được. | Ví dụ Đặt phòng, "resources rỗng" ở khung 1122px. | Canh theo bề rộng vùng cuộn đang thấy. |
| G6 | Ghi chú | HTML 05 | showcase/.../scheduler-timesheet.example.html | Template tài nguyên của ví dụ Chấm công không có avatar và mã "X" không tô màu như HTML. Đây là nội dung của consumer, không phải component. | | Tuỳ chọn, để ví dụ giống HTML hơn. |

## Checklist (chỉ mục recheck)
- [x] Mỗi mục Chặn, Nên sửa của R2 có kết quả: ✓ (1, 2, 3, 4, 6, 7, 8), PD (5 phần dạng tiêu đề, 7 ô Tháng, 9).
- [x] Ghi chú tác giả nói đã đổi: 15 ✓, 16 ✓, 21 ✓ một phần, 23 ✓.
- [x] Test hồi quy có mã `SCH-B-xx` cho các mục đã sửa (`scheduler.review.spec.ts`: 01, 02, 03, 04, 05, 07, 16, 23) và đều xanh. Mục 6 dùng test hiện có của hai component và `calendar.shared.spec.ts`.
- [x] Tự kiểm lại độc lập mục 1, 2, 3 bằng harness tạm (xanh, đã xoá).
- [x] `check:sync`, `check:scss-hex`, eslint, Karma scheduler và calendar xanh.
- [x] v20/v21/v22 chỉ đổi qua sync (06fc39714); `check:sync` xanh.
- [ ] Mục mới M1 chưa sửa.

## Thử phá
Không làm ở phần này (thuộc reviewer test).
