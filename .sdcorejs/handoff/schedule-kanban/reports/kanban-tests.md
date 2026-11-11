# sd-kanban · test
Commit: mã `f3f8b595` (sau sửa R2'), báo cáo ở commit kế tiếp (nhánh `feat/kanban-api`) · Node local v26 (PD chốt K1; CI Node 24.22.1 là cổng chuẩn) · Chrome Headless 156

## Lệnh (TESTING.md §1)
| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage` | Ở `f3f8b595`: 9248/9248 SUCCESS, seed 759849, 5 phút 26 giây. Tổng: statements 88.02% (39736/45144), branches 79.32%, functions 87.1%, lines 90.38% (ngưỡng karma không báo lỗi). Sau R2 (`871a4642`): 9246/9246 (seed 269070). Trước R2: 9224/9224 (seed 208298); một lần trước nữa 9222/9223 với lỗi KAN-C-16 chỉ khi chạy cả suite (fixture ngoài viewport; đã cuộn control vào màn hình trước khi hit-test). |
| Lệnh nhanh kanban (`--include='projects/sdcorejs-angular/components/kanban/**/*.spec.ts'`) | 165/165 SUCCESS ở `f3f8b595` |
| `npm run lint` (v19) | All files pass linting |
| `npx ng build sdcorejs-angular` | exit 0, 104 entry point `Built` |
| `npm run test:theme` | trong `npm run test:scripts`: exit 0, 0 fail |
| `npm run check:scss-hex` | trong `npm run test:scripts`: exit 0 |
| `npm run test:scripts` | exit 0 · 18 bộ, 0 fail |
| `npm run sync` + `npm run check:sync` | Passed: v20, v21, v22 match v19 (đã khôi phục ~1570 file v22 đổi CRLF giả, diff rỗng; memory `sync-v22-phantom-eol`) |
| Showcase `npm test` (cả suite, gồm `documentation.registry.spec.ts`) | 331/331 SUCCESS. Trước đó đỏ 3 test do phần showcase của CP5: hai số cứng trong `documentation.registry.spec.ts` (513 section, kanban 4 ví dụ) và bản tiếng Anh thiếu cho ghi chú ví dụ Orders (`content.en.ts`); đã sửa. Chạy với `NODE_OPTIONS=--max-old-space-size=8192` (mặc định hết heap trên máy này). |
| `npm --prefix showcase run link:library` + Playwright `e2e/components/kanban.e2e.ts` | Cấu hình local cổng 4331 (cổng 4321 của repo bị app khác chiếm; file config không commit), hai project `asia-bangkok`, `utc`, Chromium 1920×1000: 25 passed, 1 skipped (test chụp trạng thái chỉ chạy ở Bangkok), 1,8 phút; chạy lại ở `f3f8b595` sau sửa R2': 25 passed, 1 skipped, 1,8 phút. KAN-E-09 (kéo có `reorder`) lặp 20 lần, 2 worker: 20/20. |

## Coverage từng file (TESTING.md §2)
Statements từ báo cáo HTML của Istanbul, branches và lines từ `lcov.info`.

| File | Statements | Branches | Lines | Ngưỡng |
| --- | --- | --- | --- | --- |
| `kanban.utils.ts` | 100% (82/82) | 100% (55/55) | 100% (51/51) | 100/100 ✓ |
| `kanban.component.ts` | 98.05% (453/462) | 94.40% (253/268) | 100% (373/373) | ≥90/≥85 ✓ |
| `kanban-loader.ts` | 99% (100/101) | 93.94% (62/66) | 100% (81/81) | — (lớp nội bộ) |
| `kanban.templates.ts` | 75% (12/16) | — | 71.43% (10/14) | không đo (§2), type test |

`kanban.templates.ts` và `kanban.model.ts`: không đo (TESTING §2), có type test `kanban.types.spec.ts` (union `onMove`, context template, `items` sai kiểu). `kanban-loader.ts` không có ngưỡng riêng (lớp nội bộ, không export). Số coverage đo ở lần chạy đầy đủ tại `f3f8b595`.

## Mã test
Mọi mã của SHARED-CONTRACT (trừ phần dưới "Bỏ qua có lý do") và của TESTING §7 có test xanh. Bảng sinh từ tên test (`[KAN-…]`) và từ bảng mã của các test chạy theo bảng (`kanban-pipeline.spec.ts`, kết quả `onMove`).

| Mã | File:dòng test | Kết quả |
| --- | --- | --- |
| KAN-U-01 | kanban.utils.spec.ts:31, kanban.utils.spec.ts:62 | ✓ |
| KAN-U-02 | kanban.utils.spec.ts:38, kanban.utils.spec.ts:67 | ✓ |
| KAN-U-03 | kanban.component.spec.ts:464, kanban.utils.spec.ts:79, kanban.utils.spec.ts:103 | ✓ |
| KAN-U-04 | kanban.utils.spec.ts:125 | ✓ |
| KAN-U-05 | kanban.utils.spec.ts:162 | ✓ |
| KAN-U-06 | kanban.component.spec.ts:383, kanban.utils.spec.ts:109 | ✓ |
| KAN-C-01 | kanban.component.spec.ts:207, kanban.component.spec.ts:297 | ✓ |
| KAN-C-02 | kanban.datasource.spec.ts:73 | ✓ |
| KAN-C-03 | kanban.datasource.spec.ts:95 | ✓ |
| KAN-C-04 | kanban.datasource.spec.ts:104, kanban.datasource.spec.ts:127 | ✓ |
| KAN-C-05 | kanban.datasource.spec.ts:151, kanban.datasource.spec.ts:346 | ✓ |
| KAN-C-06 | kanban.datasource.spec.ts:167 | ✓ |
| KAN-C-07 | kanban.datasource.spec.ts:184 | ✓ |
| KAN-C-08 | kanban.datasource.spec.ts:197 | ✓ |
| KAN-C-09 | kanban.datasource.spec.ts:215 | ✓ |
| KAN-C-10 | kanban-pipeline.spec.ts:181, kanban-pipeline.spec.ts:198, kanban.component.spec.ts:431 | ✓ |
| KAN-C-11 | kanban-pipeline.spec.ts:211, kanban-pipeline.spec.ts:238, kanban.review.spec.ts:263 | ✓ |
| KAN-C-12 | kanban-pipeline.spec.ts:252, kanban.component.spec.ts:185 | ✓ |
| KAN-C-13 | kanban.datasource.spec.ts:257, kanban.datasource.spec.ts:273 | ✓ |
| KAN-C-14 | kanban.interaction.spec.ts:123, kanban.interaction.spec.ts:182, kanban.interaction.spec.ts:267 | ✓ |
| KAN-C-15 | kanban.interaction.spec.ts:167, kanban.interaction.spec.ts:196 | ✓ |
| KAN-C-16 | kanban.interaction.spec.ts:223 | ✓ |
| KAN-C-17 | kanban.component.spec.ts:373, kanban.component.spec.ts:553, kanban.component.spec.ts:568 | ✓ |
| KAN-C-18 | kanban.interaction.spec.ts:255 | ✓ |
| KAN-C-19 | kanban.interaction.spec.ts:209, kanban.review.spec.ts:269 | ✓ |
| KAN-SC-01 | kanban.component.spec.ts:452, kanban.datasource.spec.ts:333 | ✓ |
| KAN-SC-02 | kanban.component.spec.ts:227, kanban.utils.spec.ts:45 | ✓ |
| KAN-SC-03 | kanban.component.spec.ts:237, kanban.utils.spec.ts:45 | ✓ |
| KAN-SC-04 | kanban.types.spec.ts:37 | ✓ |
| KAN-SC-05 | kanban.types.spec.ts:37 | ✓ |
| KAN-SC-06 | kanban-pipeline.spec.ts:129, kanban-pipeline.spec.ts:145 | ✓ |
| KAN-SC-07 | kanban-pipeline.spec.ts:118 | ✓ |
| KAN-SC-08 | kanban-pipeline.spec.ts:161 | ✓ |
| KAN-SC-09 | kanban-pipeline.spec.ts:276, kanban.component.spec.ts:215 | ✓ |
| KAN-SC-10 | kanban-pipeline.spec.ts:277 | ✓ |
| KAN-SC-11 | kanban-pipeline.spec.ts:278, kanban.component.spec.ts:264 | ✓ |
| KAN-SC-12 | kanban-pipeline.spec.ts:279, kanban.types.spec.ts:23 | ✓ |
| KAN-SC-13 | kanban-pipeline.spec.ts:280, kanban.component.spec.ts:264 | ✓ |
| KAN-SC-14 | kanban-pipeline.spec.ts:332 | ✓ |
| KAN-SC-15 | kanban-pipeline.spec.ts:347, kanban.component.spec.ts:307, kanban.component.spec.ts:321, kanban.component.spec.ts:719, kanban.datasource.spec.ts:312 | ✓ |
| KAN-SC-16 | kanban-pipeline.spec.ts:391, kanban.datasource.spec.ts:215 | ✓ |
| KAN-SC-17 | kanban-pipeline.spec.ts:402 | ✓ |
| KAN-SC-18 | kanban-pipeline.spec.ts:503 | ✓ |
| KAN-SC-22 | kanban.datasource.spec.ts:287 | ✓ |
| KAN-SC-23 | kanban.datasource.spec.ts:197 | ✓ |
| KAN-SC-24 | kanban.datasource.spec.ts:215, kanban.datasource.spec.ts:246 | ✓ |
| KAN-SC-25 | kanban.datasource.spec.ts:301 | ✓ |
| KAN-SC-26 | kanban.interaction.spec.ts:89, kanban.interaction.spec.ts:123 | ✓ |
| KAN-SC-27 | kanban.interaction.spec.ts:136 | ✓ |
| KAN-SC-28 | kanban.interaction.spec.ts:148 | ✓ |
| KAN-SC-29 | kanban-pipeline.spec.ts:315, kanban.component.spec.ts:624, kanban.interaction.spec.ts:278 | ✓ |
| KAN-SC-30 | kanban.component.spec.ts:529, kanban.component.spec.ts:572 | ✓ |
| KAN-SC-31 | kanban.component.spec.ts:497, kanban.component.spec.ts:511 | ✓ |
| KAN-SC-32 | kanban.compact.spec.ts:45, kanban.compact.spec.ts:60, kanban.compact.spec.ts:68 | ✓ |
| KAN-SC-33 | kanban.compact.spec.ts:74 | ✓ |
| KAN-SC-34 | kanban.compact.spec.ts:94 | ✓ |
| KAN-SC-35 | kanban.compact.spec.ts:100 | ✓ |
| KAN-SC-36 | kanban.compact.spec.ts:107 | ✓ |
| KAN-SC-37 | kanban.i18n.spec.ts:4 | ✓ |
| KAN-SC-38 | kanban.compact.spec.ts:116, kanban.component.spec.ts:740 | ✓ |
| KAN-R-01 | kanban.component.spec.ts:250, kanban.component.spec.ts:353 | ✓ |
| KAN-R-02 | kanban.component.spec.ts:281, kanban.component.spec.ts:331 | ✓ |
| KAN-R-03 | kanban-pipeline.spec.ts:376 | ✓ |
| KAN-R-04 | kanban.component.spec.ts:420, kanban.component.spec.ts:608 | ✓ |
| KAN-R-05 | kanban.component.spec.ts:529, kanban.component.spec.ts:572, kanban.component.spec.ts:589 | ✓ |
| KAN-R-06 | kanban.component.spec.ts:511 | ✓ |
| KAN-R-07 | kanban.component.spec.ts:649, kanban.component.spec.ts:665, kanban.component.spec.ts:686, kanban.component.spec.ts:695 | ✓ |
| KAN-R-08 | kanban.component.spec.ts:444 | ✓ |
| KAN-R-09 | kanban.component.spec.ts:82, kanban.component.spec.ts:91, kanban.component.spec.ts:109, kanban.component.spec.ts:152, kanban.component.spec.ts:166, kanban.component.spec.ts:172, kanban.component.spec.ts:361, kanban.component.spec.ts:708 | ✓ |
| KAN-E-01 | kanban.e2e.ts:130, kanban.e2e.ts:250, kanban.e2e.ts:264 | ✓ |
| KAN-E-02 | kanban.e2e.ts:144 | ✓ |
| KAN-E-03 | kanban.e2e.ts:157 | ✓ |
| KAN-E-04 | kanban.e2e.ts:170 | ✓ |
| KAN-E-05 | kanban.e2e.ts:179 | ✓ |
| KAN-E-06 | kanban.e2e.ts:194 | ✓ |
| KAN-E-07 | kanban.e2e.ts:208 | ✓ |
| KAN-E-08 | kanban.e2e.ts:362 | ✓ |
| KAN-E-09 | kanban.e2e.ts:225, kanban.e2e.ts:325 | ✓ |
| KAN-E-10 | kanban.e2e.ts:240 | ✓ |
| KAN-B-01 | kanban-pipeline.spec.ts:455 | ✓ |
| KAN-B-02 | kanban-pipeline.spec.ts:466 | ✓ |
| KAN-B-03 | kanban-pipeline.spec.ts:480 | ✓ |
| KAN-B-04 | kanban-pipeline.spec.ts:491 | ✓ |
| KAN-B-05 | kanban-pipeline.spec.ts:497 | ✓ |
| KAN-B-06 | kanban.component.spec.ts:118 | ✓ |
| KAN-B-07 | kanban.component.spec.ts:139 | ✓ |
| KAN-B-08 | kanban.review.spec.ts:97 | ✓ |
| KAN-B-09 | kanban.review.spec.ts:329, kanban.review.spec.ts:357 | ✓ |
| KAN-B-10 | kanban.review.spec.ts:381 | ✓ |
| KAN-B-11 | kanban.review.spec.ts:187 | ✓ |
| KAN-B-12 | kanban.review.spec.ts:279, kanban.review.spec.ts:398 | ✓ |
| KAN-B-13 | kanban.review.spec.ts:210 | ✓ |
| KAN-B-14 | kanban.review.spec.ts:475 | ✓ |
| KAN-B-15 | kanban.review.spec.ts:491 | ✓ |
| KAN-B-16 | kanban.review.spec.ts:220 | ✓ |
| KAN-B-17 | kanban.review.spec.ts:503 | ✓ |
| KAN-B-18 | kanban.review.spec.ts:124 | ✓ |
| KAN-B-19 | kanban.review.spec.ts:226 | ✓ |
| KAN-B-20 | kanban.review.spec.ts:515 | ✓ |
| KAN-B-21 | kanban.review.spec.ts:524 | ✓ |
| KAN-B-22 | kanban.review.spec.ts:248, kanban.review.spec.ts:535 | ✓ |
| KAN-B-23 | kanban.review.spec.ts:437 | ✓ |
| KAN-B-24 | kanban.review.spec.ts:237 | ✓ |
| KAN-T-01 | kanban.types.spec.ts:23 | ✓ |
| KAN-T-02 | kanban.types.spec.ts:37 | ✓ |
| KAN-T-03 | kanban.types.spec.ts:54 | ✓ |

## Spec cũ trên main → mã mới (TESTING §7.3)
Theo kế hoạch Bước 0 mục E; mọi mã ở cột phải có trong bảng trên.

`kanban.component.spec.ts`:
| Spec | Xử lý | Mã mới |
| --- | --- | --- |
| 7 test "wave 1 look" (làn trung tính, chấm màu, chấm trong làn thu gọn, số đếm, thẻ không bóng, công cụ thẻ ẩn khi hover, làn đang kéo + khe nét đứt) | Sửa fixture; test khe nét đứt chỉ cho `reorder: true`, thêm biến thể `reorder: false` (không khe, dấu chỗ cũ) | KAN-R-09, KAN-C-11, -12 |
| commits a local move once and emits the complete dataset | Sửa: không còn chế độ local không có `onMove`; `onMove` trả true thì dữ liệu đổi và phát `sdMove`. Bỏ phần `sdChange`/dataset | KAN-SC-09 |
| waits for confirmation and blocks duplicate and competing moves | Sửa | KAN-R-01, KAN-SC-14 |
| keeps data on rejection or thrown persistence error | Sửa | KAN-SC-11, -13 |
| discards a late response when new input data arrives | Sửa (`items` mới) | KAN-R-02 |
| aborts on destruction and never emits a late successful move | Sửa | KAN-SC-15 |
| blocks movement when disabled / readonly / loading / error | Sửa disabled, readonly; **xoá** biến thể `loading`, `error` (input bị bỏ) | KAN-SC-15 |
| invalidates an async result when model / option / columns is replaced | Sửa (`items` thay `model`), thêm biến thể `reload(columnId)` ở `dataSource` | KAN-R-02, KAN-SC-15 |
| honors permission veto before calling persistence (`canMove`) | Viết lại cho `movable`, `droppable` đánh giá lại trước `onMove` | KAN-SC-06, -08 |
| releases the pending lock after rejection so a retry can succeed | Sửa | KAN-R-01 |
| renders full and filtered counts without changing model order | Sửa | KAN-R-09 |
| resolves filtered drag insertion using the full-data anchor | Sửa cho `reorder: true`, kiểm `beforeId` | KAN-U-06, KAN-C-12 |
| routes keyboard reordering through the same move pipeline | Sửa cho `reorder: true`; thêm `reorder: false` (Alt + ↑ ↓ không làm gì) | KAN-C-11 |
| routes movement menu actions through the same move pipeline | Sửa | KAN-C-10 |
| preserves collapsed data and expands a collapsed destination | Sửa | KAN-R-08 |
| fails closed for duplicate IDs and unknown columns | Sửa | KAN-SC-01, KAN-U-04 |
| ignores an unchanged filtered slot (trailing / interleaved) | Sửa cho `reorder: true` | KAN-U-03 |
| keeps an API move in another board from taking focus | Sửa | KAN-R-06, KAN-SC-31 |
| preserves focus in an outside input after a pending keyboard move is accepted / rejected / failed | Sửa, thêm `'cancel'` | KAN-R-05, KAN-SC-30 |
| draws the board search with the shared search field | Sửa: chỉ khi `searchable`; thêm test mặc định false | KAN-C-17 |
| preserves focus moved to this board search while pending | Sửa | KAN-SC-30 |
| does not restore queued focus after the user focuses and blurs another control | Sửa | KAN-R-05 |
| restores the initiating handle after acceptance / rejection when pending disables it | Đổi sang nút tên | KAN-R-04, KAN-SC-29 |
| restores the moved handle after an asynchronous menu action closes its overlay | Đổi sang nút tên | KAN-SC-29 |
| card-anchored move feedback (4 test) | Sửa | KAN-R-07 |
| applies the column palette through data-color | Giữ | — |
| removes its pending focus listener on destroy / replace | Giữ | KAN-SC-15 |

`kanban.utils.spec.ts`:
| Spec | Xử lý | Mã mới |
| --- | --- | --- |
| maps arbitrary domain fields immutably and inserts before a full-data anchor | Viết lại (không còn ánh xạ) | KAN-U-02, KAN-SC-02, -03 |
| reorders within a column without mapping or losing unrelated cards | Sửa | KAN-U-03 |
| keeps numeric and string IDs distinct | **Xoá** (id chỉ là `string`, bỏ `SdKanbanId`) | — |
| reorders falsy generic items rather than treating them as missing | **Xoá** (thẻ luôn là object) | — |
| fails closed on duplicate, unmapped or throwing domain mappings | Viết lại theo §8 (không còn hàm ánh xạ ném lỗi) | KAN-U-04 |
| ignores no-op, missing identity, disabled target and invalid insertion positions | Sửa | KAN-U-01, -03 |

## E2E (TESTING §7.4, §11)
| Mã | Kịch bản | Kết quả |
| --- | --- | --- |
| KAN-E-01 | Đơn hàng: bắt đầu kéo DH-1001, Hoàn tất mờ (`data-blocked`), Đang giao nhận; axe; dark, RTL, forced colors; ảnh các trạng thái | ✓ |
| KAN-E-02 | Thả vào Đang giao, Hoàn tác trên toast: về Chờ xác nhận, số đếm hai cột đúng | ✓ |
| KAN-E-03 | Kéo sang Đã huỷ (mở cột), đóng hộp lý do: `'cancel'`, về chỗ cũ, không lỗi | ✓ |
| KAN-E-04 | Xem thêm tới hết trang: nút biến mất, số đếm theo `total` | ✓ |
| KAN-E-05 | Lỗi cột Đang giao, Thử lại; cột khác vẫn kéo được | ✓ |
| KAN-E-06 | Bấm thẻ mở drawer đúng đơn; di chuột 3 px vẫn là bấm | ✓ |
| KAN-E-07 | Chỉ bàn phím: Tab tới thẻ, Enter, `Alt` + `→`, focus theo thẻ | ✓ |
| KAN-E-08 | 390 px, `hasTouch`: chạm chọn, giữ 400 ms kéo, vuốt ngang cuộn board | ✓ |
| KAN-E-09 | Công việc `reorder: true`: khe nét đứt, `beforeId: null` khi thả cuối cột, `"BE-023"` khi thả lên đầu; 4 × 200 thẻ (đo §10) | ✓ |
| KAN-E-10 | Board trong cột 400 px của trang desktop: `data-compact` | ✓ |

KAN-E-07 (sau R2): đi bằng `Tab` từ ô tìm kiếm qua vùng board và nút thu gọn làn đầu tới thẻ DH-1001, Enter mở drawer, focus vẫn trên thẻ, rồi `Alt` + `→`.

Lỗi console: mỗi lần mở trang có 2 dòng `404`; E2E ghi URL từ sau R2: `GET /docs/versions.json`, registry docs của showcase (trên Pages lấy từ `published-docs/`), dev server không phục vụ. Không thuộc kanban.

Chập chờn đã xử lý: KAN-E-09 đỏ khoảng 1/10 lần khi máy tải nặng. Nguyên nhân (đo bằng script lặp 60 lần với 3 tiến trình): test ghim board bằng `position: fixed`, còn trang docs tự cuộn (scroll anchoring khi các khối `@defer` render). CDK dời rect đã cache của danh sách theo lần cuộn đó, nên lúc thả `isPointerOverContainer` là `false`. Board thật không bị ghim nên cuộn theo trang, không có lỗi này. `frame()` trong E2E giờ tắt smooth scroll và `overflow-anchor`, rồi chờ trang đứng yên: 0/60 lỗi, E2E lặp 20/20.

## Hiệu năng (TESTING §10)
Kịch bản: ví dụ Công việc, nút "200 thẻ mỗi cột" (4 × 200 thẻ `items`), template thẻ của ví dụ (badge, avatar, 2 icon, nút actions). Render đo trong trang: từ lúc bấm tới hết khung hình hiện 800 thẻ (`requestAnimationFrame` rồi `setTimeout(0)`), 5 lần, trung vị. Kéo: `PerformanceObserver('longtask')` trong một lần kéo OPEN-1 sang In progress.

| Đo | Kết quả | Ngân sách |
| --- | --- | --- |
| Render 800 thẻ, dev server | 1208–1323 ms (trung vị 5 lần, hai project) | ≤ 150 ms — **vượt** |
| Render 800 thẻ, production build (`ng build showcase --configuration production`, server tĩnh) | 1207–1403 ms (3 lần E2E); 830–880 ms đo riêng bằng CDP | ≤ 150 ms — **vượt** |
| Long task khi kéo, production build | 6–8 task, đa số 50–65 ms; 105–135 ms lúc nhấc thẻ và lúc thả | không task > 50 ms — **vượt** |
| Long task khi kéo, dev server, sau sửa R2 (chỗ cũ vẽ cả nội dung thẻ, KAN-B-18) | 5–6 task, 54–125 ms; lúc nhấc thẻ 168–174 ms | không task > 50 ms — **vượt** |
| Dev server ở `f3f8b595` (máy đang chạy việc khác song song, số dao động) | render trung vị 1390–1520 ms; long task 50–210 ms | **vượt** |
| Long task khi kéo, trước tối ưu (dev server và production build) | 15–17 task 55–210 ms | |
| A-15 (PD 11/11/2026), dev server, cùng máy, 3 lần: trước `sd-kanban-card-outlet` | render trung vị 1038–1343 ms; long task `[54,182,118,120,79]`, `[154,79,92,66]`, `[127,87,91,66]` | **vượt** |
| A-15, dev server, 3 lần: sau `sd-kanban-card-outlet` (template thẻ trong outlet OnPush, context ổn định) | render trung vị 1047–1348 ms; long task `[65,158,94,97,74]`, `[69,124,95,91,53]`, `[50,122,86,91,55]` | **vượt**; task lớn nhất giảm ~15%, các task khác gần mức dao động |

Đã làm (commit `ffdf5515`):
- Một `mat-menu` chung cho board thay vì một menu mỗi thẻ (thẻ truyền vào qua `matMenuTriggerData`); `movable` và token id tính sẵn trong `CardView`, template không gọi method theo thẻ. Render dev 2,1 s → 1,8 s.
- `contain: paint` trên thẻ: phần định vị của thẻ (lớp phủ nút tên, ⋯, actions) nằm trong stacking context của thẻ. `elementFromPoint` trên board 800 thẻ 14 ms → 4 ms; khung hình sau khi đổi viền một thẻ 40 ms → ~17 ms; long task khi kéo 16 → 5–8. Đổi lại: nội dung thẻ bị cắt theo khung thẻ (ghi trong `sd-kanban.md`; menu, tooltip của Core UI nằm trong overlay nên không ảnh hưởng).

Phân tích phần còn lại (trace Chrome, production build):
- Render: ~590 ms JS change detection (tạo 800 view thẻ, mỗi thẻ có `cdkDrag`, `MatMenuTrigger`, `sd-icon`, cộng template của ví dụ: `sd-badge`, `sd-avatar`, 2 `sd-icon`, `sd-button`), ~190 ms style + layout, ~200 ms paint/layerize. Template của ví dụ nặng hơn khung thẻ của kanban (profile dev, thời gian gộp: SdButton ~80 ms, SdIcon ~65 ms, SdBadge ~60 ms, SdAvatar ~47 ms; template thẻ của kanban ~157 ms, trong đó `CdkDrag` ~31 ms, `MatMenuTrigger` ~23 ms).
- Kéo: lúc nhấc và lúc thả, CD của cả board chạy lại mọi binding của 800 thẻ (signal đổi ở cấp board); giữa chừng là HitTest + Layerize của trang 37.000 px.

Đề xuất (cần PD chốt, không tự làm):
1. Tách thẻ thành component con OnPush nhận `CardView`, để signal cấp board (đang kéo, đang chọn, đang chờ) chỉ làm mới đúng thẻ liên quan. Giảm CD lúc nhấc, thả; không đổi API.
2. `content-visibility: auto` + `contain-intrinsic-size` trên thẻ: bỏ style, layout, paint của thẻ ngoài màn hình. Cần kiểm CDK đo vị trí thẻ chưa vẽ khi tự cuộn lúc kéo.
3. Virtual scroll theo làn (ngoài phạm vi `kanban.md` §0; TESTING §10 cấm tự thêm).
4. Khuyến nghị cho consumer trong `sd-kanban.md`: cột dài dùng `dataSource` + `pageSize` (đã ghi ở "Limits").

A-15 (PD 11/11/2026, nhánh `perf/kanban-card-outlet`): làm đề xuất 1 ở dạng ít rủi ro. `<article>` của thẻ và style vẫn ở board; template thẻ và template actions của consumer nằm trong `sd-kanban-card-outlet` (OnPush, `display: contents`), mỗi thẻ một object context ổn định (`[KAN-B-40]`). Số đo ở bảng trên: render không đổi (chi phí là tạo 800 view, OnPush không giảm), long task lớn nhất lúc nhấc thẻ giảm ~15%.

Vì sao ít: listener trong template của kanban (`click`, `keydown`, `cdkDragStarted`, `cdkDragEnded`, `cdkDropListDropped`) đánh dấu dirty mọi view tổ tiên, cả component consumer. Khi consumer được check, Angular check lại mọi view được khai báo trong template của nó và chèn ở chỗ khác (transplanted view), tức 800 template thẻ, dù outlet là OnPush. Outlet chỉ tránh được lần check do signal của board (kết quả `onMove` trả về sau, `selectedId` đặt từ code, dữ liệu tải về). Bước tiếp, nếu PD muốn: nghe các sự kiện kéo trong code thay vì trong template, và đề xuất 2 (`content-visibility: auto`).

## Ảnh chụp (TESTING §9)
Thư mục `reports/kanban-screens/`, chụp từ project `asia-bangkok`, Chromium, vi, light trừ khi ghi khác. So với `Kanban Review.dc.html` mục 02–05.

| Mục thiết kế | Ảnh |
| --- | --- |
| 02 Board mới (dữ liệu P1, đang kéo) | `board-light.png` (cả board, có làn Đã huỷ thu gọn, summary, Xem thêm), `orders-dragging.png` (Hoàn tất mờ vì `droppable`, Đang giao nhận, chỗ cũ mờ .4), `orders-light.png`, `orders-dark.png`, `orders-rtl.png`, `orders-400.png` (compact theo host 400 px) |
| 03 Thẻ, 8 trạng thái | `card-default.png`, `card-hover.png`, `card-selected.png`, `card-focus.png`, `orders-dragging.png` (đang kéo, `reorder` tắt), `tasks-dragging-slot.png` (đang kéo, `reorder` bật, khe nét đứt), `card-saving.png`, `card-failed.png`. "Không dời được" (`movable` false): không có ảnh riêng, nhìn như Mặc định (chỉ khác con trỏ và menu khoá), kiểm bằng KAN-C-15. |
| 04 Ba kiểu làn khi kéo | `orders-dragging.png` (nhận, bị từ chối), `board-light.png` (thu gọn) |
| 05 Năm trạng thái tải | `load-first-page.png` (3 khối xương), `board-light.png` (Xem thêm), `load-more-loading.png` (đang tải thêm), `orders-column-error.png` (lỗi trang đầu) và `load-error-next-page.png` (lỗi trang sau), `load-empty.png` (Không có thẻ) |
| Forced colors | `orders-forced-colors.png` (thẻ chọn viền Highlight, làn CanvasText) |

Lệch có chủ đích: chữ trên thẻ của ví dụ là dữ liệu showcase (mã đơn, khách, tiền), không phải giờ tạo như HTML; nút ⋯ ẩn tới khi hover với chuột như main.

## Bỏ qua có lý do
- SC-19, SC-20, SC-21: N/A, kanban không có `create`.
- SC-04, SC-05, SC-39 → SC-45: kiểm ở review bằng đọc code và `check:scss-hex`, không có mã riêng (Bước 0 mục C). SC-41 (ngày giờ), SC-44 (slot thời gian): N/A cho kanban.
- Ma trận zone (TESTING §11): kanban không xử lý ngày giờ; E2E chạy ở hai project `asia-bangkok`, `utc` của repo. Chrome trên Windows bỏ qua biến `TZ` (ghi nhận của R2 calendar).
- Trình duyệt: cấu hình Playwright của showcase chỉ có Chromium.
