# sd-kanban · Bước 0 (G0)
Nhánh `feat/kanban-api` từ `main @ e501644f` (commit đầu: gói handoff).

> **PD đã duyệt ngày 09/11/2026 (R0): "Làm theo bạn đề xuất".** K1–K10 và năm câu hỏi cuối file theo cột "Đề xuất": một live region `role="status"`; checkpoint 5 dựng hai ví dụ showcase cho E2E; debounce 300ms trong component chỉ ở chế độ `dataSource`; chép `testing/schedule-testing.ts` của calendar; khi `reorder` tắt, placeholder của CDK cao 0 và component tự vẽ dấu chỗ cũ.
Đã đọc: `schedule-kanban/{PROMPT,SHARED-CONTRACT,TESTING,REVIEW}.md`, `design-kanban/{README,PROMPT,kanban}.md`, code `components/kanban/**` trên main, `sd-kanban.md`, showcase `pages/components/kanban`, `THEME.md` mục Kanban, `@angular/cdk@19.2.19` `fesm2022/drag-drop.mjs`.

## A. Mâu thuẫn và điểm cần PD chốt
| # | Điểm | Nguồn | Đề xuất |
| --- | --- | --- | --- |
| K1 | Node | `design-kanban/PROMPT.md` ghi `22.22.3`; `AGENTS.md`/CI `24.22.1`; máy `26.12.0`. | Như Q1 của calendar: CI `24.22.1` là chuẩn, local Node 26 và ghi rõ trong báo cáo. |
| K2 | Push, PR | `design-kanban/PROMPT.md` "Không push… khi mình chưa yêu cầu" và mở PR thường; `schedule-kanban/PROMPT.md` cho push + PR **draft** sau R2'. | Theo `schedule-kanban/PROMPT.md` (ưu tiên về nhánh, push, review). |
| K3 | Live region | §6 cho lỗi tải `role="alert"`; §11 "giữ một vùng như main"; main hiện có **ba** vùng live: dải lỗi board `role="alert"` (`kanban.component.html:43`), chữ "Chưa có thẻ"/"Không có thẻ phù hợp" `role="status"` (`:199`) và vùng thông báo `role="status" aria-live` (`:210`). SC-33 chỉ cho một. | Như Q2 của calendar: một vùng `role="status"` duy nhất; dải lỗi board, khối lỗi cột và chữ trống thành chữ thường; lỗi tải, từ chối, huỷ, lỗi lưu đọc qua vùng đó. Đổi hành vi a11y của main nên cần PD đồng ý. |
| K4 | Key "Thử lại" | §6, §11 "dùng lại key Thử lại chung"; repo **không có** key chung (`core.common.retry` không tồn tại; mỗi component có `retry` riêng: tree, data-state, job-progress…). | Thêm `core.component.kanban.retry` (5 locale), như calendar đã làm. |
| K5 | Thứ tự checkpoint | §15: E2E ở checkpoint 5, showcase 4 ví dụ ở checkpoint 6; E2E (KAN-E-01…10) chạy trên ví dụ Đơn hàng và Công việc của showcase. | Checkpoint 5 dựng luôn hai ví dụ showcase mà E2E cần (Đơn hàng, Công việc); checkpoint 6 thêm hai ví dụ còn lại, docs, CHANGELOG, sync. Hoặc dời E2E sang checkpoint 6. |
| K6 | Ai đang dùng kanban | README: "main chỉ có showcase dùng component này". Thực tế `portal-template` dùng `sd-kanban` API cũ (câu 4). | Không sửa repo khác. Ghi `portal-template` vào mục chuyển đổi của CHANGELOG và `sd-kanban.md`. |
| K7 | Placeholder khi `reorder` tắt | §6: "chỗ cũ của thẻ ở làn nguồn `opacity: .4`", không có khe ở làn đích. CDK chỉ có **một** placeholder và chuyển nó sang làn đang trỏ tới (câu 1). | Câu 1: placeholder của CDK cao 0 khi `reorder` tắt; component tự vẽ dấu chỗ cũ ở làn nguồn. |
| K8 | `keyword` debounce | §5.2 "debounce 300ms" ở component; câu 5 nói "theo cách của sd-table", mà sd-table **không debounce**: quick search chỉ gửi khi Enter (`sd-table.md` mục Quick search). | Câu 5: giữ §5.2 (debounce 300ms trong component, chỉ ở chế độ `dataSource`); chế độ `items` lọc ngay như main. |
| K9 | Vùng chạm | SC-36: kanban 40px. Main có 40px cho nút icon và nút chữ khi `pointer: coarse`. Nút tên phủ cả thẻ nên đủ lớn. | Giữ như main; nút "Xem thêm" (32px theo §6) lên 40px khi `pointer: coarse`. |
| K10 | Helper test dùng chung | TESTING §3: kanban dùng lại helper của calendar nếu import được. Helper (`testing/schedule-testing.ts`) chỉ có trên `feat/calendar`, chưa ở main. | Chép nguyên file đó (cùng nội dung) vào nhánh này ở G1. Nhánh nào merge sau thì rebase; nội dung trùng nên không xung đột. Không tạo phụ thuộc runtime. |

## B. Câu trả lời mục 16 của `kanban.md`

### 1. CDK: click sau khi kéo, và `cdkDropListSortingDisabled`
- **Click sau khi kéo.** Khi kéo bắt đầu (qua ngưỡng 5px), CDK chèn placeholder vào chỗ của `article`, ẩn `article` thật và chuyển nó ra cuối `body` (`drag-drop.mjs:1043–1060`). `mousedown` nằm trên nút tên của `article` thật; `mouseup` nằm trên phần tử dưới con trỏ (preview của CDK có `pointer-events: none`). Hai đích khác nhau nên trình duyệt phát `click` ở tổ tiên chung, không phải nút tên, và `sdSelect` không chạy. CDK 19 không tự chặn click (không có listener `click` trong `drag-drop.mjs`). Vẫn thêm cờ `#justDragged` (đặt ở `cdkDragEnded`, xoá ở lần `pointerdown` sau) như sd-calendar, để chắc ở mọi trình duyệt. Kiểm bằng `KAN-C-14` (kéo không phát `sdSelect`), `KAN-SC-26` (bấm-kéo 3px vẫn là bấm) và E2E `KAN-E-06`.
- **`cdkDropListSortingDisabled`.** CDK có một placeholder. Khi con trỏ vào làn khác, `DropListRef.enter()` chèn placeholder vào làn đó (`drag-drop.mjs:1200–1215`, `2439–2443`), kể cả khi `sortingDisabled`; quay về làn nguồn thì đặt lại đúng chỉ số ban đầu. Vì vậy placeholder của CDK **không** giữ được "chỗ cũ mờ .4 ở làn nguồn" khi con trỏ đang ở làn khác. Đề xuất khi `reorder` tắt:
  - `*cdkDragPlaceholder` là phần tử rỗng cao 0 (không có khe ở làn đích, không đẩy thẻ).
  - Component vẽ một khối `data-origin` (cùng chiều cao thẻ, `opacity: .4`, `aria-hidden`) ở chỗ cũ trong làn nguồn, từ `cdkDragStarted` tới `cdkDragEnded` (signal `draggingId`).
  - Làn nhận vẫn tô theo `cdk-drop-list-receiving`/`-dragging` như main.
  - `reorder` bật: giữ placeholder nét đứt như main.

### 2. Nút tên phủ thẻ bằng `::after` và `pointerdown` của CDK
- Không chặn. Pseudo-element thuộc về `button`, nên đích của `mousedown`/`touchstart` là nút tên, và sự kiện nổi lên `article` (root của `cdkDrag`). Không có `cdkDragHandle` thì CDK nhận mọi đích trong root. CDK chỉ `preventDefault` ở `mousedown` khi đích có `draggable`, nên nút vẫn nhận focus khi bấm.
- Vấn đề thật là chiều ngược lại: nút ⋯ và `sdKanbanCardActionsTemplate` (`z-index: 1`, trên lớp phủ) cũng nằm trong `article`, nên nhấn rồi rê trên chúng sẽ kéo thẻ. Đề xuất: vùng `.sd-kanban__card-tools` gọi `stopPropagation()` cho `mousedown` và `touchstart` (cách sd-calendar làm với tay nắm kéo mép), nên CDK không bắt đầu kéo từ đó; click và bàn phím của chúng giữ nguyên. Kiểm bằng `KAN-C-16`.
- Tab vào thẻ: mỗi thẻ có một điểm Tab ở nút tên, nút ⋯ là điểm Tab thứ hai như main. Tên đọc là `card.title` (hoặc nội dung template; template không được chứa control, có cảnh báo dev). Không cần cách khác.

### 3. `'cancel'` trong `#move` và focus
- `#move` giữ cấu trúc của main. Kết quả `'cancel'` đi đúng nhánh "từ chối" hiện có, trừ `#fail`: bỏ pending, xoá `#operation`, đọc `cancelled`, rồi `#focusCard(cardId, operation.focus)`. Không `sdMoveError`, không viền lỗi.
- Focus dùng chung `#trackFocus`/`#focusCard`, nên SC-29 (về nút tên của thẻ), SC-30 (người dùng chuyển focus đi thì giữ chỗ đó) và SC-31 (`'api'` không lấy focus) giữ nguyên như nhánh từ chối của main. Thay đổi duy nhất: `#focusCard` tìm `[data-kanban-card-main]` (nút tên) thay vì `[data-kanban-handle]`.
- Phân loại kết quả viết riêng trong kanban, không import `ɵsdCalendarCallMove` từ entry point calendar, để không tạo phụ thuộc giữa hai component. Kết quả tới sau khi bị huỷ vẫn qua `#current()` như main.

### 4. Repo khác dùng `@sdcorejs/angular/components/kanban`
| Repo | Chỗ dùng | API cũ đang dùng |
| --- | --- | --- |
| `portal-template` | `src/modules/component/features/kanban/kanban.component.{ts,html}`, e2e `e2e/core31-successor-operations.spec.ts`, `docs/core-demo-coverage.md` | `SdKanbanId`, `getId`, `getColumnId`, `getTitle`, `withColumn`, `option.move`, `searchable`, `collapsible`, `[(model)]`, `[loading]`, `[error]`, `(sdRetry)`, `let-item` trong `sdKanbanCardTemplate`. Pin `@sdcorejs/angular` `22.3.1`. |
| `sdcorejs-blueprint`, `chaos-ui`, `sdcorejs-link-insight` | Không có | — |

Trong repo này, ngoài component: showcase (trang kanban, registry, file sinh), `components/index.ts`, `src/public-api.spec.ts`, `THEME.md`, `forms/directives/sd-form-directives.md` (nhắc ô tìm của kanban), `scripts/core-theme.test.mjs` và `theme-contrast.test.mjs` (chỉ token, không đổi). Không sửa repo khác; CHANGELOG ghi `portal-template` cần đổi khi nâng phiên bản.

### 5. Debounce `keyword`
sd-table không debounce: quick search gửi khi Enter, gõ không gửi. Đề xuất giữ `kanban.md` §5.2: component debounce 300ms **chỉ ở chế độ `dataSource`** (với mọi nguồn đổi `keyword`: ô tìm có sẵn hoặc model từ consumer), huỷ mọi lần tải đang chạy rồi tải lại các cột đã tải từ `cursor: null`. Chế độ `items` lọc ngay như main. Lý do không theo sd-table: đổi ô tìm của kanban sang Enter là đổi hành vi của main mà spec không yêu cầu. Cần PD chốt (K8).

## C. Kế hoạch file và commit (6 checkpoint, `kanban.md` §15)
Mỗi checkpoint: commit `test(kanban): … RED`, rồi commit code, rồi lệnh nhanh (`--include='**/components/kanban/**/*.spec.ts'`) và lint xanh. Commit đổi API dùng `feat(kanban)!:`.

| CP | Nội dung | File chính | Mã test (RED trước) |
| --- | --- | --- | --- |
| 1 | Model mới (§3), context template, `kanban.utils.ts` (vị trí sau dời, kiểm tra dữ liệu, cột kế cho Alt + ← →), component chạy lại chế độ `items` | `kanban.model.ts`, `kanban.templates.ts`, `kanban.utils.ts`, `kanban.component.ts/html`, `kanban.utils.spec.ts`, `kanban.types.spec.ts`, `testing/schedule-testing.ts` (chép, K10) | KAN-U-01…06, KAN-C-01, KAN-SC-01, -02, -03, KAN-R-09; spec cũ sửa theo API mới |
| 2 | `option.move = { movable, droppable, reorder, onMove }`, `'cancel'`, `move(cardId, { columnId, beforeId? }, source)`, điều kiện huỷ `#current` mới | `kanban.component.ts/html/scss`, `kanban.component.spec.ts`, `kanban-pipeline.spec.ts` | KAN-SC-06…18, KAN-C-10, -11, -12, KAN-R-01…08 |
| — | **R1** (review độc lập sau API và render) | | |
| 3 | Chọn thẻ, kéo cả thẻ, nút tên phủ thẻ, bỏ tay nắm, bàn phím, focus, cảnh báo template có control | như trên, `kanban.interaction.spec.ts` | KAN-SC-26…31, KAN-C-14, -15, -16, -18, -19 |
| 4 | `dataSource` theo cột: tải, Xem thêm, `loadMore: 'auto'`, lỗi trang đầu và trang sau, `total`, `summary`, `keyword`, `columns` mới, `reload()` | `kanban-loader.ts` (mới, mục D), `kanban.datasource.spec.ts` | KAN-C-02…09, -13, KAN-SC-15 (reload, option), -16, -22, -23, -24, -25 |
| 5 | Compact theo host, i18n 5 locale, a11y, E2E (và hai ví dụ showcase mà E2E cần, K5) | `kanban.component.scss`, `i18n/src/*.ts`, `kanban.i18n.spec.ts`, `kanban.compact.spec.ts`, `showcase/e2e/components/kanban.e2e.ts` | KAN-SC-32, -33, -34, -35, -37, -38, KAN-C-17, KAN-E-01…10 |
| 6 | `sd-kanban.md` viết lại (bảng chuyển đổi), `CHANGELOG.md`, showcase đủ 4 ví dụ, `npm run sync`, `check:sync` | `sd-kanban.md`, `CHANGELOG.md`, `showcase/src/app/pages/components/kanban/**`, registry | — |
| — | G-final (lệnh đầy đủ, E2E ma trận, a11y tay, ảnh, hiệu năng 4 × 200 thẻ, `reports/kanban-tests.md`), R2, R2', PR draft | | |

Mã hợp đồng chung cho kanban: SC-01…03, 06…18 và 22…38 có test `KAN-SC-xx`. N/A: SC-19…21 (kanban không có `create`). SC-04, 05, 39…45 kiểm ở review (đọc code, `check:scss-hex`), không có mã riêng.

## D. State theo cột ở chế độ `dataSource`, và nối với `#current`
- Một lớp nhỏ trong entry point kanban, `ɵSdKanbanColumnLoader` (`src/kanban-loader.ts`, không export public), giữ `signal<ReadonlyMap<string, ColumnState<T>>>`. Mỗi lần đổi tạo `Map` mới, nên `computed` của board chạy lại đúng một lần.
  ```ts
  interface ColumnState<T> {
    readonly cards: readonly SdKanbanCard<T>[];
    readonly nextCursor: string | null;
    readonly total: number | null;
    readonly summary: string | null;
    readonly status: 'idle' | 'loading' | 'loading-more' | 'error';
    readonly error: unknown;
    readonly failedCursor: string | null; // cursor của lần tải lỗi; Thử lại gọi lại đúng nó
    readonly generation: number;          // tăng ở mỗi lần tải lại từ cursor null
  }
  ```
  `AbortController` của từng cột giữ ngoài signal (`Map<string, AbortController>`), vì không phải dữ liệu hiển thị.
- Method: `load(columnId)`, `loadMore(columnId)`, `reload(columnId?)`, `retry(columnId)`, `abort(columnId?)`, `applyMove(request)` (bỏ khỏi nguồn, `total` −1; vào đầu đích hoặc trước `beforeId`, `total` +1). Effect của component: `columns` đổi thì tải cột mới, huỷ cột bỏ; `option` đổi thì `reload()`; `keyword` đổi thì debounce 300ms rồi `reload()` các cột đã tải; mở cột thu gọn chưa tải thì `load`.
- Chế độ `items`: không dùng effect ghi signal. `#local = signal<{ source; cards } | null>`, và `cards = computed(() => local?.source === items() ? local.cards : items())`. `items` tham chiếu mới tự thay bản sao.
- `#current(operation)` giữ các điều kiện của main (`#destroyed`, `#operation`, `signal.aborted`, `option`, `columns`, `locked`), thay `this.model() === request.previousItems` bằng:
  - chế độ `items`: `this.items() === operation.items` (tham chiếu lúc bắt đầu);
  - chế độ `dataSource`: `generation` của cột nguồn và cột đích không đổi so với lúc bắt đầu (tức chưa bị tải lại bởi `reload`, `keyword`, `option`). `loadMore` không đổi `generation`, nên tải thêm trang không huỷ thao tác chờ.

  Effect trong constructor theo dõi cùng các giá trị đó và gọi `#cancel()` như main.

## E. Spec hiện có: sửa, xoá, thêm
`kanban.component.spec.ts` (main):
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

`kanban.utils.spec.ts` (main):
| Spec | Xử lý | Mã mới |
| --- | --- | --- |
| maps arbitrary domain fields immutably and inserts before a full-data anchor | Viết lại (không còn ánh xạ) | KAN-U-02, KAN-SC-02, -03 |
| reorders within a column without mapping or losing unrelated cards | Sửa | KAN-U-03 |
| keeps numeric and string IDs distinct | **Xoá** (id chỉ là `string`, bỏ `SdKanbanId`) | — |
| reorders falsy generic items rather than treating them as missing | **Xoá** (thẻ luôn là object) | — |
| fails closed on duplicate, unmapped or throwing domain mappings | Viết lại theo §8 (không còn hàm ánh xạ ném lỗi) | KAN-U-04 |
| ignores no-op, missing identity, disabled target and invalid insertion positions | Sửa | KAN-U-01, -03 |

Thêm: `kanban.types.spec.ts` (union `onMove`, context template, `items` sai kiểu), `kanban.i18n.spec.ts`, `kanban-pipeline.spec.ts`, `kanban.interaction.spec.ts`, `kanban.datasource.spec.ts`, `kanban.compact.spec.ts`, E2E `showcase/e2e/components/kanban.e2e.ts`. Bảng ánh xạ spec cũ sang mã mới đưa vào `reports/kanban-tests.md` (TESTING §7.3).

## F. Bổ sung của cổng G0 (`schedule-kanban/PROMPT.md`)
- **Helper test dùng chung**: `testing/schedule-testing.ts` của calendar (K10): `deferred`, `FakeResizeObserver`, `FakeIntersectionObserver`, `mouseDrag`/`touchDrag`/`clickWithJitter`, `press`, `i18nParityProblems`. Fixture riêng của kanban ở `src/kanban.testing.ts` (chỉ spec dùng).
- **axe**: showcase không có `@axe-core/playwright`; `versions/v19/node_modules/axe-core` (4.13.0) có sẵn và calendar đã chạy axe bằng `page.addScriptTag` từ đó. Làm như calendar; không thêm dependency.
- **Playwright**: `showcase/playwright.config.ts` có hai project Chromium `asia-bangkok`, `utc` (không có Firefox/WebKit; ghi theo TESTING §11). Cảm ứng (KAN-E-08) bằng `test.use({ hasTouch: true, isMobile: true })`; cột 400px (KAN-E-10) trong ví dụ showcase. Ảnh chỉ ghi ở project Bangkok như calendar.
- **Hiệu năng**: kịch bản TESTING §10 (4 cột × 200 thẻ `items`, render ≤ 150 ms, kéo không có long task) bằng một nút trong ví dụ Công việc.

## G. Đổi khác main (ngoài phần đã ghi ở trên)
- Không thêm input, output ngoài §4. Bỏ: input `model`, `loading`, `error`; output `modelChange`, `sdChange`, `sdRetry`; kiểu `SdKanbanId`; `option.getId/getColumnId/getTitle/getSearchText/withColumn/filter/canMove/move()/searchable/collapsible`; `move(itemId, columnId, index?, source)`; key `move-card`.
- `data-autoid`: token thẻ và cột đổi từ `` `${typeof id}-${encodeURIComponent(id)}` `` sang `encodeURIComponent(id)` (§12), nên E2E của `portal-template` dùng autoId cũ cần sửa khi nâng phiên bản.
- Bỏ `@media (max-width: 599px)`, thay bằng `compact` theo bề rộng host (`ResizeObserver`).
- Không đổi token; `check:scss-hex` phải xanh.

## Câu hỏi cho PD (trả lời trước G1)
1. K3: một live region `role="status"` (bỏ `role="alert"` của dải lỗi và `role="status"` của chữ trống trên main)?
2. K5: dựng hai ví dụ showcase cho E2E ngay ở checkpoint 5, hay dời E2E sang checkpoint 6?
3. K8 / câu 5: debounce 300ms trong component chỉ ở `dataSource` (đề xuất), hay theo sd-table (Enter)?
4. K10: chép `testing/schedule-testing.ts` của calendar vào nhánh này?
5. Câu 1 / K7: khi `reorder` tắt, placeholder của CDK cao 0 và component tự vẽ dấu chỗ cũ ở làn nguồn?
