# schedule-kanban · tiến độ (10/11/2026)

Gói `schedule-kanban` có ba PR. Không PR nào đã merge, tag, publish hay bump version.

| PR | Nhánh | Trạng thái | Việc của PD |
| --- | --- | --- | --- |
| 1 · sd-calendar | `feat/calendar` | Draft [#141](https://github.com/sdcorejs/sdcorejs-angular/pull/141). Qua R1, R2, R2' và kiểm lại lần 2. CI chạy lại sau bản vá v22 (mục "Calendar: CI"). | Review PR; chốt các mục ở `reviews/calendar-R2-author.md` mục "Chưa sửa, cần PD chốt"; merge khi đồng ý. |
| 2 · sd-kanban API mới (breaking) | `feat/kanban-api` | Draft [#142](https://github.com/sdcorejs/sdcorejs-angular/pull/142). Qua R1, R2 (2 reviewer), R2' và sửa các mục R2'. | Review PR; chốt các mục dưới đây. |
| 3 · sd-scheduler | `feat/scheduler` | Chỉ Bước 0 (G0), dừng chờ duyệt: `reports/scheduler-step0.md`. Nhánh cắt từ `feat/calendar` chỉ để có code calendar khi đọc; sau khi #141 merge sẽ cắt lại từ `main` rồi mới code. Không có PR. | Duyệt Bước 0: trả lời H1–H11 cuối file. |

## Scheduler: câu hỏi Bước 0 (tóm tắt, chi tiết trong `reports/scheduler-step0.md`)
| # | Câu hỏi | Đề xuất |
| --- | --- | --- |
| H1 | Phần dùng chung còn private trong component calendar (định dạng tiêu đề, giải cấu hình, thông báo, điều phối dời, tự cuộn) | Tách bằng commit `refactor(calendar)` đầu PR scheduler, không đổi API/DOM calendar |
| H2 | Thanh công cụ, dải lỗi, thanh hỏi phạm vi | Chép markup/SCSS sang `sd-scheduler__*` |
| H3 | `move()` có kiểm `droppable` | Có, theo SC-08 (lệch `scheduler.md` §4.3) |
| H4 | `Alt` + `↑` `↓` vào nhóm thu gọn | Vào được rồi mở nhóm (theo SCH-E-05, lệch SCH-U-09) |
| H5 | Nơi đo hiệu năng ở checkpoint 2 | Dựng sớm trang Scheduler trong showcase |
| H6 | Nếu render đầu > 100 ms | Cách 1–2 làm luôn; cách 3–4 chờ số đo và PD |
| H7 | Đổi `resources` | Xoá lưới tới khi có kết quả, huỷ thao tác tạo đang chờ |
| H8 | Key i18n thiếu | Thêm `open-day` |
| H9 | Helper test | Gom helper chung vào `testing/schedule-testing.ts` và `schedule.support.ts` |
| H10 | Pointer trên phần dính khi kéo | Giữ giá trị trục đó của lần trước |
| H11 | Thời điểm bắt đầu | Sau khi #141 merge, cắt từ `main`, làm lại câu 5 |

Sau khi cả ba PR qua R2' còn cổng RX (review chéo, `REVIEW.md` mục 4). Chưa làm vì scheduler chưa code.

## Mở lại máy
- Worktree calendar (`.claude/worktrees/calendar-scheduler-kanban-063e68`) đang chậm hơn `origin/feat/calendar` một commit (`3c769ca1`, vá CI v22). Chạy `git pull --ff-only` trong worktree đó trước khi sửa tiếp.
- Worktree kanban: `.claude/worktrees/kanban-api`, khớp `origin/feat/kanban-api`.
- Cổng 4321 của config Playwright repo đang bị app khác chiếm trên máy này; E2E local dùng config tạm cổng khác (không commit).

## Kanban: cần PD chốt
| Mục | Câu hỏi | Hiện trạng |
| --- | --- | --- |
| A-3 | Cột chưa có trang đầu (thu gọn chưa mở, đang tải, lỗi) có là đích dời không? | Chưa: menu khoá, `Alt` + phím bỏ qua, kéo làm mờ, `move()` false. Thẻ của cột đang tải lại trang đầu cũng không dời được (R2' #1). Cách khác: cho dời rồi tải cột đích. |
| A-11 | `selectedId` truyền trước khi dữ liệu về | Giữ tới khi dữ liệu có (items khác `undefined`, hoặc mọi cột mở có trang đầu/lỗi). |
| A-12 | SC-43: màu lõi `--sd-*` có cần fallback? | Không fallback, theo quy ước trên main. |
| A-14 | Vùng live thứ hai của `sd-data-state` (không có cột, dữ liệu sai) | Giữ như main. |
| A-15 | Hiệu năng TESTING §10 | Vượt: render 4 × 200 thẻ ~1,2 s (ngân sách 150 ms), long task khi kéo tới ~210 ms (dev server). 4 đề xuất trong `reports/kanban-tests.md`; không tự thêm virtual scroll. |
| B-9 | Mã test của test ảnh và hiệu năng | Giữ mã E-01 / E-09, ghi mục TESTING trong tên. |
| A-16 | Kiểm tay trình đọc màn hình, zoom 200% | Chưa làm (máy không có trình đọc màn hình). |

## Calendar: CI
Lần chạy CI đầu của #141 đỏ ở "Angular compatibility (v22)": `FakeIntersectionObserver` trong `testing/schedule-testing.ts` thiếu `scrollMargin` (DOM lib của TypeScript 6 ở dòng Angular 22). Đã vá ở `3c769ca1` (commit dựng thẳng từ worktree kanban, chỉ đổi 4 file helper). Lúc push, CI của #141 đã xanh ở sync, script, v20, v21; v19, v22 và E2E còn đang chạy. CI của #142 (chạy lần đầu khi mở PR) cũng đang chạy. Xem tab Checks của hai PR.

## Báo cáo và review
Thư mục `.sdcorejs/handoff/schedule-kanban/` trên từng nhánh:
- Calendar: `reports/calendar-{step0,tests,a11y}.md`, `reviews/calendar-R1*.md`, `calendar-R2-*.md`.
- Kanban: `reports/kanban-{step0,tests,a11y}.md`, `reports/kanban-screens/`, `reviews/kanban-R1*.md`, `kanban-R2-{spec,tests,author,recheck}.md`.
- Scheduler: `reports/scheduler-step0.md`.
