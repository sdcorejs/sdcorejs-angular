# schedule-kanban · tiến độ (11/11/2026)

Gói `schedule-kanban` có ba PR chính và hai PR dọn sau review chéo. Phiên tác giả không tag, không publish, không bump version.

| PR | Nhánh | Trạng thái | Việc của PD |
| --- | --- | --- | --- |
| 1 · sd-calendar | `feat/calendar` | [#141](https://github.com/sdcorejs/sdcorejs-angular/pull/141) đã merge vào `main`. | — |
| 2 · sd-kanban API mới (breaking) | `feat/kanban-api` | [#142](https://github.com/sdcorejs/sdcorejs-angular/pull/142) đã merge vào `main`. | — |
| 3 · sd-scheduler | `feat/sd-scheduler` (nhánh local `feat/scheduler`) | Draft [#146](https://github.com/sdcorejs/sdcorejs-angular/pull/146). Qua G0, CP1–CP6, R1, G-final, R2, R2', R2'' và RX; có các quyết định PD ngày 11/11. | Review, merge khi đồng ý. |
| Dọn chung RX | `feat/schedule-cleanup`, base `feat/sd-scheduler` | Draft [#147](https://github.com/sdcorejs/sdcorejs-angular/pull/147): vùng chạm 44px theo `pointer: coarse` (RX #7), key `core.common.retry` / `core.common.dismiss` (RX #10), câu chung của kanban (RX #11). | Merge sau #146, đổi base sang `main`. |
| Kanban A-15 | `perf/kanban-card-outlet`, base `feat/schedule-cleanup` | Draft [#148](https://github.com/sdcorejs/sdcorejs-angular/pull/148): template thẻ trong outlet OnPush. Cải thiện nhỏ (task lớn nhất khi kéo giảm ~15%, render không đổi). | Xem số đo trong PR rồi quyết giữ hay đóng. |

Thứ tự merge: #146 → #147 → #148. Sau mỗi lần merge, đổi base của PR kế tiếp sang `main`.

## Quyết định PD ngày 11/11/2026
Đã làm theo đề xuất của tác giả cho mọi mục còn chờ.

### Đổi code
| Mục | Quyết định | Ở đâu | Test |
| --- | --- | --- | --- |
| RX #2 | `Alt` + `Shift` + mũi tên (đổi giờ kết thúc) có `request.source: 'resize'` ở cả calendar và scheduler. | #146 | `[CAL-C-12]` |
| RX #6 | Focus đang ở chính item khi thao tác bắt đầu (mọi `source`, cả `move(…, 'api')` và kéo) thì đi theo item sau khi dời, như kanban. Focus ở chỗ khác thì không bị lấy (SC-31). `ɵSdCalendarFocusKeeper.holds(id)`. | #146 | `[CAL-SC-31]` ×2, `[SCH-SC-31]` |
| R2 #12 | Tiêu đề Tuần theo cột hiển thị khi `hideWeekends` ("9 – 13 tháng 11, 2026"). | #146 | `[SCH-B-12]` |
| R2 #5 | Tiêu đề hẹp: Ngày "09/11/2026", Tuần "09/11 – 15/11/2026" (dạng khoảng của calendar, đúng thứ tự ngày tháng của mọi locale, thay cho "09 – 15/11/2026"), Tháng giữ "Tháng 11, 2026". | #146 | `[SCH-B-05]` |
| R1 #7 | Mảng `resources` mới cùng danh sách id: chỉ vẽ lại hàng, không gọi `onLoad`, không xoá lưới, không huỷ thao tác đang chờ. Danh sách id khác (id hoặc thứ tự): tải lại như trước. | #146 | `[SCH-B-50]` ×2 |
| RX #7 | Vùng chạm 44px (`--sd-control-height-coarse`) theo `pointer: coarse` ở mọi bề rộng; bố cục hẹp vẫn theo host < 600px. Kanban 40px → 44px. Nút "+N" 22px của calendar giữ (vùng chạm cao hơn đè hàng kế). | #147 | `[CAL-SC-36]`, `[SCH-SC-36]`, `[KAN-SC-36]` |
| RX #10 | Key chung `core.common.retry`, `core.common.dismiss`. Key chưa phát hành của calendar và `kanban.retry` bỏ; `core.component.kanban.dismiss` (có ở 3.5) giữ, deprecated. | #147 | Karma ba component |
| RX #11 | Chỉ thống nhất câu chung: kanban "Đang lưu {title}", "Đã huỷ thay đổi". Động từ theo miền giữ riêng. | #147 | Karma kanban |
| A-15 | Đề xuất 1 (thẻ OnPush) ở dạng ít rủi ro: outlet OnPush cho template của consumer, context ổn định. | #148 | `[KAN-B-40]` |

### Giữ như hiện tại (đã ghi vào spec)
| Mục | Quyết định | Ghi ở |
| --- | --- | --- |
| R1 #8 | Biến kích thước chỉ nhận px. | `design-scheduler/scheduler.md` §7, `sd-scheduler.md` |
| R1 #9 | Giữ kiểu public `SdSchedulerCellView`. | §8.5 |
| R1 #10 | `aria-label` trên `role="grid"`, không trên vùng cuộn (ARIA 1.2 cấm trên `div` generic). | §14 |
| R1 #13 | Có số đo production (101 ms trong trang, ngân sách 250 ms): đóng. | — |
| R1 #15 | ‹ › không đặt lại `scrollLeft`. | §6 |
| R2 #7 | Ô số ngày Tháng giữ 28px (đủ 24×24 của WCAG 2.2 AA 2.5.8). | §11 |
| R2 #9 | Số ngày "9" theo định dạng calendar. | §6 |
| R2 #10 | Không có khung nét đứt ở hàng gốc khi chờ phạm vi hay đang lưu (như calendar 8.3). | §8.4 bước 5 |
| R2 #11 | Không có phần tử ô `data-date` khi không có template ô (SC-44). | §15 |
| Test #7, #9, #10 | Preset `graphite` / locale `en` không có trong E2E; hiệu năng scheduler đạt ở production; viewport 1920: chấp nhận. | — |
| RX #8 | Token của component phải có fallback; token lõi `--sd-*` (cả `--sd-shadow-*`) không cần; fallback đang có thì giữ. | `SHARED-CONTRACT.md` SC-43 |
| RX #9 | Chấp nhận vùng live riêng của `sd-data-state`. | SC-33 |
| Kanban A-3, A-11, A-12, A-14 | Giữ như hiện tại (A-12 theo RX #8, A-14 theo RX #9). | — |

### Còn mở
- A-16: kiểm tay bằng trình đọc màn hình và zoom 200% cần người có trình đọc màn hình. Chưa làm.
- RX #9 phần tuỳ chọn: input tắt vùng live của `sd-data-state`. Chưa làm (thêm public API, cần review API riêng).
- A-15 bước tiếp (nếu PD muốn sau #148): nghe sự kiện kéo trong code thay vì trong template, `content-visibility: auto` trên thẻ. Phân tích ở `reports/kanban-tests.md`.
- Nhánh cũ `origin/feat/scheduler` (chỉ commit Bước 0 `52a79638`, không PR nào dùng): phiên tác giả xoá bị chặn. PD xoá bằng `git push origin --delete feat/scheduler`.

## Mở lại máy
- Worktree scheduler: `.claude/worktrees/scheduler`. Nhánh local `feat/scheduler` → `origin/feat/sd-scheduler`; `feat/schedule-cleanup` và `perf/kanban-card-outlet` cùng tên trên remote.
- Máy mới: `git fetch`, rồi `git switch feat/sd-scheduler` (hoặc hai nhánh kia). Cài `versions/v19` (`npm ci --legacy-peer-deps`) và `showcase` (`npm --prefix showcase ci --legacy-peer-deps`); build lib trước khi chạy showcase hay E2E.
- Cổng 4321 của config Playwright repo từng bị app khác chiếm trên máy cũ; E2E local dùng config tạm cổng khác (không commit), import `showcase/playwright.config.ts` và đổi `baseURL`, `webServer`. Bộ lọc Playwright khớp cả đường dẫn worktree: lọc bằng `components[\\/]scheduler`.
- Sau `npm run sync`, khôi phục các file v22 chỉ đổi CRLF (memory `sync-v22-phantom-eol`).
- Ảnh calendar, kanban đổi mỗi lần chạy E2E vì đồng hồ không ghim hoặc vị trí kéo: chỉ commit ảnh khi giao diện thật sự đổi.

## Báo cáo và review
Thư mục `.sdcorejs/handoff/schedule-kanban/`:
- Calendar: `reports/calendar-{step0,tests,a11y}.md`, `reviews/calendar-R1*.md`, `calendar-R2-*.md`.
- Kanban: `reports/kanban-{step0,tests,a11y}.md`, `reports/kanban-screens/`, `reviews/kanban-R1*.md`, `kanban-R2-*.md`.
- Scheduler: `reports/scheduler-{step0,tests,a11y}.md`, `reports/scheduler-screens/`, `reviews/scheduler-R1*.md`, `scheduler-R2-{spec,tests,author,recheck-spec,recheck-tests}.md`.
- Review chéo: `reviews/cross-RX.md`, `reviews/cross-RX-author.md`.
