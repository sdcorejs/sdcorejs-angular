# calendar · R2 · phần B
Nhánh: feat/calendar · Commit: dae378d5a2262b1ad77cb4c48d4b386b73f4cbc3 · Ngày: 2026-11-09
Reviewer: phiên mới, không có lịch sử của phiên tác giả. Phạm vi: REVIEW.md mục 3.3 (test). Phần A (spec, hợp đồng, mã nguồn, tài liệu) do reviewer khác làm.
Môi trường: Windows 11, Node v26.12.0 (local, theo PD chốt; CI Node 24.22.1 là chuẩn), Chrome Headless 156.

> Mọi số liệu dưới đây là của `dae378d5`. Trong lúc review, phiên khác đẩy thêm `b80954ce` (`[CAL-B-05]`, focus khi đóng thanh hỏi phạm vi) và `a0980ba7` (`[CAL-B-06]`, gỡ listener Esc). Hai commit đó chưa được review phần B. Đã đọc diff `b80954ce`: không chạm các guard `signal.aborted` của nhánh tạo hay `calendar.utils.ts`, nên Chặn #1, #2 và Nên sửa #3 vẫn áp dụng. Mã đề xuất cho test mới bên dưới phải dùng số `CAL-B-xx` chưa có (từ 07).

## Kết luận
Chặn: 2 · Nên sửa: 1 · Ghi chú: 6
Chưa được mở PR

Lệnh ở TESTING §1 đều xanh, đủ mã test, coverage đạt ngưỡng. Hai chỗ thử phá không có test đỏ: guard `signal.aborted` của nhánh tạo (`onCreate`) và điều kiện cụm giao nhau ở `sdCalendarStack`. Cả hai được xác nhận bằng probe tạm: xanh trên HEAD, đỏ với đột biến. Kiểm tra theo `TZ` không làm được trên máy này vì Chrome trên Windows bỏ qua biến `TZ`.

## Lệnh đã chạy
Log nằm ở `C:\tmp\r2b-*.log`.

| Lệnh (cwd) | Kết quả thật | Thời gian |
| --- | --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (versions/v19) | exit 0 · `Executed 9291 of 9291 SUCCESS` · `TOTAL: 9291 SUCCESS` · seed 375902 · coverage toàn repo: Statements 88.15% (40634/46093), Branches 79.43% (19119/24068), Functions 87.29%, Lines 90.52%; ngưỡng karma không báo lỗi | 6 phút 10 giây thực (08:35:36 → 08:41:46 +07) |
| `npm run lint` (versions/v19) | exit 0 · `All files pass linting.` | 33 giây |
| `npx ng build sdcorejs-angular` (versions/v19) | exit 0 · 104 entry point `✔ Built`, gồm `@sdcorejs/angular/components/calendar` | 46 giây |
| `npm run test:theme` (root) | exit 0 · 65 test, 65 pass, 0 fail | 77 giây (chạy song song với Karma) |
| `npm run check:scss-hex` (root) | exit 0 · `0 finding(s): 0 hex, 0 focus, in 0 file(s).` | 1 giây |
| `npm run sync` | Không chạy (theo phân công: reviewer không chạy sync) | |
| `npm run check:sync` (root) | exit 0 · `Version workspace sync check passed: v20, v21, v22 match v19.` | 5 giây |
| `npm --prefix showcase run link:library` (root) | exit 0 · `showcase/node_modules/@sdcorejs/angular <- versions/v19/dist/sdcorejs-angular` | |
| `npx playwright test e2e/components/calendar --reporter=line` (showcase, `playwright.config.ts` của repo, webServer tự bật `ng serve` cổng 4321 rồi tắt) | exit 0 · `40 passed` = 20 test × 2 project (`asia-bangkok`, `utc`, Desktop Chrome), 0 skipped (axe có mặt nên test axe chạy thật) | 2 phút 10 giây |

| Lệnh nhanh calendar trên bản sao `C:\tmp\r2b-mutants` (HEAD, không sửa) | `TOTAL: 156 SUCCESS`, seed 503720 | 56 giây |
| Như trên, có thêm probe tạm của reviewer (4 test) | `TOTAL: 160 SUCCESS`, seed 381275; probe in `TZPROBE zone=Asia/Saigon offset=-420` | |
| `TZ=America/New_York` + lệnh nhanh (bản sao, có probe) | `TOTAL: 160 SUCCESS`, seed 68916; probe vẫn in `zone=Asia/Saigon offset=-420` | |
| `TZ=Asia/Kolkata` + lệnh nhanh (bản sao, có probe) | `TOTAL: 160 SUCCESS`, seed 827461; probe vẫn in `zone=Asia/Saigon offset=-420` | |

Ghi chú môi trường:
- Dev server được báo ở `localhost:4210` không chạy lúc review (không có tiến trình nghe cổng 4210; cổng 4300 là app khác, không dùng). Reviewer chạy đúng lệnh TESTING §1 bằng cấu hình Playwright của repo, không dùng `playwright.local-calendar.config.ts`.
- E2E ghi đè ảnh vào `reports/calendar-screens/` (`calendar.e2e.ts:18`). Sau lần chạy, chỉ `week-1280-light.png` khác byte; reviewer đã `git checkout` lại file đó để không để lại thay đổi.
- **Chrome trên Windows không theo `TZ`**: probe cho thấy zone trình duyệt vẫn là zone máy (`Asia/Saigon`) ở cả hai lần đặt `TZ`. Hai lần chạy đó chỉ có giá trị như hai seed ngẫu nhiên khác, không kiểm được zone.

Đối chiếu `reports/calendar-tests.md` (đọc sau khi xong mục đối chiếu mã): số test khớp (9291/9291; nhanh 156/156; E2E 40/40), coverage toàn repo khớp (branches 79.43% so với 79.44% của tác giả ở `676e8380`), utils 100/100 khớp, branches component 88.98% khớp. Lệch duy nhất: Statements component (Ghi chú #7). Tác giả cũng ghi SC-08, SC-25 là bỏ qua có lý do, giống kết luận N/A ở đây.

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chặn | Thử phá 1 · `calendar.md` §9.2 (“`signal` bị huỷ (option đổi, component bị huỷ): bỏ qua kết quả”) · SC-14/SC-15 | `calendar.component.ts:1323` và `:1315` | Bỏ `if (signal.aborted) return;` ở nhánh thành công hoặc nhánh lỗi của `onCreate` thì cả 156 test calendar vẫn xanh. Không test nào cho “option mới / destroy trong lúc `onCreate` chờ, kết quả về muộn”. Khi guard mất: sự kiện tạo muộn bị chèn vào dữ liệu của option mới và được chọn (`selectedId`), hoặc lỗi muộn hiện dải `create-error`. | Thử phá 1c, 1d (bảng dưới). Probe tạm `PROBE-M1c`/`PROBE-M1d` (mục “Probe xác nhận”) xanh trên HEAD, đỏ với 1c/1d | Thêm test hồi quy (mã `CAL-B-xx` mới, hoặc `[CAL-SC-15]` cho nhánh tạo): đang chờ `onCreate` (Deferred) → `setInput('option', {...})` → resolve một sự kiện / reject → không có `[data-event-id]` mới, `selectedId()` null, không `create-error` trong dải và live region. Thêm biến thể destroy. |
| 2 | Chặn | Thử phá 4 · `calendar.md` §8.4 · `CAL-U-10` | `calendar.utils.ts:259` (`if (item.start >= clusterEnd) close();`) | Đổi thành `>` (tương đương `start < end` → `start <= end` cho điều kiện “còn giao với cụm”) thì 156 test xanh. `CAL-U-10` chỉ thử hai khối 09:00–10:00 và 10:00–11:00; với hai khối, cột được tái dùng nên kết quả giống nhau dù cụm sai. Đột biến có thật: sau một cụm 2 cột, khối bắt đầu đúng lúc cụm kết thúc bị gộp vào cụm và hiện nửa bề rộng. | Thử phá 4a. Probe `PROBE-M4a`: `sdCalendarStack([{540,600},{540,570},{600,660}])` → phần tử 3 phải `{ column: 0, columns: 1 }`; xanh trên HEAD, đỏ với 4a | Thêm ca ba khối như trên vào `[CAL-U-10]`. |
| 3 | Nên sửa | Thử phá 1 (nhánh phụ) · SC-15, SC-29/30 | `calendar.component.ts:1207` | Bỏ `if (signal.aborted) return false;` sau thanh hỏi phạm vi: 156 xanh. Khi guard mất, sau khi khoảng xem đổi (abort) component vẫn đọc “Đã huỷ thay đổi” và đặt `#focusTarget` cho khối cũ. Không đổi dữ liệu hay output nên không xếp Chặn. | Thử phá 1e | Trong `[CAL-SC-15] closes the scope question when the range changes` (`calendar.recurring.spec.ts:137`) kiểm thêm live region không phải `cancelled` và focus không bị kéo về khối. |
| 4 | Ghi chú: cần PD chốt | TESTING §11 (“mọi E2E ở Chromium 1280 light vi”) | `showcase/e2e/components/calendar.e2e.ts:110` | Mọi E2E desktop đặt viewport 1920×1000 (có `why:`: ở 1280 trang docs chỉ còn ~650px cho ví dụ nên lịch thành compact). Ảnh vẫn mang tên `week-1280-light`, `day-1280-light`, `week-1280-dark`, `week-1280-rtl` dù chụp ở 1920. | Đọc file | PD chốt 1920 hay yêu cầu chạy ở 1280 với khung ví dụ rộng hơn; nếu giữ 1920 thì đổi tên ảnh. |
| 5 | Ghi chú | TESTING §0.4 | `calendar.e2e.ts:149` | `CAL-E-04` chờ thật `waitForTimeout(2500)`. `delay` của demo (`calendar-demo.data.ts:57`) reject ngay khi abort, nên E2E không bao giờ tạo “kết quả muộn” thật; đường muộn chỉ được unit test (`[CAL-SC-15]`, thử phá 1a đỏ 6 test). | Đọc file | Có thể bỏ chờ 2,5 giây hoặc dùng `page.clock`; không bắt buộc. |
| 6 | Ghi chú | REVIEW 3.3 (không skip) | `calendar.e2e.ts:92` | `test.skip(true, …)` có điều kiện khi thiếu `versions/v19/node_modules/axe-core`. Lần chạy này không skip, nhưng môi trường thiếu v19 `node_modules` sẽ bỏ qua axe im lặng. | Đọc file | Cân nhắc `throw` thay vì skip. |
| 7 | Ghi chú | TESTING §2, §12 | `reports/calendar-tests.md:24` | Báo cáo tác giả ghi Statements `calendar.component.ts` 99.88%; đó là số Lines (858/859). Statements thật 97.46% (1001/1027), vẫn đạt ≥ 90. | So với HTML coverage | Sửa số trong báo cáo. |
| 8 | Ghi chú | TESTING §0.6 | `b9071330`, `71b05142` | Commit sửa `CAL-B-01`/`-02`/`-04` gồm cả test và code, không có commit RED riêng, nên không kiểm được “test hồi quy trước khi sửa”. Test có mặt và xanh. | `git show --stat` | Không cần làm gì cho R2. |
| 9 | Ghi chú: cần PD chốt | REVIEW 3.3 (chạy lại với `TZ=America/New_York`, `TZ=Asia/Kolkata`) | `calendar.component.ts:386`, `:1864` | Không kiểm được trên Windows: Chrome bỏ qua `TZ` (probe in `Asia/Saigon` ở cả hai lần). Việc này có ý nghĩa vì component còn đọc getter local trên Date “carrier” (`this.#now().getHours()`, `carrier.getFullYear()`), nên zone trình duyệt có thể ảnh hưởng. Bù lại: E2E chạy ở zone trình duyệt `Asia/Bangkok`, `UTC`, `America/New_York`, `Asia/Kolkata` (Playwright `timezoneId`) và xanh; unit cố định zone qua `SD_CORE_CONFIGURATION`. Việc getter local có đúng SC-41 hay không thuộc phần A. | Probe `TZPROBE` | Chạy lệnh nhanh calendar trên Linux (CI hoặc WSL có `node_modules` Linux) với hai giá trị `TZ`, hoặc PD chấp nhận E2E `timezoneId` thay cho bước này. |

## Checklist
| Mục REVIEW 3.3 | Kết quả |
| --- | --- |
| Chạy lại lệnh đầy đủ ở TESTING §1 | ✓ Tất cả xanh (bảng “Lệnh đã chạy”); `npm run sync` không chạy theo phân công. |
| Mọi mã §4 và §5 có test, tên test có mã | ✓ Đủ U-01…21, C-01…23, E-01…17, SC bắt buộc; SC-08 N/A (calendar không có `droppable`), SC-25 N/A (chỉ kanban). |
| Không `fit`/`xit`/`fdescribe`/`xdescribe`/`pending()` | ✓ (Ghi chú #6 về skip có điều kiện của axe). |
| Coverage đạt ngưỡng §2 | ✓ utils 100/100; component 97.46/88.98. |
| Thử phá 5 chỗ | ✗ Chặn #1 (chỗ 1, nhánh tạo) và Chặn #2 (chỗ 4, điều kiện cụm). Chỗ 2, 3, 5 có test đỏ. Xem bảng “Thử phá”. |
| Không phụ thuộc thời gian thật, thứ tự, zone máy | Thời gian: ✓ (unit không có `setTimeout`/`Date.now()`/`new Date()`; dùng `fakeAsync` và `now` cố định `2026-11-09 10:40` qua `configureCalendar`). Thứ tự: ✓ xanh ở 6 seed ngẫu nhiên (375902 đầy đủ; 503720, 381275, 68916, 827461 lệnh nhanh; cộng các lần thử phá, nơi test không liên quan vẫn xanh). Zone máy: N/A, chưa kiểm được vì Chrome trên Windows bỏ qua `TZ` (Ghi chú #9). |
| Mỗi bug sửa sau R1 có test `-B-xx` | ✓ G1 → `CAL-B-01`, G5 → `CAL-B-02`, N1 → `CAL-B-03`, chọn chữ → `CAL-B-04`. N8 (SCSS) có `check:scss-hex`; G2 là đổi cách đọc wall clock, không phải bug hành vi. |

### Đối chiếu mã test (grep `\[CAL-` trong `components/calendar/src/*.spec.ts` và `showcase/e2e/components/calendar.e2e.ts`)
Mọi dòng có `[CAL-` đều nằm trong tiêu đề `it(`/`test(`/`describe(` (grep loại trừ trả rỗng). Số trong ngoặc là số dòng tiêu đề có mã; test sinh trong vòng lặp (`sync`/`promise`, 5 tác nhân huỷ) chỉ đếm một dòng.

| Nhóm | Bắt buộc | Có test | Thiếu |
| --- | --- | --- | --- |
| §4 hợp đồng chung (`CAL-SC-xx`) | 01, 02, 03, 06, 07, 08, 09–13, 14, 15, 16, 17, 18, 19–21, 22–24, 25, 26–28, 29–31, 32, 33, 37, 38 | 01(1) 02(1) 03(1) 06(4) 07(2) 09(3) 10(1) 11(1) 12(1) 13(1) 14(3) 15(4) 16(1) 17(3) 18(1) 19(1) 20(1) 21(1) 22(3) 23(2) 24(3) 26(2) 27(1) 28(1) 29(1) 30(1) 31(1) 32(2) 33(1) 37(1) 38(1); thêm 34(1), 35(1) | SC-08: N/A, calendar không có `move.droppable` (`calendar.md` dòng 51–52, 201 chỉ có `movable`). SC-25: N/A, dòng này chỉ cho kanban. |
| §5.1 `CAL-U-01` → `CAL-U-21` | 21 mã | đủ 21 | 0 |
| §5.2 `CAL-C-01` → `CAL-C-23` | 23 mã | đủ 23 | 0 |
| §5.3 `CAL-E-01` → `CAL-E-17` | 17 mã | đủ 17 (20 `test(`) | 0 |
| Hồi quy sau R1 | G1, G5, N1 + lỗi chọn chữ khi quét | `CAL-B-01` (G1), `CAL-B-02` (G5), `CAL-B-03` (N1), `CAL-B-04` (chọn chữ) | 0 |

SC-09 → SC-13 chạy hai biến thể `sync` và `promise` (`calendar.interaction.spec.ts:285` vòng `for (const variant of ['sync', 'promise'])`). SC-15 chạy 5 tác nhân (`a range change`, `reload()`, `a new option`, `readonly`, `disabled`, `calendar.interaction.spec.ts:419`) cộng destroy (`:444`) và thanh hỏi phạm vi (`calendar.recurring.spec.ts:137`).

### `fit` / `xit` / `fdescribe` / `xdescribe` / `pending()`
Grep `\b(fit|xit|fdescribe|xdescribe|ftest)\(|pending\(|\.only\(|\.skip\(|test\.fixme` trên spec calendar và E2E: không có, trừ `calendar.e2e.ts:92` `test.skip(true, …)` có điều kiện khi thiếu `axe-core` (lần chạy này không skip).

### Coverage từng file (lcov.info và HTML của lần chạy đầy đủ 08:41, `versions/v19/coverage/sd-angular`)
| File | Statements (HTML Istanbul) | Branches (lcov BRH/BRF) | Lines (lcov) | Ngưỡng §2 | |
| --- | --- | --- | --- | --- | --- |
| `calendar.utils.ts` | 100% (208/208) | 100% (91/91) | 100% (170/170) | 100 / 100 | ✓ |
| `calendar.component.ts` | 97.46% (1001/1027) | 88.98% (533/599) | 99.88% (858/859) | ≥ 90 / ≥ 85 | ✓ |
| `calendar-move.ts` | 100% (31/31) | 100% (16/16) | 100% | không có dòng riêng ở §2 | |
| `calendar-loader.ts` | 100% (30/30) | 100% (13/13) | 100% | không có dòng riêng ở §2 | |
| `calendar.templates.ts`, `calendar.configuration.ts` | 100% | 0/0 | 100% | không đo | |
| `calendar.testing.ts` (helper test, bị tính vào coverage) | 100% | 91.66% (11/12) | 100% | không đo | |

lcov.info không có số statements; cột Statements lấy từ `coverage/sd-angular/components/calendar/src/index.html` cùng lần chạy.

## Thử phá
Bản sao riêng `git worktree add C:\tmp\r2b-mutants HEAD` (dae378d5), junction `versions\v19\node_modules` → `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular\versions\v19\node_modules` (đích thật của junction trong worktree review). Mỗi biến thể: áp sửa bằng script, chạy `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/calendar/**/*.spec.ts'`, `git checkout` hoàn tác. Lần chạy gốc trên bản sao: `TOTAL: 156 SUCCESS` (56 giây). Log: `C:\tmp\r2b-mut-<id>.log`, tóm tắt `C:\tmp\r2b-mut-summary.log`.

| # | Chỗ sửa | Test đỏ |
| --- | --- | --- |
| 1a | `calendar-move.ts:36` bỏ `if (request.signal.aborted) return { kind: 'aborted' }` (kết quả `onMove` muộn được ghi) | 6 đỏ: `[CAL-SC-15] aborts the request on …` × 5 tác nhân (range change, reload(), new option, readonly, disabled) + `[CAL-SC-15] reports any answer after the abort as aborted` |
| 1b | `calendar-move.ts:33` throw sau abort → `error` thay vì `aborted` | 1 đỏ: `[CAL-SC-15] reports any answer after the abort as aborted` |
| 1c | `calendar.component.ts:1323` bỏ `if (signal.aborted) return;` sau `await create.onCreate` (sự kiện tạo muộn được chèn và chọn) | **0 đỏ** (156 SUCCESS) |
| 1d | `calendar.component.ts:1315` bỏ `if (signal.aborted) return;` trong `catch` của `onCreate` (lỗi muộn hiện `create-error`) | **0 đỏ** (156 SUCCESS) |
| 1e | `calendar.component.ts:1207` bỏ `if (signal.aborted) return false;` sau thanh hỏi phạm vi | **0 đỏ** (156 SUCCESS) |
| 2 | `calendar-move.ts:37` `'cancel'` → `{ kind: 'rejected' }` (coi như `false`) | 3 đỏ: `[CAL-SC-12] cancels 'cancel' (sync)`, `(promise)`, `[CAL-SC-09] classifies true and nothing as accepted, …` |
| 3a | `calendar.component.ts:1247` bỏ đánh giá lại `movable` trong `#commitMove` (ngay trước `onMove`) | 1 đỏ: `[CAL-SC-06] checks movable once more after the scope question` (với sự kiện thường, `#runMove:1190` vẫn đánh giá lại cùng tick nên không có khác biệt) |
| 3b | 3a + `calendar.component.ts:1190` bỏ `sdCalendarAllows(move.movable, …)` (chỉ còn đánh giá lúc render `:1690`) | 3 đỏ: `[CAL-SC-06] checks movable once more after the scope question`, `[CAL-SC-06] checks movable again right before onMove`, `[CAL-SC-17] resolves true only when accepted` |
| 4a | `calendar.utils.ts:259` cụm giao nhau `item.start >= clusterEnd` → `>` (tức `start < end` thành `start <= end`) | **0 đỏ** (156 SUCCESS) |
| 4b | `calendar.utils.ts:260` cột rảnh `end <= item.start` → `end < item.start` | 1 đỏ: `[CAL-U-08] keeps a transitive chain of three in one cluster and reuses a freed column` |
| 4c | `calendar.utils.ts:293` hàng cả ngày rảnh `end < from` → `end <= from` | 4 đỏ: `[CAL-U-13]`, `[CAL-C-01] opens the day view from a day number and from +N…`, `[CAL-C-14] joins an all-day bar…`, `[CAL-B-02]` |
| 5a | `calendar-move.ts:51` bỏ `if (this.#current()) return null;` trong `SdCalendarOperation.begin` | 1 đỏ: `[CAL-SC-14] runs one operation at a time and aborts by kind` (pipeline). Test component không đỏ vì `#runMove:1187`/`#create:1300` còn chặn bằng `busy` |
| 5b | 5a + bỏ `untracked(this.#operation.busy)` ở `#runMove:1187` và `#create:1300` (cho hai thao tác chờ cùng lúc) | 4 đỏ: `[CAL-C-09] … blocks other creates and moves while onCreate waits`, `[CAL-SC-14] ignores a second move by keyboard, drag or move() while one waits`, `[CAL-SC-14] counts the open scope question as the one waiting operation`, `[CAL-SC-14] runs one operation at a time and aborts by kind` |

Sau vòng thử phá: `git -C C:\tmp\r2b-mutants status --short` rỗng (đã hoàn tác).

Tóm tắt theo 5 chỗ của REVIEW 3.3:
| Chỗ REVIEW | Biến thể | Kết luận |
| --- | --- | --- |
| 1. Bỏ kiểm tra `signal.aborted` / `#current()` trước khi ghi kết quả | 1a, 1b (dời) đỏ; **1c, 1d (tạo) không đỏ**; 1e (thanh hỏi) không đỏ | ✗ Chặn #1, Nên sửa #3 |
| 2. Coi `'cancel'` như `false` | 2 | ✓ 3 đỏ |
| 3. Bỏ đánh giá lại `movable` ngay trước `onMove` (calendar không có `droppable`) | 3a, 3b | ✓ 1 và 3 đỏ |
| 4. `<` → `<=` trong kiểm tra giao nhau | **4a (cụm) không đỏ**; 4b (cột), 4c (hàng cả ngày) đỏ | ✗ Chặn #2 |
| 5. Cho phép hai thao tác chờ cùng lúc | 5a, 5b | ✓ 1 và 4 đỏ |

### Probe xác nhận (chỉ trong bản sao, đã xoá)
File tạm `zz-reviewer-probe.spec.ts` (4 test: `PROBE-TZ`, `PROBE-M4a`, `PROBE-M1c`, `PROBE-M1d`) đặt trong `components/calendar/src` của bản sao, chạy bằng lệnh nhanh:
| Mã nguồn | Kết quả |
| --- | --- |
| HEAD (không đột biến) | `TOTAL: 160 SUCCESS` |
| Đột biến 1c | `1 FAILED`: `PROBE-M1c a late onCreate result after a new option is dropped` |
| Đột biến 1d | `1 FAILED`: `PROBE-M1d a late onCreate failure after a new option shows no create-error` |
| Đột biến 4a | `1 FAILED`: `PROBE-M4a an event touching the end of a two-column cluster starts a new full-width cluster` |

Nghĩa là các test còn thiếu viết được bằng helper hiện có (`deferred`, `press`, `configureCalendar`, `createWith`) và bắt đúng đột biến.

### Dọn dẹp
Đã xoá probe, gỡ junction trước (`[System.IO.Directory]::Delete(junction, false)`, không đệ quy), rồi `git worktree remove --force C:\tmp\r2b-mutants`. Kiểm sau đó: `C:\tmp\r2b-mutants` không còn, `git worktree list` không còn bản sao; `versions\v19\node_modules` thật còn 705 thư mục như trước (có `@angular/core/package.json`); junction `versions\v19\node_modules` của worktree review vẫn trỏ đúng đích.
