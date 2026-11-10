# kanban · R2 · phần A
Nhánh: feat/kanban-api · Commit: 56611d76 · Ngày: 2026-11-10
Reviewer: phiên mới, không có lịch sử của phiên tác giả.
Phạm vi phần A: mục 3.1, 3.2 (bảng `onMove` kiểm bằng đọc code và spec), 3.4, 3.5 (so ảnh), 3.6 của `REVIEW.md`. Mục 3.3 (chạy test, coverage, thử phá) thuộc phần B.
Chỉ đọc `reports/kanban-tests.md`, `kanban-a11y.md` sau khi xong 3.1. Đường dẫn file dưới đây tương đối với `versions/v19/projects/sdcorejs-angular/components/kanban/src/` nếu không ghi khác.

## Kết luận
Chặn: 2 · Nên sửa: 8 · Ghi chú: 12
Chưa được mở PR (phần A).

## Lệnh đã chạy
- `node --version` → v26.12.0 (K1: local Node 26, CI 24.22.1 là chuẩn).
- `npm run check:sync` → "Version workspace sync check passed: v20, v21, v22 match v19."
- `diff -rq` thư mục `components/kanban` và `testing/schedule-testing.ts` của v19 với v20, v21, v22 → v20, v21 trùng hết; v22 chỉ khác shim `ChangeDetectionStrategy.Eager` trong `kanban.interaction.spec.ts` và CRLF (`diff --strip-trailing-cr` rỗng).
- `git diff --name-only main...HEAD` → không có file `published-*`, `dist`, `package.json`.
- grep tên API đã bỏ (`getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`, `SdKanbanId`, `canMove`, `sdChange`, `sdRetry`, `previousItems`, `nextItems`) trong kanban, showcase, E2E, THEME → chỉ còn ở bảng chuyển đổi `sd-kanban.md:238-251` và test `[KAN-B-05]` (`kanban-pipeline.spec.ts:497`).
- grep `any`, `as unknown as`, `new Date`, `!important`, `::ng-deep`, hex, `@media (max-width` trong mã kanban → không có.
- Không chạy Karma, lint, build, E2E (phần B).

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chặn | kanban.md §3 `SdKanbanColumnTemplateContext`; §5.2; `sd-kanban.md:182`; CHANGELOG.md:92 | kanban.component.ts:588-597 (dòng 592, 594) | Context của `sdKanbanColumnTemplate` sai hai trường. `total` lấy `view.count` (`state.total ?? all.length`), không bao giờ `null`: đang tải lần đầu hoặc lỗi trang đầu thì là `0`. `summary` lấy `view.column.summary`, bỏ qua `LoadResult.summary` (§3: "Có dataSource thì LoadResult.summary ghi đè"). Tài liệu và CHANGELOG hứa `total` là `null` khi chưa biết. Không có test chạy thật cho context cột (chỉ type test). | Board `dataSource` có `sdKanbanColumnTemplate let-total="total" let-summary="summary"`; trước khi trang đầu về, `total` = 0; sau khi về với `summary: 'X'`, context vẫn là `column.summary`. | `total`: `null` khi `dataMode` và chưa `loaded` hoặc `status === 'error'` lần đầu; `summary: view.summary`. Thêm test context cột ở hai chế độ. |
| 2 | Chặn | SC-11 (thông báo có nút Bỏ qua), SC-36 (mọi hành động làm được bằng `pointer: coarse`), kanban.md §6 (lớp phủ nút tên) | kanban.component.scss:180-185 (`::after` phủ thẻ), :244-256 và :269-284 (dòng trạng thái và nút Bỏ qua không có `position`/`z-index`); kanban.component.html:216-222 | Lớp phủ `::after` của nút tên (`position: absolute; inset: 0`) vẽ trên mọi nội dung không định vị của thẻ. Chỉ `.sd-kanban__card-tools` và `.sd-kanban__card-actions` được nâng `z-index: 1`. Nút "Đóng"/Bỏ qua trong dòng lỗi của thẻ thất bại nằm dưới lớp phủ: bấm chuột hoặc chạm vào nó trúng nút tên, nên chọn thẻ (P1 mở drawer) thay vì bỏ lỗi. Bàn phím vẫn dùng được. Test `[KAN-R-07]` (`kanban.component.spec.ts:665-683`) gọi `button.click()` nên không qua hit test; `[KAN-C-16]` chỉ hit test ⋯ và actions. | Ví dụ "Async confirmation": dời một thẻ, bấm Reject, rồi bấm chuột vào "Đóng" trên thẻ. Hoặc `document.elementFromPoint` tại tâm nút "Đóng" trả về nút tên. | `.sd-kanban__card-status { position: relative; z-index: 1 }` (hoặc riêng nút Bỏ qua). Thêm hit test cho nút Bỏ qua vào `[KAN-C-16]`. |
| 3 | Nên sửa | kanban.md §7.5 bước 1 (danh sách lý do bỏ qua), §7.5 bước 4 (mở cột đích thu gọn), §7.3, §7.4; Ghi chú: cần PD chốt | kanban.component.ts:387-389; kanban.component.html:271-279; kanban.component.ts:571-577 | Chế độ `dataSource`: `#move` từ chối im lặng khi cột nguồn hoặc đích chưa tải xong trang đầu (`status === 'loading'` hoặc `!loaded`). Lý do này không có trong §7.5. Hệ quả: (a) mục menu "Chuyển đến Đã huỷ" (cột thu gọn chưa mở lần nào) vẫn bật nhưng bấm không làm gì, không đọc gì; (b) cột lỗi trang đầu không bị `Alt` + `→` bỏ qua, nên phím dừng ở đó và không làm gì; (c) kéo thả vào làn lỗi trang đầu được nhận rồi bỏ. E2E `[KAN-E-03]` phải mở cột Đã huỷ trước khi kéo. | Showcase "Orders": mở menu ⋯ của DH-1001, chọn "Chuyển đến Đã huỷ" khi cột còn thu gọn: không có hộp lý do, không có thông báo. | PD chốt hành vi: hoặc khoá mục menu và bỏ qua cột đó ở `Alt` + phím (và ghi vào §7.5, `sd-kanban.md`), hoặc cho dời rồi tải cột đích. Tối thiểu không để control bật mà không làm gì. |
| 4 | Nên sửa | kanban.md §5.2 (`loadMore: 'auto'`), SC-38 | kanban.component.ts:676-677; kanban.component.html:243 | `data-load-more` giữ token `encodeURIComponent(id)`, còn callback của `IntersectionObserver` truyền thẳng token đó vào `loadMore(id)`. Với id cột cần mã hoá (khoảng trắng, dấu, `/`), `#loader.loadMore` không tìm thấy cột và không tải. Test `[KAN-C-04]` chỉ dùng id ASCII. | `columns` có id `'đã huỷ'`, `loadMore: 'auto'`, cho nút lọt vào khung nhìn: không có lần gọi `onLoad` thứ hai. | Tra cột theo token (như `#announceBlockedDrop`) hoặc `decodeURIComponent`. Thêm ca id có ký tự cần mã hoá. |
| 5 | Nên sửa | kanban.md §6 (Số đếm), §11 | kanban.component.html:89; kanban.component.ts:247 | `aria-label` của số đếm dùng `view.count` (`state.total ?? all.length`). Khi chữ hiện "–" (chưa biết) trình đọc màn hình đọc "0 thẻ"; khi chữ hiện "5+" thì đọc "5 thẻ". `aria-label` ghi đè nội dung nên người dùng trình đọc nhận số sai. | Board `dataSource`, cột thu gọn chưa tải hoặc đang tải lần đầu: đọc tên của `.sd-kanban__count`. | Không đặt `aria-label` khi chưa biết, hoặc thêm chuỗi riêng cho "chưa biết" và "ít nhất n" (key mới cần PD đồng ý). |
| 6 | Nên sửa | TESTING §9, REVIEW 3.5 (lệch hình ảnh không giải thích); kanban.md §6 Header làn | kanban.component.scss:395-403 | Ảnh `orders-rtl.png`: nhãn cột nằm ở mép đầu (phải), dòng summary ("14,7 triệu ₫", "9 triệu ₫") nằm ở mép cuối (trái), sát số đếm. Hai dòng của khối nhãn không thẳng hàng. Nút tên có `text-align: start` nên thẻ đúng; `.sd-kanban__summary` không có, nhiều khả năng nhận `text-align: left` từ trang. Báo cáo không ghi đây là lệch có chủ đích. | `orders-rtl.png`, header các làn. | `text-align: start` cho `.sd-kanban__summary` (hoặc `.sd-kanban__heading`); chụp lại RTL. |
| 7 | Nên sửa | `Kanban Review.dc.html` §05 "Trống: … Có keyword thì ghi 'Không có thẻ khớp'"; TESTING §9 | kanban.component.html:226-228 | Chế độ `dataSource` có `keyword`, cột không có kết quả: `view.count` là `total` = 0 nên hiện `empty-column` ("Chưa có thẻ"), không phải `no-results`. Ảnh `load-empty.png` (chụp với keyword `DH-1002`) cho thấy đúng lỗi này; báo cáo ghi ảnh là "Không có thẻ". | `load-empty.png`; hoặc gõ từ khoá không khớp trong ví dụ Orders. | Ở `dataMode`, dùng `no-results` khi `keyword().trim()` khác rỗng. |
| 8 | Nên sửa | kanban.md §6 ("chỗ cũ của thẻ ở làn nguồn opacity .4"); `Kanban Review.dc.html` §02, §03 "Đang kéo"; TESTING §9 | kanban.component.html:141-146 | Dấu chỗ cũ khi `reorder` tắt chỉ vẽ `card.title` trong khối cao bằng thẻ. Thiết kế vẽ cả thẻ mờ .4 (mã, khách, tiền). Ảnh `orders-dragging.png`: ô DH-1001 chỉ có tiêu đề, phần dưới trống. Không có lý do trong báo cáo. | `orders-dragging.png`. | Vẽ lại nội dung thẻ (template) trong dấu chỗ cũ, hoặc ghi lý do (ví dụ hiệu năng) vào PR và để PD duyệt. |
| 9 | Nên sửa | kanban.md §6 Thẻ ("`grabbing` khi đang kéo"); `Kanban Review.dc.html` §02 (làn nhận `cursor: grabbing`) | kanban.component.scss:166-168 | `cursor: grabbing` đặt trên `.cdk-drag-preview`, nhưng CDK gán `pointer-events: none` cho preview (`@angular/cdk/fesm2022/drag-drop.mjs:421-424`), nên con trỏ không bao giờ lấy giá trị đó. Khi kéo, con trỏ là của phần tử bên dưới (`grab`, `pointer` hoặc mặc định). | Kéo một thẻ trong showcase, quan sát con trỏ. | Đặt `grabbing` theo `draggingId` trên board (hoặc làn), trừ làn bị từ chối giữ `not-allowed`. |
| 10 | Nên sửa | SC-01; R1 mục 18 (id chỉ có khoảng trắng coi là rỗng); kanban.md §8 (dataSource) | kanban-loader.ts:149 | Loader chỉ kiểm `!card.id`: id `'   '` hoặc id không phải chuỗi được nhận. Chế độ `items` dùng `blank()` (`kanban.utils.ts:86`) nên coi là rỗng. Hai chế độ lệch nhau. | `onLoad` trả thẻ `id: ' '`: thẻ hiện và kéo được. | Dùng cùng kiểm tra `typeof id === 'string' && id.trim()`; thêm ca vào `[KAN-SC-01]` dataSource. |
| 11 | Ghi chú: cần PD chốt | SC-27 | kanban.component.ts:315-318 | Effect SC-27 xoá `selectedId` ngay khi id chưa có trong `cards()`. Ở `dataSource` (hoặc `items` đến muộn), `selectedId` consumer đặt sẵn (deep link) bị về `null` trước khi trang đầu về. Spec ghi "không còn trong dữ liệu", không nói lúc chưa tải. | Board `dataSource`, `[selectedId]="'DH-1003'"` lúc khởi tạo: sau khi tải, không thẻ nào được chọn. | PD chốt: chỉ xoá khi cột chứa thẻ đã tải xong (hoặc sau lần tải đầu). |
| 12 | Ghi chú: cần PD chốt | SC-43 ("token --sd-* có fallback"), REVIEW 3.4 | kanban.component.scss:153, 397, 409, 417, 437, 446, 456, 462, 465 | Màu mới dùng `var(--sd-primary)`, `var(--sd-text-secondary)`, `var(--sd-surface-muted)`, `var(--sd-text)`, `var(--sd-error)` không có fallback. Mã có sẵn trên main cũng viết như vậy cho màu lõi. SC-43 và quy ước main mâu thuẫn. | — | PD chốt "có fallback" có áp cho 33 màu lõi của theme hay không. |
| 13 | Ghi chú | SC-36 (hover chỉ là lớp bổ sung `@media (hover: hover)`) | kanban.component.scss:422-424 | `:hover` của nút "Xem thêm" (mới) không nằm trong `@media (hover: hover)`; trên cảm ứng có thể dính nền hover. | — | Bọc trong `@media (hover: hover)`. |
| 14 | Ghi chú: cần PD chốt | SC-33 và kanban.md §8 ("Như main: sd-data-state") | kanban.component.html:39-42 | Trạng thái "Không có cột" (`sd-data-state` empty: `role="status" aria-live="polite"`) và "Dữ liệu không hợp lệ" (`role="alert" aria-live="assertive"`) thêm một vùng live thứ hai trong host. `[KAN-SC-33]` không thử hai trạng thái này. | `columns = []`: có hai phần tử `[aria-live="polite"]`. | PD chốt: chấp nhận vì §8 bảo giữ như main, hoặc dùng `sd-data-state` không role. |
| 15 | Ghi chú: cần PD chốt | TESTING §10 | reports/kanban-tests.md:183-202 | Ngân sách hiệu năng vượt: render 800 thẻ ~1,2 s (ngân sách 150 ms), long task khi kéo 50-135 ms. Tác giả đã báo và đề xuất (thẻ con OnPush, `content-visibility`). | — | PD chọn đề xuất hoặc chấp nhận cho bản này. |
| 16 | Ghi chú | TESTING §8, REVIEW 3.5 | reports/kanban-a11y.md:14-15 | Phóng to 200% và trình đọc màn hình chưa làm ("Chờ"). Phần A không chạy trình duyệt nên chưa làm lại phần tay. | — | Làm trước R2'. |
| 17 | Ghi chú | TESTING §9 | reports/kanban-screens/card-focus.png | Ảnh chụp theo khung `article`, nên vòng focus (offset 2px, nằm ngoài khung) bị cắt; ảnh không chứng minh trạng thái Focus của §03. | — | Chụp có lề (vùng làn hoặc `clip` rộng hơn). |
| 18 | Ghi chú | kanban.md §3 (`summary` chỉ đọc ở trang đầu), §6 Lỗi tải | kanban-loader.ts:136 | Lỗi khi tải lại trang đầu xoá `cards`, `total` nhưng giữ `summary` cũ. Ảnh `orders-column-error.png`: số đếm "–" nhưng vẫn hiện "14,7 triệu ₫". | `orders-column-error.png`. | Xoá `summary` cùng `total` khi trang đầu lỗi, hoặc ghi rõ là cố ý. |
| 19 | Ghi chú | REVIEW 3.6 (CHANGELOG, tài liệu) | CHANGELOG.md:178; sd-kanban.md:72-73 | `pendingId` trên main là `signal` ghi được, nay chỉ đọc: thay đổi nhỏ có thể phá consumer nhưng chỉ nằm ở Added ("exposes…", như thể mới). `sd-kanban.md` ghi `ariaLabel`, `autoId` kiểu `string`, mã là `string \| null \| undefined` (SC-39). | — | Thêm một dòng vào Changed (BREAKING); sửa kiểu trong bảng Inputs. |
| 20 | Ghi chú | kanban.md §5.2 (`loadMore: 'auto'`) | kanban.component.ts:309-313, 671-693 | `#observer` không ngắt khi `option` mới đổi `loadMore` từ `'auto'` sang `'button'`; các nút đang được theo dõi vẫn tự tải. | — | `disconnect()` khi `loadMore !== 'auto'`. |
| 21 | Ghi chú | SC-26, kanban.md §7.4 | kanban.component.ts:516-519 | `Space` được xử lý ở `keydown` có `preventDefault()`. E2E chỉ có Chromium; nên kiểm thêm Firefox/WebKit rằng `keyup` không phát `click` thứ hai (một `sdSelect` thừa). | — | Kiểm tay hoặc thêm test khi có trình duyệt khác. |
| 22 | Ghi chú | API, SC-39 | kanban.component.ts:105-108, 372 | Kiểu tham số `to` của `move()` là interface `MoveTarget` không export; consumer không gọi tên được. Khớp spec (spec viết kiểu inline). | — | Giữ, hoặc viết inline trong chữ ký. |

## Checklist

### 3.1 Theo spec (`kanban.md` §0–16)
| Mục | Kết quả | Ghi chú |
| --- | --- | --- |
| §0 Phạm vi | ✓ | API mới, `SdKanbanCard<T>`, `items`/`dataSource`, `option.move`, chọn, summary, Xem thêm, search tắt mặc định, compact theo host. Không swimlane, realtime, WIP, CRUD, virtual scroll, tự sắp xếp. |
| §1 File | ✓ | Thêm `kanban-loader.ts` (nội bộ, không export), spec tách file (Bước 0 mục E). |
| §2 Quy ước API | ✓ | |
| §3 Model | ✗ | Kiểu khớp từng trường; giá trị context cột sai (#1). |
| §4 Input, output, method | ✓ | Public: inputs `columns`, `option`, `items`, `keyword`, `searchable`, `collapsible`, `collapsedColumns`, `disabled`, `readonly`, `ariaLabel`, `autoId`, `selectedId`; outputs `sdSelect`, `sdMove`, `sdMoveError`, `sdLoadError` (+ `*Change` của model); method `reload`, `loadMore`, `move`; `id` (có trên main), `pendingId` chỉ đọc (PD R1). Không có tên ngoài spec. |
| §5.1 `items` | ✓ | `linkedSignal` thay bản sao theo tham chiếu (R1 B-01). |
| §5.2 `dataSource` | ✗ | #4 (`auto` với id mã hoá), #10 (id rỗng). Còn lại đúng: tải song song, cột thu gọn tải khi mở, `columns` mới, debounce 300ms, `option` mới, kết quả muộn, trùng id, sau khi dời. |
| §6 Bố cục | ✗ | #2 (lớp phủ che Bỏ qua), #5, #6, #7, #8, #9. Kích thước, màu, skeleton, Xem thêm, lỗi tải, thẻ chọn, làn bị từ chối, compact: đúng. |
| §7.1 Chọn | ✓ | |
| §7.2 Kéo | ✓ | `cdkDragStartDelay`, không handle, `#justDragged`, `blockedColumns` lúc `cdkDragStarted`, `sortingDisabled`. |
| §7.3 Menu | ✗ | #3 (mục bật nhưng không làm gì với cột chưa tải). |
| §7.4 Bàn phím | ✗ | #3 (b). Còn lại đúng, kể cả RTL và `instructions` theo `reorder`. |
| §7.5 Pipeline | ✗ | Thêm lý do bỏ qua ngoài spec (#3). `'cancel'`, chấp nhận, điều kiện huỷ theo `items`/generation: đúng. |
| §8 Trạng thái board | ✓ | `readonly`, `disabled` đúng; `dataSource` chỉ chặn board khi cột sai. Lưu ý #10. |
| §9 Template | ✓ | 4 directive, `ngTemplateContextGuard`, cảnh báo dev một lần. |
| §10 Token | ✓ | Không token mới. Lưu ý #12. |
| §11 Trợ năng, i18n | ✗ | #5. Key mới đủ 5 locale, chuỗi vi/en khớp bảng; `retry` thêm theo K4; `move-card` đã bỏ. |
| §12 E2E hooks | ✓ | Token `encodeURIComponent(id)`; thêm hook phụ (`data-compact`, `data-movable`, `data-origin`…), có ghi trong `sd-kanban.md`. |
| §13 Spec RED | N/A | Phần B. |
| §14 Showcase | ✓ | Đủ 4 ví dụ. P1: 400ms, 4 cột, pageSize 5, total, summary, Đã huỷ thu gọn, `droppable`, `reorder` tắt, drawer, hộp lý do → `'cancel'`, toast Hoàn tác gọi `move()`, công tắc lỗi Đang giao. Async có Cancel. |
| §15 Checkpoint | ✓ | Commit RED rồi code cho 6 checkpoint, có commit R1. |
| §16 Câu hỏi Bước 0 | ✓ | Đã trả lời, PD duyệt (K1–K10). |

- [✓] Không có input, output, method, key i18n ngoài spec (đối chiếu `index.ts` → `kanban.component.ts`, `kanban.model.ts`, `kanban.templates.ts`). Hook `data-*` phụ có tài liệu.
- [✓] Phạm vi "không làm" không bị làm.
- [✓] Không còn `getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`, `SdKanbanId`, `canMove`, `option.searchable/collapsible/filter`, input `model`/`loading`/`error`, output `sdChange`/`sdRetry` (trừ CHANGELOG, bảng chuyển đổi, test `[KAN-B-05]`).
- [N/A] Scheduler: không thuộc PR này.

### 3.2 Hợp đồng chung
| SC | Kết quả | Ghi chú |
| --- | --- | --- |
| 01 | ✗ | Items: đúng (`kanbanDataInvalid`). DataSource: #10. |
| 02 | ✓ | `{ ...card, columnId }` ở `kanbanApplyMove` và `applyMove`. |
| 03 | ✓ | Không sửa input; mảng và object mới. |
| 04 | ✓ | |
| 05 | ✓ | `SdKanbanState`. |
| 06 | ✓ | `movable` lúc render (`CardView.movable`) và trước `onMove`; `droppable` trước `onMove` (trừ cùng cột, PD R1). |
| 07 | ✓ | Không `option.move`: kéo tắt, không ⋯, phím không làm gì, `move()` false. |
| 08 | ✓ | Kéo, menu, `Alt` + phím, trước `onMove`. |
| 09 | ✓ | Đọc code `kanban.component.ts:435-450`: đổi dữ liệu rồi `sdMove`, đọc `moved`. Test `kanban-pipeline.spec.ts:269-312` đủ sync và Promise. |
| 10 | ✓ | `void` đi cùng nhánh chấp nhận. |
| 11 | ✗ | Dữ liệu, `sdMoveError('rejected')`, `rejected`, viền lỗi: đúng. Nút Bỏ qua không bấm được bằng chuột/chạm (#2). |
| 12 | ✓ | Nhánh riêng `:422-429`: bỏ pending, không `#fail`, không output, đọc `cancelled`, focus về thẻ. |
| 13 | ✓ | `catch` → `#fail('error', error)`; throw đồng bộ cũng vào `catch` (await trong try). |
| 14 | ✓ | `moveBlocked` gồm `pendingId`. |
| 15 | ✓ | `items`, `option`, `columns`, `locked`, generation cột nguồn/đích (reload, keyword, option), destroy. |
| 16 | ✓ | Không hiện nội dung lỗi. |
| 17 | ✓ | |
| 18 | ✓ | Showcase P1 gọi `move(id, { columnId: from.columnId }, 'api')`. |
| 19-21 | N/A | Kanban không có `create`. |
| 22 | ✓ | Không input `loading`, `error`. |
| 23 | ✓ | `load()` chỉ đổi `status`, giữ thẻ. |
| 24 | ✓ | Thử lại gọi đúng `failedCursor`; không phát khi bị huỷ. |
| 25 | ✓ | Cảnh báo một lần mỗi instance. |
| 26 | ✓ | Lưu ý #21. |
| 27 | ✓ | Lưu ý #11 (cần PD chốt lúc chưa tải). |
| 28 | ✓ | |
| 29 | ✓ | `#focusCard` tìm `[data-kanban-card-main]`. |
| 30 | ✓ | Listener `focusin`, `abandoned`. |
| 31 | ✓ | `#trackFocus` chỉ theo dõi khi focus đang ở thẻ hoặc nút menu. |
| 32 | ✓ | `typeof ResizeObserver`, < 600. |
| 33 | ✓ | Một vùng trong trạng thái thường. Lưu ý #14. |
| 34 | ✓ | Chỉ có transition của công cụ thẻ, đã tắt; icon `sync` đứng yên. |
| 35 | ✓ | Làn `CanvasText`; chọn, chờ, lỗi `Highlight`. |
| 36 | ✗ | 40px khi `pointer: coarse` đúng (K9). Bỏ qua không dùng được bằng chạm (#2). Lưu ý #13. |
| 37 | ✓ | 5 locale, `retry` riêng (K4). |
| 38 | ✓ | Gốc, cột, thẻ; chỉ khi có `autoId`. |
| 39 | ✓ | |
| 40 | ✓ | Standalone, OnPush, `input`/`model`/`output`, `@for` track id. |
| 41 | N/A | Kanban không xử lý ngày giờ (không `new Date`). |
| 42 | ✓ | Không thêm dependency; `mat-progress-spinner` là spinner Core đang dùng (button, tree). |
| 43 | ✓ | Không hex, `!important`, `::ng-deep`. Fallback: #12. |
| 44 | N/A | Không có slot thời gian. |
| 45 | ✓ | Có `why:` ở các quyết định không hiển nhiên. |

Bảng `onMove` SC-09…SC-13: kiểm bằng đọc `#move` (`kanban.component.ts:376-464`) và bảng test `kanban-pipeline.spec.ts:269-330` (năm kết quả × sync/Promise; dữ liệu, class lỗi, `sdMove`/`sdMoveError`, live region, `pendingId`; focus sau `Alt` + phím). Khớp bảng của SHARED-CONTRACT, trừ #2 (nút Bỏ qua của SC-11/13 không bấm được bằng con trỏ). Không viết harness (theo phạm vi phần A).

### 3.3 Test
N/A ở phần A (phần B chạy lệnh, coverage, thử phá).

### 3.4 Mã nguồn
- [✓] SC-40 → SC-45 (bảng trên; SC-43 fallback ở #12).
- [✓] Không `any` mới trong public API; không `as unknown as`.
- [✓] Dọn khi destroy: `ResizeObserver.disconnect`, `clearTimeout` keyword, `IntersectionObserver.disconnect`, `#loader.abort()`, `#cancel()` (abort move), `#releaseFocus` cho mọi listener `focusin`; `afterNextRender` kiểm `#destroyed`. Test destroy: `kanban.compact.spec.ts:68`, `[KAN-SC-15]`. Lưu ý #20 (observer khi đổi option).
- [✓] Effect không tạo vòng lặp: các ghi signal nằm trong `untracked`; effect SC-27 ghi `null` một lần. `computed` không gọi API (`movable` của consumer gọi lúc render theo SC-06).
- [✓] Không `setTimeout` chờ render; `setTimeout` duy nhất là debounce keyword (§5.2).
- [✓] SCSS: không `min-width` cố định trên host (`min-width: 0`); literal mới dùng token thang (`--sd-radius-*`, `--sd-font-size-*`). Fallback màu: #12.

### 3.5 Trợ năng và hình ảnh
- [N/A] Phần tay TESTING §8: phần A không chạy trình duyệt; tác giả còn "Chờ" phóng to 200% và trình đọc màn hình (#16).
- [✗] So ảnh với `Kanban Review.dc.html` mục 02–05:
  | Ảnh | Mục | Kết quả |
  | --- | --- | --- |
  | `board-light.png` | 02 | ✓ Làn trung tính, chấm, summary, số đếm, Xem thêm, làn Đã huỷ thu gọn 64px với "–". Làn co giãn `flex: 1 0 280px` như main. Ô tìm kiếm có vì ví dụ bật `searchable`. |
  | `orders-dragging.png` | 02, 03 "Đang kéo", 04 | ✗ Hoàn tất mờ .45, Đang giao có viền nhận, không khe, preview có bóng: đúng. Dấu chỗ cũ chỉ có tiêu đề (#8). |
  | `orders-light.png` | 02 | ✓ Thẻ đã dời ở đầu làn đích (§5.2), số đếm đổi. |
  | `card-default.png`, `card-hover.png`, `card-selected.png` | 03 | ✓ Viền, ⋯ khi hover, viền + vòng trong primary + nền 4%. |
  | `card-focus.png` | 03 | ✗ Không thấy vòng focus vì ảnh cắt theo khung thẻ (#17). |
  | `card-saving.png`, `card-failed.png` | 03 | ✓ Như main ("Đang lưu vị trí…", "Đóng"); ⋯ khoá khi đang lưu. |
  | "Không dời được" | 03 | ✓ Không có ảnh; tác giả giải thích nhìn như Mặc định, kiểm bằng `[KAN-C-15]`. Chấp nhận. |
  | `tasks-dragging-slot.png` | 04 `reorder: true` | ✓ Khe nét đứt cao bằng thẻ. |
  | `load-first-page.png` | 05 | ✓ 3 khối 74px, số "–". |
  | `load-more-loading.png` | 05 | ✓ Spinner 14px + "Đang tải…". |
  | `orders-column-error.png`, `load-error-next-page.png` | 05 | ✓ Icon, chữ, Thử lại viền lỗi; trang sau thay nút. Lưu ý #18 (summary cũ). |
  | `load-empty.png` | 05 "Trống" | ✗ Có keyword mà hiện "Chưa có thẻ" (#7). |
- [✗] Light, dark, RTL, forced-colors, reduced motion trên màn chính: `orders-light/dark/rtl/forced-colors/400.png` có đủ. Dark, forced colors (làn `CanvasText`, thẻ chọn `Highlight`), compact 400px: ✓. RTL: summary lệch hàng (#6). Lệch có chủ đích tác giả ghi (chữ trên thẻ là dữ liệu showcase; ⋯ ẩn tới khi hover như main): chấp nhận.

### 3.6 Tài liệu
- [✗] `sd-kanban.md` (tiếng Anh): đủ API, ví dụ `items` và `dataSource`, bảng `onMove` có `'cancel'`, bàn phím, giới hạn, bảng chuyển đổi, ghi chú `items` tham chiếu ổn định (R1 mục 10), `beforeId: null` (PD R1). Sai: context cột `total` "`null` while unknown" không đúng với mã (#1); kiểu `ariaLabel`/`autoId` (#19); chưa nói việc dời vào cột chưa tải (#3).
- [✓] `CHANGELOG.md` `## [Unreleased]`: "Before upgrading" có kanban, Highlights, `### Changed (BREAKING for consumers)` › `#### Kanban` có migration diff và tên `portal-template` (K6), `### Added` › `#### Kanban`. Lưu ý #19 (`pendingId`), và dòng context cột sai theo #1.
- [✓] `THEME.md`: không đổi token; thêm một câu mô tả (khe nét đứt chỉ khi `reorder`, thẻ chọn và Xem thêm dùng `color-mix`). Chấp nhận.
- [✓] `documentation.registry.ts` (mô tả, `demoSectionCount: 4`) và guard `documentation.registry.spec.ts` (513, kanban 4) đã cập nhật; file sinh (`example-*`, `changelog.generated.ts`) có trong diff. Chạy guard: phần B.
- [✓] i18n đủ 5 locale cho mọi key `core.component.kanban.*` mới.
- [✓] `check:sync` xanh; v20/v21/v22 chỉ khác v19 theo sync (shim v22, CRLF); không đổi `published-*`, `dist`.
