# kanban · R2 · phản hồi của tác giả
Nhánh `feat/kanban-api`. Review ở `56611d76`: phần A [`kanban-R2-spec.md`](kanban-R2-spec.md) (2 Chặn, 8 Nên sửa, 12 Ghi chú), phần B [`kanban-R2-tests.md`](kanban-R2-tests.md) (1 Chặn, 4 Nên sửa, 7 Ghi chú). Chặn #1 của hai phần là cùng một lỗi.

Commit:
- `24a00332` `test(kanban): regressions for the R2 findings (RED)`: 15 test đỏ đúng lý do, 5 test xanh ngay vì chỉ là test còn thiếu.
- `871a4642` `fix(kanban): R2 findings [KAN-B-08]…[KAN-B-22]`, sync v20/v21/v22.
- Commit kế tiếp: E2E, ảnh, báo cáo.

Mọi test mới nằm trong `components/kanban/src/kanban.review.spec.ts`.

## Chặn
| Mục | Xử lý | Test |
| --- | --- | --- |
| A-1 = B-1: context của `sdKanbanColumnTemplate` / `sdKanbanColumnActionsTemplate` | `ColumnView.total` mới: `items` là số thẻ của cột, `dataSource` là `total` của server, `null` khi chưa biết (đang tải lần đầu, server không trả, lỗi trang đầu). Context dùng `view.total` và `view.summary` (summary của trang đầu ghi đè `column.summary`). | `[KAN-B-08]`: template cột thật, hai chế độ, trước và sau khi tải, khi lỗi |
| A-2: lớp phủ nút tên che nút Đóng của thẻ thất bại | `.sd-kanban__card-status { position: relative; z-index: 1 }` | `[KAN-B-13]`: `elementFromPoint` ở tâm nút Đóng trả đúng nút |

## Nên sửa
| Mục | Xử lý | Test |
| --- | --- | --- |
| A-3: dời vào cột chưa tải bị bỏ qua im lặng | Theo đề xuất thứ nhất của reviewer: ở `dataSource`, cột chưa có trang đầu (thu gọn chưa mở, đang tải, lỗi trang đầu) chưa là đích. `canDrop` trả `false` cho cột đó, nên mục menu bị khoá, `Alt` + `←` `→` bỏ qua, kéo thì làn mờ (`data-blocked`, đọc "Không chuyển sang … được"); `#move` vẫn từ chối. Ghi trong `sd-kanban.md` và CHANGELOG. **PD có thể chọn cách khác** (cho dời rồi tải cột đích). | `[KAN-B-12]` (hai test: menu với cột thu gọn chưa tải; `Alt` + `→` bỏ cột lỗi, kéo làm mờ, `move()` false khi đích lỗi hoặc đang tải lại) |
| A-4: `loadMore: 'auto'` với id cột cần mã hoá | Callback của `IntersectionObserver` tìm cột theo token | `[KAN-B-14]` (cột `'đã huỷ'`) |
| A-5: tên đọc của số đếm | `aria-label` chỉ khi biết `total`; "–" và "n+" đọc như chữ hiện | `[KAN-B-15]` |
| A-6: summary lệch hàng ở RTL | `.sd-kanban__heading { text-align: start }` | `[KAN-B-16]`; ảnh `orders-rtl.png` chụp lại |
| A-7: cột trống khi có keyword ở `dataSource` | `no-results` khi `keyword` khác rỗng | `[KAN-B-17]` |
| A-8: dấu chỗ cũ chỉ có tiêu đề | Vẽ nội dung thẻ (template thẻ hoặc tiêu đề) trong khối mờ .4, có `inert` | `[KAN-B-18]`; ảnh `orders-dragging.png` chụp lại |
| A-9: `grabbing` không bao giờ hiện | Board có `data-dragging` khi đang kéo: `cursor: grabbing` trên board và thẻ; làn bị từ chối `not-allowed` (cả thẻ trong làn) | `[KAN-B-19]` |
| A-10: id rỗng hoặc không phải chuỗi ở loader | `typeof id === 'string' && id.trim()` như `items` | `[KAN-B-20]` |
| B-2: không có test destroy cho bốn việc dọn | Code đã dọn đủ; thêm test | `[KAN-B-09]`: `signal` của `onLoad` bị huỷ, timer keyword không chạy, mọi `IntersectionObserver` bị `disconnect`, `removeEventListener('focusin', …, true)` |
| B-3: `applyMove` của loader (trước thẻ đầu, cùng cột) | Code đúng; thêm test | `[KAN-B-10]` |
| B-4: cờ `movable`/`droppable` dạng boolean | Code đúng; thêm test | `[KAN-B-11]` |
| B-5: `move()` bị chặn khi cột đang tải | Gộp vào A-3 | `[KAN-B-12]` |

## Ghi chú
| Mục | Xử lý |
| --- | --- |
| A-11 (cần PD chốt): `selectedId` bị xoá trước khi dữ liệu về | Đã sửa theo hướng an toàn: chỉ kiểm khi dữ liệu đã có (`items` khác `undefined`, hoặc mọi cột đang mở đã có trang đầu hoặc lỗi trang đầu). Test `[KAN-B-22]` (hai chế độ). PD có thể đổi. |
| A-12 (cần PD chốt): SC-43 fallback cho màu lõi | Không đổi: theo quy ước trên main (màu lõi không fallback). Chờ PD. |
| A-13: hover "Xem thêm" ngoài `@media (hover: hover)` | Đã bọc. |
| A-14 (cần PD chốt): vùng live thứ hai của `sd-data-state` (không có cột, dữ liệu sai) | Không đổi: §8 giữ như main. Chờ PD. |
| A-15 = B-7 (cần PD chốt): hiệu năng §10 | Không đổi; số đo và đề xuất ở `reports/kanban-tests.md`. |
| A-16: phóng to 200%, trình đọc màn hình | Vẫn chờ (không có trình đọc màn hình trên máy này). |
| A-17: ảnh `card-focus.png` cắt vòng focus | Ảnh trạng thái thẻ chụp có lề 8px (`shotAround`). |
| A-18: summary cũ còn khi trang đầu lỗi | Đã sửa, `[KAN-B-21]`. |
| A-19: `pendingId` chỉ đọc chưa vào BREAKING; kiểu `ariaLabel`/`autoId` trong docs | Thêm dòng vào Changed (BREAKING); sửa kiểu thành `string \| null \| undefined`. |
| A-20 = B-12: observer khi `loadMore` rời `'auto'` | `disconnect()` và xoá danh sách theo dõi; `[KAN-B-09]` (test thứ hai). |
| A-21: Space ngoài Chromium | Không có Firefox/WebKit trong cấu hình Playwright; giữ ghi chú. |
| A-22: `MoveTarget` không export | Giữ (spec viết kiểu inline). |
| B-6: `Alt` + `↑` `↓` khi `reorder` tắt không `preventDefault` | Thêm test `[KAN-C-11]` (`defaultPrevented` false; `Alt` + `→` vẫn true). |
| B-8: test type chưa có mã | `[KAN-T-01] [KAN-SC-12]`, `[KAN-T-02] [KAN-SC-04] [KAN-SC-05]`, `[KAN-T-03]`. |
| B-9: E-07 dùng `.focus()`; mã của test ảnh và hiệu năng | E-07 đi bằng `Tab` từ ô tìm kiếm tới thẻ đầu, Enter, focus giữ trên thẻ, `Alt` + `→`. Test ảnh và hiệu năng giữ mã E-01 / E-09 và ghi mục TESTING (§9, §10) trong tên; đổi mã cần PD. |
| B-10: C-19 chưa kiểm thẻ thất bại | Thêm test `[KAN-C-19]`: thẻ đang chọn bị từ chối giữ `data-selected`, không `data-pending`, có class lỗi. |
| B-11: 2 lỗi console 404 | E2E giờ ghi URL: `GET /docs/versions.json` 404. Đó là registry docs của showcase: trên Pages nó đến từ `published-docs/`, dev server không phục vụ. Không thuộc kanban. |

## R2' (kiểm lại)
Báo cáo: [`kanban-R2-recheck.md`](kanban-R2-recheck.md) ở `c5d405f0`: Chặn 0 · Nên sửa 2 · Ghi chú 3, "Được mở PR". Thử phá 26 đột biến: 25 làm đỏ đúng test B.

Commit:
- `e32ac369` `test(kanban): regressions for the R2' findings (RED)`: KAN-B-23 đỏ đúng lý do (menu, kéo, `Alt` + `→` còn bật), KAN-B-24 xanh ngay (chỉ thiếu test).
- Commit kế tiếp: sửa, sync v20/v21/v22, docs, CHANGELOG.

| Mục | Xử lý | Test |
| --- | --- | --- |
| #1 Nên sửa: cột nguồn đang tải lại trang đầu vẫn để kéo, menu, phím bật rồi `#move` từ chối im lặng | Cùng hướng A-3: ở `dataSource`, thẻ của cột chưa sẵn sàng (`loaded` và không `loading`) có `movable` false trong `CardView`. Kéo tắt (`cdkDragDisabled`), nút ⋯ khoá, không `data-movable`, `Alt` + phím để cho trang. Thẻ vẫn hiện (SC-23). Khi trang đầu về, thẻ dời lại được. `sd-kanban.md` và CHANGELOG ghi thêm. | `[KAN-B-23]` |
| #2 Nên sửa: thẻ trong làn bị từ chối không có test con trỏ `not-allowed` | Code đúng; thêm test | `[KAN-B-24]`: thẻ `d` và nút tên của nó `not-allowed`, thẻ ở làn nhận vẫn `grabbing` |
| #3 Ghi chú: `data-dragging` thiếu trong bảng E2E hooks | Thêm vào dòng "While dragging" của `sd-kanban.md` | |
| #4 Ghi chú: `no-results` đọc `keyword` ngay, trong 300 ms debounce | Giữ: chữ theo ô tìm kiếm người dùng đang thấy; cột trống lúc đó sẽ được tải lại ngay sau đó. | |
| #5 Ghi chú: `as unknown as` trong test | Giữ (chỉ trong test). | |

Ngoài review: CI của PR calendar #141 đỏ ở "Angular compatibility (v22)": `FakeIntersectionObserver` (`testing/schedule-testing.ts`, kanban chép từ calendar theo K10) thiếu `scrollMargin` mà DOM lib của TypeScript 6 trong dòng Angular 22 bắt buộc. Thêm `readonly scrollMargin = '0px'` ở v19 rồi sync; kiểm bằng `tsc` của v22 (6.0.3) và Karma v19. Cùng bản vá đẩy lên `feat/calendar`.

Kết quả ở `f3f8b595`: Karma v19 đầy đủ 9248/9248 (seed 759849), lệnh nhanh kanban 165/165, `npm run lint` và `check:sync` xanh, E2E kanban 25 passed / 1 skipped có chủ đích. Coverage `kanban.component.ts` 98.05% / 94.40%.
