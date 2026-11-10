# kanban · R2'
Nhánh: feat/kanban-api · Commit: c5d405f0 · Ngày: 2026-11-10
Reviewer: phiên mới, không có lịch sử của phiên tác giả.
Phạm vi: mục Chặn và Nên sửa của `kanban-R2-spec.md` (A) và `kanban-R2-tests.md` (B), các Ghi chú tác giả sửa luôn, test hồi quy. Diff xét: `git diff 56611d76..HEAD` (bỏ ảnh và báo cáo).
Đường dẫn dưới đây tương đối với `versions/v19/projects/sdcorejs-angular/components/kanban/` nếu không ghi khác.

## Kết luận
Chặn: 0 · Nên sửa: 2 · Ghi chú: 3
Được mở PR.

- Cả 3 Chặn của R2 (A-1 = B-1, A-2) đã sửa đúng spec. Hoàn tác từng bản sửa thì đúng test B đỏ.
- 12/13 mục Nên sửa của R2 sửa đúng. A-3 sửa một nửa: cột đích chưa có trang đầu đã bị khoá, nhưng cột nguồn đang tải lại trang đầu vẫn để control bật mà không làm gì (#1).
- 26 đột biến trên bản sao: 25 làm đỏ đúng test B. Một đột biến phụ sống (B-19, con trỏ của thẻ trong làn bị từ chối) (#2). Bản hoàn tác trọn bản sửa B-19 vẫn đỏ, nên mục này là thiếu test cho nhánh phụ, không phải Chặn.
- Lệnh hồi quy xanh: kanban 163/163, lint, build, check:sync, E2E 25 pass / 1 skip có chủ đích.
- Theo TESTING §13, hai mục Nên sửa phải sửa hoặc được PD duyệt lý do trước khi coi là xong.

## Lệnh đã chạy
Node v26.12.0 local (K1), Chrome Headless 156, Windows 11. Log ở `C:\tmp\r2pk-*.log`.
- Bản sao `C:\tmp\r2pk-mutants` (robocopy `versions/v19` bỏ `node_modules`, `dist`, `coverage`, `.angular`; `node_modules` là junction về worktree). BASE: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='projects/sdcorejs-angular/components/kanban/**/*.spec.ts'` → `TOTAL: 163 SUCCESS`, 33 giây (`r2pk-base.log`). R2 có 143; +20 test mới.
- 26 đột biến, mỗi lần một chỗ, script tự chép lại file gốc sau mỗi lần (`r2pk-mut-<id>.log`, tóm tắt `r2pk-mutants-summary.log`). Mỗi lần 22–37 giây.
- Probe tạm trong bản sao (`kanban.r2pk-probe.spec.ts`, đã xoá) cho #1 → `TOTAL: 1 SUCCESS`, log in kết quả (`r2pk-probe.log`).
- Gỡ junction bằng `rmdir`, rồi xoá bản sao. `node_modules` của worktree còn nguyên.
- Worktree, `versions/v19`, lệnh nhanh kanban như trên → `TOTAL: 163 SUCCESS`, seed 315403, 23 giây (`r2pk-wt-quick.log`).
- `npm run lint` (v19) → `All files pass linting.`, exit 0, 30 giây (`r2pk-lint.log`).
- `npm run check:sync` (root) → `Version workspace sync check passed: v20, v21, v22 match v19.`, exit 0, 4 giây.
- `npx ng build sdcorejs-angular` (v19) → `Built Angular Package`, exit 0, 41 giây (`r2pk-build.log`).
- `npm --prefix showcase run link:library` → exit 0.
- E2E: config tạm `showcase/playwright.r2pk.config.ts` (kế thừa config repo, cổng 4361, `reuseExistingServer: false`, timeout 300000). `cd showcase && npx playwright test e2e/components/kanban.e2e.ts --config=playwright.r2pk.config.ts --reporter=line` → **25 passed, 1 skipped** (ảnh chỉ chụp ở `asia-bangkok`, chủ đích), 1,7 phút, cả lệnh 104 giây, exit 0 (`r2pk-e2e.log`).
  - 50 dòng `HTTP 404 http://localhost:4361/docs/versions.json` kèm 50 `CONSOLEERROR … 404`. Không có `PAGEERROR`. Khớp phản hồi tác giả (B-11).
  - Hiệu năng (chỉ ghi số): render 800 thẻ trung vị 1236,7 ms và 1263,9 ms (ngân sách 150 ms); long task khi kéo `[64,193,53,104,116,94]`, `[134,87,106,68]` ms (ngân sách 50 ms). Vẫn vượt, chờ PD (A-15 = B-7).
  - Đã xoá config tạm. E2E ghi đè 3 ảnh (`orders-column-error.png`, `orders-dragging.png`, `tasks-dragging-slot.png`); đã `git checkout -- .sdcorejs/handoff/schedule-kanban/reports/kanban-screens`. Các ảnh `card-*.png` chụp lại trùng byte với bản đã commit.
- Không chạy Karma đầy đủ (tác giả đã chạy; không bắt buộc).
- So ảnh: mở `design-kanban/Kanban Review.dc.html` qua một server tĩnh tạm (localhost, chỉ đọc thư mục gói), bề rộng 1300px, mục 02–03.

## Kết quả (mục mới hoặc còn lại)
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nên sửa | R2 A-3 (phần cột nguồn), kanban.md §7.3, §7.5 bước 1; SC-17 | src/kanban.component.ts:560 (`canDrop` chỉ xét `to`), :399 (`#move` từ chối khi cột nguồn chưa sẵn sàng); src/kanban.component.html:168, :212, :292 | Chế độ `dataSource`, cột nguồn đang tải lại trang đầu (`reload(id)`, đổi `keyword` sau 300 ms, `option` mới). Thẻ vẫn hiện (SC-23), nút ⋯ bật, mục "Chuyển đến …" bật, kéo được, làn đích không `data-blocked`. Mọi thao tác đi tới `#move` rồi bị từ chối im lặng: không `onMove`, live region rỗng. R2 A-3 ghi rõ "cột nguồn hoặc đích"; bản sửa chỉ khoá cột đích. | Probe: tải xong `open`, `done`; `reload('open')` còn chờ. Trigger ⋯ của `a` `disabled=false`, mục "Done" `disabled=false`; bấm → `onMove` 0 lần, live region `""`; `Alt` + `→` → 0 lần; `CdkDrag.disabled=false`; khi kéo `done` không `data-blocked`. Thực tế: gõ từ khoá ở ví dụ Orders rồi kéo ngay trong lúc tải. | Theo cùng hướng PD chọn cho A-3: khi cột nguồn chưa sẵn sàng thì khoá kéo, nút ⋯ (hoặc mọi mục menu) và `Alt` + phím của thẻ cột đó; hoặc đọc một thông báo. Test **KAN-B-23**: `reload('open')` đang chờ → menu khoá, `Alt` + `→` không gọi `onMove`, `cdkDragDisabled`, `move()` false. |
| 2 | Nên sửa | R2 A-9; kanban.md §6 (làn bị từ chối: con trỏ `not-allowed`) | src/kanban.component.scss:510-517; test src/kanban.review.spec.ts:226-235 | Đột biến B19b: bỏ khối `.sd-kanban__column[data-blocked]` bên trong `.sd-kanban__board[data-dragging]`. Thẻ trong làn bị từ chối khi đó có con trỏ `grabbing` thay vì `not-allowed` (quy tắc `.sd-kanban__card { cursor: grabbing }` thắng quy tắc của `> .sd-kanban__cards`). Không test nào đỏ: KAN-B-19 chỉ kiểm header của làn bị từ chối, mà header đã có `not-allowed` từ quy tắc cũ (:496). Hoàn tác trọn bản sửa (B19a) thì KAN-B-19 đỏ, nên đây là nhánh phụ thiếu test. | Thử phá B19b: `TOTAL: 163 SUCCESS`. | Thêm vào KAN-B-19 (hoặc **KAN-B-24**): khi kéo `x`, `getComputedStyle(article('d')).cursor === 'not-allowed'` và nút tên của `d` cũng vậy. |
| 3 | Ghi chú | kanban.md §12; R2 A §12 (hook phụ phải có tài liệu) | src/kanban.component.html:60; sd-kanban.md:217-233 | Thuộc tính mới `data-dragging` trên board (dùng cho con trỏ) không có trong bảng E2E hooks. | Đọc `sd-kanban.md` mục "E2E hooks". | Thêm một dòng "Board: `data-dragging` while a card is dragged", hoặc ghi rõ là nội bộ. |
| 4 | Ghi chú | R2 A-7; kanban.md §5.2 (debounce 300 ms) | src/kanban.component.html:244 | `no-results` đọc `keyword()` hiện tại, không phải từ khoá đã tải. Trong 300 ms debounce, cột trống (đã tải với từ khoá rỗng) đã hiện "Không có thẻ khớp" trước khi server được hỏi. Sau đó cột chuyển sang skeleton. Chỉ là chữ sai trong thoáng chốc. | Đọc code: `dataMode() ? !!keyword().trim() : …`. | Có thể dùng từ khoá của lần tải (`#loadedKeyword`) cho chữ này. Không bắt buộc. |
| 5 | Ghi chú | REVIEW 3.4 ("không `as unknown as`") | src/kanban.review.spec.ts:470 | Test KAN-B-20 dùng `odd as unknown as Card[]` để giả dữ liệu server sai kiểu. Chỉ trong test, không trong mã thư viện; hợp lý cho mục đích này. | grep `as unknown as`. | Giữ, hoặc khai `odd` là `unknown[]` rồi truyền qua `onLoad` kiểu rộng. |

## Từng mục Chặn và Nên sửa của R2
Cột "Thử phá": đột biến hoàn tác bản sửa trên bản sao; ghi test đỏ.
| Mục R2 | Mức R2 | Bản sửa (đã đọc) | Đúng spec | Test | Thử phá | Kết quả |
| --- | --- | --- | --- | --- | --- | --- |
| A-1 = B-1: context template cột | Chặn | `ColumnView.total` mới (`items`: số thẻ cột; `dataSource`: `state.total`, `null` khi chưa biết); `columnContext` dùng `view.total`, `view.summary` (src/kanban.component.ts:239, 250, 618-627) | ✓ §3 (`total` null khi đang tải, lỗi; `LoadResult.summary` ghi đè), sd-kanban.md:185, CHANGELOG | KAN-B-08 (review.spec:97): template cột và actions thật, `items` có keyword, `dataSource` trước/sau tải, không `total`, lỗi trang đầu | B08a (`total: view.count`) → KAN-B-08 đỏ. B08b (`summary: view.column.summary`) → KAN-B-08 đỏ | ✓ |
| A-2: lớp phủ che nút Đóng | Chặn | `.sd-kanban__card-status { position: relative; z-index: 1 }` (scss:244-247) | ✓ SC-11, SC-36, §6 | KAN-B-13 (review.spec:210): `elementFromPoint` tại tâm nút Đóng | B13 (bỏ `position`, `z-index`) → KAN-B-13 đỏ | ✓ |
| A-3 = B-5: dời vào cột chưa tải | Nên sửa | `canDrop` trả false cho cột đích chưa có trang đầu (ts:560); `#ready` (ts:566-569); `#move` vẫn từ chối (ts:399). Docs sd-kanban.md:127, CHANGELOG:175 | ✓ cho cột đích. ✗ cho cột nguồn đang tải lại (#1) | KAN-B-12 × 2 (review.spec:268, 387): menu cột thu gọn chưa tải; `Alt` + `→` bỏ cột lỗi; kéo làm mờ; `move()` false khi đích lỗi và khi đang tải lại | B12a (bỏ dòng ở `canDrop`) → 2 test KAN-B-12 đỏ. B12b (bỏ chặn ở `#move`, = X3 của R2) → KAN-B-12 đỏ. B12c (`#ready` bỏ `status !== 'loading'`) → KAN-B-12 đỏ | ✗ một phần → #1 |
| A-4: `loadMore: 'auto'` với id mã hoá | Nên sửa | Callback tìm cột theo token (ts:705-711) | ✓ §5.2 | KAN-B-14 (review.spec:426): cột `'đã huỷ'` | B14 (truyền token làm id) → KAN-B-14 đỏ | ✓ |
| A-5: tên đọc của số đếm | Nên sửa | `aria-label` chỉ khi `view.total !== null` (html:95-100) | ✓ §6, §11. Chế độ `items` giữ như main | KAN-B-15 (review.spec:442): "–", "2+" không có tên; total 5 có tên | B15 (về `view.count` luôn có tên) → KAN-B-15 đỏ | ✓ |
| A-6: summary lệch ở RTL | Nên sửa | `.sd-kanban__heading { text-align: start }` (scss:392-399) | ✓ §6; ảnh `orders-rtl.png` đúng (summary nằm dưới nhãn ở mép phải) | KAN-B-16 (review.spec:220) | B16 (bỏ `text-align`) → KAN-B-16 đỏ | ✓ |
| A-7: cột trống khi có keyword | Nên sửa | `no-results` khi `dataMode` và `keyword().trim()` (html:242-245) | ✓ Review.dc §05. Lưu ý #4 | KAN-B-17 (review.spec:454) | B17 (về `view.count ? …`) → KAN-B-17 đỏ | ✓ |
| A-8: dấu chỗ cũ chỉ có tiêu đề | Nên sửa | Vẽ template thẻ (hoặc tiêu đề) trong khối mờ .4, `inert`, `aria-hidden` (html:150-162) | ✓ §6, Review.dc §02 "Đang kéo"; ảnh `orders-dragging.png` có mã, khách, tiền mờ | KAN-B-18 (review.spec:124) | B18 (về chỉ tiêu đề) → KAN-B-18 đỏ | ✓ |
| A-9: `grabbing` không hiện | Nên sửa | `data-dragging` trên board (html:60); `cursor: grabbing` cho board và thẻ, `not-allowed` trong làn bị từ chối (scss:503-518) | ✓ §6 | KAN-B-19 (review.spec:226) | B19a (bỏ `data-dragging`) → KAN-B-19 đỏ. B19b (bỏ khối làn bị từ chối) → **không đỏ** | ✓ sửa; thiếu test nhánh phụ → #2 |
| A-10: id rỗng ở loader | Nên sửa | `typeof card.id === 'string' && card.id.trim()` (kanban-loader.ts:154-164) | ✓ SC-01, giống `items` | KAN-B-20 (review.spec:466): id `'  '` và `7` | B20 (về `!card.id`) → KAN-B-20 đỏ | ✓ |
| B-2: test destroy | Nên sửa | Code dọn sẵn (ts:344-352); thêm test | ✓ REVIEW 3.4 | KAN-B-09 (review.spec:318) | D1 (bỏ `#loader.abort()`), D2 (bỏ `clearTimeout`), D3 (bỏ `#observer?.disconnect()`), D5 (bỏ vòng `#releaseFocus`) → mỗi lần KAN-B-09 đỏ | ✓ |
| B-3: `applyMove` của loader | Nên sửa | Code đúng; thêm test | ✓ §5.2 | KAN-B-10 (review.spec:370): trước thẻ đầu, cùng cột, `total` | M4d (`before <= 0`), X2 (cùng cột dùng `from`) → KAN-B-10 đỏ | ✓ |
| B-4: cờ boolean | Nên sửa | Code đúng; thêm test | ✓ SC-05 | KAN-B-11 (review.spec:187) | X1 (`allows` coi boolean là `true`) → KAN-B-11 đỏ | ✓ |

## Ghi chú tác giả sửa luôn
| Mục R2 | Kiểm | Kết quả |
| --- | --- | --- |
| A-11: `selectedId` bị xoá trước khi dữ liệu về | `#dataArrived()` (ts:571-580): `items` khác `undefined`, hoặc mọi cột đang mở có trang đầu hoặc lỗi trang đầu; effect SC-27 (ts:325-329) đọc signal của loader nên chạy lại khi tải xong. KAN-B-22 × 2 (review.spec:237, 486). Thử phá B22a (bỏ điều kiện) → cả hai KAN-B-22 đỏ; B22b (`dataSource` luôn coi là đã về) → KAN-B-22 bản dataSource đỏ. Không thấy vòng lặp effect. Hệ quả: id của thẻ trong cột thu gọn chưa tải vẫn về `null` sau khi các cột mở tải xong; docs ghi đúng (sd-kanban.md:130). | ✓ (cách hiểu vẫn chờ PD) |
| A-13: hover "Xem thêm" | Bọc trong `@media (hover: hover)` (scss:427-432). | ✓ |
| A-17: ảnh `card-focus.png` | Chụp có lề 8px (`shotAround`, kanban.e2e.ts:107-114). Ảnh thấy vòng focus quanh thẻ, offset 2px, nút ⋯ hiện. Khớp Review.dc §03 "Focus bàn phím". | ✓ |
| A-18: summary cũ khi trang đầu lỗi | Loader xoá `summary` cùng `cards`, `total` (kanban-loader.ts:136-141). KAN-B-21; thử phá B21 → KAN-B-21 đỏ. | ✓ |
| A-19: `pendingId` chỉ đọc, kiểu input | Dòng mới ở CHANGELOG.md:91, trong `### Changed (BREAKING for consumers)` › `#### Kanban`; bỏ "exposes…" khỏi Added. sd-kanban.md:72-73 đổi thành `string \| null \| undefined`. | ✓ |
| A-20 = B-12: observer khi rời `'auto'` | Effect `disconnect()`, xoá `#observer`, `#observed` (ts:314-320). KAN-B-09 test thứ hai (review.spec:346); thử phá B09b → đỏ. | ✓ |
| B-6: `Alt` + `↑` `↓` không `preventDefault` | KAN-C-11 (review.spec:252): `defaultPrevented` false, `Alt` + `→` true. Thử phá X4 → KAN-C-11 đỏ. | ✓ |
| B-8: test type chưa có mã | `[KAN-T-01] [KAN-SC-12]`, `[KAN-T-02] [KAN-SC-04] [KAN-SC-05]`, `[KAN-T-03]` (kanban.types.spec.ts:23, 37, 54). | ✓ |
| B-9 (E-07): `.focus()` thay vì Tab | E-07 focus ô tìm kiếm rồi bấm Tab tối đa 6 lần tới DH-1001, Enter, kiểm drawer, focus giữ, `Alt` + `→` (kanban.e2e.ts:208-223). Chạy xanh ở cả hai project. Chưa kiểm "không bẫy focus" sau thẻ; chấp nhận. Mã test ảnh và hiệu năng: chờ PD. | ✓ |
| B-10: C-19 thẻ thất bại | KAN-C-19 (review.spec:258): `data-selected="true"`, không `data-pending`, có class lỗi. Test thêm, không có sửa code. | ✓ |
| B-11: 404 console | E2E ghi URL: `GET /docs/versions.json` 404 (50 lần), là registry docs của showcase, không thuộc kanban. Mình chạy lại thấy đúng vậy. | ✓ |

## Để PD chốt (chỉ ghi lại, không coi là lỗi)
- A-3: cách chọn. Hiện là "cột chưa có trang đầu chưa là đích" (menu khoá, `Alt` + phím bỏ qua, kéo làm mờ, `move()` false). Cách khác: cho dời rồi tải cột đích. Mục #1 theo cùng lựa chọn này.
- A-11: `selectedId` chỉ kiểm khi dữ liệu đã về.
- A-12: SC-43 fallback cho màu lõi; hiện theo quy ước main (không fallback).
- A-14: vùng live thứ hai của `sd-data-state` (không có cột, dữ liệu sai).
- A-15 = B-7: hiệu năng §10 vẫn vượt (số ở trên).
- B-9: mã riêng cho test ảnh (E-01, §9) và hiệu năng (E-09, §10).
- Còn chờ, không thuộc PD: A-16 (phóng to 200%, trình đọc màn hình, TESTING §8 tay). A-21 (Space ngoài Chromium), A-22 (`MoveTarget` không export) giữ nguyên.

## So ảnh (Review.dc mục 02–03)
| Ảnh | Mục | Kết quả |
| --- | --- | --- |
| `card-focus.png` | 03 "Focus bàn phím" | ✓ Vòng focus quanh thẻ, offset 2px, ⋯ hiện. Ảnh có lề, không còn bị cắt. |
| `orders-rtl.png` | 02 (header làn), RTL | ✓ Summary ("8,9 triệu ₫", "14,7 triệu ₫", "9 triệu ₫") nằm ngay dưới nhãn ở mép đầu (phải). Số đếm và nút thu gọn ở mép cuối. |
| `orders-dragging.png` | 02 board đang kéo, 03 "Đang kéo" | ✓ Chỗ cũ DH-1001 vẽ cả mã, khách, tiền ở .4 (như DH2415 trong thiết kế). Đang giao viền nhận, Hoàn tất mờ, preview có bóng. Thiết kế vẽ làn thu gọn "Đã huỷ" mờ .5 khi kéo; mã nay cũng làm mờ cột chưa tải (A-3), khớp. |

## Thử phá
Bản sao `C:\tmp\r2pk-mutants`, BASE 163 SUCCESS. Mỗi dòng: một đột biến, lệnh nhanh kanban.
| # | Chỗ sửa | Test đỏ |
| --- | --- | --- |
| B08a | `columnContext`: `total: view.count` (ts:622) | KAN-B-08 |
| B08b | `columnContext`: `summary: view.column.summary ?? null` (ts:624) | KAN-B-08 |
| B13 | bỏ `position: relative; z-index: 1` của `.sd-kanban__card-status` (scss:245-247) | KAN-B-13 |
| B12a | bỏ kiểm `#ready(to.id)` trong `canDrop` (ts:560) | KAN-B-12 × 2 |
| B12b | bỏ chặn cột chưa sẵn sàng trong `#move` (ts:399) | KAN-B-12 (dataSource) |
| B12c | `#ready` chỉ xét `loaded` (ts:568) | KAN-B-12 (dataSource) |
| B14 | callback `IntersectionObserver` truyền token làm id (ts:710) | KAN-B-14 |
| B15 | `aria-label` số đếm luôn có, theo `view.count` (html:98) | KAN-B-15 |
| B17 | chữ cột trống về `view.count ? …` (html:244) | KAN-B-17 |
| B19a | bỏ `[attr.data-dragging]` (html:60) | KAN-B-19 |
| B19b | bỏ khối `[data-blocked]` trong `[data-dragging]` (scss:510-517) | **Không đỏ** → #2 |
| B20 | loader về `!card.id` (kanban-loader.ts:159-160) | KAN-B-20 |
| B21 | loader không xoá `summary` khi trang đầu lỗi (kanban-loader.ts:140) | KAN-B-21 |
| B22a | effect SC-27 bỏ điều kiện `#dataArrived` (ts:327) | KAN-B-22 × 2 |
| B22b | `#dataArrived` ở `dataSource` luôn true (ts:574) | KAN-B-22 (dataSource) |
| B16 | bỏ `text-align: start` của `.sd-kanban__heading` (scss:397-398) | KAN-B-16 |
| B18 | chỗ cũ chỉ vẽ tiêu đề (html:154-160) | KAN-B-18 |
| D1 | bỏ `#loader.abort()` khi destroy (ts:349) | KAN-B-09 (destroy) |
| D2 | bỏ `clearTimeout(#keywordTimer)` khi destroy (ts:347) | KAN-B-09 (destroy) |
| D3 | bỏ `#observer?.disconnect()` khi destroy (ts:348) | KAN-B-09 (destroy) |
| D5 | bỏ vòng `#releaseFocus` khi destroy (ts:351) | KAN-B-09 (destroy) |
| B09b | bỏ `disconnect` khi `loadMore` rời `'auto'` (ts:316-318) | KAN-B-09 (rời auto) |
| M4d | loader `before <= 0` (kanban-loader.ts:111) | KAN-B-10 |
| X2 | loader cùng cột dùng `from` (kanban-loader.ts:107) | KAN-B-10 |
| X1 | `allows()` coi cờ boolean là `true` (ts:114) | KAN-B-11 |
| X4 | `preventDefault()` trước điều kiện `reorder` (ts:591-592) | KAN-C-11 |

Mọi đột biến chỉ làm đỏ test nhắm tới (không có test khác đỏ theo). 27 lần chạy với seed ngẫu nhiên, không thấy chập chờn.

## Checklist R2' (chỉ các mục đã ghi ở R2, cộng hồi quy)
- [✓] Chặn R2: A-1 = B-1, A-2 đã sửa, có test B đỏ khi hoàn tác.
- [✗] Nên sửa R2: 12/13 ✓; A-3 còn phần cột nguồn (#1).
- [✓] Mỗi bản sửa sau R2 có test `-B-xx` (B-08…B-22) hoặc test mã C có sẵn (C-11, C-19, T-01…03). Thử phá: bản hoàn tác trọn của mỗi bản sửa đều đỏ; một nhánh phụ thiếu test (#2).
- [✓] Không `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()` trong `kanban.review.spec.ts`.
- [✓] Hồi quy: lệnh nhanh kanban 163/163, lint, build, check:sync, E2E 25/1 skip.
- [✓] v20/v21/v22 mang cùng bản sửa (`check:sync` xanh; diff có 4 bản `kanban.review.spec.ts`, v22 thêm shim).
- [✓] Ảnh chụp lại: `card-focus.png`, `orders-rtl.png`, `orders-dragging.png` khớp Review.dc §02–03.

## Dọn dẹp
- Đã xoá bản sao `C:\tmp\r2pk-mutants` (gỡ junction trước), probe tạm, config `showcase/playwright.r2pk.config.ts`, server tĩnh tạm và tab trình duyệt tạm.
- Đã khôi phục 3 ảnh E2E ghi đè trong `reports/kanban-screens/`.
- Giữ log ở `C:\tmp\r2pk-*.log`.
- `git status` của worktree sau khi xong: file này, hai config local của tác giả (`showcase/playwright.local-kanban*.config.ts`), và bốn ảnh `reports/kanban-screens/design-{board,cards,lanes,loading}.png` chưa track. Bốn ảnh này **không do reviewer tạo**: chúng xuất hiện lúc 08:09:18, sau mọi lệnh của reviewer (lần `git status` sau khi khôi phục ảnh E2E chưa có chúng). Có thể một phiên khác đang ghi vào worktree. Reviewer không xoá.
