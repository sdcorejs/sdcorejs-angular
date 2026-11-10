# schedule-kanban · tiến độ (11/11/2026)

Gói `schedule-kanban` có ba PR. Không PR nào được tag, publish hay bump version bởi phiên tác giả.

| PR | Nhánh | Trạng thái | Việc của PD |
| --- | --- | --- | --- |
| 1 · sd-calendar | `feat/calendar` | [#141](https://github.com/sdcorejs/sdcorejs-angular/pull/141) đã merge vào `main`. | Các mục còn chờ ở `reviews/calendar-R2-author.md`. |
| 2 · sd-kanban API mới (breaking) | `feat/kanban-api` | [#142](https://github.com/sdcorejs/sdcorejs-angular/pull/142) đã merge vào `main`. | Các mục "Kanban: cần PD chốt" dưới đây. |
| 3 · sd-scheduler | `feat/sd-scheduler` (nhánh local `feat/scheduler`, cắt lại từ `main`) | Draft PR `feat(scheduler): thêm sd-scheduler`. Qua G0, CP1–CP6, R1, G-final, R2 (2 reviewer), R2' và xác nhận R2'': cả hai reviewer "Được mở PR". | Review PR; chốt các mục "Scheduler: cần PD chốt"; merge khi đồng ý. |

RX (review chéo ba component, `REVIEW.md` mục 4) đã xong: `reviews/cross-RX.md` (0 Chặn, 5 Nên sửa, 18 Ghi chú), phản hồi `reviews/cross-RX-author.md`. Sửa trên #146: focus SC-30 dùng chung (#4), vùng chạm 44px của calendar khi hẹp (#1), chữ "Bỏ qua" của kanban (#3), helper E2E chung `showcase/e2e/components/schedule.support.ts` (#5).

## RX: cần PD chốt
| Mục | Câu hỏi |
| --- | --- |
| #2 | `Alt` + `Shift` + mũi tên (đổi giờ kết thúc): `request.source` là `'keyboard'` (calendar) hay `'resize'` (scheduler)? |
| #6 | SC-31 khi focus đang trên chính item: `move(…, 'api')` ở kanban đưa focus theo thẻ, calendar/scheduler để rơi về `body` khi khối dựng lại. |
| #7 | Điều kiện bật vùng chạm lớn: `pointer: coarse` (kanban, 40px) hay host < 600px (calendar, scheduler, 44px); nút "+N" 22px của calendar. |
| #8 | SC-43: fallback màu (kể cả `--sd-shadow-*`) ba component làm ba cách. |
| #9 | Vùng live thứ hai của `sd-data-state` có ở cả ba component (không chỉ kanban, A-14). |
| #10 | Key chung "Thử lại" / "Bỏ qua" (hiện mỗi component một cặp key). |
| #11 | Câu đọc cùng nghĩa khác chữ: "Đang lưu" / "Đang chuyển", "Đã huỷ thay đổi" / "Đã huỷ chuyển {title}", "Đã dời" / "Đã chuyển". |

## Scheduler: cần PD chốt
| Mục | Câu hỏi | Hiện trạng |
| --- | --- | --- |
| R1 #7, #8, #9, #10, #13, #15 | Xem `reviews/scheduler-R1-author.md` (đơn vị số đếm nhóm, biến chiều cao hàng/lane, `aria-label` trên lưới hay vùng cuộn…) | Giữ như hiện tại |
| R2 #5 | Dạng tiêu đề khi hẹp: "09/11/2026" (HTML) hay dạng calendar | Tạm: tiêu đề xuống dòng, không mất ngày |
| R2 #7 | Vùng chạm 44px cho ô Tháng 28px | Chưa (mâu thuẫn §11) |
| R2 #10 | Khung nét đứt ở hàng gốc khi đang chờ `onMove` | Không hiện (theo calendar 8.3) |
| R2 #11 | Ô Tuần/Tháng có phần tử `data-date` khi không có template ô? | Không (SC-44) |
| R2 #12 | Tiêu đề Tuần khi `hideWeekends` | Theo khoảng tải (cả tuần) |
| Test #9 | Hiệu năng TESTING §10 | Production trong trang: trung vị 101 ms (ngân sách 250 ms); dev server 300–400 ms. Cách 3–4 của H6 chưa làm |
| Test #10 | Viewport E2E 1920 thay cho 1280 | 1920 + khung cố định, như calendar |
| Test #7 | Preset `graphite`, locale `en` trong E2E | Không có (preset biên dịch; `en` ở Karma) |

## Kanban: cần PD chốt
| Mục | Câu hỏi | Hiện trạng |
| --- | --- | --- |
| A-3 | Cột chưa có trang đầu (thu gọn chưa mở, đang tải, lỗi) có là đích dời không? | Chưa: menu khoá, `Alt` + phím bỏ qua, kéo làm mờ, `move()` false. |
| A-11 | `selectedId` truyền trước khi dữ liệu về | Giữ tới khi dữ liệu có. |
| A-12 | SC-43: màu lõi `--sd-*` có cần fallback? | Không fallback, theo quy ước trên main. |
| A-14 | Vùng live thứ hai của `sd-data-state` | Giữ như main. |
| A-15 | Hiệu năng TESTING §10 | Vượt; đề xuất trong `reports/kanban-tests.md`. |
| A-16 | Kiểm tay trình đọc màn hình, zoom 200% | Chưa làm (máy không có trình đọc màn hình). |

## Mở lại máy
- Worktree scheduler: `.claude/worktrees/scheduler`, nhánh local `feat/scheduler`, push lên `origin/feat/sd-scheduler`. `origin/feat/scheduler` cũ chỉ có commit Bước 0 (`52a79638`, cắt từ `feat/calendar`); phiên tác giả không được ghi đè (force push bị chặn), PD có thể xoá nhánh đó.
- Cổng 4321 của config Playwright repo đang bị app khác chiếm trên máy này; E2E local dùng config tạm cổng khác (không commit), import `showcase/playwright.config.ts` và đổi `baseURL`, `webServer`. Bộ lọc Playwright khớp cả đường dẫn worktree: lọc bằng `components[\\/]scheduler`.
- Sau `npm run sync`, khôi phục các file v22 chỉ đổi CRLF (memory `sync-v22-phantom-eol`).

## Báo cáo và review
Thư mục `.sdcorejs/handoff/schedule-kanban/`:
- Calendar: `reports/calendar-{step0,tests,a11y}.md`, `reviews/calendar-R1*.md`, `calendar-R2-*.md`.
- Kanban: `reports/kanban-{step0,tests,a11y}.md`, `reports/kanban-screens/`, `reviews/kanban-R1*.md`, `kanban-R2-*.md`.
- Scheduler: `reports/scheduler-{step0,tests,a11y}.md`, `reports/scheduler-screens/`, `reviews/scheduler-R1*.md`, `scheduler-R2-{spec,tests,author,recheck-spec,recheck-tests}.md`.
