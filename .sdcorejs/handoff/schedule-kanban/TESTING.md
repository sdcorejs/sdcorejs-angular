# Kế hoạch test: sd-calendar, sd-scheduler, sd-kanban

File này quy định test **bắt buộc** cho cả ba PR. Spec riêng (`calendar.md` §18, `scheduler.md` §16, `kanban.md` §13) liệt kê nội dung; file này gán mã, thêm E2E, ma trận môi trường, ngưỡng và cách báo cáo. Reviewer độc lập (`REVIEW.md`) đối chiếu theo đúng các mã ở đây.

## 0. Nguyên tắc

1. **RED trước.** Mỗi checkpoint bắt đầu bằng commit test đỏ, sau đó mới code cho xanh. Báo lại test đỏ vì đúng lý do (assert sai), không phải vì lỗi compile hay import.
2. **Mỗi test có mã.** Tên test bắt đầu bằng mã: `it('[CAL-C-033] onMove trả cancel: khối về chỗ cũ, không sdMoveError', …)`. Một mã có thể có nhiều `it`; mọi mã phải có ít nhất một `it`.
3. **Test hành vi, không test chi tiết cài đặt.** Truy vấn DOM bằng role, `aria-*`, `data-autoid`, `data-*` của spec; không truy vấn class nội bộ, trừ khi spec quy định class (CDK).
4. **Không test bằng thời gian thật.** Dùng `fakeAsync`/`tick` hoặc `jasmine.clock()`; Promise điều khiển bằng `Deferred` (mục 3). Không `setTimeout` chờ trong test.
5. **Không test nào bị `xit`, `fit`, `pending()`** khi mở review. Test chập chờn (flaky) là lỗi Chặn.
6. **Mỗi bug tìm thấy khi review hoặc kiểm tra tay** phải có test hồi quy trước khi sửa, mã `<PREFIX>-B-xx`.

## 1. Lệnh

Nhanh, sau mỗi checkpoint:
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/<name>/**/*.spec.ts'
npm run lint
```

Đầy đủ, trước khi gọi review và trước khi mở PR:
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
npx ng build sdcorejs-angular
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
npm --prefix showcase run link:library
npx --prefix showcase playwright test e2e/components/<name>
```
Đường dẫn E2E: dùng thư mục và cấu hình Playwright đang có của showcase (`showcase/e2e/`, cùng chỗ với `e2e/pattern/`). Nếu quy ước thư mục khác, theo repo và ghi ở Bước 0.

## 2. Ngưỡng

| Phần | Statements | Branches | Ghi chú |
| --- | --- | --- | --- |
| `*.utils.ts` | 100% | 100% | Hàm thuần, không có lý do bỏ nhánh. |
| `*.component.ts` | ≥ 90% | ≥ 85% | Nhánh không test được (SSR guard) ghi lý do trong báo cáo. |
| `*.templates.ts`, `*.model.ts` | Không đo | | Có type test (mục 3.7). |

Số liệu lấy từ báo cáo coverage của Karma cho từng file, dán vào `reports/<name>-tests.md`. Không hạ ngưỡng toàn repo.

## 3. Helper dùng chung

Đặt trong `src/testing/` của từng entry point (không export ở `index.ts`), hoặc dùng helper repo đã có nếu tương đương (kiểm tra ở Bước 0). Calendar viết trước; scheduler dùng lại của calendar; kanban dùng lại nếu import được mà không tạo phụ thuộc runtime.

1. **`Deferred<T>`**: `{ promise, resolve, reject }` để điều khiển `onLoad`, `onCreate`, `onMove`.
2. **`FakeResizeObserver`**: thay `window.ResizeObserver` trong test, có `trigger(width)`. Một test chạy khi `ResizeObserver` là `undefined` (SC-32).
3. **`FakeIntersectionObserver`**: có `intersect(target)`; một test khi không có `IntersectionObserver`.
4. **Đồng hồ**: cố định "bây giờ" bằng stub `SdDateTimeService.now()` (hoặc `jasmine.clock().mockDate`) và cấu hình `timeZone` của `SD_CORE_CONFIGURATION`. Mặc định test: `2026-11-09 10:40`, zone `Asia/Ho_Chi_Minh`.
5. **Kéo**: helper phát chuỗi `mousedown` → `mousemove` (2 bước: 3px rồi tới đích, để vượt ngưỡng 5px) → `mouseup` trên phần tử, và bản `touchstart`/`touchmove`/`touchend` có giữ 400ms (`tick(400)`). Theo cách test của chính `@angular/cdk/drag-drop`. Có biến thể "bấm không kéo" (di chuyển 3px).
6. **Bàn phím**: `press(el, key, { alt, shift, ctrl, meta })` phát `keydown` đúng `key`, `code`.
7. **Type test**: file `*.types.spec.ts` dùng `// @ts-expect-error` để chứng minh: union sai bị từ chối (ví dụ `onMove` trả `'canceled'`), context của template directive có kiểu (`ngTemplateContextGuard`), `items` sai kiểu báo lỗi. Chạy được trong `ng test` (compile là đủ).
8. **i18n**: một spec chung duyệt mọi key `core.component.<name>.*` trong `vi.ts` và kiểm tra có mặt trong `en`, `ja`, `ko`, `zh`, không rỗng, cùng tập placeholder `{x}`.

## 4. Hợp đồng chung (áp dụng cho cả ba)

Mỗi dòng dưới đây phải có test trong spec component của **từng** component, mã `CAL-SC-xx`, `SCH-SC-xx`, `KAN-SC-xx` (xx theo `SHARED-CONTRACT.md`). Scheduler được phép dùng chung một bộ test tham số hoá với calendar nếu pipeline dùng chung, nhưng vẫn phải chạy trên component scheduler.

| SC | Test |
| --- | --- |
| 01 | Id trùng, id rỗng → trạng thái dữ liệu không hợp lệ (calendar, kanban items) hoặc bỏ item và cảnh báo (kanban dataSource, scheduler `resourceId` lạ). |
| 02 | Sau khi dời được chấp nhận, `item.data === dtoGốc`. |
| 03 | Mảng truyền vào bị `Object.freeze` sâu; mọi thao tác vẫn chạy, không throw. |
| 06 | `movable` là hàm: lần render trả true, lần trước `onMove` trả false → không gọi `onMove`, trả false. Tương tự `creatable`, `droppable`. |
| 07 | Không có `option.move`: không tay nắm/không kéo, menu chuyển không có, `Alt` + phím không làm gì, `move()` trả false. Không có `option.create` (calendar, scheduler): không khối nét đứt. |
| 08 | `droppable` false: không gọi `onMove` khi kéo, khi chọn trong menu (kanban), khi `Alt` + phím, khi `move()`. |
| 09–13 | Năm kết quả của `onMove`, mỗi kết quả hai biến thể: trả đồng bộ và qua `Promise`. Kiểm tra cả dữ liệu, DOM, output, live region theo bảng. |
| 14 | Đang chờ một `onMove`, thử dời cái khác bằng kéo, phím, `move()` → không gọi `onMove` lần hai, `move()` trả false. |
| 15 | Mỗi tác nhân huỷ (nguồn dữ liệu đổi, khoảng xem đổi, `reload()`, `readonly` bật, `disabled` bật, destroy) làm `signal.aborted === true`; resolve muộn không đổi dữ liệu, không phát output. |
| 16 | `onMove` throw `new Error('SECRET')`, `onLoad` reject `'SECRET'` → chuỗi `SECRET` không có trong DOM. |
| 17 | `move()` trả đúng `true`/`false` cho mọi nhánh ở SC-17. |
| 18 | Kịch bản Hoàn tác: chấp nhận dời A → B, rồi `move(id, A, 'api')` → về A, không hỏi phạm vi, không lấy focus. |
| 19–21 | (calendar, scheduler) `onCreate` trả item, void, throw. |
| 22–24 | `onLoad` có `signal`; abort khi đổi; `reload()` giữ dữ liệu cũ tới khi có kết quả; lỗi → thông báo + Thử lại + `sdLoadError`; abort không phát `sdLoadError`. |
| 25 | (kanban) có cả `items` và `dataSource` → dùng `dataSource`, `console.warn` đúng một lần. |
| 26–28 | Chọn bằng bấm, bấm-kéo-3px (vẫn là bấm), Enter, Space, chạm; Esc bỏ chọn; id biến mất → null; readonly chọn được; disabled không. |
| 29–31 | Bắt đầu bằng `Alt` + phím: sau mỗi kết quả, `document.activeElement` là item (hoặc nút tên của thẻ). Trong lúc chờ focus sang nút ngoài → giữ ở nút đó. `move(…, 'api')` không đổi focus. |
| 32 | `FakeResizeObserver.trigger(599)` → `compact`; `600` → không. Không có `ResizeObserver` → không throw, không compact. |
| 33 | Đúng một phần tử `[aria-live="polite"]` trong host. |
| 37 | Spec i18n ở mục 3.8. |
| 38 | Không có `autoId` → không phần tử nào có `data-autoid` bắt đầu bằng `components-<name>`. Có → đúng mẫu, id được `encodeURIComponent`. |

## 5. sd-calendar

### 5.1 Unit (`calendar.utils.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| CAL-U-01 | Khoảng xem của Tháng, Tuần, Ngày, Danh sách cho một ngày neo. |
| CAL-U-02 | `firstDayOfWeek` 0, 1, 6. |
| CAL-U-03 | `hideWeekends` ở Tuần và Tháng. |
| CAL-U-04 | Tháng có 4, 5, 6 hàng (02/2026, 11/2026, 08/2026). |
| CAL-U-05 | `agendaDays` 1, 14, 62; 0 và 63 bị kẹp. |
| CAL-U-06 | Xếp chồng: không giao. |
| CAL-U-07 | Giao 2. |
| CAL-U-08 | Chuỗi giao bắc cầu 3 khối. |
| CAL-U-09 | Cùng giờ bắt đầu: khối dài trước. |
| CAL-U-10 | Kết thúc đúng lúc khối khác bắt đầu: không giao. |
| CAL-U-11 | Hàng cả ngày: thứ tự, tái dùng hàng. |
| CAL-U-12 | Thanh cắt theo khoảng xem, cờ cắt trái/phải. |
| CAL-U-13 | Tối đa 3 hàng, “+N” đúng từng ngày. |
| CAL-U-14 | Làm tròn quét theo `step` 5, 15, 30, 60; bấm một slot. |
| CAL-U-15 | Làm tròn dời theo `moveStep = min(step, 15)`. |
| CAL-U-16 | Kẹp `[00:00, 24:00 − thời lượng]`. |
| CAL-U-17 | Đổi giờ kết thúc: tối thiểu 15 phút (hoặc `step` khi < 15), tối đa 24:00. |
| CAL-U-18 | Sự kiện qua nửa đêm → hàng cả ngày, nhãn có giờ bắt đầu. |
| CAL-U-19 | Kết thúc đúng 24:00 → vẫn ở lưới. |
| CAL-U-20 | DST: zone `America/New_York`, ngày 08/03/2026 (23 giờ) và 01/11/2026 (25 giờ): khoảng xem đúng ngày, vị trí khối theo wall clock, không lệch 1 giờ ở ngày kế. |
| CAL-U-21 | Serialize không transform (`yyyy/MM/dd HH:mm:ss`, cả ngày `yyyy/MM/dd`), `ISOString`, `UTCString`; `request.from` cùng dạng `to`. |

### 5.2 Component (`calendar.component.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| CAL-C-01 | Render 4 chế độ; `views` lọc và sắp nút; `view` ngoài `views` → phần tử đầu. |
| CAL-C-02 | `onLoad` gọi một lần khi khởi tạo với `{ from, to, view, signal }` đúng. |
| CAL-C-03 | Gọi lại khi ‹ ›, Hôm nay, đổi chế độ, đổi `firstDayOfWeek`; không gọi khi khoảng giữ nguyên. |
| CAL-C-04 | Client trả cả mảng → chỉ hiện sự kiện trong khoảng. |
| CAL-C-05 | `option` mới → tải lại; thay đổi bên trong object không tải lại. |
| CAL-C-06 | `sdRangeChange` phát cùng lúc `onLoad`, không phát lặp; compact phát `view: 'day'`. |
| CAL-C-07 | Zone: instant `1960-05-19T16:00:00Z` nằm ở 20/05/1960 với `Asia/Ho_Chi_Minh`. |
| CAL-C-08 | Tạo: quét gọi `onCreate` đúng khoảng; bấm một slot; Enter trên lưới; ngoài `minDate` không gọi; khoá không gọi. |
| CAL-C-09 | Trong lúc chờ `onCreate`: khối nét đứt có icon sync; tạo và dời khác bị chặn. |
| CAL-C-10 | Kéo dời sang ngày khác, cùng ngày khác giờ; thả ra ngoài hoặc Esc → huỷ. |
| CAL-C-11 | Đổi giờ kết thúc bằng kéo mép; `source: 'resize'`. |
| CAL-C-12 | `Alt` + `↑` `↓` dời `moveStep`; `Alt` + `Shift` đổi giờ kết thúc; `Alt` + `←` `→` dời 1 ngày, qua mép đổi `date` và focus theo; RTL đảo. Không `Alt` → không dời. |
| CAL-C-13 | Lần lặp: thanh hỏi mở, focus “Chỉ lần này”; Esc và Huỷ → không gọi `onMove`, khối về chỗ cũ; chọn phạm vi → `request.scope`; `following`/`all` → `reload()` sau khi chấp nhận. |
| CAL-C-14 | Tháng: roving tabindex, `←→↑↓`, Home/End, PageUp/PageDown, Shift + PageUp/PageDown, Enter mở Ngày, “+N khác”. |
| CAL-C-15 | Danh sách: bỏ ngày trống, trạng thái trống, template trống, cột địa điểm chỉ khi ≥ 720px. |
| CAL-C-16 | Dữ liệu không hợp lệ: id trùng, title rỗng → `sd-data-state`; ngày hỏng → bỏ sự kiện đó. |
| CAL-C-17 | `readonly`, `disabled` theo `calendar.md` 13. |
| CAL-C-18 | Compact: dải 7 ngày, 3 nút chế độ, `cdkDragStartDelay` touch 400, vuốt ngang ≥ 60px đổi ngày. |
| CAL-C-19 | A11y: `aria-label` khối, `aria-pressed` nút chế độ, `aria-activedescendant` lưới, `aria-busy` khi tải, `role="alertdialog"` thanh hỏi. |
| CAL-C-20 | `dimPast`, `hideWeekends`, `holidays` off/observance, `workingHours = null`, `scrollTime` cuộn ban đầu. |
| CAL-C-21 | Giờ hiện tại cập nhật mỗi 60 giây (`tick(60000)`), chỉ ở cột hôm nay. |
| CAL-C-22 | Template directive: context đúng, template sự kiện thay nội dung nhưng giữ khung và trạng thái. |
| CAL-C-23 | Export từ `index.ts` đủ type và token mà scheduler cần (phụ lục mục 4, điểm 15). |

### 5.3 E2E (showcase, Playwright)
| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| CAL-E-01 | Tuần, quét 14:00–15:30 thứ Tư, dialog demo Lưu | Khối mới đúng giờ, được chọn. |
| CAL-E-02 | Quét, dialog Đóng | Không có khối mới, không thông báo. |
| CAL-E-03 | Kéo sự kiện sang ngày khác | Dời đúng; panel demo ghi `sdMove`. |
| CAL-E-04 | `onMove` chậm 2s, bấm › trong lúc chờ | Không có kết quả muộn ở tuần mới; quay lại tuần cũ thấy sự kiện ở chỗ cũ. |
| CAL-E-05 | Kéo mép dưới | Giờ kết thúc mới. |
| CAL-E-06 | Dời sự kiện lặp, thử 3 phạm vi và Huỷ | Đúng request; Huỷ về chỗ cũ. |
| CAL-E-07 | `onMove` từ chối | Viền lỗi, dải Bỏ qua, focus giữ. |
| CAL-E-08 | `onMove` mở hộp lý do, đóng hộp | `'cancel'`: về chỗ cũ, không viền lỗi, không dải. |
| CAL-E-09 | Toast Hoàn tác sau khi dời | Về chỗ cũ. |
| CAL-E-10 | Chỉ bàn phím: Tab vào lưới, mũi tên, Enter tạo, Tab tới sự kiện, `Alt` + `→` qua mép tuần | Tuần đổi, focus theo khối. |
| CAL-E-11 | Tháng: phím, Enter, “+N khác” | Mở Ngày đúng. |
| CAL-E-12 | Đồng bộ URL `?view=&date=`, tải lại trang | Khôi phục đúng chế độ và ngày, không phát `sdRangeChange` lặp. |
| CAL-E-13 | 390×844, `hasTouch`, `isMobile`: chạm tạo, giữ 400ms kéo, vuốt đổi ngày | Như spec 12. |
| CAL-E-14 | Server giả lập ném lỗi, Thử lại | Dải lỗi rồi có dữ liệu. |
| CAL-E-15 | `timezoneId: 'America/New_York'` + `?timeZone=Asia/Ho_Chi_Minh` | Sự kiện hiện theo giờ Việt Nam. |
| CAL-E-16 | `emulateMedia({ media: 'print' })` | Ảnh chụp in đúng chế độ đang xem. |
| CAL-E-17 | Component trong cột 400px trên desktop 1280px | Giao diện hẹp dù viewport rộng. |

## 6. sd-scheduler

### 6.1 Unit (`scheduler.utils.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| SCH-U-01 | Lane: không giao. |
| SCH-U-02 | Lane: giao 2, bắc cầu 3. |
| SCH-U-03 | Cùng `start`; cả ngày đứng trước. |
| SCH-U-04 | Kết thúc đúng lúc bắt đầu: không giao. |
| SCH-U-05 | Tuần, Tháng: khối có giờ coi là một ngày. |
| SCH-U-06 | Chiều cao hàng `max(48, 8 + 32n)`, top theo lane. |
| SCH-U-07 | Toạ độ Ngày trong ngày, cắt đầu, cắt cuối, cả ngày, qua nửa đêm, bề rộng tối thiểu 12px. |
| SCH-U-08 | Toạ độ Tuần, Tháng: `hideWeekends`, tháng 28/30/31 ngày, thanh cắt hai đầu. |
| SCH-U-09 | Hàng kế cho `Alt` + `↑` `↓`: bỏ hàng nhóm, nhóm thu gọn, hàng `droppable` false. |
| SCH-U-10 | DST như CAL-U-20 với trục ngang Ngày (ngày 23 và 25 giờ). |

### 6.2 Component (`scheduler.component.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| SCH-C-01 | Render 3 chế độ; `views`; `view` không hợp lệ. |
| SCH-C-02 | `onLoad` nhận `resourceIds` đúng thứ tự (gồm nhóm thu gọn); gọi lại khi `resources` đổi tham chiếu; không gọi khi `resources` rỗng; `sdRangeChange` không phát khi chỉ `resources` đổi. |
| SCH-C-03 | Sự kiện có `resourceId` lạ: bỏ qua, cảnh báo một lần. |
| SCH-C-04 | Nhóm: thứ tự, tài nguyên không nhóm đứng đầu, thu gọn ẩn hàng nhưng vẫn tải, giữ khi đổi khoảng. |
| SCH-C-05 | Tạo: quét giữ hàng, `creatable` nhận `resource`, Tuần/Tháng `allDay: true`, không tạo trên hàng nhóm. |
| SCH-C-06 | Dời sang hàng khác: request có `from.resourceId`, `to.resourceId`, `resource`; sau chấp nhận item có `resourceId` mới. |
| SCH-C-07 | `droppable`: hàng bị từ chối có trạng thái mờ khi kéo; thả vào không gọi `onMove`. |
| SCH-C-08 | `axis: 'time'`: không đổi hàng, `Alt` + `↑` `↓` không làm gì. `axis: 'resource'`: không đổi giờ, không tay nắm. |
| SCH-C-09 | Đích trong nhóm thu gọn → mở nhóm. |
| SCH-C-10 | Đổi giờ kết thúc ở Ngày; ở Tuần, Tháng chỉ sự kiện cả ngày. |
| SCH-C-11 | Template ô: không vẽ khối, không kéo; ô có sự kiện → `sdCellSelect`; ô trống → `onCreate`; `views` của directive. |
| SCH-C-12 | Template tài nguyên, sự kiện, trống: context đúng. |
| SCH-C-13 | `resource.workingHours` ghi đè tô ngoài giờ và Home/End. |
| SCH-C-14 | Bàn phím lưới hai trục, `Ctrl/Cmd` + Home/End, `Alt` + `Enter` thu gọn nhóm, RTL. |
| SCH-C-15 | Compact: biến kích thước, ẩn mô tả, tên 2 dòng, `cdkDragStartDelay` touch. |
| SCH-C-16 | A11y: `rowheader`, `aria-expanded` hàng nhóm, nhãn khối có tên tài nguyên, live region `drop-blocked`. |
| SCH-C-17 | Giờ hiện tại chỉ ở Ngày khi xem hôm nay; `scrollTime` cuộn ngang. |
| SCH-C-18 | Dùng lại pipeline và hàm của calendar: không có bản sao hàm thuần (reviewer kiểm tra bằng diff; test chỉ cần import đúng nguồn). |

### 6.3 E2E
| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| SCH-E-01 | Đặt phòng: quét 10:00–12:00 trên Phòng Huế, Lưu | Khối mới đúng hàng, đúng giờ. |
| SCH-E-02 | Kéo “Review ngân sách Q4” sang Phòng Huế | Đổi hàng; nhãn nổi đúng trong lúc kéo. |
| SCH-E-03 | Kéo sang Phòng Cần Thơ (4 chỗ) | Hàng mờ khi kéo; thả về chỗ cũ, không gọi `onMove`. |
| SCH-E-04 | Nghỉ phép `axis: 'time'`: kéo dọc | Không đổi người. |
| SCH-E-05 | Thu gọn nhóm Tầng 5, `Alt` + `↓` từ Tầng 3 | Nhóm mở, khối sang hàng đầu của Tầng 5. |
| SCH-E-06 | Chấm công: bấm ô có mã | `sdCellSelect` đúng người và ngày. |
| SCH-E-07 | Kéo mép phải | Giờ kết thúc mới. |
| SCH-E-08 | Cuộn ngang, dọc | Cột tài nguyên và trục giờ dính đúng. |
| SCH-E-09 | `onMove` trả `'cancel'` | Về hàng và giờ cũ, không lỗi. |
| SCH-E-10 | Lỗi tải, Thử lại | Như CAL-E-14. |
| SCH-E-11 | 390px, `hasTouch` | Cột tài nguyên 120px, chạm tạo, giữ 400ms kéo. |
| SCH-E-12 | 150 tài nguyên × 31 ngày × 3 sự kiện | Đo theo mục 10. |

## 7. sd-kanban

### 7.1 Unit (`kanban.utils.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| KAN-U-01 | `reorder` tắt: giữ vị trí của thẻ trong mảng `items`. |
| KAN-U-02 | `reorder` bật: chèn trước `beforeId`; `null` → sau thẻ cuối của cột đích. |
| KAN-U-03 | Cùng cột lên, xuống; cùng vị trí → no-op. |
| KAN-U-04 | Dữ liệu không hợp lệ theo `kanban.md` §8. |
| KAN-U-05 | Cột kế cho `Alt` + `←` `→`: bỏ disabled, thu gọn, bị từ chối; RTL. |
| KAN-U-06 | `to.index` và `to.beforeId` đúng khi đang lọc bằng keyword và khi cột chỉ tải một phần. |

### 7.2 Component (`kanban.component.spec.ts`)
| Mã | Nội dung |
| --- | --- |
| KAN-C-01 | `items`: render theo `columns`; tham chiếu mới thay dữ liệu và huỷ thao tác chờ. |
| KAN-C-02 | `dataSource`: `onLoad` cho từng cột không thu gọn với `{ columnId, cursor: null, pageSize, keyword: '', signal }`. |
| KAN-C-03 | Cột thu gọn tải khi mở lần đầu; header “–” trước đó. |
| KAN-C-04 | `loadMore(columnId)` và nút Xem thêm truyền `nextCursor`; hết trang thì không còn nút; `loadMore: 'auto'` với `FakeIntersectionObserver`. |
| KAN-C-05 | `total` và `summary` chỉ đọc ở trang đầu; số đếm “n+” khi thiếu `total`. |
| KAN-C-06 | `keyword` đổi → debounce rồi tải lại mọi cột đã tải; huỷ lần tải cũ. |
| KAN-C-07 | `columns` mới: chỉ tải cột mới, huỷ cột bị bỏ, giữ state cột còn lại. |
| KAN-C-08 | `reload()` và `reload(columnId)`. |
| KAN-C-09 | Lỗi trang đầu (thay vùng thẻ) và trang sau (thay nút); Thử lại gọi đúng cursor; cột khác vẫn kéo được. |
| KAN-C-10 | `droppable` tính khi `cdkDragStarted`; làn bị từ chối có `data-blocked`, `aria-disabled`; menu khoá mục; `Alt` + `→` bỏ qua. |
| KAN-C-11 | `reorder` tắt: `cdkDropListSortingDisabled`, không khe, request `index: null`, `beforeId: null`, không có Lên/Xuống, `Alt` + `↑` `↓` không làm gì. |
| KAN-C-12 | `reorder` bật: khe nét đứt, request đúng như KAN-U-06. |
| KAN-C-13 | Sau khi chấp nhận ở chế độ `dataSource`: thẻ ở đầu làn đích, `total` nguồn −1, đích +1, không gọi `onLoad`. |
| KAN-C-14 | Chọn: bấm phát `sdSelect`, kéo không phát; Enter, Space; Esc; `aria-current`. |
| KAN-C-15 | Kéo bằng cả thẻ: không còn tay nắm; `movable` false → không kéo, vẫn chọn. |
| KAN-C-16 | Nút tên phủ thẻ: Tab vào thẻ, nút ⋯ và actions bấm được (không bị lớp phủ chặn). |
| KAN-C-17 | `searchable` mặc định false; bật → có ô tìm; lọc theo `searchText ?? title`. |
| KAN-C-18 | Template thẻ chứa `button` → cảnh báo dev một lần. |
| KAN-C-19 | Thẻ đang chọn, đang chờ, thất bại có đúng thuộc tính `data-selected`, `data-pending`. |

### 7.3 Hồi quy từ main (giữ hành vi, đổi API)
Spec hiện có trên main được sửa theo API mới, **không xoá ý nghĩa**. Bảng ánh xạ spec cũ → mã mới đưa vào `reports/kanban-tests.md`.
| Mã | Hành vi phải giữ |
| --- | --- |
| KAN-R-01 | Cả board chỉ một thao tác chờ. |
| KAN-R-02 | Thay dữ liệu, option, columns, khoá board hoặc destroy → abort, kết quả muộn bị bỏ. |
| KAN-R-03 | Consumer thay dữ liệu ngay trong callback → bỏ đề xuất cũ. |
| KAN-R-04 | Focus theo thẻ đã dời khi tương tác bắt đầu còn giữ focus, kể cả khi control bị disable tạm. |
| KAN-R-05 | Người dùng focus chỗ khác trong lúc chờ → giữ nguyên. |
| KAN-R-06 | `move()` 'api' ở board khác có cùng id thẻ không lấy focus. |
| KAN-R-07 | Lỗi hiện trên thẻ; chỉ lên board khi thẻ không hiện (lọc, thu gọn). |
| KAN-R-08 | Đích đang thu gọn → mở sau khi chấp nhận. |
| KAN-R-09 | Làn trung tính, chấm màu, count “hiện/tổng” khi lọc (theo `items`). |

### 7.4 E2E
| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| KAN-E-01 | Ví dụ Đơn hàng: bắt đầu kéo một thẻ ở Chờ xác nhận | Hoàn tất mờ ngay, Đang giao nhận được. |
| KAN-E-02 | Thả vào Đang giao, bấm Hoàn tác trên toast | Về Chờ xác nhận; số đếm hai cột đúng. |
| KAN-E-03 | Kéo sang Đã huỷ (mở cột), đóng hộp lý do | `'cancel'`: về chỗ cũ, không lỗi. |
| KAN-E-04 | Xem thêm tới hết trang | Nút biến mất; số đếm đúng `total`. |
| KAN-E-05 | Bật lỗi cột Đang giao, Thử lại | Cột lỗi riêng; cột khác vẫn kéo được. |
| KAN-E-06 | Bấm thẻ | Drawer demo mở đúng đơn; kéo 3px vẫn là bấm. |
| KAN-E-07 | Chỉ bàn phím: Tab tới thẻ, Enter, `Alt` + `→` | Chọn, chuyển cột, focus theo thẻ. |
| KAN-E-08 | `hasTouch`: chạm chọn, giữ 400ms kéo, vuốt ngang cuộn board | Như spec. |
| KAN-E-09 | Ví dụ Công việc `reorder: true` | Khe nét đứt; request `beforeId` đúng (panel demo). |
| KAN-E-10 | Board trong cột 400px | Compact theo host. |

## 8. Trợ năng

Tự động: nếu showcase đã có `@axe-core/playwright` (hoặc tương đương) thì chạy axe trên mọi trạng thái ở mục 9, không có vi phạm `serious`/`critical`. Nếu chưa có, **không thêm dependency**; ghi ở Bước 0 và làm bước tay đầy đủ.

Tay (ghi kết quả vào `reports/<name>-a11y.md`):
- VoiceOver + Safari hoặc NVDA + Firefox: con trỏ lưới, nhãn item, thông báo đang lưu, đã dời, từ chối, huỷ, lỗi tải; thanh hỏi phạm vi (calendar, scheduler); làn bị từ chối (kanban).
- Chỉ bàn phím từ đầu trang tới mọi thao tác, không bẫy focus.
- Phóng to 200%: không mất nội dung, không chồng chữ.
- `forced-colors` (Chromium `emulateMedia({ forcedColors: 'active' })`): khung, chọn, đang chờ thấy được.

## 9. Hình ảnh

Chụp bằng Playwright, đính vào PR và vào `reports/<name>-screens/`, so với HTML trong gói (cùng dữ liệu mẫu, cùng bề rộng). Reviewer so từng cặp.
- Calendar: 7 mục của `SD Calendar Design.dc.html` (Tuần 960px, Ngày, Tháng, Danh sách, 7 trạng thái khối, 6 tương tác, trạng thái component, mobile 390px).
- Scheduler: mục 01–07 của `SD Scheduler Design.dc.html` (Ngày 1122px, Tuần, Tháng, khối, 4a–4d, chấm công, 4 trạng thái, hẹp 360px).
- Kanban: mục 02–05 của `Kanban Review.dc.html` (board đang kéo, 8 trạng thái thẻ, 3 kiểu làn, 5 trạng thái tải).
- Mỗi bộ chụp ở light, dark (`data-sd-theme="dark"`), RTL (`dir="rtl"`) cho ít nhất màn chính.

Lệch thiết kế có chủ đích phải ghi lý do trong PR. Lệch không giải thích là lỗi Nên sửa.

## 10. Hiệu năng

Đo trong E2E bằng `performance.now()` quanh lần render đầu sau khi dữ liệu về, và `PerformanceObserver('longtask')` trong lúc kéo. Chạy 5 lần, lấy trung vị, máy CI chuẩn của repo.
| Kịch bản | Ngân sách |
| --- | --- |
| Calendar Tuần, 500 sự kiện | Render đầu ≤ 150ms; kéo không có long task > 50ms. |
| Scheduler 150 tài nguyên × 31 ngày × 3 sự kiện | Render đầu ≤ 250ms; kéo không có long task > 50ms. |
| Kanban 4 cột × 200 thẻ (`items`) | Render đầu ≤ 150ms; kéo không có long task > 50ms. |
Vượt ngân sách: báo ở review, kèm đề xuất; không tự thêm virtual scroll.

## 11. Ma trận môi trường

| Trục | Giá trị |
| --- | --- |
| Trình duyệt | Chromium, Firefox, WebKit nếu cấu hình Playwright của showcase đã có các project này; không thì Chromium và ghi lại. |
| Bề rộng | 1280, 960, 700, 400 (trong cột trên desktop), 390 (mobile, `hasTouch`, `isMobile`). |
| Zone trình duyệt | `Asia/Ho_Chi_Minh`, `UTC`, `America/New_York`, `Asia/Kolkata` (+05:30). |
| Cấu hình zone | Có và không có `timeZone` của `SD_CORE_CONFIGURATION`. |
| Locale | vi, en (chạy E2E chính); ja, ko, zh chỉ kiểm tra không thiếu key và không tràn chữ trên ảnh chụp. |
| Theme | light, dark; preset default và graphite. |
| Hướng | LTR, RTL. |
| Media | `prefers-reduced-motion: reduce`, `forced-colors: active`, `print` (calendar). |

Không cần chạy đủ tích Descartes. Bắt buộc: mọi E2E ở Chromium 1280 light vi; mỗi giá trị của từng trục xuất hiện ít nhất một lần trong bộ E2E.

## 12. Báo cáo test

Mỗi PR có `reports/<name>-tests.md` (đặt trong `.sdcorejs/handoff/schedule-kanban/reports/`, không commit vào thư viện):
```
# <name> · test
Commit: <sha>
| Mã | File:dòng test | Kết quả | Ghi chú |
| CAL-U-01 | calendar.utils.spec.ts:12 | ✓ | |
...
Coverage: <file> statements x% branches y%
E2E: <số> pass / <số> fail · trình duyệt · thời gian
Hiệu năng: <kịch bản> trung vị
Bỏ qua có lý do: <mã> — <lý do>
```

## 13. Xong khi
- Mọi mã ở mục 4 và mục của component có test xanh, có trong báo cáo.
- Ngưỡng mục 2 đạt.
- Lệnh đầy đủ ở mục 1 xanh.
- E2E xanh trên ma trận bắt buộc ở mục 11.
- Ảnh chụp mục 9 đã đính.
- Review độc lập (`REVIEW.md`) không còn mục Chặn, mọi mục Nên sửa đã sửa hoặc có lý do được duyệt.
