Repo `sdcorejs/sdcorejs-angular`, nhánh main. Đọc `CLAUDE.md` của repo trước và làm đúng quy tắc trong đó: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`; không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.

Gói này gồm 3 việc, mỗi việc một PR:
1. `sd-calendar` (component mới): `design-calendar/`
2. `sd-kanban` (đổi API, breaking): `design-kanban/`
3. `sd-scheduler` (component mới, cần calendar đã merge): `design-scheduler/`

## Giải nén
Chép 4 thư mục trong zip vào `.sdcorejs/handoff/`, để có:
```
.sdcorejs/handoff/schedule-kanban/   PROMPT.md (file này), SHARED-CONTRACT.md, TESTING.md, REVIEW.md
.sdcorejs/handoff/design-calendar/   README, PROMPT, calendar.md, ADDENDUM-2026-11-08.md, 2 HTML, support.js
.sdcorejs/handoff/design-kanban/     README, PROMPT, kanban.md, 2 HTML, support.js
.sdcorejs/handoff/design-scheduler/  README, PROMPT, scheduler.md, HTML, support.js
```
Tạo thêm `.sdcorejs/handoff/schedule-kanban/reports/` và `reviews/` khi cần. Không commit thư mục `.sdcorejs/handoff/` vào thư viện nếu `CLAUDE.md` hoặc `.gitignore` không cho.

## Đọc theo thứ tự
1. `schedule-kanban/SHARED-CONTRACT.md`: hợp đồng chung của cả ba.
2. `schedule-kanban/TESTING.md`: test bắt buộc, mã test, ngưỡng, E2E, ma trận.
3. `schedule-kanban/REVIEW.md`: các cổng review độc lập.
4. `PROMPT.md` và spec của PR đang làm.

Thứ tự ưu tiên khi hai nguồn khác nhau: `SHARED-CONTRACT.md` > phụ lục (`ADDENDUM-*.md`) > spec `.md` > `README.md` > HTML. File này ưu tiên hơn `PROMPT.md` riêng về: nhánh, commit, push, review, test, báo cáo. Mâu thuẫn còn lại: dừng và hỏi, không tự quyết.

## Thứ tự làm và nhánh
| PR | Nhánh | Từ | Ghi chú |
| --- | --- | --- | --- |
| 1 | `feat/calendar` | main | |
| 2 | `feat/kanban-api` | main | Độc lập với PR 1. Làm sau PR 1 trong cùng phiên, hoặc song song trong worktree riêng. |
| 3 | `feat/scheduler` | main sau khi PR 1 merge | Nếu PR 1 chưa merge: chỉ làm Bước 0 rồi dừng. |

## Cổng của mỗi PR
| Cổng | Việc | Dừng chờ? |
| --- | --- | --- |
| G0 | Bước 0 của `PROMPT.md` riêng, cộng: danh sách mã test sẽ viết ở từng checkpoint (theo `TESTING.md`), helper test dùng chung đặt ở đâu, có `@axe-core/playwright` hay không, cấu hình Playwright có những project trình duyệt nào. | Có (R0, mình duyệt). |
| G1 | Commit test RED của checkpoint 1 (tên test có mã). Chạy, báo test đỏ đúng lý do. | Không. |
| G2…G6 | Từng checkpoint của spec. Mỗi checkpoint: test RED → code → lệnh nhanh (`TESTING.md` §1) xanh → một commit. | Không, trừ R1. |
| R1 | Sau checkpoint có API và render (checkpoint 2): gọi review độc lập R1 theo `REVIEW.md`. Sửa mục Chặn trước khi làm tiếp. | Có (chờ kết quả R1). |
| G-final | Lệnh đầy đủ (`TESTING.md` §1), E2E trên ma trận bắt buộc (§11), a11y tay (§8), ảnh chụp (§9), hiệu năng (§10), báo cáo `reports/<name>-tests.md` (§12). | Không. |
| R2 | Gọi review độc lập R2. Sửa mọi mục Chặn; mục Nên sửa thì sửa hoặc ghi lý do. Mỗi sửa có test hồi quy `-B-xx`. Gọi R2' kiểm lại. | Có. |
| PR | Push nhánh, mở PR **draft** theo mẫu ở cuối file. Không merge. | Có (mình review PR). |

Sau khi cả ba PR qua R2': gọi review chéo RX (`REVIEW.md` mục 4), sửa nếu có, rồi báo mình.

Cách gọi review độc lập: mở một phiên Claude Code mới (subagent không chia sẻ ngữ cảnh, hoặc phiên riêng), dán prompt ở `REVIEW.md` mục 6. Phiên tác giả không viết hộ báo cáo review, không gợi ý cho reviewer.

## Commit và push
- Commit theo checkpoint, Conventional Commits: `feat(calendar): …`, `test(calendar): …`, `fix(calendar): … [CAL-B-01]`. Kanban dùng `feat(kanban)!:` cho commit đổi API.
- Được push nhánh và mở PR draft sau khi qua R2'. Không merge, không tag, không publish, không bump version.
- Câu “Không commit…” trong `design-calendar/PROMPT.md` được thay bằng mục này.

## Báo cáo sau mỗi cổng (ngắn)
- Đã làm gì, commit nào.
- Mã test đã thêm, đỏ hay xanh.
- Kết quả lệnh (số test, thời gian, coverage nếu có).
- Lệch spec và lý do.
- Câu hỏi cần mình trả lời (nếu có).

## Không làm
- Không đổi API của component khác ngoài phạm vi ba spec. Thấy cần thì ghi ở Bước 0.
- Không thêm dependency, kể cả dev dependency cho test, khi chưa được duyệt.
- Không hạ ngưỡng test hay tắt rule lint.
- Không dùng `components/kanban/**` cũ làm mẫu cho calendar và scheduler.

## Mẫu mô tả PR
```
## Tóm tắt
<1–3 câu>

## API
<bảng public API; kanban thêm bảng chuyển đổi>

## Đối chiếu hợp đồng chung
<SC-01…SC-45: ✓ hoặc lý do N/A>

## Test
<link reports/<name>-tests.md; số test; coverage; E2E; hiệu năng>

## Review độc lập
<link reviews/<name>-R1.md, -R2.md, -R2-recheck.md; số mục đã sửa>

## Ảnh
<ảnh chụp theo TESTING.md §9, so với HTML>

## Lệch thiết kế có chủ đích
<danh sách và lý do>

## Bước 0 đã duyệt
<câu trả lời>
```
