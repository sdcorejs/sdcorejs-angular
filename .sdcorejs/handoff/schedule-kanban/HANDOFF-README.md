# Gói handoff: sd-calendar, sd-scheduler, sd-kanban · 08/11/2026

Ba việc cho `sdcorejs/sdcorejs-angular` (versions/v19), dùng chung một hợp đồng API, một kế hoạch test và một quy trình review độc lập.

| Thư mục | Nội dung |
| --- | --- |
| `schedule-kanban/` | **Bắt đầu ở đây.** `PROMPT.md` (prompt tổng cho Claude Code), `SHARED-CONTRACT.md` (hợp đồng chung SC-01…SC-45), `TESTING.md` (mã test, E2E, ngưỡng, ma trận, báo cáo), `REVIEW.md` (cổng R0–RX, checklist, prompt reviewer). |
| `design-calendar/` | `sd-calendar` đợt 1: `calendar.md` (nguồn chính), `ADDENDUM-2026-11-08.md` (phụ lục 08/11, có `'cancel'` và `sdLoadError`), `SD Calendar Design.dc.html`, `Schedule Components Proposal.dc.html` (demo bấm thử ở mục 04), `PROMPT.md`, `README.md`. |
| `design-scheduler/` | `sd-scheduler`: `scheduler.md`, `SD Scheduler Design.dc.html`, `PROMPT.md`, `README.md`. Cần calendar đã merge. |
| `design-kanban/` | `sd-kanban` API mới (breaking): `kanban.md`, `Kanban Review.dc.html`, `Core Patterns Proposal.dc.html` (bối cảnh P1 board), `PROMPT.md`, `README.md`. |

Mỗi thư mục `design-*` có `support.js` riêng; mở file `.dc.html` trực tiếp bằng trình duyệt.

## Đã chốt
- Calendar: theo `calendar.md` 22/10 và phụ lục 08/11.
- Scheduler: D1–D11 ở mục 09 của HTML.
- Kanban: C1–C9 ở mục 08 của HTML.
- Chung: `onMove` trả `true | void | false | 'cancel' | throw`; `sdLoadError`; một thao tác chờ; chọn bằng `selectedId` + `sdSelect`; compact theo bề rộng host.

## Thứ tự
1. `feat/calendar` · 2. `feat/kanban-api` (độc lập) · 3. `feat/scheduler` (sau khi calendar merge).
