# calendar · R2 · phản hồi của tác giả
Review: `calendar-R2-spec.md` (phần A) và `calendar-R2-tests.md` (phần B), cả hai ở `dae378d5`.
Sửa từ `b80954ce` tới `ffec20f1` (rollout v20/v21/v22). Mỗi sửa có test hồi quy `CAL-B-xx`; từ `CAL-B-07` có commit RED riêng trước commit sửa (Ghi chú B-8).

## Chặn
| # | Sửa | Test | Commit |
| --- | --- | --- | --- |
| A-18 (SC-29) | `#restoreFocus` coi focus còn nằm trong thanh hỏi phạm vi là của component, không phải người dùng chủ động chuyển, nên khi thanh đóng thì focus về khối. Thanh tự lấy focus cả khi mở sau kéo chuột, nên focus cũng về khối trong trường hợp đó. Kiểm trên trình duyệt: CAL-E-06 thêm `toBeFocused()` sau Esc, xanh ở cả hai zone. | `[CAL-B-05]` ×2 (đúng thứ tự microtask → change detection của trình duyệt; RED trước khi sửa: 3/3 trường hợp focus `undefined`) | `b80954ce` |
| B-1 (SC-15) | Không đổi code. Thêm test: option mới hoặc destroy trong lúc `onCreate` chờ, kết quả tới muộn (resolve và reject) không chèn sự kiện, không chọn, không hiện dải lỗi. | `[CAL-B-08]` | `5deec9d4` |
| B-2 (§8.4) | Không đổi code. Thêm ca ba sự kiện (540–600, 540–570, 600–660). | `[CAL-B-09]` | `5deec9d4` |

Kiểm lại ba test mới bằng đột biến trên chính worktree (rồi hoàn tác): bỏ hai guard `signal.aborted` của nhánh tạo, bỏ guard sau thanh phạm vi, đổi `>=` thành `>` ở `sdCalendarStack` → đúng 3 test đỏ (`CAL-B-08`, `-09`, `-10`), 160 test còn lại xanh. Code thật: 163/163.

## Nên sửa
| # | Sửa | Test | Commit |
| --- | --- | --- | --- |
| A-05 | Gỡ listener `keydown` trên `document` trước nhánh vuốt, và ở `pointercancel` (cũng thiếu). | `[CAL-B-06]` | `a0980ba7` |
| A-11 | Khối đề xuất khi kéo mang `data-color` / `--sd-calendar-event-color` của sự kiện; viền màu sự kiện, nền `--sd-calendar-event-bg` (§8.3). Ảnh `interaction-drag.png`. | `[CAL-B-07]` | `2c65bf1e` RED, `7396605c` |
| A-12 | Bảng E2E của `sd-calendar.md` tách theo từng loại phần tử (khối, thanh cả ngày, chip Tháng, dòng Danh sách, phần tử tạm, thanh công cụ). | — (chỉ tài liệu) | `ebc2deca` |
| A-16 | SCSS dùng thuộc tính logic (`inset-inline-*`, `margin-inline-*`, `border-inline-start`, bo góc logic, `text-align: start/end`); mũi tên điều hướng và mũi tên cắt lật bằng `:dir(rtl)`. Ảnh `week-960-rtl.png`. | `[CAL-B-11]` | `d51a692c` RED, `3f080a14` |
| A-17 | Test destroy: `ResizeObserver.disconnect()` và gỡ listener `document` (cùng test với A-05). | `[CAL-B-06]` | `a0980ba7` |
| A-19 | Lưới có class `--blocked` khi khối quét bị `creatable` từ chối → con trỏ `not-allowed` (§9.2). | `[CAL-B-14]` | `d51a692c` RED, `3f080a14` |
| A-20 | Thanh công cụ hẹp: tiêu đề đứng đầu hàng 1 (`order: -2`). Ảnh `mobile-390-light.png`. | `[CAL-B-13]` | `d51a692c` RED, `3f080a14` |
| A-21 | Bộ ảnh §9 ở 960px và 390px (bốn chế độ, dark, RTL, trạng thái khối, tương tác, trạng thái component), cạnh ảnh các mục của `SD Calendar Design.dc.html` (`design-*.png`). Chỉ project Bangkok ghi ảnh, nên lần chạy UTC không còn ghi đè bằng nhãn `GMT+0`. Bảng so sánh và danh sách lệch: `reports/calendar-tests.md` mục "Ảnh chụp". | — (ảnh) | `6a8ca238` |
| A-24 | `aria-pressed` theo chế độ đang vẽ, nên "Ngày" được nhấn khi tuần hẹp vẽ như ngày. Model `view` vẫn là `'week'`. | `[CAL-B-12]` | `d51a692c` RED, `3f080a14` |
| B-3 | Không đổi code. Thêm test: `reload()` khi thanh phạm vi đang mở → thanh đóng, không đọc "Đã huỷ thay đổi", không gọi `onMove`. | `[CAL-B-10]` | `5deec9d4` |

## Ghi chú đã xử lý
| # | Xử lý | Test | Commit |
| --- | --- | --- | --- |
| A-07 | Sửa JSDoc của `SdCalendarAgendaItemTemplateDirective` cho khớp code (cột địa điểm từ 720px). Mâu thuẫn §8.5/§11 vẫn chờ PD. | — | `ebc2deca` |
| A-09 | Nút "+N" của hàng cả ngày có `aria-label` = key `more` + nhãn ngày ("+2 khác, Thứ Năm 22/10"). | `[CAL-B-15]` | `e07aa9cf` RED, `d247ae57` |
| B-7 | Sửa báo cáo: Statements của `calendar.component.ts` lấy từ lcov, không lấy số Lines. | — | báo cáo |
| B-8 | Từ `CAL-B-07` mỗi sửa có commit RED riêng. `CAL-B-05`, `-06` và ba test bổ sung (`-08`…`-10`, không đổi code) gộp một commit. | — | — |

## Tác giả tự phát hiện khi so ảnh
| Mô tả | Test | Commit |
| --- | --- | --- |
| Thanh nhiều ngày ở Tháng lặp lại chấm màu ở đầu mỗi ô nó kéo dài sang (23, 25, 27 trong `month-960-light.png` trước khi sửa); thiết kế chỉ có một chấm cạnh tiêu đề mỗi hàng tuần. | `[CAL-B-16]` | `01597efd` RED, `eff8e768` |

## Chưa sửa, cần PD chốt
| # | Điểm | Hiện trạng |
| --- | --- | --- |
| A-01 | 5 key i18n ngoài bảng §15 (`title-day`, `day-label-holiday`, `more-short`, `retry`, `dismiss`). | Giữ, đủ 5 locale. Đề xuất bổ sung vào §15. |
| A-07 | §8.5 (template thay nội dung dòng) mâu thuẫn §11 (cột địa điểm từ 720px). | Code theo §11; JSDoc đã khớp code. |
| A-08 | `Alt` + mũi tên trên dòng Danh sách vẫn dời sự kiện. | Giữ; đề xuất PD chốt chặn hay ghi vào spec. |
| A-13 | Sự kiện có giờ thiếu `end` bị ẩn (cảnh báo dev). | Giữ như tài liệu; phương án khác là mặc định một `step`. |
| A-14 | 44px chỉ áp dụng dưới 600px host, chưa áp cho cảm ứng rộng (`pointer: coarse`). | Giữ. |
| B-4 | E2E desktop chạy viewport 1920 (ở 1280 trang docs chỉ để ~650px, lịch thành hẹp). | Ảnh §9 giờ chụp ở khung 960px cố định; kịch bản vẫn 1920. |
| B-9 | Chạy Karma với `TZ` khác không kiểm được trên Windows (Chrome bỏ qua `TZ`). | Zone trình duyệt đã kiểm ở E2E bằng `timezoneId` (`America/New_York` + `?timeZone=Asia/Ho_Chi_Minh`, `Asia/Kolkata`, `UTC`, `Asia/Bangkok`). Cần một lần chạy Linux có `TZ` hoặc PD chấp nhận. |

## Ghi chú giữ nguyên, có lý do
| # | Lý do |
| --- | --- |
| A-02 | Key `saving` nằm trong bảng §15 nhưng chưa dùng; icon đang lưu là `aria-hidden`, live region đọc `pending`. Không bỏ key khỏi spec khi chưa có PD. |
| A-03 | `minDate`/`maxDate` dùng cùng kiểu với model `date` (`SdCalendarDateInput \| null \| undefined`) cộng `'TODAY'`, để consumer truyền cùng một giá trị cho cả ba. Rộng hơn spec, không phá consumer; PD có thể yêu cầu thu hẹp. |
| A-04 | Các tên `ɵ*` là internal cho scheduler (phụ lục §5.15), có comment "Not covered by SemVer". |
| A-10 | `--sd-shadow-*` không fallback giống cách các component khác trong repo đang dùng. |
| A-15 | `touch-action: none` trên khối dời được: CDK cần để giữ 400ms rồi kéo; cuộn bắt đầu trên ô trống vẫn chạy. Cần kiểm tay trên thiết bị thật. |
| A-22 | Forced-colors: nút chế độ đang chọn và vạch giờ không yêu cầu bởi SC-35; để đợt sau. |
| A-23 | Nhãn giờ đầu bị cắt nửa khi in; để đợt sau. |
| B-5 | `CAL-E-04` chờ 2.5s thật vì `onMove` chậm của demo là 2s; đường "kết quả muộn" được kiểm ở Karma (`CAL-SC-15` cho `onMove`, `CAL-SC-22`/`-23` cho `onLoad`, `CAL-B-08` cho `onCreate`). |
| B-6 | `test.skip` của axe chỉ khi thiếu `node_modules` của v19; CI luôn có. |

## R2' (`calendar-R2-recheck.md`): Chặn 0 · Nên sửa 2 · Ghi chú 6 → "Được mở PR"
Sửa ở `8684685e` (test RED) và `eb20d9dd` (code), rollout `e77967c2`. Kiểm lại hẹp các sửa này: `calendar-R2-recheck-2.md`.

| # | Mức | Sửa | Test |
| --- | --- | --- | --- |
| N-1 (A-16 chưa đủ) | Nên sửa | `:host { text-align: start }` (reboot của thư viện đặt `body { text-align: left }`); bốn padding không đối xứng (thanh công cụ, góc múi giờ, nhãn "Cả ngày", dòng Danh sách) thành `padding-block`/`padding-inline`; thanh tiến trình lật ở RTL. Ảnh `week-960-rtl.png` chụp lại. | `[CAL-B-17]` |
| N-2 | Nên sửa | Esc huỷ quét hoặc kéo mép gỡ luôn listener `document` khi không còn phiên nào (kéo vẫn gỡ khi thả); tay nắm có `pointercancel` bỏ kéo mép đang dở. | `[CAL-B-18]` |
| N-3 | Ghi chú | Khối đề xuất có chấm màu và cùng bố cục với khối (§8.3). | `[CAL-B-20]` |
| N-4 | Ghi chú | Tên nút "+N" bắt đầu bằng chữ đang hiện ở mọi locale: vi/en giữ "+2 khác, …"; ja/ko/zh thành "+2, 他 2 件, …" (WCAG 2.5.3). | `[CAL-B-19]` (5 locale) |
| N-5 | Ghi chú: cần PD chốt | Giữ: bấm "Ngày" ở tuần hẹp đổi model `week` → `day`. | — |
| N-6 | Ghi chú | Giữ: test chụp ảnh chỉ chạy ở project Bangkok để không ghi đè ảnh bằng nhãn `GMT+0`; mã `CAL-E-*` của chúng là kịch bản mà ảnh minh hoạ. | — |
| N-7 | Ghi chú | Giữ: cắt chữ đầu dòng ở RTL với nội dung tiếng Việt là bidi bình thường; `dir="auto"` cho tiêu đề để đợt sau. | — |
| N-8 | Ghi chú | Giữ: bảng hook E2E liệt kê hook dùng để kiểm; các hook phụ khác vẫn ổn định nhưng không hứa trong tài liệu. | — |

E2E sau các sửa: 44 passed, 4 skipped; CAL-E-06 (focus sau Esc) xanh ở cả hai zone.

## R2' lần 2 (`calendar-R2-recheck-2.md`): N-1…N-4 đã sửa đúng → "Được mở PR"
| # | Mức | Xử lý |
| --- | --- | --- |
| M-1 | Nên sửa | `[CAL-B-17]` tự đặt `body { text-align: left }` như reboot của thư viện (Karma không nạp global style), nên phép kiểm `text-align` đỏ khi bỏ `text-align: start` khỏi `:host` — đã thử đột biến đó: `Expected 'left' to be 'start'`. Commit `test(calendar): CAL-B-17 sets the reboot text-align itself…`. |
| M-2 | Ghi chú | Giữ: `[CAL-B-18]` so listener theo tham chiếu; các giai đoạn sau vẫn đỏ trên code cũ nhờ phép kiểm giờ và số listener của giai đoạn quét. |
| M-3 | Ghi chú | `[CAL-B-19]` thêm phép kiểm vi/en không lặp "+2". |
| M-4 | Ghi chú | Báo cáo test đã có `CAL-B-17`…`-20` và dòng RTL mới; thanh tiến trình và Danh sách ở RTL chỉ kiểm bằng test. |
| M-5 | Ghi chú | Giữ: `pointercancel` của tay nắm nổi lên `onGridPointerCancel`, vô hại (không có phiên quét). |
