# kanban · R2 · phần B
Nhánh: feat/kanban-api · Commit: 56611d76 · Ngày: 2026-11-10
Reviewer: phiên mới, không có lịch sử của phiên tác giả. Phần B = REVIEW.md mục 3.3 và phần rò rỉ của 3.4.
Phần A (3.1, 3.2, 3.4, 3.5, 3.6) do reviewer khác làm song song (`kanban-R2-spec.md`).

## Kết luận
Chặn: 1 · Nên sửa: 4 · Ghi chú: 7
Chưa được mở PR (còn 1 Chặn).

- Mọi lệnh ở TESTING §1 (trừ `npm run sync`) xanh: Karma đầy đủ 9226/9226, lint, build, test:theme, check:scss-hex, check:sync, E2E 25 pass / 1 skip có chủ đích.
- Coverage đạt ngưỡng TESTING §2 (`kanban.utils.ts` 100/100, `kanban.component.ts` 97,07/91,22).
- Đủ mã TESTING §4 và §7, không có `fit`/`xit`/`fdescribe`/`xdescribe`/`pending()`.
- Thử phá: cả 5 chỗ bắt buộc có test đỏ. Một số đột biến phụ sống sót (dọn khi destroy, nhánh `dataSource`), ghi thành Nên sửa.
- Chặn duy nhất (#1) tìm qua coverage: context của `sdKanbanColumnTemplate` sai kiểu dữ liệu so với `kanban.md` §3 và `sd-kanban.md`, không có test. Trùng phạm vi 3.1 của phần A; ghi ở đây vì phát hiện bằng coverage và đã tái hiện bằng test tạm.

## Lệnh đã chạy
Node v26.12.0 local (K1), Chrome Headless 156, Windows 11. Log ở `C:\tmp\r2k-*.log`.
- `cd versions/v19 && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` (`r2k-karma-full.log`) → `TOTAL: 9226 SUCCESS`, exit 0. Jasmine seed `485410`. Karma báo 4 phút 47 giây (3 phút 33 giây chạy test); cả lệnh 334 giây. Coverage toàn repo: statements 88% (39711/45125), branches 79,28%, functions 87,1%, lines 90,37%.
- `npm run lint` (v19, `r2k-lint.log`) → `All files pass linting.`, exit 0, 40 giây.
- `npx ng build sdcorejs-angular` (v19, `r2k-build.log`) → `Built Angular Package`, exit 0, 0 warning, 44 giây.
- `npm run test:theme` (root, `r2k-test-theme.log`) → 65 pass, 0 fail, exit 0, 78 giây.
- `npm run check:scss-hex` (root, `r2k-check-scss-hex.log`) → `0 finding(s)`, exit 0.
- `npm run check:sync` (root, `r2k-check-sync.log`) → `v20, v21, v22 match v19`, exit 0, 3 giây.
- `npm run sync`: không chạy (ngoài phạm vi phần B).
- `npm --prefix showcase run link:library` (`r2k-link.log`) → exit 0.
- E2E: cổng 4321 bị app khác chiếm, nên dùng config tạm `showcase/playwright.r2k.config.ts` (kế thừa config repo, cổng 4351, `reuseExistingServer: false`, đã xoá sau khi chạy). `cd showcase && npx playwright test e2e/components/kanban.e2e.ts --config=playwright.r2k.config.ts --reporter=line` (`r2k-e2e.log`) → **25 passed, 1 skipped** (test chụp ảnh ở project `utc`, chủ đích), 1,8 phút, cả lệnh 110 giây, exit 0. Hai project `asia-bangkok`, `utc`, Desktop Chrome, dev server (`ng serve`). Mỗi lần mở trang có 2 dòng `CONSOLEERROR … 404 (Not Found)` (50 dòng cả lượt), không có `PAGEERROR`.
  - Hiệu năng (TESTING §10, test chỉ ghi số): render 800 thẻ trung vị **1229,6 ms** (utc) và **1281,7 ms** (bangkok), ngân sách 150 ms; long task khi kéo `[64,51,125,61,103,55,73]` và `[59,122,92,56,70]` ms, ngân sách 50 ms. Đo trên dev server. Xem kết quả #7.
  - Sau khi chạy: E2E ghi đè 3 ảnh (`orders-column-error.png`, `orders-dragging.png`, `orders-light.png`); đã `git checkout -- .sdcorejs/handoff/schedule-kanban/reports/kanban-screens`.
- Lệnh nhanh với zone (bước 4), trong worktree, đặt `TZ` bằng PowerShell `$env:TZ`:
  - `TZ=America/New_York` (`r2k-tz-America-New_York.log`) → 143 SUCCESS, seed 907084, 21 giây.
  - `TZ=Asia/Kolkata` (`r2k-tz-Asia-Kolkata.log`) → 143 SUCCESS, seed 329969, 21 giây.
  - Quan sát: Chrome trên Windows bỏ qua `TZ`. Test tạm trong bản sao in `Intl.DateTimeFormat().resolvedOptions().timeZone`: cả ba lần (mặc định, New_York, Kolkata) đều `Asia/Saigon`, offset −420 (`r2k-tz-default.log`, `r2k-tz-newyork-copy.log`, `r2k-tz-kolkata-copy.log`). Biến `TZ` có tới tiến trình con (kiểm bằng `spawnSync` với `env.TZ`: Node con thấy `America/New_York`, offset 300), nhưng Chrome không dùng. Thêm: Git Bash không chuyển `TZ=… node` cho chương trình Windows (`process.env.TZ` là `undefined`), nên chạy lệnh có `TZ` trong Git Bash là vô nghĩa. Kanban không dùng ngày giờ (không có `Date`, `Date.now`, `performance.now` trong src và spec; timer duy nhất là debounce `keyword`, test bằng `fakeAsync`/`tick`), nên không phụ thuộc zone. Zone của trình duyệt được phủ ở E2E bằng `timezoneId` (Bangkok, UTC).
  - Thứ tự chạy: 38 lần chạy lệnh nhanh (BASE, 32 đột biến, 3 lần probe zone, 2 lần zone ở worktree), mỗi lần một seed ngẫu nhiên. Không có test đỏ ngoài các test mà đột biến nhắm tới. Không thấy chập chờn.

### Coverage kanban (đọc ngay sau lần chạy đầy đủ; bản lưu `C:\tmp\r2k-lcov.info`, `C:\tmp\r2k-cov-kanban\`)
| File | Statements | Branches | Lines | Functions | Ngưỡng TESTING §2 |
| --- | --- | --- | --- | --- | --- |
| `kanban.utils.ts` | 100% (82/82) | 100% (55/55) | 100% (51/51) | 100% (20/20) | 100/100 ✓ |
| `kanban.component.ts` | 97,07% (431/444) | 91,22% (239/262) | 99,44% (359/361) | 98,86% (87/88) | ≥90/≥85 ✓ |
| `kanban-loader.ts` | 99% (100/101) | 92,3% (60/65) | 100% (81/81) | 100% (13/13) | không có ngưỡng riêng |
| `kanban.templates.ts` | 62,5% (10/16) | – | 57,14% (8/14) | 0% | không đo |

Nhánh chưa chạy đáng chú ý (lcov `BRDA … 0`, `FNDA:0`):
- `kanban.component.ts:588-597` `columnContext()` không được gọi lần nào. Không spec nào dùng `sdKanbanColumnTemplate`/`sdKanbanColumnActionsTemplate`. Kết quả #1.
- `kanban.component.ts:112` nhánh cờ `boolean` của `allows()` (SC-05). Kết quả #4.
- `kanban.component.ts:388-389` `move()` khi cột nguồn/đích đang tải trang đầu hoặc chưa tải. Kết quả #5.
- `kanban-loader.ts:107` dời trong cùng một cột ở chế độ `dataSource`. Kết quả #3.
- Nhỏ: `:522` Esc khi chưa chọn, `:585` thu gọn khi `disabled`/`collapsible` false, `:618` Bỏ qua của dải lỗi board, `:672-700` nhánh phụ của `IntersectionObserver`, `kanban-loader.ts:69` Thử lại khi không lỗi.

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chặn | kanban.md §3 `SdKanbanColumnTemplateContext` (`total` "null khi chưa biết (đang tải lần đầu, lỗi)"), §3 `SdKanbanColumn.summary` / §5.2 (`LoadResult.summary` ghi đè); sd-kanban.md:182 | kanban.component.ts:592 (`total: view.count`), :594 (`summary: view.column.summary ?? null`), :247 (`count: state.total ?? all.length`) | Context của `sdKanbanColumnTemplate` và `sdKanbanColumnActionsTemplate`: (a) `total` không bao giờ `null`; đang tải lần đầu hoặc lỗi thì là `0`. (b) `summary` lấy `column.summary`, bỏ qua `summary` của trang đầu, trong khi header mặc định hiện đúng `summary` của server. Consumer dùng template cột ở chế độ `dataSource` thấy "0" và tổng tiền cũ. `columnContext()` không có test (FNDA 0). Trùng phạm vi 3.1 (phần A). | Test tạm trong bản sao: host có `sdKanbanColumnTemplate`, `dataSource` chờ `Deferred`. Lúc đang tải: `total=0` (mong `null`). Sau khi trả `{ total: 9, summary: 'page summary' }`: `summary='column summary'`, header `[data-summary]` = `page summary`. Test đỏ. | `columnContext` dùng `view.summary`; thêm `total: number \| null` vào `ColumnView` (`null` khi `dataSource` chưa có trang đầu hoặc lỗi trang đầu). Test **KAN-B-08**: template cột ở hai chế độ, kiểm `total`, `visibleCount`, `summary`, `collapsed` trước và sau khi tải, khi lỗi. |
| 2 | Nên sửa | REVIEW 3.4 (rò rỉ: "kiểm tra bằng đọc code và một test destroy"); SC-15, SC-22 | kanban.component.ts:333-341; test destroy hiện có: compact.spec:68 (RO), component.spec:718-738 (focusin khi đang chờ), pipeline.spec:346 (abort `onMove`) | Code dọn đủ khi destroy. Nhưng bỏ từng dòng sau không làm test nào đỏ: `this.#loader.abort()` (D1: `signal` của `onLoad` không bị huỷ khi destroy), `clearTimeout(this.#keywordTimer)` (D2), `this.#observer?.disconnect()` (D3), vòng `#releaseFocus` (D5: listener `focusin` của thao tác đã chấp nhận, đã lên lịch focus, rồi destroy trước lần render kế). | Thử phá D1, D2, D3, D5: 143 SUCCESS cả bốn. | Test **KAN-B-09** (destroy, `fakeAsync`): `onLoad` đang chờ → destroy → `args.signal.aborted`; đổi `keyword` rồi destroy trước 300 ms → `tick(300)` không gọi `onLoad`; `loadMore: 'auto'` với `FakeIntersectionObserver` → destroy → mọi instance `disconnected`; dời bằng phím được chấp nhận rồi destroy ngay → `removeEventListener('focusin', …, true)`. |
| 3 | Nên sửa | kanban.md §5.2 ("bật: trước `beforeId`"), §7.4 (`Alt` + `↑` `↓`), KAN-C-13 | kanban-loader.ts:104-113; datasource.spec:273-285 | `KanbanColumnLoader.applyMove` có hai ca không test: (a) chèn trước thẻ đầu cột (`before === 0`): đột biến `before < 0` → `before <= 0` đưa thẻ xuống cuối cột mà không test đỏ (M4d); test hiện chỉ dùng `beforeId: 'e'` (vị trí 1) và `null`. (b) Dời trong cùng một cột (`sameColumn`, `reorder` bật): đột biến làm nhân đôi thẻ không test đỏ (X2); lcov nhánh :107 chưa chạy. | Thử phá M4d, X2: 143 SUCCESS. | Test **KAN-B-10**: `dataSource` + `reorder: true`: `move('a', { columnId: 'done', beforeId: 'd' })` → `['a','d','e']`; `Alt` + `↓` và `move()` trong cùng cột → thứ tự đúng, không trùng thẻ, `total` hai cột không đổi. |
| 4 | Nên sửa | SC-05 (cờ `boolean \| (context) => boolean`), SC-07, KAN-C-15 | kanban.component.ts:111-113 | Mọi test dùng `movable`/`droppable` dạng hàm. Đột biến `allows()` coi cờ `boolean` là `true` không test đỏ (X1). `movable: false` hay `droppable: false` (dạng boolean) có thể hỏng mà không ai biết. | Thử phá X1: 143 SUCCESS. | Test **KAN-B-11**: `movable: false` → `cdkDragDisabled`, menu khoá, `move()` false, vẫn chọn được; `droppable: false` → mọi cột khác `data-blocked` khi kéo, `Alt` + `→` không dời, `move()` false; `reorder` bật thì vẫn dời trong cột (theo PD R1 mục 2). |
| 5 | Nên sửa | SC-17 (`move()` trả false cho mọi nhánh bị chặn), §7.5.1 | kanban.component.ts:387-389 | `move()` bị chặn khi cột nguồn hoặc đích đang tải trang đầu (gồm `reload`) hoặc chưa tải. Nhánh này chưa chạy trong test; bỏ hẳn không có test đỏ (X3). | Thử phá X3: 143 SUCCESS. | Test **KAN-B-12**: `reload('done')` rồi `move('a', { columnId: 'done' })` → false, `onMove` không được gọi; cột thu gọn chưa tải làm đích → false. |
| 6 | Ghi chú | R1 Ghi chú 14; REVIEW 3.3 "Mỗi bug đã sửa sau R1 có test -B-xx" | kanban.component.ts:560-562; pipeline.spec:231-235 | Sau R1, `Alt` + `↑` `↓` khi `reorder` tắt không còn `preventDefault`. Không test nào kiểm điều này: đột biến đưa `preventDefault()` lên trước điều kiện không làm đỏ (X4). R1 xếp mục này là Ghi chú (không sai spec), nên không bắt buộc mã B. | Thử phá X4: 143 SUCCESS. | Thêm assert `event.defaultPrevented === false` vào KAN-C-11 (hoặc **KAN-B-13**). |
| 7 | Ghi chú: cần PD chốt | TESTING §10 (Kanban 4 × 200 thẻ: render ≤ 150 ms, không long task > 50 ms) | kanban.e2e.ts:306-337 | Vượt ngân sách xa: render 800 thẻ ~1,23–1,28 s (dev server), long task khi kéo tới 125 ms. Số khớp báo cáo tác giả (dev 1208–1323 ms; production 1207–1403 ms). Test không đỏ khi vượt (đúng §10: báo ở review). | Lệnh E2E ở trên. | Tác giả đã đề xuất 4 hướng ở `reports/kanban-tests.md` "Hiệu năng". PD chọn; không tự thêm virtual scroll. |
| 8 | Ghi chú | TESTING §0.2 ("Mỗi test có mã"), R1 mục 12 | kanban.types.spec.ts:23, 37, 54 | Ba test type chưa có mã. R1 mục 12 đã ghi; phản hồi tác giả chỉ sửa phần tên test `onMove`. | `grep -nE "^\s*it\(" kanban.types.spec.ts` | Thêm mã, ví dụ `[KAN-T-01]`…`[KAN-T-03]`, hoặc gắn vào mã SC liên quan (SC-12 cho union `'cancel'`). |
| 9 | Ghi chú | TESTING §7.4 (KAN-E-07: "Tab tới thẻ"), §0.2 | kanban.e2e.ts:195-204, 231, 245, 306 | (a) E-07 gọi `.focus()` trên nút tên, không Tab từ đầu board; báo cáo tác giả ghi "Tab tới thẻ". (b) Test hình ảnh (:231, :245) mang mã `[KAN-E-01]`, test hiệu năng (:306) mang `[KAN-E-09]`; đếm theo mã sẽ lẫn với kịch bản thật. | Đọc test. | E-07 Tab từ ô trước board tới thẻ (kiểm cả "không bẫy focus"). Đặt mã riêng cho test hình ảnh và hiệu năng (ví dụ `KAN-E-11`, `-12` sau khi PD đồng ý) hoặc ghi mục TESTING (§9, §10) trong tên. |
| 10 | Ghi chú | TESTING §7.2 KAN-C-19 ("đang chọn, đang chờ, thất bại có đúng `data-selected`, `data-pending`") | kanban.interaction.spec.ts:209-219 | Test C-19 chỉ kiểm thẻ đang chờ. Thẻ thất bại (không còn `data-pending`, giữ `data-selected` nếu đang chọn) không được kiểm ở test này. | Đọc test. | Thêm vào C-19: thẻ đang chọn rồi bị từ chối → `data-selected="true"`, không `data-pending`, có `sd-kanban__card--failed`. |
| 11 | Ghi chú | TESTING §13 (E2E xanh) | kanban.e2e.ts:110-113; `C:\tmp\r2k-e2e.log` | Mỗi lần mở trang có 2 lỗi console `404 (Not Found)`. E2E chỉ in ra, không đỏ, không ghi URL. Chưa rõ tài nguyên nào (có thể của Showcase, không phải kanban). | Lệnh E2E ở trên, grep `CONSOLEERROR`. | Ghi URL trong log (`page.on('requestfailed'/'response')`) để xác định; nếu là tài nguyên của trang kanban thì sửa. |
| 12 | Ghi chú | kanban.md §5.2 (`loadMore: 'auto'`) | kanban.component.ts:309-313, 671-693 | Theo đọc code, chưa tái hiện: khi `option.loadMore` đổi từ `'auto'` sang `'button'`, effect thoát sớm mà không `unobserve`/`disconnect`, nên nút "Xem thêm" còn sống (cùng phần tử) vẫn bị theo dõi và tự tải khi cuộn vào màn hình. | Đổi `option` từ `{ loadMore: 'auto' }` sang `{ loadMore: 'button' }`, cuộn làn cho nút ra rồi vào lại. | Khi không còn `'auto'`: `#observer?.disconnect()`, xoá `#observed`. Có thể gộp vào KAN-B-09. |

## Checklist (REVIEW 3.3 và phần rò rỉ của 3.4)
- [✓] Chạy lại lệnh đầy đủ ở TESTING §1 (trừ `npm run sync`), ghi kết quả thật: mục "Lệnh đã chạy".
- [✓] Mọi mã TESTING §4 (SC-01…03, 06…18, 22…33, 37, 38; thêm 34…36) và §7 (U-01…06, C-01…19, R-01…09, E-01…10) có test, tên test có mã. Ba test type chưa có mã (#8). SC-19…21 N/A (kanban không có create).
- [✓] Không có `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()`. Hai `test.skip` có điều kiện ở E2E (kanban.e2e.ts:90 khi thiếu axe-core; :246 test chụp ảnh chỉ chạy ở Bangkok), có lý do.
- [✓] Coverage đạt ngưỡng §2, đọc từ lcov/HTML của lần chạy đầy đủ.
- [✓] Thử phá 5 chỗ: đều có test đỏ. [✗] Đột biến phụ sống sót: #2, #3, #4, #5 (Nên sửa).
- [✓] Không phụ thuộc thời gian thật, thứ tự chạy, zone: 38 lần chạy nhanh với seed khác nhau đều đúng kỳ vọng; không dùng `Date`; `TZ` không có tác dụng với Chrome trên Windows (ghi ở "Lệnh đã chạy").
- [✓] Mỗi bug đã sửa sau R1 có test `-B-xx`: xem bảng dưới. R1 Ghi chú 14 đã đổi hành vi nhưng không có test (#6).
- Rò rỉ khi destroy (3.4): `focusin` [✓ code, ✓ test component.spec:718]; `ResizeObserver` [✓ code :335, ✓ test compact.spec:68]; `IntersectionObserver` [✓ code :337, ✗ test]; timer debounce `keyword` [✓ code :336, ✗ test]; `AbortController` từng cột [✓ code :338, ✗ test]; `AbortController` của `onMove` [✓ code :339, ✓ test pipeline.spec:346, component.spec:307]; listener focus đã lên lịch [✓ code :340, ✗ test]. Các ✗ gộp ở #2.

## Mỗi bug sửa sau R1 có test `-B-xx` (bước 5)
Kiểm bằng đột biến hoàn tác bản sửa trong bản sao (log `r2k-mut-B*.log`) hoặc đọc test khi không hoàn tác được gọn.
| Bug | Bản sửa | Test | Hoàn tác bản sửa → test đỏ? |
| --- | --- | --- | --- |
| R1 #1: bản sao cũ sống lại khi `items` A → B → A | `linkedSignal` theo `items` | KAN-B-01 (pipeline.spec:455) | Đọc test: A → B → A rồi kiểm làn qua DOM. ✓ |
| R1 #2: `droppable` bị gọi khi dời trong cùng cột | bỏ `droppable` khi `target.id === origin.id` (component.ts:393) | KAN-B-02 (pipeline.spec:466) | B2: KAN-B-02 đỏ. ✓ |
| R1 #3: chiều cao chỗ cũ đo sau khi CDK chuyển thẻ | đo ở `pointerdown`/`mousedown` (component.ts:496-499) | KAN-B-03 (pipeline.spec:480) | B3: KAN-B-03 đỏ. ✓ (test giả lập bước CDK bằng `display: none`, không kéo thật.) |
| PD R1 #8: `pendingId` ghi được | `asReadonly()` (component.ts:173) | KAN-B-04 (pipeline.spec:491) | B4: KAN-B-04 đỏ. ✓ |
| R1 #6: method tên `canMove` | đổi thành `isMovable` | KAN-B-05 (pipeline.spec:497) | Đọc test (`'canMove' in kanban()`). ✓ |
| G-final: nhãn dọc làn thu gọn co thành một chữ mỗi cột | SCSS `order` trên khối heading, `nowrap`, ẩn summary | KAN-B-06 (component.spec:118) | B6a (`order` về `h3`), B6b (bỏ `nowrap`), B6c (hiện summary): cả ba KAN-B-06 đỏ. ✓ |
| G-final: summary đảo thứ tự trên trang RTL | `<bdi>` | KAN-B-07 (component.spec:139) | B7: KAN-B-07 đỏ. ✓ |
| R1 Ghi chú 14: `Alt` + `↑` `↓` bị nuốt khi `reorder` tắt | kiểm `reorder` trước `preventDefault` | không có | X4: không đỏ. Ghi chú #6. |
R1 #4, #5 là sửa test (đọc qua DOM, thêm SC-02, SC-03, C-11), không phải bug của component, không cần mã B.

## Thử phá
Làm trên bản sao `C:\tmp\r2k-mutants` (copy `versions/v19` bỏ `node_modules`, `dist`, `coverage`, `.angular`; `node_modules` là junction về worktree; đã xoá sau khi xong). Mỗi đột biến: sửa một chỗ, chạy lệnh nhanh `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='projects/sdcorejs-angular/components/kanban/**/*.spec.ts'`, chép lại file gốc. Log `C:\tmp\r2k-mut-<id>.log`, tóm tắt `C:\tmp\r2k-mutants-summary{,2,3}.log`. Không đột biến nào chạm worktree.
Bản sao chưa sửa (BASE): `TOTAL: 143 SUCCESS`, seed 951811, 38 giây. Mỗi lần chạy đột biến 22–38 giây.

### Năm chỗ của REVIEW 3.3
| # | Chỗ sửa | Test đỏ |
| --- | --- | --- |
| 1 | M1a: bỏ `if (!this.#current(operation)) return false;` (kanban.component.ts:421) | 14 đỏ: KAN-SC-15 × 10 (items, option, columns, readonly, disabled, destroy ở pipeline.spec; destroy ở component.spec; reload cột đích ở datasource.spec; hai test listener focus), KAN-R-02 × 3, KAN-R-03. ✓ |
| 1′ | M1c: bỏ `if (controller.signal.aborted) return;` sau `await onLoad` (kanban-loader.ts:140) | KAN-SC-22. ✓ |
| 1″ | M1d: bỏ kiểm `aborted` trong `catch` của `onLoad` (kanban-loader.ts:133) | KAN-SC-24. ✓ |
| 1‴ | M1b: bỏ riêng `!operation.controller.signal.aborted &&` trong `#current` (kanban.component.ts:714) | Không đỏ. Đột biến tương đương: mọi chỗ gọi `abort()` của thao tác đều qua `#cancel()`, nó xoá `#operation`, nên `this.#operation === operation` đã chặn. Không phải lỗ hổng test. |
| 2 | M2: `'cancel'` đi nhánh `false` (kanban.component.ts:422) | KAN-SC-12 (đồng bộ và Promise). ✓ |
| 3 | M3a: bỏ cả hai lần đánh giá lại `movable`, `droppable` trước `onMove` (kanban.component.ts:392-393) | KAN-SC-06 × 2, KAN-SC-08, KAN-SC-17. ✓ |
| 3′ | M3b: chỉ bỏ `movable` (:392) | KAN-SC-06 (movable), KAN-SC-17. ✓ |
| 3″ | M3c: chỉ bỏ `droppable` (:393) | KAN-SC-06 (droppable), KAN-SC-08, KAN-SC-17. ✓ |
| 4 | M4a: bỏ so sánh no-op `card.columnId === to.columnId && index === fromIndex` (kanban.utils.ts:32) | KAN-U-03. ✓ |
| 4′ | M4b: `index === fromIndex` → `index <= fromIndex` (:32) | KAN-U-03, KAN-B-02. ✓ |
| 4″ | M4c: `index < 0` → `index <= 0` (:31) | KAN-U-03, KAN-SC-03, KAN-B-02. ✓ |
| 4‴ | M4g: bỏ no-op của `drop()` `previousIndex === currentIndex` (kanban.component.ts:472) | KAN-U-03 (component.spec, hai biến thể thẻ ẩn). ✓ |
| 4⁗ | M4e: `kanbanApplyMove` `at < 0` → `at <= 0` (kanban.utils.ts:78) | KAN-SC-03. ✓ |
| 4⁵ | M4d: `KanbanColumnLoader.applyMove` `before < 0` → `before <= 0` (kanban-loader.ts:111) | **Không đỏ.** Kết quả #3. |
| 4⁶ | M4f: `kanbanApplyMove` `last < 0` → `last <= 0` (kanban.utils.ts:81) | Không đỏ. Đột biến tương đương: chỉ đổi vị trí trong mảng phẳng, thứ tự trong từng cột giữ nguyên. |
| 5 | M5: bỏ `this.pendingId() !== null` khỏi `moveBlocked` (kanban.component.ts:211) | KAN-SC-14, KAN-R-01. ✓ |

Kết luận: cả 5 chỗ bắt buộc có test đỏ. Không có Chặn từ thử phá.

### Đột biến thêm (dọn khi destroy, nhánh coverage chưa chạy, bản sửa sau R1)
| # | Chỗ sửa | Test đỏ |
| --- | --- | --- |
| D1 | bỏ `this.#loader.abort()` khi destroy (kanban.component.ts:338) | **Không đỏ.** #2 |
| D2 | bỏ `clearTimeout(this.#keywordTimer)` khi destroy (:336) | **Không đỏ.** #2 |
| D3 | bỏ `this.#observer?.disconnect()` khi destroy (:337) | **Không đỏ.** #2 |
| D4 | bỏ `resize?.disconnect()` khi destroy (:335) | KAN-SC-32 (stops watching the host when destroyed). ✓ |
| D5 | bỏ vòng `#releaseFocus` khi destroy (:340) | **Không đỏ.** #2 |
| X1 | `allows()` coi cờ `boolean` là `true` (:112) | **Không đỏ.** #4 |
| X2 | `applyMove` cùng cột dùng `from` thay vì `{ ...from, cards: rest }` (kanban-loader.ts:107; thẻ bị nhân đôi) | **Không đỏ.** #3 |
| X3 | bỏ chặn `move()` khi cột nguồn/đích đang tải (kanban.component.ts:388-389) | **Không đỏ.** #5 |
| X4 | `preventDefault()` trước điều kiện `reorder` của `Alt` + `↑` `↓` (:561-562) | **Không đỏ.** #6 |
| B2, B3, B4, B6a, B6b, B6c, B7 | hoàn tác bản sửa sau R1 | Xem bảng "Mỗi bug sửa sau R1". Đều đỏ đúng test B. ✓ |

## Đối chiếu mã (bước 2, làm trước khi đọc reports/kanban-tests.md)
Lệnh: `grep -ohE 'KAN-[A-Z]+-[0-9]+' components/kanban/src/*.spec.ts showcase/e2e/components/kanban.e2e.ts | sort | uniq -c`, rồi đọc từng tên `it(`/`test(`.
- TESTING §4 (kanban): SC-01, 02, 03, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 37, 38 → đủ, mỗi mã có ít nhất một `it` có mã trong tên. Có thêm SC-34, 35, 36 (compact.spec:94, 100, 107). SC-19…21 N/A.
- SC-09…13: bảng `codes` ở kanban-pipeline.spec.ts:275-281, 5 kết quả × 2 biến thể (đồng bộ và Promise) = 10 `it`, tên có mã đầy đủ, grep tìm được.
- TESTING §7: U-01…06, C-01…19, R-01…09, E-01…10 → đủ.
- B: B-01…05 (kanban-pipeline.spec.ts:455-500), B-06, B-07 (kanban.component.spec.ts:118, 139).
- Không có `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()` trong 8 spec kanban và E2E.
- Test không có mã: 3 test type (#8). Mã gắn lệch nghĩa ở E2E (#9). C-19 chưa kiểm thẻ thất bại (#10).

## Đối chiếu với `reports/kanban-tests.md` (đọc sau bước 2)
- Karma đầy đủ: tác giả 9224/9224 ở `cfa8e0a1` + sửa C-16 (seed 208298); mình 9226/9226 ở `56611d76` (seed 485410). Chênh 2 = KAN-B-06, KAN-B-07. Khớp.
- Coverage từng file kanban: trùng số (component 97,07/91,22; utils 100/100; loader 99/92,3). Tổng repo statements tác giả 39712/45125, mình 39711/45125 (lệch 1 statement, không ảnh hưởng ngưỡng).
- E2E: 25 passed, 1 skipped, 1,8 phút. Khớp. Báo cáo ghi E-07 "Tab tới thẻ" nhưng test dùng `.focus()` (#9).
- Hiệu năng: khớp (vượt ngân sách, #7).
- Lệnh nhanh: 143/143. Khớp.

## Dọn dẹp
- Đã xoá bản sao `C:\tmp\r2k-mutants` (gỡ junction trước bằng `rmdir`, `node_modules` của worktree còn nguyên) và config tạm `showcase/playwright.r2k.config.ts`.
- Đã khôi phục 3 ảnh E2E ghi đè trong `reports/kanban-screens/`.
- Giữ lại log và bản lưu coverage ở `C:\tmp\r2k-*` làm bằng chứng.
- `git status` của worktree sau khi xong: chỉ còn `reviews/kanban-R2-tests.md` (file này), `reviews/kanban-R2-spec.md` (phần A) và hai config local của tác giả.
