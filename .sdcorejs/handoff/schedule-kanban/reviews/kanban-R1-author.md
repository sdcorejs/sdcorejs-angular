# kanban · R1 · phản hồi của tác giả
Review: `kanban-R1.md` ở `4e27670b` (Chặn 0 · Nên sửa 6 · Ghi chú 12). Test RED ở `4ce022df`, sửa ở commit kế tiếp.

## PD chốt ngày 10/11/2026
| Mục | Câu hỏi | Quyết định |
| --- | --- | --- |
| 2 | Dời trong cùng một cột có gọi `droppable({ from: X, to: X })` không | Không: `droppable` chỉ áp cho việc đổi cột; trong cột chỉ cần `movable`. |
| 7 | `beforeId: null` khi cột đích còn trang chưa tải | Sau thẻ cuối đã tải; server quyết vị trí thật (thường là cuối cột). Ghi ở JSDoc của `SdKanbanMoveRequest.to`, sẽ ghi ở `sd-kanban.md`. |
| 8 | `pendingId` | Giữ public, chỉ đọc (`asReadonly()`). |

## Nên sửa
| # | Sửa | Test |
| --- | --- | --- |
| 1 | `cards` là `linkedSignal` theo `items`: mọi lần `items` đổi tham chiếu (cả A → B → A) đều thay bản sao. | `[KAN-B-01]` |
| 2 | `#move` bỏ qua `droppable` khi cột đích là cột nguồn (PD). | `[KAN-B-02]` |
| 3 | Chiều cao dấu chỗ cũ đo ở `pointerdown` trên thẻ, trước khi CDK đưa thẻ ra `body`. | `[KAN-B-03]` |
| 4 | Hai spec đọc bảng qua DOM (`data-column-id`, `data-card-id`), không đọc signal protected. SC-02 kiểm qua `request.card` của lần dời sau. | Các spec hiện có |
| 5 | Thêm `[KAN-SC-02]`, `[KAN-SC-03]` (freeze sâu `items` và `columns`) ở spec component; `[KAN-C-11]` kiểm không có khe (`.sd-kanban__no-slot` có `display: none`). | `[KAN-SC-02]`, `[KAN-SC-03]`, `[KAN-C-11]` |
| 6 | `canMove` đổi thành `isMovable`. | `[KAN-B-05]` |

Thêm theo PD mục 8: `pendingId` chỉ đọc, `[KAN-B-04]`.

## Ghi chú đã xử lý
| # | Xử lý |
| --- | --- |
| 12 | Tên test của năm câu trả lời `onMove` ghi mã đầy đủ (`'KAN-SC-10'`…), grep tìm được. |
| 13 | Thêm ca thẻ không có (`kanbanStepTarget`, `kanbanApplyMove`) và `searchText` không phải chuỗi. Coverage `kanban.utils.ts` 100% dòng, 100% nhánh. |
| 14 | Alt + ↑ ↓ khi `reorder` tắt không còn `preventDefault`, phím để lại cho trang. |

## Ghi chú để checkpoint sau
| # | Khi nào |
| --- | --- |
| 9 | Checkpoint 4: gom phần khác nhau giữa `items` và `dataSource` (dữ liệu không hợp lệ, `#current`/effect, nhánh chấp nhận, `total`, `MoveOperation.items`) vào một chỗ thay vì rải `if` trong `#move`. |
| 10 | Checkpoint 6: `sd-kanban.md` ghi `items` phải là tham chiếu ổn định (mỗi tham chiếu mới thay bản sao và huỷ thao tác chờ). |
| 11 | Ghi nhận: commit RED của checkpoint 1 liệt kê cả các test không thể đỏ (type contract, KAN-R-09 về hình ảnh); từ checkpoint 3 chỉ liệt kê mã đỏ thật. |
| 15 | Checkpoint 4: dòng `summary` dưới nhãn cột (§6), cả ở chế độ `items` (`column.summary`). |
| 16 | Checkpoint 3: test kéo bằng chuỗi sự kiện chuột/cảm ứng thật (`mouseDrag`, `touchDrag`) khi kéo bằng cả thẻ; giữ test phát `started`/`dropped` cho phần logic. |
| 17 | Giữ: các test focus của main ở spec component vẫn đúng ý nghĩa SC-29…31. |
| 18 | Giữ: id chỉ có khoảng trắng coi là rỗng (SC-01). |
