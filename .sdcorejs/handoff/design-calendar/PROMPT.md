> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/design-calendar/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `README.md`: tổng quan, quy tắc, quyết định đã chốt.
- `calendar.md`: thông số đầy đủ, là nguồn chính. Khi HTML và file này khác nhau, theo file này.
- `SD Calendar Design.dc.html`: thiết kế tĩnh 7 mục.
- `Schedule Components Proposal.dc.html`: mục 04 là demo bấm thử được, mục 06 là API rút gọn.
- `support.js`: phải nằm cùng thư mục với 2 file HTML. Mở bằng trình duyệt.
- `ADDENDUM-2026-11-08.md`: phụ lục 08/11, đọc ngay sau `calendar.md`. Khi phụ lục và `calendar.md` khác nhau ở cùng một điểm, theo phụ lục.

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS cùng token `--sd-*`. Không copy markup, inline style hay logic demo. Không thêm hex (`check:scss-hex` phải xanh). Không thêm dependency.

Việc cần làm: tạo entry point mới `@sdcorejs/angular/components/calendar` với `SdCalendar<T>` theo `calendar.md` (đợt 1). Phần ngoài phạm vi ở mục 0 của `calendar.md` không làm.

## Trước khi code

Đọc hết:
- `README.md`, `calendar.md`, mở 2 file HTML để xem và bấm thử.
- `components/file-explorer/**` (`file-explorer.model.ts`, component, spec, `sd-file-explorer.md`): mẫu cho option theo nhóm năng lực (`dataSource`, `move: { movable, onMove }`, `createFolder: { creatable, onCreateFolder }`), kiểu `SdFileExplorerState`, item có `data?: T`, args có `signal`, huỷ và bỏ kết quả muộn, `reload()`, data-autoid.
- `components/table/src/models/table-option*.ts`: cách nhóm option và đặt tên callback `on<Action>`.
- **Không dùng `components/kanban/**` làm mẫu**: sd-kanban chưa được review và sẽ được cải tiến sau.
- `forms/date/**`, `forms/date-range/**`, `forms/datetime/**`: cách đọc `string | number | Date`, `minDate`/`maxDate`/`'TODAY'`, `transform` và hàm serialize, time zone.
- `forms/time-range/**` (`SdTimeRangeValue`), `forms/models` (`SdTemporalValueTransform`).
- `services/date-time/**` (`SdDateTimeService`, `sd-date-time.md`).
- `components/data-state/**`, `components/button/**`, `forms/segmented/**`, `modules/icon/**`.
- `assets/THEME.md`, `assets/scss/themes/_component-tokens.scss`, `_scales.scss`, `_semantic.scss`, `default.scss`.
- Cấu hình của upload-file (`components/upload-file/**/upload-file.configuration.ts`) và `configurations/src/sd-core.configuration.ts`.
- `i18n/src/vi.ts` (cách đặt key `core.component.*` và key chung Huỷ, Thử lại, Bỏ qua).
- Trang File Explorer trong `showcase/` và `documentation.registry.ts`.

Sau đó trình kế hoạch ngắn gồm:
1. Danh sách file sẽ tạo, sửa và commit dự kiến cho từng bước bên dưới.
2. Bảng API consistency: xác nhận lại từng dòng ở mục 2 `calendar.md` sau khi đọc code thật (kiểu chính xác, `booleanAttribute`, `input.required`, alias, nơi export). Dòng nào code thật khác giả định của tôi thì đề xuất cách sửa.
3. Cách đọc và ghi ngày giờ: dùng lại hàm nào của sd-date/sd-datetime/`SdDateTimeService`/`DateUtilities` cho từng việc ở mục 5 (đọc instant, đọc chuỗi không zone, carrier ↔ model, serialize không transform, serialize có transform, so ngày với `minDate`/`maxDate`, `TODAY`).
4. Cách dựng kéo thả bằng CDK cho lưới thời gian tự do: `cdkDrag` trên từng khối, cách tính cột/phút từ pointer (`cdkDragMoved`), cách giấu preview mặc định và vẽ khối ở vị trí đề xuất, `reset()` khi thả, `cdkDragStartDelay` cho cảm ứng, tự cuộn ở mép. Nếu thấy CDK không hợp, nêu phương án pointer events thuần và lý do.
5. Cách làm quét để tạo và kéo mép (pointer events, `setPointerCapture`), và cách phân biệt bấm với kéo (ngưỡng 5px).
6. Dữ liệu và thao tác bất đồng bộ: vòng đời `onLoad` (gọi, huỷ, bỏ kết quả muộn, `reload()`), thao tác chờ của `onCreate` và `onMove` (một lúc một thao tác, huỷ khi khoảng xem/option đổi), cách cập nhật dữ liệu sau khi chấp nhận, cách đưa focus về khối sau thao tác bàn phím (mục 9.5 bước 10). So với cách sd-file-explorer xử lý `list` và `move`.
7. Cấu trúc signal/computed: khoảng xem, danh sách ngày, sự kiện theo ngày, xếp chồng, xếp hàng cả ngày, `compact`; điểm nào dùng `effect` (phát `sdRangeChange`, huỷ thao tác chờ, cuộn ban đầu) và cách tránh phát lặp.
8. Bàn phím: cách làm con trỏ lưới với `aria-activedescendant`, roving tabindex ở Tháng, RTL.
9. Nút chuyển chế độ: dùng `sd-segmented` được không (không đăng ký vào form, `aria-pressed` hoặc tương đương), hay dựng nhóm nút riêng. Nút “Hôm nay” và nút icon dùng `sd-button` với props nào để ra đúng kích thước.
10. Token: bảng token mới với giá trị light/dark theo dạng của `_component-tokens.scss`; token thang nào thay được literal nào (radius, font-size, line-height, shadow).
11. Danh sách key i18n mới và key dùng lại.
12. Ảnh hưởng: entry point mới, export ở barrel (nếu `components/index.ts` re-export các entry point khác), showcase, `published-docs` index (guard registry).
13. Xác nhận API đợt 1 đủ cho 5 điểm ở mục 3 của `ADDENDUM-2026-11-08.md` (tạo bằng drawer không route, dời có hoàn tác, đồng bộ URL, bộ lọc chung, mobile). Điểm nào cần thêm API thì đề xuất, không tự thêm.
14. Đối chiếu lại các tên ở mục 2 `calendar.md` với `main` hiện tại (spec đối chiếu ở `773d7de`), ghi lại tên nào đã đổi.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)

1. **Khung và hàm thuần**
   - `calendar.model.ts`, `calendar.configuration.ts`, `calendar.templates.ts`, `index.ts`, `ng-package.json`.
   - `calendar.utils.ts` + spec: khoảng xem (mục 6), xếp chồng (8.4), xếp hàng cả ngày (7, 10), làm tròn và kẹp (9.2–9.4), phân loại sự kiện qua nửa đêm (5).
   - Key i18n đủ 5 locale. Token màu trong `_component-tokens.scss`.
2. **Hiển thị (chưa tương tác)**
   - Thanh công cụ, điều hướng, tiêu đề, nhóm chế độ, `dataSource.onLoad`, `reload()`, `sdRangeChange`.
   - Tuần, Ngày: tiêu đề ngày, hàng cả ngày, cột giờ, lưới, ngoài giờ, ngày lễ, giờ hiện tại, cuộn ban đầu, khối sự kiện với nội dung theo chiều cao và màu.
   - Tháng, Danh sách.
   - Trạng thái: đang tải (lần đầu, sau), lỗi tải + Thử lại, invalid-data, danh sách trống, readonly, disabled, `dimPast`, `hideWeekends`, `minDate`/`maxDate`.
   - Template directive. `data-autoid`.
3. **Tương tác**
   - Chọn, `selectedId`, `sdSelect`.
   - Tạo (`option.create`): quét, bấm, Enter trên lưới, `creatable`, `onCreate` với khối nét đứt chờ.
   - Pipeline dời đầy đủ (9.5, `option.move`, `movable`, `onMove`), `move()` public, dải thất bại, live region, focus.
   - Kéo dời (CDK), kéo mép đổi giờ kết thúc, tự cuộn.
   - Bàn phím lưới, sự kiện (`Alt`), Tháng, Danh sách.
4. **Lần lặp**: icon, `event.occurrence`, thanh hỏi phạm vi, `scope` trong request, `reload()` sau `following`/`all`.
5. **Giao diện hẹp, cảm ứng, in**: `ResizeObserver`, dải ngày, thanh công cụ 2 hàng, Tháng chấm màu, chạm tạo, giữ 400ms, vuốt ngang, `@media print`, `forced-colors`, `prefers-reduced-motion`.
6. **Tài liệu và showcase**: `sd-calendar.md` (tiếng Anh, cấu trúc như `sd-file-explorer.md`: option theo nhóm, vòng đời `onLoad`, lần lặp và phạm vi), `THEME.md`, `CHANGELOG.md` `## [Unreleased]` mục Added, trang showcase theo mục 19, `documentation.registry.ts`.

## Ràng buộc
- Không sao chép tên, kiểu hay hợp đồng từ sd-kanban (`getId`, `withColumn`, `canMove`, `model` + `sdChange`…). Option theo mục 2 và 3 của `calendar.md`.
- Mọi phép tính ngày đi qua `SdDateTimeService`. Không `new Date(string)`, không getter local trên giá trị model, không cộng 24 giờ để sang ngày.
- Không sửa mảng hay object consumer trả về từ `onLoad`/`onCreate`; cập nhật bằng object mới, giữ nguyên tham chiếu `data`.
- Không đổi API của component khác. Nếu thấy cần (ví dụ export thêm hàm serialize từ forms), nêu trong kế hoạch, không tự làm.
- Hover chỉ là lớp hiển thị bổ sung (`@media (hover: hover)`); mọi hành động dùng được bằng bàn phím và `pointer: coarse`.
- `ChangeDetectionStrategy.OnPush`, standalone, signal API, `@if/@for` với `track` theo ID.
- Hiệu năng: khoảng 500 sự kiện trong một tuần vẫn kéo mượt. Không render phần tử cho từng slot; vạch lưới vẽ bằng gradient; con trỏ lưới là một phần tử.
- Không `!important`, không `::ng-deep`.
- Comment `why:` cho quyết định không hiển nhiên, như code hiện có.

## Kiểm tra sau mỗi bước và trước khi xong
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
```

Cuối cùng:
- `npm --prefix showcase run link:library`, chạy showcase.
- Kiểm tra trên showcase:
  - 4 chế độ; điều hướng qua tháng, qua năm; tuần qua hai tháng; tháng 4, 5, 6 hàng.
  - `firstDayOfWeek` 0 và 1, `hideWeekends`, `step` 15/30/60, `workingHours` mặc định, tuỳ chỉnh và `null`, ngày lễ off và observance, `minDate="TODAY"`.
  - Không có `option.create`, `option.move`: không có thao tác tạo, không tay nắm.
  - Quét tạo, bấm tạo, Enter tạo; `creatable` chặn; `onCreate` trả sự kiện, huỷ, ném lỗi.
  - Kéo dời trong ngày và sang ngày khác, kéo mép, tự cuộn; `onMove` chấp nhận, từ chối, ném lỗi, chậm 2 giây rồi đổi tuần giữa chừng (phải huỷ).
  - Lần lặp: 3 phạm vi và Huỷ, bằng chuột và bằng phím.
  - Sự kiện chồng 2, 3, 4 khối; sự kiện 15 phút; qua nửa đêm; kết thúc 24:00; cả ngày nhiều ngày bị cắt ở mép tuần.
  - Nguồn client (trả cả mảng) và server giả lập: `onLoad` một lần mỗi khoảng, huỷ khi đổi khoảng nhanh, đang tải lần đầu và lần sau, ném lỗi + Thử lại, `reload()`.
  - `transform="ISOString"`; có và không có `timeZone: 'Asia/Ho_Chi_Minh'` (thêm `?timeZone=Asia/Ho_Chi_Minh` vào URL showcase), máy đặt múi giờ khác.
  - readonly, disabled, `move.movable` false cho sự kiện đã qua, `dimPast`.
  - Chỉ bàn phím: Tab vào lưới, chọn slot, tạo, Tab qua sự kiện, chọn, `Alt` + mũi tên dời qua mép tuần, Esc; Tháng roving.
  - Screen reader (VoiceOver hoặc NVDA): con trỏ lưới, nhãn sự kiện, thông báo dời, thanh hỏi phạm vi.
  - Light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors, RTL (`dir="rtl"`).
  - Component rộng 1200px, 700px, trong cột 400px trên desktop, điện thoại 390px với `pointer: coarse`; in (xem trước khi in).

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã tạo, sửa
- spec đã thêm
- kết quả các lệnh kiểm tra
- ảnh chụp showcase
- điểm nào lệch khỏi `calendar.md` và lý do
- kết quả rà API consistency (bảng mục 2), để đưa vào PR description
