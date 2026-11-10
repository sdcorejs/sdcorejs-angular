# calendar · R2 · phần A
Nhánh: feat/calendar · Commit: dae378d5 · Ngày: 2026-11-09
Reviewer: phiên mới, không có lịch sử của phiên tác giả
Phạm vi: REVIEW.md mục 3.1, 3.2 (đọc code, không harness), 3.4, 3.5 (so ảnh), 3.6. Mục 3.3 do reviewer phần B làm.

## Kết luận
Chặn: 1 · Nên sửa: 9 · Ghi chú: 13 (trong đó 5 mục "cần PD chốt": A-01, A-07, A-08, A-13, A-14; A-06 không tính vì PD đã chốt Q2)
Chưa được mở PR (phần A). Mục Chặn A-18 suy ra từ đọc code và thứ tự microtask/CD của zone.js; unit test hiện có không bắt được vì `settle()` đảo thứ tự. Tác giả cần tái hiện trên showcase (Playwright `toBeFocused()` sau Esc) trước khi sửa.

## Lệnh đã chạy
Phần A chỉ đọc; không chạy test (mục 3.3 và lệnh đầy đủ thuộc phần B).
- `git log --oneline main..HEAD` → 22 commit, HEAD `dae378d5`.
- `diff -rq versions/v19/.../components/calendar versions/v2{0,1,2}/...` → v20, v21 giống hệt; v22 chỉ khác `calendar.component.spec.ts` (shim `ChangeDetectionStrategy.Eager` cho Angular 22, đã duyệt). `i18n/src/vi.ts`, `THEME.md`, `testing/schedule-testing.ts`, `components/index.ts` giống v19; `_component-tokens.scss` của v22 khác toàn file do EOL (nội dung trùng).
- `git diff --stat main..HEAD -- published-pages published-docs versions/*/dist` → không có thay đổi.
- Đếm key `core.component.calendar.*`: vi/en/ja/ko/zh đều 56 (51 key của §15 + 5 key ở A-01).

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | Ghi chú: cần PD chốt | calendar.md §6 (tiêu đề Ngày), §15 (bảng key); REVIEW 3.1 "không key i18n ngoài spec" | calendar.component.ts:464, :1768; i18n/src/vi.ts:1685, :1688, :1694, :1715, :1716 | Có 5 key không nằm trong bảng §15: `title-day` (§6 bắt buộc tiêu đề Ngày dựng bằng key có tham số nhưng bảng §15 không có key này), `day-label-holiday` (§15 ghi nhãn ô Tháng có `[, {holiday}]` nhưng chỉ có key `day-label`), `more-short` (`+{count}` cho hàng cả ngày §7), `retry`, `dismiss` (repo không có `core.common.retry`/`dismiss`, chỉ có `core.common.cancel`, đã dùng lại cho Huỷ). | `grep -o "core\.component\.calendar\.[a-z0-9-]*"` trên .ts/.html | Bước 0 §B.11 đã đề xuất `title-day`, `more-short`, `retry`, `dismiss`; R1 G3 giữ `day-label-holiday` "chờ PD phản đối". Chưa thấy PD chốt rõ: PD xác nhận và bổ sung 5 key vào bảng §15. |
| A-02 | Ghi chú | calendar.md §15 (key `saving`) | i18n/src/vi.ts:1704 | Key `saving` có trong spec và 5 locale nhưng không chỗ nào dùng (icon đang lưu không có nhãn, live region dùng `pending`). | grep `calendar.saving` trong components/calendar → không có | Dùng làm nhãn ẩn cho icon `sync`, hoặc PD bỏ key khỏi spec. |
| A-03 | Ghi chú | calendar.md §4.1 (`minDate`, `maxDate`: `Date \| string \| 'TODAY' \| undefined`) | calendar.component.ts:260, :262 | Kiểu thực tế rộng hơn spec: `SdCalendarDateInput \| 'TODAY' \| null \| undefined` (thêm `number`, `null`). Không phá consumer, nhưng là khác biệt API so với spec. | Đọc khai báo input | Ghi lý do trong sd-calendar.md hoặc thu hẹp đúng spec. |
| A-04 | Ghi chú | REVIEW 3.1 (public API ngoài spec); phụ lục §5 điểm 15 | components/calendar/index.ts:1–69; calendar.configuration.ts:26 | Ngoài API trong spec, entry point xuất ~45 tên `ɵ*` (loader, operation, hàm thuần) cho scheduler; `export *` từ configuration kéo theo `ɵSD_CALENDAR_DEFAULTS`. Phụ lục §5.15 yêu cầu tách để scheduler dùng lại nên chấp nhận được; tiền tố `ɵ` + comment "Not covered by SemVer" là đúng quy ước internal. | Đọc index.ts | Trùng R1 G12 (chưa có quyết định ghi lại). sd-calendar.md không nhắc các tên `ɵ`; giữ như internal là đủ. |
| A-05 | Nên sửa | REVIEW 3.4 (không rò listener); calendar.md §12 (vuốt) | calendar.component.ts:921–922 | Nhánh vuốt cảm ứng trên lưới Ngày `return` trước `document.removeEventListener('keydown', …, true)` đã gắn ở :902. Listener capture trên `document` còn lại tới lần nhấn sau hoặc destroy (vô hại về hành vi vì không có phiên nào, nhưng là rò listener theo checklist). | Compact, chạm lưới Ngày, vuốt ngang ≥ 60px; kiểm tra `getEventListeners(document)` | Gỡ listener trước nhánh `#swipe`, thêm test destroy/swipe. |
| A-06 | — (không tính: PD đã chốt Q2) | calendar.md §7 (Dải lỗi: `role="alert"`; Dải thất bại "cùng kiểu dải lỗi") | calendar.component.html:64, :73 | Hai dải `data-band="load-error"` và `data-band="move-error"` không có `role="alert"`. Nội dung vẫn được đọc qua live region (`#announce`), nên không mất thông báo, nhưng lệch chữ spec. Bước 0 Q2 đã chốt: bỏ `role="alert"`, đọc qua một vùng `role="status"` (SC-33). Code đúng quyết định. | — | Không cần làm gì. |
| A-07 | Ghi chú: cần PD chốt | calendar.md §8.5 (agenda template "như event template", tức thay nội dung) vs §11 ("≥ 720px thêm cột địa điểm nếu template cung cấp") | calendar.component.html:523–527; calendar.templates.ts:63 | Spec mâu thuẫn. Code chọn cách §11: `sdCalendarAgendaItemTemplate` chỉ render ở cột địa điểm và chỉ khi host ≥ 720px; dưới 720px template bị bỏ hẳn. Doc của directive (templates.ts:63 "Replaces the content of an agenda row") lại mô tả cách §8.5 → doc trái với code. | Danh sách, host 600px, có template → không thấy nội dung template | PD chốt một nghĩa; tối thiểu sửa JSDoc directive cho khớp code (Nên sửa nếu giữ hành vi hiện tại). |
| A-08 | Ghi chú: cần PD chốt | calendar.md §9.7 (phím dời chỉ cho khối Tuần/Ngày và thanh cả ngày; Danh sách: "Enter/Space chọn") | calendar.component.html:514; calendar.component.ts:851–879 | Dòng Danh sách dùng chung `onItemKeydown`, nên `Alt` + mũi tên trên dòng Danh sách vẫn dời sự kiện (±1 ngày, ±moveStep). Spec không nói có hay không; dòng Danh sách không có `aria-describedby` hướng dẫn phím. | Danh sách, Tab tới dòng, `Alt+→` → `onMove` được gọi | PD chốt: chặn phím dời ở Danh sách, hoặc ghi vào spec/doc và thêm `aria-describedby`. |
| A-09 | Ghi chú | calendar.md §7 (“+N” hàng cả ngày), §15 (nhãn) | calendar.component.html:223–232 | Nút “+N” của hàng cả ngày chỉ có chữ `+2`, không `aria-label` (không biết ngày nào, nghĩa gì). Nút “+N khác” của Tháng có chữ đầy đủ. | Đọc DOM tuần có > 3 thanh/ngày | Thêm `aria-label` (ví dụ dùng `more` + ngày). |
| A-10 | Ghi chú | SC-43, calendar.md §8.3 (bóng `--sd-shadow-*`) | calendar.component.scss:635, :647, :1056, :1102 | `var(--sd-shadow-sm/md/lg)` không có fallback (mọi token màu khác đều có qua `tok()`). Repo dùng lẫn cả hai kiểu nên không chặn. | grep | Thêm fallback như `sd-shadow-lg` ở component khác. |
| A-11 | Nên sửa | calendar.md §8.3 (Đang kéo: "viền event-color, bóng lớn") | calendar.component.scss:1053–1057; calendar.component.html:384–389 | Khối đề xuất khi kéo (`.sd-calendar__proposal`) luôn vẽ viền `--sd-primary` và nền `--sd-primary-light`, không theo màu sự kiện (phần tử không có `data-color` hay `--sd-calendar-event-color`). Kéo một sự kiện `success`/`error`/màu CSS sẽ hiện khối xanh primary. Không thấy lý do ghi trong code. | Showcase, kéo sự kiện màu khác primary | Truyền `data-color`/`--sd-calendar-event-color` của sự kiện cho proposal, dùng `--sd-calendar-event-bg`/`event-color`. |
| A-12 | Nên sửa | calendar.md §17 (thuộc tính E2E "trên khối") | sd-calendar.md:235; calendar.component.html:446–458, :501–512 | Bảng E2E của tài liệu ghi chip Tháng và dòng Danh sách có `data-start`, `data-end`, `data-all-day`, `data-pending`, `data-failed`; thực tế chip chỉ có `data-event-id/autoid/color/past/selected`, dòng Danh sách thiếu `data-start/end/all-day/failed`. Spec chỉ yêu cầu trên khối, nên code không sai spec, nhưng tài liệu sai. | So bảng doc với template | Sửa bảng doc theo đúng từng loại phần tử (hoặc thêm thuộc tính cho đồng nhất). |
| A-13 | Ghi chú: cần PD chốt | calendar.md §3 (`end?`), §5 | calendar.utils.ts (`sdCalendarPlace`); sd-calendar.md:123 | Sự kiện có giờ thiếu `end` bị coi là không hợp lệ và bị ẩn (cảnh báo dev). Spec chỉ quy định thiếu `end` cho cả ngày (= một ngày); với sự kiện có giờ thì không nói. Doc đã ghi hành vi này. | `onLoad` trả `{ start: '2026/10/22 09:00:00' }` không `end` → không hiện | PD chốt: ẩn (như hiện tại) hay mặc định một `step`. |
| A-14 | Ghi chú: cần PD chốt | SC-36, calendar.md §12 ("Vùng chạm tối thiểu 44×44px cho mọi nút") | calendar.component.scss:132, :147, :179, :1009 | 44px chỉ áp dụng khi compact (host < 600px). Màn cảm ứng rộng (tablet ≥ 600px, `pointer: coarse`) vẫn dùng nút 32px/30px; `@media (pointer: coarse)` chỉ có cho tay nắm resize. Spec đặt câu 44px dưới mục "Giao diện hẹp và cảm ứng" nên không rõ có áp cho cảm ứng ở bề rộng thường không. | Tablet 768px | PD chốt; nếu áp dụng thì thêm `@media (pointer: coarse)` cho nút thanh công cụ. |
| A-15 | Ghi chú | calendar.md §9.2 ("kéo dọc dành cho cuộn"), §12 | calendar.component.scss:941–943 | `.sd-calendar__event[data-movable] { touch-action: none; }` chặn cuộn trang/lưới khi ngón tay bắt đầu trên một khối có thể dời (CDK tự bật/tắt `touch-action` khi kéo). Ở Ngày trên điện thoại, nhiều khối phủ lưới → khó cuộn. Cần kiểm tay trên thiết bị thật (phần B / tay). | 390px, `hasTouch`, vuốt dọc bắt đầu trên khối | Cân nhắc `touch-action: pan-y` hoặc để CDK quản lý. |
| A-16 | Nên sửa | REVIEW 3.5 (RTL), TESTING §9 | calendar.component.scss (28 thuộc tính `left`/`right`/`margin-right`/`border-left`, không có thuộc tính logic) | SCSS dùng thuộc tính vật lý; ở `dir="rtl"` lưới cột tự đảo nhưng vị trí ngang trong cột, phần chừa phải, viền phân cách nhóm chế độ, `margin-right` nút Hôm nay không đảo. Spec không quy định layout RTL ngoài đảo phím, nhưng ảnh `calendar-screens/week-1280-rtl.png` cho thấy lệch không giải thích: thanh "Công tác Đà Nẵng" bị cắt ở mép trái (Chủ Nhật) mà icon vẫn `chevron_right` (chỉ sang phải), khối vẫn dính mép trái cột và chừa bên phải. | `dir="rtl"`, xem ảnh RTL | Dùng `inset-inline-*`, `margin-inline-*`, `border-inline-start`. |
| A-17 | Nên sửa | REVIEW 3.4 ("kiểm tra bằng đọc code và một test destroy") | calendar.component.ts:738–745; testing/schedule-testing.ts (`FakeResizeObserver.disconnected`) | Đọc code: destroy dọn đủ loader, operation, `ResizeObserver`, timer, rAF, listener `document` (trừ A-05). Nhưng test destroy hiện có (`component.spec.ts:287`, `interaction.spec.ts:444`) chỉ kiểm abort; không test nào kiểm `ResizeObserver.disconnect()` (cờ `disconnected` của fake không được dùng) hay gỡ listener `keydown` trên `document`. Timer chỉ được kiểm gián tiếp qua `fakeAsync`. | grep `disconnected`, `removeEventListener` trong *.spec.ts → không có | Thêm một test destroy: fake RO `disconnected === true`, `document.removeEventListener` được gọi, không còn periodic timer. |
| A-18 | Chặn (theo đọc code; cần xác minh trên trình duyệt) | SC-29 ("huỷ phạm vi" → focus về item), calendar.md §9.5 bước 10, §9.6 | calendar.component.ts:1206–1213 (`#runMove`), :1484–1490 (`#restoreFocus`), :1220–1225 (`answerScope`) | Thanh hỏi phạm vi tự lấy focus ("Chỉ lần này"). Khi Esc/Huỷ, `answerScope` resolve promise; phần tiếp theo của `#runMove` chạy ở microtask và gọi `#restoreFocus` **trước** change detection (showcase dùng zone.js + `eventCoalescing: true`, CD chạy ở rAF). Lúc đó `document.activeElement` vẫn là nút trong thanh (còn trong DOM, khác `origin`) nên nhánh SC-30 ("người dùng chủ động focus chỗ khác") `return` sớm; sau đó thanh bị gỡ và focus rơi về `body`. Cùng lỗi khi chọn phạm vi mà `onMove` trả đồng bộ hoặc resolve trong cùng frame. Unit test `[CAL-C-13] cancels with Esc and with Huỷ … focus back on the block` (recurring.spec.ts:77–93) xanh chỉ vì `settle()` gọi `detectChanges()` trước `flushMicrotasks()` (thứ tự ngược với trình duyệt); E2E `[CAL-E-06]` không kiểm focus sau Esc. | Showcase playground: Tab tới "Họp giao ban tuần", `Alt+↓`, `Esc` → kiểm `document.activeElement` | Trong `#restoreFocus`, coi focus nằm trong thanh hỏi phạm vi (hoặc trong host mà sắp bị gỡ) là focus của component, không phải của người dùng; thêm assert `toBeFocused()` sau Esc/Huỷ và sau chọn phạm vi trong CAL-E-06; sửa unit test để `flushMicrotasks()` trước `detectChanges()`. |
| A-19 | Nên sửa | calendar.md §9.2 ("`creatable` trả false trong lúc quét: … con trỏ `not-allowed`") | calendar.component.scss:937–939, :1048–1050 | Khi quét vào khoảng `creatable` từ chối, khối nét đứt đổi viền `--sd-border-strong` (đúng) nhưng con trỏ vẫn `cell` (cột) — không có quy tắc `not-allowed` nào gắn với `data-blocked`. | Playground, `creatable` trả false, quét | Đặt `cursor: not-allowed` cho lưới khi ghost `data-blocked` (ví dụ class trên `.sd-calendar__columns`). |
| A-20 | Nên sửa | calendar.md §12 ("hàng 1 tiêu đề … + “Hôm nay” + 2 nút icon"), HTML mục mobile (`SD Calendar Design.dc.html` dòng 474/517: tiêu đề `flex:1` đứng đầu) | calendar.component.html:16–42 (thứ tự DOM `nav` → `title` → `views` dùng cho cả compact); ảnh `calendar-screens/compact-400.png` | Ở giao diện hẹp, hàng 1 là "Hôm nay ‹ ›" rồi mới tới tiêu đề; thiết kế đặt tiêu đề trước, nút ở phải. Không có lý do ghi lại. | Host 400px | Đổi thứ tự bằng `order` trong `.sd-calendar--compact` (giữ thứ tự DOM desktop) hoặc ghi lý do. |
| A-21 | Nên sửa | TESTING §9 (7 mục của HTML: Tuần 960px, Ngày, Tháng, Danh sách, 7 trạng thái khối, 6 tương tác, trạng thái component, mobile 390px; light/dark/RTL), §13 | reports/calendar-screens/ (9 ảnh) | Thiếu ảnh Tuần 960px (chỉ có 1280), Tháng, Danh sách, 7 trạng thái khối, 6 tương tác; không có ghi chú so sánh hay danh sách lệch có chủ đích. `mobile-390.png` bị cắt (không thấy thanh công cụ 2 hàng, trang showcase tràn ngang) nên không đối chiếu được §12. (Ghi chú: `week-1280-light.png` đang bị sửa trong working tree, không phải bản đã commit; bản trên đĩa ghi `GMT+0` trong khi các ảnh khác ghi `GMT+7`, có thể do phiên khác chụp lại.) | `ls reports/calendar-screens` | Chụp đủ mục 9 cùng bề rộng và zone với HTML, ghi bảng lệch (chủ đích/không). |
| A-22 | Ghi chú | SC-35, calendar.md §15 (forced-colors) | calendar.component.scss:188–191, :490–494, :1283–1309; ảnh `week-forced-colors.png` | Khung, chọn, đang chờ, đường giờ hiện tại đúng SC-35. Nhưng ở forced-colors: nút chế độ đang chọn (`aria-pressed`, chỉ khác bằng nền) không phân biệt được; vạch giờ/nửa giờ (vẽ bằng `background-image` gradient) biến mất nên lưới giờ chỉ còn nhãn. SC-35 không yêu cầu hai điểm này. | `emulateMedia({ forcedColors: 'active' })` | Thêm viền/`Highlight` cho `[aria-pressed='true']`; cân nhắc `forced-color-adjust` hoặc viền thay gradient. |
| A-23 | Ghi chú | calendar.md §16 (in từ giờ làm sớm nhất) | calendar.component.scss:1335–1344; ảnh `print-week.png` | Khi in, nhãn giờ đầu tiên ("08:00") bị cắt nửa trên vì nhãn đặt `top = h × 48 − 7px` nằm trên mép vùng đã dịch. | `emulateMedia({ media: 'print' })` | Chừa 7px phía trên khi in, hoặc in từ `start − 1 slot`. |
| A-24 | Nên sửa | calendar.md §12 (Tuần hẹp hiển thị như Ngày; nút "Tuần" ẩn), §15 (mỗi nút `aria-pressed`), HTML mục mobile (nút "Ngày" tô `#dbe8f5`) | calendar.component.html:44–54 (`aria-pressed = option === activeView()`); calendar.component.ts:396–407 | Ở giao diện hẹp với `view = 'week'`, nút Tuần bị ẩn nên **không nút nào** `aria-pressed="true"` và không nút nào tô nền (ảnh `compact-400.png`); thiết kế tô "Ngày". Người dùng trình đọc màn hình không biết chế độ hiện tại. | Host 400px, `view='week'` | So sánh với `displayView()` cho trạng thái pressed (giữ `view` model là `'week'`), hoặc PD chốt khác. |

## Checklist

### 3.1 Theo spec (`calendar.md` + phụ lục 08/11)
| Mục | Kết quả | Ghi chú |
| --- | --- | --- |
| §0 Phạm vi | ✓ | Không RRULE, không kéo ở Tháng, không kéo thanh cả ngày, không form. |
| §1 Vị trí file | ✓ | Thêm `calendar-loader.ts`, `calendar-move.ts`, `calendar.testing.ts` (tách cho scheduler theo phụ lục §5.15). `components/index.ts` re-export. |
| §2 Quy ước API | ✓ | Tên khớp bảng; `onMove` có `'cancel'` theo phụ lục §6. |
| §3 Model | ✓ | Khớp từng field; `SdCalendarMoveError.reason` giữ `'rejected' \| 'error'`. |
| §4.1 Input | ✗ (A-03) | `minDate`/`maxDate` rộng hơn spec. Còn lại ✓ (mặc định, `booleanAttribute`, model hai chiều). |
| §4.2 Output | ✓ | Thêm `sdLoadError` theo phụ lục §6.2. |
| §4.3 Method | ✓ | `reload()`, `move()` đúng chữ ký, `'api'` dùng `scope: 'this'`. |
| §5 Ngày giờ | ✓ / ✗ (A-13 cần chốt) | Dùng `sdSerializeTemporalValue` có sẵn; sự kiện có giờ thiếu `end` bị ẩn. |
| §6 Khoảng xem, điều hướng | ✓ | Tiêu đề qua key có tham số; nhãn nút theo đơn vị. |
| §7 Bố cục | ✓ / ✗ (A-20, A-24 ở dạng hẹp) | Kích thước, lưới gradient, giờ hiện tại, cuộn ban đầu khớp. |
| §8.1–8.4 Khối | ✓ / ✗ (A-11) | Màu, tầng nội dung, trạng thái, xếp chồng khớp; khối đề xuất khi kéo sai màu. |
| §8.5 Template | ✗ (A-07 cần chốt) | 4 directive có `ngTemplateContextGuard`. |
| §9.1 Chọn | ✓ | |
| §9.2 Tạo | ✓ / ✗ (A-19) | |
| §9.3 Kéo | ✓ | CDK, delay `{ touch: 400, mouse: 0 }`, tự cuộn 40px/16px. |
| §9.4 Kéo mép | ✓ | |
| §9.5 Pipeline | ✓ / ✗ (A-18 bước 10) | Bước 1–9 đúng thứ tự; `movable` đánh giá lại ngay trước `onMove`. |
| §9.6 Thanh phạm vi | ✓ / ✗ (A-18) | `alertdialog`, `aria-labelledby`, focus nút đầu, Esc = Huỷ. |
| §9.7 Bàn phím | ✓ / ✗ (A-08 cần chốt) | |
| §10 Tháng | ✓ | Giới hạn 3/2 dòng, "+N khác", không kéo. |
| §11 Ngày, Danh sách | ✓ / ✗ (A-07) | |
| §12 Hẹp, cảm ứng | ✓ / ✗ (A-14, A-15, A-20, A-24) | Đo host bằng `ResizeObserver`, `onLoad` nhận `view: 'day'`. |
| §13 Trạng thái | ✓ | Lỗi tải xoá sự kiện theo G1 đã chốt. |
| §14 Token | ✓ | 5 token, cặp light/dark, fallback trong SCSS component. |
| §15 Trợ năng, i18n | ✓ / ✗ (A-01, A-02, A-09) | Dải lỗi không `role="alert"` theo Q2. |
| §16 In | ✓ / Ghi chú (A-23) | |
| §17 E2E | ✓ | Thêm hook ngoài spec theo N5 đã chốt; doc lệch (A-12). |
| §18 Spec RED | phần B | |
| §19 Showcase | ✓ | Playground đủ công tắc, server 600ms + lỗi, drawer + hoàn tác, chấm công, URL. |
| Phụ lục §2–§3 | ✓ | Không `content`, `behavior`, badge; 5 điểm P2 đủ API. |
| Phụ lục §5.15 | ✓ | Đủ type và token cho scheduler; pipeline tách ở `calendar-move.ts`, `calendar-loader.ts`. |
| Phụ lục §6 | ✓ | `'cancel'` và `sdLoadError`. |
| Public API ngoài spec | ✗ (A-01, A-03, A-04) | `index.ts`: `SdCalendar`, 4 directive, 4 context type, model (type-only), `SD_CALENDAR_CONFIGURATION`, `ISdCalendarConfiguration`, `ɵSD_CALENDAR_DEFAULTS` và ~45 tên `ɵ*`. Không input/output/method ngoài spec. |
| "Không làm" | ✓ | Ngoại trừ phím dời ở Danh sách (A-08). |

### 3.2 Hợp đồng chung (đọc code; không dựng harness, xem phần B)
| SC | Kết quả | SC | Kết quả | SC | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 01 | ✓ | 16 | ✓ (chỉ chuỗi i18n) | 31 | ✓ |
| 02 | ✓ | 17 | ✓ | 32 | ✓ |
| 03 | ✓ (mảng mới, request `Object.freeze`) | 18 | ✓ (`move(id, request.from, 'api')`) | 33 | ✓ (một `role="status"`) |
| 04 | ✓ | 19 | ✓ | 34 | ✓ |
| 05 | ✓ | 20 | ✓ | 35 | ✓ (Ghi chú A-22) |
| 06 | ✓ (`movable`, `creatable`) | 21 | ✓ | 36 | ✗ cần chốt (A-14) |
| 07 | ✓ | 22 | ✓ | 37 | ✓ (A-01) |
| 08 | N/A (Q3: calendar không có `droppable`) | 23 | ✓ | 38 | ✓ |
| 09 | ✓ | 24 | ✓ | 39 | ✓ |
| 10 | ✓ | 25 | N/A (không có `items`) | 40 | ✓ |
| 11 | ✓ | 26 | ✓ | 41 | ✓ (đọc qua `SdDateTimeService`; `getHours()` chỉ trên carrier của `now()`) |
| 12 | ✓ | 27 | ✓ | 42 | ✓ |
| 13 | ✓ | 28 | ✓ | 43 | ✓ (A-10) |
| 14 | ✓ | 29 | ✗ (A-18) | 44 | ✓ |
| 15 | ✓ (option, khoảng, reload, disabled/readonly, destroy) | 30 | ✓ | 45 | ✓ |

Bảng `onMove` (SC-09 → SC-13) tự chạy trên trình duyệt: chưa làm ở phần A (phần B / R2').

### 3.4 Mã nguồn
- [✓] SC-40 → SC-45 (A-10 ghi chú).
- [✓] Không `any` mới trong public API; không `as unknown as`.
- [✗] Không rò rỉ: đọc code ✓ trừ A-05; test destroy chưa đủ (A-17).
- [✓] `effect` ghi signal trong `untracked`, không vòng lặp; `computed` không gọi API (chỉ predicate `movable` khi render, đúng §8.3).
- [✓] Không `setTimeout` chờ render (dùng `afterNextRender`; `setInterval` 60s cho giờ hiện tại, chạy ngoài zone, dọn khi destroy).
- [✓] SCSS: màu qua `tok()` có fallback, literal thang qua `--sd-radius-*`, `--sd-font-size-*`; không `!important`, `::ng-deep`; `:host` không `min-width` cố định.

### 3.5 Trợ năng và hình ảnh
- [N/A] Kiểm tay mục 8 (VoiceOver/NVDA): không làm ở phần A.
- [✗] So ảnh mục 9: thiếu ảnh (A-21); lệch không giải thích A-11 (suy từ code), A-16, A-20, A-24.
- [✓/✗] Light ✓, dark có ảnh (chưa so chi tiết), RTL ✗ (A-16), forced-colors ✓ SC-35 (A-22), reduced motion ✓ (đọc SCSS), in ✓ (A-23).

### 3.6 Tài liệu
- [✗] `sd-calendar.md`: đủ API, ví dụ client và server, bảng `onMove` có `'cancel'`, bàn phím, giới hạn, đồng bộ URL, khác biệt 600px host / 768px viewport (phụ lục §3.5). Sai bảng E2E (A-12); JSDoc directive Danh sách trái với code (A-07).
- [✓] `CHANGELOG.md` `## [Unreleased]`: Added (`#### Calendar`) và dòng Highlights.
- [✓] `THEME.md`: bảng 5 token và biến kích thước.
- [✓] `documentation.registry.ts` có trang calendar; guard showcase do phần B chạy.
- [✓] i18n đủ 5 locale (56 key mỗi locale).
- [✓] Rollout: v20/v21/v22 trùng v19 (trừ shim v22 đã duyệt); không đụng `published-*`, `dist`. `check:sync` do phần B chạy.

