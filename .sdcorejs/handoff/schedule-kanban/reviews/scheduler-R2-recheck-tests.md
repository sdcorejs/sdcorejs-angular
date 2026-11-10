# scheduler · R2' · phần test (kiểm lại)
Nhánh: feat/scheduler · Commit: 06fc39714 (sửa từ eb32766d2: 62566f854, 9c44e3e8f, a274b1e5c, 06fc39714) · Ngày: 2026-11-11
Reviewer: cùng reviewer R2 phần test ([`scheduler-R2-tests.md`](scheduler-R2-tests.md)), không có lịch sử của phiên tác giả. Phạm vi R2' (REVIEW §2): chỉ các mục của R2 phần test, cộng hồi quy. Đã đọc phản hồi của tác giả [`scheduler-R2-author.md`](scheduler-R2-author.md), mục "Phần test và thử phá" và đoạn thử phá ở đầu file.
Môi trường: bản sao `C:\tmp\r1-scheduler`, `git checkout --detach 06fc39714`, sạch trước và sau. Node v26.12.0, Chrome Headless 156 (Karma), Playwright 1.63 Chromium.

## Kết luận
Chặn: 1 (mới) · Nên sửa: 1 (#8 của R2, chưa xong) · Ghi chú: 4 (mới), cộng 3 mục chờ PD (#7 phần `en` / `graphite`, #9, #10)
Chưa được mở PR

Hai mục Chặn của R2 đã sửa, kèm test thật. Ba đột biến từng sống (3a/3c, M10, M6) giờ đều đỏ. Các đột biến 1, 2, 4, 5 chạy lại vẫn đỏ. Năm mục Nên sửa #3–#7 đã sửa; riêng `en` / `graphite` của #7 chờ PD. #8 chưa có trong báo cáo.

Còn một lỗi **Chặn mới (hồi quy)**: test mới `[SCH-B-03]` phụ thuộc vào kích thước viewport và vị trí của host trong trang Karma. Nó đỏ trong lệnh đầy đủ của TESTING §1 (seed 436427), và đỏ lặp lại được trong lần chạy scheduler + calendar với seed 475754. Ở lệnh nhanh chỉ có scheduler, test này xanh cả 11 lần (2 lần ở HEAD, 9 lần thử phá).

## Lệnh đã chạy
Log nằm ở `C:\Users\Admin\AppData\Local\Temp\claude\88c3a164da9c95e2\f6d0dfb9-dcaa-400a-84a6-5306749b5830\scratchpad\` (`r2b-*.log`, `focus-r2b-*.log`, `e2e-r2b.log`, `build-r2b.log`).

| Lệnh (cwd) | Kết quả thật | Thời gian |
| --- | --- | --- |
| `git checkout --detach 06fc39714` (bản sao) | `git status` rỗng trước và sau | |
| `npx ng build sdcorejs-angular` (versions/v19) | exit 0 | 46 giây |
| `npm --prefix showcase run link:library` | `showcase/node_modules/@sdcorejs/angular <- versions/v19/dist/sdcorejs-angular` | |
| Lệnh nhanh scheduler `--include='projects/sdcorejs-angular/components/scheduler/**/*.spec.ts'`, 2 lần ở HEAD | `TOTAL: 157 SUCCESS` cả hai lần (seed 166314, 701531). R2 có 138 test, nay thêm 19. | ~35 giây mỗi lần |
| Scheduler + calendar `--include=…/scheduler/**` `--include=…/calendar/**` `--code-coverage` | **`TOTAL: 1 FAILED, 348 SUCCESS`** (seed 475754): `[SCH-B-03] … Expected false to be true`. Coverage đọc từ lcov của lần này (phạm vi hai entry point): `scheduler.component.ts` lines 99.34%, **branches 86.99% (508/584)**; `scheduler.utils.ts` 100/100; `calendar-move.ts` 100/100 (121 lines, 58 branches); `calendar.utils.ts` 100/100. | ~1 phút |
| Như trên, `JASMINE_SEED=475754`, không coverage | **`TOTAL: 1 FAILED, 348 SUCCESS`**, cùng `[SCH-B-03]`: đỏ lặp lại được | ~1 phút |
| Như trên, thêm tạm một `console.log` vào `[SCH-B-03]` (đã hoàn tác) | In ra `innerHeight=429`, `hostTop=163` (trên host là `div.jasmine_html-reporter`), khối `client` ở `top=424 … bottom=452`. Điểm thử `y=438` nằm ngoài viewport nên `elementFromPoint` trả `null`. | |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (versions/v19, lệnh đầy đủ TESTING §1) | **exit 1 · `TOTAL: 1 FAILED, 9777 SUCCESS`** · seed 436427 · đỏ: `[SCH-B-03] … the resource cell, not the block: Expected false to be true` (`scheduler.review.spec.ts:269`). Coverage toàn repo: Statements 88.92% (43080/48443), Branches 80.72% (20503/25400), Functions 88.15%, Lines 91.2%; ngưỡng karma không báo lỗi. Từng file (HTML + lcov của lần này): `scheduler.component.ts` statements 96.75% (1042/1077), branches 86.99% (508/584); `scheduler.utils.ts` 84/84, 48/48; `calendar-move.ts` 100/100. | 6 phút 32 giây thực |
| E2E: `npx playwright test --config=playwright.r2-scheduler.config.ts 'components[\\/]scheduler'` (showcase; config tạm, cổng 4381, đã xoá) | exit 0 · 40 test (20 × 2 project `asia-bangkok`, `utc`) · **35 passed, 5 skipped, 0 failed**. 5 skip là 5 test ảnh ở project `utc`, chủ ý (`scheduler.e2e.ts:376`). Các test zone mới chạy ở cả hai project: New York + `?timeZone=Asia/Ho_Chi_Minh` (`:333`), Kolkata (`:345`). | 1,9 phút (2 worker) |
| Như trên, `--workers=1 -g "SCH-E-12"` | 2 passed | 42 giây |

Hiệu năng SCH-E-12 (TESTING §10: render ≤ 250 ms, kéo không có long task > 50 ms). Dev server, máy Windows này:
| Lần | Project | Render 150×31 trung vị | 5 mẫu (ms) | Long task khi kéo |
| --- | --- | --- | --- | --- |
| 2 worker | utc | 358.0 ms | 320, 328, 358, 391, 403 | `[]` |
| 2 worker | asia-bangkok | 342.0 ms | 321, 327, 342, 345, 352 | `[]` |
| 1 worker | asia-bangkok | 288.0 ms | 259, 278, 288, 298, 304 | `[]` |
| 1 worker | utc | 276.0 ms | 274, 274, 276, 296, 365 | `[]` |

Dọn dẹp: E2E ghi lại `move-blocked-row.png` và `vehicles-week.png` trong `reports/scheduler-screens/`; cả hai đã `git checkout`. Config Playwright tạm, `showcase/test-results/` và probe trong `scheduler.review.spec.ts` đã xoá hoặc hoàn tác. Dev server 4381 đã tắt. `git status` của bản sao rỗng.

## Kết quả
### Các mục của R2 phần test
| # R2 | Mức R2 | Kết quả R2' | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Chặn | ✓ | `[SCH-B-40] [SCH-SC-06]` ×2 (`movable`, `droppable`; `scheduler.review.spec.ts:26–47`): sự kiện lặp, `Alt` + `↓`, đổi cờ khi thanh hỏi đang mở, rồi bấm "Chỉ lần này" → không gọi `onMove`. Thử phá 3a (`calendar-move.ts:136`) và 3c (`scheduler.component.ts:1665`) đều đỏ đúng 2 test này. |
| 2 | Chặn | ✓ | `[SCH-B-41] [SCH-SC-17]` (`scheduler.review.spec.ts:49–86`): `move()` và `Alt` + `→` khi `readonly`, `disabled`, đang tải lại, sau lỗi tải → bốn lần `false`, không gọi `onMove`. Thử phá M10 (`scheduler.component.ts:1635`) đỏ test này. |
| 3 | Nên sửa | ✓ | `[SCH-B-42] [SCH-C-07]` (`:88–122`): kéo trên hàng `hue`, 10:00 `ok`, 11:00 `blocked`, quay lại 10:00 `ok`; lần ghé lại 11:00 không gọi `droppable` thêm. M6 (khoá chỉ theo tài nguyên, `:1409`) đỏ. M6b (bỏ hẳn bộ nhớ, `:1412`) cũng đỏ. |
| 4 | Nên sửa | ✓ | `[SCH-B-43] [SCH-SC-32]` (`:124–136`): `FakeResizeObserver.install(null)`, host 390px → không lỗi, không `data-compact`, đủ 5 hàng. |
| 5 | Nên sửa | ✓ | `[SCH-B-44] [SCH-SC-01]` ×2 (id rỗng, title rỗng; `:138–151`); `[SCH-B-45] [SCH-SC-26]` chạm để chọn (`:153–163`); `[SCH-B-46] [SCH-SC-29]` focus sau lỗi và sau Huỷ thanh hỏi (`:165–197`). Xem Ghi chú #5 về cách viết. |
| 6 | Nên sửa | ✓ | Đã thêm mã: `[SCH-B-30]` (`scheduler-pipeline.spec.ts:718`), `[SCH-B-31]` (`:746`), `[SCH-B-32]` (`scheduler.component.spec.ts:462`), `[SCH-B-33]` (`scheduler.compact.spec.ts:166`). Ở R2 đã chứng minh 4 test này đỏ trên code trước bản sửa. |
| 7 | Nên sửa | ✓ (zone) · PD (`en`, `graphite`) | Zone: `America/New_York` + `?timeZone=Asia/Ho_Chi_Minh` (`scheduler.e2e.ts:330–340`) kiểm có vạch giờ hiện tại, tức "hôm nay" tính theo giờ Việt Nam (theo giờ New York lúc đó vẫn là 08/11); `Asia/Kolkata` không cấu hình (`:342–349`). Cả hai xanh. Tác giả nêu `graphite` là tham số biên dịch SCSS, còn `en` đã kiểm ở Karma: đây là lệch ma trận §11, PD chốt. |
| 8 | Nên sửa | ✗ | Phản hồi tác giả ghi đã thêm mục Hiệu năng vào `reports/scheduler-tests.md`. File đó (không track, trong worktree `scheduler`) sửa lần cuối lúc 01:10 ngày 11/11, trước R2. Không có mục "Hiệu năng" và vẫn là số của `eb32766d2` (dòng 2, 7–8: 9753 test, 138 test nhanh). Dòng 131 vẫn ghi "số đo ở dưới". |
| 9 | Ghi chú: cần PD chốt | PD | Vẫn vượt ngân sách: trung vị 276–358 ms (bảng trên). Kéo không có long task. Tác giả để PD chốt. |
| 10 | Ghi chú: cần PD chốt | PD | Không đổi: viewport 1920 (`scheduler.e2e.ts:128`). |
| 11 | Ghi chú | ✓ | Không cần sửa. Thử phá 1 và 5 chạy lại cho kết quả như R2 (bảng Thử phá). |
| 12 | Ghi chú | ✓ | Branches component 86.99% (508/584), khớp số của tác giả. Phần tự cuộn khi kéo và RTL `#revealToday` vẫn chưa có test (không bắt buộc). |
| 13 | Ghi chú | ✓ | Không đổi, không bắt buộc. |
| 14 | Ghi chú | ✓ một phần | Đã thêm `spyOn(console, 'warn')` cho test đổi `resources` của SCH-C-02. Log lệnh đầy đủ còn 6 dòng `has a resourceId that is not in resources`. Không ảnh hưởng kết quả. |

### Mục mới (hồi quy)
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chặn | REVIEW §5 ("test chập chờn", "lệnh kiểm tra đỏ") · TESTING §0.5, §1 · `[SCH-B-03]` | `scheduler.review.spec.ts:257–271`; `scheduler.testing.ts:128–137` | `[SCH-B-03]` dùng `document.elementFromPoint` tại tâm khối `client`. Hàm đó chỉ thấy phần đang hiện trong viewport. `renderScheduler` để host trong luồng (`display: block`, cao 640px) dưới `div.jasmine_html-reporter` của Karma, mà reporter cao dần theo số spec đã chạy. Viewport của Chrome Headless trong Karma chỉ cao 429px. Khi reporter đẩy host xuống (đo được `hostTop=163`, tâm khối `y=438`), điểm thử nằm dưới đáy viewport, `elementFromPoint` trả `null` và test đỏ, dù code đúng. Kết quả theo thứ tự chạy: đỏ trong lệnh đầy đủ (seed 436427) và trong scheduler + calendar (seed 475754, lặp lại được); xanh trong mọi lần chạy chỉ có scheduler. Kanban đã gặp đúng lỗi này và có cách tránh ở `kanban.interaction.spec.ts:71–75`. | `JASMINE_SEED=475754 npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='projects/sdcorejs-angular/components/scheduler/**/*.spec.ts' --include='projects/sdcorejs-angular/components/calendar/**/*.spec.ts'` | Ghim host như kanban (`position: fixed; top: 0; left: 0`) trong test này hoặc trong `renderScheduler`, hoặc cuộn khối vào viewport trước khi gọi `elementFromPoint`. Sau đó chạy lại lệnh đầy đủ và lần scheduler + calendar với seed 475754. |
| 2 | Ghi chú | TESTING §0.3 (truy vấn bằng role / `data-*`) | `scheduler.review.spec.ts:147` | `[SCH-B-44]` truy vấn class nội bộ `.sd-scheduler__invalid`. Các test SC-01 khác dùng `sd-data-state` (`scheduler.component.spec.ts:333`). | Đọc spec | Dùng `sd-data-state` cho thống nhất. |
| 3 | Ghi chú | SC-26 (chạm) | `scheduler.review.spec.ts:153–163` | `[SCH-B-45]` phát một `touchstart` không có `touches`, rồi `click()`. Test chứng minh lần bấm sau một lần chạm vẫn chọn được, nhưng không đi qua chuỗi `touchstart` → `touchend` có toạ độ như helper `touch()` (`schedule-testing.ts:311`). | Đọc spec | Có thể dùng `touch(element, 'touchstart'/'touchend', centerOf(element))` rồi `click`. Không bắt buộc. |
| 4 | Ghi chú | TESTING §11 (zone) | `scheduler.e2e.ts:345–349` | Test Kolkata chỉ kiểm `data-start`, mà thuộc tính này lặp lại nguyên giá trị model (không có zone), nên vẫn xanh kể cả khi vị trí khối sai. Test New York thì có ý nghĩa (`data-now` phụ thuộc "hôm nay" theo zone cấu hình). | Đọc spec | Kiểm thêm vị trí khối (`left` của `budget` ≈ 10 × 80px) hoặc nhãn giờ. |
| 5 | Ghi chú | TESTING §10 (cách đo) | `scheduler.e2e.ts:34`, `:264–296` | Từ khi E2E ghim đồng hồ bằng `page.clock.setFixedTime`, mẫu đo hiệu năng là số nguyên ms (trước đó có phần lẻ). Đồng hồ giả của Playwright có vẻ cũng thay `performance.now()`. Số đo vẫn tăng theo thời gian thật và cùng cỡ với R2, nhưng nên ghi cách đo vào báo cáo. | So `e2e.log` của R2 với `e2e-r2b.log` | Ghi trong mục Hiệu năng (#8). |

## Checklist (R2', các dòng §3.3)
| Mục | Kết quả |
| --- | --- |
| Chạy lại lệnh | ✗ Lệnh đầy đủ của TESTING §1 đỏ 1 test (`[SCH-B-03]`, mục mới #1). Lệnh nhanh scheduler xanh 157/157; E2E 35 passed / 5 skipped / 0 failed. |
| Mã có test, tên có mã | ✓ Thêm `SCH-B-01…07, 16, 23, 30…33, 40…46`. Không thấy test cũ nào bị xoá: R2 có 138 test nhanh, nay 157. |
| Không `fit`/`xit`/`fdescribe`/`xdescribe`/`pending()` | ✓ (grep lại `components/scheduler/**`, `calendar/**`, `scheduler.e2e.ts`; chỉ có hai `test.skip` có điều kiện như R2). |
| Coverage | ✓ Theo lần chạy đầy đủ seed 436427: `scheduler.utils.ts` 100/100 (84/84, 48/48); `scheduler.component.ts` statements 96.75%, branches 86.99%; `calendar-move.ts` 100/100. |
| Thử phá | ✓ Mọi chỗ có test đỏ, kể cả 3a, 3c, M10, M6 (bảng dưới). |
| Không phụ thuộc thời gian, thứ tự, zone | ✗ `[SCH-B-03]` phụ thuộc thứ tự chạy và viewport (mục mới #1). Thời gian và zone: như R2; E2E giờ ghim đồng hồ và có thêm zone New York, Kolkata. |
| Mỗi bug đã sửa sau R1 có `-B-xx` | ✓ (#6) |

## Thử phá
Mỗi dòng: sửa tạm trên bản sao ở `06fc39714`, chạy lệnh nhanh scheduler (157 test), rồi `git checkout --` file đó và kiểm `git status` rỗng.

| # | Chỗ sửa | Test đỏ |
| --- | --- | --- |
| 3a | `calendar-move.ts:136` bỏ `if (!plan.allowed())` | 2 đỏ (seed 54122): `[SCH-B-40] [SCH-SC-06] evaluates movable …`, `… evaluates droppable …` (R2: không có) |
| 3c | `scheduler.component.ts:1665` `allowed: () => true` | 2 đỏ (seed 490772): như 3a (R2: không có) |
| M10 | `scheduler.component.ts:1635` bỏ `untracked(this.locked) ||` | 1 đỏ (seed 289265): `[SCH-B-41] [SCH-SC-17] refuses move() and Alt + arrows while readonly, disabled, loading or after a load error` (R2: không có) |
| M6 | `scheduler.component.ts:1409` khoá nhớ = `${resourceId}` | 1 đỏ (seed 172378): `[SCH-B-42] [SCH-C-07] remembers droppable per resource and slot…` (R2: không có) |
| M6b | `scheduler.component.ts:1412` luôn gọi lại `droppable` (bỏ bộ nhớ) | 1 đỏ (seed 210622): `[SCH-B-42]` |
| 1 | `calendar-move.ts:36` bỏ `if (request.signal.aborted) return { kind: 'aborted' };` | 6 đỏ (seed 316922): `[SCH-SC-15]` range, resources, option, reload, readonly, disabled (như R2) |
| 2 | `calendar-move.ts:37` `'cancel'` → `{ kind: 'rejected' }` | 2 đỏ (seed 850812): `[SCH-SC-12]` ×2 (như R2) |
| 4 | `scheduler.utils.ts:109` `end <= item.start` → `end < item.start` | 3 đỏ (seed 396805): `[SCH-U-02]`, `[SCH-U-04]`, `[SCH-U-05]` (như R2) |
| 5 | `calendar-move.ts:51` bỏ `if (this.#current()) return null;`, cộng bỏ `|| untracked(this.#operation.busy)` ở `scheduler.component.ts:1635` | 2 đỏ (seed 800300): `[SCH-SC-14]` ×2 (như R2) |

## R2'' xác nhận
Commit: 59a4c674c (thêm `cb3060092` có `[SCH-B-47]`, `[SCH-B-48]`; `5f97e4d74` sửa `[SCH-B-03]`; `0b9288e35` sync) · Ngày: 2026-11-11 · Bản sao `C:\tmp\r1-scheduler` (`git checkout --detach 59a4c674c`), sạch trước và sau. Không sửa code, không commit.

### Kết luận
Chặn: 0 · Nên sửa: 0 · Ghi chú: 4 (Ghi chú mới #2–#5 ở trên, không đổi), cộng 3 mục chờ PD (#7 phần `en` / `graphite`, #9, #10)
Được mở PR (phần test; các mục chờ PD do PD chốt khi review PR)

### Lệnh đã chạy
| Lệnh (versions/v19) | Kết quả thật | Thời gian |
| --- | --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (lệnh đầy đủ TESTING §1) | exit 0 · **`TOTAL: 9780 SUCCESS`** · seed 343329 · Statements 88.93% (43082/48443), Branches 80.7% (20500/25400), Functions 88.16%, Lines 91.2%. Từng file: `scheduler.component.ts` lines 99.34%, branches 86.99% (508/584); `scheduler.utils.ts` 100/100. | 6 phút 27 giây |
| Scheduler + calendar, `JASMINE_SEED=475754` (seed từng đỏ `[SCH-B-03]`) | exit 0 · **`TOTAL: 351 SUCCESS`** | ~1 phút |
| Lệnh nhanh scheduler | exit 0 · `TOTAL: 159 SUCCESS` (seed 849909): 157 test của R2' cộng `[SCH-B-47]`, `[SCH-B-48]` | ~35 giây |

### Các mục
| Mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| Chặn mới #1 (`[SCH-B-03]` phụ thuộc viewport) | ✓ | `5f97e4d74` ghim host `position: fixed; top: 0; left: 0` trong test (`scheduler.review.spec.ts:261–263`), giống `kanban.interaction.spec.ts:71–75`. Xanh trong lệnh đầy đủ và trong lần scheduler + calendar seed 475754. |
| Nên sửa #8 (báo cáo thiếu Hiệu năng) | ✓ | `reports/scheduler-tests.md` (giờ đã track ở 59a4c674c) có mục "Hiệu năng (TESTING §10)" (dòng 182–192) và số sau R2'. Đối chiếu với số đo của reviewer: dev server, E2E 2 worker "300–405 ms" khớp cỡ số reviewer đo (283–365 ms ở R2 và R2'); không có long task khi kéo, khớp. Coverage (`1042/1077`, `508/584`), số test E2E (35 passed / 5 skipped), bảng thử phá (2 `[SCH-B-40]`, `[SCH-B-41]`, `[SCH-B-42]`, …) và câu về zone (138/138 ở `eb32766d2`) đều khớp báo cáo của reviewer. Hai số production build (đo trong trang: trung vị 101 ms; E2E: 256–280 ms) reviewer **không đo lại**, ghi nhận theo tác giả. |
| `[SCH-B-47]`, `[SCH-B-48]` (mới) | ✓ | Có trong lần chạy (159 = 157 + 2), xanh trong cả ba lệnh trên. |
| #7 (`en`, `graphite`), #9, #10 | PD | Không đổi so với R2'. Hiệu năng render ở dev server vẫn vượt 250 ms; production theo tác giả đạt. |

Bản sao làm việc: HEAD `59a4c674c`, `git status` rỗng.
